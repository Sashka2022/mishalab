const assert=require('node:assert/strict');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
let server,browser;
(async()=>{
 server=createStaticServer(0);await new Promise(resolve=>server.once('listening',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // New summary celebration is verified separately in rewards-ui.cjs; dismiss it to continue the legacy flow.
  await page.addLocatorHandler(page.locator('[data-reward-action="dismiss-rank"]'),async button=>button.click());
  await page.goto(origin);await page.locator('[data-lang="he"]').click();
 await page.evaluate(()=>{data.gameLevels={hebrew:9};data.puzzleAuto=false;saveProgress();});
 await page.locator('[data-track="math"]').first().click();await page.locator('.launch-levels [data-value="3"]').click();await page.locator('[data-session-action="begin"]').click();
 async function solve(){
  const q=await page.evaluate(()=>session.task);
  if(q.mode==='number')await page.locator('#answer').fill(String(q.answer));
  else if(q.mode==='options')await page.locator(`[data-option="${q.answer}"]`).click();
  else if(q.mode==='chess')await page.locator(`[data-square="${q.answer[0]}"]`).click();
  else if(q.mode==='grid'){for(let i=0;i<q.answer;i++)await page.locator(`[data-cell="${i}"]`).click();}
  else if(q.mode==='match'){
   const move=await page.evaluate(()=>{const q=session.task;for(let from=0;from<21;from++)if(q.board[from])for(let to=0;to<21;to++)if(!q.board[to]){const board=q.board.slice();board[from]=0;board[to]=1;if(MishaLab.checkAnswer({...q,board,moves:1}))return[from,to];}});
   assert.ok(move,'A generated match puzzle has a solution');
   for(const n of move){await page.locator(`[data-match="${n}"]`).focus();await page.keyboard.press('Enter');}
  }else throw Error('Unexpected core task mode '+q.mode);
  await page.locator('[data-action="check"]').click();assert.equal(await page.evaluate(()=>session.task.finished),true);
  await page.locator('[data-action="next"]').click();
 }
 for(let i=0;i<5;i++)await solve();
 const completed=await page.evaluate(()=>({level:data.levels.math,preferred:data.gameLevels.math,other:data.gameLevels.hebrew,score:data.rounds.at(-1).score}));
 assert.equal(completed.level,5);assert.equal(completed.score,100);assert.equal(completed.preferred,5);assert.equal(completed.other,9,'Adapting math must not change another game preference');
 await page.locator('[data-action="next-round"]').click();
 assert.equal(await page.locator('.launch-levels [data-value="5"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-session-action="begin"]').click();assert.equal(await page.evaluate(()=>session.task.level),5,'Starting the next round must not reset the earned level');
 await page.locator('[data-action="home"]').first().click();await page.reload();await page.locator('[data-track="math"]').first().click();
 assert.equal(await page.locator('.launch-levels [data-value="5"]').getAttribute('aria-pressed'),'true','Home card and refresh preserve the adapted opening level');
 // An explicit lower choice remains authoritative.
 await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="begin"]').click();assert.equal(await page.evaluate(()=>session.task.level),1);
 const signature=await page.evaluate(()=>session.task.signature);
 await page.locator('[data-action="home"]').first().click();await page.evaluate(()=>{data.expeditionCount=3;});
 await page.locator('[data-action="daily"]').click();await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="begin"]').click();
 for(let i=0;i<3;i++)await page.locator('[data-session-action="skip"]').click();
 assert.equal(await page.evaluate(()=>AtlasQuiz.current().id),'atlas-04');
 await page.locator('[data-atlas-action="hint"]').click();await page.locator('[data-atlas-action="hint"]').click();await page.locator('[data-session-action="skip"]').click();
 let result=await page.evaluate(()=>PlaySession.state().results[3]);
 assert.equal(result.hints,2);assert.equal(result.attempts,0);assert.equal(result.skipped,true);assert.equal(result.correct,false);
 await page.reload();result=await page.evaluate(()=>data.expedition.results[3]);assert.equal(result.hints,2);
 await page.locator('[data-session-action="journey-resume"]').click();
 for(let guard=0;guard<20&&await page.evaluate(()=>PlaySession.state().status!=='complete');guard++){
  if(await page.locator('[data-session-action="continue"]').count())await page.locator('[data-session-action="continue"]').click();
  else await page.locator('[data-session-action="skip"]').click();
 }
 assert.equal(await page.locator('.journey-finish').count(),1);
 const report=await page.evaluate(()=>data.sessionReports.at(-1).results);assert.equal(report.length,13);assert.equal(report[3].hints,2);assert.equal(report[3].skipped,true);
 await page.locator('.review-exercises>summary').click();assert.ok((await page.locator('.review-exercise').nth(3).innerText()).includes('רמזים: 2'));
 assert.equal(await page.evaluate(()=>data.expedition.previousSession.task.signature),signature,'Journey audit must preserve the standalone task');
 await page.locator('[data-action="home"]').first().click();await page.reload();await page.locator('[data-session-action="last"]').click();
 assert.equal(await page.evaluate(()=>data.sessionReports.at(-1).results[3].hints),2);
 assert.deepEqual(errors,[]);
 console.log('Audit regressions: earned math level 3→5 survives next-round/home/reload, explicit override and unrelated preference stay valid; skipped Atlas hints survive a complete 13-game report and reload');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
