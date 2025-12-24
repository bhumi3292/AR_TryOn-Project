import os
from rembg import remove, new_session
from PIL import Image, ImageOps

session = new_session("u2net")

def clean_image(input_path):
    output_path = input_path.replace(".png", "_cleaned.png")
    img = Image.open(input_path).convert("RGB")
    
    # 1. Remove Background
    img_rgba = remove(img, session=session, alpha_matting=True)
    
    # 2. Crop to the earring and add padding
    # This prevents spikes by ensuring the jewelry doesn't touch the image edge
    bbox = img_rgba.getbbox()
    if bbox:
        img_rgba = img_rgba.crop(bbox)
        # Add 15% white padding around the earring
        img_rgba = ImageOps.expand(img_rgba, border=int(max(img_rgba.size) * 0.15), fill=(0,0,0,0))
    
    # 3. Flatten onto pure white
    white_bg = Image.new("RGB", img_rgba.size, (255, 255, 255))
    white_bg.paste(img_rgba, mask=img_rgba.split()[3])
    
    # 4. Resize to 512x512 (Standard for InstantMesh)
    white_bg = white_bg.resize((512, 512), Image.LANCZOS)
    
    white_bg.save(output_path, "PNG")
    return output_path