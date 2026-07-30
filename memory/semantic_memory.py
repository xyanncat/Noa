from typing import List, Dict, Any
from database.sqlite_db import db
from models.embeddings import embedding_engine

class SemanticMemory:
    """
    Semantic Memory Layer: Vectorized knowledge base storing verified facts,
    concepts, and documentation snippets. Performs vector similarity retrieval.
    """
    def __init__(self):
        pass

    def add_fact(self, subject: str, fact: str, source: str = "user_interaction") -> int:
        emb = embedding_engine.get_embedding(f"{subject}: {fact}")
        return db.insert_semantic(subject, fact, emb, source)

    def search_facts(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        query_emb = embedding_engine.get_embedding(query)
        facts = db.get_all_semantic_memories()
        
        scored_facts = []
        for f in facts:
            score = 1.0
            if f.get("embedding"):
                score = embedding_engine.cosine_similarity(query_emb, f["embedding"])
            else:
                # Text overlap fallback
                query_words = set(query.lower().split())
                fact_words = set(f["fact"].lower().split())
                overlap = len(query_words.intersection(fact_words))
                score = overlap / max(1, len(query_words))

            scored_facts.append((score, f))

        # Sort descending by score
        scored_facts.sort(key=lambda x: x[0], reverse=True)
        return [{"score": score, **f} for score, f in scored_facts[:top_k] if score > 0.05]

    def get_all(self) -> List[Dict[str, Any]]:
        return db.get_all_semantic_memories()
