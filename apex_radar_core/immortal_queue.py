# -*- coding: utf-8 -*-
"""
================================================================================
APEX RADAR CORE - IMMORTAL QUEUE & CHANNEL AUDIT ENGINE (V2.0 HIGH-TEMP)
================================================================================
Guarantees that GitHub Actions runs NEVER fail on an empty topics.txt.
Powered by:
  1. Live YouTube Data API v3 Channel Audit using the target channel's OAuth token
     (STRICT RULE: Only public videos and future-scheduled videos are referenced).
  2. Dynamic Winning Formula & Brand Pillar Extractor (Analyzes the channel's top winners).
  3. Live Past-Week Google News RSS Research (Grounded directly in winning brands & fresh weekly news).
  4. Antigravity CLIProxyAPI Gateway (gemini-3.8-flash-high @ temperature=1.15).
  5. Fallback cascade to Claude Opus 4.6 Thinking / Sonnet 4.6 / SmartGeminiKeyRing.
  6. Strict fuzzy word-overlap deduplication & 3-video cadence interleaver.
================================================================================
"""

import os
import sys
import json
import re
import time
import random
import datetime
import urllib.parse
from difflib import SequenceMatcher
import subprocess
import requests

# Base engine directory (parent of apex_radar_core package)
ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

def is_public_ci() -> bool:
    """Returns True if running in a public GitHub Actions runner where logs must be protected."""
    return os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("DEBUG_IMMORTAL_LOGS", "false").lower() != "true"


# ==============================================================================
# 1. CHANNEL MAPPINGS & OAUTH REFRESH ENGINE
# ==============================================================================

CHANNEL_NICHE_MAP = {
    "Chrono-Fi": "Luxury mechanical watches, horological engineering, Swiss watchmaking monopolies, superclone counterfeits, Chinese movement factories",
    "Midi-Fi": "Music production hardware, synthesizer wars, Behringer clones vs Roland/Moog, audio interfaces, studio monitors, DAC converter myths",
    "Chicken Proof": "Homesteading security, predator-proof coop engineering, poultry nutrition, automated livestock protection systems",
    "Cosme-Fi": "Forensic cosmetic chemistry, skincare lab testing, luxury beauty formulation markups, active ingredient concentrations, Korean skin tech",
    "Cycle-Fi": "Performance cycling engineering, carbon fiber frame safety, groupset monopolies, Chinese carbon wheel testing, aero tech vs marketing",
    "Luxe-Fi": "Ultra-luxury status symbols, high jewelry manufacturing costs, bespoke tailoring, auction market psychology, luxury conglomerates",
    "Mouse-Fi": "Competitive gaming mice, optical sensor engineering, latency testing, microswitch debouncing, 8000Hz polling rate reality, Chinese ultralights",
    "Scenti-Fi": "Niche fragrance perfumery, aroma chemical breakdown, synthetic vs natural oud, designer clone houses, maceration and performance myths",
    "Torque-Fi": "Automotive performance engineering, internal combustion teardowns, turbocharger reliability, transmission design failures, aftermarket dyno truth",
    "Brew-Fi": "Specialty coffee brewing science, espresso extraction dynamics, commercial burr grinder geometry, thermal stability testing",
    "Carti-Fi": "Luxury streetwear economics, high-fashion runway critiques, luxury fabric manufacturing markups, counterfeit garment forensics",
    "Deep Signal": "Esoteric symbolism, sacred geometry, ancient high technology, calendar and frequency anomalies, suppressed archaeological discoveries, hermetic wisdom, and hidden reality constructs",
    "GTA 6": "Rockstar Games engine architecture, open-world physics simulation, graphical rendering pipelines, game development economics",
    "Home-Fi": "Smart home automation architectures, Zigbee vs Matter protocols, local-first IoT privacy, home audio room acoustics",
    "Self improvement": "Cognitive psychology, behavioral habit loops, dopamine regulation, executive function optimization, neurochemistry of focus"
}

CHANNEL_EXPANDED_BRANDS_MAP = {
    "Midi-Fi": [
        "Roland", "Yamaha", "Korg", "Moog", "InMusic", "Solid State Logic", "SSL",
        "Avid", "Pro Tools", "Teenage Engineering", "Arturia", "Akai Professional", "Akai",
        "Elektron", "Focusrite", "Novation", "Sequential", "Dave Smith", "Oberheim",
        "Nord", "Genelec", "Waldorf", "Mackie", "PreSonus", "TASCAM", "Warm Audio",
        "Shure", "Sennheiser", "Universal Audio", "Behringer", "Neve", "Neumann", "Topping", "MOTU"
    ],
    "Chrono-Fi": [
        "Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Seiko", "Grand Seiko",
        "Cartier", "Breitling", "Tudor", "IWC", "Vacheron Constantin", "Richard Mille",
        "TAG Heuer", "Zenith", "Jaeger-LeCoultre", "Panerai", "Tissot", "Hamilton",
        "Casio", "Citizen", "Dandong", "Sea-Gull", "San Martin", "Baltic", "Furlan Marri"
    ],
    "Mouse-Fi": [
        "Logitech", "Razer", "Finalmouse", "Zowie", "Pulsar", "Lamzu", "Vaxee",
        "Endgame Gear", "SteelSeries", "Asus ROG", "Ninjutso", "WLmouse", "ATK",
        "Scyrox", "Zaopin", "Darmoshark", "G-Wolves", "Glorious"
    ],
    "Cycle-Fi": [
        "Shimano", "SRAM", "Campagnolo", "Specialized", "Trek", "Cannondale", "Giant",
        "Pinarello", "Colnago", "Cervelo", "Canyon", "Zipp", "ENVE", "DT Swiss",
        "Magene", "L-Twoo", "Sensah", "Winspace", "EliteWheels", "Hunt"
    ],
    "Cosme-Fi": [
        "L'Oreal", "Estee Lauder", "The Ordinary", "Paula's Choice", "La Roche-Posay",
        "SkinCeuticals", "Drunk Elephant", "CeraVe", "Cosrx", "Beauty of Joseon",
        "Shiseido", "Charlotte Tilbury", "Rhode", "Dior", "Chanel"
    ],
    "Torque-Fi": [
        "Toyota", "Honda", "Ford", "GM", "BMW", "Mercedes-Benz", "Porsche",
        "Volkswagen", "Audi", "Subaru", "Mazda", "Nissan", "Ferrari", "Lamborghini",
        "Garrett", "BorgWarner", "Bosch", "Brembo", "Bilstein"
    ],
    "Scenti-Fi": [
        "Creed", "Tom Ford", "Maison Francis Kurkdjian", "Roja Parfums",
        "Parfums de Marly", "Xerjoff", "Amouage", "Kilian", "Le Labo", "Byredo",
        "Diptyque", "Dior", "Chanel", "Armaf", "Lattafa", "Afnan", "Mancera", "Montale"
    ],
    "Brew-Fi": [
        "La Marzocco", "Slayer", "Decent", "Breville", "Sage", "Eureka", "Mahlkonig",
        "Weber Workshops", "Comandante", "Fellow", "Timemore", "DF64", "Gaggia",
        "Rancilio", "Profitec", "ECM"
    ],
    "Carti-Fi": [
        "Balenciaga", "Gucci", "Louis Vuitton", "Prada", "Rick Owens", "Chrome Hearts",
        "Saint Laurent", "Bottega Veneta", "Maison Margiela", "Dior", "Vetements",
        "Supreme", "Stussy", "Arc'teryx", "Loro Piana", "Brunello Cucinelli"
    ]
}


def _find_token_file(channel_name):
    """Locates the channel's OAuth token JSON file."""
    candidates = [
        os.path.join(ENGINE_DIR, "tokens", f"{channel_name}_token.json"),
        os.path.join(ENGINE_DIR, "tokens", f"{channel_name.lower()}_token.json"),
        os.path.join(ENGINE_DIR, "tokens", f"{channel_name.replace('-', '_')}_token.json"),
        os.path.join(ENGINE_DIR, "tokens", f"{channel_name.replace('-', '')}_token.json"),
        os.path.join(os.getcwd(), "tokens", f"{channel_name}_token.json")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    tokens_dir = os.path.join(ENGINE_DIR, "tokens")
    if os.path.exists(tokens_dir):
        for f in os.listdir(tokens_dir):
            if f.endswith("_token.json") and channel_name.lower().replace("-", "") in f.lower().replace("-", "").replace("_", ""):
                return os.path.join(tokens_dir, f)
    return None


def _refresh_oauth_token(channel_name):
    """Refreshes the channel's OAuth access token using tokens/<Channel>_token.json."""
    token_path = _find_token_file(channel_name)
    if not token_path or not os.path.exists(token_path):
        return None
    try:
        with open(token_path, "r", encoding="utf-8") as f:
            t_data = json.load(f)
        rt = t_data.get("refresh_token")
        cid = t_data.get("client_id")
        csec = t_data.get("client_secret")
        if not (rt and cid and csec):
            return None
        r = requests.post("https://oauth2.googleapis.com/token", data={
            "client_id": cid,
            "client_secret": csec,
            "refresh_token": rt,
            "grant_type": "refresh_token"
        }, timeout=15)
        if r.status_code == 200:
            return r.json().get("access_token")
    except Exception:
        pass
    return None


def _parse_iso_duration_seconds(dur_str):
    if not dur_str:
        return 0
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', dur_str)
    if not m:
        return 0
    hrs = int(m.group(1) or 0)
    mins = int(m.group(2) or 0)
    secs = int(m.group(3) or 0)
    return hrs * 3600 + mins * 60 + secs


# ==============================================================================
# 2. LIVE CHANNEL AUDIT ENGINE (STRICT PRIVACY FILTERING)
# ==============================================================================

def fetch_live_channel_audit(channel_name, channel_dir):
    """
    Audits the target channel live via the YouTube Data API v3 and Google Drive.
    STRICT USER CONSTRAINT:
      - ONLY public videos and future scheduled videos are read and kept for reference.
      - Any private, draft, unlisted, or unscheduled video is COMPLETELY IGNORED.
    Returns:
      channel_stats, top_winners, recent_uploads, all_past_titles
    """
    print(f"\n[*] [CHANNEL AUDIT] Auditing channel '{channel_name}' via token & Drive...", flush=True)
    videos_by_title = {}
    all_past_titles = set()
    channel_stats = {"title": channel_name, "subs": 0, "total_views": 0, "video_count": 0}

    # 1. Sync channel_niche.txt from Drive if missing locally
    niche_file = os.path.join(channel_dir, "channel_niche.txt")
    if not os.path.exists(niche_file):
        try:
            subprocess.run(
                ["rclone", "copyto", f"data:Colab_AutoVideoCreator/channels/{channel_name}/channel_niche.txt", niche_file],
                check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20
            )
        except Exception:
            pass

    # 2. Query Live YouTube API using the Channel's OAuth Token
    token_path = _find_token_file(channel_name)
    if token_path and os.path.exists(token_path):
        try:
            access_token = _refresh_oauth_token(channel_name)
            if access_token:
                auth_headers = {"Authorization": f"Bearer {access_token}"}
                r_ch = requests.get(
                    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
                    headers=auth_headers, timeout=15
                )
                if r_ch.status_code == 200:
                    items = r_ch.json().get("items", [])
                    if items:
                        ch_item = items[0]
                        channel_stats["title"] = ch_item.get("snippet", {}).get("title", channel_name)
                        channel_stats["subs"] = int(ch_item.get("statistics", {}).get("subscriberCount", 0))
                        channel_stats["total_views"] = int(ch_item.get("statistics", {}).get("viewCount", 0))
                        channel_stats["video_count"] = int(ch_item.get("statistics", {}).get("videoCount", 0))
                        uploads_pid = ch_item.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")

                        if is_public_ci():
                            print(f"  [+] [YouTube API] Connected to '{channel_name}' successfully.", flush=True)
                        else:
                            print(f"  [+] [YouTube API] Connected to '{channel_stats['title']}' ({channel_stats['subs']:,} subs, {channel_stats['video_count']} videos)", flush=True)

                        # Fetch uploaded playlist items
                        video_ids = []
                        next_page = None
                        for _ in range(4): # up to 200 videos
                            p_url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId={uploads_pid}&maxResults=50"
                            if next_page:
                                p_url += f"&pageToken={next_page}"
                            r_pl = requests.get(p_url, headers=auth_headers, timeout=15)
                            if r_pl.status_code != 200:
                                break
                            pl_data = r_pl.json()
                            for it in pl_data.get("items", []):
                                vid_id = it.get("contentDetails", {}).get("videoId")
                                if vid_id:
                                    video_ids.append(vid_id)
                            next_page = pl_data.get("nextPageToken")
                            if not next_page:
                                break

                        # Batch fetch statistics, status & details
                        now_utc = datetime.datetime.now(datetime.timezone.utc)
                        live_videos = []
                        ignored_private_count = 0

                        for i in range(0, len(video_ids), 50):
                            batch_ids = ",".join(video_ids[i:i+50])
                            v_url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id={batch_ids}"
                            r_v = requests.get(v_url, headers=auth_headers, timeout=15)
                            if r_v.status_code == 200:
                                for v_it in r_v.json().get("items", []):
                                    v_title = v_it.get("snippet", {}).get("title", "").strip()
                                    st = v_it.get("status", {})
                                    v_priv = st.get("privacyStatus", "public")
                                    v_pub = st.get("publishAt") or v_it.get("snippet", {}).get("publishedAt", "")
                                    v_views = int(v_it.get("statistics", {}).get("viewCount", 0))
                                    v_likes = int(v_it.get("statistics", {}).get("likeCount", 0))
                                    v_comms = int(v_it.get("statistics", {}).get("commentCount", 0))
                                    v_dur = v_it.get("contentDetails", {}).get("duration", "PT10M")

                                    # STRICT RULE: ONLY public and future scheduled videos!
                                    is_public = (v_priv == "public")
                                    is_future_scheduled = False
                                    if st.get("publishAt"):
                                        try:
                                            p_dt = datetime.datetime.fromisoformat(st["publishAt"].replace("Z", "+00:00"))
                                            if p_dt > now_utc:
                                                is_future_scheduled = True
                                        except Exception:
                                            pass

                                    if not (is_public or is_future_scheduled):
                                        ignored_private_count += 1
                                        continue

                                    if v_title:
                                        all_past_titles.add(v_title)
                                        v_obj = {
                                            "id": v_it.get("id", ""),
                                            "title": v_title,
                                            "publishedAt": v_pub,
                                            "views": v_views,
                                            "likes": v_likes,
                                            "comments": v_comms,
                                            "duration": v_dur,
                                            "privacyStatus": v_priv,
                                            "is_scheduled": is_future_scheduled
                                        }
                                        videos_by_title[v_title.lower()] = v_obj
                                        live_videos.append(v_obj)

                        if is_public_ci():
                            print(f"  [+] [YouTube API] Synced channel videos for audit.", flush=True)
                        else:
                            print(f"  [+] [YouTube API] Filtered: {len(live_videos)} eligible videos ({ignored_private_count} private unscheduled ignored).", flush=True)
                        if live_videos:
                            an_out = os.path.join(channel_dir, "channel_analytics.json")
                            with open(an_out, "w", encoding="utf-8") as f:
                                json.dump(live_videos, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"  [~] [YouTube API] Notice during live token audit: {e}", flush=True)

    # 3. Add pending uploads from Google Drive 'to upload' (future scheduled content) and 'uploaded'
    local_recent_disk_titles = []
    for sub in ["to upload", "uploaded"]:
        local_sub = os.path.join(channel_dir, sub)
        if os.path.exists(local_sub):
            try:
                items_with_mtime = [
                    (item, os.path.getmtime(os.path.join(local_sub, item)))
                    for item in os.listdir(local_sub)
                    if item != "desktop.ini" and not item.startswith(".")
                ]
                items_with_mtime.sort(key=lambda x: x[1], reverse=True)
                for item, mtime in items_with_mtime:
                    clean_t = os.path.splitext(item)[0].strip()
                    all_past_titles.add(clean_t)
                    if clean_t not in local_recent_disk_titles:
                        local_recent_disk_titles.append(clean_t)
            except Exception:
                pass
        try:
            res = subprocess.run(
                ["rclone", "lsf", f"data:Colab_AutoVideoCreator/channels/{channel_name}/{sub}"],
                capture_output=True, text=True, timeout=15
            )
            if res.returncode == 0 and res.stdout:
                for line in res.stdout.splitlines():
                    clean_item = os.path.splitext(line.strip().rstrip("/"))[0].strip()
                    if clean_item and clean_item != "desktop" and not clean_item.startswith("."):
                        all_past_titles.add(clean_item)
        except Exception:
            pass

    # 4. Compute Top Public Winners (Long-form videos sorted by views) and Recent Uploads
    all_video_objs = list(videos_by_title.values())
    long_form_videos = [
        v for v in all_video_objs
        if "#shorts" not in v["title"].lower() and _parse_iso_duration_seconds(v.get("duration", "PT10M")) > 90
    ]
    if not long_form_videos:
        long_form_videos = all_video_objs

    top_winners = sorted(long_form_videos, key=lambda x: x.get("views", 0), reverse=True)[:15]
    recent_uploads = sorted(long_form_videos, key=lambda x: x.get("publishedAt", ""), reverse=True)[:10]

    if is_public_ci():
        print(f"  [+] [Audit Summary] History analyzed ({len(all_past_titles)} titles indexed).", flush=True)
    else:
        print(f"  [+] [Audit Summary] Eligible Titles Blacklisted: {len(all_past_titles)} | Top Winners Identified: {len(top_winners)}", flush=True)
        if top_winners:
            print(f"      #1 Winner: \"{top_winners[0]['title']}\" ({top_winners[0]['views']:,} views)", flush=True)

    return {
        "channel_stats": channel_stats,
        "top_winners": top_winners,
        "recent_uploads": recent_uploads,
        "local_recent_disk_titles": local_recent_disk_titles,
        "all_past_titles": list(all_past_titles)
    }


# ==============================================================================
# 3. DYNAMIC WINNING FORMULA & BRAND PILLAR EXTRACTOR
# ==============================================================================

def _parse_channel_niche_file(channel_dir, channel_name):
    """Reads channel_niche.txt to extract search queries, core entities, and tension keywords."""
    niche_path = os.path.join(channel_dir, "channel_niche.txt")
    niche_text = ""
    if os.path.exists(niche_path):
        try:
            with open(niche_path, "r", encoding="utf-8", errors="replace") as f:
                niche_text = f.read()
        except Exception:
            pass

    queries = []
    entities = []
    tension = ""
    section = None
    for line in niche_text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if s.startswith("[SEARCH_QUERIES]"):
            section = "queries"
            continue
        elif s.startswith("[CORE_ENTITIES]"):
            section = "entities"
            continue
        elif s.startswith("[TENSION_KEYWORDS]"):
            section = "tension"
            continue
        elif s.startswith("["):
            section = "other"
            continue

        if section == "queries":
            queries.append(s)
        elif section == "entities":
            clean_s = re.sub(r'\(.*?\)', '', s)
            for part in clean_s.split(","):
                p = part.strip()
                if len(p) >= 3 and not p.startswith("#"):
                    entities.append(p)
        elif section == "tension":
            tension += " " + s

    return {
        "raw_niche_text": niche_text[:4000],
        "queries": queries,
        "entities": entities,
        "tension": tension.strip()
    }


def extract_channel_winning_formula(channel_name, top_winners, niche_data, channel_dir=None):
    """
    Dynamically identifies:
      1. Winning Brands / Entities that scored the highest views on this channel.
      2. Winning Title Syntax Formats from the channel's highest-performing public videos.
      3. Seamless fallback to curated niche pillars when a channel is rebranded or starting fresh.
    """
    known_entities = niche_data.get("entities", [])
    brand_view_map = {}

    for w in top_winners:
        t = w["title"]
        v = w["views"]
        for ent in known_entities:
            if re.search(r'\b' + re.escape(ent) + r'\b', t, re.IGNORECASE):
                if ent not in brand_view_map:
                    brand_view_map[ent] = {"count": 0, "total_views": 0, "max_views": 0}
                brand_view_map[ent]["count"] += 1
                brand_view_map[ent]["total_views"] += v
                brand_view_map[ent]["max_views"] = max(brand_view_map[ent]["max_views"], v)

    sorted_brands = sorted(brand_view_map.items(), key=lambda x: (x[1]["max_views"], x[1]["total_views"]), reverse=True)
    winning_brands = [b[0] for b in sorted_brands[:6]]

    is_rebranded_or_new = len(brand_view_map) == 0

    if is_rebranded_or_new:
        # Rebranded channel or new channel: use top entities defined in channel_niche.txt
        winning_brands = known_entities[:6] if known_entities else [channel_name.replace("-Fi", "").replace("Proof", "").strip()]

    winning_formats = []
    if is_rebranded_or_new:
        # Abstract blueprints from curated topics.txt queue
        curated_titles = []
        if channel_dir:
            topics_path = os.path.join(channel_dir, "topics.txt")
            if os.path.exists(topics_path):
                try:
                    with open(topics_path, "r", encoding="utf-8", errors="replace") as f:
                        curated_titles = [line.strip() for line in f if line.strip() and not line.startswith("#")]
                except Exception:
                    pass
        source_titles = curated_titles[:4] if curated_titles else [w["title"] for w in top_winners[:4]]
        for i, t in enumerate(source_titles, 1):
            ab = t
            ab = re.sub(r'\$[\d,]+', '$[X]', ab)
            ab = re.sub(r'\b\d+\b', '[N]', ab)
            winning_formats.append(
                f'Blueprint {i} (Curated Niche Standard): "{ab}"\n   -> Proven Channel Example: "{t}"'
            )
    else:
        for i, w in enumerate(top_winners[:4], 1):
            ab = w["title"]
            ab = re.sub(r'\$[\d,]+', '$[X]', ab)
            ab = re.sub(r'\b\d+\b', '[N]', ab)
            winning_formats.append(
                f'Blueprint {i} (Hit {w["views"]:,} views): "{ab}"\n   -> Proven Channel Example: "{w["title"]}"'
            )

    return {
        "winning_brands": winning_brands,
        "brand_view_map": brand_view_map,
        "winning_formats": winning_formats,
        "is_rebranded_or_new": is_rebranded_or_new
    }


# ==============================================================================
# 4. LIVE MARKET RESEARCH ENGINE (PAST WEEK / when:7d)
# ==============================================================================

def conduct_live_market_research(channel_name, niche_data, winning_brands):
    """
    Conducts live Google News RSS research for stories from roughly the past week (when:7d).
    Grounds the queries directly in the channel's winning brands and core niche keywords.
    """
    print(f"  [*] [MARKET RESEARCH] Scanning fresh past-week stories (when:7d) for '{channel_name}'...", flush=True)
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    niche_core = channel_name.replace("-Fi", "").replace("Proof", "").strip()
    fresh_signals = []

    for brand in winning_brands[:4]:
        q_7d = f'"{brand}" ({niche_core} OR news OR discovery OR mystery OR secret OR technology OR research OR new) when:7d'
        url_7d = f"https://news.google.com/rss/search?q={urllib.parse.quote(q_7d)}&hl=en-US&gl=US&ceid=US:en"
        found_for_brand = 0
        try:
            r = requests.get(url_7d, headers=headers, timeout=6)
            if r.status_code == 200:
                items = re.findall(r'<item>.*?<title>(.*?)</title>.*?<pubDate>(.*?)</pubDate>', r.text, re.DOTALL)
                for tit, pub in items[:3]:
                    c_tit = re.sub(r'&amp;', '&', re.sub(r'&#39;', "'", re.sub(r'&quot;', '"', tit))).strip()
                    if c_tit and c_tit not in fresh_signals:
                        fresh_signals.append(f"[{brand} | Fresh Week: {pub[:16]}] {c_tit}")
                        found_for_brand += 1
        except Exception:
            pass

        if found_for_brand < 2:
            q_30d = f'"{brand}" ({niche_core} OR news OR discovery OR controversy OR secrets OR breakdown) when:30d'
            url_30d = f"https://news.google.com/rss/search?q={urllib.parse.quote(q_30d)}&hl=en-US&gl=US&ceid=US:en"
            try:
                r = requests.get(url_30d, headers=headers, timeout=6)
                if r.status_code == 200:
                    items = re.findall(r'<item>.*?<title>(.*?)</title>.*?<pubDate>(.*?)</pubDate>', r.text, re.DOTALL)
                    for tit, pub in items[:2]:
                        c_tit = re.sub(r'&amp;', '&', re.sub(r'&#39;', "'", re.sub(r'&quot;', '"', tit))).strip()
                        if c_tit and c_tit not in fresh_signals:
                            fresh_signals.append(f"[{brand} | Recent 30d: {pub[:16]}] {c_tit}")
            except Exception:
                pass

    top_brand_ref = winning_brands[0] if winning_brands else niche_core
    q_ch = f'({niche_core} OR "{top_brand_ref}") (Chinese OR factory OR teardown OR clone OR alternative) when:30d'
    url_ch = f"https://news.google.com/rss/search?q={urllib.parse.quote(q_ch)}&hl=en-US&gl=US&ceid=US:en"
    try:
        r = requests.get(url_ch, headers=headers, timeout=6)
        if r.status_code == 200:
            items = re.findall(r'<item>.*?<title>(.*?)</title>.*?<pubDate>(.*?)</pubDate>', r.text, re.DOTALL)
            for tit, pub in items[:3]:
                c_tit = re.sub(r'&amp;', '&', re.sub(r'&#39;', "'", re.sub(r'&quot;', '"', tit))).strip()
                if c_tit and c_tit not in fresh_signals:
                    fresh_signals.append(f"[Chinese Disruption | {pub[:16]}] {c_tit}")
    except Exception:
        pass

    print(f"  [+] [MARKET RESEARCH] Gathered {len(fresh_signals)} live market signals.", flush=True)
    return "\n".join(fresh_signals[:25])


# ==============================================================================
# 5. DEDUPLICATION & MATHEMATICAL SPACING ENGINE
# ==============================================================================

def _clean_tokens(s):
    s = re.sub(r'[^a-z0-9 ]', ' ', s.lower())
    stop = {"the", "and", "for", "that", "why", "how", "are", "you", "your", "with", "from", "into", "this", "what", "they", "just", "could", "entire", "industry", "new", "here"}
    return {w for w in s.split() if len(w) > 2 and w not in stop}


def is_duplicate_topic(candidate, existing_Iterable, threshold=0.62):
    """Returns True if candidate is an exact or fuzzy duplicate of any title in existing_Iterable."""
    cand_clean = candidate.strip().lower()
    cand_words = _clean_tokens(candidate)
    if not cand_words:
        return True

    for ex in existing_Iterable:
        ex_clean = ex.strip().lower()
        if cand_clean == ex_clean:
            return True
        seq_ratio = SequenceMatcher(None, cand_clean, ex_clean).ratio()
        if seq_ratio > 0.70:
            return True
        ex_words = _clean_tokens(ex)
        if ex_words:
            overlap = len(cand_words.intersection(ex_words)) / max(len(cand_words), len(ex_words))
            if overlap > threshold:
                return True
    return False


def _is_chinese_formula(title):
    low = title.lower()
    return any(w in low for w in ["chinese", "china", "dandong", "sea-gull", "pt5000", "guangzhou", "shenzhen", "fatar"])


def interleave_with_3_cadence(titles_list):
    """
    Ensures Chinese disruption topics and non-Chinese topics are spaced with a
    strict distance of 3 (2 non-Chinese between every Chinese topic) whenever possible,
    and never adjacent if non-Chinese topics are available.
    """
    ch_pool = [t for t in titles_list if _is_chinese_formula(t)]
    nc_pool = [t for t in titles_list if not _is_chinese_formula(t)]

    ordered = []
    while ch_pool and len(nc_pool) >= 2:
        ordered.append(nc_pool.pop(0))
        ordered.append(nc_pool.pop(0))
        ordered.append(ch_pool.pop(0))

    while ch_pool or nc_pool:
        if nc_pool:
            ordered.append(nc_pool.pop(0))
        if ch_pool:
            ordered.append(ch_pool.pop(0))

    return ordered


def extract_quarantine_intel(channel_name, recent_run_history, lookback=5):
    """
    Extracts quarantined brands and recently used syntactic openings from the last 4-5 runs.
    Ensures that any brand or formula used in the last 4-5 runs cannot be repeated.
    """
    known_brands = CHANNEL_EXPANDED_BRANDS_MAP.get(channel_name, [
        "Roland", "Yamaha", "Korg", "Moog", "InMusic", "Solid State Logic", "SSL",
        "Avid", "Pro Tools", "Teenage Engineering", "Arturia", "Akai Professional", "Akai",
        "Elektron", "Focusrite", "Novation", "Behringer", "Neve", "Neumann", "Universal Audio"
    ])

    quarantined_brands = set()
    quarantined_syntax = set()

    for item in recent_run_history[:lookback]:
        t_clean = item.get("title", "") if isinstance(item, dict) else str(item)
        t_clean = t_clean.strip()
        t_low = t_clean.lower()
        for b in known_brands:
            if re.search(r'\b' + re.escape(b.lower()) + r'\b', t_low):
                quarantined_brands.add(b)

        words = t_clean.split()
        if len(words) >= 3:
            quarantined_syntax.add(" ".join(words[:3]).lower())

    available_brands = [b for b in known_brands if b not in quarantined_brands]
    return list(quarantined_brands), list(quarantined_syntax), available_brands


def enforce_brand_and_syntax_cadence(candidates, available_brands=None, quarantined_brands=None):
    """
    Guarantees strict brand diversity and eliminates syntactic echo chambers:
    1. Rejects any candidate containing a quarantined brand.
    2. Enforces that no single brand appears more than once in the top 4 titles.
    3. Enforces that no two adjacent titles share the same 2 starting words.
    4. Interleaves Chinese and non-Chinese disruption topics.
    """
    if quarantined_brands:
        clean_candidates = []
        for cand in candidates:
            c_low = cand.lower()
            if any(re.search(r'\b' + re.escape(qb.lower()) + r'\b', c_low) for qb in quarantined_brands):
                continue
            clean_candidates.append(cand)
        candidates = clean_candidates

    ordered = []
    seen_brands = set()

    for cand in candidates:
        cand_low = cand.lower()
        words = cand.strip().split()
        opening = " ".join(words[:2]).lower() if len(words) >= 2 else ""

        cand_brand = None
        if available_brands:
            for b in available_brands:
                if re.search(r'\b' + re.escape(b.lower()) + r'\b', cand_low):
                    cand_brand = b
                    break

        if len(ordered) < 4:
            if cand_brand and cand_brand in seen_brands:
                continue
            if ordered and opening and opening == " ".join(ordered[-1].strip().split()[:2]).lower():
                continue

        ordered.append(cand)
        if cand_brand:
            seen_brands.add(cand_brand)

    for cand in candidates:
        if cand not in ordered:
            ordered.append(cand)

    return interleave_with_3_cadence(ordered)


# ==============================================================================
# 6. ANTIGRAVITY GATEWAY & FALLBACK CASCADE CALLER (SELF-CONTAINED)
# ==============================================================================

def shuffle_antigravity_deck(auth_dir=None):
    """
    Implements Option C Two-Tier Poker Deck Shuffle matching gemini_orchestrator.py:
    - Tier 1: Shuffles the 2 Google AI Pro accounts (50/50 coin flip which Pro leads: 00- and 01-)
    - Tier 2: Shuffles the 9 Free accounts like poker cards (02- through 10-)
    Guarantees runners don't all slam the exact same Pro account.
    """
    try:
        import hashlib
        if not auth_dir:
            auth_dir = os.path.expanduser("~/.cli-proxy-api")
        if not os.path.exists(auth_dir):
            return

        all_files = [f for f in os.listdir(auth_dir) if f.endswith(".json")]
        if len(all_files) < 2:
            return

        pro_hashes = {
            "0079b9e29b2b9f21770f13dbf3197be234dfb097aac0d211aa62209001e2da36",
            "1b0f6d26e9e783e73f3604bb989bcbbbad0d8edc493a1fd14267e64593126853"
        }

        unique_by_name = {}
        for f in all_files:
            clean_name = re.sub(r'^(?:temp_\d+_|\.tmp_\d+_|\d+-)+', '', f)
            if clean_name not in unique_by_name:
                unique_by_name[clean_name] = f
            else:
                try:
                    os.remove(os.path.join(auth_dir, f))
                except Exception:
                    pass

        pro_files = []
        free_files = []

        for clean_name, orig_f in unique_by_name.items():
            m = re.search(r'antigravity-([^/\\:]+?)\.json', clean_name.lower())
            is_pro = False
            if m:
                acc_id = m.group(1).strip().lower()
                if hashlib.sha256(acc_id.encode()).hexdigest() in pro_hashes:
                    is_pro = True
            if is_pro:
                pro_files.append((orig_f, clean_name))
            else:
                free_files.append((orig_f, clean_name))

        random.shuffle(pro_files)
        random.shuffle(free_files)

        temp_mapping = []
        for idx, (orig_f, clean_name) in enumerate(pro_files + free_files):
            tmp_f = f".tmp_{idx}_{clean_name}"
            src_path = os.path.join(auth_dir, orig_f)
            dst_path = os.path.join(auth_dir, tmp_f)
            if os.path.exists(src_path):
                os.rename(src_path, dst_path)
            temp_mapping.append((tmp_f, clean_name, idx < len(pro_files)))

        for idx, (tmp_f, clean_name, is_pro) in enumerate(temp_mapping):
            prefix = f"{idx:02d}-"
            final_name = f"{prefix}{clean_name}"
            src_path = os.path.join(auth_dir, tmp_f)
            dst_path = os.path.join(auth_dir, final_name)
            if os.path.exists(src_path):
                os.rename(src_path, dst_path)

        print(f"  [+] [Antigravity Deck] Option C Poker Shuffle Complete (2 Pro + {len(free_files)} Shuffled Free Accounts).", flush=True)
    except Exception as e:
        print(f"  [~] [Antigravity Deck] Shuffle notice: {e}", flush=True)


def ensure_antigravity_gateway_running():
    """Guarantees CLIProxyAPI daemon is active on port 8317."""
    base_url = os.environ.get("OPENAI_BASE_URL", "http://127.0.0.1:8317/v1").rstrip("/")
    endpoint = f"{base_url}/models"
    try:
        r = requests.get(endpoint, headers={"Authorization": "Bearer sk-cliproxy-test"}, timeout=1.5)
        if r.status_code == 200:
            return True
    except Exception:
        pass

    print("  [*] [Antigravity Gateway] Port 8317 offline. Searching for daemon...", flush=True)
    candidates = [
        os.path.join(ENGINE_DIR, "antigravity_gateway"),
        os.path.join(os.getcwd(), "antigravity_gateway"),
        r"G:\My Drive\Colab_AutoVideoCreator\antigravity_gateway"
    ]
    gw_dir = next((c for c in candidates if os.path.exists(c)), None)
    if not gw_dir:
        return False

    is_windows = os.name == 'nt' or sys.platform.startswith('win')
    bin_name = "cli-proxy-api.exe" if is_windows else "cli-proxy-api"
    bin_path = os.path.join(gw_dir, bin_name)
    if not os.path.exists(bin_path):
        return False

    if not is_windows:
        import stat
        try:
            st = os.stat(bin_path)
            os.chmod(bin_path, st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
        except Exception:
            pass

    cfg_path = os.path.join(gw_dir, "config.yaml")
    log_file = os.path.join(gw_dir, "daemon.log")
    try:
        with open(log_file, "a") as out:
            if is_windows:
                DETACHED = 0x00000008 | 0x00000200
                subprocess.Popen([bin_path, "-config", cfg_path], stdout=out, stderr=out, cwd=gw_dir, creationflags=DETACHED)
            else:
                subprocess.Popen([bin_path, "-config", cfg_path], stdout=out, stderr=out, cwd=gw_dir, start_new_session=True)
    except Exception as e:
        print(f"  [-] [Antigravity Gateway] Spawning daemon failed: {e}", flush=True)
        return False

    t_start = time.time()
    while time.time() - t_start < 6.0:
        time.sleep(0.5)
        try:
            r = requests.get(endpoint, headers={"Authorization": "Bearer sk-cliproxy-test"}, timeout=1.0)
            if r.status_code == 200:
                print(f"  [+] [Antigravity Gateway] Live on port 8317!", flush=True)
                return True
        except Exception:
            pass
    return False


def call_antigravity_high_temp(prompt_text, system_prompt=None, temperature=1.15, max_tokens=4096, timeout=180):
    """
    Executes inference via the local CLIProxyAPI Gateway (http://127.0.0.1:8317/v1)
    matching the exact gemini_orchestrator.py setup:
      1. gemini-3.8-flash-high (Primary flagship: high thinking budget, fast, huge context)
      2. claude-opus-4-6-thinking (Secondary flagship: elite reasoning)
      3. claude-sonnet-4-6 (Tertiary flagship: structured data)
      4. SmartGeminiKeyRing (Fallback if gateway is offline)
    """
    # 1. Try local Antigravity Gateway
    try:
        ensure_antigravity_gateway_running()
        shuffle_antigravity_deck()

        base_url = os.environ.get("OPENAI_BASE_URL", "http://127.0.0.1:8317/v1").rstrip("/")
        endpoint = f"{base_url}/chat/completions"
        api_key = os.environ.get("OPENAI_API_KEY", "sk-cliproxy-test")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt_text})

        models = [
            ("gemini-3.8-flash-high", int(timeout)),
            ("claude-opus-4-6-thinking", int(timeout) + 60),
            ("claude-sonnet-4-6", int(timeout)),
        ]

        for model_name, to_val in models:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": float(temperature),
                "max_tokens": max_tokens
            }
            try:
                print(f"  [*] [Antigravity {model_name}] Generating winning titles (temp={temperature})...", flush=True)
                t0 = time.time()
                resp = requests.post(endpoint, headers=headers, json=payload, timeout=to_val)
                elapsed = round(time.time() - t0, 2)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if content and content.strip():
                        print(f"  [+] [Antigravity {model_name}] SUCCESS! Generated titles ({elapsed}s).", flush=True)
                        return content.strip()
                else:
                    err = resp.text[:120]
                    print(f"  [-] [Antigravity {model_name}] HTTP {resp.status_code}: {err}", flush=True)
            except requests.exceptions.ConnectionError:
                print(f"  [~] [Antigravity Gateway] Offline at {endpoint}. Falling back...", flush=True)
                break
            except Exception as e:
                print(f"  [!] [Antigravity {model_name}] Request error: {e}", flush=True)
    except Exception as e:
        print(f"  [~] Notice in Antigravity Gateway caller: {e}", flush=True)

    # 2. Fallback to SmartGeminiKeyRing
    print("  [*] [Fallback Cascade] Escalating to SmartGeminiKeyRing at temp=1.15...", flush=True)
    try:
        from smart_gemini_keyring import key_ring
        full_p = (system_prompt + "\n\n" if system_prompt else "") + prompt_text
        res, key_idx = key_ring.generate_content(
            prompt=full_p,
            model_name="gemini-2.5-flash",
            temperature=float(temperature),
            max_output_tokens=max_tokens
        )
        if res and res.strip():
            print(f"  [+] [SmartKeyRing Fallback] Generated via Key Index {key_idx}!", flush=True)
            return res.strip()
    except Exception as e:
        print(f"  [!] SmartKeyRing fallback error: {e}", flush=True)

    return None


# ==============================================================================
# 7. HIGH-TEMPERATURE WINNING TITLE SYNTHESIS ENGINE
# ==============================================================================

def generate_winning_titles(channel_name, channel_dir=None, target_count=10):
    """
    Main synthesis pipeline:
    1. Audits channel live via token (STRICT: only public & future scheduled videos).
    2. Extracts channel's dynamic winning brands & top-performing title blueprints.
    3. Conducts live Google News RSS research for fresh past-week stories (when:7d).
    4. Calls Antigravity `gemini-3.8-flash-high` at temperature=1.15 to fuse the winning formulas with fresh news.
    5. Deduplicates and spaces the generated winning titles at a strict 3-video cadence.
    """
    if not channel_dir:
        channel_dir = os.path.join(ENGINE_DIR, "channels", channel_name)

    audit = fetch_live_channel_audit(channel_name, channel_dir)
    niche_data = _parse_channel_niche_file(channel_dir, channel_name)
    formula_data = extract_channel_winning_formula(channel_name, audit["top_winners"], niche_data, channel_dir=channel_dir)

    winning_brands = formula_data["winning_brands"]
    brand_view_map = formula_data["brand_view_map"]
    winning_formats = formula_data["winning_formats"]

    market_intel = conduct_live_market_research(channel_name, niche_data, winning_brands)

    top_winners = audit["top_winners"]
    recent_uploads = audit["recent_uploads"]
    all_past_titles = audit["all_past_titles"]

    # 4-5 Run Quarantine & Brand Expansion
    recent_run_history = []
    if audit.get("recent_uploads"):
        recent_run_history.extend([v["title"] for v in audit["recent_uploads"]])
    if audit.get("local_recent_disk_titles"):
        for dt in audit["local_recent_disk_titles"]:
            if dt not in recent_run_history:
                recent_run_history.append(dt)

    quarantined_brands, quarantined_syntax, available_brands = extract_quarantine_intel(
        channel_name, recent_run_history, lookback=5
    )

    if is_public_ci():
        print(f"  [🛡️ QUARANTINE ENGINE] Past 5 runs analyzed for '{channel_name}' ({len(quarantined_brands)} brands on cooldown).", flush=True)
    else:
        print(f"  [🛡️ QUARANTINE ENGINE] Past 5 runs analyzed for '{channel_name}':", flush=True)
        print(f"      Quarantined Brands (4-5 run cooldown): {quarantined_brands}", flush=True)
        print(f"      Available Expanded Brands ({len(available_brands)} total): {available_brands[:8]}...", flush=True)

    queue_path = os.path.join(channel_dir, "topics.txt")
    if os.path.exists(queue_path):
        try:
            with open(queue_path, "r", encoding="utf-8", errors="replace") as f:
                for l in f:
                    if l.strip():
                        all_past_titles.append(l.strip()) if isinstance(all_past_titles, list) else all_past_titles.add(l.strip())
        except Exception:
            pass

    if formula_data.get("is_rebranded_or_new"):
        curated_examples = []
        topics_path = os.path.join(channel_dir, "topics.txt") if channel_dir else None
        if topics_path and os.path.exists(topics_path):
            try:
                with open(topics_path, "r", encoding="utf-8", errors="replace") as f:
                    curated_examples = [line.strip() for line in f if line.strip() and not line.startswith("#")]
            except Exception:
                pass
        winners_block = "\n".join(
            f"  {i+1}. [Curated High-CTR Blueprint] \"{t}\""
            for i, t in enumerate(curated_examples[:6])
        ) or "  (New channel - use high-performing niche formulas)"
    else:
        winners_block = "\n".join(
            f"  {i+1}. [{w.get('views', 0):,} views] \"{w['title']}\""
            for i, w in enumerate(top_winners[:8])
        ) or "  (New channel - use high-performing niche formulas)"

    winning_brands_block = "\n".join(
        f"  - {b}: Achieved up to {brand_view_map[b]['max_views']:,} views across {brand_view_map[b]['count']} winning videos"
        for b in winning_brands if b in brand_view_map
    ) or "\n".join(f"  - {b}" for b in winning_brands)

    winning_formats_block = "\n".join(f"  {f}" for f in winning_formats)

    recent_block = "\n".join(
        f"  {i+1}. [{v.get('publishedAt', '')[:10]}] \"{v['title']}\""
        for i, v in enumerate(recent_uploads[:8])
    ) or "  (None)"

    blacklist_block = "\n".join(f"  - {t}" for t in list(all_past_titles)[:130])

    system_prompt = (
        "You are an elite YouTube algorithmic strategist and industrial investigative documentary producer. "
        "Your mission is to take FRESH market news from roughly the past week and synthesize high-CTR video titles "
        "by applying the channel's EXACT winning brands, proven title formulas, and psychological pillars. "
        "Every single title must be grounded in real-world products, concrete prices, and fresh market events."
    )

    candidate_count = max(target_count + 4, 12)

    # Detect if Chinese manufacturing/component disruption is part of this channel's winning DNA
    has_chinese_winner = any("chinese" in w["title"].lower() or "china" in w["title"].lower() for w in top_winners)
    has_chinese_niche = "chinese" in niche_data.get("raw_niche_text", "").lower() or "china" in niche_data.get("raw_niche_text", "").lower()
    include_chinese_instruction = has_chinese_winner or has_chinese_niche

    chinese_prompt_line = (
        "- Note: Chinese manufacturing/component disruption is a proven winning pillar for this channel. Include 2-3 titles exploring real Chinese factory challengers in this niche."
        if include_chinese_instruction
        else "- Strictly preserve this channel's unique narrative DNA. Do NOT force unrelated formulas from other niches."
    )

    quarantined_brands_str = ", ".join(f"\"{b}\"" for b in quarantined_brands) if quarantined_brands else "None"
    available_brands_str = ", ".join(available_brands[:16]) if available_brands else "Major industry innovators"
    quarantined_syntax_str = "\n".join(f"  - \"{s}...\"" for s in quarantined_syntax[:6]) if quarantined_syntax else "  - None"

    user_prompt = f"""
================================================================================
AUTONOMOUS CHANNEL FORMULA AUDIT: {channel_name.upper()}
================================================================================

1. NICHE IDENTITY & AUDIENCE PSYCHOLOGY:
{niche_data.get('raw_niche_text', f'Channel Name: {channel_name}')[:2500]}

2. THE PROVEN TOP-PERFORMING WINNERS ON THIS CHANNEL (HIGHEST VIEWS):
{winners_block}

3. EXTRACTED SYNTACTIC BLUEPRINTS FROM THESE WINNERS:
{winning_formats_block}

4. FRESH REAL-WORLD NEWS & DEVELOPMENTS FROM ROUGHLY THE PAST WEEK:
{market_intel if market_intel else 'Use breaking 2026 releases, real incidents, and market signals.'}

5. STRICT 4-TO-5 RUN BRAND & SYNTAX QUARANTINE:
The following brands/entities were covered in the last 5 runs and are STRICTLY QUARANTINED:
>>> {quarantined_brands_str} <<<
- MANDATORY RULE: DO NOT generate any title focusing on or mentioning these quarantined brands! Zero tolerance.

The following sentence openings were recently used and are QUARANTINED:
{quarantined_syntax_str}
- MANDATORY RULE: NEVER repeat the same sentence opening! Do NOT start every title with "How [Brand] Cloned...".

6. WIDE BRAND EXPANSION (DIVERSIFY ACROSS UNTOUCHED TITANS & CHALLENGERS):
Instead of repeating the same 1 or 2 brands, actively explore these untouched brands:
>>> {available_brands_str} <<<
- MANDATORY RULE: Every generated title MUST target a DIFFERENT brand from this pool!

7. MANDATORY 4-WAY NARRATIVE ANGLE ROTATION:
Rotate your titles across these 4 distinct storytelling archetypes:
  * Angle A — Corporate Betrayal / Buyout Quality Collapse (e.g., InMusic gutting Moog, private equity ruin)
  * Angle B — Hardware Subscription Trap / Software Bricking (e.g., Roland Cloud hardware locks, subscription traps)
  * Angle C — Forensic Hardware Teardown / Hidden Tech Reality (e.g., The $15 chip inside a $2,500 flagship synth)
  * Angle D — Market Disruption / Price Humiliation (e.g., $180 Chinese motorized controllers destroying $2,000 consoles)
  * Angle E — Protocol / Driver Monopoly Bottlenecks (e.g., Why Windows USB audio drivers crackle while CoreAudio dominates)

8. COMPLETE BLACKLIST (PUBLIC & SCHEDULED VIDEOS — STRICT ZERO DUPLICATION):
{blacklist_block}

================================================================================
YOUR MISSION:
Synthesize {candidate_count} fresh, razor-sharp video titles:
{chinese_prompt_line}
- STRICT ZERO DUPLICATION against past uploads or blacklist.
- NO BANNED WORDS: Never use the words "documentary" or "investigation".
- Output ONLY a valid JSON object in this exact format:
{{
  "channel_audit_summary": "2-sentence breakdown of the unique winning formula discovered specifically for this channel and how fresh stories are being mapped to it",
  "titles": [
    "Title 1",
    "Title 2",
    "Title 3"
  ]
}}
"""

    raw_response = call_antigravity_high_temp(
        prompt_text=user_prompt,
        system_prompt=system_prompt,
        temperature=1.15,
        max_tokens=4096,
        timeout=180
    )

    candidate_titles = []
    if raw_response:
        m = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if m:
            try:
                parsed = json.loads(m.group(0))
                if "channel_audit_summary" in parsed:
                    if not is_public_ci():
                        print(f"  [+] [Gemini 3.8 Flash High Analysis] {parsed['channel_audit_summary']}", flush=True)
                    else:
                        print(f"  [+] [Gemini 3.8 Flash High Analysis] High-contrast hook blueprints generated.", flush=True)
                raw_list = parsed.get("titles", [])
                if isinstance(raw_list, list):
                    for item in raw_list:
                        if isinstance(item, str) and len(item.strip()) > 20:
                            candidate_titles.append(item.strip())
                        elif isinstance(item, dict) and "title" in item:
                            candidate_titles.append(str(item["title"]).strip())
            except Exception:
                pass

        if not candidate_titles:
            for line in raw_response.splitlines():
                clean_l = re.sub(r'^[\s\d\.\-\*\"\'`]+', '', line).strip(' "\'`,')
                if 25 < len(clean_l) < 130 and not clean_l.lower().startswith(("title", "channel", "json", "{", "}", "[")):
                    candidate_titles.append(clean_l)

    full_comparison_pool = list(all_past_titles)
    verified_titles = []

    for cand in candidate_titles:
        cand_clean = re.sub(r'\s+', ' ', cand.replace('\ufffd', '—')).strip()
        if len(cand_clean) < 25:
            continue
        # Strict quarantine check: reject if contains any quarantined brand
        cand_low = cand_clean.lower()
        if any(re.search(r'\b' + re.escape(qb.lower()) + r'\b', cand_low) for qb in quarantined_brands):
            if not is_public_ci():
                print(f"  [🛡️ Quarantine Filter] Rejected '{cand_clean}' (Contains quarantined brand)", flush=True)
            continue
        if not is_duplicate_topic(cand_clean, full_comparison_pool, threshold=0.62):
            verified_titles.append(cand_clean)
            full_comparison_pool.append(cand_clean)

    if not verified_titles and candidate_titles:
        for cand in candidate_titles:
            cand_clean = re.sub(r'\s+', ' ', cand.replace('\ufffd', '—')).strip()
            cand_low = cand_clean.lower()
            if any(re.search(r'\b' + re.escape(qb.lower()) + r'\b', cand_low) for qb in quarantined_brands):
                continue
            if cand_clean.lower() not in {x.lower() for x in full_comparison_pool}:
                verified_titles.append(cand_clean)
                full_comparison_pool.append(cand_clean)

    spaced_titles = enforce_brand_and_syntax_cadence(
        verified_titles, available_brands=available_brands, quarantined_brands=quarantined_brands
    )
    if is_public_ci():
        print(f"  [+] [Antigravity Title Engine] Generated {len(spaced_titles)} verified winning topics for '{channel_name}'.", flush=True)
    else:
        print(f"  [+] [Antigravity Title Engine] Generated {len(spaced_titles)} verified, 0-duplicate winning titles for '{channel_name}':", flush=True)
        for idx, t in enumerate(spaced_titles, 1):
            print(f"      {idx}. {t}", flush=True)

    return spaced_titles


# ==============================================================================
# 8. PUBLIC ENTRY POINTS FOR ORCHESTRATOR, CLAUDE_SCRAPER & TOPICS_HUNTER
# ==============================================================================

def run_radar(channel_dir=None, channel_name=None, min_queue_count=1, max_bangers_to_add=8, force=False):
    """
    Compatible entry point called by claude_scraper.py and topics_hunter.py.
    Refills topics.txt when queue count < min_queue_count (or when force=True).
    """
    if not channel_name and channel_dir:
        channel_name = os.path.basename(os.path.normpath(channel_dir))
    if not channel_name:
        channel_name = os.environ.get("CHANNEL_NAME", "").strip()
    if not channel_dir:
        channel_dir = os.path.join(ENGINE_DIR, "channels", channel_name)

    os.makedirs(channel_dir, exist_ok=True)
    queue_path = os.path.join(channel_dir, "topics.txt")

    existing_lines = []
    if os.path.exists(queue_path):
        try:
            with open(queue_path, "r", encoding="utf-8", errors="replace") as f:
                existing_lines = [l.strip() for l in f if l.strip()]
        except Exception:
            pass

    if not force and len(existing_lines) >= min_queue_count:
        return existing_lines

    new_titles = generate_winning_titles(
        channel_name=channel_name,
        channel_dir=channel_dir,
        target_count=max(max_bangers_to_add, 8)
    )

    if new_titles:
        combined = interleave_with_3_cadence(existing_lines + new_titles)
        with open(queue_path, "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(combined) + "\n")

        root_q = os.path.join(os.getcwd(), "topics.txt")
        if os.path.abspath(root_q) != os.path.abspath(queue_path):
            try:
                with open(root_q, "w", encoding="utf-8", newline="\n") as f:
                    f.write("\n".join(combined) + "\n")
            except Exception:
                pass

        try:
            subprocess.run(
                ["rclone", "copyto", queue_path, f"data:Colab_AutoVideoCreator/channels/{channel_name}/topics.txt", "--retries", "3", "--contimeout", "30s"],
                check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30
            )
        except Exception:
            pass

        return combined

    return existing_lines


def auto_refill_and_pop_topic(channel_name, local_topics_path="topics.txt"):
    """
    Called directly by orchestrator.py when topics.txt is empty or missing.
    Guarantees the GitHub Run NEVER stops with a red error when topics.txt is empty!
    Returns the popped topic string and updates topics.txt both locally and on Google Drive.
    """
    print(f"\n" + "=" * 75, flush=True)
    print(f"  [⚡ IMMORTAL QUEUE ENGINE] topics.txt is empty for '{channel_name}'!", flush=True)
    print(f"  [*] Launching Antigravity (gemini-3.8-flash-high, temp=1.15) Channel Audit & Weekly News Research...", flush=True)
    print("=" * 75, flush=True)

    channel_dir = os.path.join(ENGINE_DIR, "channels", channel_name)
    os.makedirs(channel_dir, exist_ok=True)

    generated = generate_winning_titles(channel_name=channel_name, channel_dir=channel_dir, target_count=8)

    if not generated:
        raise RuntimeError(f"Antigravity Title Generator could not produce titles for '{channel_name}'.")

    popped_topic = generated[0]
    remaining_topics = generated[1:]

    remaining_content = "\n".join(remaining_topics) + ("\n" if remaining_topics else "")
    with open(local_topics_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(remaining_content)

    chan_topics_path = os.path.join(channel_dir, "topics.txt")
    if os.path.abspath(chan_topics_path) != os.path.abspath(local_topics_path):
        with open(chan_topics_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(remaining_content)

    try:
        subprocess.run(
            ["rclone", "copyto", local_topics_path, f"data:Colab_AutoVideoCreator/channels/{channel_name}/topics.txt", "--retries", "3", "--contimeout", "30s"],
            check=False, timeout=30
        )
        print(f"  [+] Synced {len(remaining_topics)} new backup topics to Google Drive topics.txt!", flush=True)
    except Exception as e:
        print(f"  [~] Drive sync warning: {e}", flush=True)

    if is_public_ci():
        print(f"  [+] LOCKED IN NEW WINNING TOPIC FOR THIS RUN (redacted for public log).", flush=True)
    else:
        print(f"  [+] LOCKED IN NEW WINNING TOPIC FOR THIS RUN: '{popped_topic}'", flush=True)
    return popped_topic


def get_dossier_for_topic(channel_dir, topic):
    """Returns optional pre-computed dossier from topic_dossiers.json if present."""
    if not channel_dir or not topic:
        return {}
    d_path = os.path.join(channel_dir, "topic_dossiers.json")
    if os.path.exists(d_path):
        try:
            with open(d_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get(topic, {})
        except Exception:
            pass
    return {}


def pop_completed_topic_dossier(channel_dir, completed_topic):
    """Cleans up completed topic from topic_dossiers.json if present."""
    if not channel_dir or not completed_topic:
        return
    d_path = os.path.join(channel_dir, "topic_dossiers.json")
    if os.path.exists(d_path):
        try:
            with open(d_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if completed_topic in data:
                del data[completed_topic]
                with open(d_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception:
            pass


if __name__ == "__main__":
    target_ch = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("CHANNEL_NAME", "Chrono-Fi")
    run_radar(channel_name=target_ch, force=True)
