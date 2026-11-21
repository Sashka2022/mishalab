const assert=require('node:assert/strict');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
let server,browser;
(async()=>{
  server=createStaticServer(8793);browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8793');
  for(const width of[360,768,1440]){
    await page.setViewportSize({width,height:width===360?740:1000});
    for(const lang of['he','ru','both']){
      await page.locator(`[data-lang="${lang}"]`).click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}:${lang}:home`);
      if(width===1440&&lang==='both')await page.locator('.learning-library').screenshot({path:'/workspace/mishalab/artifacts/learning-library.png'});
      for(const game of['matches','origami','hebrew','maze']){
        await page.locator(`[data-lg-action="open"][data-lg-value="${game}"]`).click();
        assert.equal(await page.locator('[data-lg-action="stage"]').count(),100);
        const stageBox=await page.locator('[data-lg-action="stage"]').first().boundingBox();assert.ok(stageBox.width>=44&&stageBox.height>=44);
        for(const stage of[1,100]){
          await page.locator(`[data-lg-action="stage"][data-lg-value="${stage}"]`).click();
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}:${lang}:${game}:${stage}`);
          if(game==='hebrew'&&stage===100){
            for(let i=0;i<4;i++){await page.locator('[data-lg-action="skip"]').click();await page.locator('[data-lg-action="next"]').click();}
            const tiles=await page.locator('[data-lg-action="letter"]').all();for(const tile of tiles){const b=await tile.boundingBox();assert.ok(b.width>=44&&b.height>=44);}
            assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}:${lang}:hebrew-building`);
          }
          if(game==='origami'&&stage===100){await page.locator('[data-lg-action="skip"]').click();await page.locator('[data-lg-action="next"]').click();assert.equal(await page.evaluate(()=>LearningUI.state().sessions.origami.task.variant),'holes');}
          await page.locator('[data-lg-action="hint"]').click();
          const hintCount=await page.evaluate(()=>LearningUI.state().sessions[LearningUI.state().activeGame].task.hint);assert.equal(hintCount,1);
          if(lang==='both'&&((width===1440&&stage===1)||(width===360&&stage===100)))await page.screenshot({path:`/workspace/mishalab/artifacts/learning-${game}-${width}.png`,fullPage:true});
          await page.locator('[data-lg-action="menu"]').click();
        }
        await page.locator('[data-action="home"]').first().click();
      }
    }
  }
  const preview=await browser.newPage({viewport:{width:1440,height:1000}});await preview.goto('http://127.0.0.1:8793');await preview.locator('.learning-library').screenshot({path:'/workspace/mishalab/artifacts/learning-library.png'});await preview.close();
  assert.deepEqual(errors,[]);console.log('72 game/stage/language/viewport combinations, 100-stage selectors, Hebrew letter targets and advanced origami screenshots passed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
