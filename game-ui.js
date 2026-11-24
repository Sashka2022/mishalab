function gamePreview(kind, large = false) {
  const tiles = {
    math: ['2', '+', '3', '=', '?', '5', '8', '−', '4'],
    logic: ['●', '▲', '●', '▲', '?', '▲', '●', '▲', '●'],
    geometry: ['▲', '', '◆', '', '●', '', '■', '', '▲'],
    chess: ['♜', '', '♞', '', '♟', '', '♙', '', '♔']
  };
  const item = PuzzleGames.catalog[kind];
  const values = item ? item.tiles : tiles[kind];
  const size = Math.sqrt(values.length);
  return `<span class="game-preview ${kind} ${large ? 'large' : ''}" style="--cells:${size}" aria-hidden="true">${values.map((v, i) => `<i class="${v ? 'filled' : ''} tile-${i}">${item ? kind === 'sudoku' || kind === 'sliding' ? v || '' : '' : v}</i>`).join('')}</span>`;
}
function difficultyPicker() {
  const chosen=data.startDifficulty, label=chosen==null?P('לפי הקצב שלי','В моём темпе'):P(`רמה ${chosen}` ,`Уровень ${chosen}`);
  const presets=[[1,P('קליל','Легко')],[4,P('מעניין','Интересно')],[7,P('מאתגר','Сложно')],['auto',P('לפי הקצב שלי','В моём темпе')]];
  return `<details class="difficulty-picker"><summary>${ui(P('רמה:','Уровень:'))} <span id="difficulty-output">${ui(label)}</span><span aria-hidden="true"> ▾</span></summary><div class="difficulty-options"><div class="difficulty-heading"><h2 id="difficulty-title">${ui(P('רמת ברירת מחדל','Начальный уровень'))}</h2></div><div class="difficulty-presets" role="group" aria-labelledby="difficulty-title">${presets.map(([value,label],i)=>`<button data-difficulty="${value}" class="${chosen===value||chosen==null&&value==='auto'?'active':''}" aria-pressed="${chosen===value||chosen==null&&value==='auto'}"><span class="difficulty-dots" aria-hidden="true">${'●'.repeat(i===3?1:i+1)}</span>${ui(label)}</button>`).join('')}</div><div class="difficulty-range"><span aria-hidden="true">1</span><input id="difficulty-range" type="range" min="1" max="10" step="1" value="${chosen||1}" aria-label="${esc(text(P('רמת פתיחה מ־1 עד 10','Начальный уровень от 1 до 10')))}"><span aria-hidden="true">10</span></div><p class="difficulty-help">${ui(P('אפשר לבחור רמה גם בכניסה לכל משחק.','Перед каждой игрой тоже можно выбрать уровень.'))}</p>${puzzleAutoControl()}</div></details>`;
}
function chooseStartingDifficulty(value,rerender=true) {
  data.startDifficulty=value==='auto'?null:Math.max(1,Math.min(10,Math.round(Number(value)||1)));saveProgress();
  if(rerender){render();const details=document.querySelector('.difficulty-picker');if(details)details.open=true;document.querySelector(`[data-difficulty="${value}"]`)?.focus({preventScroll:true});}
  else {document.getElementById('difficulty-output').innerHTML=ui(P(`רמה ${data.startDifficulty}`,`Уровень ${data.startDifficulty}`));document.querySelectorAll('[data-difficulty]').forEach(b=>{const selected=Number(b.dataset.difficulty)===data.startDifficulty;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});}
}
function openingChallengePlan(domain) {
  if (session?.manualStartLevel != null && !session.results.length) return { offset: 0, band: 'steady', forced: null };
  return challengePlan(domain);
}
const HOME_SHELVES={
  thinking:{label:{he:'חשיבה',ru:'Мышление'},keys:['math','logic','geometry','chess']},
  courses:{label:{he:'קורסים',ru:'Курсы'},keys:['matches','origami','atlas','hebrew','maze']},
  boards:{label:{he:'חידות לוח',ru:'Головоломки'},keys:['sudoku','lights','sliding','nonogram']}
};
function gameHomeActivity(key) {
  const rows=[...(data.history||[]),...(data.sessionReports||[]).flatMap(r=>(r.results||[]).map(v=>({...v,at:v.at||r.at})))];
  const matching=rows.filter(r=>(r.activity||r.game||(r.mode==='puzzle'?r.type:r.domain))===key||r.type===key);return [...new Map(matching.map((r,i)=>[r.id||r.signature||`${r.activity||r.domain}:${r.type}:${r.at||i}`,r])).values()];
}
function gameHomeCard(key) {
  const core=domains[key],puzzle=PuzzleGames.catalog[key],course=LearningGames.catalog[key==='atlas'?'trivia':key];
  const title=core?.title||puzzle?.name||course?.title,desc=core?.desc||puzzle?.desc||course?.desc,rows=gameHomeActivity(key);
  const atlas=key==='atlas',run=atlas?Object.values(AtlasQuiz.state().runs).find(r=>!r.complete):data.learning?.sessions?.[key];
  const completed=atlas?AtlasQuiz.completedCount():Object.values(data.learning?.progress?.[key]||{}).filter(v=>v.best===10).length;
  const practiced=rows.length>0||completed>0,progressCount=run?.answers?.length||run?.index||0,partial=run?.status!=='complete'&&run?.complete!==true&&progressCount>0;
  const coreRun=(core||puzzle)&&session?.track===(puzzle?'puzzles':key)&&(!puzzle||session.puzzleKind===key)&&session.results.length<5?session:null;
  const status=partial?`${progressCount}/${atlas?8:10}`:coreRun?.results.length?`${coreRun.results.length}/5`:completed||practiced?'✓':ui(P('חדש','Новая'));
  const last=rows.map(r=>r.at).filter(Boolean).sort().at(-1),misses=last&&dayNumber()-dayNumber(last.slice(0,10))>=7;
  const art=core||puzzle?gamePreview(key):atlas?'<img src="assets/atlas-cover.svg" alt="" width="160" height="110">':LearningArt.render(course.art,{label:''});
  const attrs=core?`data-track="${key}" data-island="${key}"`:puzzle?`data-puzzle-kind="${key}"`:`data-lg-action="open" data-lg-value="${atlas?'trivia':key}"`;
  const classes=core?'arcade-world island-hotspot':puzzle?'puzzle-card':`lg-course-card ${course.color}`;
  return `<button class="shelf-card ${classes}" ${attrs} title="${esc(text(desc))}" aria-label="${esc(text(P(`לשחק: ${title.he}`,`Играть: ${title.ru}`)))}"><span class="game-status">${status}</span><span class="world-preview">${art}</span><b class="arcade-world-title">${ui(title)}</b><span class="world-play" aria-hidden="true">▸</span>${misses?`<small class="game-misses">${ui(P('מישה מתגעגע','Миша соскучился'))}</small>`:''}</button>`;
}
function renderGameShelf() {
  const selected=HOME_SHELVES[data.shelfTab]?data.shelfTab:'thinking';
  return `<section class="game-shelf" aria-labelledby="game-shelf-title"><div class="arcade-section-title"><h2 id="game-shelf-title">${ui(P('מדף המשחקים','Полка с играми'))}</h2><span>${ui(P('בוחרים משחק ורמה','Выбираем игру и уровень'))}</span></div><div class="shelf-tabs" role="tablist" aria-label="${esc(text(P('סוגי משחקים','Виды игр')))}">${Object.entries(HOME_SHELVES).map(([key,item])=>`<button id="shelf-tab-${key}" role="tab" data-home-tab="${key}" aria-selected="${selected===key}" aria-controls="shelf-panel-${key}" tabindex="${selected===key?0:-1}">${ui(item.label)}</button>`).join('')}</div>${Object.entries(HOME_SHELVES).map(([key,item])=>`<div class="shelf-grid" id="shelf-panel-${key}" role="tabpanel" aria-labelledby="shelf-tab-${key}" ${key===selected?'':'hidden'}>${item.keys.map(gameHomeCard).join('')}${key==='boards'?`<button class="home-journey-link" data-puzzle-kind="mixed">${ui(P('ערבוב חידות לוח','Смешать головоломки'))} ▸</button>`:''}</div>`).join('')}</section>`;
}
function gameHomeSavedAction() {
  if(PlaySession.state()?.status==='playing')return PlaySession.home();
  if(session&&session.results.length<5)return `<div class="home-primary-card"><span class="game-label">${ui(P('המשחק שלך מחכה','Твоя игра ждёт'))}</span><h2>${ui(SessionReview.label(session.track==='puzzles'?session.puzzleKind:session.track))}</h2><p>${ui(P(`ממשיכים בתרגיל ${Math.min(5,session.results.length+1)} מתוך 5`,`Продолжаем задание ${Math.min(5,session.results.length+1)} из 5`))}</p><button class="primary arcade-play" data-action="resume">${ico('play')}${ui(P('ממשיכים לשחק','Продолжить игру'))}</button></div>`;
  const learning=data.learning?.sessions?.[data.learning?.activeGame];
  if(learning?.status==='playing')return `<div class="home-primary-card"><span class="game-label">${ui(P('המשחק שלך מחכה','Твоя игра ждёт'))}</span><h2>${ui(SessionReview.label(learning.game))}</h2><p>${ui(P(`תרגיל ${learning.index+1} מתוך 10`,`Задание ${learning.index+1} из 10`))}</p><button class="primary arcade-play" data-session-action="home-learning-resume" data-game="${learning.game}">${ico('play')}${ui(P('ממשיכים לשחק','Продолжить игру'))}</button></div>`;
  const atlasState=AtlasQuiz.state(),atlasRun=atlasState.runs?.[atlasState.activeRound];
  if(atlasRun&&!atlasRun.complete)return `<div class="home-primary-card"><span class="game-label">${ui(P('המשחק שלך מחכה','Твоя игра ждёт'))}</span><h2>${ui(AtlasQuestions.title)}</h2><p>${ui(P(`סבב ${atlasState.activeRound} · שאלה ${Math.min(8,atlasRun.index+1)} מתוך 8`,`Раунд ${atlasState.activeRound} · вопрос ${Math.min(8,atlasRun.index+1)} из 8`))}</p><button class="primary arcade-play" data-session-action="home-atlas-resume">${ico('play')}${ui(P('ממשיכים באטלס','Продолжить атлас'))}</button></div>`;
  const today=dayKey(),theme=themeForDay(today),done=PlaySession.dailyComplete(today);
  if(done){const recommendation=PlaySession.choices().map(e=>({...e,count:gameHomeActivity(e.key).filter(r=>r.at&&dayNumber(today)-dayNumber(r.at.slice(0,10))<7).length})).sort((a,b)=>a.count-b.count)[0];return `<div class="home-primary-card"><span class="game-label">${ui(P('המשימה היומית הושלמה','Задание дня завершено'))}</span><h2>${ui(P('כל הכבוד! רוצה עוד?','Молодец! Ещё поиграем?'))}</h2><p>${ui(P('הנה משחק שעוד כדאי לנסות השבוע.','Вот игра, которую можно попробовать на этой неделе.'))}</p><button class="primary arcade-play" data-session-action="recommend" data-key="${recommendation.key}" data-kind="${recommendation.kind}">${ico('play')}${ui(SessionReview.label(recommendation.key))}</button></div>`;}
  return `<div class="home-primary-card"><span class="game-label">${ui(P('המשימה של היום','Задание дня'))}</span><h2>${ico(theme.icon)}${ui(theme.name)}</h2><p>${ui(P('5 תחנות חדשות · בקצב שלך','5 новых станций · в твоём темпе'))}</p><button class="primary arcade-play" data-session-action="daily-launch">${ico('play')}${ui(P('יוצאים לגלות','Начать открытия'))}</button></div>`;
}
function renderGameHome() {
  const ranks=window.Rewards,level=typeof rank==='function'?rank():1;
  return `<div class="arcade-home compact-home"><section class="personal-status"><img src="assets/characters/mishi-explorer.svg" alt="" width="48" height="56"><div><b>${ui(P('שלום מישה!','Привет, Миша!'))}</b><span>${ui(P('נפצח משהו יחד?','Разгадаем что-нибудь вместе?'))}</span></div>${ranks?.renderRank?ranks.renderRank(data):`<span class="personal-xp">${data.xp||0} XP · ${ui(P(`דרגה ${level}`,`Ранг ${level}`))}</span>`}</section><section class="arcade-hero compact-hero"><div class="arcade-welcome"><h1>${ui(P('מה נפצח היום, מישה?','Что разгадаем сегодня, Миша?'))}</h1>${gameHomeSavedAction()}${difficultyPicker()}<button class="home-journey-link" data-action="daily">${ico('route')}${ui(P('המסע הכללי · כל 13 המשחקים','Большое путешествие · все 13 игр'))} <span aria-hidden="true">▸</span></button></div></section>${ranks?.renderWeekly?ranks.renderWeekly(data):''}${renderGameShelf()}<section class="home-achievements"><h2>${ui(P('התגליות שלך','Твои открытия'))}</h2>${ranks?.renderBadges?ranks.renderBadges(data):badgeHTML()}${SessionReview.home()}<button data-session-action="passport-home">${ico('compass')}${ui(P('דרכון התגליות','Паспорт открытий'))}</button></section></div>`;
}

document.addEventListener('keydown',event=>{const tab=event.target.closest('[data-home-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const keys=Object.keys(HOME_SHELVES),current=keys.indexOf(tab.dataset.homeTab),rtl=document.documentElement.dir==='rtl',offset=event.key==='ArrowRight'?(rtl?-1:1):(rtl?1:-1);data.shelfTab=keys[event.key==='Home'?0:event.key==='End'?keys.length-1:(current+offset+keys.length)%keys.length];event.preventDefault();saveProgress();window.render();document.querySelector(`[data-home-tab="${data.shelfTab}"]`)?.focus({preventScroll:true});});
