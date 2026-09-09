FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# 1. System Tools, Audio DSP & Ubuntu FFmpeg/FFprobe
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    sox \
    libsox-fmt-all \
    rubberband-cli \
    xvfb \
    xclip \
    pciutils \
    lshw \
    zstd \
    rclone \
    jq \
    curl \
    wget \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Pinned Ollama Linux amd64 Binary (v0.3.10)
RUN curl -fsSL https://github.com/ollama/ollama/releases/download/v0.3.10/ollama-linux-amd64.tgz -o /tmp/ollama.tgz \
    && tar -xzf /tmp/ollama.tgz -C /usr \
    && rm -f /tmp/ollama.tgz

# 3. Pip & Build Tools
RUN pip install --no-cache-dir -U pip setuptools wheel

# 4. PyTorch CPU (~800MB instead of 5GB CUDA)
RUN pip install --no-cache-dir \
    torch==2.3.1+cpu \
    torchvision==0.18.1+cpu \
    torchaudio==2.3.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# 5. Audio, Speech & Alignment Libraries
RUN pip install --no-cache-dir \
    "numpy<2.0.0" \
    scipy==1.13.1 \
    soundfile==0.12.1 \
    librosa==0.10.2.post1 \
    pedalboard==0.8.14 \
    pyloudnorm==0.1.1 \
    pydub==0.25.1 \
    pyrubberband==0.3.0 \
    faster-whisper==1.0.3 \
    whisperx==3.1.1 \
    transformers==4.41.2 \
    huggingface_hub==0.23.4 \
    qwen-tts

# 6. Automation, Scraping, Vision, Media & LLMs
RUN pip install --no-cache-dir \
    playwright==1.44.0 \
    playwright-stealth==1.0.6 \
    selenium==4.21.0 \
    seleniumbase==4.27.6 \
    undetected-chromedriver==3.5.5 \
    beautifulsoup4==4.12.3 \
    pyperclip==1.8.2 \
    opencv-python-headless==4.9.0.80 \
    Pillow==10.3.0 \
    yt-dlp==2024.5.27 \
    youtube-transcript-api==0.6.2 \
    ddgs==1.5.0 \
    duckduckgo-search==5.3.1b1 \
    g4f==0.3.2.7 \
    curl_cffi==0.7.0b4 \
    aiohttp==3.9.5 \
    nest_asyncio==1.6.0 \
    google-genai==0.1.1 \
    google-generativeai==0.6.0 \
    openai==1.30.5 \
    google-api-python-client==2.131.0 \
    google-auth-httplib2==0.2.0 \
    google-auth-oauthlib==1.2.0 \
    tweepy==4.14.0 \
    requests==2.32.3 \
    python-dotenv==1.0.1 \
    filelock==3.14.0

# 7. Verification Smoke Test
RUN ffmpeg -version && ffprobe -version && ollama --version \
    && python -c "import torch, whisperx, faster_whisper, librosa, playwright, seleniumbase, g4f; print('Golden Environment Verified!')"
