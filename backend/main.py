

import os

import re

import json

import time

import hmac

import base64

import hashlib

import secrets

from datetime import datetime, timezone

from typing import Literal

from fastapi import FastAPI, HTTPException, Depends

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field, field_validator

from sqlalchemy import (

    Column,

    Integer,

    String,

    ForeignKey,

    UniqueConstraint,

)

from sqlalchemy.orm import Session

from groq import Groq

from ai_service import analyze_incident, critique_incident

from database import engine

from models import (

    Base,

    IncidentDB,

    IncidentActivity,

    SessionIncidentReview,

)

from embedding_service import create_embedding

from rag_service import search_similar_incidents

# --------------------------------------------------
# APP AND DATABASE
# --------------------------------------------------
app = FastAPI(title="AI Incident Intelligence API")

@app.get("/health-check")
def health_check():
    return {"status": "ok"}

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

class SessionIncidentStatus(Base):

    __tablename__ = "session_incident_status"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(String(64), nullable=False, index=True)

    incident_id = Column(

        Integer,

        ForeignKey("incidents.id", ondelete="CASCADE"),

        nullable=False,

    )

    status = Column(String(30), nullable=False, default="Open")

    __table_args__ = (

        UniqueConstraint(

            "session_id",

            "incident_id",

            name="uq_session_incident_status",

        ),

    )

Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# DEMO SESSION AUTHENTICATION
# --------------------------------------------------
AUTH_SECRET = os.getenv("INCIDENT_AUTH_SECRET")

if not AUTH_SECRET and os.getenv("ENVIRONMENT") == "production":

    raise RuntimeError("Set INCIDENT_AUTH_SECRET in production.")

AUTH_SECRET = (

    AUTH_SECRET or "local-development-secret-change-before-deployment"

).encode("utf-8")

TOKEN_LIFETIME = 12 * 60 * 60

bearer_scheme = HTTPBearer(auto_error=False)

def encode_token(session_id: str) -> str:

    payload = {

        "sid": session_id,

        "exp": int(time.time()) + TOKEN_LIFETIME,

    }

    body = base64.urlsafe_b64encode(

        json.dumps(payload, separators=(",", ":")).encode()

    ).decode().rstrip("=")

    signature = hmac.new(

        AUTH_SECRET, body.encode(), hashlib.sha256

    ).digest()

    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{body}.{signed}"

def verify_token(token: str):

    try:

        body, supplied_signature = token.split(".", 1)

        expected_signature = base64.urlsafe_b64encode(

            hmac.new(

                AUTH_SECRET, body.encode(), hashlib.sha256

            ).digest()

        ).decode().rstrip("=")

        if not hmac.compare_digest(

            supplied_signature, expected_signature

        ):

            return None

        padded = body + "=" * (-len(body) % 4)

        payload = json.loads(base64.urlsafe_b64decode(padded))

        if int(payload.get("exp", 0)) <= time.time():

            return None

        session_id = payload.get("sid")

        if not isinstance(session_id, str) or not session_id:

            return None

        return session_id

    except (ValueError, TypeError, KeyError, json.JSONDecodeError):

        return None

def require_demo_session(

    credentials: HTTPAuthorizationCredentials | None = Depends(

        bearer_scheme

    ),

):

    if credentials is None or credentials.scheme.lower() != "bearer":

        raise HTTPException(

            status_code=401,

            detail="Start a demo session to continue.",

        )

    session_id = verify_token(credentials.credentials)

    if not session_id:

        raise HTTPException(

            status_code=401,

            detail="Your demo session expired. Please sign in again.",

        )

    return session_id

# --------------------------------------------------
# AI CONFIGURATION FOR INCIDENT CHAT
# --------------------------------------------------
groq_api_key = os.getenv("GROQ_API_KEY")

groq_model_name = os.getenv("GROQ_MODEL")

chat_client = Groq(api_key=groq_api_key) if groq_api_key else None

# Demo-only in-memory chat history.
chat_histories = {}

MAX_CHAT_MESSAGES = 20

# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------
class IncidentRequest(BaseModel):

    title: str = Field(min_length=1, max_length=150)

    description: str = Field(min_length=1, max_length=5000)

    @field_validator("title", "description")

    @classmethod

    def reject_blank_text(cls, value: str) -> str:

        value = value.strip()

        if not value:

            raise ValueError("This field cannot be blank.")

        return value

    @field_validator("title")

    @classmethod

    def validate_title(cls, value: str) -> str:

        if not re.search(r"[a-zA-Z0-9]", value):

            raise ValueError("Title must contain a letter or number.")

        return value

class StatusUpdate(BaseModel):

    status: Literal["Open", "Investigating", "Resolved"]

class ActivityNote(BaseModel):

    message: str = Field(min_length=1, max_length=2000)

    event_type: Literal["note_added", "resolution_added"] = "note_added"

    @field_validator("message")

    @classmethod

    def validate_message(cls, value: str) -> str:

        value = value.strip()

        if not value:

            raise ValueError("Message cannot be blank.")

        return value

class ReviewRequest(BaseModel):

    decision: Literal["approve", "request_rework"]

    feedback: str | None = Field(default=None, max_length=2000)

    revised_root_cause: str | None = Field(default=None, max_length=5000)

    @field_validator("feedback", "revised_root_cause")

    @classmethod

    def clean_optional_text(cls, value: str | None) -> str | None:

        if value is None:

            return None

        value = value.strip()

        return value or None

class IncidentChatRequest(BaseModel):

    question: str = Field(min_length=1, max_length=2000)

    @field_validator("question")

    @classmethod

    def clean_question(cls, value: str) -> str:

        value = value.strip()

        if not value:

            raise ValueError("Question cannot be blank.")

        return value

# --------------------------------------------------
# COMMON HELPERS
# --------------------------------------------------
def now_utc():

    return datetime.now(timezone.utc)

def format_created_at(value):

    if value is None:

        return None

    if value.tzinfo is None:

        value = value.replace(tzinfo=timezone.utc)

    return value.isoformat()

def get_incident_or_404(db: Session, incident_id: int):

    """General lookup. Use the session-scoped helper in protected endpoints."""

    incident = (

        db.query(IncidentDB)

        .filter(IncidentDB.id == incident_id)

        .first()

    )

    if not incident:

        raise HTTPException(

            status_code=404,

            detail="Incident not found.",

        )

    return incident

def get_session_incident_or_404(

    db: Session,

    incident_id: int,

    session_id: str,

):

    """Only allow a session to access incidents it created."""

    incident = (

        db.query(IncidentDB)

        .filter(

            IncidentDB.id == incident_id,

            IncidentDB.session_id == session_id,

            IncidentDB.created_by == session_id,

        )

        .first()

    )

    if not incident:

        raise HTTPException(

            status_code=404,

            detail="Incident not found.",

        )

    return incident

def get_incident_status(db: Session, incident_id: int, session_id: str):

    row = (

        db.query(SessionIncidentStatus)

        .filter(

            SessionIncidentStatus.session_id == session_id,

            SessionIncidentStatus.incident_id == incident_id,

        )

        .first()

    )

    if row:

        return row.status

    incident = get_incident_or_404(db, incident_id)

    return incident.status or "Open"

def ensure_session_status(

    db: Session,

    incident_id: int,

    session_id: str,

    default_status: str = "Open",

):

    row = (

        db.query(SessionIncidentStatus)

        .filter(

            SessionIncidentStatus.session_id == session_id,

            SessionIncidentStatus.incident_id == incident_id,

        )

        .first()

    )

    if row:

        return row

    row = SessionIncidentStatus(

        session_id=session_id,

        incident_id=incident_id,

        status=default_status,

    )

    db.add(row)

    db.flush()

    return row

def add_activity(

    db: Session,

    incident_id: int,

    event_type: str,

    message: str,

    session_id: str | None = None,

    old_status: str | None = None,

    new_status: str | None = None,

):

    activity = IncidentActivity(

        incident_id=incident_id,

        session_id=session_id,

        actor_user_id=None,

        actor="Demo User",

        event_type=event_type,

        message=message,

        old_status=old_status,

        new_status=new_status,

    )

    db.add(activity)

    return activity

def incident_summary(incident: IncidentDB, status: str | None = None):

    return {

        "id": incident.id,

        "title": incident.title,

        "description": incident.description,

        "service": incident.service,

        "severity": incident.severity,

        "category": incident.category,

        "summary": incident.summary,

        "possible_root_cause": incident.possible_root_cause,

        "recommended_action": incident.recommended_action,

        "confidence": incident.confidence,

        "status": status if status is not None else incident.status,

        "ai_analysis_status": incident.ai_analysis_status,

        "created_at": format_created_at(incident.created_at),

    }

def similar_incidents_response(items):

    return [

        {

            "id": item["incident"].id,

            "title": item["incident"].title,

            "service": item["incident"].service,

            "severity": item["incident"].severity,

            "category": item["incident"].category,

            "similarity": item["similarity"],

        }

        for item in items

    ]

def activity_response(activity: IncidentActivity):

    return {

        "id": activity.id,

        "event_type": activity.event_type,

        "message": activity.message,

        "old_status": activity.old_status,

        "new_status": activity.new_status,

        "actor": activity.actor,

        "created_at": format_created_at(activity.created_at),

    }

def get_similar_incidents(text: str, top_k: int = 3):

    # Shared historical records are reference data, not workspace incidents.
    return search_similar_incidents(

        text,

        top_k=top_k,

        session_id=None,

    )

def get_resolution(db: Session, incident_id: int, session_id: str):

    return (

        db.query(IncidentActivity)

        .filter(

            IncidentActivity.incident_id == incident_id,

            IncidentActivity.session_id == session_id,

            IncidentActivity.event_type == "resolution_added",

        )

        .order_by(

            IncidentActivity.created_at.desc(),

            IncidentActivity.id.desc(),

        )

        .first()

    )

def get_review(db: Session, incident_id: int, session_id: str):

    return (

        db.query(SessionIncidentReview)

        .filter(

            SessionIncidentReview.incident_id == incident_id,

            SessionIncidentReview.session_id == session_id,

        )

        .first()

    )

def review_response(review, incident):

    revised_analysis = None

    if review is not None and review.revised_summary:

        revised_analysis = {

            "summary": review.revised_summary,

            "possible_root_cause": review.revised_root_cause,

            "recommended_action": review.revised_recommended_action,

            "severity": review.revised_severity,

            "category": review.revised_category,

            "service": review.revised_service,

            "confidence": review.revised_confidence,

        }

    if review is None:

        return {

            "incident_id": incident.id,

            "review_status": "pending",

            "proposed_root_cause": incident.possible_root_cause,

            "revised_root_cause": None,

            "revised_analysis": None,

            "feedback": None,

            "final_report": None,
            "critic_verdict": None,
            "critic_reasoning": None,

            "reviewed_at": None,

        }

    return {

        "incident_id": incident.id,

        "review_status": review.review_status,

        "proposed_root_cause": incident.possible_root_cause,

        "revised_root_cause": review.revised_root_cause,

        "revised_analysis": revised_analysis,

        "feedback": review.feedback,

        "final_report": (

            review.final_report

            if review.review_status == "approved"

            else None

        ),
        "critic_verdict": review.critic_verdict,
        "critic_reasoning": review.critic_reasoning,

        "reviewed_at": format_created_at(review.reviewed_at),

    }

def current_session_analysis(review, incident):

    """Return the best available analysis for this reviewer's session."""

    if review and review.revised_summary:

        return {

            "summary": review.revised_summary,

            "possible_root_cause": review.revised_root_cause,

            "recommended_action": review.revised_recommended_action,

            "severity": review.revised_severity or incident.severity,

            "category": review.revised_category or incident.category,

            "service": review.revised_service or incident.service,

            "confidence": review.revised_confidence,

        }

    return {

        "summary": incident.summary,

        "possible_root_cause": incident.possible_root_cause,

        "recommended_action": incident.recommended_action,

        "severity": incident.severity,

        "category": incident.category,

        "service": incident.service,

        "confidence": incident.confidence,

    }

def format_analysis_snapshot(analysis: dict) -> str:

    return analysis.get("summary") or "No previous AI summary available."

# --------------------------------------------------
# BASIC ENDPOINTS
# --------------------------------------------------
@app.get("/")

def home():

    return {"message": "AI Incident Intelligence API is running"}

@app.post("/demo/session")

def create_demo_session():

    session_id = secrets.token_urlsafe(32)

    return {

        "access_token": encode_token(session_id),

        "token_type": "bearer",

        "expires_in": TOKEN_LIFETIME,

    }

@app.get("/me")

def get_me(session_id: str = Depends(require_demo_session)):

    return {

        "kind": "demo",

        "session_id": session_id,

        "team": None,

    }

# --------------------------------------------------
# CREATE INCIDENT
# --------------------------------------------------
@app.post("/incidents")

def create_incident(

    request: IncidentRequest,

    session_id: str = Depends(require_demo_session),

):

    incident_text = f"{request.title}. {request.description}"

    try:

        similar = get_similar_incidents(incident_text, top_k=3)

    except Exception as exc:

        print(f"Similar-incident search failed: {exc}")

        similar = []

    try:

        embedding = create_embedding(incident_text)

    except Exception as exc:

        print(f"Embedding creation failed: {exc}")

        embedding = None

    try:

        ai = analyze_incident(

            request.title,

            request.description,

            similar,

        )

    except Exception as exc:

        print(f"Incident AI analysis failed: {exc}")

        ai = None

    ai_status = "Completed" if ai else "Unavailable"

    critic = None
    if ai:
        try:
            critic = critique_incident(
                title=request.title,
                description=request.description,
                analysis=ai,
                similar_incidents=similar,
            )
        except Exception as exc:
            print(f"Incident AI critic failed: {exc}")
            critic = None

    if not ai:

        ai = {

            "service": "Unknown",

            "severity": "Medium",

            "category": "Unclassified",

            "summary": "AI analysis is currently unavailable.",

            "possible_root_cause": None,

            "recommended_action": (

                "Retry AI analysis when the service is available."

            ),

            "confidence": None,

        }

    with Session(bind=engine) as db:

        incident = IncidentDB(

            session_id=session_id,

            team_id=None,

            created_by=session_id,

            title=request.title,

            description=request.description,

            service=ai.get("service") or "Unknown",

            severity=ai.get("severity") or "Medium",

            category=ai.get("category") or "Unclassified",

            summary=ai.get("summary"),

            possible_root_cause=ai.get("possible_root_cause"),

            recommended_action=ai.get("recommended_action"),

            confidence=ai.get("confidence"),

            embedding=embedding,

            status="Open",

            ai_analysis_status=ai_status,

        )

        db.add(incident)

        db.flush()

        ensure_session_status(db, incident.id, session_id, "Open")

        review = SessionIncidentReview(
            session_id=session_id,
            incident_id=incident.id,
            review_status="pending",
            critic_verdict=critic.get("verdict") if critic else None,
            critic_reasoning=critic.get("reasoning") if critic else None,
        )
        db.add(review)

        add_activity(

            db,

            incident.id,

            "created",

            (

                "Incident created and AI analysis completed."

                if ai_status == "Completed"

                else "Incident created. AI analysis is unavailable."

            ),

            session_id=session_id,

            new_status="Open",

        )

        db.commit()

        db.refresh(incident)

        response = incident_summary(incident, status="Open")

        response["similar_incidents"] = similar_incidents_response(similar)
        response["root_cause_review"] = review_response(review, incident)

        return {

            "message": (

                "Incident created and analyzed successfully."

                if ai_status == "Completed"

                else "Incident created, but AI analysis is unavailable."

            ),

            "incident": response,

        }

# --------------------------------------------------
# LIST CURRENT SESSION'S INCIDENTS
# --------------------------------------------------
@app.get("/incidents")

def get_incidents(

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        incidents = (

            db.query(IncidentDB)

            .filter(

                IncidentDB.session_id == session_id,

                IncidentDB.created_by == session_id,

            )

            .order_by(IncidentDB.id.desc())

            .all()

        )

        results = []

        for incident in incidents:

            status = get_incident_status(

                db, incident.id, session_id

            )

            results.append(

                incident_summary(incident, status=status)

            )

        return results

# --------------------------------------------------
# INCIDENT DETAILS
# --------------------------------------------------
@app.get("/incidents/{incident_id}")

def get_incident(

    incident_id: int,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        incident = get_session_incident_or_404(

            db, incident_id, session_id

        )

        try:

            similar = get_similar_incidents(

                f"{incident.title}. {incident.description}",

                top_k=10,

            )

            similar = [

                item for item in similar

                if item["incident"].id != incident.id

            ][:3]

        except Exception as exc:

            print(f"Similar-incident lookup failed: {exc}")

            similar = []

        status = get_incident_status(

            db, incident_id, session_id

        )

        response = incident_summary(incident, status=status)

        response["similar_incidents"] = similar_incidents_response(similar)

        resolution = get_resolution(db, incident_id, session_id)

        response["resolution_details"] = (

            resolution.message if resolution else None

        )

        response["resolved_at"] = (

            format_created_at(resolution.created_at)

            if resolution else None

        )

        review = get_review(db, incident_id, session_id)

        response["root_cause_review"] = review_response(review, incident)

        return response

# --------------------------------------------------
# UPDATE SESSION-SPECIFIC STATUS
# --------------------------------------------------
@app.patch("/incidents/{incident_id}/status")

def update_incident_status(

    incident_id: int,

    update: StatusUpdate,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        incident = get_session_incident_or_404(

            db, incident_id, session_id

        )

        old_status = get_incident_status(

            db, incident_id, session_id

        )

        if update.status == "Resolved":

            resolution = get_resolution(

                db, incident_id, session_id

            )

            if resolution is None or not resolution.message.strip():

                raise HTTPException(

                    status_code=400,

                    detail=(

                        "Save resolution details before marking this "

                        "incident Resolved."

                    ),

                )

        status_row = ensure_session_status(

            db, incident_id, session_id, old_status

        )

        status_row.status = update.status

        if old_status != update.status:

            add_activity(

                db,

                incident_id,

                "status_changed",

                f"Status changed from {old_status} to {update.status}.",

                session_id=session_id,

                old_status=old_status,

                new_status=update.status,

            )

        db.commit()

        return {

            "message": "Incident status updated successfully.",

            "id": incident.id,

            "status": update.status,

        }

# --------------------------------------------------
# INCIDENT ACTIVITY TIMELINE
# --------------------------------------------------
@app.get("/incidents/{incident_id}/activity")

def get_incident_activity(

    incident_id: int,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        get_session_incident_or_404(

            db, incident_id, session_id

        )

        activities = (

            db.query(IncidentActivity)

            .filter(

                IncidentActivity.incident_id == incident_id,

                IncidentActivity.session_id == session_id,

            )

            .order_by(

                IncidentActivity.created_at.asc(),

                IncidentActivity.id.asc(),

            )

            .all()

        )

        return [activity_response(item) for item in activities]

# --------------------------------------------------
# ADD INVESTIGATION NOTE OR RESOLUTION
# --------------------------------------------------
@app.post("/incidents/{incident_id}/activity")

def add_incident_activity(

    incident_id: int,

    note: ActivityNote,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        get_session_incident_or_404(

            db, incident_id, session_id

        )

        current_status = get_incident_status(

            db, incident_id, session_id

        )

        if (

            note.event_type == "resolution_added"

            and current_status == "Resolved"

        ):

            raise HTTPException(

                status_code=400,

                detail=(

                    "Reopen the incident before changing its resolution "

                    "details."

                ),

            )

        activity = add_activity(

            db,

            incident_id,

            note.event_type,

            note.message,

            session_id=session_id,

        )

        db.commit()

        db.refresh(activity)

        return {

            "message": (

                "Investigation note added successfully."

                if note.event_type == "note_added"

                else "Resolution details saved successfully."

            ),

            "activity": activity_response(activity),

        }

# --------------------------------------------------
# ROOT CAUSE REVIEW
# --------------------------------------------------
@app.get("/incidents/{incident_id}/review")

def get_root_cause_review(

    incident_id: int,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        incident = get_session_incident_or_404(

            db, incident_id, session_id

        )

        review = get_review(db, incident_id, session_id)

        return review_response(review, incident)

@app.post("/incidents/{incident_id}/review")

def submit_root_cause_review(

    incident_id: int,

    request: ReviewRequest,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        incident = get_session_incident_or_404(

            db, incident_id, session_id

        )

        review = get_review(db, incident_id, session_id)

        current_root_cause = (

            review.revised_root_cause

            if review and review.revised_root_cause

            else incident.possible_root_cause

        )

        if not current_root_cause and not request.revised_root_cause:

            raise HTTPException(

                status_code=400,

                detail="There is no proposed root cause to review yet.",

            )

        # REQUEST AI REWORK
        if request.decision == "request_rework":

            if not request.feedback:

                raise HTTPException(

                    status_code=400,

                    detail="Add feedback explaining what needs to be revised.",

                )

            previous_analysis = current_session_analysis(review, incident)

            previous_analysis_text = format_analysis_snapshot(

                previous_analysis

            )

            incident_text = (

                f"{incident.title}. {incident.description}\n"

                f"Reviewer feedback: {request.feedback}"

            )

            try:

                similar = get_similar_incidents(

                    incident_text,

                    top_k=3,

                )

                revised = analyze_incident(

                    title=incident.title,

                    description=incident.description,

                    similar_incidents=similar,

                    reviewer_feedback=request.feedback,

                    previous_analysis=previous_analysis,

                )

            except Exception as exc:

                print(f"Incident reanalysis failed: {exc}")

                revised = None

            if not revised:

                raise HTTPException(

                    status_code=502,

                    detail=(

                        "AI reanalysis failed. Your existing incident "

                        "analysis has not been changed. Please try again."

                    ),

                )

            critic = None
            try:
                critic = critique_incident(
                    title=incident.title,
                    description=incident.description,
                    analysis=revised,
                    similar_incidents=similar,
                )
            except Exception as exc:
                print(f"Incident AI critic failed during rework: {exc}")
                critic = None

            if review is None:

                review = SessionIncidentReview(

                    session_id=session_id,

                    incident_id=incident_id,

                    review_status="pending",

                )

                db.add(review)

                db.flush()

            review.feedback = request.feedback
            review.critic_verdict = critic.get("verdict") if critic else None
            review.critic_reasoning = critic.get("reasoning") if critic else None

            review.revised_summary = revised["summary"]

            review.revised_root_cause = revised["possible_root_cause"]

            review.revised_recommended_action = revised["recommended_action"]

            review.revised_severity = revised["severity"]

            review.revised_category = revised["category"]

            review.revised_service = revised["service"]

            review.revised_confidence = (

                float(revised["confidence"])

                if revised.get("confidence") is not None

                else None

            )

            review.review_status = "rework_requested"

            review.final_report = None

            review.reviewed_at = now_utc()

            activity_message = (

                "Previous AI analysis:\n"

                f"{previous_analysis_text}\n\n"

                "Reviewer feedback:\n"

                f"{request.feedback}"

            )

            add_activity(

                db,

                incident_id,

                "root_cause_rework_requested",

                activity_message,

                session_id=session_id,

            )

            db.commit()

            db.refresh(review)

            return {

                "message": (

                    "AI reanalysis completed. Review the revised analysis "

                    "before approving it."

                ),

                "review": review_response(review, incident),

            }

        # APPROVE ROOT CAUSE
        approved_root_cause = (

            request.revised_root_cause

            or (review.revised_root_cause if review else None)

            or incident.possible_root_cause

        )

        if not approved_root_cause:

            raise HTTPException(

                status_code=400,

                detail="Provide a root cause before approving the review.",

            )

        if review is None:

            review = SessionIncidentReview(

                session_id=session_id,

                incident_id=incident_id,

                review_status="pending",

            )

            db.add(review)

            db.flush()

        if request.feedback is not None:

            review.feedback = request.feedback

        review.revised_root_cause = approved_root_cause

        review.review_status = "approved"

        review.reviewed_at = now_utc()

        approved_analysis = current_session_analysis(review, incident)

        approved_summary = approved_analysis["summary"] or "Not available."

        approved_action = (

            approved_analysis["recommended_action"] or "Not available."

        )

        approved_service = (

            approved_analysis["service"] or incident.service

        )

        approved_severity = (

            approved_analysis["severity"] or incident.severity

        )

        review.final_report = (

            f"Incident: {incident.title}\n"

            f"Service: {approved_service}\n"

            f"Severity: {approved_severity}\n\n"

            f"Description:\n{incident.description}\n\n"

            f"AI Summary:\n{approved_summary}\n\n"

            f"Human-approved root cause:\n{approved_root_cause}\n\n"

            f"Recommended action:\n{approved_action}\n\n"

            f"Review feedback:\n"

            f"{review.feedback or 'No additional feedback.'}\n\n"

            "Review status: Approved by the demo reviewer. "

            "The root cause has not been independently verified by this report."

        )

        add_activity(

            db,

            incident_id,

            "root_cause_approved",

            "Root-cause analysis approved. Final report is available.",

            session_id=session_id,

        )

        db.commit()

        db.refresh(review)

        return {

            "message": "Root cause approved. Final report is now available.",

            "review": review_response(review, incident),

        }

# --------------------------------------------------
# INCIDENT INVESTIGATION CHAT
# --------------------------------------------------
@app.get("/incidents/{incident_id}/chat")

def get_incident_chat(

    incident_id: int,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        get_session_incident_or_404(

            db, incident_id, session_id

        )

    key = (session_id, incident_id)

    return {

        "incident_id": incident_id,

        "messages": chat_histories.get(key, []),

        "persistence": "in_memory",

    }

@app.post("/incidents/{incident_id}/chat")

def chat_about_incident(

    incident_id: int,

    request: IncidentChatRequest,

    session_id: str = Depends(require_demo_session),

):

    if chat_client is None or not groq_model_name:

        raise HTTPException(

            status_code=503,

            detail="AI chat is unavailable. Check GROQ_API_KEY and GROQ_MODEL.",

        )

    with Session(bind=engine) as db:

        incident = get_session_incident_or_404(

            db, incident_id, session_id

        )

        review = get_review(db, incident_id, session_id)

        analysis = current_session_analysis(review, incident)

        try:

            similar = get_similar_incidents(

                f"{incident.title}. {incident.description}",

                top_k=3,

            )

        except Exception as exc:

            print(f"Chat context retrieval failed: {exc}")

            similar = []

        similar_context = "\n\n".join(

            (

                f"Incident #{item['incident'].id}: "

                f"{item['incident'].title}\n"

                f"Description: {item['incident'].description}\n"

                f"Root cause hypothesis: "

                f"{item['incident'].possible_root_cause or 'Not available'}\n"

                f"Similarity: {item['similarity']}%"

            )

            for item in similar

            if item["incident"].id != incident_id

        )

        context = f"""

You are an AI incident investigation assistant.

Help the reviewer reason about this specific software incident.

Clearly distinguish facts, hypotheses, and recommended checks.

Do not claim to have accessed logs, metrics, databases, deployments,

or external systems. Those sources are unavailable unless their

contents are explicitly provided.

CURRENT INCIDENT

Title: {incident.title}

Description: {incident.description}

Service: {analysis.get("service")}

Severity: {analysis.get("severity")}

Category: {analysis.get("category")}

Summary: {analysis.get("summary")}

Current root-cause hypothesis: {analysis.get("possible_root_cause")}

Recommended action: {analysis.get("recommended_action")}

SIMILAR HISTORICAL INCIDENTS

{similar_context or "No relevant historical incidents were retrieved."}

REVIEWER FEEDBACK

{review.feedback if review and review.feedback else "None provided."}

REVIEW STATUS

{review.review_status if review else "pending"}

Answer the reviewer's question directly. Suggest concrete evidence

to collect and explain how it could help distinguish between causes.

Do not claim the root cause is verified without supporting evidence.

"""

        key = (session_id, incident_id)

        history = chat_histories.setdefault(key, [])

        messages = [{"role": "system", "content": context}]

        messages.extend(

            [

                {"role": item["role"], "content": item["content"]}

                for item in history[-MAX_CHAT_MESSAGES:]

            ]

        )

        messages.append(

            {"role": "user", "content": request.question}

        )

        try:

            response = chat_client.chat.completions.create(

                model=groq_model_name,

                messages=messages,

                temperature=0.3,

            )

            answer = response.choices[0].message.content

            if not answer:

                raise ValueError("Groq returned an empty response.")

        except Exception as exc:

            print(

                f"Incident chat failed: {type(exc).__name__}: {exc}"

            )

            raise HTTPException(

                status_code=502,

                detail="The AI assistant could not answer. Please try again.",

            )

        history.extend(

            [

                {"role": "user", "content": request.question},

                {"role": "assistant", "content": answer},

            ]

        )

        chat_histories[key] = history[-MAX_CHAT_MESSAGES:]

        add_activity(

            db,

            incident_id,

            "ai_chat",

            "Reviewer discussed the incident with the AI assistant.",

            session_id=session_id,

        )

        db.commit()

    return {

        "incident_id": incident_id,

        "question": request.question,

        "answer": answer,

    }

@app.delete("/incidents/{incident_id}/chat")

def clear_incident_chat(

    incident_id: int,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        get_session_incident_or_404(

            db, incident_id, session_id

        )

    chat_histories.pop((session_id, incident_id), None)

    return {

        "message": "This session's chat history has been cleared.",

        "incident_id": incident_id,

    }

# --------------------------------------------------
# FINAL REPORT — ONLY AFTER APPROVAL
# --------------------------------------------------
@app.get("/incidents/{incident_id}/final-report")

def get_final_report(

    incident_id: int,

    session_id: str = Depends(require_demo_session),

):

    with Session(bind=engine) as db:

        incident = get_session_incident_or_404(

            db, incident_id, session_id

        )

        review = get_review(db, incident_id, session_id)

        if (

            review is None

            or review.review_status != "approved"

            or not review.final_report

        ):

            raise HTTPException(

                status_code=403,

                detail=(

                    "The final report is available only after "

                    "root-cause approval."

                ),

            )

        return {

            "incident_id": incident.id,

            "title": incident.title,

            "review_status": review.review_status,

            "final_report": review.final_report,

            "reviewed_at": format_created_at(review.reviewed_at),

        }
