import os
import json
from typing import List, Dict, Any, Optional
import httpx

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


def get_groq_api_key() -> str:
    """Safely retrieves the GROQ_API_KEY from environment, with .env auto-load."""
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        try:
            from dotenv import load_dotenv
            base_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.abspath(os.path.join(base_dir, ".."))
            load_dotenv(os.path.join(root_dir, ".env"), override=False)
            load_dotenv(os.path.join(base_dir, ".env"), override=False)
            key = os.getenv("GROQ_API_KEY", "").strip()
        except Exception:
            pass
    return key


def is_groq_configured() -> bool:
    return bool(get_groq_api_key())


async def call_fallback_provider(
    messages: List[Dict[str, str]],
    json_mode: bool = False,
    timeout: float = 6.0
) -> Optional[str]:
    """
    Stubbed secondary provider fallback path in case of Groq rate limits (HTTP 429)
    or network failure. Integrates with secondary provider (e.g. Google Gemini or local rule synthesizer).
    """
    try:
        try:
            from llm_service import call_gemini_api, is_gemini_configured
        except ImportError:
            from backend.llm_service import call_gemini_api, is_gemini_configured

        if is_gemini_configured():
            # Extract user message and optional system message
            system_inst = next((m["content"] for m in messages if m.get("role") == "system"), None)
            user_msg = next((m["content"] for m in messages if m.get("role") == "user"), "")
            print("[LLM Fallback] Routing request to secondary provider: Google Gemini")
            return await call_gemini_api(
                prompt=user_msg,
                json_mode=json_mode,
                system_instruction=system_inst,
                timeout=timeout
            )
    except Exception as fallback_err:
        print(f"[LLM Fallback Error]: {fallback_err}")

    return None


async def call_groq_llm(
    messages: List[Dict[str, str]],
    temperature: float = 0.2,
    json_mode: bool = False,
    timeout: float = 8.0,
    model: str = DEFAULT_GROQ_MODEL
) -> Optional[str]:
    """
    Calls Groq's OpenAI-compatible API endpoint using llama-3.3-70b-versatile.
    Includes structured try/except handling for rate limiting (429) and network issues
    with automatic fallback to secondary provider.
    """
    key = get_groq_api_key()

    if not key:
        print("[Groq Service] GROQ_API_KEY not configured. Falling back to secondary provider.")
        return await call_fallback_provider(messages, json_mode=json_mode, timeout=timeout)

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(GROQ_ENDPOINT, json=payload, headers=headers)

            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")

            # Rate Limiting (429) or Service Overload (503)
            elif response.status_code == 429 or response.status_code >= 500:
                print(f"[Groq Warning] Status {response.status_code} (Rate limit / Server issue). Triggering fallback provider...")
                return await call_fallback_provider(messages, json_mode=json_mode, timeout=timeout)
            else:
                print(f"[Groq Warning] Status {response.status_code}: {response.text[:200]}")
                return await call_fallback_provider(messages, json_mode=json_mode, timeout=timeout)

    except httpx.TimeoutException:
        print("[Groq Warning] Request timed out. Triggering fallback provider...")
        return await call_fallback_provider(messages, json_mode=json_mode, timeout=timeout)
    except Exception as exc:
        print(f"[Groq Error] {exc}. Triggering fallback provider...")
        return await call_fallback_provider(messages, json_mode=json_mode, timeout=timeout)

    return None
