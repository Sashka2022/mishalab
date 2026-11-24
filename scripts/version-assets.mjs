// One version source for every statically referenced application stylesheet/script.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const {version}=JSON.parse(readFileSync(new URL('release.json',root),'utf8'));
const file=new URL('index.html',root);
const html=readFileSync(file,'utf8').replace(/((?:src|href)="[^"?#]+\.(?:js|css))(?:\?v=[^"#]+)?"/g,`$1?v=${encodeURIComponent(version)}"`);
writeFileSync(file,html);
