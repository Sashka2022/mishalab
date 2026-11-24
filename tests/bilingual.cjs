const assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const {createStaticServer}=require('./static-server.cjs');
let server,browser;
(async()=>{
 server=createStaticServer(0);await new Promise(r=>server.once('listening',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{
  window.__utterances=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return [{lang:'he-IL'},{lang:'ru-RU'}];},speak(u){window.__utterances.push(u);u.onstart?.();},addEventListener(){}}});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
 assert.equal(await page.evaluate(()=>data.helpMode),'hebrewFirst');
 await page.locator('[data-track="math"]').first().click();await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="begin"]').click();
 assert.equal(await page.locator('.task-shell h2 [lang="ru"]').count(),0,'Hebrew first');
 assert.equal(await page.locator('[data-reading-action="translate"]').count(),1);
 const word=page.locator('.task-shell h2 .reading-word').first(),wordText=await word.innerText();
 assert.equal(await page.evaluate(()=>data.readAloud),false);
 await word.click();assert.deepEqual(await page.evaluate(()=>({text:__utterances.at(-1).text,lang:__utterances.at(-1).lang})),{text:wordText,lang:'he-IL'},'word click reads Hebrew even with general speech disabled');
 await page.evaluate(()=>{const q=session.task;if(q.mode==='number')q.input=String(q.answer+9999);else q.selected=(q.answer+1)%q.options.length;check();});
 assert.equal(await page.locator('.task-shell h2 [lang="ru"]').count(),1,'first wrong attempt opens Russian');
 assert.equal(await page.evaluate(()=>session.task.ruShown),true);
 const signature=await page.evaluate(()=>session.task.signature);await page.reload();await page.evaluate(()=>resume());
 assert.equal(await page.evaluate(()=>session.task.signature),signature);assert.equal(await page.locator('.task-shell h2 [lang="ru"]').count(),1,'refresh preserves revealed translation');
 await page.evaluate(()=>{data.helpMode='tap';session.task.ruShown=false;session.task.readingMiss=false;render();ReadingSupport.attempt(false);render();});
 assert.equal(await page.locator('.task-shell h2 [lang="ru"]').count(),0,'tap mode waits for request even after mistake');
 await page.locator('[data-reading-action="translate"]').click();assert.equal(await page.locator('.task-shell h2 [lang="ru"]').count(),1);
 await page.evaluate(()=>{data.helpMode='always';render();});
 for(const width of [360,390,900,1440]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>render());
  const bad=await page.evaluate(()=>({
   small:[...document.querySelectorAll('[lang="ru"]')].filter(n=>n.getBoundingClientRect().height&&parseFloat(getComputedStyle(n).fontSize)<14).map(n=>({text:n.textContent,size:getComputedStyle(n).fontSize})),
   long:[...document.querySelectorAll('button .ui-label')].filter(n=>{const s=getComputedStyle(n),line=parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.5;return n.getBoundingClientRect().height>line*2+2;}).map(n=>n.textContent),
   siblings:[...document.querySelectorAll('button')].filter(button=>{const direct=[...button.children].filter(n=>n.lang);return direct.some((a,i)=>direct.slice(i+1).some(b=>a.lang!==b.lang&&Math.abs(a.getBoundingClientRect().top-b.getBoundingClientRect().top)<3));}).map(n=>n.textContent),
   overflow:document.documentElement.scrollWidth>innerWidth,
   overflowing:[...document.querySelectorAll('*')].filter(n=>n.getBoundingClientRect().width && (n.getBoundingClientRect().right>innerWidth+2||n.getBoundingClientRect().left< -2)).slice(-12).map(n=>({tag:n.tagName,class:n.className,text:n.textContent.slice(0,100),width:n.getBoundingClientRect().width}))
  }));
  assert.deepEqual(bad.small,[],`${width}: readable Russian >=14px`);assert.deepEqual(bad.long,[],`${width}: UI buttons at most two lines`);assert.deepEqual(bad.siblings,[],`${width}: no colliding language siblings`);assert.equal(bad.overflow,false,`${width}: horizontal fit ${JSON.stringify(bad.overflowing)}`);
 }
 await page.evaluate(()=>{data.lang='both';data.helpMode='always';data.readAloud=true;render();narrateCurrent(true);});
 assert.equal(await page.locator('.task-shell h2 .reading-sentence.is-speaking').count()>0,true,'no boundary event highlights entire spoken sentence');
 await page.evaluate(()=>{const u=__utterances.findLast(u=>u.lang==='he-IL');u.onboundary?.({name:'word',charIndex:0});});
 assert.equal(await page.locator('.task-shell h2 .reading-word.is-speaking').count(),1,'speech boundary highlights spoken word');
 await page.evaluate(()=>{const u=__utterances.findLast(u=>u.lang==='he-IL');u.onend?.();});
 assert.equal(await page.locator('.task-shell h2 .is-speaking').count(),0);
 // A completed task records opened translation rather than claiming reading ability.
 await page.evaluate(()=>{data.readAloud=false;const q=session.task;if(q.mode==='number')q.input=String(q.answer);else q.selected=q.answer;check();});
 const result=await page.evaluate(()=>session.results.at(-1));assert.equal(result.ruShown,true);assert.equal(result.readingTracked,true);
 assert.ok(await page.evaluate(r=>ReadingSupport.summary([r]).includes('התרגום לא נפתח'),result));
 // Atlas keeps its independent storage and translation state through refresh.
 await page.evaluate(()=>{PlaySession.home();data.helpMode='hebrewFirst';PlaySession.openLaunch({kind:'atlas',key:'atlas'});});await page.locator('[data-session-action="begin"]').click();
 assert.equal(await page.locator('#atlas-question [lang="ru"]').count(),0);await page.locator('[data-reading-action="translate"]').click();
 const atlasId=await page.evaluate(()=>AtlasQuiz.current().id);await page.reload();assert.equal(await page.evaluate(()=>AtlasQuiz.current().id),atlasId);assert.equal(await page.locator('#atlas-question [lang="ru"]').count(),1);
 assert.deepEqual(errors,[]);await context.close();console.log('Bilingual: four widths, four help modes, wrong-answer reveal, persisted core/Atlas translation, word speech, boundary fallback, honest summary passed.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
