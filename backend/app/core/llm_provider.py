import os
import json
import httpx
from typing import Dict, Any, Optional

class LLMProvider:
    def __init__(self):
        self.provider = os.getenv("AI_PROVIDER", "openai").lower()
        self.model = os.getenv("AI_MODEL", "gpt-4o")
        self.base_url = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")
        self.api_key = os.getenv("AI_API_KEY", "")

    async def generate_json(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        if not self.api_key and self.provider != "ollama":
            # Deterministic fallback response if LLM API key is not set
            return {"status": "fallback", "message": "LLM_API_KEY not provided. Using fallback rule engine."}

        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt or "You are an AI QA Quality Engineer. Return strictly valid JSON with no markdown wrapping."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }

        if self.provider not in ("ollama", "groq", "anthropic", "openrouter"):
            payload["response_format"] = {"type": "json_object"}

        base = self.base_url.rstrip("/")
        url = base if base.endswith("/chat/completions") else f"{base}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                return json.loads(content.strip())
        except Exception as e:
            return {"status": "error", "error": str(e)}
