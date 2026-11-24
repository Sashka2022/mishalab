/* A completed round is one gift, even after refresh, resume, or revisiting its summary. */
const assert = require('node:assert/strict');
const {chromium} = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const {createStaticServer} = require('./static-server.cjs');
(async()=>{
  const server=createStaticServer(0);await new Promise(resolve=>server.on('listening',resolve));
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    // Cross a rank threshold during this session. A poor score still earns a completion gift.
    await page.evaluate(()=>{data.xp=65;startRound('math');for(let i=0;i<5;i++){finishTask(false,true);next();}});
    const modal=page.locator('.reward-rank-celebration');await modal.waitFor();
    assert.equal(await page.locator('header').evaluate(el=>el.inert),true);assert.equal(await page.locator('.reward-envelope').evaluate(el=>el.inert),true,'Envelope behind modal is inert');
    await page.keyboard.press('Tab');assert.equal(await page.locator('[data-reward-action="dismiss-rank"]').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Escape');assert.equal(await modal.count(),0);
    assert.equal(await page.locator('header').evaluate(el=>el.inert),false);assert.equal(await page.locator('[data-reward-action="envelope"]').evaluate(el=>el===document.activeElement),true,'Focus returns to a usable summary action');
    await page.locator('[data-reward-action="envelope"]').click();
    const before=await page.evaluate(()=>({stickers:data.rewards.stickers.slice(),envelopes:Object.keys(data.rewards.envelopes),xp:data.xp,rounds:data.rounds.length}));
    assert.equal(before.stickers.length,1);assert.equal(before.envelopes.length,1);assert.equal(before.xp,65);
    await page.reload();await page.evaluate(()=>resume());
    assert.equal(await page.evaluate(()=>screen),'end','Resuming an already completed round opens its summary');
    await page.evaluate(()=>{next();render();});
    const after=await page.evaluate(()=>({stickers:data.rewards.stickers.slice(),envelopes:Object.keys(data.rewards.envelopes),xp:data.xp,rounds:data.rounds.length}));
    assert.deepEqual(after,before,'Revisiting completion must not archive or gift it twice');
    await page.locator('.reward-envelope').scrollIntoViewIfNeeded();
    await page.locator('.reward-envelope img').evaluateAll(images=>Promise.all(images.map(async image=>{image.loading='eager';await image.decode();})));
    const broken=await page.locator('.reward-envelope img').evaluateAll(images=>images.filter(image=>!image.complete||!image.naturalWidth).map(image=>image.src));
    assert.deepEqual(broken,[]);assert.deepEqual(errors,[]);
    await page.evaluate(()=>{data.xp=151;startRound('math');for(let i=0;i<5;i++){finishTask(false,true);next();}});
    assert.equal(await page.locator('.reward-rank-celebration').count(),1);
    await page.evaluate(()=>AtlasQuiz.open());
    assert.equal(await page.locator('.reward-rank-celebration').count(),0);
    assert.equal(await page.locator('header').evaluate(el=>el.inert),false,'Programmatic navigation cannot leave header inert after removing a celebration');
    console.log('Rewards UI: complete low-score round, summary-only rank modal, keyboard dismissal, envelope persistence, refresh/resume idempotence and local image loading passed.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
