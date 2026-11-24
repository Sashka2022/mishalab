const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(/<style\b/i.test(html),false,'The HTML shell must not contain inline stylesheet blocks');
const links=[...html.matchAll(/<link[^>]+href="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]).filter(f=>f.endsWith('.css'));
assert.deepEqual(links.slice(0,2),['tokens.css','base.css'],'Design tokens and base styles load first');
assert.ok(!links.includes('identity-theme.css')&&!links.includes('game-theme.css'),'No final theme override');
assert.ok(links.includes('home.css')&&links.includes('task.css'));
const tokens=fs.readFileSync(path.join(root,'tokens.css'),'utf8');
assert.match(tokens,/--id-paper:\s*#fff5e4/i);assert.match(tokens,/--id-primary:\s*#245a66/i);
assert.match(tokens,/--fs-xs:\s*14px/);assert.match(tokens,/--fs-second:\s*max\(14px/);
const allStyles=tokens+links.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const defined=new Set([...allStyles.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
for(const file of links){
 const css=fs.readFileSync(path.join(root,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const localDefined=new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
 if(file==='tokens.css')continue;
 assert.doesNotMatch(css,/#[\da-f]{3,8}\b/i,`${file}: colors belong in tokens.css`);
 assert.doesNotMatch(css,/\b(?:rgba?|hsla?)\s*\(/i,`${file}: alpha colors belong in tokens.css`);
 for(const m of css.matchAll(/font-size\s*:\s*([^;}]+)/g))assert.match(m[1],/^var\(--fs-/,`${file}: font size must refer to a typography token (${m[1]})`);
 for(const m of css.matchAll(/(?:animation|transition)(?:-duration|-delay)?\s*:\s*([^;}]+)/g))assert.doesNotMatch(m[1],/(^|[\s,])(?:\d*\.)?\d+m?s\b/,`${file}: motion uses time tokens`);
 for(const m of css.matchAll(/var\((--[\w-]+)/g))assert.ok(defined.has(m[1])||localDefined.has(m[1])||m[1]==='--cells'||m[1]==='--cols'||m[1]==='--rows'||m[1]==='--confetti-index'||m[1]==='--n'||m[1]==='--progress',`${file}: missing custom property ${m[1]}`);
}
console.log('CSS architecture: external components, chosen palette, typography and motion tokens verified');
