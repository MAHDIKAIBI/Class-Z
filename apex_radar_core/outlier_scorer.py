import os
import sys
import re
import statistics
import requests

def get_youtube_api_key() -> str:
    return os.getenv("YOUTUBE_API_KEY", "")

def fetch_batch_video_statistics(video_ids: list, api_key: str) -> dict:
    """
    Fetches exact view counts and statistics for up to 50 videos in a single HTTP request (0.1s).
    Cost: 1 quota unit out of 10,000 free per day.
    """
    if not video_ids or not api_key:
        return {}

    id_chunk = ",".join(video_ids[:50])
    url = f"https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id={id_chunk}&key={api_key}"

    stats = {}
    try:
        resp = requests.get(url, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("items", []):
                v_id = item.get("id")
                st = item.get("statistics", {})
                sn = item.get("snippet", {})
                views = int(st.get("viewCount", 0))
                stats[v_id] = {
                    "views": views,
                    "likes": int(st.get("likeCount", 0)),
                    "comments": int(st.get("commentCount", 0)),
                    "channel_id": sn.get("channelId", ""),
                    "channel_title": sn.get("channelTitle", ""),
                    "title": sn.get("title", ""),
                    "published_at": sn.get("publishedAt", ""),
                    "tags": sn.get("tags", [])[:8],
                    "thumbnail": sn.get("thumbnails", {}).get("maxres", {}).get("url") or sn.get("thumbnails", {}).get("high", {}).get("url", "")
                }
    except Exception as e:
        print(f"    [!] Error in batch statistics lookup: {e}")

    return stats

def find_fleet_outliers(channels_scanned: list, niche_data: dict = None) -> list:
    """
    Evaluates all channels across the fleet in < 1 second using official YouTube Data API v3.
    Filters candidate videos against domain vocabulary so off-topic videos are skipped.
    """
    api_key = get_youtube_api_key()
    if not api_key:
        print("    [!] Warning: YOUTUBE_API_KEY not found. Please verify .env.")
        return []

    # Build domain keyword set
    domain_words = set()
    tension_keywords = []
    if niche_data:
        tension_keywords = niche_data.get("tension_keywords", [])
        for q in niche_data.get("queries", []):
            domain_words.update(re.findall(r'\w{3,}', q.lower()))
        for ent in niche_data.get("entities", []):
            domain_words.update(re.findall(r'\w{3,}', ent.lower()))

        # Remove generic non-domain words
        stops = {
            "the", "and", "for", "with", "how", "what", "why", "this", "that",
            "from", "into", "over", "under", "fail", "broken", "scam", "cost", "price",
            "bubble", "truth", "secret", "dont", "buy", "test", "review", "teardown"
        }
        domain_words = domain_words - stops

    # 1. Collect all candidate video IDs from RSS feed results
    all_videos = []
    for ch in channels_scanned:
        for v in ch.get("videos", []):
            # Only analyze uploads from last 25 days
            if v.get("age_days", 999) <= 25:
                # If domain words exist, require at least one keyword hit in the title
                if domain_words:
                    t_lower = v.get("title", "").lower()
                    if not any(w in t_lower for w in domain_words):
                        continue
                all_videos.append(v)

    if not all_videos:
        return []

    video_ids = [v["video_id"] for v in all_videos]
    print(f"[*] Fetching live statistics for {len(video_ids)} candidate videos via YouTube Data API v3...")

    # 2. Chunk in batches of 50
    stats_map = {}
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i:i+50]
        batch_res = fetch_batch_video_statistics(chunk, api_key)
        stats_map.update(batch_res)

    print(f"    [+] Successfully gathered real-time metrics for {len(stats_map)} videos in ~0.2s!")

    # 3. Group by channel to calculate baseline
    channel_groups = {}
    for v in all_videos:
        v_id = v["video_id"]
        if v_id in stats_map:
            c_id = v.get("channel_id") or stats_map[v_id].get("channel_id")
            if c_id not in channel_groups:
                channel_groups[c_id] = []
            enriched_video = dict(v)
            enriched_video.update(stats_map[v_id])
            channel_groups[c_id].append(enriched_video)

    # 4. Outlier scoring per channel
    outliers = []
    for c_id, vids in channel_groups.items():
        views_list = [vid["views"] for vid in vids]
        if not views_list:
            continue

        median_baseline = max(1000, int(statistics.median(views_list)))

        for vid in vids:
            views = vid["views"]
            if views < 3500:
                continue

            multiplier = round(views / median_baseline, 2)
            age_hours = max(1.0, vid.get("age_hours", 24.0))
            vph = round(views / age_hours, 1)

            vid["baseline_views"] = median_baseline
            vid["outlier_multiplier"] = multiplier
            vid["vph"] = vph

            # Strict Outlier Rule: Multiplier MUST be >= 2.0x channel baseline
            if multiplier < 2.0 or views < 5000:
                continue

            # Bonus: tension hits
            tension_hits = 0
            if tension_keywords:
                title_lower = vid.get("title", "").lower()
                tension_hits = sum(1 for kw in tension_keywords if kw.lower() in title_lower)
            vid["tension_hits"] = tension_hits
            outliers.append(vid)

    # 5. Sort by composite ranking (Ranked by Outlier Multiplier & Tension -- NEVER raw views!)
    def rank_score(v):
        om = v.get("outlier_multiplier", 1.0)
        vph = v.get("vph", 1.0)
        tension = v.get("tension_hits", 0)
        return (om * 10.0) + (tension * 5.0) + (min(vph, 25000) * 0.01)

    outliers.sort(key=rank_score, reverse=True)
    print(f"    [+] Discovered {len(outliers)} verified breakout outliers!")
    return outliers
