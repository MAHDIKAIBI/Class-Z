import os
import sys
import re
from .config import execute_llm_cascade, parse_robust_json

BANNED_AI_WORDS = {
    "revolutionary", "game-changer", "gamechanger", "shocking", "unveiled", "insane",
    "mind-blowing", "ultimate", "unbelievable", "you won't believe", "exposed",
    "dive deep", "unveiling", "masterclass", "jaw-dropping", "epic"
}

def adversarial_title_bouncer(title: str, required_entities: list = None) -> tuple:
    """
    Programmatically evaluates a candidate title against 5 ruthless laws.
    Returns (is_passed: bool, reason: str).
    """
    clean_title = title.strip().strip('"').strip("'")

    # 1. The "Kill The Colon" Law
    if ":" in clean_title or " - " in clean_title:
        return False, "Failed Colon/Dash Test"

    # 2. Length Filter (Mobile Cutoff Rule: <= 52 characters)
    if len(clean_title) > 52:
        return False, f"Too Long ({len(clean_title)} chars > 52 max)"
    if len(clean_title) < 18:
        return False, "Too Short (< 18 chars)"

    # 3. AI Buzzword Filter
    title_lower = clean_title.lower()
    for word in BANNED_AI_WORDS:
        if re.search(r'\b' + re.escape(word) + r'\b', title_lower):
            return False, f"Contains Banned AI Word: '{word}'"

    # 4. Question Mark followed by complete explanation
    if "?" in clean_title and clean_title.endswith("?"):
        # Single direct questions are okay, but avoid double-clause resolution
        pass

    # 5. Concrete Specificity Gate: Must contain numbers, dollar amounts, or capital-letter proper nouns
    has_number = bool(re.search(r'\d+', clean_title))
    has_dollar = "$" in clean_title
    capital_words = [w for w in clean_title.split() if w and w[0].isupper() and w.lower() not in {"the", "why", "how", "what", "and", "this", "that"}]

    if not (has_number or has_dollar or len(capital_words) >= 1):
        return False, "Lacks Concrete Entities or Numbers"

    return True, "PASSED"

def generate_elite_titles_and_dossiers(
    top_outliers: list,
    target_opportunity: dict,
    niche_data: dict,
    candidate_urls: list
) -> list:
    """
    Empirical In-Context Few-Shot Titler:
    - Analyzes the real-world top outliers as Few-Shot exemplars.
    - Generates 10-15 candidates matching that live syntactic grammar.
    - Runs candidates through the Adversarial Title Bouncer.
    - Attaches companion thumbnail visuals and outlier reference URLs.
    """
    outlier_examples = []
    for o in top_outliers[:8]:
        outlier_examples.append(f"- \"{o['title']}\" (Views: {o.get('views', 0):,}, Outlier Ratio: {o.get('outlier_multiplier', 1.0)}x baseline)")

    exemplars_text = "\n".join(outlier_examples) if outlier_examples else "None available."

    system_prompt = """You are THE MASTER PACKAGER — a world-class YouTube title engineer, behavioral psychologist, and thumbnail art director.
You write punchy, ruthless, mobile-optimized titles that force the click through natural tension, high-stakes asymmetry, and information gaps.

STRICT CONSTRAINTS:
1. NO COLONS (:) and NO DASHES (-) anywhere in the titles.
2. MAXIMUM 50 CHARACTERS PER TITLE (Mobile screen rule).
3. NO generic AI hype words (banned: shocking, insane, revolutionary, game-changer, exposed, ultimate).
4. USE CONCRETE SPECIFICITY: Include exact brands, models, dollar figures, or real consequences.
5. Create a clean information loop: Clear enough to care, incomplete enough to click."""

    user_prompt = f"""LIVE VIRAL OUTLIERS IN THIS NICHE RIGHT NOW (FEW-SHOT TRAINING SET):
{exemplars_text}

TARGET TOPIC TO PACKAGE:
Subject: {target_opportunity.get('title')}
Channel Baseline Evidence: {target_opportunity.get('views', 0):,} views ({target_opportunity.get('outlier_multiplier', 1.0)}x baseline)
Key Entities: {', '.join(niche_data.get('entities', [])[:10])}
Audience Psychology: {niche_data.get('audience_psychology')}

YOUR TASK:
Study the syntax, length, and emotional levers of the LIVE OUTLIERS above.
Generate 10 candidate titles for our target topic that clone that winning grammar.
For each title, engineer a companion thumbnail concept that divides the information (Title gives controversy/consequence; Thumbnail gives visual evidence).

Return ONLY valid JSON with this structure:
{{
  "candidates": [
    {{
      "title": "...",
      "character_count": 45,
      "psychological_trigger": "...",
      "thumbnail_concept": "...",
      "text_on_screen": "3-4 WORDS MAX",
      "color_accent": "#HEX"
    }}
  ]
}}"""

    response_text = execute_llm_cascade(system_prompt, user_prompt, require_json=True)
    parsed = parse_robust_json(response_text, default={"candidates": []})
    raw_candidates = parsed.get("candidates", [])

    accepted = []
    for cand in raw_candidates:
        t = cand.get("title", "")
        passed, reason = adversarial_title_bouncer(t)
        if passed:
            cand["outlier_reference_urls"] = candidate_urls[:3]
            accepted.append(cand)

    # Fallback if bouncer rejected everything (ensure pipeline never crashes)
    if not accepted and raw_candidates:
        # Pick the shortest candidate and clean colons
        best = raw_candidates[0]
        t_cleaned = best.get("title", "").replace(":", " -").replace(" - ", " ")
        if len(t_cleaned) > 52:
            t_cleaned = t_cleaned[:50].rsplit(" ", 1)[0]
        best["title"] = t_cleaned
        best["outlier_reference_urls"] = candidate_urls[:3]
        accepted.append(best)

    return accepted
