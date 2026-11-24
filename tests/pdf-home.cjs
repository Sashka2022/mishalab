const assert=require('node:assert/strict');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
let server,browser;
(async()=>{
 server=createStaticServer(0);await new Promise(resolve=>server.listening?resolve():server.once('listening',resolve));
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 const schedule=await page.evaluate(()=>Array.from({length:16},(_,i)=>{const key=`2026-11-${String(i+1).padStart(2,'0')}`,items=PlaySession.dailyItinerary(4,key);return{key,items,again:PlaySession.dailyItinerary(4,key)};}));
 for(const day of schedule){assert.deepEqual(day.items,day.again);assert.equal(day.items.length,5);assert.equal(new Set(day.items.map(e=>e.key)).size,5);assert.ok(day.items.every(e=>e.level===4));assert.equal(new Set(day.items.map(e=>e.kind)).size,4);}
 assert.equal(new Set(schedule.flatMap(day=>day.items.map(e=>e.key))).size,13,'Daily missions rotate through every game');
 for(const lang of ['he','ru','both']){
  await page.locator(`[data-lang="${lang}"]`).click();
  const layout=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,cta:document.querySelector('.home-primary-card .primary').getBoundingClientRect().toJSON(),visible:[...document.querySelectorAll('.shelf-card')].filter(e=>e.getBoundingClientRect().height).length}));
  assert.ok(layout.height<2000,`${lang}: home too tall (${layout.height})`);assert.ok(layout.width<=390);assert.ok(layout.cta.bottom<=844,`${lang}: primary hidden below fold`);assert.equal(layout.visible,4);
 }
 for(const [tab,count] of [['courses',5],['boards',4],['thinking',4]]){await page.locator(`[data-home-tab="${tab}"]`).click();assert.equal(await page.locator('.shelf-grid:not([hidden]) .shelf-card').count(),count);await page.reload();assert.equal(await page.locator(`[data-home-tab="${tab}"]`).getAttribute('aria-selected'),'true');}
 await page.locator('[data-session-action="daily-launch"]').click();assert.equal(await page.locator('.launch-levels button').count(),10);assert.equal(await page.locator('.passport-preview .passport-station').count(),5);
 await page.locator('.launch-levels [data-value="4"]').click();await page.locator('[data-session-action="begin"]').click();
 const initial=await page.evaluate(()=>({id:PlaySession.state().id,keys:PlaySession.state().entries.map(e=>e.key),xp:data.xp}));assert.equal(initial.keys.length,5);assert.equal(await page.evaluate(()=>data.startDifficulty),null,'Per-game choice preserves automatic default');
 await page.locator('[data-session-action="skip"]').click();await page.locator('[data-action="home"]').first().click();await page.reload();
 assert.ok(await page.locator('[data-session-action="journey-resume"]').count());await page.locator('[data-session-action="journey-resume"]').click();assert.equal(await page.evaluate(()=>PlaySession.state().index),1);assert.equal(await page.evaluate(()=>PlaySession.state().id),initial.id);
 for(let i=1;i<5;i++){if(await page.locator('[data-session-action="continue"]').count())await page.locator('[data-session-action="continue"]').click();await page.locator('[data-session-action="skip"]').click();}
 assert.equal(await page.evaluate(()=>PlaySession.state().status),'complete');assert.equal(await page.locator('.review-exercise').count(),5);assert.equal(await page.evaluate(()=>PlaySession.dailyComplete()),true);assert.equal(await page.evaluate(()=>data.xp),initial.xp,'Skipped stations do not earn performance XP');
 const id=await page.evaluate(()=>PlaySession.state().id);assert.equal(await page.evaluate(id=>data.sessionReports.filter(r=>r.id===id).length,id),1);
 await page.locator('[data-action="home"]').first().click();assert.equal(await page.locator('[data-session-action="recommend"]').count(),1);
 await page.reload();assert.equal(await page.locator('[data-session-action="recommend"]').count(),1);
 await page.locator('[data-action="daily"]').click();assert.equal(await page.locator('.passport-preview .passport-station').count(),13);await page.locator('[data-session-action="begin"]').click();assert.equal(await page.evaluate(()=>PlaySession.state().entries.length),13);
 const atlasPage=await browser.newPage({viewport:{width:390,height:844}});atlasPage.on('pageerror',e=>errors.push(e.message));await atlasPage.goto(`http://127.0.0.1:${server.address().port}`);
 await atlasPage.locator('[data-home-tab="courses"]').click();await atlasPage.locator('[data-lg-value="trivia"]').click();await atlasPage.locator('.launch-levels [data-value="3"]').click();await atlasPage.locator('[data-session-action="begin"]').click();
 const answer=await atlasPage.evaluate(()=>AtlasQuiz.current().answer);await atlasPage.locator(`[data-atlas-action="select"][data-atlas-value="${answer}"]`).click();await atlasPage.locator('[data-atlas-action="check"]').click();await atlasPage.locator('[data-atlas-action="next"]').click();await atlasPage.locator('[data-action="home"]').first().click();
 assert.equal(await atlasPage.locator('[data-session-action="home-atlas-resume"]').count(),1);await atlasPage.reload();await atlasPage.locator('[data-session-action="home-atlas-resume"]').click();assert.equal(await atlasPage.evaluate(()=>AtlasQuiz.state().activeRound),3);assert.equal(await atlasPage.evaluate(()=>AtlasQuiz.state().runs[3].index),1);await atlasPage.close();
 assert.deepEqual(errors,[]);console.log('Compact home in three languages, all thirteen games across daily rotation, tabs persistence, daily five-station resume/completion, report idempotency and full thirteen-game journey passed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
