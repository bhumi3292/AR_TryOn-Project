import io
import os
import rembg
import numpy as np
from PIL import Image

def clean_image(input_path: str) -> str:
    """
    Removes background using Rembg. 
    Fails HARD if object detection is weak or image is empty.
    Returns path to the cleaned RGBA image.
    """
    output_path = input_path.replace('.png', '_cleaned.png')
    
    # 1. Read Input
    try:
        with open(input_path, "rb") as f:
            input_data = f.read()
    except IOError:
        raise ValueError(f"Could not read input file: {input_path}")
    
    # 2. Background Removal (Rembg)
    try:
        # returns bytes
        result_data = rembg.remove(input_data)
        image = Image.open(io.BytesIO(result_data)).convert("RGBA")
    except Exception as e:
        raise ValueError(f"Rembg execution failed: {str(e)}")
    
    # 3. Validation: Check alpha channel
    alpha = np.array(image)[:, :, 3]
    
    # Check 1: Is it empty?
    if np.max(alpha) < 10:
        raise ValueError("Background removal failed: No object detected (Alpha channel empty)")
    
    # Check 2: Is it too small? (e.g. < 5% of canvas)
    # Using 10 as threshold for "visible" pixel
    coverage = np.sum(alpha > 10) / alpha.size
    if coverage < 0.05:
        raise ValueError(f"Background removal failed: Object too small, likely noise ({coverage*100:.2f}% coverage)")

    # 4. Crop & Center
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    else:
        raise ValueError("Background removal failed: Bounding box is empty")
    
    # Resize to standard size (e.g. 1024x1024) with padding
    target_size = 1024
    new_img = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    
    # Scale fit to 90%
    w, h = image.size
    scale = min(target_size / w, target_size / h) * 0.9 
    new_w, new_h = int(w * scale), int(h * scale)
    
    # Create high-quality resize
    image = image.resize((new_w, new_h), Image.LANCZOS)
    
    # Center paste
    paste_x = (target_size - new_w) // 2
    paste_y = (target_size - new_h) // 2
    new_img.paste(image, (paste_x, paste_y), image)
    
    # Save
    new_img.save(output_path, "PNG")
    return output_path