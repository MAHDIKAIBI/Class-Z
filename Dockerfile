FROM python:3.11-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV GOLDEN_CONTAINER=true

# 1. System Tools, Audio DSP, X11/Xvfb, Firefox & Ubuntu/Debian FFmpeg/FFprobe
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    sox \
    libsox-fmt-all \
    rubberband-cli \
    xvfb \
    xauth \
    xclip \
    pciutils \
    lshw \
    zstd \
    rclone \
    jq \
    curl \
    wget \
    git \
    sudo \
    procps \
    firefox-esr \
    fonts-liberation \
    ca-certificates \
    && ln -sf /usr/bin/firefox-esr /usr/bin/firefox \
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
    scipy \
    soundfile \
    librosa==0.10.1 \
    pedalboard==0.9.23 \
    pyloudnorm==0.2.0 \
    pydub==0.25.1 \
    pyrubberband==0.4.0 \
    faster-whisper==1.2.1 \
    whisperx==3.1.1 \
    transformers==4.57.3 \
    "huggingface_hub[cli]" \
    qwen-tts==0.1.1

# 6. Automation, Chromium, Scraping, Vision & LLMs
RUN pip install --no-cache-dir \
    "numpy<2.0.0" \
    playwright \
    playwright-stealth==2.0.3 \
    selenium \
    seleniumbase==4.51.8 \
    undetected-chromedriver==3.5.5 \
    beautifulsoup4 \
    pyperclip \
    "opencv-python-headless<5.0.0" \
    Pillow \
    yt-dlp \
    youtube-transcript-api \
    ddgs \
    duckduckgo-search \
    g4f==8.1.7 \
    curl_cffi \
    aiohttp \
    nest_asyncio \
    google-genai \
    google-generativeai \
    openai \
    google-api-python-client \
    google-auth-httplib2 \
    google-auth-oauthlib \
    tweepy \
    requests \
    python-dotenv \
    filelock \
    nodriver \
    bing-image-downloader \
    fastapi \
    rembg \
    imagehash \
    && python -m playwright install --with-deps chromium

# 7. Verification Smoke Test (Runs through xvfb-run to verify X11, xauth, and libraries)
RUN ffmpeg -version && ffprobe -version && ollama --version \
    && xvfb-run -a python -c "import numpy; assert not numpy.__version__.startswith('2.'), f'NumPy 2.x detected: {numpy.__version__}'; import torch, whisperx, faster_whisper, librosa, seleniumbase, g4f, google.genai, nodriver, bing_image_downloader, fastapi, rembg, imagehash; print('Golden Environment Verified on Python 3.11 with NumPy 1.x and xvfb-run!')"

