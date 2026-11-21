const assert = require('node:assert/strict');
const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');
let server, browser;
(async () => {
  server = createStaticServer(8792);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8792');
  const catalog = await page.evaluate(() => {
    const fail=[], report={}, last={};
    const area = polygon => Math.abs(polygon.reduce((sum, p, i) => { const next=polygon[(i+1)%polygon.length]; return sum+p[0]*next[1]-next[0]*p[1]; },0))/2;
    const inspectPaper=(paper,label)=>{const total=paper.reduce((sum,l)=>sum+area(l.poly),0);if(Math.abs(total-1)>1e-6)fail.push(`${label}:paper-area:${total}`);for(const layer of paper){if(layer.poly.some(p=>!p.every(Number.isFinite)))fail.push(`${label}:invalid-coordinate`);if(layer.matrix){const[a,b,c,d]=layer.matrix;if(Math.abs(Math.abs(a*d-b*c)-1)>1e-7)fail.push(`${label}:not-a-rigid-fold`);}}};
    for(const game of Object.keys(LearningGames.catalog).filter(game=>LearningGames.catalog[game].mode!=='atlas')){
      const unique=new Set(),ids=new Set(),variants={};
      for(let stage=1;stage<=100;stage++)for(let index=0;index<10;index++){
        const q=LearningGames.create(game,stage,index);ids.add(q.id);unique.add(LearningGames.contentKey(game,q));variants[q.variant||q.family||game]=(variants[q.variant||q.family||game]||0)+1;
        if(!q.prompt.he||!q.prompt.ru||q.hints.length!==3||LearningGames.check(q))fail.push(`${q.id}:invalid-start`);
        if(game==='matches'){
          const original=q.board.slice();
          if(!q.board[q.solutionMove[0]]||q.board[q.solutionMove[1]])fail.push(`${q.id}:illegal-move`);
          LearningGames.act(q,'match',q.solutionMove[0]);LearningGames.act(q,'match',q.solutionMove[1]);
          if(q.board.reduce((s,v)=>s+v,0)!==original.reduce((s,v)=>s+v,0))fail.push(`${q.id}:match-count-changed`);
          const decoded=Array.from({length:q.width*3},(_,i)=>LearningGames.SEG.findIndex(seg=>seg.every((v,j)=>v===q.board[i*7+j])));
          const values=[0,1,2].map(i=>Number(decoded.slice(i*q.width,(i+1)*q.width).join('')));
          if(decoded.includes(-1)||(q.operator==='+'?values[0]+values[1]:values[0]-values[1])!==values[2])fail.push(`${q.id}:bad-arithmetic`);
          if(!LearningGames.check(q))fail.push(`${q.id}:solution-rejected`);
          LearningGames.act(q,'undo');if(q.board.join()!==original.join()||q.moves!==0)fail.push(`${q.id}:undo`);
        }else if(game==='origami'){
          inspectPaper(q.paper,q.id);
          for(const step of q.recipe){inspectPaper(step.before,q.id);inspectPaper(step.after,q.id);}
          if(q.variant==='fold'){
            if(q.options.length!==4||new Set(q.options.map(o=>LearningGames.paperKey(o.paper))).size!==4)fail.push(`${q.id}:ambiguous-fold`);
            q.options.forEach(o=>inspectPaper(o.paper,q.id));
            if(LearningGames.paperKey(q.options[q.answer].paper)!==LearningGames.paperKey(q.target))fail.push(`${q.id}:wrong-target`);
          }else{
            if(!q.holes.length||q.holes.some(h=>h.some(v=>v< -1e-7||v>1+1e-7)))fail.push(`${q.id}:invalid-hole`);
            if(new Set(q.options.map(o=>JSON.stringify(o.holes))).size!==4)fail.push(`${q.id}:ambiguous-hole-pattern`);
            if(JSON.stringify(q.options[q.answer].holes)!==JSON.stringify(q.holes))fail.push(`${q.id}:wrong-hole-answer`);
          }
          q.selected=q.answer;if(!LearningGames.check(q))fail.push(`${q.id}:answer`);
        }else if(game==='hebrew'){
          if(q.picture)LearningArt.render(q.picture);
          if(q.variant==='build'){
            for(const letter of q.word){const i=q.tiles.findIndex((v,i)=>v===letter&&!q.chosen.includes(i));if(i<0)fail.push(`${q.id}:missing-letter`);else LearningGames.act(q,'letter',i);}
          }else{
            const expected=q.variant==='letter'?q.letter:q.variant==='initial'?q.word[0]:q.variant==='missing'?q.word[q.position]:q.word;
            if(q.options.filter(o=>o.he===expected).length!==1||q.options[q.answer].he!==expected)fail.push(`${q.id}:wrong-hebrew-answer`);
            q.selected=q.answer;
          }
          if(!LearningGames.check(q))fail.push(`${q.id}:hebrew-rejected`);
        }else{
          const seen=new Set([q.start]),queue=[q.start];let edges=0;
          for(let i=0;i<q.passages.length;i++)for(const to of q.passages[i]){edges++;const distance=Math.abs(i%q.n-to%q.n)+Math.abs(Math.floor(i/q.n)-Math.floor(to/q.n));if(distance!==1||!q.passages[to].includes(i))fail.push(`${q.id}:illegal-corridor`);}
          for(let at=0;at<queue.length;at++)for(const to of q.passages[queue[at]])if(!seen.has(to)){seen.add(to);queue.push(to);}
          if(seen.size!==q.n*q.n||edges!==2*(q.n*q.n-1))fail.push(`${q.id}:disconnected-maze`);
          for(const to of LearningGames.mazePath(q).slice(1)){const diff=to-q.position,dir=diff===-q.n?'up':diff===q.n?'down':diff===-1?'left':'right';if(!LearningGames.act(q,'move',dir))fail.push(`${q.id}:path-blocked`);}
          if(!LearningGames.check(q))fail.push(`${q.id}:goal-not-reached`);
        }
        if(stage===100&&index===9)last[game]=LearningGames.create(game,stage,index);
      }
      report[game]={stages:100,perStage:10,ids:ids.size,distinct:unique.size,variants};
      if(unique.size!==1000||ids.size!==1000)fail.push(`${game}:not-1000-distinct`);
    }
    // Known paper experiment: two half folds produce four symmetric holes.
    const square=[{poly:[[0,0],[1,0],[1,1],[0,1]],face:0,matrix:[1,0,0,1,0,0]}];
    const folded=LearningGames.foldPaper(LearningGames.foldPaper(square,{n:[1,0],offset:.5}),{n:[0,1],offset:.5});
    const holes=LearningGames.punch(folded,[.25,.25]).map(v=>v.map(x=>+x.toFixed(5)).join(',')).sort();
    if(JSON.stringify(holes)!==JSON.stringify(['0.25,0.25','0.25,0.75','0.75,0.25','0.75,0.75']))fail.push('paper:known-quarter-fold');
    for(const id of Object.keys(LearningArt.names))LearningArt.render(id);
    return{fail:fail.slice(0,30),report,last};
  });
  assert.deepEqual(catalog.fail,[]);
  // A fresh browser visiting level 100 gets the exact same lesson without history or random state.
  const fresh=await browser.newPage();await fresh.goto('http://127.0.0.1:8792');
  const randomAccess=await fresh.evaluate(()=>Object.fromEntries(Object.keys(LearningGames.catalog).filter(game=>LearningGames.catalog[game].mode!=='atlas').map(game=>[game,LearningGames.create(game,100,9)])));
  assert.deepEqual(randomAccess,catalog.last);await fresh.close();

  async function openStage(game,stage){await page.locator(`[data-lg-action="open"][data-lg-value="${game}"]`).click();assert.equal(await page.locator('[data-lg-action="stage"]').count(),100);await page.locator(`[data-lg-action="stage"][data-lg-value="${stage}"]`).click();}
  async function current(){return page.evaluate(()=>LearningUI.state().sessions[LearningUI.state().activeGame].task);}
  async function solve(){
    let q=await current();
    if(q.game==='matches'){for(const i of q.solutionMove)await page.locator(`[data-lg-action="match"][data-lg-value="${i}"]`).click();}
    else if(q.game==='maze'){const path=await page.evaluate(()=>LearningGames.mazePath(LearningUI.state().sessions.maze.task));for(const to of path.slice(1)){const d=to-q.position;await page.keyboard.press(d===-q.n?'ArrowUp':d===q.n?'ArrowDown':d===-1?'ArrowLeft':'ArrowRight');q.position=to;}}
    else if(q.game==='hebrew'&&q.variant==='build'){const used=[];for(const letter of q.word){const i=q.tiles.findIndex((v,i)=>v===letter&&!used.includes(i));used.push(i);await page.locator(`[data-lg-action="letter"][data-lg-value="${i}"]`).click();}}
    else await page.locator(`[data-lg-action="option"][data-lg-value="${q.answer}"]`).click();
    await page.locator('[data-lg-action="check"]').click();await page.locator('.lg-feedback.success').waitFor();
  }
  await page.locator('[data-action="puzzle-auto"]').click();
  for(const game of Object.keys(catalog.report)){
    await openStage(game,1);
    for(let i=0;i<10;i++){assert.equal((await current()).index,i);await solve();await page.locator('[data-lg-action="next"]').click();}
    await page.locator('.lg-course-summary').waitFor();
    assert.equal(await page.evaluate(game=>LearningUI.state().progress[game][1].best,game),10);
    await page.reload();await page.locator(`[data-lg-action="open"][data-lg-value="${game}"]`).click();
    assert.equal(await page.locator('[data-lg-action="stage"][data-lg-value="1"]').getAttribute('class').then(s=>s.includes('completed')),true);
    await page.locator('[data-lg-action="stage"][data-lg-value="100"]').click();
    await solve();await page.locator('[data-lg-action="next"]').click();
    assert.equal((await current()).index,1);
    await page.locator('[data-action="home"]').first().click();
  }
  // Partial board input survives reloading and is not awarded XP twice.
  await openStage('matches',7);const before=await current();
  await page.locator(`[data-lg-action="match"][data-lg-value="${before.solutionMove[0]}"]`).click();
  await page.reload();await page.locator('[data-lg-action="open"][data-lg-value="matches"]').click();await page.locator('[data-lg-action="resume"]').click();
  assert.equal((await current()).source,before.solutionMove[0]);
  await page.locator(`[data-lg-action="match"][data-lg-value="${before.solutionMove[1]}"]`).click();await page.locator('[data-lg-action="check"]').click();
  const xp=await page.evaluate(()=>MishaLab.getData().xp);await page.reload();await page.locator('[data-lg-action="open"][data-lg-value="matches"]').click();await page.locator('[data-lg-action="resume"]').click();assert.equal(await page.evaluate(()=>MishaLab.getData().xp),xp);
  await page.locator('[data-action="home"]').first().click();
  // Later Hebrew stages include building a word from letters, including unused distractors.
  await openStage('hebrew',80);for(let i=0;i<4;i++){await page.locator('[data-lg-action="skip"]').click();await page.locator('[data-lg-action="next"]').click();}
  assert.equal((await current()).variant,'build');await solve();
  await page.locator('[data-action="home"]').first().click();
  // Automatic advancement respects the ten-exercise stage and the shared pause switch.
  await page.clock.install();await openStage('matches',3);await page.locator('[data-action="puzzle-auto"]').click();await solve();await page.clock.runFor(4100);assert.equal((await current()).index,1);
  await solve();await page.locator('[data-action="puzzle-auto"]').click();await page.clock.runFor(6000);assert.equal((await current()).index,1);
  await page.locator('[data-action="home"]').first().click();await page.locator('[data-action="teacher"]').click();assert.equal(await page.locator('.lg-teacher-grid .stat').count(),5);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify(catalog.report));
  console.log('4,000 distinct deterministic exercises, physical folding, solvable puzzles, four complete ten-task stages, stage 100, save/resume, Hebrew building, and automatic advancement passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
