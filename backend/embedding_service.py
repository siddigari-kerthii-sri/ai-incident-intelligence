from sentence_transformers import SentenceTransformer


model = None


def get_model():
    global model

    if model is None:
        print("Loading embedding model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Embedding model loaded.")

    return model


def create_embedding(text):
    embedding_model = get_model()

    return embedding_model.encode(text).tolist()