"""Original hand-authored SVG paths for MishaLab's approved sticker direction.

No image generator or third-party illustration is used. Regenerate with
python3 scripts/build-art-set.py. Existing Series A samples are kept intact.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/stickers'

def path(d, fill, extra=''):
    return f'<path d="{d}" fill="{fill}"{extra}/>'

def rect(x,y,w,h,fill,rx=0):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>'

def circle(x,y,r,fill):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>'

INK, GOLD, VIOLET, CORAL = '#203047','#F5C451','#6A61E8','#F47C6C'
MINT, LIGHT, CREAM, LAVENDER = '#81D3C0','#DDF5E9','#FFF8E8','#E8E5FF'
BLUE, WHITE = '#DCEAF4','#FFFFFF'
objects = {}

objects['abacus'] = (
    rect(98,80,316,350,GOLD,18) + rect(119,103,274,304,CREAM,8)
    + path('M120 170h272M120 255h272M120 340h272','none')
    + ''.join(rect(x,y,32,49,color,14) for y,color in [(145,CORAL),(230,VIOLET),(315,MINT)] for x in [132,175,218,279,322])
    + path('M104 430v12m304-12v12','none')
)
objects['ruler-compass'] = (
    path('M94 417V116l301 301ZM138 373V222l151 151Z',GOLD,' fill-rule="evenodd"')
    + path('M94 175h22m-22 51h22m-22 51h22m-22 51h22m37 89v-22m51 22v-22m51 22v-22m51 22v-22','none',' stroke-width="6"')
    + path('m260 127-61 233 28 39 67-264Z',VIOLET)
    + path('m293 133 66 240 26 27-46-268Z',MINT)
    + path('M278 110v-29h32v29','none')
    + circle(294,131,28,CREAM) + circle(294,131,9,GOLD)
    + path('m207 378-13 35m181-26 9 29','none')
)
objects['cubes'] = (
    path('m256 77 84 47-84 49-84-49Z',GOLD)
    + path('m172 124 84 49v104l-84-49Z',CORAL)
    + path('m256 173 84-49v104l-84 49Z',VIOLET)
    + path('m171 228 85 49-85 49-85-49Z',LIGHT)
    + path('m86 277 85 49v105l-85-49Z',MINT)
    + path('m171 326 85-49v105l-85 49Z',VIOLET)
    + path('m341 228 85 49-85 49-85-49Z',CREAM)
    + path('m256 277 85 49v105l-85-49Z',GOLD)
    + path('m341 326 85-49v105l-85 49Z',CORAL)
)
objects['balance'] = (
    path('M256 129v273','none',' stroke-width="17"')
    + path('M119 403h274l26 28H93Z',GOLD)
    + path('M111 163h290','none',' stroke-width="14"')
    + circle(256,128,24,GOLD)
    + path('m126 165-44 127h88Zm260 0-44 127h88Z','none')
    + path('M80 292h92c-4 48-23 72-46 72s-42-24-46-72Z',CORAL)
    + path('M340 292h92c-4 48-23 72-46 72s-42-24-46-72Z',MINT)
    + path('M109 321h34m212 0h34','none',' stroke="#FFFFFF" stroke-width="7"')
)
objects['puzzle-piece'] = (
    path('M134 118h87c-16-18-10-58 35-58s51 40 35 58h87v87c-18-16-58-10-58 35s40 51 58 35v119h-87c16-18 10-58-35-58s-51 40-35 58h-87v-87c18 16 58 10 58-35s-40-51-58-35Z',VIOLET)
    + path('M155 139h49m-49 0v71','none',' stroke="#E8E5FF" stroke-width="10"')
)
objects['light-bulb'] = (
    path('M144 205c0-67 46-113 112-113s112 46 112 113c0 43-19 69-48 96-18 17-23 37-23 51h-82c0-14-5-34-23-51-29-27-48-53-48-96Z',GOLD)
    + path('M218 352h76v43h-76Z',LAVENDER)
    + path('M218 371h76m-57 24v26h38v-26','none')
    + path('M241 351V244l-25-29m55 136V244l25-29m-55 29h30','none')
    + path('M184 188c4-33 25-54 52-62','none',' stroke="#FFF8E8" stroke-width="12"')
    + path('M256 50V26m-106 63-18-22m-31 125H74m35 97-23 14m297-111h27m-48-103 18-22m-15 222 23 14','none',' stroke="#F5C451" stroke-width="10"')
)
objects['matches'] = (
    path('m117 398 234-252','none',' stroke="#203047" stroke-width="29"')
    + path('m117 398 234-252','none',' stroke="#FFF8E8" stroke-width="15"')
    + path('m386 395-238-245','none',' stroke="#203047" stroke-width="29"')
    + path('m386 395-238-245','none',' stroke="#FFF8E8" stroke-width="15"')
    + path('M255 421V105','none',' stroke="#203047" stroke-width="29"')
    + path('M255 421V105','none',' stroke="#FFF8E8" stroke-width="15"')
    + circle(351,146,25,CORAL) + circle(148,150,25,CORAL) + circle(255,105,25,CORAL)
)
objects['tiles'] = (
    rect(88,88,336,336,LAVENDER,24)
    + ''.join(rect(105+col*104,105+row*104,94,94,GOLD if row==col==1 else [MINT,CREAM,VIOLET][(row+col)%3],14) for row in range(3) for col in range(3))
    + path('m256 230 8 17 19 3-14 13 3 19-16-9-17 9 4-19-14-13 19-3Z',CREAM,' stroke-width="6"')
)
objects['knight'] = (
    path('M133 405c4-63 38-93 53-129l-48-11-26-46 60-84 49-18 2-43 48 40c66 8 103 72 103 150v78l19 63Z',LAVENDER)
    + path('m174 135 33 35-66 77m131-129-7 80c-40 9-61 55-57 104','none')
    + circle(236,180,9,INK)
    + path('M134 405h259l14 29H120Z',VIOLET)
    + path('M269 137c46 31 61 80 58 137','none',' stroke="#FFFFFF" stroke-width="10"')
)
objects['rook'] = (
    path('M126 96h61v51h40V96h58v51h40V96h61v111l-48 23 15 150H159l15-150-48-23Z',LAVENDER)
    + path('M144 381h224l25 49H119Z',VIOLET)
    + path('M174 230h164M161 357h190','none')
    + path('M200 255v76','none',' stroke="#FFFFFF" stroke-width="12"')
)
objects['crown'] = (
    path('m99 179 79 63 78-125 78 125 79-63-44 186H143Z',GOLD)
    + rect(142,365,228,44,GOLD,12)
    + circle(99,167,19,CORAL) + circle(256,102,21,VIOLET) + circle(413,167,19,MINT)
    + path('m256 256 24 32-24 32-24-32Z',VIOLET)
    + circle(185,309,10,CORAL) + circle(327,309,10,MINT)
    + path('m144 228 19 64','none',' stroke="#FFF8E8" stroke-width="10"')
)
objects['chess-board'] = (
    rect(80,99,352,320,VIOLET,18)
    + ''.join(rect(96+col*80,111+row*72,80,72,CREAM if (row+col)%2==0 else LAVENDER,0) for row in range(4) for col in range(4))
    + path('M276 363c7-26 17-40 23-67h35c6 27 16 41 23 67Z',MINT)
    + rect(267,363,100,23,MINT,8)
    + circle(317,263,32,MINT)
    + path('M288 297h58','none')
)
objects['globe'] = (
    path('M256 365v46m-80 13h160','none',' stroke-width="14"')
    + path('M356 100c73 72 71 175-2 247-64 62-142 64-208 17','none',' stroke="#6A61E8" stroke-width="17"')
    + circle(245,227,139,BLUE)
    + path('m165 112 31 16 6 31-32 28 10 26-31 27-34-9c-6-51 12-94 50-119Z',MINT)
    + path('m210 217 29-21 36 16 5 26 34 6-3 29-33 8-21 52-30-29 4-39-21-17Z',MINT)
    + path('m310 107-9 38 22 28 20-12 31 30c-8-37-28-65-64-84Z',MINT)
    + path('m346 287-22 20 19 21 25-23Z',MINT)
    + path('M127 185c68 33 162 33 237-2M117 257c74 32 172 29 254-2','none',' stroke-width="5"')
)
objects['compass'] = (
    circle(256,257,168,GOLD) + circle(256,257,143,CREAM)
    + path('M256 126v23m0 216v23M125 257h23m216 0h23m-224-93 17 17m151 151 17 17m0-185-17 17m-151 151-17 17','none',' stroke-width="6"')
    + path('m315 151-32 133-86 79 32-133Z',VIOLET)
    + path('m197 363 32-133 54 54Z',MINT)
    + circle(256,257,17,GOLD)
    + path('M240 88V60h32v28','none')
)
objects['balloon'] = (
    path('M126 191c0-76 55-125 130-125s130 49 130 125c0 69-60 122-92 157h-76c-32-35-92-88-92-157Z',CORAL)
    + path('M218 348c-19-48-37-99-37-157 0-76 32-125 75-125s75 49 75 125c0 58-18 109-37 157Z',CREAM)
    + path('M244 348c-7-48-13-99-13-157 0-76 10-125 25-125s25 49 25 125c0 58-6 109-13 157Z',GOLD)
    + path('m220 348 10 47m62-47-10 47','none')
    + path('M216 393h80l-9 41h-62Z',MINT)
    + path('M146 205h220','none',' stroke-width="6"')
)
objects['treasure-map'] = (
    path('m83 124 115-35 115 35 116-35v297l-116 35-115-35-115 35Z',CREAM)
    + path('m198 89 115 35v297l-115-35Z',LIGHT)
    + path('M198 89v297m115-262v297','none')
    + path('m125 343 43-40 66 10 37-61 78-26 23-52','none',' stroke="#F47C6C" stroke-width="9" stroke-dasharray="12 17"')
    + path('m370 132 11 23 25 3-18 18 4 25-22-12-22 12 5-25-19-18 25-3Z',GOLD)
    + path('m113 173 20-19 20 19m-40 0h40m185 162 15-18 16 18m-31 0h31','none',' stroke-width="6"')
    + circle(126,343,10,VIOLET)
)
objects['crane'] = (
    path('m251 263-133-150 28 179Z',CREAM)
    + path('m251 263 155-107-72 160Z',LIGHT)
    + path('m146 292 105-29 83 53-90 69Z',LAVENDER)
    + path('m244 385 7-122 30 69Z',CREAM)
    + path('m146 292-44 16-29-56 45-139Z',GOLD)
    + path('m102 308-43 20 14-76Z',CORAL)
    + path('m334 316 82 16-10-176Z',MINT)
    + path('m251 263-7 122','none')
)
objects['paper-boat'] = (
    path('m256 98 122 199H134Z',CREAM)
    + path('m256 98-17 199H134Z',GOLD)
    + path('m91 285 165 58 165-58-70 129H161Z',LIGHT)
    + path('m91 285 165 58-95 71Z',MINT)
    + path('m421 285-165 58 95 71Z',LAVENDER)
    + path('M120 438c20-10 34-10 54 0s34 10 54 0 34-10 54 0 34 10 54 0 34-10 54 0','none',' stroke="#81D3C0" stroke-width="8"')
)
objects['maze'] = (
    rect(94,94,324,324,CREAM,22)
    + path('M94 148v-32c0-14 8-22 22-22h280c14 0 22 8 22 22v280c0 14-8 22-22 22H116c-14 0-22-8-22-22V212','none')
    + path('M94 216h64v-64h130v64h65V94M158 216v136h66m-66-68h66v-68m0 136v66m0-132h64v65h65v-68h65M288 152v64m0 135v67M353 152h65','none',' stroke="#6A61E8" stroke-width="10"')
    + circle(94,181,12,MINT)
    + path('m368 345 9 20 22 3-16 15 4 23-19-11-20 11 4-23-16-15 23-3Z',GOLD,' stroke-width="6"')
)
objects['book'] = (
    path('M83 130c62-30 120-30 173 5 53-35 111-35 173-5v251c-62-30-120-30-173 5-53-35-111-35-173-5Z',VIOLET)
    + path('M98 114c58-24 111-20 158 12v240c-47-32-100-36-158-12Z',CREAM)
    + path('M256 126c47-32 100-36 158-12v240c-58-24-111-20-158 12Z',CREAM)
    + path('M128 174c32-9 61-4 91 10m-91 40c32-9 61-4 91 10m-91 40c32-9 61-4 91 10m74-100c30-14 59-19 91-10m-91 60c30-14 59-19 91-10m-91 60c30-14 59-19 91-10','none',' stroke="#DCEAF4" stroke-width="8"')
    + path('M337 113v113l23-18 23 18V108Z',CORAL)
    + path('m359 132 7 14 15 2-11 11 2 15-13-7-14 7 3-15-11-11 15-2Z',GOLD,' stroke-width="5"')
)

order = ['abacus','ruler-compass','cubes','balance','puzzle-piece','light-bulb','matches','tiles','knight','rook','crown','chess-board','globe','compass','balloon','treasure-map','crane','paper-boat','maze','book']
rare = {'tiles','treasure-map','book'}
for number,slug in enumerate(order,5):
    backing = '<rect x="50" y="42" width="412" height="414" rx="78" fill="#FFFFFF" stroke="#DCEAF4" stroke-width="4"/>'
    if slug == 'light-bulb':
        backing = '<rect x="49" y="10" width="414" height="447" rx="78" fill="#FFFFFF" stroke="#DCEAF4" stroke-width="4"/>'
    ring = ''
    if slug in rare:
        ring = '<rect x="58" y="50" width="396" height="398" rx="70" fill="none" stroke="#F5C451" stroke-width="4"/>'
        ring += '<g fill="#F5C451"><path d="m96 65 5 11 11 5-11 5-5 11-5-11-11-5 11-5Z"/><path d="m425 403 5 11 11 5-11 5-5 11-5-11-11-5 11-5Z"/></g>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <ellipse cx="256" cy="468" rx="150" ry="16" fill="#203047" opacity=".12"/>
  {backing}
  {ring}
  <g stroke="#203047" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    {objects[slug]}
  </g>
</svg>
'''
    (OUT / f'sticker-{number:02}-{slug}.svg').write_text('\n'.join(line.rstrip() for line in svg.splitlines())+'\n')

# Shared silhouette is copied exactly from mishi-explorer.svg. Expression groups
# alone change the face, arms and props; flat fills satisfy the strict SVG brief.
body = '''<path d="M180 79V49" stroke-width="8"/>
    <circle cx="180" cy="39" r="12" fill="#F5C451" stroke-width="6"/>
    <rect x="91" y="78" width="178" height="177" rx="58" fill="#F7FAFF" stroke-width="7"/>
    <rect x="112" y="112" width="136" height="100" rx="38" fill="#81D3C0" stroke-width="6"/>
    <path d="M115 246c-15 13-22 36-19 69l33 3 18-63" fill="#F47C6C" stroke-width="7"/>
    <path d="M245 246c16 17 23 40 20 67l-34 5-18-63" fill="#6A61E8" stroke-width="7"/>
    <rect x="122" y="234" width="116" height="108" rx="38" fill="#F7FAFF" stroke-width="7"/>
    <path d="M147 341v35M213 341v35" stroke-width="14"/>
    <path d="M130 380h39M191 380h39" stroke-width="16"/>'''
eyes = '''<circle cx="151" cy="158" r="12" fill="#203047" stroke="none"/><circle cx="209" cy="158" r="12" fill="#203047" stroke="none"/>
    <circle cx="147" cy="154" r="4" fill="#FFFFFF" stroke="none"/><circle cx="205" cy="154" r="4" fill="#FFFFFF" stroke="none"/>'''
arms_idle = '''<path d="M96 282 46 248M264 281l45-39" fill="none" stroke-width="14"/>
    <circle cx="42" cy="244" r="18" fill="#F5C451" stroke-width="6"/>
    <circle cx="310" cy="240" r="31" fill="#FFF8E8" stroke-width="6"/>
    <path d="m318 229-7 18-18 7 7-18 18-7Z" fill="#6A61E8" stroke-width="3"/>
    <circle cx="307" cy="242" r="4" fill="#F5C451" stroke-width="2"/>'''
face = {}
face['idle'] = eyes + '<path d="M153 184c16 14 38 14 54 0" fill="none" stroke-width="6"/>' + arms_idle
face['success'] = '''<path d="m143 162 24 23 50-54" fill="none" stroke-width="10"/>
    <path d="m96 282-33-34m201 33 32-35" fill="none" stroke-width="14"/>
    <circle cx="59" cy="244" r="18" fill="#F5C451" stroke-width="6"/><circle cx="300" cy="242" r="18" fill="#F5C451" stroke-width="6"/>
    <path d="m49 119 6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2Z" fill="#F5C451" stroke-width="4"/>
    <path d="m308 100 6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2Z" fill="#F5C451" stroke-width="4"/>'''
# Keep the already-reviewed expression byte-for-byte inside its layer.
think_source = (ROOT/'assets/characters/mishi-think.svg').read_text()
face['think'] = think_source.split('<g id="face-think">')[1].split('</g>')[0].strip()
face['cheer'] = '''<path d="M138 158q13-22 26 0m32 0q13-22 26 0" fill="none" stroke-width="7"/>
    <path d="M155 177h50c-1 25-12 34-25 34s-24-9-25-34Z" fill="#203047" stroke-width="6"/>
    <path d="M165 199q15-12 30 0" fill="none" stroke="#F47C6C" stroke-width="6"/>
    <path d="m96 282-42-101m210 100 42-101" fill="none" stroke-width="14"/>
    <circle cx="51" cy="174" r="18" fill="#F5C451" stroke-width="6"/><circle cx="309" cy="174" r="18" fill="#F5C451" stroke-width="6"/>
    <path d="m35 86 5 12 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2Z" fill="#F5C451" stroke-width="4"/>
    <path d="m313 59 5 12 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2Z" fill="#F5C451" stroke-width="4"/>
    <path d="m281 333 5 12 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2Z" fill="#F5C451" stroke-width="4"/>
    <circle cx="63" cy="334" r="6" fill="#6A61E8" stroke="none"/><circle cx="282" cy="106" r="5" fill="#F47C6C" stroke="none"/><circle cx="80" cy="60" r="5" fill="#F47C6C" stroke="none"/>'''
face['sleepy'] = '''<path d="M138 157q13 15 26 0m32 0q13 15 26 0" fill="none" stroke-width="7"/>
    <path d="M168 187q12 6 24 0" fill="none" stroke-width="6"/>
    <path d="m96 282-15 44m183-45 15 44" fill="none" stroke-width="14"/>
    <circle cx="79" cy="330" r="18" fill="#F5C451" stroke-width="6"/><circle cx="281" cy="330" r="18" fill="#F5C451" stroke-width="6"/>
    <path d="M302 65c-20 7-27 31-14 48 11 16 35 16 47 1-22 3-40-28-33-49Z" fill="#E8E5FF" stroke-width="5"/>
    <path d="m294 149 10-6 4 9 11-5m-19 23 8-5 4 8 9-4" fill="none" stroke="#6A61E8" stroke-width="4"/>'''

def robot(mood):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 420">
  <ellipse cx="180" cy="386" rx="92" ry="18" fill="#203047" opacity=".12"/>
  <g stroke="#203047" stroke-linecap="round" stroke-linejoin="round">
    {body}
    <g id="face-{mood}">{face[mood]}</g>
  </g>
</svg>
'''

for mood in ['cheer','sleepy']:
    (ROOT/f'assets/characters/mishi-{mood}.svg').write_text(robot(mood))
layers = '\n'.join(f'<g data-mood="{mood}"'+(' display="none"' if mood!='idle' else '')+f'>{content}</g>' for mood,content in face.items())
sprite = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 420">
  <ellipse cx="180" cy="386" rx="92" ry="18" fill="#203047" opacity=".12"/>
  <g stroke="#203047" stroke-linecap="round" stroke-linejoin="round">
    <g id="body">{body}</g>
    {layers}
  </g>
</svg>
'''
(ROOT/'assets/characters/mishi.svg').write_text(sprite)

names_he = ['מיקרוסקופ','מבחנה','מגנט','טלסקופ','חשבונייה','סרגל ומחוגה','קוביות','מאזניים','חלק פאזל','נורה','גפרורים','אריחים','פרש','צריח','כתר','לוח שחמט','כדור הארץ','מצפן','כדור פורח','מפת אוצר','עגור מנייר','סירת נייר','מבוך','ספר']
names_ru = ['Микроскоп','Пробирка','Магнит','Телескоп','Счёты','Линейка и циркуль','Кубики','Весы','Деталь пазла','Лампочка','Спички','Плитки','Конь','Ладья','Корона','Шахматная доска','Глобус','Компас','Воздушный шар','Карта сокровищ','Бумажный журавлик','Бумажная лодка','Лабиринт','Книга']
all_slugs = ['microscope','test-tube','magnet','telescope'] + order
cards = []
def card(key,he,ru,large,small,description):
    return f'''<figure data-sample="{key}">
      <figcaption><strong>{he}</strong><span lang="ru" dir="ltr">{ru}</span></figcaption>
      {large}
      <div class="small-row">{small}<p>{description}<br><span lang="ru" dir="ltr">512 / 64 px</span></p></div>
    </figure>'''
def img(src,cls,alt):
    size = 512 if cls=='large' else 64
    return f'<img class="{cls}" src="{src}" alt="{alt}" width="{size}" height="{size}">'
cards.append(card('original','מישי המקורי','Исходный Миши',img('../assets/characters/mishi-explorer.svg','large','מישי המקורי להשוואה'),img('../assets/characters/mishi-explorer.svg','small','מישי המקורי בגודל קטן'),'מקור להשוואת הגוף והקו'))
for mood,he,ru in [('idle','מישי סקרן','Любопытный Миши'),('think','מישי חושב','Миши думает'),('success','מישי מצליח','Успех Миши'),('cheer','מישי מעודד','Миши радуется'),('sleepy','מישי ישנוני','Сонный Миши')]:
    cards.append(card(mood,he,ru,f'<div class="large robot-render" data-mood="{mood}" aria-label="{he}" role="img"></div>',f'<div class="small robot-render" data-mood="{mood}" aria-label="{he}" role="img"></div>','גוף משותף · פנים וזרועות מתחלפות'))
for number,(slug,he,ru) in enumerate(zip(all_slugs,names_he,names_ru),1):
    src = f'../assets/stickers/sticker-{number:02}-{slug}.svg'
    special = number in [4,12,20,24]
    cards.append(card(slug,he+(' · נדיר' if special else ''),ru+(' · Редкая' if special else ''),img(src,'large',he),img(src,'small',he+' בגודל קטן'),f'מדבקה {number} · '+('מסגרת זהב לנדירות' if special else 'אוסף התגליות')))
review_path=ROOT/'design/art-review.html'
review=review_path.read_text()
prefix=review.split('  <main>')[0]
prefix=prefix.replace('סדרה א׳ · דוגמה לאישור כיוון האיור','24 מדבקות · חמש הבעות · הכיוון אושר')
prefix=prefix.replace('ארבע מדבקות מעבדה והבעת „חושב”, לצד מישי המקורי. כל איור מופיע בגודל 512 ובגודל 64 פיקסלים, כדי לבדוק שהוא ברור גם בפרס קטן בדרכון.','24 מדבקות וחמש הבעות, לצד מישי המקורי. כל איור מופיע בגודל 512 ובגודל 64 פיקסלים. הכיוון אושר לאחר בדיקת דוגמת סדרה א׳ והבעת „חושב”.')
prefix=prefix.replace('Четыре наклейки лаборатории и выражение «думает» рядом с исходным Миши. Размеры 512 и 64 пикселя помогают оценить узнаваемость маленькой награды.','24 наклейки и пять выражений рядом с исходным Миши. Каждая иллюстрация показана в размерах 512 и 64 пикселя. Направление одобрено после просмотра первой серии и выражения «думает».')
prefix=prefix.replace('.large { display:block;', '.robot-render svg { width:100%; height:100%; }\n    .large { display:block;',1) if '.robot-render svg' not in prefix else prefix
review=prefix+'  <main>\n'+'\n'.join(cards)+'''\n  </main>
  <footer>האיורים נכתבו ידנית בקוד SVG. הכיוון אושר ב־23 בנובמבר 2026; כאן מוצג הסט המלא. <a href="../assets/ATTRIBUTION.md">מקורות ורישיון</a> · <a href="../">חזרה למשחק</a></footer>
  <script>
    window.artReady = fetch('../assets/characters/mishi.svg').then(response => {
      if (!response.ok) throw new Error('Mishi SVG failed to load');
      return response.text();
    }).then(source => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      document.querySelectorAll('.robot-render').forEach(host => {
        const clone = svg.cloneNode(true);
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        clone.querySelectorAll('g[data-mood]').forEach(group => group.setAttribute('display', group.dataset.mood === host.dataset.mood ? 'inline' : 'none'));
        clone.setAttribute('aria-hidden', 'true');
        host.append(clone);
      });
    });
  </script>
</body>
</html>
'''
review_path.write_text(review)
print('Wrote20 stickers,2 expressions and5-mood layered Mishi SVG.')
