from sqlalchemy.orm import Session

from database import engine
from models import IncidentDB
from embedding_service import create_embedding, prepare_incident_text

db = Session(bind=engine)

try:
    incidents = db.query(IncidentDB).all()

    for incident in incidents:
        text = prepare_incident_text(incident)
        incident.embedding = create_embedding(text)

        print(f"Embedded incident #{incident.id}")

    db.commit()
    print("All embeddings regenerated successfully.")

except Exception:
    db.rollback()
    raise

finally:
    db.close()