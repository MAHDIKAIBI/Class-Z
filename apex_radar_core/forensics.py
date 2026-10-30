import os
import sys
import requests
from youtube_transcript_api import YouTubeTranscriptApi
from .config import execute_llm_cascade, parse_robust_json

def resolve_public_thumbnail_url(video_id: str) -> str:
    """
    Deterministically resolves the highest available public thumbnail URL for a video.
    """
    maxres = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    try:
        r = requests.head(maxres, timeout=3)
        if r.status_code == 200:
            return maxres
    except Exception:
        pass
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

def extract_hook_transcript(video_id: str, max_seconds: int = 45) -> str:
    """
    Downloads the first 45 seconds of spoken English captions for the video.
    """
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
        hook_chunks = []
        for snippet in transcript:
            if snippet.get("start", 0) <= max_seconds:
                hook_chunks.append(snippet.get("text", ""))
        text = " ".join(hook_chunks).replace("\n", " ").strip()
        return text if text else "Transcript unavailable."
    except Exception:
        return "Transcript unavailable."

def deconstruct_hook_psychology(outlier_title: str, hook_transcript: str, audience_psychology: str) -> dict:
    """
    Uses LLM cascade to deconstruct WHY this hook hooked hundreds of thousands of viewers.
    """
    system_prompt = """You are an elite YouTube retention psychologist and narrative engineer.
Your task is to deconstruct why a viral video's cold open worked, and extract its structural mechanics so another writer can replicate the psychological retention curve without copying words."""

    user_prompt = f"""OUTLIER TITLE: {outlier_title}
FIRST 45-SECOND TRANSCRIPT:
{hook_transcript}

TARGET AUDIENCE PSYCHOLOGY:
{audience_psychology}

Deconstruct the psychological mechanics of this cold open.
Return ONLY valid JSON with this exact structure:
{{
  "cold_open_mechanism": "...",
  "unresolved_open_loop": "...",
  "retention_reset_point": "...",
  "first_45s_blueprint_instruction": "..."
}}"""

    res = execute_llm_cascade(system_prompt, user_prompt, require_json=True)
    parsed = parse_robust_json(res, default={
        "cold_open_mechanism": "High-Stakes Paradox",
        "unresolved_open_loop": f"Why {outlier_title} challenges conventional wisdom",
        "retention_reset_point": "Second 30 escalation of consequences",
        "first_45s_blueprint_instruction": "Establish immediate conflict in sentence 1, present unexpected evidence, and withhold the primary explanation until Chapter 2."
    })
    return parsed
