import hashlib
import math
import re
from typing import List

from config.settings import settings


class EmbeddingEngine:
    """Deterministic, offline hash embeddings for lightweight semantic retrieval."""

    def __init__(self):
        self.dim = settings.VECTOR_DIM

    def get_embedding(self, text: str) -> List[float]:
        words = re.findall(r"\w+", text.lower())
        vector = [0.0] * self.dim
        if not words:
            return vector

        for word in words:
            digest = hashlib.sha256(word.encode("utf-8")).digest()
            numeric_hash = int.from_bytes(digest[:8], "big", signed=False)
            index = numeric_hash % self.dim
            sign = 1.0 if numeric_hash & 1 else -1.0
            vector[index] += sign

        norm = math.sqrt(sum(value * value for value in vector))
        return [value / norm for value in vector] if norm else vector

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0.0


embedding_engine = EmbeddingEngine()
