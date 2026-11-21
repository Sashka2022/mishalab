const assert = require('node:assert/strict');
const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');
let browser, server;
(async () => {
  server = createStaticServer(8813);
  browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page = await browser.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8813');
  const generated = await page.evaluate(() => {
    let checked=0;
    const fail=[];
    for(const domain of ['math','logic','geometry','chess'])for(let level=1;level<=10;level++)for(let i=0;i<80;i++){
      const q=MishaLab.generateQuestion(domain,level);
      if(q.mode==='open'||q.type==='research'||!MishaLab.validQuestion(q))fail.push(`${domain}:${level}:${q.type}`);
      if(typeof MishaLab.checkAnswer(q,'wrong')!=='boolean')fail.push(`no-verdict:${q.type}`);
      checked++;
    }
    for(let i=0;i<100;i++){
      const q=MishaLab.generateQuestion('math',10,'multi'),target=Number(q.display.match(/\d+/)[0]);
      let count=0;for(let a=1;a<target;a++)for(let b=a;b<target;b++)if(a+b===target)count++;
      if(!MishaLab.checkAnswer(q,count)||MishaLab.checkAnswer(q,count+1)||MishaLab.checkAnswer(q,''))fail.push('pair-count');
      const parity=MishaLab.generateQuestion('math',10,'always');
      const nums=parity.display.match(/\d+/g).map(Number);
      if(nums.some(n=>n%2!==1)||(nums[0]+nums[1])%2!==0)fail.push('parity-fact');
      if(parity.options[parity.answer].he!=='הסכום זוגי')fail.push('parity-label');
      for(let selected=0;selected<3;selected++)if(MishaLab.checkAnswer({...parity,selected})!==(selected===parity.answer))fail.push('parity-check');
      const replacement=MishaLab.generateQuestion('math',10,'research');
      if(!MishaLab.validQuestion(replacement)||replacement.mode==='open'||replacement.type==='research')fail.push('deprecated-type');
    }
    if(MishaLab.validQuestion({domain:'math',type:'research',mode:'open',prompt:{he:'ישן',ru:'Старое'},hints:[1,2,3]}))fail.push('open-is-valid');
    return {checked,fail};
  });
  assert.deepEqual(generated.fail,[]);
  // The former third-round injection must also generate a checked final exercise.
  await page.evaluate(()=>{
    data.rounds=[{track:'math'},{track:'math'}];
    startRound('math');session.results=Array.from({length:4},()=>({domain:'math',correct:true,open:false}));newTask();
  });
  assert.notEqual(await page.evaluate(()=>session.task.mode),'open');
  // Upgrade unfinished and finished saved open exercises without changing earned history/XP.
  for(const finished of [false,true]){
    await page.evaluate(finished=>{
      const r={domain:'math',type:'research',level:9,correct:false,open:true,hints:0,attempts:1,xp:12};
      data.xp=321;data.history=[{...r,at:'2026-11-20T12:00:00Z'}];data.rounds=[];
      session={track:'math',results:[{domain:'math',type:'add',correct:true,open:false},...(finished?[r]:[])],task:{domain:'math',level:9,type:'research',mode:'open',finished,input:'old response'},runTasks:2,started:new Date().toISOString()};
      saveProgress();
    },finished);
    await page.reload();
    const saved=await page.evaluate(()=>({q:session.task,results:session.results,xp:data.xp,history:data.history}));
    assert.notEqual(saved.q.mode,'open');assert.equal(saved.q.finished,false);assert.equal(saved.q.level,9);
    assert.equal(saved.results.length,1);assert.equal(saved.xp,321);assert.equal(saved.history.length,1);assert.equal(saved.history[0].open,true);
    await page.reload();assert.equal(await page.evaluate(()=>session.task.signature),saved.q.signature);
  }
  // Both the mixed journey and its temporarily parked standalone game are upgraded.
  await page.evaluate(()=>{
    PlaySession.start(8);
    const old={domain:'math',level:8,type:'multi',mode:'open',finished:false,input:'old response'};
    data.expedition.entries[0].run.task={...old};
    data.expedition.previousSession={track:'math',task:{...old,type:'always'},results:[],started:new Date().toISOString()};
    saveProgress();
  });
  await page.reload();
  assert.equal(await page.evaluate(()=>data.expedition.entries[0].run.task.mode),'number');
  assert.equal(await page.evaluate(()=>data.expedition.previousSession.task.mode),'options');
  await page.locator('[data-session-action="journey-resume"]').click();
  assert.equal(await page.locator('textarea').count(),0);
  const answer=await page.evaluate(()=>session.task.answer);
  await page.locator('#answer').fill(String(answer+1));await page.locator('[data-action="check"]').click();
  assert.equal(await page.evaluate(()=>session.task.finished),false);
  await page.locator('#answer').fill(String(answer));await page.locator('[data-action="check"]').click();
  assert.equal(await page.evaluate(()=>session.task.finished),true);assert.equal(await page.evaluate(()=>session.results[0].correct),true);assert.equal(await page.evaluate(()=>session.results[0].open),false);
  // Every home entry, including the four hero shortcuts and mixed-board button, first shows the picker.
  for(const [lang,width] of [['he',1440],['ru',390]]){
    await page.setViewportSize({width,height:900});
    await page.locator('[data-action="home"]').first().click();await page.locator(`[data-lang="${lang}"]`).click();
    const routes=await page.locator('#app [data-track],#app [data-puzzle-kind],#app [data-lg-action="open"],#app [data-action="daily"]').evaluateAll(els=>els.map((el,i)=>({index:i,key:el.dataset.track||el.dataset.puzzleKind||el.dataset.lgValue||'general'})));
    assert.equal(routes.length,19);
    for(const route of routes){
      await page.locator('#app [data-track],#app [data-puzzle-kind],#app [data-lg-action="open"],#app [data-action="daily"]').nth(route.index).click();
      assert.equal(await page.locator('.game-launch').count(),1,`${lang}:${route.key}`);
      assert.equal(await page.locator('.launch-levels button').count(),10);
      assert.equal(await page.locator('[data-session-action="begin"]').isVisible(),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.locator('.launch-levels [data-value="6"]').click();
      assert.equal(await page.locator('.launch-levels [data-value="6"]').getAttribute('aria-pressed'),'true');
      await page.locator('[data-action="home"]').first().click();
    }
  }
  await page.goto('http://127.0.0.1:8813/#atlas');
  await page.locator('.game-launch').waitFor();
  assert.equal(await page.locator('.game-launch').count(),1,'direct atlas entry');
  assert.deepEqual(errors,[]);
  console.log(`${generated.checked} checked exercises; pair/parity correctness; legacy native/mixed saves; 38 desktop/mobile entrances and direct atlas picker passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
