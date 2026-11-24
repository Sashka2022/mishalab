const assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const {createStaticServer}=require('./static-server.cjs');
const bank=require('../atlas/questions.json');
let server,browser;
(async()=>{
 server=createStaticServer(0);await new Promise(resolve=>server.once('listening',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];
 async function setup(lang,width){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.addInitScript(()=>{
   window.atlasSpoken=[];
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
   Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return[{lang:'he-IL',name:'Hebrew'},{lang:'ru-RU',name:'Russian'}];},speak(u){window.atlasSpoken.push({text:u.text,lang:u.lang});},addEventListener(){}}});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // New summary celebration is verified separately in rewards-ui.cjs; dismiss it to continue the legacy flow.
  await page.addLocatorHandler(page.locator('[data-reward-action="dismiss-rank"]'),async button=>button.click());
  await page.goto(origin);await page.locator(`[data-lang="${lang}"]`).click();
  return{page,context};
 }
 async function choose(page,value){await page.locator(`[data-atlas-action="select"][data-atlas-value="${value}"]`).click();await page.locator('[data-atlas-action="check"]').click();}
 async function startMap(page){
  if(await page.locator('[data-home-tab="courses"]').isVisible())await page.locator('[data-home-tab="courses"]').click();await page.locator('[data-lg-value="trivia"]').click();await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="begin"]').click();
  for(let i=0;i<3;i++){assert.equal(await page.locator('[data-atlas-action="hint"]').count(),0,'Other questions have no invented generic hints');await choose(page,bank.questions[i].answer);await page.locator('[data-atlas-action="next"]').click();}
  assert.equal(await page.evaluate(()=>AtlasQuiz.current().id),'atlas-04');
 }
 async function finishRound(page){
  await page.locator('[data-atlas-action="next"]').click();
  for(let i=4;i<8;i++){await choose(page,bank.questions[i].answer);await page.locator('[data-atlas-action="next"]').click();}
 }
 for(const[lang,width,retry]of[['he',1440,true],['ru',390,false]]){
  const{page,context}=await setup(lang,width);await startMap(page);
  assert.equal(await page.locator('[data-atlas-action="select"]').count(),3);
  await page.locator('.atlas-postcard img').evaluate(img=>img.decode());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('[data-atlas-action="hear"]').click();
  await page.locator('[data-atlas-action="hint"]').click();
  const firstHint=await page.evaluate(()=>AtlasQuiz.current().hints[0]);
  assert.ok((await page.locator('#atlas-hint').innerText()).includes(firstHint[lang]));
  let spoken=await page.evaluate(()=>atlasSpoken.at(-1));assert.ok(spoken.text.includes(firstHint[lang]));assert.equal(spoken.lang,lang==='he'?'he-IL':'ru-RU');
  const beforeXP=await page.evaluate(()=>data.xp);
  await choose(page,retry?0:2);
  assert.ok((await page.locator('#atlas-feedback').innerText()).includes(bank.questions[3].fact[lang]));
  assert.ok((await page.locator('.atlas-correct-answer').innerText()).includes(bank.questions[3].options[2][lang]));
  assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].answers.length),4);
  assert.equal(await page.evaluate(()=>data.xp),beforeXP+(retry?0:24));
  if(retry){
   await page.reload();
   assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].questionState['atlas-04'].hint),1);
   for(const answer of [1,2]){
    await page.locator('[data-atlas-action="practice"]').click();
    assert.equal(await page.locator('[data-atlas-action="check"]').isDisabled(),true);
    assert.equal(await page.locator('[data-atlas-action="next"]').isEnabled(),true,'Practice never blocks progress');
    assert.equal(await page.locator('.atlas-practice-note').count(),1);
    if(answer===1){await page.locator('[data-atlas-action="hint"]').click();await page.reload();assert.equal(await page.locator('.atlas-practice-note').count(),1);}
    await choose(page,answer);
   }
   await page.reload();
   const state=await page.evaluate(()=>({q:AtlasQuiz.state().runs[1].questionState['atlas-04'],result:AtlasQuiz.state().runs[1].answers[3],xp:data.xp}));
   assert.equal(state.q.practiceAttempts,2);assert.equal(state.q.practiceResult.correct,true);assert.equal(state.q.hint,2);
   assert.equal(state.result.correct,false);assert.equal(state.result.selected,0);assert.equal(state.xp,beforeXP);
  }else assert.equal(await page.locator('[data-atlas-action="practice"]').count(),0);
  await finishRound(page);
  assert.equal((await page.locator('.atlas-score').innerText()).replace(/\s/g,''),retry?'7/8':'8/8');
  assert.equal(await page.locator('.atlas-remember li').count(),2);
  const report=await page.evaluate(()=>data.sessionReports.at(-1).results);
  assert.equal(report.length,8);assert.equal(report[3].id,'atlas-04');assert.equal(report[3].hints,retry?2:1);assert.equal(report[3].attempts,retry?3:1);assert.equal(report[3].correct,!retry);
  assert.ok(report[3].detail.he.includes('4'),'Report identifies the actual fourth question');
  if(retry){assert.equal(report[3].practiced,true);assert.equal(report[3].practiceSolved,true);}
  const single=await page.evaluate(result=>SessionReview.render([result],AtlasQuestions.title),report[3]);assert.ok(single.includes('0 בפתרון עצמאי')||single.includes('0 самостоятельно')||single.includes('עוד אין מספיק פתרונות')||single.includes('Пока недостаточно решений'));
  await page.locator('.review-exercises>summary').click();
  if(retry)assert.match(await page.locator('.review-exercise').nth(3).innerText(),/אחרי הצגת הפתרון/);
  await page.reload();assert.equal(await page.evaluate(()=>data.sessionReports.at(-1).results[3].hints),retry?2:1);
  await context.close();
 }
 // Accessible hints are genuinely parallel text; they do not refer to a hidden map.
 const{page,context}=await setup('he',390);await startMap(page);
 await page.locator('[data-atlas-action="accessible"]').click();
 assert.equal(await page.locator('.atlas-postcard').count(),0);
 for(let i=0;i<3;i++){
  await page.locator('[data-atlas-action="hint"]').click();
  assert.ok((await page.locator('#atlas-hint').innerText()).includes(await page.evaluate(i=>AtlasQuiz.current().accessibleHints[i].he,i)));
 }
 assert.equal(await page.locator('[data-atlas-action="hint"]').isDisabled(),true);
 await page.reload();assert.equal(await page.locator('.atlas-postcard').count(),0);
 assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].questionState['atlas-04'].hint),3);
 await page.locator('[data-atlas-action="accessible"]').click();
 assert.ok((await page.locator('#atlas-hint').innerText()).includes(await page.evaluate(()=>AtlasQuiz.current().hints[2].he)));
 await choose(page,2);await finishRound(page);
 assert.equal(await page.evaluate(()=>data.sessionReports.at(-1).results[3].hints),3);
 // Old saves without questionState and metadata still restore their exact score/selection.
 await page.evaluate(()=>{
  const value=JSON.parse(localStorage.getItem(AtlasQuiz.storageKey));
  value.activeRound=1;value.view='task';const r=value.runs[1];r.index=3;r.complete=false;r.selected=0;r.answers=r.answers.slice(0,4).map(a=>({id:a.id,selected:a.selected,correct:a.correct}));delete r.questionState;
  localStorage.setItem(AtlasQuiz.storageKey,JSON.stringify(value));
 });
 await page.reload();assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].answers[3].correct),true);assert.equal(await page.locator('#atlas-feedback').count(),1);
 // General journey delegates hints/practice to the same question and records real help use.
 await page.locator('[data-action="home"]').first().click();await page.evaluate(()=>{data.expeditionCount=3;});
 await page.locator('[data-action="daily"]').click();await page.locator('.launch-levels [data-value="1"]').click();await page.locator('[data-session-action="begin"]').click();
 for(let i=0;i<3;i++)await page.locator('[data-session-action="skip"]').click();
 assert.equal(await page.evaluate(()=>AtlasQuiz.current().id),'atlas-04');
 await page.locator('[data-atlas-action="hint"]').click();await choose(page,0);
 await page.locator('[data-atlas-action="practice"]').click();await choose(page,2);await page.locator('[data-atlas-action="next"]').click();
 const mixed=await page.evaluate(()=>PlaySession.state().results[3]);assert.equal(mixed.activity,'atlas');assert.equal(mixed.correct,false);assert.equal(mixed.hints,1);assert.equal(mixed.attempts,2);assert.equal(mixed.practiced,true);assert.equal(mixed.practiceSolved,true);
 await context.close();assert.deepEqual(errors,[]);
 console.log('Atlas observation: complete he/desktop and ru/mobile rounds; graded hints, accessible variants, wrong/retry/right, speech, refresh, original score/XP, honest reports, old saves and mixed-journey metadata passed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
