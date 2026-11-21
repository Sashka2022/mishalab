const assert=require('node:assert/strict');
const fs=require('node:fs');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
let server,browser;
(async()=>{
 server=createStaticServer(8804);browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8804');
 async function home(){await page.locator('[data-action="home"]').first().click();}
 async function level(n){await page.locator(`.launch-levels [data-session-action="level"][data-value="${n}"]`).click();await page.locator('[data-session-action="begin"]').click();}
 const entries=await page.evaluate(()=>PlaySession.choices());assert.equal(entries.length,13);assert.equal(new Set(entries.map(e=>e.key)).size,13);
 // Every entry point offers a level, and its exact selection reaches the actual game engine.
 for(const n of [1,7])for(const e of entries){
  if(e.kind==='core')await page.locator(`[data-track="${e.key}"]`).first().click();
  else if(e.kind==='puzzle')await page.locator(`[data-puzzle-kind="${e.key}"]`).first().click();
  else await page.locator(`[data-lg-value="${e.kind==='atlas'?'trivia':e.key}"]`).click();
  assert.equal(await page.locator('.game-launch').count(),1,e.key);assert.equal(await page.locator('.launch-levels button').count(),10);
  await level(n);
  const actual=await page.evaluate(e=>e.kind==='learning'?LearningUI.state().sessions[e.key].stage:e.kind==='atlas'?AtlasQuiz.state().activeRound:session.task.level,e);
  assert.equal(actual,e.kind==='learning'?1+(n-1)*11:n,e.key);
  await home();
 }
 // Atlas resumes the saved question even when a different launch level was selected.
 await page.locator('[data-lg-value="trivia"]').click();await level(3);
 const atlasAnswer=await page.evaluate(()=>AtlasQuiz.current().answer);
 await page.locator(`[data-atlas-action="select"][data-atlas-value="${atlasAnswer}"]`).click();await page.locator('[data-atlas-action="check"]').click();await page.locator('[data-atlas-action="next"]').click();await home();
 await page.locator('[data-lg-value="trivia"]').click();await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="resume"]').click();
 assert.equal(await page.evaluate(()=>AtlasQuiz.state().activeRound),3);assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[3].index),1);await home();
 // A standalone game can resume its existing level without applying a new selection.
 await page.locator('[data-track="math"]').first().click();await level(7);await home();
 await page.locator('[data-track="math"]').first().click();await page.locator('[data-session-action="level"][data-value="2"]').click();
 await page.locator('[data-session-action="resume"]').click();assert.equal(await page.evaluate(()=>session.task.level),7);await home();
 async function solveCurrent(useHint=false,wrongAtlas=false){
  const e=await page.evaluate(()=>PlaySession.entry());
  if(e.kind==='atlas'){
   const q=await page.evaluate(()=>AtlasQuiz.current());
   await page.locator(`[data-atlas-action="select"][data-atlas-value="${wrongAtlas?(q.answer+1)%3:q.answer}"]`).click();await page.locator('[data-atlas-action="check"]').click();await page.locator('[data-atlas-action="next"]').click();return;
  }
  const q=await page.evaluate(()=>PlaySession.entry().run.task);
  if(useHint)await page.locator(e.kind==='learning'?'[data-lg-action="hint"]':'[data-action="hint"]').click();
  if(e.kind==='learning'){
   if(q.game==='matches'){for(const value of q.solutionMove)await page.locator(`[data-lg-action="match"][data-lg-value="${value}"]`).click();}
   else if(q.game==='maze'){
    const path=await page.evaluate(()=>LearningGames.mazePath(PlaySession.learningRun().task));let position=q.position;
    for(const dest of path.slice(1)){const d=dest-position;await page.keyboard.press(d===-q.n?'ArrowUp':d===q.n?'ArrowDown':d===-1?'ArrowLeft':'ArrowRight');position=dest;}
   }else if(q.game==='hebrew'&&q.variant==='build'){
    const used=[];for(const ch of q.word){const idx=q.tiles.findIndex((v,i)=>v===ch&&!used.includes(i));used.push(idx);await page.locator(`[data-lg-action="letter"][data-lg-value="${idx}"]`).click();}
   }else await page.locator(`[data-lg-action="option"][data-lg-value="${q.answer}"]`).click();
   await page.locator('[data-lg-action="check"]').click();assert.equal(await page.evaluate(()=>PlaySession.entry().run.task.finished),true,q.game);await page.locator('[data-lg-action="next"]').click();return;
  }
  if(q.mode==='puzzle'){
   if(q.type==='sudoku'){
    for(let i=0;i<q.board.length;i++)if(!q.initial[i]){await page.locator(`[data-puzzle-action="select"][data-puzzle-value="${i}"]`).click();await page.locator(`[data-puzzle-action="digit"][data-puzzle-value="${q.answer[i]}"]`).click();}
   }else if(q.type==='lights'){for(const i of q.solution)await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${i}"]`).click();}
   else if(q.type==='sliding'){for(const value of q.solution){const i=await page.evaluate(value=>session.task.board.indexOf(value),value);await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${i}"]`).click();}}
   else {for(let i=0;i<q.board.length;i++)if(q.board[i]!==q.answer[i])await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${i}"]`).click();}
  }else if(q.mode==='number'||q.mode==='open')await page.locator('#answer').fill(q.mode==='open'?'בדקתי את הכלל':String(q.answer));
  else if(q.mode==='options')await page.locator(`[data-option="${q.answer}"]`).click();
  else if(q.mode==='chess')await page.locator(`[data-square="${q.answer[0]}"]`).click();
  else if(q.mode==='grid'){for(let i=0;i<q.answer;i++)await page.locator(`[data-cell="${i}"]`).click();}
  else if(q.mode==='match'){
   const move=await page.evaluate(()=>{const q=session.task;for(let from=0;from<21;from++)if(q.board[from])for(let to=0;to<21;to++)if(!q.board[to]){const copy=JSON.parse(JSON.stringify(q));copy.board[from]=0;copy.board[to]=1;copy.moves=1;if(checkAnswer(copy))return[from,to];}});
   for(const i of move){await page.locator(`[data-match="${i}"]`).focus();await page.keyboard.press('Enter');}
  }
  await page.locator('[data-action="check"]').click();assert.equal(await page.evaluate(()=>session.task.finished),true,q.type);await page.locator('[data-action="next"]').click();
 }
 fs.mkdirSync('artifacts',{recursive:true});
 for(const [lang,width,n] of [['he',1440,1],['ru',390,4]]){
  await page.setViewportSize({width,height:width===390?844:1000});await page.locator(`[data-lang="${lang}"]`).click();await page.locator('[data-action="daily"]').click();
  await page.locator(`.launch-levels [data-session-action="level"][data-value="${n}"]`).click();await page.screenshot({path:`artifacts/session-level-${lang}.png`,fullPage:true});await page.locator('[data-session-action="begin"]').click();
  for(let i=0;i<13;i++){
   if(await page.locator('[data-session-action="continue"]').count()){
    const before=await page.evaluate(()=>JSON.stringify(PlaySession.state()));
    if(i===4){
     await page.locator('[data-break-action="open"]').click();await page.waitForTimeout(100);await page.keyboard.press('Space');await page.waitForTimeout(100);
     assert.ok(await page.evaluate(()=>BreakGame.state().y<0));await page.locator('[data-hop="pause"]').click();const elapsed=await page.evaluate(()=>BreakGame.state().elapsed);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>BreakGame.state().elapsed),elapsed);
     await page.screenshot({path:`artifacts/star-hop-${lang}.png`});await page.locator('[data-hop="close"]').last().click();assert.equal(await page.evaluate(()=>JSON.stringify(PlaySession.state())),before);
    }
    await page.locator('[data-session-action="continue"]').click();
   }
   const current=await page.evaluate(()=>PlaySession.entry());assert.equal(current.level,n);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${lang}:${current.key}:overflow`);
   if(i===1){
    const from=await page.evaluate(()=>PlaySession.learningRun().task.solutionMove[0]);
    await page.locator(`[data-lg-action="match"][data-lg-value="${from}"]`).click();
    await page.screenshot({path:`artifacts/journey-matches-${lang}.png`,fullPage:true});await home();
    await page.locator('[data-track="math"]').first().click();await level(2);
    const savedSignature=await page.evaluate(()=>session.task.signature);await home();await page.reload();
    await page.locator('[data-session-action="journey-resume"]').click();assert.equal(await page.evaluate(()=>PlaySession.entry().key),'matches');
    assert.equal(await page.evaluate(()=>PlaySession.learningRun().task.source),from);
    assert.equal(await page.evaluate(()=>PlaySession.state().previousSession.task.signature),savedSignature);
    await page.locator(`[data-lg-action="match"][data-lg-value="${from}"]`).click();
   }
   await solveCurrent(i===1,i===3);
  }
  assert.equal(await page.locator('.journey-finish').count(),1);assert.equal(await page.locator('.review-exercise').count(),13);
  assert.ok(await page.locator('.review-strengths article').count());const result=await page.evaluate(()=>PlaySession.state().results);assert.equal(result.filter(r=>r.correct).length,12);assert.equal(result.find(r=>r.activity==='matches').hints,1);
  await page.locator('.review-exercises>summary').click();await page.screenshot({path:`artifacts/session-review-${lang}.png`,fullPage:true});
  if(lang==='he')await page.clock.install();
  const xpBefore=await page.evaluate(()=>data.xp);
  await page.locator('[data-break-action="open"]').click();await page.clock.runFor(16000);
  assert.equal(await page.evaluate(()=>BreakGame.state().finished),true);assert.equal(await page.evaluate(()=>data.xp),xpBefore);
  await page.locator('[data-hop="close"]').last().click();
  await page.clock.runFor(20000);assert.equal(await page.locator('.journey-finish').count(),1);await page.clock.resume();
  await home();await page.reload();await page.locator('[data-session-action="last"]').click();assert.equal(await page.locator('.review-exercise').count(),13);await home();
 }
 // A new standalone core session also ends on a durable report.
 await page.locator('[data-track="math"]').first().click();await level(1);
 for(let i=0;i<5;i++){
  await page.evaluate(()=>{session.task.attempts=1;finishTask(true);render();});await page.locator('[data-action="next"]').click();
 }
 assert.equal(await page.locator('.session-review').count(),1);assert.equal(await page.locator('.review-exercise').count(),5);
 assert.deepEqual(errors,[]);console.log('26 exact difficulty openings, all 13 native games in two complete mixed sessions, desktop/mobile, he/ru, partial resume, 13-result summaries, hints/wrong answers, saved report, optional jumps/pause, durable standalone summary passed.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
