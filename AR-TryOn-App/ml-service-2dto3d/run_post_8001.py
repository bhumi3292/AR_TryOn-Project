import requests
import os
from PIL import Image

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)
image_path = os.path.join(OUTPUT_DIR, "test_input_8001.png")
Image.new('RGB', (256, 256), color=(200, 120, 90)).save(image_path)

url = 'http://127.0.0.1:8001/convert-2d-to-3d'
with open(image_path, 'rb') as f:
    files = {'file': ('test_input_8001.png', f, 'image/png')}
    data = {'product_id': 'capture_8001_001'}
    resp = requests.post(url, files=files, data=data, timeout=30)
    print('POST response:', resp.status_code, resp.text)
