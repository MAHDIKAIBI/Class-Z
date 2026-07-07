import os
import sys
import re
import datetime
import json
import shutil
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

def authenticate(channel_name):
    creds = None
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tokens_dir = os.path.join(script_dir, 'tokens')
    os.makedirs(tokens_dir, exist_ok=True)
    
    token_path = os.path.join(tokens_dir, f"{channel_name}_token.json")
    client_secrets_path = os.path.join(script_dir, 'client_secrets.json')

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(client_secrets_path):
                print(f"\n[!] FATAL ERROR: {client_secrets_path} not found!")
                print("You MUST download your OAuth 2.0 Client ID secrets from Google Cloud Console.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
    return creds

def upload_video(youtube, title, description, tags, mp4_path):
    print(f"\n[*] Initiating Resumable Upload to YouTube API...")
    
    # Schedule for 3:00 PM EST (20:00 UTC) tomorrow - The absolute prime time for US audiences
    now = datetime.datetime.utcnow()
    publish_time = now + datetime.timedelta(days=1)
    publish_time = publish_time.replace(hour=20, minute=0, second=0, microsecond=0)
    publish_iso = publish_time.isoformat() + "Z"
    
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": "2", # Autos & Vehicles
            "defaultLanguage": "en-US",
            "defaultAudioLanguage": "en-US"
        },
        "status": {
            "privacyStatus": "private", # Must be private to use publishAt
            "publishAt": publish_iso,
            "selfDeclaredMadeForKids": False
        },
        "recordingDetails": {
            "location": {
                "latitude": 34.052235, # Los Angeles, California
                "longitude": -118.243683,
                "description": "Los Angeles, California"
            }
        }
    }

    insert_request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=MediaFileUpload(mp4_path, chunksize=10 * 1024 * 1024, resumable=True)
    )

    response = None
    file_size_mb = os.path.getsize(mp4_path) / (1024 * 1024)
    while response is None:
        status, response = insert_request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            uploaded_mb = file_size_mb * status.progress()
            print(f"  [>] Uploading... {pct}% ({uploaded_mb:.1f} MB / {file_size_mb:.1f} MB)", flush=True)

    print(f"\n[+] Video Upload Complete! Video ID: {response['id']}")
    print(f"    Scheduled for: {publish_iso}")
    return response['id']

def set_thumbnail(youtube, video_id, thumb_path):
    if os.path.exists(thumb_path):
        print(f"[*] Attaching custom thumbnail from {thumb_path}...")
        try:
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumb_path)
            ).execute()
            print("[+] Thumbnail successfully attached!")
        except Exception as e:
            print(f"[!] Failed to attach thumbnail: {e}")
    else:
        print(f"[!] Thumbnail not found. Skipping.")

def main():
    print("=" * 60)
    print("   ClassZ - MCN YOUTUBE API UPLOADER")
    print("=" * 60)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = script_dir
    base_channels_dir = os.path.join(project_root, "channels")
    
    # Check if triggered by Automator
    auto_folder = os.environ.get("AUTO_TARGET_FOLDER")
    
    # Hardcoded channel for this specific drive
    target_channel = "ClassZ"
    
    if auto_folder:
        print(f"[AUTOMATIC MODE] Orchestrator provided Vault: {auto_folder}")
        vault_dir = auto_folder
    else:
        # MANUAL SELECTION MENU (No channel prompt, just video prompt)
        print(f"\n[+] Manual Mode. Locked to channel: {target_channel}")
        
        to_upload_dir = os.path.join(base_channels_dir, target_channel, "to upload")
        if not os.path.exists(to_upload_dir):
            print(f"[!] 'to upload' folder not found for {target_channel}.")
            sys.exit(1)
            
        videos = [d for d in os.listdir(to_upload_dir) if os.path.isdir(os.path.join(to_upload_dir, d))]
        if not videos:
            print(f"[!] No videos pending in {target_channel} 'to upload' folder.")
            sys.exit(1)
            
        print(f"\n[?] SELECT VIDEO IN '{target_channel}':")
        for i, v in enumerate(videos, 1):
            print(f"  {i}. {v}")
            
        if len(videos) == 1:
            print(f"  [AUTOMATIC] Auto-selected video: {videos[0]}")
            v_choice = 0
        else:
            try:
                v_choice = int(input("Enter video number: ").strip()) - 1
                if v_choice < 0 or v_choice >= len(videos):
                    raise ValueError
            except:
                print("[!] Invalid selection.")
                sys.exit(1)
                
        vault_dir = os.path.join(to_upload_dir, videos[v_choice])

    # Extract assets from Vault
    import glob
    mp4_files = glob.glob(os.path.join(vault_dir, "*.mp4"))
    
    if not mp4_files:
        print(f"[!] FATAL: Could not find any .mp4 file in Vault: {vault_dir}")
        sys.exit(1)
        
    mp4_path = mp4_files[0]
    thumb_path = os.path.join(vault_dir, "thumbnail.png")
    metadata_path = os.path.join(vault_dir, "metadata.json")
        
    if not os.path.exists(metadata_path):
        print(f"[!] FATAL: Could not find metadata.json in Vault: {vault_dir}")
        sys.exit(1)
        
    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
        
    raw_title = metadata.get("title", os.path.basename(vault_dir))
    description = metadata.get("description", "Premium documentary insights.")
    tags = metadata.get("tags", [])
    
    print(f"\n[+] Extracting exact pure title from Vault Metadata:")
    print(f"    --> \"{raw_title}\"")
    
    creds = authenticate(target_channel)
    youtube = build("youtube", "v3", credentials=creds)
    
    # Check for A/B testing thumbnails
    import glob
    all_thumbs = glob.glob(os.path.join(vault_dir, "*.png")) + glob.glob(os.path.join(vault_dir, "*.jpg"))
    if len(all_thumbs) > 1:
        print(f"\n[+] A/B Testing Detected: Found {len(all_thumbs)} thumbnails in the Vault.")
        print(f"    -> Uploading primary thumbnail. You can configure the A/B test in YouTube Studio later.")
    


    video_id = upload_video(youtube, raw_title, description, tags, mp4_path)
    set_thumbnail(youtube, video_id, thumb_path)
    
    
    # MOVE FOLDER TO 'uploaded'
    uploaded_dir = os.path.join(base_channels_dir, target_channel, "uploaded")
    os.makedirs(uploaded_dir, exist_ok=True)
    destination = os.path.join(uploaded_dir, os.path.basename(vault_dir))
    
    try:
        shutil.move(vault_dir, destination)
        print(f"\n[+] SUCCESS! Vault moved to {destination}")
        
        # PUSH SEO BLOG POST TO GITHUB AND GOOGLE DRIVE
        # ---------------------------------------------------------
        blog_post_path = os.path.join(destination, "blog_post.json")
        
        if os.path.exists(blog_post_path):
            print("\n[*] SEO Blog Post found from Scriptwriter phase. Deploying...")
            import subprocess
            try:
                with open(blog_post_path, "r", encoding="utf-8") as f:
                    post_data = json.load(f)
                
                real_url = f"https://www.youtube.com/watch?v={video_id}"
                
                # Replace the powerful placeholder backlinks inside the HTML!
                html_content = post_data.get("htmlContent", "")
                html_content = html_content.replace("[YOUTUBE_VIDEO_LINK]", real_url)
                
                # Create HTML file
                safe_slug = post_data.get("slug", os.path.basename(vault_dir).replace(" ", "-"))
                html_filename = f"{safe_slug}.html"
                
                blog_output_dir = os.path.join(project_root, "blog_posts")
                os.makedirs(blog_output_dir, exist_ok=True)
                local_html_path = os.path.join(blog_output_dir, html_filename)
                
                with open(local_html_path, "w", encoding="utf-8") as f:
                    f.write(html_content)
                
                print(f"  [+] Injected massive YouTube backlinks into HTML: {real_url}")
                
                # 1. Push to GitHub (ClassZ repository)
                subprocess.run(["git", "add", "blog_posts/"], cwd=project_root, check=True)
                subprocess.run(["git", "commit", "-m", f"Auto-publish SEO blog post: {html_filename}"], cwd=project_root, check=True)
                subprocess.run(["git", "push"], cwd=project_root, check=True)
                print("  [+] Successfully pushed blog to GitHub (ClassZ/blog_posts/)!")
                
                # 2. Push to Google Drive (G: and H:) using rclone
                # It will upload to Sales-page/src/pages and sales-page/src/pages
                try:
                    print("  [*] Pushing HTML directly to Google Drive (Sales-page/src/pages)...")
                    subprocess.run(["rclone", "copy", local_html_path, "mydrive:Sales-page/src/pages"], check=True)
                    print("  [*] Pushing HTML directly to Google Drive (sales-page/src/pages)...")
                    subprocess.run(["rclone", "copy", local_html_path, "mydrive:sales-page/src/pages"], check=True)
                    print("  [+] Successfully pushed blog to Google Drive! It will sync to G:\\ and H:\\ instantly.")
                except Exception as rclone_e:
                    print(f"  [!] Failed to push to Google Drive via rclone: {rclone_e}")
                
            except Exception as e:
                print(f"  [!] Failed to publish the SEO blog post: {e}")
        else:
            print("\n[-] No blog_post.json found in workspace. Skipping auto-blog deploy.")

    except Exception as e:
        print(f"\n[!] Video uploaded, but failed to move folder to uploaded directory: {e}")
    
    print("\n[=== PUBLISH PIPELINE COMPLETE ===]")

if __name__ == "__main__":
    main()

