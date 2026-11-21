"""Import a transfer JSON from stdin. Preserve verified per-file attribution."""
import base64
import hashlib
import json
import io
from PIL import Image, ImageOps
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parents[1]
manifest_path = root / 'atlas' / 'media.json'
records = json.loads(manifest_path.read_text()) if manifest_path.exists() else []
by_id = {item['id']: item for item in records}
for item in json.load(sys.stdin):
    item = dict(item)
    binary = base64.b64decode(item.pop('base64'))
    if hashlib.sha256(binary).hexdigest() != item['sha256']:
        raise ValueError('Asset hash mismatch')
    if item['path'].endswith('.jpg'):
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(binary))).convert('RGB')
        image.thumbnail((1024, 850))
        output = io.BytesIO()
        image.save(output, 'WEBP', quality=80, method=6)
        binary = output.getvalue()
        item['path'] = item['path'][:-4] + '.webp'
        item['sha256'] = hashlib.sha256(binary).hexdigest()
        item['modifications'] = 'Resized proportionally and converted to WebP; no crop or generative edits.'
    destination = (root / item['path']).resolve()
    if not destination.is_relative_to(root / 'assets' / 'atlas'):
        raise ValueError('Asset path must be inside assets/atlas')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(binary)
    by_id[item['id']] = item
    print(item['id'], len(binary), item['license'])
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest_path.write_text(json.dumps(list(by_id.values()), ensure_ascii=False, indent=2) + '\n')
