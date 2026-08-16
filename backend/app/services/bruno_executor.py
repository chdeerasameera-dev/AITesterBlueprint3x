import json
from typing import Dict, Any, List

class BrunoApiExecutorService:
    @staticmethod
    def generate_bruno_collection(req_title: str, endpoint_url: str, method: str = "POST", payload: Dict[str, Any] = None) -> str:
        bruno_json = {
            "name": f"API Test - {req_title}",
            "type": "http-request",
            "request": {
                "method": method,
                "url": endpoint_url,
                "headers": [
                    {"name": "Content-Type", "value": "application/json"}
                ],
                "body": {
                    "mode": "json",
                    "json": payload or {"test": "data"}
                },
                "assertions": [
                    {"operator": "eq", "target": "res.status", "value": "200"},
                    {"operator": "isDefined", "target": "res.body", "value": ""}
                ]
            }
        }
        return json.dumps(bruno_json, indent=2)

bruno_executor = BrunoApiExecutorService()
