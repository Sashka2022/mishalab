/* A saved 13-station itinerary delegates each exercise to its existing game UI. */
window.PlaySession = (() => {
  let launch=null;
  const pair=(he,ru)=>({he,ru});
  const state=()=>data.expedition;
  const entry=()=>state()?.entries[state().index];
  const active=()=>screen==='journey'&&state()?.status==='playing'&&state().phase==='task';
  const isCore=()=>active()&&['core','puzzle'].includes(entry()?.kind);
  const isLearning=()=>active()&&entry()?.kind==='learning';
  const isAtlas=()=>active()&&entry()?.kind==='atlas';
  const learningRun=()=>entry()?.run;
  const atlasRun=()=>entry()?.run;
  const atlasRound=()=>({...AtlasQuestions.rounds[entry().level-1],questionIds:[entry().questionId]});
  function choices() {
    return [...Object.keys(domains).map(key=>({key,kind:'core'})),...PuzzleGames.kinds.map(key=>({key,kind:'puzzle'})),...Object.keys(LearningGames.catalog).filter(key=>key!=='trivia').map(key=>({key,kind:'learning'})),{key:'atlas',kind:'atlas'}];
  }
  function title(target) {return target.kind==='general'?pair('המסע הכללי','Большое путешествие'):SessionReview.label(target.key);}
  function openLaunch(target) {
    pause();detach();clearTimeout(autoNextTimer);window.speechSynthesis?.cancel();
    const savedStage=data.learning?.sessions?.[target.key]?.stage;
    const suggested=target.kind==='core'?data.levels[target.key]:target.kind==='puzzle'?data.levels.logic:target.kind==='learning'&&savedStage?1+Math.floor((savedStage-1)/11):target.kind==='atlas'?AtlasQuiz.state().activeRound:null;
    launch={...target,level:Math.max(1,Math.min(10,data.gameLevels?.[target.key]||data.startDifficulty||suggested||1))};screen='launch';feedback=null;window.render();window.scrollTo(0,0);document.getElementById('launch-title')?.focus();
  }
  function startLaunch() {
    const target={...launch};if(!target)return;
    data.gameLevels||={};data.gameLevels[target.key]=target.level;data.startDifficulty=target.level;
    if(target.kind==='general'){start(target.level);return;}
    if(target.kind==='learning') {LearningUI.open(target.key);LearningUI.startStage(1+(target.level-1)*11);}
    else if(target.kind==='atlas'){AtlasQuiz.open();AtlasQuiz.start(target.level);}
    else startRound(target.kind==='puzzle'?'puzzles':target.key,false,target.kind==='puzzle'?target.key:null);
    saveProgress();
  }
  function renderLaunch() {
    if(!launch)return '';
    const t=title(launch),level=launch.level;
    const saved=launch.kind==='general'?state()?.status==='playing':launch.kind==='learning'?data.learning?.sessions?.[launch.key]?.status==='playing':launch.kind==='atlas'?Object.values(AtlasQuiz.state().runs).some(r=>!r.complete):session&&session.results.length<5&&session.track===(launch.kind==='puzzle'?'puzzles':launch.key)&&(launch.kind!=='puzzle'||launch.key==='mixed'||session.puzzleKind===launch.key);
    return `<section class="game-launch"><div class="launch-art" aria-hidden="true"><span>✦</span><i>1</i><i>2</i><i>3</i></div><div class="review-kicker">${bi(pair('בוחרים את האתגר שלך','Выбираем твой уровень'))}</div><h1 id="launch-title" tabindex="-1">${bi(t)}</h1><div class="launch-intro">${bi(launch.kind==='general'?pair('13 תחנות, אחת מכל משחק. מתחילים ברמה שבחרת.','13 станций — по одной из каждой игры. Начнём с выбранного уровня.'):pair('באיזו רמה מתחילים הפעם?','С какого уровня начнём сегодня?'))}</div><div class="launch-presets">${[[1,'קליל','Легко'],[4,'מעניין','Интересно'],[7,'מאתגר','Сложно']].map(([n,he,ru])=>`<button data-session-action="level" data-value="${n}" class="${level===n?'selected':''}" aria-pressed="${level===n}">${bi(pair(he,ru))}</button>`).join('')}</div><div class="launch-levels" role="group" aria-label="${esc(text(pair('רמת פתיחה','Начальный уровень')))}">${Array.from({length:10},(_,i)=>`<button data-session-action="level" data-value="${i+1}" class="${level===i+1?'selected':''}" aria-pressed="${level===i+1}" aria-label="${esc(text(pair(`רמה ${i+1}`,`Уровень ${i+1}`)))}">${i+1}</button>`).join('')}</div><div class="launch-current">${bi(pair(`רמה ${level} מתוך 10`,`Уровень ${level} из 10`))}</div>${launch.kind==='learning'?`<div class="launch-note">${bi(pair(`מתחילים משלב ${1+(level-1)*11} מתוך 100`, `Начнём с уровня ${1+(level-1)*11} из 100`))}</div>`:launch.kind==='atlas'?`<div class="launch-note">${bi(pair(`מתחילים מסבב ${level} באטלס`, `Начнём с раунда ${level} в атласе`))}</div>`:''}<div class="launch-actions"><button class="primary" data-session-action="begin">${bi(pair('מתחילים ברמה הזאת','Начать на этом уровне'))}</button>${saved?`<button data-session-action="resume">${bi(pair('להמשיך את המשחק השמור','Продолжить сохранённую игру'))}</button>`:''}${['learning','atlas'].includes(launch.kind)?`<button data-session-action="browse">${bi(pair('לבחירת שלב מדויק','Выбрать конкретный этап'))}</button>`:''}<button data-action="home">${bi(T.home)}</button></div></section>`;
  }
  function start(level) {
    pause();detach();
    // Interleave subjects instead of placing all board puzzles next to each other.
    const order=['math','matches','sudoku','atlas','geometry','origami','lights','hebrew','chess','maze','sliding','logic','nonogram'];
    const catalogue=choices(),cycle=(data.expeditionCount||0);data.expeditionCount=cycle+1;
    data.expedition={version:1,id:'journey:'+Date.now(),level,status:'playing',phase:'task',index:0,results:[],cycle,previousSession:session,entries:order.map(key=>({...catalogue.find(t=>t.key===key),level,run:null}))};
    enter();
  }
  function enter() {
    const s=state(),e=entry();screen='journey';s.phase='task';feedback=null;
    if(!e.run){
      if(e.kind==='learning') {const stage=1+(e.level-1)*11,index=s.cycle%10;e.run={game:e.key,stage,index,answers:[],status:'playing',task:LearningGames.create(e.key,stage,index)};}
      else if(e.kind==='atlas'){const round=AtlasQuestions.rounds[e.level-1];e.questionId=round.questionIds[s.cycle%8];e.run={index:0,selected:null,answers:[],complete:false};}
      else {e.run={journey:true,track:e.kind==='puzzle'?'puzzles':e.key,puzzleKind:e.kind==='puzzle'?e.key:null,manualStartLevel:e.level,results:[],task:null,started:new Date().toISOString(),startLevels:{...data.levels},runTasks:0,runStartedAt:Date.now()};}
    }
    if(e.kind==='core'||e.kind==='puzzle') {
      session=e.run;
      if(!session.task){const domain=e.kind==='puzzle'?'logic':e.key;session.task=generateQuestion(domain,e.level,e.kind==='puzzle'?e.key:null);Object.assign(session.task,{attempts:0,hint:0,elapsed:0,started:Date.now(),finished:false,input:'',challengeBand:'steady'});}
      else if(!session.task.finished)session.task.started=Date.now();
      feedback=session.task.finished?(session.results[0]?.skipped?'skip':session.task.mode==='open'?'open':'success'):null;
    }
    saveProgress();window.render();window.scrollTo(0,0);
  }
  function detach(){if(session?.journey){pause();session=state()?.previousSession||null;}}
  function resume(){if(!state()||state().status!=='playing')return;if(!session?.journey)state().previousSession=session;if(state().phase==='interlude'){screen='journey';window.render();}else enter();}
  function currentResult() {
    const e=entry();
    if(e.kind==='core'||e.kind==='puzzle')return e.run.results[0];
    if(e.kind==='learning')return e.run.answers[0];
    const q=AtlasQuestions.questions.find(q=>q.id===e.questionId),a=e.run.answers[0];
    return a?SessionReview.snapshot({...q,level:e.level},{correct:a.correct,attempts:1,hints:0},q.category):null;
  }
  function next(skip=false) {
    if(!active())return;const s=state(),e=entry();let result=currentResult();
    if(!result&&!skip)return;
    if(!result){
      const q=e.kind==='atlas'?AtlasQuestions.questions.find(q=>q.id===e.questionId):e.run.task;
      result=SessionReview.snapshot(q,{correct:false,skipped:true,attempts:q.attempts||0,hints:q.hint||0},e.key);
    }
    s.results.push({...result,activity:e.key,level:e.level});detach();s.index++;
    if(s.index===s.entries.length){s.status='complete';data.journeyCompleted=(data.journeyCompleted||0)+1;SessionReview.archive(s.id,title({kind:'general'}),s.results,s.level);saveProgress();window.render();window.scrollTo(0,0);return;}
    if(s.index%4===0){s.phase='interlude';saveProgress();window.render();window.scrollTo(0,0);}else enter();
  }
  function render() {
    const s=state();if(!s)return '';
    if(s.status==='complete')return `<section class="journey-finish"><span aria-hidden="true">✦</span><h1>${bi(pair('איזה מסע עשינו!','Какое путешествие получилось!'))}</h1><div>${bi(pair('ביקרת בכל 13 המשחקים. הנה מה שתרגלת.','Ты побывал во всех 13 играх. Вот что мы потренировали.'))}</div>${SessionReview.render(s.results,title({kind:'general'}))}<div class="launch-actions"><button class="primary" data-session-action="new-general">${bi(pair('למסע חדש ברמה לבחירתך','Новое путешествие: выбери уровень'))}</button><button data-action="home">${bi(T.home)}</button></div></section>`;
    if(s.phase==='interlude')return `<section class="journey-interlude"><div class="interlude-island" aria-hidden="true">✦</div><div class="review-kicker">${bi(pair(`${s.index} תחנות כבר מאחוריך`, `Позади уже ${s.index} станций`))}</div><h1>${bi(pair('רגע של משחק?','Поиграем минутку?'))}</h1><div>${bi(pair('אפשר לקפוץ בין כוכבים במשך 15 שניות, או להמשיך ישר לתגלית הבאה.','Можно 15 секунд попрыгать к звёздам или сразу продолжить открытия.'))}</div><div class="launch-actions"><button class="primary" data-break-action="open">${bi(pair('קופצים לשחק','Прыгать к звёздам'))}</button><button data-session-action="continue">${bi(pair('ממשיכים במסע','Продолжить путешествие'))}</button></div></section>`;
    const e=entry();return `<div class="mixed-session"><div class="journey-toolbar"><div><span class="review-kicker">${bi(pair('המסע הכללי','Большое путешествие'))}</span><h1>${bi(SessionReview.label(e.key))}</h1><small>${bi(pair(`רמה ${e.level} · ${s.index+1} מתוך ${s.entries.length}`, `Уровень ${e.level} · ${s.index+1} из ${s.entries.length}`))}</small></div><button data-session-action="skip">${bi(pair('לדלג על התחנה','Пропустить станцию'))}</button></div><div class="journey-dots" aria-hidden="true">${s.entries.map((_,i)=>`<i class="${i<s.index?'done':i===s.index?'current':''}"></i>`).join('')}</div>${isLearning()?LearningUI.render():isAtlas()?AtlasQuiz.render():coreTaskHTML()}</div>`;
  }
  function home() {return state()?.status==='playing'?`<button class="journey-resume" data-session-action="journey-resume">${ico('route')}${bi(pair(`להמשיך במסע הכללי · ${state().index+1} מתוך 13`,`Продолжить путешествие · ${state().index+1} из 13`))}</button>`:'';}
  function handleClick(event) {
    const b=event.target.closest('button,[data-atlas-action]');if(!b||b.disabled)return false;
    const action=b.dataset.sessionAction;
    if(action){
      if(action==='level'){launch.level=Number(b.dataset.value);window.render();document.querySelector(`[data-session-action="level"][data-value="${launch.level}"]`)?.focus({preventScroll:true});}
      else if(action==='begin')startLaunch();
      else if(action==='continue')enter();
      else if(action==='skip')next(true);
      else if(action==='journey-resume')resume();
      else if(action==='new-general')openLaunch({kind:'general',key:'general'});
      else if(action==='review-current'){const panel=document.querySelector('.session-review');if(panel){panel.querySelector('.review-exercises').open=true;panel.scrollIntoView({block:'start'});panel.querySelector('h2').focus({preventScroll:true});}}
      else if(action==='last'){pause();detach();screen='review';window.render();window.scrollTo(0,0);}
      else if(action==='browse'){if(launch.kind==='atlas'){AtlasQuiz.openMenu();}else LearningUI.open(launch.key);}
      else if(action==='resume'){
        if(launch.kind==='general')resume();
        else if(launch.kind==='learning'){LearningUI.open(launch.key);LearningUI.state().view='task';saveProgress();window.render();}
        else if(launch.kind==='atlas')AtlasQuiz.resume();else window.resume();
      }
      return true;
    }
    // Existing stage/round selectors already let the player explicitly select an exact level.
    if(b.dataset.lgAction==='open'){openLaunch({kind:b.dataset.lgValue==='trivia'?'atlas':'learning',key:b.dataset.lgValue==='trivia'?'atlas':b.dataset.lgValue});return true;}
    if(b.dataset.track){openLaunch({kind:'core',key:b.dataset.track});return true;}
    if(b.dataset.puzzleKind){openLaunch({kind:'puzzle',key:b.dataset.puzzleKind});return true;}
    if(b.dataset.action==='daily'){openLaunch({kind:'general',key:'general'});return true;}
    if(b.dataset.action==='next-round'){openLaunch({kind:session?.track==='puzzles'?'puzzle':'core',key:session?.puzzleKind||session?.track||'math'});return true;}
    return false;
  }
  return {active,isCore,isLearning,isAtlas,learningRun,atlasRun,atlasRound,entry,state,title,choices,openLaunch,renderLaunch,start,resume,render,next,detach,home,handleClick};
})();
