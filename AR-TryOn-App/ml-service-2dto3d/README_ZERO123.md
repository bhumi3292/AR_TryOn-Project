Setup to enable real Zero123+InstantMesh pipeline

1) Install dependencies (use your conda env `ar-ml`):

```powershell
conda activate ar-ml
pip install -r requirements.txt
# Install torch/vision/audio using the PyTorch wheel matching your CUDA
# Example for CUDA 11.8 (Windows):
# pip install --index-url https://download.pytorch.org/whl/cu118 torch==2.7.1+cu118 torchvision==0.22.1+cu118 torchaudio==2.7.1+cu118
```

2) Hugging Face authentication (required if model repo requires auth):

```powershell
# Option A: interactive login
huggingface-cli login
# Option B: set environment variable for the session
$env:HUGGINGFACE_HUB_TOKEN = "hf_...your_token..."
# Or persist for future shells (Windows):
setx HUGGINGFACE_HUB_TOKEN "hf_...your_token..."
```

3) Optional: pre-download the Zero123 community pipeline repo and set an env var to point to it:

```powershell
# Download to a folder you control, then set:
$env:ZERO123_LOCAL_PATH = "E:\path\to\zero123plus-repo"
```

4) Start the ML service:

```powershell
python app.py
```

5) Troubleshooting tips:
- If `snapshot_download` fails with auth errors, confirm your HF token is valid and has necessary access.
- If Diffusers pipeline import fails, ensure `diffusers` version and `huggingface_hub` are up-to-date and compatible.
- For Windows, prefer installing PyTorch from the official wheels URL to match CUDA.

If you want, I can detect your current `torch` and `cuda` compatibility and produce exact install commands — tell me to proceed and I'll run the diagnostics for you.