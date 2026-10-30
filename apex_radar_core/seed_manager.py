import os
import sys
import warnings
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"
import json
import re
import datetime
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
import requests
import yt_dlp

def parse_channel_niche(niche_file_path: str) -> dict:
    """
    Parses channel_niche.txt into 4 distinct blocks:
    - queries: list of high-intent search strings
    - entities: list of core brands, models, influencers
    - tension_keywords: list of conflict/outlier indicators
    - audience_psychology: text describing the viewer desires
    """
    data = {
        "queries": [],
        "entities": [],
        "tension_keywords": [],
        "audience_psychology": ""
    }
    if not os.path.exists(niche_file_path):
        return data

    with open(niche_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    current_section = None
    lines = content.splitlines()

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if stripped.startswith("[") and stripped.endswith("]"):
            header = stripped[1:-1].upper()
            if "SEARCH" in header:
                current_section = "queries"
            elif "ENTIT" in header:
                current_section = "entities"
            elif "TENSION" in header:
                current_section = "tension_keywords"
            elif "PSYCHOLOGY" in header:
                current_section = "audience_psychology"
            else:
                current_section = None
            continue

        if stripped.startswith("#"):
            continue

        if current_section == "queries":
            data["queries"].append(stripped)
        elif current_section == "entities":
            # Comma-separated or line-by-line
            items = [item.strip() for item in stripped.split(",") if item.strip()]
            data["entities"].extend(items)
        elif current_section == "tension_keywords":
            items = [item.strip() for item in stripped.split(",") if item.strip()]
            data["tension_keywords"].extend(items)
        elif current_section == "audience_psychology":
            if data["audience_psychology"]:
                data["audience_psychology"] += " " + stripped
            else:
                data["audience_psychology"] = stripped

    return data

def get_seeds_file(channel_dir: str) -> str:
    return os.path.join(channel_dir, "seeds.json")

def load_seeds(channel_dir: str) -> list:
    path = get_seeds_file(channel_dir)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []

def save_seeds(channel_dir: str, seeds: list):
    path = get_seeds_file(channel_dir)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(seeds, f, indent=2, ensure_ascii=False)

def verify_channel_activity(channel_id: str, niche_data: dict) -> dict:
    """
    Verifies that a channel is active and genuinely belongs to the niche:
    - Returns channel metadata if valid, or None if dead / irrelevant.
    """
    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    try:
        r = requests.get(rss_url, timeout=5)
        if r.status_code != 200 or "<entry>" not in r.text:
            return None

        root = ET.fromstring(r.text)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
        channel_title = root.find('atom:title', ns).text if root.find('atom:title', ns) is not None else "Unknown"

        entries = root.findall('atom:entry', ns)
        if len(entries) < 2:
            return None

        # Reject generic mainstream news conglomerates and non-niche entertainment mega-creators
        DISQUALIFIED_GENERIC_CHANNELS = {
            "cnn", "fox news", "msnbc", "abc news", "cbs news", "nbc news",
            "bbc news", "the wall street journal", "wsj", "the guardian",
            "daily mail", "new york post", "al jazeera", "reuters", "associated press",
            "forbes", "bloomberg", "cnbc", "usa today", "inside edition",
            "mrbeast", "pewdiepie", "dude perfect", "cocomelon", "t-series",
            "5-minute crafts", "like nastya", "vlad and niki", "wwe", "nfl", "nba", "espn"
        }
        ch_lower = channel_title.lower()
        if any(dq in ch_lower for dq in DISQUALIFIED_GENERIC_CHANNELS):
            return None

        # Check latest upload date (must be within last 60 days)
        latest_entry = entries[0]
        pub_str = latest_entry.find('atom:published', ns).text[:10]
        pub_date = datetime.datetime.strptime(pub_str, "%Y-%m-%d")
        days_since_upload = (datetime.datetime.now() - pub_date).days
        if days_since_upload > 75:
            return None

        # Relevance check: inspect last 5 titles
        recent_titles = [e.find('atom:title', ns).text.lower() for e in entries[:5] if e.find('atom:title', ns) is not None]
        all_text = " ".join(recent_titles)

        # Build vocabulary matcher: prioritize real entities and domain-specific words
        entities_words = set()
        for ent in niche_data.get("entities", []):
            entities_words.update(re.findall(r'\w{3,}', ent.lower()))

        queries_words = set()
        for q in niche_data.get("queries", []):
            queries_words.update(re.findall(r'\w{3,}', q.lower()))

        # Remove generic non-domain words
        generic_stops = {
            "the", "and", "vs", "for", "with", "how", "what", "why", "this", "that",
            "from", "into", "over", "under", "fail", "broken", "scam", "cost", "price",
            "bubble", "truth", "secret", "dont", "buy", "test", "review", "teardown",
            "story", "stories", "real", "fake", "biggest", "million", "dollar", "years"
        }
        domain_keywords = (entities_words | queries_words) - generic_stops

        hits = sum(1 for word in domain_keywords if word in all_text or word in channel_title.lower())
        if hits < 2:
            return None

        return {
            "channel_id": channel_id,
            "channel_name": channel_title,
            "tier": "authority",
            "rss_url": rss_url,
            "last_upload_days_ago": days_since_upload,
            "outliers_produced": 0,
            "health_score": 100,
            "added_at": datetime.datetime.now().isoformat()
        }
    except Exception:
        return None

def harvest_initial_seeds(channel_dir: str, target_count: int = 50) -> list:
    """
    Automated YouTube search to seed channels based on channel_niche.txt.
    """
    niche_path = os.path.join(channel_dir, "channel_niche.txt")
    niche_data = parse_channel_niche(niche_path)
    queries = niche_data.get("queries", [])
    if not queries:
        return []

    print(f"[*] Harvesting initial seeds for {os.path.basename(channel_dir)} using {len(queries)} multi-pillar queries...")
    existing_seeds = load_seeds(channel_dir)
    existing_ids = {s["channel_id"] for s in existing_seeds}

    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True
    }

    discovered_channel_ids = set()

    # Search top 5 results for a diverse selection of queries
    selected_queries = queries[:12]
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for q in selected_queries:
            try:
                res = ydl.extract_info(f"ytsearch5:{q}", download=False)
                for entry in res.get("entries", []):
                    c_id = entry.get("channel_id")
                    if c_id and c_id.startswith("UC") and c_id not in existing_ids:
                        discovered_channel_ids.add(c_id)
            except Exception:
                pass

    print(f"    [+] Found {len(discovered_channel_ids)} candidate channel IDs. Running 3-Point Accuracy Gate...")

    verified_seeds = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(verify_channel_activity, c_id, niche_data) for c_id in discovered_channel_ids]
        for f in futures:
            res = f.result()
            if res:
                verified_seeds.append(res)

    print(f"    [+] Successfully verified {len(verified_seeds)} authentic, active niche channels!")

    combined = existing_seeds + verified_seeds
    save_seeds(channel_dir, combined)
    return combined

def auto_add_rising_channel(channel_dir: str, channel_id: str, channel_name: str):
    """
    Called by the outlier scanner when a micro-channel outlier is spotted in 'Related/Up Next'.
    """
    seeds = load_seeds(channel_dir)
    for s in seeds:
        if s["channel_id"] == channel_id:
            s["outliers_produced"] = s.get("outliers_produced", 0) + 1
            s["health_score"] = min(150, s.get("health_score", 100) + 25)
            save_seeds(channel_dir, seeds)
            return

    new_seed = {
        "channel_id": channel_id,
        "channel_name": channel_name,
        "tier": "rising_star",
        "rss_url": f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}",
        "last_upload_days_ago": 0,
        "outliers_produced": 1,
        "health_score": 120,
        "added_at": datetime.datetime.now().isoformat()
    }
    seeds.append(new_seed)
    print(f"    [🌟 GOLDMINE DISCOVERY] Auto-added rising star channel: {channel_name} ({channel_id})")
    save_seeds(channel_dir, seeds)
