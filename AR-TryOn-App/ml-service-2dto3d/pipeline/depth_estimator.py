from transformers import pipeline
from PIL import Image
import torch
import numpy as np
import logging

logger = logging.getLogger("DepthEstimator")

# Global pipe cache to avoid reloading
_depth_pipe = None

def get_depth_pipe():
    global _depth_pipe
    if _depth_pipe is None:
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading Depth-Anything model on {device}...")
            # Using LiheYoung/depth-anything-small-hf as it is stable
            _depth_pipe = pipeline("depth-estimation", model="LiheYoung/depth-anything-small-hf", device=device)
            logger.info("Depth model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load depth model: {e}")
            raise e
    return _depth_pipe

def estimate_depth(image_path: str):
    """
    Estimates depth map from image using Depth Anything model.
    Returns: (depth_array, rgb_image)
    """
    pipe = get_depth_pipe()
    
    # Load and convert to RGB (Depth model usually expects RGB)
    image = Image.open(image_path).convert("RGB")
    
    # Inference
    try:
        # returns dict with 'depth' (PIL Image)
        result = pipe(image)
        depth_map = result["depth"]
    except Exception as e:
        raise ValueError(f"Depth inference failed: {e}")
    
    # Convert to numpy float32
    depth_array = np.array(depth_map).astype(np.float32)
    
    # Variance Check (FAIL HARD)
    # If the variance is very low, the image is likely flat or blank
    variance = np.var(depth_array)
    logger.info(f"Depth Map Variance: {variance:.2f}")
    
    if variance < 50: # Adjust threshold based on testing, but 50 is conservative for normalized 0-255 map
         raise ValueError(f"Depth estimation uncertain: Image is too flat (Variance {variance:.2f} < 50)")
         
    return depth_array, image
