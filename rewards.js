/* MishaLab rewards: local progress only. XP is never spent, removed or tied to speed. */
window.Rewards = (() => {
  'use strict';
  const P = (he, ru) => ({he, ru});
  const RANKS = [0,60,150,300,500,800,1200,1800];
  const ranks = [
    ['חוקר מתחיל','Новичок','מעבדה','Лаборатория','flask'],
    ['עוזר מעבדה','Лаборант','זכוכית מגדלת','Лупа','search'],
    ['גלאי','Искатель','מצפן','Компас','compass'],
    ['מגלה','Первооткрыватель','מיקרוסקופ','Микроскоп','flask'],
    ['ממציא','Изобретатель','טלסקופ','Телескоп','telescope'],
    ['מדען','Учёный','כדור הארץ','Глобус','compass'],
    ['פרופסור','Профессор','רקטה','Ракета','rocket'],
    ['ראש המעבדה','Глава лаборатории','מעבדה מוארת','Освещённая лаборатория','sparkles']
  ].map((r,i)=>({number:i+1,threshold:RANKS[i],name:P(r[0],r[1]),unlock:P(r[2],r[3]),icon:r[4]}));
  const stickerNames = [
    ['microscope','מיקרוסקופ','Микроскоп','flask'],['test-tube','מבחנה','Пробирка','flask'],
    ['magnet','מגנט','Магнит','gear'],['telescope','טלסקופ','Телескоп','telescope'],
    ['abacus','חשבונייה','Счёты','calculator'],['ruler-compass','סרגל ומחוגה','Линейка и циркуль','shapes'],
    ['cubes','קוביות','Кубики','shapes'],['balance','מאזניים','Весы','shapes'],
    ['puzzle-piece','חלק פאזל','Деталь пазла','puzzle'],['light-bulb','נורה','Лампочка','sparkles'],
    ['matches','גפרורים','Спички','puzzle'],['tiles','אריחים','Плитки','shapes'],
    ['knight','פרש','Конь','crown'],['rook','צריח','Ладья','castle'],['crown','כתר','Корона','crown'],
    ['chess-board','לוח שחמט','Шахматная доска','shapes'],['globe','כדור הארץ','Глобус','compass'],
    ['compass','מצפן','Компас','compass'],['balloon','כדור פורח','Воздушный шар','rocket'],
    ['treasure-map','מפת אוצר','Карта сокровищ','route'],['crane','עגור מנייר','Бумажный журавлик','shapes'],
    ['paper-boat','סירת נייר','Бумажная лодка','waves'],['maze','מבוך','Лабиринт','route'],
    ['book','ספר','Книга','school']
  ];
  // Series A was reviewed and explicitly approved by the owner before the remaining illustrations.
  // All twenty-four local SVGs follow the approved style; see design/art-review.html.
  const STICKERS = stickerNames.map((r,i)=>({id:`sticker-${String(i+1).padStart(2,'0')}`,number:i+1,slug:r[0],name:P(r[1],r[2]),icon:r[3],rare:[4,12,20,24].includes(i+1),asset:`assets/stickers/sticker-${String(i+1).padStart(2,'0')}-${r[0]}.svg`}));
  const GAMES = ['math','logic','geometry','chess','matches','origami','atlas','hebrew','maze','sudoku','lights','sliding','nonogram'];
  const finite = n => Math.max(0,Number(n)||0);
  const xpOf = state => typeof state==='number'?finite(state):finite(state?.xp);
  function rank(state) { const xp=xpOf(state);let n=0;while(n+1<RANKS.length&&xp>=RANKS[n+1])n++;return n+1; }
  function rankProgress(state) {const n=rank(state)-1;return n===7?1:(xpOf(state)-RANKS[n])/(RANKS[n+1]-RANKS[n]);}
  function rankInfo(state) {const number=rank(state);return {...ranks[number-1],progress:rankProgress(state),xp:xpOf(state),next:ranks[number]||null,remaining:number===8?0:RANKS[number]-xpOf(state)};}
  const dayFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'});
  function dayKey(value=new Date()) {
    const date=value instanceof Date?value:new Date(value);
    if(Number.isNaN(date.getTime()))return null;
    const parts=dayFormatter.formatToParts(date);
    const part=type=>parts.find(p=>p.type===type).value;return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function validDay(key) {return /^\d{4}-\d{2}-\d{2}$/.test(key||'')&&!Number.isNaN(Date.parse(key+'T12:00:00Z'));}
  function shiftDay(key,days) {return new Date(Date.parse(key+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);}
  function weekKey(value=new Date()) {const key=validDay(value)?value:dayKey(value);return shiftDay(key,-new Date(key+'T12:00:00Z').getUTCDay());}
  const hash = text => {let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const activity = r => /^atlas-/.test(r.id||'')||r.activity==='trivia'?'atlas':r.activity||r.game||(GAMES.includes(r.type)?r.type:r.domain)||'logic';
  const when = (r,fallback) => validDay(r.at)?r.at:dayKey(r.at||fallback||new Date());
  function book(state) {
    if(!state.rewards||typeof state.rewards!=='object')state.rewards={};
    const r=state.rewards;r.version=1;r.tasks||={};r.sessions||={};r.days||={};r.weeks||={};r.stickers||=[];r.envelopes||={};r.pendingBadges||=[];
    return r;
  }
  function normalized(result, at) {return {activity:activity(result),skill:result.skill||result.type,level:finite(result.level),correct:!!result.correct,skipped:!!result.skipped,hints:finite(result.hints),attempts:finite(result.attempts),ruShown:result.ruShown===true,readingTracked:result.readingTracked===true&&typeof result.ruShown==='boolean',at:when(result,at)};}
  function taskKey(result,fallback) {return result.rewardTaskId || (result.at?`${result.id||result.activity||result.domain||'task'}:${result.at}`:fallback);}
  function migrate(state) {
    const existed=!!state.rewards?.migrated,r=book(state);state.badges=Array.isArray(state.badges)?state.badges:[];
    if(state.sound===undefined)state.sound=true;
    if(!existed){
      (state.history||[]).forEach((task,i)=>{const id=taskKey(task,`legacy-history:${i}`);r.tasks[id]=normalized(task);if(task.at&&r.tasks[id].at&&!r.tasks[id].skipped)r.days[r.tasks[id].at]=true;});
      (state.sessionReports||[]).forEach((report,ri)=>{
        (report.results||[]).forEach((task,ti)=>{const id=taskKey(task,`legacy-report:${report.id||ri}:${ti}`);r.tasks[id]||=normalized(task,report.at);if(report.at&&r.tasks[id].at&&!r.tasks[id].skipped)r.days[r.tasks[id].at]=true;});
        // Reports prove a past session, but importing one must not manufacture a new envelope.
        r.sessions[report.id||`legacy:${ri}`]={at:dayKey(report.at),level:report.level,results:(report.results||[]).map(t=>normalized(t,report.at)),legacy:true};
      });
      r.lastCelebratedRank=rank(state);r.migrated=true;
    }
    const s=streak(state);state.dayStreak=s.current;state.bestDayStreak=Math.max(finite(state.bestDayStreak),s.best);
    return state;
  }
  function recordTask(state,result,options={}) {
    const r=book(state),id=taskKey(result,options.id||`task:${Date.now()}:${Object.keys(r.tasks).length}`);
    result.rewardTaskId=id;
    if(!r.tasks[id])r.tasks[id]=normalized(result,options.at);
    const task=r.tasks[id];if(task.at&&!task.skipped)r.days[task.at]=true;
    const s=streak(state,options.at);state.dayStreak=s.current;state.bestDayStreak=Math.max(finite(state.bestDayStreak),s.best);
    weeklyGoal(state,options.at||result.at||new Date());
    return unlockBadges(state);
  }
  function canBridge(from,to,rest) {
    const next={...rest};let days=0;
    for(let day=shiftDay(from,1);day<to;day=shiftDay(day,1)){
      if(++days>14)return null;
      const week=weekKey(day);next[week]=(next[week]||0)+1;if(next[week]>1)return null;
    }
    return next;
  }
  function streak(state,now=new Date()) {
    const today=validDay(now)?now:dayKey(now),r=book(state),days=Object.keys(r.days).filter(d=>r.days[d]&&validDay(d)&&d<=today).sort();
    if(!days.length)return {current:0,best:finite(state.bestDayStreak),days:[],restDays:[]};
    let count=0,best=0,last=null,rest={},restDays=[];
    for(const day of days){
      const bridge=last?canBridge(last,day,rest):{};
      if(!bridge){count=0;rest={};restDays=[];}else{rest=bridge;if(last)for(let d=shiftDay(last,1);d<day;d=shiftDay(d,1))restDays.push(d);}
      count++;best=Math.max(best,count);last=day;
    }
    // Today remains available for play. Only whole missed days before today need rest protection.
    const stillCurrent=last===today||canBridge(last,today,rest)!==null;
    return {current:stillCurrent?count:0,best:Math.max(best,finite(state.bestDayStreak)),days,restDays:stillCurrent?restDays:[]};
  }
  function allTasks(state){return Object.values(book(state).tasks);}
  function allSessions(state){return Object.values(book(state).sessions);}
  function count(state,predicate){return allTasks(state).filter(predicate).length;}
  function readingSessions(state){return allSessions(state).filter(s=>s.results.length>0&&s.results.every(t=>t.readingTracked&&!t.ruShown)).length;}
  const badgeDefs = {
    first:{icon:'rocket',name:P('יציאה למסע','Начало путешествия'),need:1,have:s=>allTasks(s).length},
    ten:{icon:'telescope',name:P('עשר תגליות','Десять открытий'),need:10,have:s=>allTasks(s).length},
    streak:{icon:'flame',name:P('חמש נכונות ברצף','Пять верных подряд'),need:5,have:s=>finite(s.bestStreak)},
    explorer:{icon:'compass',name:P('חוקר ארבעה עולמות','Исследователь четырёх миров'),need:4,have:s=>new Set(allTasks(s).map(t=>t.activity).filter(k=>['math','logic','geometry','chess'].includes(k))).size},
    century:{icon:'trophy',name:P('100 נקודות חקר','100 очков исследования'),need:100,have:s=>xpOf(s)},
    notGiveUp:{icon:'sparkles',name:P('לא מוותר','Не сдаюсь'),need:1,have:s=>count(s,t=>t.correct&&t.hints>=3)},
    thirdTry:{icon:'route',name:P('מצאתי דרך','Нашёл способ'),need:1,have:s=>count(s,t=>t.correct&&t.attempts>=3)},
    journey13:{icon:'route',name:P('כל המסע','Всё путешествие'),need:1,have:s=>allSessions(s).filter(r=>r.results.length===13&&new Set(r.results.map(t=>t.activity)).size===13).length},
    sudoku10:{icon:'puzzle',name:P('עשר חידות סודוקו','Десять судоку'),need:10,have:s=>count(s,t=>t.activity==='sudoku'&&t.correct)},
    mate5:{icon:'crown',name:P('חמש פעמים מט','Пять матов'),need:5,have:s=>count(s,t=>t.activity==='chess'&&t.skill==='mate'&&t.correct)},
    atlasRound:{icon:'compass',name:P('עמוד באטלס','Страница атласа'),need:1,have:s=>allSessions(s).filter(r=>r.results.length===8&&r.results.every(t=>t.activity==='atlas')).length},
    origami10:{icon:'shapes',name:P('מקפל ומגלה','Складываю и открываю'),need:10,have:s=>Math.max(0,...allSessions(s).filter(r=>r.results.length===10&&r.results.every(t=>t.activity==='origami')).map(r=>finite(r.level)))},
    allGames:{icon:'medal',name:P('כל 13 המשחקים','Все 13 игр'),need:13,have:s=>new Set(allTasks(s).map(t=>t.activity).filter(k=>GAMES.includes(k))).size},
    threeWorlds:{icon:'compass',name:P('יום של גיוון','День разных открытий'),need:3,have:s=>Math.max(0,...Object.keys(book(s).days).map(d=>new Set(allTasks(s).filter(t=>t.at===d).map(t=>t.activity)).size))},
    days3:{icon:'flame',name:P('שלושה ימי גילוי','Три дня открытий'),need:3,have:s=>Math.max(finite(s.bestDayStreak),streak(s).best)},
    days7:{icon:'flame',name:P('שבעה ימי גילוי','Семь дней открытий'),need:7,have:s=>Math.max(finite(s.bestDayStreak),streak(s).best)},
    days30:{icon:'flame',name:P('שלושים ימי גילוי','Тридцать дней открытий'),need:30,have:s=>Math.max(finite(s.bestDayStreak),streak(s).best)},
    fiveWeek:{icon:'star',name:P('חמישה ימים בשבוע','Пять дней за неделю'),need:5,have:s=>{const w={};for(const d of Object.keys(book(s).days))if(book(s).days[d])w[weekKey(d)]=(w[weekKey(d)]||0)+1;return Math.max(0,...Object.values(w));}},
    secret10:{icon:'sparkles',name:P('מגלה הסוד','Тайное открытие'),secret:true,need:1,have:s=>allSessions(s).filter(r=>r.level>=10&&r.results.length&&r.results.every(t=>t.correct&&!t.skipped&&t.attempts===1)).length},
    reader1:{icon:'school',name:P('עברית תחילה','Сначала на иврите'),need:1,have:readingSessions},
    reader5:{icon:'school',name:P('חמש פעמים בעברית','Пять занятий на иврите'),need:5,have:readingSessions},
    reader20:{icon:'school',name:P('עשרים פעמים בעברית','Двадцать занятий на иврите'),need:20,have:readingSessions},
    weekly:{icon:'star',name:P('תגלית השבוע','Открытие недели'),need:1,have:s=>Object.values(book(s).weeks).filter(w=>w.completed).length}
  };
  Object.values(badgeDefs).forEach(def=>{def.progress=state=>({have:Math.min(def.need,def.have(state)),need:def.need});});
  function unlockBadges(state){const r=book(state),newIds=[];state.badges||=[];for(const [id,b] of Object.entries(badgeDefs)){if(!state.badges.includes(id)&&b.have(state)>=b.need){state.badges.push(id);newIds.push(id);if(!r.pendingBadges.includes(id))r.pendingBadges.push(id);}}return newIds;}
  function weeklyGoal(state,now=new Date()) {
    const r=book(state),week=weekKey(now),end=shiftDay(week,7);
    if(!r.weeks[week]){
      const previous=allTasks(state).filter(t=>t.at&&t.at<week),sessions=allSessions(state).filter(s=>s.at&&s.at<week);
      const candidates=[{kind:'sudoku',weight:previous.filter(t=>t.activity==='sudoku').length/3},{kind:'atlas',weight:sessions.filter(s=>s.results.length===8&&s.results.every(t=>t.activity==='atlas')).length},{kind:'withoutHint',weight:previous.filter(t=>t.correct&&!t.hints).length/5}];
      const least=Math.min(...candidates.map(c=>c.weight)),choices=candidates.filter(c=>c.weight===least);r.weeks[week]={kind:choices[hash(week)%choices.length].kind,completed:false};
    }
    const saved=r.weeks[week],tasks=allTasks(state).filter(t=>t.at>=week&&t.at<end);
    const spec={sudoku:{label:P('פתור 3 חידות סודוקו','Реши 3 судоку'),need:3,have:tasks.filter(t=>t.activity==='sudoku'&&t.correct).length},atlas:{label:P('סיים סבב אטלס','Заверши раунд атласа'),need:1,have:allSessions(state).filter(s=>s.at>=week&&s.at<end&&s.results.length===8&&s.results.every(t=>t.activity==='atlas')).length},withoutHint:{label:P('פתור 5 תרגילים בלי רמז','Реши 5 заданий без подсказки'),need:5,have:tasks.filter(t=>t.correct&&!t.hints).length}}[saved.kind];
    if(spec.have>=spec.need)saved.completed=true;
    return {id:week+':'+saved.kind,kind:saved.kind,week,...spec,have:Math.min(spec.have,spec.need),completed:saved.completed};
  }
  function completeSession(state,report){
    if(!report?.id||report.complete!==true||!Array.isArray(report.results)||!report.results.length)return null;
    const r=book(state);if(r.sessions[report.id])return r.envelopes[report.id]||null;
    const at=report.at||new Date().toISOString();
    report.results.forEach((t,i)=>recordTask(state,t,{id:`${report.id}:task:${i}`,at}));
    r.sessions[report.id]={at:dayKey(at),level:report.level||1,results:report.results.map(t=>normalized(t,at))};
    const newRank=rank(state),rankUp=newRank>finite(r.lastCelebratedRank||newRank)?rankInfo(state):null;
    r.lastCelebratedRank=Math.max(newRank,finite(r.lastCelebratedRank));
    const envelope={sessionId:report.id,opened:false,stickerId:null,at,rankUp};r.envelopes[report.id]=envelope;
    weeklyGoal(state,at);unlockBadges(state);return envelope;
  }
  function openEnvelope(state,id){
    const r=book(state),envelope=r.envelopes[id];if(!envelope)return null;
    if(envelope.stickerId)return STICKERS.find(s=>s.id===envelope.stickerId);
    const owned=new Set(r.stickers),fresh=STICKERS.filter(s=>!owned.has(s.id)),pool=fresh.length?fresh:STICKERS;
    const rare=pool.filter(s=>s.rare),normal=pool.filter(s=>!s.rare),chooseRare=(hash(id+':rarity')%100)<15;
    const available=chooseRare&&rare.length?rare:normal.length?normal:rare;
    const sticker=available[hash(id+':pick')%available.length];envelope.opened=true;envelope.stickerId=sticker.id;
    if(!owned.has(sticker.id))r.stickers.push(sticker.id);return sticker;
  }
  function consumeBadgeToast(state){return book(state).pendingBadges.shift()||null;}
  function localUI(p){return typeof ui==='function'?ui(p):escapeHTML(p.he);}
  function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function localText(p){return typeof text==='function'?text(p):p.he;}
  function icon(name){return typeof ico==='function'?ico(name):`<span aria-hidden="true">✦</span>`;}
  function stickerHTML(sticker,owned=true){return `<span class="reward-sticker ${owned?'is-owned':'is-locked'} ${sticker.rare?'is-rare':''}">${sticker.asset&&owned?`<img src="${sticker.asset}" alt="${escapeHTML(localText(sticker.name))}" width="96" height="96" loading="lazy">`:icon(sticker.icon)}</span>`;}
  function renderRank(state){const r=rankInfo(state),tip=r.next?P(`עוד ${r.remaining} XP: ${r.next.unlock.he}`,`Ещё ${r.remaining} XP: ${r.next.unlock.ru}`):P('כל כלי המעבדה פתוחים','Все инструменты открыты');return `<div class="reward-rank" title="${escapeHTML(localText(tip))}">${icon(r.icon)}<span><b>${localUI(r.name)}</b><span class="reward-rank-meter" role="progressbar" aria-label="${escapeHTML(localText(P('התקדמות בדרגה','Прогресс ранга')))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(r.progress*100)}"><i style="width:${r.progress*100}%"></i></span></span><strong class="reward-xp" data-reward-xp="${r.xp}">${r.xp} XP</strong></div>`;}
  function renderBadges(state,limit=Object.keys(badgeDefs).length){return `<div class="reward-badges">${Object.entries(badgeDefs).slice(0,limit).map(([id,b])=>{const owned=state.badges?.includes(id),p=b.progress(state),name=b.secret&&!owned?P('???','???'):b.name;return `<article class="reward-badge ${owned?'is-owned':'is-locked'}" title="${escapeHTML(localText(name))}"><span aria-hidden="true">${icon(b.icon)}</span><b>${localUI(name)}</b><span>${owned?'✓':`${p.have}/${p.need}`}</span>${!owned&&!b.secret?`<progress value="${p.have}" max="${p.need}" aria-label="${escapeHTML(localText(name))}"></progress>`:''}</article>`;}).join('')}</div>`;}
  function renderWeekly(state,now=new Date()){const r=book(state),today=validDay(now)?now:dayKey(now),week=weekKey(today),labels=[P('א׳','Вс'),P('ב׳','Пн'),P('ג׳','Вт'),P('ד׳','Ср'),P('ה׳','Чт'),P('ו׳','Пт'),P('ש׳','Сб')],s=streak(state,today),goal=weeklyGoal(state,now);return `<section class="reward-week"><div class="reward-week-days" aria-label="${escapeHTML(localText(P('ימי גילוי השבוע','Дни открытий на этой неделе')))}">${labels.map((p,i)=>{const day=shiftDay(week,i);return `<span class="reward-day ${r.days[day]?'is-played':''} ${day===today?'is-today':''}" ${day===today?'aria-current="date"':''} title="${day}"><span>${localUI(p)}</span><b aria-label="${escapeHTML(localText(r.days[day]?P('תחנה הושלמה','Станция завершена'):P('יום פנוי','Свободный день')))}">${r.days[day]?'✓':'○'}</b></span>`;}).join('')}</div><div>${localUI(s.current?P(`${s.current} ימי גילוי ברצף`,`${s.current} дней открытий подряд`):P(`שיא אישי: ${s.best} ימים`,`Личный рекорд: ${s.best} дней`))}</div><div class="reward-weekly-goal"><b>${localUI(P('תגלית השבוע','Открытие недели'))}</b> ${localUI(goal.label)} <span>${goal.completed?'✓':`${goal.have}/${goal.need}`}</span></div></section>`;}
  function renderAlbum(state){const owned=new Set(book(state).stickers);return `<details class="reward-album"><summary>${localUI(P(`אוסף המדבקות שלי · ${owned.size}/24`,`Моя коллекция наклеек · ${owned.size}/24`))}</summary><div class="reward-sticker-grid">${STICKERS.map(s=>`<figure>${stickerHTML(s,owned.has(s.id))}<figcaption>${localUI(s.name)}${s.rare?` <span title="${escapeHTML(localText(P('מדבקה מיוחדת','Особая наклейка')))}">✧</span>`:''}</figcaption></figure>`).join('')}</div></details>`;}
  function renderEnvelope(state,id){const envelope=book(state).envelopes[id];if(!envelope)return '';const sticker=STICKERS.find(s=>s.id===envelope.stickerId);return `<section class="reward-envelope ${sticker?'is-open':''}" data-envelope-id="${escapeHTML(id)}"><h3>${localUI(P('מעטפה ממישה','Конверт от Миши'))}</h3>${sticker?`${stickerHTML(sticker)}<b>${localUI(sticker.name)}</b>`:`<button data-reward-action="envelope" data-reward-id="${escapeHTML(id)}">${icon('sparkles')}${localUI(P('לפתוח את ההפתעה','Открыть сюрприз'))}</button>`}<small>${localUI(P('מתנה על השלמת הסשן, בכל תוצאה','Подарок за завершённое занятие при любом результате'))}</small></section>`;}
  function renderCelebration(state,id){const envelope=book(state).envelopes[id];if(!envelope?.rankUp||envelope.rankDismissed)return '';const r=envelope.rankUp;return `<section class="reward-rank-celebration" role="dialog" aria-modal="true" aria-labelledby="reward-rank-title"><img src="assets/characters/mishi-success.svg" width="96" height="112" alt=""><h2 id="reward-rank-title">${localUI(P('דרגה חדשה במעבדה!','Новый ранг в лаборатории!'))}</h2><b>${localUI(r.name)}</b><p>${localUI(r.unlock)}</p><div class="reward-confetti" aria-hidden="true">${Array.from({length:36},(_,i)=>`<i style="--confetti-index:${i}"></i>`).join('')}</div><button data-reward-action="dismiss-rank" data-reward-id="${escapeHTML(id)}">${localUI(P('יש!','Ура!'))}</button></section>`;}
  function handleClick(event,state){const button=event.target.closest('[data-reward-action]');if(!button)return false;const id=button.dataset.rewardId;if(button.dataset.rewardAction==='envelope')openEnvelope(state,id);else if(button.dataset.rewardAction==='dismiss-rank'&&book(state).envelopes[id])book(state).envelopes[id].rankDismissed=true;else return false;return true;}
  return {RANKS,ranks,STICKERS,GAMES,badgeDefs,rank,rankProgress,rankInfo,dayKey,weekKey,migrate,recordTask,streak,weeklyGoal,completeSession,openEnvelope,unlockBadges,consumeBadgeToast,readingSessions,renderRank,renderBadges,renderWeekly,renderAlbum,renderEnvelope,renderCelebration,handleClick};
})();
