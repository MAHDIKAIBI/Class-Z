FROM python:3.11-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV GOLDEN_CONTAINER=true
ENV HF_HOME=/opt/huggingface
ENV TORCH_HOME=/opt/torch_home

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

# 2. Latest Ollama Linux amd64 Binary (v0.34.0)
RUN curl -fsSL https://ollama.com/download/ollama-linux-amd64.tar.zst -o /tmp/ollama.tar.zst \
    && zstd -d -c /tmp/ollama.tar.zst | tar -xf - -C /usr \
    && rm -f /tmp/ollama.tar.zst

# 3. Pip & Build Tools
RUN pip install --no-cache-dir -U pip "setuptools<82.0.0" wheel

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
    faster-whisper==1.0.3 \
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
    && python -m playwright install --with-deps chromium \
    && pip install --no-cache-dir --no-deps "setuptools<82.0.0"

# 7. Pre-bake Qwen3-TTS 1.7B Model Weights (~3.5GB)
RUN huggingface-cli download Qwen/Qwen3-TTS-12Hz-1.7B-Base \
    && chmod -R 777 /opt/huggingface

# 8. Pre-bake WhisperX VAD Segmentation Model (~17.7MB)
RUN mkdir -p /opt/torch_home /root/.cache/torch \
    && curl -fsSL "https://huggingface.co/philschmid/pyannote-segmentation/resolve/main/pytorch_model.bin" -o /opt/torch_home/whisperx-vad-segmentation.bin \
    && cp /opt/torch_home/whisperx-vad-segmentation.bin /root/.cache/torch/whisperx-vad-segmentation.bin \
    && chmod -R 777 /opt/torch_home /root/.cache/torch

# 9. Verification Smoke Test (Runs through xvfb-run to verify X11, xauth, libraries, and model cache)
RUN ffmpeg -version && ffprobe -version && ollama --version \
    && xvfb-run -a python -c "import numpy; assert not numpy.__version__.startswith('2.'), f'NumPy 2.x detected: {numpy.__version__}'; import torch, whisperx, faster_whisper, librosa, seleniumbase, g4f, google.genai, nodriver, bing_image_downloader, fastapi, rembg, imagehash, pkg_resources, qwen_tts; print('Golden Environment Verified on Python 3.11 with NumPy 1.x, qwen_tts and xvfb-run!')" \
    && python -c "import os; cache_dir = os.path.join(os.environ['HF_HOME'], 'hub', 'models--Qwen--Qwen3-TTS-12Hz-1.7B-Base'); assert os.path.isdir(cache_dir), f'Qwen3-TTS model weights missing from {cache_dir}'; print('Qwen3-TTS Model Weights Verified in Container Cache!')"


