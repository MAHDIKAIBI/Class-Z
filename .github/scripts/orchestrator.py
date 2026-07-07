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
skip_llm = os.environ.get("SKIP_LLM", "false") == "true"

rclone_cmd = [
    "rclone", "copy", f"mydrive:Colab_AutoVideoCreator", ".",
    "--exclude", "node_modules/**", "--exclude", "out/**", "--exclude", "src/**", "--exclude", "*.mp4", "--exclude", "requirements.txt",
    "--transfers", "16", "--checkers", "16", "--stats", "10s", "-v"
]

if skip_llm:
    print("  [*] SKIP_LLM is true. Excluding browser profile from download.")
    rclone_cmd.insert(-4, "--exclude")
    rclone_cmd.insert(-4, "gemini_selenium_profile/**")

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
override_string = ""
if action_type == "CREATE_FRESH":
    override_string = f"1|||{topic}|||1" # 1: Start fresh, topic, 1: Confirm
elif action_type == "CREATE_AUTOMATIC":
    override_string = f"2|||1" # 2: Start automatic, 1: Confirm
elif action_type == "RESUME":
    override_string = f"3|||1|||1" # 3: Select topic, 1: the topic (wait, it just selects the first one in the queue for now, the user can manage it if needed), 1: Resume

os.environ["CLOUD_OVERRIDE_INPUTS"] = override_string
os.environ["GITHUB_ACTIONS"] = "true" # Triggers the CI check

# 4. Execute the pipeline
print("Executing Video Creation Pipeline...")
try:
    subprocess.run(["xvfb-run", "-a", "python", "state_machine_scriptwriter.py"], check=True)
except subprocess.CalledProcessError as e:
    print(f"Pipeline failed with code {e.returncode}")
    sys.exit(1)

# 5. Extract Outputs for Render Matrix
vault_name = topic
total_frames = "0"
try:
    with open(f"public/channels/{channel_name}/{vault_name}/master_timeline.json", "r") as f:
        data = json.load(f)
        total_frames = str(len(data.get("timeline", [])))
except Exception as e:
    print(f"Failed to calculate frames: {e}")

# Write to GitHub Outputs
if "GITHUB_OUTPUT" in os.environ:
    with open(os.environ["GITHUB_OUTPUT"], "a") as f:
        f.write(f"vault_name={vault_name}\n")
        f.write(f"total_frames={total_frames}\n")

# 6. Upload Generated Assets Back to Google Drive
print("Uploading generated assets back to Google Drive...")
try:
    # Upload public channels (Voiceovers, timeline, images)
    subprocess.run(["rclone", "copy", f"public/channels/{channel_name}/{vault_name}", f"mydrive:Colab_AutoVideoCreator/public/channels/{channel_name}/{vault_name}"], check=True)
    
    # Upload WIP state and metadata
    subprocess.run(["rclone", "copy", f"channels/{channel_name}/to upload/{vault_name}", f"mydrive:Colab_AutoVideoCreator/channels/{channel_name}/to upload/{vault_name}"], check=True)
    
    # Also sync topics.txt in case it was modified (e.g. topic popped from queue)
    if os.path.exists("topics.txt"):
        subprocess.run(["rclone", "copyto", "topics.txt", "mydrive:Colab_AutoVideoCreator/topics.txt"], check=True)
except Exception as e:
    print(f"Failed to upload assets back to Drive: {e}")

print("=== CLOUD ORCHESTRATOR COMPLETE ===")
