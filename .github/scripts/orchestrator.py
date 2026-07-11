import os
import sys
import subprocess
import json

action_type = os.environ.get("ACTION_TYPE")
channel_name = os.environ.get("CHANNEL_NAME")
topic = os.environ.get("TOPIC")

print(f"=== CLOUD ORCHESTRATOR START ===")
print(f"Action: {action_type}")
print(f"Channel: {channel_name}")
print(f"Topic: {topic}")

# 1. Download Core Scripts
print("Downloading core scripts from Google Drive...")
ready_to_render = os.environ.get("READY_TO_RENDER", "false") == "true"
skip_profile = os.environ.get("SKIP_PROFILE", "false") == "true"

if ready_to_render:
    print("\n[SUCCESS] Pipeline is 100% READY TO RENDER!")
    print("          Bypassing all downloading and generation steps in Job 1.")
    print("          Exiting successfully to trigger the 18-Machine Render Matrix!")
    
    # We still need to write output variables so Job 2 knows what to render
    vault_name = topic
    total_frames = "0"
    
    # Try to read the timeline directly from Drive to count frames
    try:
        result = subprocess.run(["rclone", "cat", f"data:Colab_AutoVideoCreator/channels/{channel_name}/to upload/{topic}/master_timeline.json"], stdout=open("timeline.json", "w"), check=False)
        if result.returncode != 0:
            subprocess.run(["rclone", "cat", f"data:Colab_AutoVideoCreator/public/channels/{channel_name}/{topic}/master_timeline.json"], stdout=open("timeline.json", "w"), check=True)
            
        with open("timeline.json", "r") as f:
            data = json.load(f)
            total_ms = data.get("meta", data.get("metadata", {})).get("total_duration_ms")
            if total_ms:
                total_frames = str(round((total_ms / 1000) * 30) + 60)
            else:
                total_frames = "360"
    except Exception as e:
        print(f"Failed to calculate frames from drive: {e}")
        
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"vault_name={vault_name}\n")
            f.write(f"total_frames={total_frames}\n")
            
    print("=== CLOUD ORCHESTRATOR COMPLETE ===")
    sys.exit(0)

rclone_cmd = [
    "rclone", "copy", f"engine:Colab_AutoVideoCreator", ".",
    "--exclude", "node_modules/**", "--exclude", "out/**", "--exclude", "src/**", "--exclude", "*.mp4", "--exclude", "requirements.txt",
    "--exclude", "DELETE_THIS_WHEN_SELLING_firefox_profile/**", "--exclude", "firefox_stealth_profile/**", "--exclude", "gemini_selenium_profile/**", "--exclude", "ChatTTS_Models/**",
    "--transfers", "16", "--checkers", "16", "--stats", "10s", "-v"
]

if skip_profile:
    print("  [*] SKIP_PROFILE is true. Excluding browser profile from download.")
    rclone_cmd.extend(["--exclude", "gemini_selenium_profile/**"])

subprocess.run(rclone_cmd, check=True)

# 2. Setup Python environment
print("Installing Python dependencies...")
if os.path.exists("requirements.txt"):
    subprocess.run(["pip", "install", "-r", "requirements.txt"], check=True)
else:
    # Fallback to essential packages
    subprocess.run(["pip", "install", "playwright", "requests", "openai", "moviepy", "pydub"], check=True)

subprocess.run(["playwright", "install", "chromium"], check=True)

# 3. Formulate Input Overrides for the scripts
if not topic and action_type in ["CREATE_FRESH", "CREATE_AUTOMATIC"]:
    print(f"[*] Topic is empty. Auto-popping from Google Drive queue...")
    subprocess.run(["rclone", "copyto", f"data:Colab_AutoVideoCreator/channels/{channel_name}/topics.txt", "topics.txt"], check=False)
    
    if os.path.exists("topics.txt"):
        with open("topics.txt", "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]
        if lines:
            topic = lines[0]
            with open("topics.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(lines[1:]) + "\n")
            print(f"[+] Successfully popped topic: '{topic}'")
            
            # Immediately sync it back
            subprocess.run(["rclone", "copyto", "topics.txt", f"data:Colab_AutoVideoCreator/channels/{channel_name}/topics.txt"], check=False)
            print("[+] Queue file successfully updated on Google Drive.")
        else:
            print("[!] topics.txt is empty!")
            sys.exit(1)
    else:
        print(f"[!] topics.txt not found at data:Colab_AutoVideoCreator/channels/{channel_name}/topics.txt!")
        sys.exit(1)
        
    action_type = "CREATE_FRESH"

override_string = ""
if action_type == "CREATE_FRESH":
    override_string = f"1|||{topic}|||1" # 1: Start fresh, topic, 1: Confirm
elif action_type == "CREATE_AUTOMATIC":
    override_string = f"2|||1" # 2: Start automatic, 1: Confirm
elif action_type == "RESUME":
    override_string = f"3|||{topic}|||1" # 3: Select topic, {topic}: the exact topic string, 1: Resume

os.environ["CLOUD_OVERRIDE_INPUTS"] = override_string
os.environ["ACTION_TYPE"] = action_type
if topic:
    os.environ["TOPIC"] = topic
os.environ["GITHUB_ACTIONS"] = "true" # Triggers the CI check

# 4. Execute the pipeline
print("Executing Video Creation Pipeline...")
try:
    subprocess.run(["xvfb-run", "-a", "python", "state_machine_scriptwriter.py"], check=True)
except subprocess.CalledProcessError as e:
    print(f"Pipeline failed with code {e.returncode}")
    sys.exit(1)

# 5. Read the actual vault that was processed (written by state_machine_scriptwriter.py)
# state_machine_scriptwriter.py writes generated_vault.txt the moment it locks in its vault.
# This is the single source of truth — no guesswork, no filesystem scanning.
vault_name = topic  # default fallback if file doesn't exist
manifest_path = "generated_vault.txt"
if os.path.exists(manifest_path):
    with open(manifest_path, "r", encoding="utf-8") as f:
        read_vault = f.read().strip()
    if read_vault:
        vault_name = read_vault
        print(f"[+] Vault confirmed from manifest: '{vault_name}'")
        if vault_name != topic:
            print(f"    (Note: TOPIC input was '{topic}' — state machine processed '{vault_name}' from queue)")
    else:
        print(f"[!] generated_vault.txt was empty, falling back to TOPIC input: '{topic}'")
else:
    print(f"[!] generated_vault.txt not found — falling back to TOPIC input: '{topic}'")

# 6. Immediately upload ALL generated files to Drive (don't wait for brain_job)
print(f"[+] Instant Drive Sync: Uploading '{vault_name}' assets to Google Drive NOW...")
try:
    # Upload public workspace (script.txt, thumbnail, any wavs already there)
    ws_path = f"public/channels/{channel_name}/{vault_name}"
    if os.path.isdir(ws_path):
        subprocess.run(["rclone", "copy", ws_path,
                        f"data:Colab_AutoVideoCreator/public/channels/{channel_name}/{vault_name}",
                        "--transfers", "16", "-v"], check=False)
        print(f"[+] Uploaded public workspace to Drive.")

    # Upload vault metadata folder (metadata.json, topics.txt, etc.)
    vault_meta = f"channels/{channel_name}/to upload/{vault_name}"
    if os.path.isdir(vault_meta):
        subprocess.run(["rclone", "copy", vault_meta,
                        f"data:Colab_AutoVideoCreator/channels/{channel_name}/to upload/{vault_name}",
                        "--transfers", "16", "-v"], check=False)
        print(f"[+] Uploaded vault metadata to Drive.")

    # Sync topics.txt if it was modified
    if os.path.exists("topics.txt"):
        subprocess.run(["rclone", "copyto", "topics.txt",
                        f"data:Colab_AutoVideoCreator/channels/{channel_name}/topics.txt"], check=False)
        print(f"[+] Synced topics.txt to Drive.")
except Exception as e:
    print(f"[!] Drive sync warning: {e}")

# 7. Extract Outputs for Render Matrix
total_frames = "0"
try:
    with open(f"public/channels/{channel_name}/{vault_name}/master_timeline.json", "r") as f:
        data = json.load(f)
        total_ms = data.get("meta", data.get("metadata", {})).get("total_duration_ms")
        if total_ms:
            total_frames = str(round((total_ms / 1000) * 30) + 60)
        else:
            total_frames = "360"
except Exception as e:
    print(f"[*] Note: master_timeline.json not yet generated (normal at this stage): {e}")
    total_frames = "0"

# Write to GitHub Outputs
if "GITHUB_OUTPUT" in os.environ:
    with open(os.environ["GITHUB_OUTPUT"], "a") as f:
        f.write(f"vault_name={vault_name}\n")
        f.write(f"total_frames={total_frames}\n")

print(f"[+] Outputs: vault_name='{vault_name}', total_frames='{total_frames}'")
print("=== CLOUD ORCHESTRATOR COMPLETE ===")
