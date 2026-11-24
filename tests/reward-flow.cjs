const assert=require('node:assert/strict');
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const{createStaticServer}=require('./static-server.cjs');
let browser,server;
(async()=>{
 server=createStaticServer(0);await new Promise(r=>server.once('listening',r));browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:'+server.address().port);await p.locator('[data-track="math"]').click();await p.locator('.launch-levels [data-value="1"]').click();await p.locator('[data-session-action="begin"]').click();
 const before=await p.evaluate(()=>{data.xp=111;delete data.sound;delete data.helpMode;data.contentVersion=1;localStorage.setItem(KEY,JSON.stringify(data));return {signature:session.task.signature,xp:data.xp,history:data.history.length,levels:data.levels};});
 await p.reload();assert.deepEqual(await p.evaluate(()=>({signature:data.session.task.signature,xp:data.xp,history:data.history.length,levels:data.levels})),before,'Preference migration preserves legacy active game and earned progress');
 assert.equal(await p.evaluate(()=>data.helpMode),'hebrewFirst');assert.equal(await p.evaluate(()=>data.sound),true);
 await p.locator('[data-action="resume"]').click();
 for(let i=0;i<5;i++){await p.locator('[data-action="skip"]').click();await p.locator('[data-action="next"]').click();}
 assert.equal(await p.locator('.reward-envelope').count(),1,'Even zero-correct completed sessions earn a gift');
 assert.equal(await p.evaluate(()=>Object.keys(data.rewards.envelopes).length),1);
 await p.locator('[data-reward-action="envelope"]').click();
 const gift=await p.evaluate(()=>({xp:data.xp,stickers:data.rewards.stickers,envelopes:data.rewards.envelopes}));assert.equal(gift.xp,111);assert.equal(gift.stickers.length,1);
 await p.reload();assert.deepEqual(await p.evaluate(()=>({xp:data.xp,stickers:data.rewards.stickers,envelopes:data.rewards.envelopes})),gift,'Reload preserves exactly one reward');
 await p.locator('[data-session-action="last"]').click();assert.equal(await p.locator('.reward-envelope').count(),0,'Viewing archived reports cannot generate gifts');
 assert.deepEqual(errors,[]);console.log('Live UI migration preserves v1 active game/XP; zero-score session gift and refresh/archive idempotence passed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
