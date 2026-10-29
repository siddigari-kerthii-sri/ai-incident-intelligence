
import re
import hashlib
import math

DIMENSIONS = 384

def create_embedding(text: str) -> list[float]:
    vector = [0.0] * DIMENSIONS
    words = re.findall(r"\b[a-z0-9_]+\b", text.lower())

    for word in words:
        digest = hashlib.sha256(word.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % DIMENSIONS
        vector[index] += 1.0

    magnitude = math.sqrt(sum(x * x for x in vector))

    if magnitude:
        vector = [x / magnitude for x in vector]

    return vector
