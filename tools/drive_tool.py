from typing import Any
from tools.base import BaseTool, tool_registry
from database.sqlite_db import db

class GoogleDriveTool(BaseTool):
    name = "drive"
    description = "Manage cloud documents and files in Google Drive storage."
    parameters = {
        "action": "list | save_doc | read_doc",
        "doc_name": "Document title",
        "content": "Document text content"
    }

    def run(self, action: str, doc_name: str = "", content: str = "") -> Any:
        if action == "save_doc":
            db.insert_semantic(subject=f"drive_doc:{doc_name}", fact=content, source="google_drive")
            return f"Saved document '{doc_name}' to Google Drive storage."
        elif action == "list":
            all_facts = db.get_all_semantic_memories()
            drive_docs = [f for f in all_facts if f["source"] == "google_drive"]
            if not drive_docs:
                return "No documents found in Google Drive."
            return [f"- Document: {d['subject'].replace('drive_doc:', '')}" for d in drive_docs]
        elif action == "read_doc":
            all_facts = db.get_all_semantic_memories()
            for d in all_facts:
                if d["subject"] == f"drive_doc:{doc_name}":
                    return d["fact"]
            return f"Document '{doc_name}' not found."
        
        return f"Unknown action '{action}'."

tool_registry.register(GoogleDriveTool())
