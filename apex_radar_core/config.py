import os
import sys
import json
import time
import random
import re
import requests
from dotenv import load_dotenv

# Reconfigure stdout for utf-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load environment from channel or parent root
load_dotenv()

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

MODELS_CASCADE = [
    {
        "name": "gemini-3.6-flash",
        "key_env": "GEMINI_API_KEYS",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "params": {"temperature": 0.7, "max_tokens": 4000},
        "max_attempts": 10
    },
    {
        "name": "gemini-3.7-flash",
        "key_env": "GEMINI_API_KEYS",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "params": {"temperature": 0.7, "max_tokens": 4000},
        "max_attempts": 10
    },
    {
        "name": "nvidia/nemotron-3-ultra-550b-a55b",
        "key_env": "NVIDIA_API_KEY",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "params": {"temperature": 0.4, "top_p": 0.9, "max_tokens": 4000},
        "max_attempts": 5
    }
]

LAST_WORKING_KEYS = {}

def execute_llm_cascade(system_prompt: str, user_prompt: str, require_json: bool = False) -> str:
    """
    Executes high-availability cascade:
    1. gemini-3.6-flash (primary active Google model)
    2. gemini-3.7-flash (10 attempts across rotating AI Studio keys)
    3. nvidia/nemotron-3-ultra-550b-a55b
    """
    global LAST_WORKING_KEYS

    for model_config in MODELS_CASCADE:
        model_name = model_config["name"]

        # API-keyed models (Gemini / NVIDIA)
        if OpenAI is None:
            continue

        raw_key = os.getenv(model_config["key_env"], "")
        if not raw_key:
            continue
        base_keys = [k.strip() for k in raw_key.split(',') if k.strip()]
        if "gemini" in model_name.lower():
            studio_keys = [k for k in base_keys if k.startswith("AIzaSy")]
            if studio_keys:
                base_keys = studio_keys
        if not base_keys:
            continue

        # Prioritize last known working key for this model
        candidate_keys = list(base_keys)
        last_key = LAST_WORKING_KEYS.get(model_name)
        if last_key and last_key in candidate_keys:
            candidate_keys.remove(last_key)
            candidate_keys.insert(0, last_key)
        else:
            random.shuffle(candidate_keys)

        params = dict(model_config["params"])
        if require_json and "gemini" in model_name.lower():
            params["response_format"] = {"type": "json_object"}

        for api_key in candidate_keys:
            try:
                client = OpenAI(api_key=api_key, base_url=model_config["base_url"], timeout=10.0)
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    **params
                )
                choice = response.choices[0]
                content = choice.message.content or getattr(choice.message, "reasoning_content", None)
                if content and str(content).strip():
                    LAST_WORKING_KEYS[model_name] = api_key
                    return str(content).strip()
            except Exception:
                pass

    return ""

def clean_json_text(text: str) -> str:
    """Strips markdown code fences and returns raw json candidate."""
    if not text:
        return ""
    text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
    text = text.strip()
    return text

def parse_robust_json(text: str, default=None):
    """Parses JSON safely, extracting top-level object or array if surrounded by chatter."""
    cleaned = clean_json_text(text)
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    # Try finding outer braces or brackets
    obj_match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
    if obj_match:
        try:
            return json.loads(obj_match.group(1))
        except Exception:
            pass
    arr_match = re.search(r'(\[.*\])', cleaned, re.DOTALL)
    if arr_match:
        try:
            return json.loads(arr_match.group(1))
        except Exception:
            pass
    return default if default is not None else {}
