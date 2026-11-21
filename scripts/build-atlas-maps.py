"""Render local geographic maps from Natural Earth's public-domain vectors.

Usage: python3 scripts/build-atlas-maps.py countries.geojson lakes.geojson
Data: https://www.naturalearthdata.com/about/terms-of-use/
Projection: equirectangular (regional longitude scaled by cos(32°)).
"""
import json,math,pathlib,sys,hashlib
from xml.sax.saxutils import escape
root=pathlib.Path(__file__).resolve().parents[1]
countries=json.load(open(sys.argv[1]))['features'];lakes=json.load(open(sys.argv[2]))['features']
manifest=json.loads((root/'atlas/media.json').read_text());byid={x['id']:x for x in manifest}
def make(id,kind,lang,compact=False):
    W,H=(400,490) if compact else (800,490)
    if kind=='israel':
        project=lambda lon,lat:((210 if compact else 420)+(lon-35)*83*math.cos(math.radians(32)),32+(34-lat)*83)
    elif kind=='egypt':project=lambda lon,lat:(35+(lon-13)*19,35+(43-lat)*13)
    else:project=lambda lon,lat:(20+(lon+180)*760/360,25+(85-lat)*430/170)
    def path(geometry):
        polygons=geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
        output=[]
        for polygon in polygons:
            for ring in polygon:
                xy=[]
                for point in ring:
                    projected=project(*point[:2])
                    if not xy or math.dist(xy[-1],projected) >= .65:xy.append(projected)
                if len(xy)<3:continue
                # Split at antimeridian to avoid a spurious line across the map.
                if kind not in ['israel','egypt'] and any(abs(a[0]-b[0])>500 for a,b in zip(xy,xy[1:])):continue
                output.append('M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in xy)+'Z')
        return ''.join(output)
    a=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',f'<defs><clipPath id="frame"><rect x="12" y="12" width="{W-24}" height="466" rx="9"/></clipPath></defs>',f'<rect x="12" y="12" width="{W-24}" height="466" rx="9" fill="#e6f1f2"/>','<g clip-path="url(#frame)" stroke="#a3afa7" stroke-width=".75" stroke-linejoin="round">']
    for f in countries:
        name=f['properties']['ADMIN'];code=f['properties'].get('ADM0_A3')
        if kind=='israel' and name not in ['Israel','Palestine','Egypt','Jordan','Lebanon','Syria','Saudi Arabia','Cyprus']:continue
        if kind=='egypt' and name not in ['Egypt','Israel','Palestine','Jordan','Saudi Arabia','Sudan','Libya','Syria','Lebanon','Cyprus','Turkey','Greece','Ethiopia','Eritrea','Djibouti','Yemen','Iraq','Iran','United Arab Emirates','Oman']:continue
        color='#e8e4cf'
        if kind=='israel' and name=='Israel':color='#efcf8f'
        if kind=='egypt' and name=='Egypt':color='#edb47c'
        if kind=='brazil' and name=='Brazil':color='#edb47c'
        dash=' stroke-dasharray="3 3"' if kind=='israel' and code=='PSX' else ''
        a.append(f'<path d="{path(f["geometry"])}" fill="{color}"{dash}/>')
    if kind=='israel':
        for f in lakes:
            if any(s in str(f['properties']) for s in ['Galilee','Dead Sea']):a.append(f'<path d="{path(f["geometry"])}" fill="#a5d3dc" stroke="#719eac"/>')
    a.append('</g>')
    def label(x,y,he,ru,size=20,color='#24445c',anchor='middle'):
        a.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="Arial,sans-serif" font-size="{size}" font-weight="600" fill="{color}" direction="{"rtl" if lang=="he" else "ltr"}">{escape(he if lang=="he" else ru)}</text>')
    def geo(lon,lat,he,ru,size=20,color='#24445c'):label(*project(lon,lat),he,ru,size,color)
    if kind=='israel':
        for lon,lat,he,ru,dx,dy,anchor in [(34.9896,32.8191,'חיפה','Хайфа',-20,-8,'end'),(35.531,32.7922,'טבריה','Тверия',25,0,'start'),(34.7818,32.0853,'תל אביב','Тель-Авив',-22,6,'end'),(34.9482,29.5581,'אילת','Эйлат',-20,-5,'end')]:
            x,y=project(lon,lat);a.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#24445c" stroke="#fffdf4" stroke-width="2"/>');a.append(f'<path d="M{x:.1f},{y:.1f}l{dx*.65:.1f},{dy*.65:.1f}" stroke="#24445c"/>');label(x+dx,y+dy,he,ru,21,anchor=anchor)
        label(80 if compact else 170,215 if compact else 180,'הים התיכון','Средиземное море',16 if compact else 21,'#366d83');label(310 if compact else 600,165 if compact else 145,'הכנרת','Кинерет',16,'#366d83');label(285 if compact else 520,440,'הים האדום','Красное море',16 if compact else 19,'#366d83')
        nx=350 if compact else 700;a.append(f'<path d="M{nx} 105V55m0 0-7 12m7-12 7 12" fill="none" stroke="#24445c" stroke-width="3"/>');label(nx,43,'צפון','Север',17)
        label(W/2,465,'מפה מפושטת · צפון למעלה','Упрощённая карта · север сверху',14)
    elif kind=='egypt':
        geo(29,27,'מצרים','Египет',25);geo(23,18,'אפריקה','Африка',26);geo(45,34,'אסיה','Азия',26);geo(27,40,'אירופה','Европа',22);geo(27,35.5,'הים התיכון','Средиземное море',18,'#366d83');geo(40,20,'הים האדום','Красное море',18,'#366d83')
        label(400,465,'מצרים מודגשת בכתום · מפה מפושטת','Египет выделен оранжевым · упрощённая карта',15)
    else:
        geo(-110,48,'אמריקה הצפונית','Северная Америка',30);geo(-65,-25,'אמריקה הדרומית','Южная Америка',30);geo(18,10,'אפריקה','Африка',32);geo(25,58,'אירופה','Европа',27);geo(95,43,'אסיה','Азия',32);geo(135,-27,'אוסטרליה','Австралия',28)
        if kind=='brazil':geo(-50,-10,'ברזיל','Бразилия',30)
        if kind=='equator':
            x,y=project(0,0);a.append(f'<path d="M20 {y:.1f}H780" stroke="#b65324" stroke-width="3" stroke-dasharray="9 5"/>');label(650,y-11,'קו המשווה · 0°','Экватор · 0°',28,'#9c421c')
        label(400,470,'מפת עולם מפושטת · צפון למעלה','Упрощённая карта мира · север сверху',14)
    a.append('</svg>');binary='\n'.join(a).encode();asset_id=id+('-mobile' if compact else '')+'-'+lang;dest='assets/atlas/'+asset_id+'.svg';(root/dest).write_bytes(binary)
    byid[asset_id]=dict(id=asset_id,path=dest,source='https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/',creator='Natural Earth contributors; map layout and city labels: Mishalab',license='Public domain',licenseUrl='https://www.naturalearthdata.com/about/terms-of-use/',modifications='Simplified geographic vectors projected and labelled in '+lang+'; schematic borders are not a political statement.',dataSources=['https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson','https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_lakes.geojson'],sha256=hashlib.sha256(binary).hexdigest(),retrievedAt='2026-11-21')
for kind in ['israel','egypt','brazil','equator']:
    for lang in ['he','ru']:make('map-'+kind,kind,lang)
for lang in ['he','ru']:make('map-israel','israel',lang,compact=True)
(root/'atlas/media.json').write_text(json.dumps(list(byid.values()),ensure_ascii=False,indent=2)+'\n')
print('10 local map assets, including portrait Israel maps for phones')
