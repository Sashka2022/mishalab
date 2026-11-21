"""Fetch explicitly selected Commons files, their individual licenses and local web copies.

Run with an input JSON list: python3 scripts/fetch-atlas-media.py requests.json.
The output is a JSON transfer bundle; scripts/import-atlas-media.py writes it locally.
The importer uses Pillow locally when making smaller photographic copies.
"""
import base64
import hashlib
import html
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

AGENT = 'MishalabCuriosityAtlas/1.0 (educational project; https://github.com/Sashka2022/mishalab)'


def request(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': AGENT}), timeout=35) as response:
        return response.read()


def plain(value):
    return html.unescape(re.sub('<[^>]*>', '', value)).strip()


def fetch_one(item):
    query = {'action': 'query', 'format': 'json', 'titles': 'File:' + item['file'],
             'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iilimit': 1, 'iiurlwidth': 1024}
    response = json.loads(request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(query)))
    page = next(iter(response['query']['pages'].values()))
    if 'imageinfo' not in page:
        raise ValueError('Commons file not found: ' + item['file'])
    info = page['imageinfo'][0]
    meta = info['extmetadata']
    field = lambda key: plain(meta.get(key, {}).get('value', ''))
    license_name = field('LicenseShortName')
    if not any(accepted in license_name.lower() for accepted in ['public domain', 'cc by', 'cc0']):
        raise ValueError('Review license before including: ' + item['file'] + ': ' + license_name)
    original = info['url'].split('?')[0]
    download = (original if original.lower().endswith('.svg') else info.get('thumburl', original)).split('?')[0]
    binary = request(download)
    changes = 'Unmodified original SVG.'
    extension = '.svg'
    if not original.lower().endswith('.svg'):
        extension = '.jpg'
        changes = 'Wikimedia proportional 1024 px thumbnail; no crop or generative edits.'
    record = {
        'id': item['id'], 'path': 'assets/atlas/' + item['id'] + extension,
        'source': info['descriptionurl'], 'original': original, 'downloadedFrom': download,
        'creator': field('Artist') or field('Credit'), 'credit': field('Credit'),
        'license': license_name, 'licenseUrl': field('LicenseUrl'),
        'restrictions': field('Restrictions'), 'modifications': changes,
        'width': info['width'], 'height': info['height'],
        'sha256': hashlib.sha256(binary).hexdigest(),
        'retrievedAt': '2026-11-21', 'base64': base64.b64encode(binary).decode('ascii')
    }
    if not record['creator']:
        raise ValueError('Missing creator: ' + item['file'])
    return record


if __name__ == '__main__':
    # REQUESTS can be supplied by the research runner; otherwise use an explicit local manifest.
    items = globals().get('REQUESTS')
    if items is None:
        with open(sys.argv[1], encoding='utf-8') as source:
            items = json.load(source)
    with ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(fetch_one, items))
    print(json.dumps(records, ensure_ascii=True))
