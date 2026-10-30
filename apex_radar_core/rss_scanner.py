import os
import sys
import datetime
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
import requests

def fetch_channel_rss_feed(channel_info: dict) -> dict:
    """
    Fetches and parses a single channel's RSS feed.
    Returns channel info with list of recent video items.
    """
    channel_id = channel_info.get("channel_id")
    rss_url = channel_info.get("rss_url") or f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"

    try:
        resp = requests.get(rss_url, timeout=6)
        if resp.status_code != 200:
            return {"channel_id": channel_id, "channel_name": channel_info.get("channel_name", "Unknown"), "videos": []}

        root = ET.fromstring(resp.text)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}

        channel_title = channel_info.get("channel_name") or "Unknown"
        title_elem = root.find('atom:title', ns)
        if title_elem is not None and title_elem.text:
            channel_title = title_elem.text

        videos = []
        for entry in root.findall('atom:entry', ns):
            vid_elem = entry.find('yt:videoId', ns)
            t_elem = entry.find('atom:title', ns)
            pub_elem = entry.find('atom:published', ns)

            if vid_elem is not None and t_elem is not None and pub_elem is not None:
                vid_id = vid_elem.text
                title = t_elem.text
                pub_raw = pub_elem.text

                # Parse date
                try:
                    # e.g. 2026-08-20T14:30:00+00:00
                    pub_dt = datetime.datetime.fromisoformat(pub_raw.replace("Z", "+00:00"))
                    now_dt = datetime.datetime.now(pub_dt.tzinfo)
                    age_hours = max(1.0, (now_dt - pub_dt).total_seconds() / 3600.0)
                    age_days = round(age_hours / 24.0, 1)
                except Exception:
                    age_hours = 24.0
                    age_days = 1.0

                videos.append({
                    "video_id": vid_id,
                    "title": title,
                    "url": f"https://www.youtube.com/watch?v={vid_id}",
                    "published": pub_raw,
                    "age_hours": round(age_hours, 1),
                    "age_days": age_days,
                    "channel_id": channel_id,
                    "channel_name": channel_title
                })

        return {
            "channel_id": channel_id,
            "channel_name": channel_title,
            "videos": videos
        }
    except Exception:
        return {"channel_id": channel_id, "channel_name": channel_info.get("channel_name", "Unknown"), "videos": []}

def scan_all_seeds_parallel(seeds: list, max_workers: int = 30) -> list:
    """
    Scans hundreds of RSS feeds concurrently in 2-4 seconds total.
    Returns list of channel dictionaries containing their recent uploads.
    """
    if not seeds:
        return []

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(fetch_channel_rss_feed, s) for s in seeds]
        for f in futures:
            try:
                res = f.result()
                if res and res.get("videos"):
                    results.append(res)
            except Exception:
                pass

    return results
