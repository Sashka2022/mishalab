const assert=require('node:assert/strict');
const fs=require('node:fs');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
const directions=require('../design/color-directions.json');
let browser,server;
(async()=>{
 const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
 let pairs=0;for(const d of directions.directions)for(const p of d.contrastPairs){const a=luminance(d.tokens[p.foreground]),b=luminance(d.tokens[p.background]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,d.id+':'+p.id);pairs++;}assert.equal(pairs,30);
 server=createStaticServer(0);await new Promise(resolve=>server.once('listening',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__identitySpoken=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return[{lang:'he-IL'},{lang:'ru-RU'}];},speak(u){window.__identitySpoken.push({text:u.text,lang:u.lang});},addEventListener(){}}});
 });
 // Measure displayed text after CSS cascade, including inherited alpha and the Russian subline.
 async function contrastAudit(selectors){return page.evaluate(selectors=>{
  const rgba=value=>{const n=value.match(/[\d.]+/g)?.map(Number)||[0,0,0];return[n[0],n[1],n[2],n.length>3?n[3]:1];};
  const blend=(fg,bg)=>[0,1,2].map(i=>fg[i]*fg[3]+bg[i]*(1-fg[3]));
  const bg=el=>{if(!el)return[255,255,255];const c=rgba(getComputedStyle(el).backgroundColor);return c[3]===1?c.slice(0,3):blend(c,bg(el.parentElement));};
  const lum=c=>{const n=c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return n[0]*.2126+n[1]*.7152+n[2]*.0722;};
  const result=[];
  for(const selector of selectors)for(const el of document.querySelectorAll(selector)){
   const box=el.getBoundingClientRect();if(!box.width||!box.height||!el.textContent.trim())continue;
   let alpha=1;for(let p=el;p;p=p.parentElement)alpha*=Number(getComputedStyle(p).opacity);
   const c=rgba(getComputedStyle(el).color),background=bg(el);c[3]*=alpha;const foreground=blend(c,background),l1=lum(foreground),l2=lum(background),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
   result.push({selector,text:el.textContent.trim().slice(0,60),ratio,color:getComputedStyle(el).color,background,opacity:alpha});
  }
  return result;
 },selectors);}
 const homeSelectors=['.brand .he','.brand .ru','.language-switch button.active','.arcade-welcome>.game-label .he','.arcade-welcome>.game-label .ru','.arcade-welcome h1 .he','.arcade-welcome h1 .ru','.difficulty-help .he','.difficulty-help .ru','.arcade-play .he','.arcade-play .ru'];
 let samples=0;
 for(const[lang,width]of[['he',1440],['ru',390],['both',360]]){
  await page.setViewportSize({width,height:width>700?1000:844});await page.goto(origin);await page.locator(`[data-lang="${lang}"]`).click();
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.scene-star').count(),0);assert.equal(await page.locator('.scene-level').innerText().then(t=>t.includes('LEVEL UP')),false);
  const heading=await page.locator('.arcade-welcome h1').innerText();assert.ok(heading.includes(lang==='ru'?'Миша':'מישה'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+':home overflow');
  const home=await contrastAudit(homeSelectors);samples+=home.length;assert.deepEqual(home.filter(x=>x.ratio<4.5),[],lang+':actual home contrast');
  if(lang!=='both')await page.locator('.arcade-hero').screenshot({path:`artifacts/identity-home-${lang}.png`});
  await page.locator('[data-action="toggle-speech"]').click();
  const spoken=await page.evaluate(()=>__identitySpoken.map(x=>x.text).join('\n'));assert.ok(spoken.includes(lang==='ru'?'Что разгадаем сегодня, Миша?':'מה נפצח היום, מישה?'),'Home narration must match the visible personal headline');
  await page.locator('[data-action="toggle-speech"]').click();
  await page.locator('[data-action="daily"]').click();
  const launch=await contrastAudit(['.launch-levels .selected','.launch-current .he','.launch-current .ru','.launch-actions>.primary .he','.launch-actions>.primary .ru','.passport-kicker .he','.passport-kicker .ru','.passport-heading p .he','.passport-heading p .ru','.passport-status .he','.passport-status .ru']);samples+=launch.length;assert.deepEqual(launch.filter(x=>x.ratio<4.5),[],lang+':actual launch/passport contrast');
  assert.equal(await page.locator('.launch-levels button').count(),10);assert.equal(await page.locator('.passport-station').count(),13);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+':launch overflow');
  if(lang==='he')await page.screenshot({path:'artifacts/identity-passport-he.png',fullPage:true});
 }
 // The three alternatives are a separate comparison page and cannot mutate learner progress.
 const stored=await page.evaluate(()=>localStorage.getItem('misha-lab-v1'));
 await page.goto(origin+'/design/color-studies.html');assert.equal(await page.locator('.study-card').count(),3);
 for(const[lang,width]of[['he',1440],['ru',390],['both',360]]){
  await page.setViewportSize({width,height:width>700?1000:844});await page.locator(`button[data-lang="${lang}"]`).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+':studies overflow');
  if(lang==='he')await page.screenshot({path:'artifacts/color-studies-he.png',fullPage:true});
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('misha-lab-v1')),stored);
 // The interface theme must preserve the actual chess board and question media.
 await page.goto(origin);await page.locator('[data-track="chess"]').first().click();await page.locator('.launch-levels [data-value="7"]').click();await page.locator('[data-session-action="begin"]').click();
 const boardColors=()=>page.locator('.board .square').evaluateAll(els=>els.map(el=>{const s=getComputedStyle(el);return[s.backgroundColor,s.color];}));
 const themed=await boardColors();await page.evaluate(()=>{document.querySelector('link[href^="identity-theme.css"]').disabled=true;});assert.deepEqual(await boardColors(),themed,'Theme must not recolor chess squares or pieces');
 await page.evaluate(()=>{document.querySelector('link[href^="identity-theme.css"]').disabled=false;});await page.locator('[data-action="home"]').first().click();
 await page.locator('[data-lg-value="trivia"]').click();await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="begin"]').click();
 for(let i=0;i<2;i++){
  await page.locator('.atlas-postcard img').evaluate(img=>img.decode());
  const before=await page.locator('.atlas-postcard img').evaluate(el=>({src:el.currentSrc,filter:getComputedStyle(el).filter,opacity:getComputedStyle(el).opacity,parents:[el.parentElement,el.parentElement.parentElement,el.closest('figure')].map(p=>getComputedStyle(p).filter)}));assert.equal(before.filter,'none');assert.equal(before.opacity,'1');assert.ok(before.parents.every(v=>v==='none'));
  await page.evaluate(()=>{document.querySelector('link[href^="identity-theme.css"]').disabled=true;});assert.equal(await page.locator('.atlas-postcard img').evaluate(el=>el.currentSrc),before.src);await page.evaluate(()=>{document.querySelector('link[href^="identity-theme.css"]').disabled=false;});
  const answer=await page.evaluate(()=>AtlasQuiz.current().answer);await page.locator(`[data-atlas-action="select"][data-atlas-value="${answer}"]`).click();await page.locator('[data-atlas-action="check"]').click();await page.locator('[data-atlas-action="next"]').click();
 }
 assert.deepEqual(errors,[]);console.log(`Identity: 3 alternatives/30 token contrast pairs, ${samples} actual text checks, he/ru/both mobile, matching narration, isolated comparison page, chess colors and unfiltered photo/flag media passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
