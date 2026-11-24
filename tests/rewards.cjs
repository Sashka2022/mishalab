/* Pure state checks: no browser, storage, clock delays or external services. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox={window:{},Date,Intl,console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../rewards.js'),'utf8'),sandbox);
const R=sandbox.window.Rewards;
const plain=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>R.migrate({xp:0,history:[],rounds:[],sessionReports:[],badges:[]});
const result=(activity='math',extra={})=>({activity,correct:true,attempts:1,hints:0,level:1,readingTracked:true,ruShown:false,...extra});
function finish(state,id,results,extra={}){return R.completeSession(state,{id,results,complete:true,level:1,at:'2026-11-23T12:00:00Z',...extra});}
for(let i=0;i<R.RANKS.length;i++){
  const threshold=R.RANKS[i];assert.equal(R.rank(threshold),i+1);
  if(i)assert.equal(R.rank(threshold-1),i);
  assert.equal(R.rankProgress(threshold),i===7?1:0);
}
assert.equal(R.rank(-1),1);assert.equal(R.rankProgress(100000),1);assert.equal(R.rank(100000),8);
assert.equal(R.rankInfo(59).remaining,1);assert.equal(R.rankInfo(1800).next,null);
assert.equal(R.dayKey('2026-11-22T23:30:00Z'),'2026-11-23','Calendar follows Israel, not UTC');
assert.equal(R.weekKey('2026-11-23'),'2026-11-22','Weeks start Sunday');
{
  const session={id:'in-progress',task:{answer:7}},legacy={version:1,contentVersion:2,xp:842,history:[{id:'old-q',domain:'math',correct:true,attempts:1,hints:0,at:'2026-11-22T10:00:00Z'}],rounds:[{score:60}],badges:['first','ten','streak','explorer','century'],session,expedition:{status:'playing',index:8},readAloud:true};
  const before=structuredClone(legacy);R.migrate(legacy);R.migrate(legacy);
  for(const key of ['xp','history','rounds','badges','session','expedition','readAloud'])assert.deepEqual(legacy[key],before[key],`Migration preserves ${key}`);
  assert.equal(legacy.rewards.lastCelebratedRank,6);assert.equal(legacy.sound,true);assert.equal(Object.keys(legacy.rewards.tasks).length,1);
  assert.equal(Object.keys(legacy.rewards.envelopes).length,0,'Migration creates no retroactive gifts');
  assert.equal(R.readingSessions(legacy),0,'Legacy absence of translation metadata proves nothing');
}
{
  const state=fresh(),task=result('math',{hints:3,attempts:3});
  const unlocked=R.recordTask(state,task,{id:'a',at:'2026-11-23T10:00:00Z'});
  assert.ok(unlocked.includes('notGiveUp'));assert.ok(unlocked.includes('thirdTry'));assert.equal(task.rewardTaskId,'a');
  R.recordTask(state,task,{id:'a',at:'2026-11-23T10:00:00Z'});
  assert.equal(Object.keys(state.rewards.tasks).length,1,'Repeat calls do not duplicate a solved question');
  finish(state,'math-session',[task]);assert.equal(Object.keys(state.rewards.tasks).length,1,'Archiving the same result does not duplicate task');
  assert.equal(state.badges.includes('streak'),false,'Hint-assisted success is not independent success');
  const p=R.badgeDefs.sudoku10.progress(state);assert.deepEqual(plain(p),{have:0,need:10});
  assert.ok(R.renderBadges(state).includes('0/10'));assert.ok(R.renderBadges(state).includes('???'));
}
{
  const state=fresh();state.xp=61;
  const report=[result('math',{correct:false,skipped:true})];
  const envelope=finish(state,'failed-but-complete',report);
  assert.ok(envelope,'Completed sessions get a gift regardless of score');assert.equal(envelope.rankUp.number,2);
  assert.equal(Object.keys(state.rewards.days).length,0,'Skipping every station does not claim a completed activity day');
  R.recordTask(state,result('atlas',{correct:false}),{id:'answered-wrong',at:'2026-11-23T12:00:00Z'});
  assert.equal(state.rewards.days['2026-11-23'],true,'An answered station counts even with an incorrect answer');
  assert.equal(finish(state,'failed-but-complete',report),envelope,'Duplicate report reuses envelope');
  assert.equal(R.completeSession(state,{id:'unfinished',complete:false,results:report}),null);
  assert.equal(R.openEnvelope(state,'unfinished'),null);
  const sticker=R.openEnvelope(state,envelope.sessionId);assert.ok(sticker);assert.equal(R.openEnvelope(state,envelope.sessionId).id,sticker.id);
  assert.equal(state.rewards.stickers.length,1);assert.equal(state.xp,61,'Gifts never spend XP');
  assert.ok(R.renderEnvelope(state,envelope.sessionId).includes(sticker.asset||'reward-sticker'));
  assert.ok(R.renderCelebration(state,envelope.sessionId).includes('role="dialog"'));
  assert.ok(R.renderAlbum(state).includes('1/24'));
}
{
  const state=fresh();
  for(let i=0;i<24;i++){finish(state,'collect:'+i,[result()]);R.openEnvelope(state,'collect:'+i);}
  assert.equal(new Set(state.rewards.stickers).size,24,'An unopened new sticker is always chosen before a duplicate');
  finish(state,'collect:extra',[result()]);R.openEnvelope(state,'collect:extra');assert.equal(state.rewards.stickers.length,24);
  assert.equal(R.STICKERS.filter(s=>s.asset).length,24,'All approved illustrations are connected to the collection');
  for(const sticker of R.STICKERS)assert.ok(fs.existsSync(require('node:path').join(__dirname,'..',sticker.asset)),`Local illustration exists: ${sticker.id}`);
  assert.equal(R.STICKERS.filter(s=>s.rare).length,4);
  let rare=0;for(let i=0;i<1000;i++){const s=fresh();finish(s,'distribution:'+i,[result()]);if(R.openEnvelope(s,'distribution:'+i).rare)rare++;}
  assert.ok(rare>100&&rare<200,`Rare sticker rate near 15% (${rare}/1000)`);
}
{
  const state=fresh();
  const setDays=keys=>{state.rewards.days=Object.fromEntries(keys.map(k=>[k,true]));};
  setDays(['2026-11-22','2026-11-23','2026-11-25']);
  assert.equal(R.streak(state,'2026-11-25').current,3,'One rest day protects active days without adding a fake played day');
  assert.equal(R.streak(state,'2026-11-26').current,3,'Today remains available');
  assert.equal(R.streak(state,'2026-11-27').current,0,'Two missed whole days in a week break current streak');
  assert.equal(R.streak(state,'2026-11-27').best,3,'A break retains personal best');
  setDays(['2026-11-20','2026-11-23']);
  assert.equal(R.streak(state,'2026-11-23').current,2,'Saturday and Sunday may each use their own calendar week rest');
  setDays(['2026-11-22','2026-11-24','2026-11-26']);
  assert.equal(R.streak(state,'2026-11-26').current,1,'A second rest in the same week starts a new sequence');
}
{
  const state=fresh();let goal=R.weeklyGoal(state,'2026-11-23T12:00:00Z');const kind=goal.kind;
  for(let i=0;i<7;i++)R.recordTask(state,result('sudoku'),{id:'week-sudoku:'+i,at:'2026-11-23T12:00:00Z'});
  finish(state,'week-atlas',Array.from({length:8},()=>result('atlas')));
  const after=R.weeklyGoal(state,'2026-11-26T12:00:00Z');
  assert.equal(after.kind,kind,'Current week selection stays stable as practice changes');assert.equal(after.completed,true);
  R.unlockBadges(state);assert.ok(state.badges.includes('weekly'));
  assert.notEqual(R.weeklyGoal(state,'2026-11-29T12:00:00Z').id,after.id,'Sunday begins a new weekly goal');
}
{
  const state=fresh();finish(state,'reader-legacy',[result('hebrew',{readingTracked:false})]);assert.equal(R.readingSessions(state),0);
  finish(state,'reader-russian',[result('hebrew',{ruShown:true})]);assert.equal(R.readingSessions(state),0);
  finish(state,'reader-assisted',[result('hebrew',{hints:1})]);assert.equal(R.readingSessions(state),1,'Reading support metric records translation visibility, not hint use or reading proof');
  assert.ok(state.badges.includes('reader1'));
  const mixed=R.GAMES.map(k=>result(k));finish(state,'general13',mixed);
  assert.ok(state.badges.includes('journey13'));assert.ok(state.badges.includes('allGames'));
  finish(state,'category-atlas',Array.from({length:8},(_,i)=>result('landmarks',{id:'atlas-'+String(i+1).padStart(2,'0')})));
  assert.ok(state.badges.includes('atlasRound'),'Atlas review categories still belong to the Atlas game');
  finish(state,'origami-level10',Array.from({length:10},()=>result('origami')),{level:10});
  assert.ok(state.badges.includes('origami10'));assert.ok(state.badges.includes('secret10'));
  const rankHTML=R.renderRank(state);assert.ok(rankHTML.includes('role="progressbar"'));
  const weeklyHTML=R.renderWeekly(state,'2026-11-23');assert.equal((weeklyHTML.match(/class="reward-day /g)||[]).length,7);
}
console.log('Rewards: rank boundaries, lossless migration, task/session idempotence, truthful badges, Israel week/rest days, stable goals, all 24 gifts and reading metadata passed.');
