
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from database import Base


class TeamDB(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_by = Column(String(255), nullable=True, index=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class TeamMembershipDB(Base):
    __tablename__ = "team_memberships"

    id = Column(Integer, primary_key=True, index=True)

    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Supabase Auth user UUID stored as a string.
    user_id = Column(String(255), nullable=False, index=True)

    # Keep permissions simple for the initial version.
    role = Column(String(30), nullable=False, default="employee")

    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_membership"),
        # Initial design: each employee can belong to one team.
        UniqueConstraint("user_id", name="uq_employee_single_team"),
    )


class TeamInvitationDB(Base):
    __tablename__ = "team_invitations"

    id = Column(Integer, primary_key=True, index=True)

    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Store a hash of the invitation code, not the raw code.
    code_hash = Column(String(255), nullable=False, unique=True, index=True)

    created_by = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Integer, nullable=False, default=1)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class IncidentDB(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    # Existing demo-session ownership. Preserve for demo compatibility.
    session_id = Column(String(64), nullable=True, index=True)

    # Real incidents belong to a team.
    # Existing demo records can keep team_id as NULL.
    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    # Supabase Auth user UUID for the employee who created the incident.
    created_by = Column(String(255), nullable=True, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    service = Column(String, nullable=False)
    severity = Column(String, nullable=False)

    category = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    possible_root_cause = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    confidence = Column(Integer, nullable=True)

    embedding = Column(Vector(384), nullable=True)

    status = Column(String, nullable=False, default="Open")

    ai_analysis_status = Column(
        String,
        nullable=False,
        default="Pending",
        server_default="Pending",
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class IncidentActivity(Base):
    __tablename__ = "incident_activities"

    id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        Integer,
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Retained for existing demo activity records.
    session_id = Column(String(64), nullable=True, index=True)

    # Employee who performed the activity; NULL for older/demo records
    # where a real employee identity is not applicable.
    actor_user_id = Column(String(255), nullable=True, index=True)

    event_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)

    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)

    actor = Column(String(100), nullable=False, default="Demo User")

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SessionIncidentReview(Base):
    __tablename__ = "session_incident_reviews"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(String(64), nullable=False, index=True)
    critic_verdict = Column(String(30), nullable=True)
    critic_reasoning = Column(Text, nullable=True)
    incident_id = Column(
        Integer,
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    review_status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    feedback = Column(Text, nullable=True)

# AI analysis revised specifically for this demo session.
    revised_summary = Column(Text, nullable=True)
    revised_recommended_action = Column(Text, nullable=True)
    revised_severity = Column(String, nullable=True)
    revised_category = Column(String, nullable=True)
    revised_service = Column(String, nullable=True)
    revised_confidence = Column(Integer, nullable=True)

    revised_root_cause = Column(Text, nullable=True)
    final_report = Column(Text, nullable=True)

    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "incident_id",
            name="uq_session_incident_review",
        ),
    )
