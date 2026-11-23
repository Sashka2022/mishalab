const assert=require('node:assert/strict');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
let browser,server;
(async()=>{
 server=createStaticServer(0);await new Promise(resolve=>server.once('listening',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];
 const checkPage=await browser.newPage();await checkPage.goto(origin);
 const modelCheck=await checkPage.evaluate(()=>{
  const cases=[
   [{correct:true,attempts:1,hints:0},'independent'],
   [{correct:true,attempts:1,hints:2},'assisted'],
   [{correct:true,attempts:3,hints:0},'solved'],
   [{correct:true},'solved'],
   [{correct:false,practiceSolved:true,attempts:2,hints:0},'rehearsed'],
   [{correct:false,practiced:true,attempts:2,hints:0},'rehearsed'],
   [{correct:false,skipped:true,hints:2,attempts:0},'skipped'],
   [{correct:false,attempts:1,hints:0},'attempted']
  ],fail=[];
  for(const [result,want]of cases){const got=JourneyPassport.statusFor(result);if(got!==want)fail.push({result,want,got});}
  const entries=PlaySession.itinerary(4),results=[cases[0][0],cases[1][0],cases[2][0],cases[4][0],cases[6][0],cases[7][0]];
  const expedition={entries:entries.map(e=>({...e,run:{task:{prompt:{he:'FUTURE_SECRET',ru:'FUTURE_SECRET'},answer:'SECRET_ANSWER'}}})),results,index:6,phase:'task',status:'playing',level:4};
  const before=JSON.stringify(expedition),m=JourneyPassport.model(expedition),preview=JourneyPassport.model({entries,results:[],index:0,status:'preview'},{},{preview:true});
  if(m.stations.length!==13||new Set(m.stations.map(s=>s.key)).size!==13)fail.push('13 distinct stations');
  if(m.stations[6].status!=='current'||m.stations[7].status!=='untried')fail.push('current/future statuses');
  if(m.passed!==6||m.total!==13)fail.push('passed is not solved');
  if(preview.stations.some(s=>s.status!=='untried'))fail.push('preview awards completion');
  const html=JourneyPassport.render(expedition);
  if(JSON.stringify(m).includes('FUTURE_SECRET')||html.includes('FUTURE_SECRET')||html.includes('SECRET_ANSWER'))fail.push('future content exposed');
  if(JSON.stringify(expedition)!==before)fail.push('model/render mutated state');
  const interlude=JourneyPassport.model({...expedition,index:4,results:results.slice(0,4),phase:'interlude'});
  if(interlude.stations[4].status!=='next')fail.push('interlude next station');
  const current=JourneyPassport.model(expedition,{correct:false,practiceSolved:true,attempts:2,hints:1});
  if(current.stations[6].status!=='rehearsed'||!current.stations[6].current)fail.push('answered current station loses its real result');
  return{fail,keys:m.stations.map(s=>s.key)};
 });
 assert.deepEqual(modelCheck.fail,[]);
 await checkPage.goto(origin+'/#journey');assert.equal(await checkPage.locator('.game-launch .passport-station').count(),13);assert.equal(await checkPage.evaluate(()=>data.xp),0);assert.equal(await checkPage.evaluate(()=>!!data.expedition),false,'Direct entry offers a level without starting a new saved journey');await checkPage.reload();assert.equal(await checkPage.locator('.game-launch .passport-station').count(),13);await checkPage.close();
 for(const[lang,width]of[['he',1440],['ru',390],['both',360]]){
  const context=await browser.newContext({viewport:{width,height:width>700?1000:844},reducedMotion:lang==='both'?'reduce':'no-preference'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.locator(`[data-lang="${lang}"]`).click();await page.evaluate(()=>{data.expeditionCount=3;});
  await page.locator('[data-action="daily"]').click();
  const preview=page.locator('.game-launch .journey-passport');assert.equal(await preview.count(),1);
  assert.equal(await preview.locator('.passport-station').count(),13);assert.equal(await page.locator('.launch-levels button').count(),10);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+':launch overflow');
  await page.locator('.launch-levels [data-value="1"]').click();
  if(lang!=='both')await page.screenshot({path:`artifacts/passport-launch-${lang}.png`,fullPage:true});
  await page.locator('[data-session-action="begin"]').click();
  assert.equal(await page.evaluate(()=>PlaySession.entry().key),'math');assert.equal(await page.evaluate(()=>session.task.level),1);
  const q=await page.evaluate(()=>session.task);
  if(q.mode==='number')await page.locator('#answer').fill(String(q.answer));else await page.locator('[data-option="0"]').click();
  const prior=await page.evaluate(()=>({state:JSON.stringify(data.expedition),xp:data.xp}));
  const trigger=page.locator('[data-session-action="passport"]');await trigger.click();
  let dialog=page.locator('.passport-dialog');assert.equal(await dialog.count(),1);assert.equal(await dialog.locator('.passport-station').count(),13);
  assert.equal(await dialog.locator('[data-passport-action="detail"][data-station-index="12"]').count(),0,'Future stations cannot reveal exercise details');
  await page.keyboard.press('Escape');assert.equal(await page.locator('.passport-dialog').count(),0);
  assert.equal(await trigger.evaluate(el=>el===document.activeElement),true,'Escape returns focus to the map trigger');
  assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(data.expedition),xp:data.xp})),prior,'Reading the passport must not alter answers, hints or XP');
  if(q.mode==='options')await page.locator(`[data-option="${q.answer}"]`).click();
  await page.locator('[data-action="check"]').click();await page.locator('[data-action="next"]').click();
  const from=await page.evaluate(()=>PlaySession.learningRun().task.solutionMove[0]);await page.locator(`[data-lg-action="match"][data-lg-value="${from}"]`).click();
  await page.locator('[data-session-action="passport"]').click();dialog=page.locator('.passport-dialog');
  assert.equal(await dialog.locator('[data-station-index="0"]').first().getAttribute('data-status'),'independent');
  await dialog.locator('[data-passport-action="detail"][data-station-index="0"]').click();assert.ok((await dialog.locator('#passport-detail').innerText()).length>20);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>PlaySession.learningRun().task.source),from,'Passport detail must preserve a selected match');
  await page.locator('[data-session-action="passport"]').click();await page.reload();
  await page.locator('[data-session-action="journey-resume"]').click();assert.equal(await page.evaluate(()=>PlaySession.entry().key),'matches');assert.equal(await page.evaluate(()=>PlaySession.learningRun().task.source),from);
  if(lang==='both'){await context.close();continue;}
  await page.locator('[data-lg-action="hint"]').click();await page.locator('[data-session-action="skip"]').click();await page.locator('[data-session-action="skip"]').click();
  assert.equal(await page.evaluate(()=>AtlasQuiz.current().id),'atlas-04');
  await page.locator('[data-atlas-action="select"][data-atlas-value="0"]').click();await page.locator('[data-atlas-action="check"]').click();
  await page.locator('[data-atlas-action="practice"]').click();await page.locator('[data-atlas-action="select"][data-atlas-value="2"]').click();await page.locator('[data-atlas-action="check"]').click();
  const xp=await page.evaluate(()=>data.xp),beforeNext=await page.evaluate(()=>data.expedition.results.length);
  await page.locator('[data-session-action="passport"]').click();dialog=page.locator('.passport-dialog');assert.equal(await dialog.locator('[data-station-index="3"]').first().getAttribute('data-status'),'rehearsed');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>data.expedition.results.length),beforeNext,'Viewing current feedback must not append a duplicate result');assert.equal(await page.evaluate(()=>data.xp),xp);
  await page.locator('[data-atlas-action="next"]').click();assert.equal(await page.locator('.journey-interlude .passport-station').count(),13);
  if(lang==='he')await page.screenshot({path:'artifacts/passport-interlude-he.png',fullPage:true});
  // Arrive at the maze and make sure arrow keys inside the modal never reach its controls.
  while(await page.evaluate(()=>PlaySession.state().index<9)){
   if(await page.locator('[data-session-action="continue"]').count())await page.locator('[data-session-action="continue"]').click();else await page.locator('[data-session-action="skip"]').click();
  }
  if(await page.locator('[data-session-action="continue"]').count())await page.locator('[data-session-action="continue"]').click();
  assert.equal(await page.evaluate(()=>PlaySession.entry().key),'maze');
  const maze=await page.evaluate(()=>JSON.stringify(PlaySession.learningRun().task));
  await page.locator('[data-session-action="passport"]').click();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>JSON.stringify(PlaySession.learningRun().task)),maze,'Modal keyboard use must not move the maze player');
  while(await page.evaluate(()=>PlaySession.state().status!=='complete')){
   if(await page.locator('[data-session-action="continue"]').count())await page.locator('[data-session-action="continue"]').click();else await page.locator('[data-session-action="skip"]').click();
  }
  assert.equal(await page.locator('.journey-finish .passport-station').count(),13);assert.equal(await page.locator('.review-exercise').count(),13);assert.equal(await page.evaluate(()=>data.xp),xp);
  const statuses=await page.locator('.journey-finish .passport-station').evaluateAll(els=>els.map(el=>el.dataset.status));
  assert.equal(statuses.filter(s=>s==='independent').length,1);assert.equal(statuses.filter(s=>s==='rehearsed').length,1);assert.equal(statuses.filter(s=>s==='skipped').length,11);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+':finish overflow');
  await page.screenshot({path:`artifacts/passport-finish-${lang}.png`,fullPage:true});
  const saved=await page.evaluate(()=>JSON.stringify(JourneyPassport.model(data.expedition)));await page.reload();assert.equal(await page.evaluate(()=>JSON.stringify(JourneyPassport.model(data.expedition))),saved,'Existing version1 expedition restores all passport results');
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log('Passport: truthful result states, 13 unique stations, no future solutions, keyboard/focus/state isolation, refresh during viewing, partial matches, maze safety, he/ru complete journeys, bilingual mobile/reduced motion, unchanged XP and existing summaries passed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
