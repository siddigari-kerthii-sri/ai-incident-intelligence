
from sqlalchemy.orm import Session

from database import engine
from models import IncidentDB
from embedding_service import create_embedding


def search_similar_incidents(
    text: str,
    top_k: int = 3,
    session_id: str | None = None,
    team_id: int | None = None,
    demo_workspace: bool = False,
):
    """
    Search incidents using vector similarity.

    Default demo behavior searches the shared incident database,
    including legacy incidents with NULL session_id.

    Optional session_id and team_id filters are retained for
    compatibility with older callers.
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

        if team_id is not None:
            query = query.filter(IncidentDB.team_id == team_id)
        elif session_id is not None and not demo_workspace:
            query = query.filter(IncidentDB.session_id == session_id)
        else:
            # Shared demo workspace: include legacy and new incidents.
            query = query.filter(IncidentDB.team_id.is_(None))

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
