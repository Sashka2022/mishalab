/* Translation assistance preserves honest reading metadata and never changes scores. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const listeners = {};
const context = {
  console, setTimeout, clearTimeout,
  data: {lang:'both',helpMode:'hebrewFirst',xp:42,sessionReports:[]},
  session: {task:{id:'first',attempts:0}},screen:'task',
  saveProgress(){context.saved=JSON.parse(JSON.stringify(context.session.task));},
  document:{addEventListener(name,fn){listeners[name]=fn;},querySelector(){return null;},querySelectorAll(){return []; }},
  esc:value=>String(value),text:p=>p.he,ui:p=>p.he,uiLang:()=> 'he'
};
context.window=context;context.render=()=>{};
vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../reading-support.js'),'utf8'),context);
const api=context.ReadingSupport;
assert.equal(api.visible(),false,'new bilingual task starts in Hebrew');
assert.equal(context.session.task.readingTracked,true);
api.attempt(true);assert.equal(api.visible(),false,'correct first answer must not open Russian');
api.attempt(false);assert.equal(api.visible(),true,'wrong answer reveals Russian in Hebrew-first mode');
assert.equal(context.data.xp,42,'translation never changes XP');
api.afterRender();assert.equal(context.saved.ruShown,true,'opened translation is included in persisted task');
context.session.task=JSON.parse(JSON.stringify(context.saved));assert.equal(api.visible(),true,'refresh keeps opened translation');
context.session.task={id:'tap'};context.data.helpMode='tap';api.attempt(false);assert.equal(api.visible(),false,'tap mode does not auto reveal');
api.reveal();assert.equal(api.visible(),true,'manual reveal works independently of answer');
context.session.task={id:'miss'};context.data.helpMode='afterMiss';assert.equal(api.visible(),false);api.attempt(false);assert.equal(api.visible(),true);
context.session.task={id:'always'};context.data.helpMode='always';assert.equal(api.visible(),true);assert.equal(context.session.task.ruShown,true);
context.data.lang='he';assert.equal(api.visible(),false);assert.deepEqual(Array.from(api.speechLanguages()),['he']);
context.data.lang='ru';assert.equal(api.visible(),true);assert.equal(context.session.task.ruShown,true,'switching to Russian records that Russian was displayed');assert.deepEqual(Array.from(api.speechLanguages()),['ru']);
context.data.lang='both';context.data.helpMode='hebrewFirst';context.session.task={id:'speech'};
assert.deepEqual(Array.from(api.speechLanguages()),['he']);api.reveal();assert.deepEqual(Array.from(api.speechLanguages()),['he','ru']);
const summary=api.stats([{ruShown:false},{readingTracked:true,ruShown:false},{readingTracked:true,ruShown:true}]);
assert.equal(summary.total,2,'old records without tracked metadata are not counted as independent reading');assert.equal(summary.withoutTranslation,1);
context.screen='home';assert.equal(api.current(),null);assert.equal(api.visible(),true,'home copy is bilingual content without question gating');
console.log('Reading support: four modes, first-correct/first-wrong, persistence, speech languages, honest legacy metrics passed.');
