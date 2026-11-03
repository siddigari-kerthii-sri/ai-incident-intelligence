
from sentence_transformers import SentenceTransformer

DIMENSIONS = 384

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def prepare_incident_text(incident) -> str:
    fields = [
        f"Title: {incident.title or ''}",
        f"Description: {incident.description or ''}",
        f"Service: {incident.service or ''}",
        f"Severity: {incident.severity or ''}",
        f"Category: {incident.category or ''}",
        f"Summary: {incident.summary or ''}",
    ]

    return "\n".join(fields)


def create_embedding(text: str) -> list[float]:
    embedding = model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()
