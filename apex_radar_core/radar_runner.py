import os
import sys
import datetime

from .seed_manager import (
    parse_channel_niche,
    load_seeds,
    harvest_initial_seeds,
    auto_add_rising_channel
)
from .rss_scanner import scan_all_seeds_parallel
from .outlier_scorer import find_fleet_outliers
from .forensics import (
    resolve_public_thumbnail_url,
    extract_hook_transcript,
    deconstruct_hook_psychology
)
from .titler import generate_elite_titles_and_dossiers
from .dossier_manager import (
    append_dossier_and_topic,
    get_queue_count
)
from .config import execute_llm_cascade, parse_robust_json

def generate_narrative_revelations(outlier_title: str, hook_transcript: str) -> list:
    """
    Generates 3 shock-value narrative revelations for the 5-Beat chapter blueprint.
    """
    system_prompt = "You are a master documentary story architect. Given a viral YouTube topic, break it down into 3 escalating narrative revelations (shocking truths) that keep viewers hooked."
    user_prompt = f"""TOPIC: {outlier_title}
HOOK CONTEXT: {hook_transcript[:300]}

Return ONLY valid JSON array of 3 objects:
[
  {{"chapter": 1, "revelation": "..."}},
  {{"chapter": 2, "revelation": "..."}},
  {{"chapter": 3, "revelation": "..."}}
]"""
    res = execute_llm_cascade(system_prompt, user_prompt, require_json=True)
    return parse_robust_json(res, default=[
        {"chapter": 1, "revelation": f"The hidden origin that triggered the {outlier_title} controversy"},
        {"chapter": 2, "revelation": "The critical failure point that industry insiders tried to conceal"},
        {"chapter": 3, "revelation": "The shocking real-world financial consequences and the future alternative"}
    ])

def run_radar(channel_dir: str, min_queue_count: int = 2, max_bangers_to_add: int = 3, force: bool = False) -> list:
    """
    Master Apex Content Radar execution cycle.
    Can be run standalone or called by claude_scraper as a Just-In-Time auto-refill.
    """
    channel_env = os.path.join(channel_dir, ".env")
    if os.path.exists(channel_env):
        from dotenv import load_dotenv
        load_dotenv(channel_env, override=True)

    channel_name = os.path.basename(channel_dir)
    print(f"\n=======================================================")
    print(f"  ⚡ APEX CONTENT RADAR: {channel_name.upper()}")
    print(f"=======================================================")

    current_queue = get_queue_count(channel_dir)
    if not force and current_queue >= min_queue_count:
        print(f"[*] Queue is healthy ({current_queue} pending topics). Auto-refill skipped.")
        return []

    print(f"[*] Queue low ({current_queue} < {min_queue_count}). Initiating autonomous goldmine hunt...")

    niche_path = os.path.join(channel_dir, "channel_niche.txt")
    if not os.path.exists(niche_path):
        print(f"[!] Error: channel_niche.txt not found in {channel_dir}")
        return []

    niche_data = parse_channel_niche(niche_path)

    # 1. Check or Harvest Seeds
    seeds = load_seeds(channel_dir)
    if not seeds or len(seeds) < 5:
        print(f"[*] seeds.json empty or small. Launching Automated Seed Harvester...")
        seeds = harvest_initial_seeds(channel_dir, target_count=50)

    if not seeds:
        print(f"[!] Failed to acquire channel seeds. Aborting.")
        return []

    # 2. Fast Parallel RSS Scan
    print(f"[*] Scanning {len(seeds)} channel RSS feeds across the niche fleet...")
    scanned_channels = scan_all_seeds_parallel(seeds)
    print(f"    [+] Successfully gathered latest uploads from {len(scanned_channels)} channels.")

    # 3. Outlier Scoring
    outliers = find_fleet_outliers(scanned_channels, niche_data)
    if not outliers:
        print(f"[-] No severe outliers found in this pass. Expanding search...")
        return []

    top_picks = outliers[:max_bangers_to_add]
    added_topics = []

    for idx, outlier in enumerate(top_picks, 1):
        vid_id = outlier["video_id"]
        v_title = outlier["title"]
        print(f"\n--- [OUTLIER #{idx} SELECTED] ---")
        print(f"    Title: '{v_title}'")
        print(f"    Channel: {outlier.get('channel_name')} | Views: {outlier.get('views', 0):,} ({outlier.get('outlier_multiplier', 1.0)}x baseline)")

        # Auto-add to rising star tier if small channel
        if outlier.get("subs", 0) < 35000 and outlier.get("views", 0) > 40000:
            auto_add_rising_channel(channel_dir, outlier.get("channel_id"), outlier.get("channel_name"))

        # 4. Forensics & Hook Extraction
        print(f"    [*] Extracting first 45s transcript hook & resolving public thumbnail...")
        hook_text = extract_hook_transcript(vid_id, max_seconds=45)
        thumb_url = resolve_public_thumbnail_url(vid_id)

        # Collect 2-3 thumbnail URLs from other top outliers for visual few-shot prompting
        ref_urls = [thumb_url]
        for other in outliers[1:3]:
            other_url = resolve_public_thumbnail_url(other["video_id"])
            if other_url not in ref_urls:
                ref_urls.append(other_url)

        # 5. Hook Psychology Deconstruction & Revelations
        print(f"    [*] Deconstructing hook psychology and chapter revelations...")
        hook_dna = deconstruct_hook_psychology(v_title, hook_text, niche_data.get("audience_psychology", ""))
        revelations = generate_narrative_revelations(v_title, hook_text)

        # 6. Empirical Titling & Adversarial Bouncer
        print(f"    [*] Running Empirical Few-Shot Titler + Adversarial Bouncer...")
        candidates = generate_elite_titles_and_dossiers(
            top_outliers=outliers,
            target_opportunity=outlier,
            niche_data=niche_data,
            candidate_urls=ref_urls
        )

        if candidates:
            winner = candidates[0]
            winning_title = winner.get("title")

            # Assemble the complete Intelligence Dossier
            dossier_payload = {
                "topic_id": f"{channel_name.lower()}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{idx}",
                "title": winning_title,
                "character_count": len(winning_title),
                "niche": channel_name,
                "empirical_proof": {
                    "outlier_source_url": outlier.get("url"),
                    "source_title": v_title,
                    "multiplier": outlier.get("outlier_multiplier"),
                    "views": outlier.get("views"),
                    "channel": outlier.get("channel_name")
                },
                "hook_dna": hook_dna,
                "narrative_revelations": revelations,
                "thumbnail_dna": {
                    "outlier_reference_urls": ref_urls,
                    "visual_concept": winner.get("thumbnail_concept", "High-contrast focal subject with dramatic lighting"),
                    "text_on_screen": winner.get("text_on_screen", "CRITICAL TRUTH"),
                    "color_accent": winner.get("color_accent", "#E74C3C")
                },
                "research_anchors": {
                    "entities": niche_data.get("entities", [])[:10],
                    "tags": outlier.get("tags", [])
                }
            }

            # 7. Atomically save to topics.txt and topic_dossiers.json
            append_dossier_and_topic(channel_dir, winning_title, dossier_payload)
            added_topics.append(winning_title)

    print(f"\n[+] SUCCESS: Apex Content Radar successfully primed {len(added_topics)} lethal topics into {channel_name}!")
    return added_topics
