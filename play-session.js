/* Saved daily and general itineraries delegate exercises to the existing game UIs. */
window.PlaySession = (() => {
  let launch=null;
  const pair=(he,ru)=>({he,ru});
  const order=['math','matches','sudoku','atlas','geometry','origami','lights','hebrew','chess','maze','sliding','logic','nonogram'];
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
  function itinerary(level=1) {const catalogue=choices();return order.map(key=>({...catalogue.find(t=>t.key===key),level}));}
  function title(target) {return target.kind==='daily'?pair('המשימה של היום','Задание дня'):target.kind==='general'?pair('המסע הכללי','Большое путешествие'):SessionReview.label(target.key);}
  function dailyItinerary(level=1,key=dayKey()) {const n=dayNumber(key),core=dailyOrder(key),learning=['matches','origami','hebrew','maze'],boards=['sudoku','lights','sliding','nonogram'],catalogue=choices(),index=((n%4)+4)%4;return [core[0],learning[index],boards[index],'atlas',core[2]].map(key=>({...catalogue.find(e=>e.key===key),level}));}
  function dailyComplete(key=dayKey()){return !!data.dailyMissions?.[key]?.completed;}
  const isMixedTarget=target=>['general','daily'].includes(target?.kind);
  function openLaunch(target) {
    pause();detach();clearTimeout(autoNextTimer);window.speechSynthesis?.cancel();
    const savedStage=data.learning?.sessions?.[target.key]?.stage;
    const suggested=target.kind==='core'?data.levels[target.key]:target.kind==='puzzle'?data.levels.logic:target.kind==='learning'&&savedStage?1+Math.floor((savedStage-1)/11):target.kind==='atlas'?AtlasQuiz.state().activeRound:null;
    launch={...target,level:Math.max(1,Math.min(10,data.gameLevels?.[target.key]||data.startDifficulty||suggested||1))};screen='launch';feedback=null;window.render();window.scrollTo(0,0);document.getElementById('launch-title')?.focus();
  }
  function startLaunch() {
    const target={...launch};if(!target)return;
    data.gameLevels||={};data.gameLevels[target.key]=target.level;
    if(isMixedTarget(target)){start(target.level,target.kind);return;}
    if(target.kind==='learning') {LearningUI.open(target.key);LearningUI.startStage(1+(target.level-1)*11);}
    else if(target.kind==='atlas'){AtlasQuiz.open();AtlasQuiz.start(target.level);}
    else {const preference=data.startDifficulty;data.startDifficulty=target.level;startRound(target.kind==='puzzle'?'puzzles':target.key,false,target.kind==='puzzle'?target.key:null);data.startDifficulty=preference;}
    saveProgress();
  }
  function renderLaunch() {
    if(!launch)return '';
    const t=title(launch),level=launch.level,isAtlas=launch.kind==='atlas',count=launch.kind==='daily'?5:13;
    const saved=isMixedTarget(launch)?state()?.status==='playing':launch.kind==='learning'?data.learning?.sessions?.[launch.key]?.status==='playing':launch.kind==='atlas'?Object.values(AtlasQuiz.state().runs).some(r=>!r.complete):session&&session.results.length<5&&session.track===(launch.kind==='puzzle'?'puzzles':launch.key)&&(launch.kind!=='puzzle'||launch.key==='mixed'||session.puzzleKind===launch.key);
    return `<section class="game-launch ${isMixedTarget(launch)?'passport-launch':''}"><div class="launch-controls"><div class="launch-art" aria-hidden="true"><span>✦</span><i>1</i><i>2</i><i>3</i></div><div class="review-kicker">${ui(isAtlas?pair('בוחרים סבב פתיחה','Выбираем начальный раунд'):pair('בוחרים את האתגר שלך','Выбираем твой уровень'))}</div><h1 id="launch-title" tabindex="-1">${ui(t)}</h1><div class="launch-intro">${ui(isMixedTarget(launch)?pair(`${count} תחנות${count===13?', אחת מכל משחק':''}. מתחילים ברמה שבחרת.`,`${count} станций${count===13?' — по одной из каждой игры':''}. Начнём с выбранного уровня.`):isAtlas?pair('באיזה סבב מתחילים הפעם?','С какого раунда начнём сегодня?'):pair('באיזו רמה מתחילים הפעם?','С какого уровня начнём сегодня?'))}</div>${isAtlas?'':`<div class="launch-presets">${[[1,'קליל','Легко'],[4,'מעניין','Интересно'],[7,'מאתגר','Сложно']].map(([n,he,ru])=>`<button data-session-action="level" data-value="${n}" class="${level===n?'selected':''}" aria-pressed="${level===n}">${ui(pair(he,ru))}</button>`).join('')}</div>`}<div class="launch-levels" role="group" aria-label="${esc(text(isAtlas?pair('סבב פתיחה','Начальный раунд'):pair('רמת פתיחה','Начальный уровень')))}">${Array.from({length:10},(_,i)=>`<button data-session-action="level" data-value="${i+1}" class="${level===i+1?'selected':''}" aria-pressed="${level===i+1}" aria-label="${esc(text(isAtlas?pair(`סבב ${i+1}`,`Раунд ${i+1}`):pair(`רמה ${i+1}`,`Уровень ${i+1}`)))}">${i+1}</button>`).join('')}</div><div class="launch-current">${ui(isAtlas?pair(`סבב ${level} מתוך 10`,`Раунд ${level} из 10`):pair(`רמה ${level} מתוך 10`,`Уровень ${level} из 10`))}</div>${launch.kind==='learning'?`<div class="launch-note">${ui(pair(`מתחילים משלב ${1+(level-1)*11} מתוך 100`, `Начнём с уровня ${1+(level-1)*11} из 100`))}</div>`:launch.kind==='atlas'?`<div class="launch-note">${ui(pair(`מתחילים מסבב ${level} באטלס`, `Начнём с раунда ${level} в атласе`))}</div>`:''}<div class="launch-actions"><button class="primary" data-session-action="begin">${ui(isAtlas?pair('מתחילים בסבב הזה','Начать этот раунд'):pair('מתחילים ברמה הזאת','Начать на этом уровне'))}</button>${saved?`<button data-session-action="resume">${ui(pair('להמשיך את המשחק השמור','Продолжить сохранённую игру'))}</button>`:''}${['learning','atlas'].includes(launch.kind)?`<button data-session-action="browse">${ui(pair('לבחירת שלב מדויק','Выбрать конкретный этап'))}</button>`:''}<button data-action="home">${ui(T.home)}</button></div></div>${isMixedTarget(launch)?JourneyPassport.render({entries:launch.kind==='daily'?dailyItinerary(level):itinerary(level),index:0,results:[],status:'preview'},{preview:true,id:'passport-launch'}):''}</section>`;
  }
  function start(level,mode='general') {
    pause();detach();
    // Interleave subjects instead of placing all board puzzles next to each other.
    const cycle=(data.expeditionCount||0);data.expeditionCount=cycle+1;
    data.expedition={version:1,id:(mode==='daily'?'daily-journey:':'journey:')+Date.now(),mode,dayKey:mode==='daily'?dayKey():null,level,status:'playing',phase:'task',index:0,results:[],cycle,previousSession:session,entries:(mode==='daily'?dailyItinerary(level):itinerary(level)).map(entry=>({...entry,run:null}))};
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
    return a?AtlasQuiz.resultSnapshot(q,a,e.run,e.level,0):null;
  }
  function next(skip=false) {
    if(!active())return;const s=state(),e=entry();let result=currentResult();
    if(!result&&!skip)return;
    if(!result){
      const q=e.kind==='atlas'?AtlasQuestions.questions.find(q=>q.id===e.questionId):e.run.task;
      if(e.kind==='atlas'){
        result=AtlasQuiz.resultSnapshot(q,{correct:false},e.run,e.level,0);
        Object.assign(result,{skipped:true,attempts:0});
      }else result=SessionReview.snapshot(q,{correct:false,skipped:true,attempts:q.attempts||0,hints:q.hint||0},e.key);
    }
    s.results.push({...result,activity:e.key,level:e.level});detach();s.index++;
    if(s.index===s.entries.length){s.status='complete';if(s.mode==='daily'){data.dailyMissions||={};data.dailyMissions[s.dayKey]={id:s.id,completed:new Date().toISOString(),results:s.results};data.dailyDates=[...new Set([...(data.dailyDates||[]),s.dayKey])].slice(-90);}else data.journeyCompleted=(data.journeyCompleted||0)+1;SessionReview.archive(s.id,title({kind:s.mode||'general'}),s.results,s.level);saveProgress();window.render();window.scrollTo(0,0);return;}
    if(s.index%4===0){s.phase='interlude';saveProgress();window.render();window.scrollTo(0,0);}else enter();
  }
  function render() {
    const s=state();if(!s)return '';
    if(s.status==='complete')return `<section class="journey-finish"><span aria-hidden="true">✦</span><h1>${ui(pair('איזה מסע עשינו!','Какое путешествие получилось!'))}</h1><div>${ui(pair(s.mode==='daily'?'השלמת את חמש התחנות של היום. הנה מה שתרגלת.':'ביקרת בכל 13 המשחקים. הנה מה שתרגלת.',s.mode==='daily'?'Ты прошёл все пять станций дня. Вот что мы потренировали.':'Ты побывал во всех 13 играх. Вот что мы потренировали.'))}</div>${JourneyPassport.render(s,{id:'passport-complete'})}${SessionReview.render(s.results,title({kind:s.mode||'general'}))}<div class="launch-actions"><button class="primary" data-session-action="new-general">${ui(pair('למסע חדש ברמה לבחירתך','Новое путешествие: выбери уровень'))}</button><button data-action="home">${ui(T.home)}</button></div></section>`;
    if(s.phase==='interlude')return `<section class="journey-interlude"><div class="interlude-island" aria-hidden="true">✦</div><div class="review-kicker">${ui(pair(`${s.index} תחנות כבר מאחוריך`, `Позади уже ${s.index} станций`))}</div><h1>${ui(pair('רגע של משחק?','Поиграем минутку?'))}</h1><div>${ui(pair('אפשר לקפוץ בין כוכבים במשך 15 שניות, או להמשיך ישר לתגלית הבאה.','Можно 15 секунд попрыгать к звёздам или сразу продолжить открытия.'))}</div><div class="launch-actions"><button class="primary" data-break-action="open">${ui(pair('קופצים לשחק','Прыгать к звёздам'))}</button><button data-session-action="continue">${ui(pair('ממשיכים במסע','Продолжить путешествие'))}</button></div>${JourneyPassport.render(s,{id:'passport-interlude'})}</section>`;
    const e=entry();return `<div class="mixed-session"><div class="journey-toolbar"><div><span class="review-kicker">${ui(title({kind:s.mode||'general'}))}</span><h1>${ui(SessionReview.label(e.key))}</h1><small>${ui(pair(`רמה ${e.level} · ${s.index+1} מתוך ${s.entries.length}`, `Уровень ${e.level} · ${s.index+1} из ${s.entries.length}`))}</small></div><button class="station-skip-icon" data-session-action="skip" aria-label="${esc(text(pair('לדלג על התחנה','Пропустить станцию')))}" title="${esc(text(pair('לדלג על התחנה','Пропустить станцию')))}"><span aria-hidden="true">↷</span><span class="sr-only">${ui(pair('לדלג על התחנה','Пропустить станцию'))}</span></button></div>${JourneyPassport.compact(s,currentResult())}${isLearning()?LearningUI.render():isAtlas()?AtlasQuiz.render():coreTaskHTML()}</div>`;
  }
  function home() {
    const s=state();if(s?.status!=='playing')return '';
    const next=s.entries[s.index];
    return `<div class="home-primary-card passport-home-card"><div class="passport-home-art" aria-hidden="true">${JourneyPassport.icon(next.key)}</div><div class="passport-home-copy"><span class="game-label">${ui(title({kind:s.mode||'general'}))}</span><h2>${ui(SessionReview.label(next.key))}</h2><p>${ui(pair(`ממשיכים מהתחנה ${s.index+1} מתוך ${s.entries.length}`,`Продолжим со станции ${s.index+1} из ${s.entries.length}`))}</p></div><button class="primary arcade-play" data-session-action="journey-resume">${ico('play')}${ui(pair('ממשיכים במסע','Продолжить путешествие'))}</button></div>`;
  }
  function handleClick(event) {
    const tab=event.target.closest('[data-home-tab]');if(tab){data.shelfTab=tab.dataset.homeTab;saveProgress();window.render();document.querySelector(`[data-home-tab="${data.shelfTab}"]`)?.focus({preventScroll:true});return true;}
    if(JourneyPassport.handleDetail(event))return true;
    const b=event.target.closest('button,[data-atlas-action]');if(!b||b.disabled)return false;
    const action=b.dataset.sessionAction;
    if(action){
      if(action==='level'){const group=b.closest('.launch-levels')?'.launch-levels':'.launch-presets';launch.level=Number(b.dataset.value);window.render();document.querySelector(`${group} [data-session-action="level"][data-value="${launch.level}"]`)?.focus({preventScroll:true});}
      else if(action==='passport')JourneyPassport.open(state(),active()?currentResult():null);
      else if(action==='begin')startLaunch();
      else if(action==='continue')enter();
      else if(action==='skip')next(true);
      else if(action==='journey-resume')resume();
      else if(action==='daily-launch')openLaunch({kind:'daily',key:'daily'});
      else if(action==='recommend')openLaunch({kind:b.dataset.kind,key:b.dataset.key});
      else if(action==='home-atlas-resume')AtlasQuiz.resume();
      else if(action==='home-learning-resume'){LearningUI.open(b.dataset.game);LearningUI.state().view='task';saveProgress();window.render();}
      else if(action==='passport-home')JourneyPassport.open(state()||{entries:itinerary(data.startDifficulty||1),index:0,results:[],status:'preview'},null,{preview:!state()});
      else if(action==='new-general')openLaunch({kind:'general',key:'general'});
      else if(action==='review-current'){const panel=document.querySelector('.session-review');if(panel){panel.querySelector('.review-exercises').open=true;panel.scrollIntoView({block:'start'});panel.querySelector('h2').focus({preventScroll:true});}}
      else if(action==='last'){pause();detach();screen='review';window.render();window.scrollTo(0,0);}
      else if(action==='browse'){if(launch.kind==='atlas'){AtlasQuiz.openMenu();}else LearningUI.open(launch.key);}
      else if(action==='resume'){
        if(isMixedTarget(launch))resume();
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
  return {active,isCore,isLearning,isAtlas,learningRun,atlasRun,atlasRound,entry,state,title,choices,itinerary,currentResult,openLaunch,renderLaunch,start,startDaily:level=>start(level,'daily'),dailyItinerary,dailyComplete,resume,render,next,detach,home,handleClick};
})();
