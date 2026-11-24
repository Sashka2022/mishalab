const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');
const bank = require('../atlas/questions.json');
let server, browser;
(async () => {
  server = createStaticServer(8797);
  browser = await chromium.launch({ executablePath:'/usr/bin/chromium', args:['--no-sandbox'] });
  const errors = [], failures = [];
  const context = await browser.newContext();
  // Voice selection stays in the existing host mechanism; capture its utterances.
  await context.addInitScript(() => {
    window.atlasSpoken = [];
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return [{lang:'he-IL',name:'Hebrew'},{lang:'ru-RU',name:'Russian'}];},speak(u){window.atlasSpoken.push({text:u.text,lang:u.lang});},addEventListener(){}}});
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith('http://127.')) failures.push(r.url()); });
  // New summary celebration is verified separately in rewards-ui.cjs; dismiss it to continue the legacy flow.
  await page.addLocatorHandler(page.locator('[data-reward-action="dismiss-rank"]'),async button=>button.click());
  await page.goto('http://127.0.0.1:8797');
  // Existing card and old storage remain compatible; old trivia does not become Atlas progress.
  const old = { game:'trivia', stage:100, index:9, status:'playing', task:{id:'trivia:100:9:1'} };
  await page.evaluate(old => { LearningUI.state().sessions.trivia=old; LearningUI.state().progress.trivia={100:{best:10}}; saveProgress(); },old);
  await page.locator('[data-home-tab="courses"]').click();
  const oldStyle = await page.locator('[data-lg-value="matches"]').evaluate(el=>({color:getComputedStyle(el).color,border:getComputedStyle(el).borderRadius}));
  assert.match(await page.locator('[data-lg-value="trivia"]').innerText(),/אטלס הסקרנות/);
  if(await page.locator('[data-home-tab="courses"]').isVisible())await page.locator('[data-home-tab="courses"]').click();await page.locator('[data-lg-value="trivia"]').click();await page.locator('[data-session-action="browse"]').click();
  assert.equal(await page.locator('[data-atlas-action="start"]').count(),10);
  assert.deepEqual(await page.evaluate(()=>AtlasQuiz.state().progress),{});
  assert.equal(await page.evaluate(()=>AtlasQuiz.state().activeRound),null);
  await page.locator('[data-atlas-action="start"][data-atlas-value="1"]').click();
  await page.locator('[data-atlas-action="select"][data-atlas-value="1"]').focus();
  await page.keyboard.press('Space');
  await page.reload();
  assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].selected),1);
  assert.equal(await page.locator('[data-atlas-action="select"][aria-pressed="true"]').count(),1);
  await page.locator('[data-atlas-action="check"]').click();
  const xp = await page.evaluate(()=>data.xp);
  await page.reload();
  assert.equal(await page.locator('#atlas-feedback').count(),1);
  assert.equal(await page.evaluate(()=>data.xp),xp);
  assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].index),0);
  await page.clock.install();await page.clock.runFor(15000);
  assert.equal(await page.evaluate(()=>AtlasQuiz.state().runs[1].index),0,'Atlas must never auto-advance');
  await page.clock.resume();
  await page.locator('[data-atlas-action="menu"]').first().click();
  // Full round, including an incorrect answer, in each language and viewport.
  for (const width of [1440,390]) for (const lang of ['he','ru']) {
    await page.setViewportSize({width,height:width===390?844:1000});
    await page.locator(`[data-lang="${lang}"]`).click();
    await page.evaluate(()=>AtlasQuiz.reset());
    await page.evaluate(()=>AtlasQuiz.open());
    await page.locator('[data-atlas-action="start"][data-atlas-value="1"]').click();
    for (let i=0;i<8;i++) {
      const q=bank.questions[i];
      assert.equal(await page.locator('[data-atlas-action="select"]').count(),3);
      assert.equal(await page.locator('[data-atlas-action="check"]').isDisabled(),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}:${lang}:${q.id}:overflow`);
      assert.equal(await page.locator('#atlas-question').innerText(),q.prompt[lang]);
      if (q.media) {
        await page.locator('.atlas-postcard img').evaluate(img => img.decode());
        assert.ok(await page.locator('.atlas-postcard img').evaluate(img=>img.complete&&img.naturalWidth>0));
        assert.equal(await page.locator('.atlas-postcard img').getAttribute('alt'),q.alt[lang]);
      }
      if (i===0) {
        await page.locator('[data-atlas-action="hear"]').click();
        const spoken=await page.evaluate(()=>window.atlasSpoken.at(-1));
        assert.equal(spoken.lang,lang==='he'?'he-IL':'ru-RU');
        assert.ok(spoken.text.includes(q.prompt[lang])&&q.options.every(o=>spoken.text.includes(o[lang])));
        fs.mkdirSync('artifacts',{recursive:true});
        await page.screenshot({path:`artifacts/atlas-photo-${lang}-${width}.png`,fullPage:true});
      }
      if (i===3) await page.screenshot({path:`artifacts/atlas-map-${lang}-${width}.png`,fullPage:true});
      if (i===4) await page.screenshot({path:`artifacts/atlas-text-${lang}-${width}.png`,fullPage:true});
      const answer=i===2?(q.answer+1)%3:q.answer;
      await page.locator(`[data-atlas-action="select"][data-atlas-value="${answer}"]`).click();
      await page.locator('[data-atlas-action="check"]').click();
      assert.ok((await page.locator('#atlas-feedback').innerText()).includes(q.fact[lang]));
      assert.ok((await page.locator('.atlas-correct-answer').innerText()).includes(q.options[q.answer][lang]),JSON.stringify({id:q.id,lang,expected:q.options[q.answer][lang],actual:await page.locator('.atlas-correct-answer').innerText(),state:await page.evaluate(()=>AtlasQuiz.state())}));
      assert.equal(await page.locator('[data-atlas-action="select"]:disabled').count(),3);
      assert.equal(await page.locator('.atlas-option.correct').count(),1);
      const spoken=await page.evaluate(()=>window.atlasSpoken.at(-1));assert.ok(spoken.text.includes(q.fact[lang]));
      if (i===2) { assert.equal(await page.locator('.atlas-option.incorrect').count(),1); await page.screenshot({path:`artifacts/atlas-feedback-${lang}-${width}.png`,fullPage:true}); }
      await page.locator('[data-atlas-action="next"]').click();
    }
    assert.equal((await page.locator('.atlas-score').innerText()).replace(/\s/g,''),'7/8');
    assert.equal(await page.locator('.atlas-remember li').count(),2);
    assert.equal(await page.evaluate(()=>AtlasQuiz.state().progress[1].best),7);
    await page.screenshot({path:`artifacts/atlas-summary-${lang}-${width}.png`,fullPage:true});
    await page.reload();assert.equal(await page.locator('.atlas-score').count(),1);assert.equal(await page.evaluate(()=>data.sessionReports.at(-1).results.length),8);
  }
  // All 80 questions and every media asset are actually rendered, decoded and usable on a phone.
  await page.locator('[data-lang="both"]').click();
  await page.setViewportSize({width:360,height:740});
  for (let round=1;round<=10;round++) {
    await page.evaluate(()=>{AtlasQuiz.state().view='menu';render();});
    // Replays use the same fixed questions, not shuffled substitutes counted as new content.
    await page.locator(`[data-atlas-action="start"][data-atlas-value="${round}"]`).click();
    for(let i=0;i<8;i++) {
      const q=bank.questions[(round-1)*8+i];
      assert.equal(await page.evaluate(()=>AtlasQuiz.current().id),q.id);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${q.id}:bilingual-phone-overflow`);
      if(q.media) {
        await page.locator('.atlas-postcard img').evaluate(img=>img.decode());
        const box=await page.locator('.atlas-postcard img').boundingBox();assert.ok(box.width>200&&box.x>=0&&box.x+box.width<=361);
        if(q.media.startsWith('map-')){
          await page.locator('[data-lang="ru"]').click();await page.locator('.atlas-postcard img').evaluate(img=>img.decode());
          assert.ok((await page.locator('.atlas-postcard img').getAttribute('src')).endsWith('-ru.svg'));
          await page.locator('[data-lang="both"]').click();
        }
        await page.locator('[data-atlas-action="accessible"]').click();
        assert.equal(await page.locator('.atlas-postcard').count(),0);
        assert.ok((await page.locator('#atlas-question').innerText()).includes(q.accessiblePrompt.he));
        await page.locator('[data-atlas-action="accessible"]').click();
      }
      for(const b of await page.locator('[data-atlas-action="select"]').all()){ const box=await b.boundingBox();assert.ok(box.width>=44&&box.height>=44); }
      await page.locator(`[data-atlas-action="select"][data-atlas-value="${q.answer}"]`).click();
      await page.locator('[data-atlas-action="check"]').click();await page.locator('[data-atlas-action="next"]').click();
    }
    assert.equal(await page.locator('.atlas-remember li').count(),2);
  }
  assert.equal(await page.evaluate(()=>AtlasQuiz.completedCount()),10);
  // XP is not repeated by replaying a question already answered correctly.
  const decoded = await page.evaluate(async()=>Promise.all(AtlasMedia.map(m=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({id:m.id,ok:img.naturalWidth>0});img.onerror=()=>resolve({id:m.id,ok:false});img.src=m.path;}))));
  assert.equal(decoded.length,44);assert.ok(decoded.every(m=>m.ok),JSON.stringify(decoded.filter(m=>!m.ok)));
  const replayXP=await page.evaluate(()=>data.xp);
  await page.evaluate(()=>{AtlasQuiz.state().view='menu';render();});
  await page.locator('[data-atlas-action="start"][data-atlas-value="1"]').click();
  await page.locator(`[data-atlas-action="select"][data-atlas-value="${bank.questions[0].answer}"]`).click();await page.locator('[data-atlas-action="check"]').click();
  assert.equal(await page.evaluate(()=>data.xp),replayXP);
  // Return to a second game; its layout and 100-level engine are unchanged.
  await page.locator('[data-action="home"]').first().click();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('atlas-screen')),false);
  assert.deepEqual(await page.evaluate(()=>LearningUI.state().sessions.trivia),old);
  assert.deepEqual(await page.locator('[data-lg-value="matches"]').evaluate(el=>({color:getComputedStyle(el).color,border:getComputedStyle(el).borderRadius})),oldStyle);
  await page.locator('[data-lg-value="matches"]').click();await page.locator('[data-session-action="browse"]').click();assert.equal(await page.locator('[data-lg-action="stage"]').count(),100);
  await page.locator('[data-lg-action="stage"][data-lg-value="1"]').click();assert.equal(await page.locator('.lg-match-board').count(),1);
  assert.equal(await page.evaluate(()=>LearningUI.state().sessions.matches.task.game),'matches');
  assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
  console.log('Atlas: 4 complete language/viewport rounds, all 80 questions, 44 decoded local media, 10 summaries, manual advance, speech, accessible variants, refresh, separate legacy storage, replay XP and other-game regression passed.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
