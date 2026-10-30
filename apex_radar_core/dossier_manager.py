import os
import sys
import json

DOSSIER_FILENAME = "topic_dossiers.json"
TOPICS_FILENAME = "topics.txt"

def get_dossier_file(channel_dir: str) -> str:
    return os.path.join(channel_dir, DOSSIER_FILENAME)

def get_topics_file(channel_dir: str) -> str:
    return os.path.join(channel_dir, TOPICS_FILENAME)

def load_all_dossiers(channel_dir: str) -> dict:
    """
    Returns the single-file dictionary of dossiers for this channel.
    Keyed by topic title.
    """
    path = get_dossier_file(channel_dir)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return {}

def save_all_dossiers(channel_dir: str, dossiers: dict):
    path = get_dossier_file(channel_dir)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(dossiers, f, indent=2, ensure_ascii=False)

def get_dossier_for_topic(channel_dir: str, topic_title: str) -> dict:
    dossiers = load_all_dossiers(channel_dir)
    clean_target = topic_title.strip().lower()
    for title, payload in dossiers.items():
        if title.strip().lower() == clean_target:
            return payload
    return {}

def append_dossier_and_topic(channel_dir: str, title: str, dossier_payload: dict):
    """
    Simultaneously appends to topics.txt and registers the rich dossier
    in the single topic_dossiers.json file.
    """
    clean_title = title.strip().strip('"').strip("'")
    if not clean_title:
        return

    # 1. Update topics.txt
    topics_path = get_topics_file(channel_dir)
    existing_lines = []
    if os.path.exists(topics_path):
        with open(topics_path, "r", encoding="utf-8") as f:
            existing_lines = [l.strip() for l in f.readlines() if l.strip()]

    if clean_title.lower() not in [l.lower() for l in existing_lines]:
        existing_lines.append(clean_title)
        with open(topics_path, "w", encoding="utf-8") as f:
            f.write("\n".join(existing_lines) + "\n")
        print(f"    [+] Enqueued topic to topics.txt: '{clean_title}'")

    # 2. Update topic_dossiers.json
    dossiers = load_all_dossiers(channel_dir)
    dossiers[clean_title] = dossier_payload
    save_all_dossiers(channel_dir, dossiers)
    print(f"    [+] Stamped rich intelligence dossier into {DOSSIER_FILENAME}.")

def pop_completed_topic_dossier(channel_dir: str, completed_topic: str):
    """
    Removes the topic from both topics.txt and topic_dossiers.json,
    and archives the completed dossier into uploaded/archived_dossiers.json.
    """
    clean_topic = completed_topic.strip()
    if not clean_topic:
        return

    # 1. Remove from topics.txt
    topics_path = get_topics_file(channel_dir)
    if os.path.exists(topics_path):
        with open(topics_path, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]
        new_lines = [l for l in lines if l.lower() != clean_topic.lower()]
        with open(topics_path, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines) + "\n" if new_lines else "")

    # 2. Pop from topic_dossiers.json
    dossiers = load_all_dossiers(channel_dir)
    popped_payload = None
    target_key = None
    for k in list(dossiers.keys()):
        if k.strip().lower() == clean_topic.lower():
            target_key = k
            popped_payload = dossiers.pop(k)
            break

    if target_key:
        save_all_dossiers(channel_dir, dossiers)

        # Archive to uploaded/ folder if it exists
        uploaded_dir = os.path.join(channel_dir, "uploaded")
        if os.path.exists(uploaded_dir) and popped_payload:
            archive_path = os.path.join(uploaded_dir, "archived_dossiers.json")
            archive = {}
            if os.path.exists(archive_path):
                try:
                    with open(archive_path, "r", encoding="utf-8") as f:
                        archive = json.load(f)
                except Exception:
                    pass
            archive[target_key] = popped_payload
            try:
                with open(archive_path, "w", encoding="utf-8") as f:
                    json.dump(archive, f, indent=2, ensure_ascii=False)
            except Exception:
                pass

    print(f"    [+] Cleanly removed '{clean_topic}' from queue and dossier ledger.")

def get_queue_count(channel_dir: str) -> int:
    """Returns number of pending topics in topics.txt."""
    topics_path = get_topics_file(channel_dir)
    if not os.path.exists(topics_path):
        return 0
    with open(topics_path, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]
    return len(lines)
