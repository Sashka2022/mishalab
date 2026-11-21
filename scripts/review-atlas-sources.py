"""Capture readable excerpts from the exact public sources used by the question bank."""
import urllib.request,concurrent.futures,json,re,html
from html.parser import HTMLParser
class Text(HTMLParser):
    def __init__(self):super().__init__();self.skip=0;self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in ['script','style']:self.skip+=1
        if tag in ['p','h1','h2','h3','li','br']:self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ['script','style']:self.skip=max(0,self.skip-1)
    def handle_data(self,data):
        if not self.skip:self.parts.append(data)
def run(item):
    key,url=item
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Mishalab educational source review)'})
        with urllib.request.urlopen(req,timeout=18) as f:status=f.status;body=f.read().decode('utf-8','replace');final=f.url
        p=Text();p.feed(body);text=re.sub(r'[ \t\r\f\v]+',' ',''.join(p.parts));text=re.sub(r'\n\s*\n','\n',text)
        # Keep an opening plus passages around the claims. Every excerpt is reviewed before shipping.
        words=WORDS.get(key,[]) if 'WORDS' in globals() else []
        passages=[]
        for word in words:
            matches=list(re.finditer(re.escape(word),text,re.I))
            for m in matches[:2]:passages.append(text[max(0,m.start()-150):m.end()+330].strip())
        return dict(id=key,url=url,finalUrl=final,status=status,checkedAt='2026-11-21',opening=text[:600],excerpts=passages or [text[:3500]])
    except Exception as e:return dict(id=key,url=url,status='error',error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:print(json.dumps(list(pool.map(run,SOURCES.items())),ensure_ascii=True))
