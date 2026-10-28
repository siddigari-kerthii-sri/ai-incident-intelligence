from sqlalchemy.orm import Session

from database import engine
from models import IncidentDB
from embedding_service import create_embedding


db = Session(bind=engine)

try:
    incidents = db.query(IncidentDB).all()

    for incident in incidents:
        text = f"{incident.title}. {incident.description}"

        incident.embedding = create_embedding(text)

        print(f"Embedded incident #{incident.id}")

    db.commit()

    print("All incident embeddings generated successfully.")

finally:
    db.close()