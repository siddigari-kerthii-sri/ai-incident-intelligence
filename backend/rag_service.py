
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import engine
from models import IncidentDB
from embedding_service import create_embedding


def search_similar_incidents(
    text: str,
    top_k: int = 3,
    session_id: str | None = None,
    team_id: int | None = None,
    demo_workspace: bool = False,
    user_id: str | None = None,
):
    """
    Search shared synthetic reference incidents and, when authenticated,
    the current user's own incidents.

    Private incidents belonging to other users are never included.
    Legacy demo sessions are not treated as shared reference data.
    """
    query_embedding = create_embedding(text)

    with Session(bind=engine) as db:
        distance = IncidentDB.embedding.cosine_distance(query_embedding)

        query = db.query(
            IncidentDB,
            distance.label("distance"),
        ).filter(
            IncidentDB.embedding.isnot(None),
        )

        # Only explicitly marked synthetic seed records are shared.
        shared_reference = IncidentDB.created_by == "synthetic-seed"

        # Include only incidents owned by the authenticated user.
        if user_id:
            own_incidents = IncidentDB.created_by == user_id

            query = query.filter(
                or_(shared_reference, own_incidents)
            )

        elif team_id is not None:
            # Team-based access is not enabled in this individual-account
            # implementation. Do not accidentally search a whole team.
            query = query.filter(shared_reference)

        elif session_id is not None:
            own_demo_incidents = (
                (IncidentDB.session_id == session_id)
                & (IncidentDB.created_by == session_id)
            )

            query = query.filter(
                or_(shared_reference, own_demo_incidents)
            )

        else:
            # Anonymous or unspecified callers can access seed data only.
            query = query.filter(shared_reference)

        results = (
            query
            .order_by(distance)
            .limit(max(1, top_k) + 1)
            .all()
        )

        matches = []

        for incident, distance_value in results:
            if distance_value is None:
                continue

            similarity = round(
                max(0.0, (1.0 - float(distance_value)) * 100),
                2,
            )

            matches.append({
                "incident": incident,
                "similarity": similarity,
            })

        return matches

