import requests
import io
from PIL import Image

buf = io.BytesIO()
Image.new('RGB',(1,1),(255,255,255)).save(buf, format='PNG')
buf.seek(0)

files = {'file': ('sample.png', buf, 'image/png')}
data = {'user_id':'69401eb883f6787889582ae2','product_id':'6941621469786e4677b3ed73'}

resp = requests.post('http://localhost:8000/convert-2d-to-3d', files=files, data=data)
print('POST /convert-2d-to-3d status:', resp.status_code)
try:
    print('response json:', resp.json())
except Exception:
    print('response text:', resp.text)
