window.LearningUI = (() => {
  let svgId = 0, narrated = null;
  const pair = (he, ru) => ({ he, ru });
  const art = id => LearningArt.render(id, { label: text(LearningArt.label(id)) });
  function state() {
    if (!data.learning || data.learning.version !== 1) data.learning = { version: 1, progress: {}, sessions: {}, activeGame: null, view: 'menu', solvedTotal: 0 };
    data.learning.progress ||= {}; data.learning.sessions ||= {};
    return data.learning;
  }
  const course = () => LearningGames.catalog[PlaySession.isLearning()?PlaySession.entry().key:state().activeGame];
  const run = () => PlaySession.isLearning()?PlaySession.learningRun():state().sessions[state().activeGame];
  const completedCount = game => game === 'trivia' ? AtlasQuiz.completedCount() : Object.values(state().progress[game] || {}).filter(v => v.best === 10).length;
  function home() {
    return `<section class="learning-library"><div class="arcade-section-title"><div><span class="game-label">${bi(pair('עוד עולמות, עוד גילויים', 'Новые миры, новые открытия'))}</span><h2>${bi(pair('עוד משחקים למוח סקרן', 'Игры для любознательного ума'))}</h2></div></div><div class="lg-course-grid">${Object.entries(LearningGames.catalog).map(([game, item]) => {
      const atlas = item.mode === 'atlas', saved = atlas ? null : state().sessions[game], total = item.stageCount || 100, perStage = item.perStage || 10;
      const count = completedCount(game);
      return `<button class="lg-course-card ${item.color}" data-lg-action="open" data-lg-value="${game}"><span class="lg-course-art">${atlas ? '<img src="assets/atlas-cover.svg" alt="" width="220" height="150">' : art(item.art)}</span><b>${bi(item.title)}</b><span class="lg-course-desc">${bi(item.desc)}</span><span class="lg-course-count">${bi(atlas ? pair('10 סבבים · 8 שאלות בכל סבב', '10 раундов · по 8 вопросов') : pair(`${total} שלבים · ${perStage} תרגילים בכל שלב`, `${total} уровней · по ${perStage} заданий`))}</span><span class="lg-course-progress"><i style="--progress:${count/total*100}%"></i></span><span class="lg-course-play">${ico('play')}${bi(atlas ? pair('פותחים את האטלס', 'Открыть атлас') : saved?.status === 'playing' ? pair(`המשך שלב ${saved.stage}`, `Продолжить уровень ${saved.stage}`) : pair('לבחירת שלב', 'Выбрать уровень'))}<small>${count}/${total} ${ico('star')}</small></span></button>`;
    }).join('')}</div><div class="lg-library-note">${bi(pair('בוחרים משחק ושלב. ההתקדמות נשמרת במכשיר שלך.', 'Выбирай игру и уровень. Прогресс сохраняется на твоём устройстве.'))}</div></section>`;
  }
  function menu() {
    const item = course(), game = state().activeGame, saved = run(), progress = state().progress[game] || {};
    return `<section class="lg-menu ${item.color}"><div class="lg-menu-hero"><span class="lg-menu-art">${art(item.art)}</span><div><span class="game-label">${bi(pair('בוחרים הרפתקה בקצב שלך', 'Приключение в твоём темпе'))}</span><h1>${bi(item.title)}</h1><div>${bi(item.desc)}</div><div class="lg-menu-stats">${bi(pair(`${completedCount(game)} מתוך 100 שלבים הושלמו · 10 תרגילים בכל שלב`, `Пройдено ${completedCount(game)} из 100 уровней · по 10 заданий`))}</div></div></div><div class="lg-menu-actions">${saved ? `<button class="primary" data-lg-action="resume">${ico('play')}${bi(pair(`המשך שלב ${saved.stage} · תרגיל ${Math.min(10, saved.index + 1)}`, `Продолжить уровень ${saved.stage} · задание ${Math.min(10, saved.index + 1)}`))}</button>` : ''}<button data-action="home">${ico('home')}${bi(T.home)}</button></div>${game === 'origami' ? renderPaperDog() : ''}<h2>${bi(pair('באיזה שלב מתחילים?', 'С какого уровня начнём?'))}</h2><div class="lg-stage-grid" role="group" aria-label="${esc(text(pair('בחירת שלב', 'Выбор уровня')))}">${Array.from({ length: 100 }, (_, i) => { const stage = i + 1, best = progress[stage]?.best, complete = best === 10; return `<button data-lg-action="stage" data-lg-value="${stage}" class="lg-stage ${complete ? 'completed' : ''} ${saved?.stage === stage ? 'current' : ''}" aria-label="${esc(text(pair(`שלב ${stage}, ${best == null ? 'טרם תורגל' : `${best} מתוך 10 נפתרו`}`, `Уровень ${stage}, ${best == null ? 'ещё не пройден' : `решено ${best} из 10`}`)))}"><b>${stage}</b><small>${complete ? '★ ★ ★' : best != null ? best + '/10' : '· · ·'}</small></button>`; }).join('')}</div></section>`;
  }
  function renderMatch(q) {
    const coords = [[12,12,42,12],[10,17,10,43],[44,17,44,43],[12,47,42,47],[10,52,10,78],[44,52,44,78],[12,83,42,83]];
    const numberWidth = q.width * 64, total = numberWidth * 3 + 88;
    return `<div class="lg-match-wrap"><div class="lg-match-scroll"><svg class="lg-match-board ${q.width === 2 ? 'wide' : ''}" viewBox="0 0 ${total} 100" role="group" aria-label="${esc(text(pair('לוח הזזת גפרורים', 'Поле со спичками')))}">${q.board.map((v, i) => { const digit = Math.floor(i / 7), group = Math.floor(digit / q.width), x = digit * 64 + group * 44, c = coords[i % 7], from = q.solutionMove[0], to = q.solutionMove[1]; return `<g data-lg-action="match" data-lg-value="${i}" role="button" tabindex="${q.finished ? -1 : 0}" aria-label="${esc(text(pair(`גפרור ${i + 1}, ${v ? 'מונח' : 'מקום פנוי'}`, `Спичка ${i + 1}, ${v ? 'на месте' : 'пусто'}`)))}" class="lg-stick ${v ? 'on' : ''} ${q.source === i ? 'selected' : ''} ${q.hint >= 2 && i === from && !q.moves || q.hint === 3 && i === to && !q.moves ? 'hinted' : ''}"><rect x="${Math.min(c[0],c[2])+x-10}" y="${Math.min(c[1],c[3])-10}" width="${Math.abs(c[2]-c[0])+20}" height="${Math.abs(c[3]-c[1])+20}" fill="transparent" aria-hidden="true"/><path d="M${c[0]+x} ${c[1]}L${c[2]+x} ${c[3]}" class="lg-stick-hit"/><path d="M${c[0]+x} ${c[1]}L${c[2]+x} ${c[3]}" class="lg-stick-shaft"/>${v ? `<circle cx="${c[0]+x}" cy="${c[1]}" r="4" class="lg-stick-head"/>` : ''}</g>`; }).join('')}<text x="${numberWidth + 9}" y="58" class="lg-math-symbol">${q.operator}</text><text x="${numberWidth * 2 + 53}" y="58" class="lg-math-symbol">=</text></svg></div>${q.width === 2 ? `<div class="lg-small">${bi(pair('אפשר לגלול את הלוח לצדדים כדי להגיע לכל הגפרורים.', 'Поле можно прокручивать в стороны, чтобы добраться до всех спичек.'))}</div>` : ''}<div class="lg-tool-row"><span>${bi(pair(`${q.moves} מתוך מהלך אחד`, `${q.moves} из 1 хода`))}</span><button data-lg-action="undo" ${q.finished ? 'disabled' : ''}>${ico('route')}${bi(T.undo)}</button></div></div>`;
  }
  function paperSVG(layers, options = {}) {
    const points = options.frame || layers.flatMap(l => l.poly).concat([[0,0],[1,1]]);
    const xmin = Math.min(...points.map(v => v[0])), xmax = Math.max(...points.map(v => v[0])), ymin = Math.min(...points.map(v => v[1])), ymax = Math.max(...points.map(v => v[1]));
    const scale = 124 / Math.max(xmax-xmin, ymax-ymin, .1), x = v => 80 + (v-(xmin+xmax)/2)*scale, y = v => 73 + (v-(ymin+ymax)/2)*scale;
    const id = `paper-arrow-${++svgId}`;
    let extra = '';
    if (options.fold) {
      const { n, offset } = options.fold, middle = [n[0]*offset, n[1]*offset], tangent = [-n[1],n[0]];
      const a = [middle[0]+tangent[0]*3,middle[1]+tangent[1]*3], b = [middle[0]-tangent[0]*3,middle[1]-tangent[1]*3];
      const center = [(xmin+xmax)/2,(ymin+ymax)/2], nearest = [center[0]+n[0]*(offset-center[0]*n[0]-center[1]*n[1]),center[1]+n[1]*(offset-center[0]*n[0]-center[1]*n[1])];
      extra = `<defs><marker id="${id}" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0 0L5 3L0 6" fill="none" stroke="#bd7759" stroke-width="1.5"/></marker></defs><path d="M${x(a[0])} ${y(a[1])}L${x(b[0])} ${y(b[1])}" stroke="#d2a24b" stroke-width="2" stroke-dasharray="5 4"/><path d="M${x(nearest[0]+n[0]*.15)} ${y(nearest[1]+n[1]*.15)}L${x(nearest[0]-n[0]*.15)} ${y(nearest[1]-n[1]*.15)}" fill="none" stroke="#bd7759" stroke-width="2.5" marker-end="url(#${id})"/>`;
    }
    const creases = (options.creases || []).map(([a,b]) => `<path d="M${x(a[0])} ${y(a[1])}L${x(b[0])} ${y(b[1])}" stroke="#8a5266" stroke-width="2" stroke-dasharray="4 3"/>`).join('');
    const eyes = (options.eyes || []).map(([cx, cy]) => `<circle cx="${x(cx)}" cy="${y(cy)}" r="3" fill="#443451"/>`).join('');
    const holes = (options.holes || []).map(v => `<circle cx="${x(v[0])}" cy="${y(v[1])}" r="5" fill="#fffdfa" stroke="#807292" stroke-width="1.5"/>`).join('');
    return `<svg class="lg-paper" viewBox="0 0 160 150" role="img" aria-label="${esc(options.label || text(pair('נייר מקופל', 'Сложенная бумага')))}"><rect x="8" y="4" width="144" height="142" rx="12" fill="#f8f4fb"/>${layers.map(l => `<polygon points="${l.poly.map(v => x(v[0])+','+y(v[1])).join(' ')}" fill="${l.face ? '#f4d990' : '#a7d5c4'}" stroke="#709c90" stroke-width="1.5" stroke-linejoin="round"/>`).join('')}${extra}${creases}${holes}${eyes}${options.point ? `<circle cx="${x(options.point[0])}" cy="${y(options.point[1])}" r="5" fill="#d7848e" stroke="#98596a" stroke-width="1.5"/>` : ''}</svg>`;
  }
  function renderPaperDog() {
    const layer = (poly, face = 0) => ({ poly, face });
    const frame = [[0,-.25],[1,.75]];
    const diamond = layer([[0,.25],[.5,-.25],[1,.25],[.5,.75]]);
    const triangle = layer([[0,.25],[1,.25],[.5,.75]]);
    const left = layer([[.24,.25],[.1,.35],[.162,.477]], 1);
    const right = layer(left.poly.map(([x, y]) => [1-x, y]), 1);
    const head = layer([[.24,.25],[.76,.25],[.9,.35],[.58,.67],[.42,.67],[.1,.35]]);
    const chin = layer([[.42,.67],[.58,.67],[.5,.59]], 1);
    const steps = [
      { instruction: pair('העמד את הריבוע כמו יהלום, עם פינה למעלה ופינה למטה.', 'Положи квадрат ромбом: один угол сверху, другой снизу.'), layers: [diamond] },
      { instruction: pair('הבא את הפינה העליונה אל הפינה התחתונה. הדק את הקפל. קיבלת משולש שמצביע למטה.', 'Совмести верхний угол с нижним и прогладь сгиб. Получится треугольник вершиной вниз.'), layers: [triangle], creases: [[[.24,.25],[.1,.35]],[[.76,.25],[.9,.35]]] },
      { instruction: pair('קפל את הפינה השמאלית כלפי מטה, לאורך קו אלכסוני כמו באיור. קפל את הפינה הימנית באותה צורה. אלה האוזניים.', 'Загни левый угол вниз по диагонали, как на рисунке. Загни правый угол так же. Это уши.'), layers: [layer([[.24,.25],[.76,.25],[.9,.35],[.5,.75],[.1,.35]]),left,right], creases: [[[.42,.67],[.58,.67]]] },
      { instruction: pair('קפל את הקצה התחתון מעט כלפי מעלה, בשתי השכבות יחד. עכשיו יש לכלב סנטר שטוח.', 'Загни нижний кончик немного вверх, захватив оба слоя. У собаки получится плоский подбородок.'), layers: [head,left,right,chin] },
      { instruction: pair('צייר שתי עיניים ואף. נסה להכין עוד כלב עם אוזניים קצרות יותר. איזה קיפול צריך לשנות?', 'Нарисуй два глаза и нос. Попробуй сделать ещё одну собаку с более короткими ушами. Какой сгиб нужно изменить?'), layers: [head,left,right,chin], eyes: [[.39,.43],[.61,.43],[.5,.61]] }
    ];
    return `<details class="lg-fold-recipe"><summary>${bi(pair('מקפלים באמת · כלב מנייר', 'Складываем из бумаги · Собака'))}</summary><p>${bi(pair('צריך דף ריבועי ועיפרון. האיורים מציגים מה אמור להיות ביד אחרי כל שלב.', 'Нужны квадратный лист и карандаш. Каждый рисунок показывает результат шага.'))}</p><div>${steps.map((step,i) => `<figure>${paperSVG(step.layers, { frame, eyes:step.eyes, creases:step.creases })}<figcaption dir="auto"><b>${i+1}.</b> ${bi(step.instruction)}</figcaption></figure>`).join('')}</div></details>`;
  }
  function renderFoldRecipe(q, frame) {
    const steps = (q.recipe || []).map(({before, fold, after},i) => `<figure>${paperSVG(before,{frame,fold})}${paperSVG(after,{frame})}<figcaption dir="auto"><b>${i+1}.</b> ${bi(pair('הזז את הצד שממנו יוצא החץ, וקפל לאורך הקו המקווקו. השווה לאיור השני.', 'Перегни бумагу по пунктиру в направлении стрелки. Сравни результат со вторым рисунком.'))}</figcaption></figure>`).join('');
    const last = q.variant === 'holes'
      ? pair('הצבע על הנקודה באיור ודמיין חור שעובר דרך כל השכבות. בחר את הדפוס לפני שאתה פותח את הדף.', 'Найди отмеченную точку и представь, что отверстие проходит сквозь все слои. Выбери узор, прежде чем развернуть лист.')
      : pair('עכשיו בחר באחד מארבעת הקיפולים. נסה אותו על הדף והשווה לצורת היעד.', 'Теперь выбери один из четырёх сгибов. Сделай его на бумаге и сравни с заданной фигурой.');
    return `<details class="lg-fold-recipe"><summary>${bi(pair('הוראות לניסיון עם דף אמיתי', 'Попробуй на настоящем листе'))}</summary><p>${bi(pair('התחל מדף ריבועי. הנח אותו ישר, כמו באיור, והשאר אותו באותו כיוון בין הקיפולים.', 'Начни с квадратного листа. Положи его прямо, как на рисунке, и не поворачивай между сгибами.'))}</p>${steps ? `<div>${steps}</div>` : ''}<p>${bi(last)}</p></details>`;
  }
  function renderOrigami(q) {
    const frame = q.paper.flatMap(l => l.poly).concat((q.options || []).flatMap(o => o.paper ? o.paper.flatMap(l => l.poly) : []), [[0,0],[1,1]]);
    const square = [{ poly:[[0,0],[1,0],[1,1],[0,1]], face:0 }];
    let body;
    if (q.variant === 'holes') body = `<div class="lg-fold-demo"><figure><figcaption>${bi(pair('ניקבנו כאן', 'Прокололи здесь'))}</figcaption>${paperSVG(q.paper, { point:q.point, frame })}</figure><span class="lg-picture-arrow" aria-hidden="true">↗</span><figure><figcaption>${bi(pair('פותחים את הדף…', 'Разворачиваем…'))}</figcaption>${paperSVG(square)}</figure></div><div class="lg-picture-options">${q.options.map((o, i) => `<button data-lg-action="option" data-lg-value="${i}" class="lg-choice ${q.selected === i ? 'selected' : ''}" ${q.finished ? 'disabled' : ''} aria-label="${esc(text(pair(`אפשרות ${i + 1}: דפוס חורים`, `Вариант ${i + 1}: узор отверстий`)))}">${paperSVG(square, { holes:o.holes })}</button>`).join('')}</div>`;
    else body = `<div class="lg-fold-demo"><figure><figcaption>${bi(pair('הדף שלך עכשיו', 'Твой лист сейчас'))}</figcaption>${paperSVG(q.paper, { frame })}</figure><span class="lg-picture-arrow" aria-hidden="true">→</span><figure><figcaption>${bi(pair('רוצים להגיע לכאן', 'Нужна такая фигура'))}</figcaption>${paperSVG(q.target, { frame })}</figure></div><div class="lg-picture-options">${q.options.map((o, i) => `<button data-lg-action="option" data-lg-value="${i}" class="lg-choice ${q.selected === i ? 'selected' : ''}" ${q.finished ? 'disabled' : ''} aria-label="${esc(text(pair(`קיפול ${i + 1}`, `Сгиб ${i + 1}`)))}">${paperSVG(q.paper, { frame, fold:o.fold })}</button>`).join('')}</div>${q.selected != null ? `<div class="lg-fold-preview"><span>${bi(pair('כך נראה הקיפול שבחרת', 'Результат выбранного сгиба'))}</span>${paperSVG(q.options[q.selected].paper, { frame })}</div>` : ''}`;
    const recipeFrame = frame.concat((q.recipe || []).flatMap(step => step.before.flatMap(layer => layer.poly)));
    return renderFoldRecipe(q, recipeFrame) + body;
  }
  function renderTrivia(q) {
    const cues = { habitat:'house', covering:'covering', transport:'road', source:'flower', shadow:'trivia' };
    return `<div class="lg-trivia-question"><div class="lg-relation-cue" aria-hidden="true">${art(cues[q.family])}</div><figure>${art(q.picture)}</figure><span class="lg-picture-arrow" aria-hidden="true">→</span><span class="lg-question-mark" aria-hidden="true">?</span></div><div class="lg-picture-options lg-trivia-options">${q.options.map((o, i) => `<button class="lg-choice ${q.selected === i ? 'selected' : ''} ${q.hint === 3 && i === q.answer ? 'hinted' : ''} ${q.hint === 2 && i !== q.answer && i % 2 === q.answer % 2 ? 'lg-muted-choice' : ''}" data-lg-action="option" data-lg-value="${i}" ${q.finished ? 'disabled' : ''} aria-label="${esc(text(LearningArt.label(o.art)))}" aria-pressed="${q.selected === i}">${LearningArt.render(o.art, { silhouette:o.silhouette, label:text(LearningArt.label(o.art)) })}</button>`).join('')}</div>`;
  }
  function renderHebrew(q) {
    const speak = `<button class="lg-hear" data-lg-action="hear" ${speechSupported ? '' : 'disabled'} aria-label="${esc(text(pair('להשמעה בעברית', 'Послушать на иврите')))}">${ico('volume-2')}${bi(pair('שומעים', 'Слушать'))}</button>`;
    const figure = q.variant === 'letter' ? `<div class="lg-hebrew-model" lang="he" dir="rtl">${esc(q.letter)}</div>` : `<figure class="lg-word-picture">${art(q.picture)}</figure>`;
    let content;
    if (q.variant === 'build') content = `<div class="lg-word-slots" dir="rtl" aria-label="${esc(text(pair('המילה שלך', 'Твоё слово')))}">${Array.from(q.word).map((_, i) => `<button data-lg-action="remove-letter" data-lg-value="${i}" ${q.chosen[i] == null || q.finished ? 'disabled' : ''} lang="he">${q.chosen[i] != null ? esc(q.tiles[q.chosen[i]]) : '·'}</button>`).join('')}</div><div class="lg-letter-tiles" dir="rtl">${q.tiles.map((letter, i) => `<button data-lg-action="letter" data-lg-value="${i}" ${q.chosen.includes(i) || q.finished ? 'disabled' : ''} lang="he">${esc(letter)}</button>`).join('')}</div>`;
    else content = `${q.variant === 'missing' ? `<div class="lg-hebrew-word" dir="rtl" lang="he">${esc(q.masked)}</div>` : q.variant === 'initial' ? `<div class="lg-hebrew-word" dir="rtl" lang="he">${esc(q.word)}</div>` : ''}<div class="lg-text-options ${q.variant === 'word' ? 'lg-word-options' : ''}" dir="rtl">${q.options.map((o, i) => `<button data-lg-action="option" data-lg-value="${i}" class="lg-choice ${q.selected === i ? 'selected' : ''}" lang="he" aria-pressed="${q.selected === i}" ${q.finished ? 'disabled' : ''}>${esc(o.he)}</button>`).join('')}</div>`;
    return `<div class="lg-hebrew-task">${figure}${speak}${content}</div>`;
  }
  function renderMaze(q) {
    const n = q.n, step = 320/n, route = q.hint >= 2 ? LearningGames.mazePath(q) : [], marked = q.hint === 2 ? route.slice(0, 2) : route;
    let lines = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r*n+c, x = c*step, y = r*step;
      if (r === 0) lines += `<path d="M${x} ${y}h${step}"/>`;
      if (c === 0) lines += `<path d="M${x} ${y}v${step}"/>`;
      if (!q.passages[i].includes(i+1) || c === n-1) lines += `<path d="M${x+step} ${y}v${step}"/>`;
      if (!q.passages[i].includes(i+n) || r === n-1) lines += `<path d="M${x} ${y+step}h${step}"/>`;
    }
    const center = i => `${(i%n+.5)*step},${(Math.floor(i/n)+.5)*step}`;
    return `<div class="lg-maze"><svg viewBox="-5 -5 330 330" role="img" aria-label="${esc(text(pair(`מבוך ${n} על ${n}. המיקום שלך: שורה ${Math.floor(q.position/n)+1}, עמודה ${q.position%n+1}.`, `Лабиринт ${n} на ${n}. Твоя позиция: строка ${Math.floor(q.position/n)+1}, столбец ${q.position%n+1}.`)))}"><rect width="320" height="320" rx="4" fill="#f7effc"/>${marked.length ? `<polyline points="${marked.map(center).join(' ')}" fill="none" stroke="#edc466" stroke-width="${step*.25}" stroke-linecap="round" stroke-linejoin="round"/>` : ''}<g stroke="#a389bd" stroke-width="4" stroke-linecap="round">${lines}</g><text x="${(q.goal%n+.5)*step}" y="${(Math.floor(q.goal/n)+.7)*step}" text-anchor="middle" fill="#d3a243" font-size="${step*.7}">★</text><circle cx="${(q.position%n+.5)*step}" cy="${(Math.floor(q.position/n)+.5)*step}" r="${step*.28}" fill="#9362c3" stroke="#fff" stroke-width="2"/><circle cx="${(q.position%n+.43)*step}" cy="${(Math.floor(q.position/n)+.43)*step}" r="${step*.07}" fill="#fff"/></svg><div class="lg-dpad" role="group" aria-label="${esc(text(pair('תנועה במבוך', 'Движение по лабиринту')))}">${[['up','↑'],['left','←'],['down','↓'],['right','→']].map(([direction, glyph]) => `<button class="${direction}" data-lg-action="move" data-lg-value="${direction}" aria-label="${esc(text(({up:pair('למעלה','Вверх'),down:pair('למטה','Вниз'),left:pair('שמאלה','Влево'),right:pair('ימינה','Вправо')})[direction]))}" ${q.finished ? 'disabled' : ''}>${glyph}</button>`).join('')}</div><div class="lg-tool-row"><button data-lg-action="undo" ${q.finished || q.path.length < 2 ? 'disabled' : ''}>${bi(T.undo)}</button><button data-lg-action="reset" ${q.finished ? 'disabled' : ''}>${bi(pair('להתחלה', 'В начало'))}</button></div></div>`;
  }
  function task() {
    const s = run(), q = s.task, item = course();
    const visualOnly = q.game === 'trivia';
    const content = q.game === 'matches' ? renderMatch(q) : q.game === 'origami' ? renderOrigami(q) : visualOnly ? renderTrivia(q) : q.game === 'hebrew' ? renderHebrew(q) : renderMaze(q);
    return `<div class="lg-run ${item.color} ${visualOnly ? 'lg-visual-only' : ''}"><div class="lg-run-head"><div><span class="game-label">${bi(item.title)}</span><h1>${bi(pair(`שלב ${s.stage} מתוך 100`, `Уровень ${s.stage} из 100`))}</h1></div><button data-lg-action="menu">${ico('route')}${bi(pair('לשלבים', 'К уровням'))}</button></div><div class="lg-step-progress" role="group" aria-label="${esc(text(pair(`תרגיל ${s.index+1} מתוך 10`, `Задание ${s.index+1} из 10`)))}">${Array.from({length:10},(_,i)=>`<span class="${i<s.index?'done':i===s.index?'current':''}">${i<s.index?'✓':i+1}</span>`).join('')}</div><section class="lg-task-card"><div class="lg-task-counter">${bi(pair(`תרגיל ${s.index+1} מתוך 10`, `Задание ${s.index+1} из 10`))}</div><h2 class="${visualOnly?'sr-only':''}">${bi(q.prompt)}</h2>${content}${q.hint&&!q.finished?`<div class="lg-task-hint ${visualOnly?'sr-only':''}" role="status">${bi(q.hints[q.hint-1])}</div>`:''}${q.notice?`<div class="lg-feedback ${q.correct?'success':''}" role="status">${visualOnly?`<span aria-hidden="true">${q.finished?(q.correct?'★ ✓ ★':'→'):'↺'}</span><span class="sr-only">${bi(q.correct?T.success:q.finished?T.skipped:T.retry)}</span>`:bi(q.correct?pair('כל הכבוד! מצאת את הפתרון.', 'Отлично! Ты нашёл решение.'):q.finished?T.skipped:pair('עוד ניסיון קטן. אפשר לשנות או לבקש רמז.', 'Попробуй ещё раз. Можно изменить ответ или взять подсказку.'))}${q.correct?'<b class="lg-xp">+24 XP</b>':''}</div>`:''}<div class="lg-task-actions">${q.finished?`<button class="primary" data-lg-action="next">${bi(s.index===9?pair('לסיכום השלב', 'Итоги уровня'):pair('לתרגיל הבא', 'Следующее задание'))}${ico('play')}</button>`:`<button class="primary" data-lg-action="check">${ico('check')}${bi(T.check)}</button><button data-lg-action="hint" ${q.hint===3?'disabled':''}>${ico('sparkles')}${bi(T.hint)} ${q.hint}/3</button><button data-lg-action="skip">${bi(T.skip)}</button>`}</div><div class="lg-auto-row">${puzzleAutoControl()}<small>${q.correct&&data.puzzleAuto!==false?bi(pair('ממשיכים בעוד כמה שניות. אפשר לכבות את החידוש ולהישאר כאן.', 'Продолжим через несколько секунд. Выключи автопереход, чтобы остаться здесь.')):''}</small></div></section></div>`;
  }
  function summary() {
    const s = run(), item = course(), score = s.answers.filter(v => v.correct).length;
    return `<section class="hero lg-course-summary ${item.color}"><span class="lg-summary-stars" aria-hidden="true">${score===10?'★ ★ ★':score>=7?'★ ★':'★'}</span><h1>${bi(pair(`שלב ${s.stage} הסתיים!`, `Уровень ${s.stage} завершён!`))}</h1><h2>${bi(item.title)}</h2><div class="lg-summary-score">${score}<small>/10</small></div><div>${bi(pair('תרגילים שנפתרו', 'Решено заданий'))}</div><div class="lg-summary-total">${bi(pair(`${completedCount(s.game)} מתוך 100 שלבים הושלמו במלואם`, `Полностью пройдено ${completedCount(s.game)} из 100 уровней`))}</div><div class="lg-summary-actions">${SessionReview.jumpButton()}${s.stage<100?`<button class="primary" data-lg-action="stage" data-lg-value="${s.stage+1}">${bi(pair('לשלב הבא', 'Следующий уровень'))}${ico('play')}</button>`:''}<button data-lg-action="stage" data-lg-value="${s.stage}">${bi(pair('לנסות את השלב שוב', 'Попробовать ещё раз'))}</button><button data-lg-action="menu">${bi(pair('לבחירת שלב', 'Выбрать уровень'))}</button><button data-action="home">${ico('home')}${bi(T.home)}</button></div></section>${SessionReview.render(s.answers,item.title)}`;
  }
  function render() { if (PlaySession.isLearning()) return task(); if (!course()) return home(); return state().view==='menu'?menu():run()?.status==='complete'?summary():task(); }
  function open(game) {
    if (game === 'trivia') { AtlasQuiz.open(); return; }
    if (!LearningGames.catalog[game]) return;
    pause(); state().activeGame=game;state().view='menu';screen='learning';feedback=null;saveProgress();renderPage();
  }
  function startStage(stage) {
    narrated=null;
    if (!Number.isInteger(stage)||stage<1||stage>100) return;
    const game=state().activeGame;
    state().sessions[game]={game,stage,started:Date.now(),index:0,answers:[],status:'playing',task:LearningGames.create(game,stage,0)};
    state().view='task';screen='learning';saveProgress();renderPage();
  }
  function finish(correct) {
    const s=run(),q=s.task;if(q.finished)return;
    q.finished=true;q.correct=correct;q.notice=correct?'success':'skip';
    s.answers.push(SessionReview.snapshot(q,{id:q.id,correct,skipped:!correct,hints:q.hint,attempts:q.attempts}));
    if(correct){data.xp=(data.xp||0)+24;state().solvedTotal=(state().solvedTotal||0)+1;}
    const independent=correct&&q.attempts===1&&!q.hint;
    data.currentStreak=independent?(data.currentStreak||0)+1:0;data.bestStreak=Math.max(data.bestStreak||0,data.currentStreak);
    unlockBadges();
    if(correct&&!data.badges.includes('first'))data.badges.push('first');
    if((state().solvedTotal||0)+data.history.length>=10&&!data.badges.includes('ten'))data.badges.push('ten');
    saveProgress();
  }
  function next() {
    const s=run();if(!s?.task.finished)return;if(PlaySession.isLearning()){PlaySession.next();return;}
    if(s.index===9){s.status='complete';SessionReview.archive(`learning:${s.game}:${s.stage}:${s.started||s.task.id}`,course().title,s.answers,s.stage);const all=state().progress[s.game]||={},old=all[s.stage],score=s.answers.filter(v=>v.correct).length;all[s.stage]={best:Math.max(old?.best||0,score),attempts:(old?.attempts||0)+1,at:new Date().toISOString()};}
    else{s.index++;s.task=LearningGames.create(s.game,s.stage,s.index);}
    saveProgress();renderPage();
  }
  function renderPage(focusSelector) {
    const y=window.scrollY,horizontal=document.querySelector('.lg-match-scroll')?.scrollLeft||0;
    window.render();
    if(focusSelector&&document.querySelector('.lg-match-scroll'))document.querySelector('.lg-match-scroll').scrollLeft=horizontal;
    if(focusSelector)document.querySelector(focusSelector)?.focus({preventScroll:true});
    if(run()?.task?.finished)document.querySelector('.lg-feedback')?.scrollIntoView({block:'nearest'});
    else if(focusSelector)window.scrollTo({top:y,behavior:'instant'});
    else window.scrollTo({top:0,behavior:'instant'});
  }
  function speakHebrew(q) {
    if(!speechSupported)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.spoken);u.lang='he-IL';u.rate=.75;const voice=speechVoice('he-IL');if(voice)u.voice=voice;window.speechSynthesis.speak(u);
  }
  function handleClick(event) {
    const b=event.target.closest('button[data-lg-action],[data-lg-action][role="button"]');if(!b)return false;
    if(b.disabled)return true;
    const action=b.dataset.lgAction,value=b.dataset.lgValue;
    if(action==='open'){open(value);return true;}
    if(screen!=='learning'&&!PlaySession.isLearning())return true;
    if(action==='stage'){startStage(Number(value));return true;}
    if(action==='menu'){state().view='menu';saveProgress();renderPage();return true;}
    if(action==='resume'){state().view='task';saveProgress();renderPage();return true;}
    const q=run()?.task;if(!q)return true;
    if(action==='hear'){speakHebrew(q);return true;}
    if(action==='next'){next();return true;}
    if(q.finished)return true;
    if(action==='hint'){q.hint=Math.min(3,q.hint+1);q.notice=null;saveProgress();renderPage('[data-lg-action="hint"]');return true;}
    if(action==='skip'){finish(false);renderPage();return true;}
    if(action==='check'){q.attempts++;if(LearningGames.check(q))finish(true);else q.notice='retry';saveProgress();renderPage('[data-lg-action="check"]');return true;}
    if(LearningGames.act(q,action,value)){q.notice=null;saveProgress();renderPage(`[data-lg-action="${action}"]${value!=null?`[data-lg-value="${value}"]`:''}`);}
    return true;
  }
  function schedule() {
    if(document.hidden||screen!=='learning'||state().view==='menu'||!run()?.task.correct||data.puzzleAuto===false||run()?.status==='complete')return;
    const task=run().task;
    autoNextTimer=setTimeout(()=>{if(!document.hidden&&screen==='learning'&&run()?.task===task&&data.puzzleAuto!==false)next();},4000);
  }
  function afterRender() {
    if(screen!=='learning'&&!PlaySession.isLearning())return;
    schedule();
    const q=run()?.task;
    if((PlaySession.isLearning()||state().view!=='menu')&&run()?.status!=='complete'&&data.readAloud&&q&&narrated!==q.id+':'+q.hint+':'+q.notice){narrated=q.id+':'+q.hint+':'+q.notice;speakParts(q.notice?[q.correct?T.success:q.finished?T.skipped:T.retry]:q.hint?[q.hints[q.hint-1]]:[q.prompt]);}
  }
  function teacherPanel() {
    return `<section class="panel"><h2>${bi(pair('התקדמות במשחקי הגילוי', 'Прогресс в играх-открытиях'))}</h2><div class="lg-teacher-grid">${Object.entries(LearningGames.catalog).map(([game,item])=>{const atlas=item.mode==='atlas',current=atlas?null:state().sessions[game];return `<div class="stat"><b>${bi(item.title)}</b><strong>${completedCount(game)}/${item.stageCount||100}</strong><small>${bi(atlas?pair('סבבים שהושלמו', 'Завершённые раунды'):pair('שלבים שנפתרו במלואם', 'Полностью пройденные уровни'))}</small>${current?`<small>${bi(pair(`שלב אחרון: ${current.stage} · תרגיל ${current.index+1}`,`Последний уровень: ${current.stage} · задание ${current.index+1}`))}</small>`:''}</div>`;}).join('')}</div></section>`;
  }
  document.addEventListener('keydown',event=>{
    if(screen!=='learning'&&!PlaySession.isLearning())return;
    const target=event.target.closest('[data-lg-action="match"]');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
    const q=run()?.task, direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];
    if((PlaySession.isLearning()||state().view!=='menu')&&run()?.status==='playing'&&q?.game==='maze'&&direction&&!event.target.matches('input,textarea,select')){event.preventDefault();if(LearningGames.act(q,'move',direction)){q.notice=null;saveProgress();renderPage(`[data-lg-action="move"][data-lg-value="${direction}"]`);}}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  const completedTotal=()=>Object.keys(LearningGames.catalog).reduce((sum,game)=>sum+completedCount(game),0);
  return { home,render,handleClick,afterRender,schedule,teacherPanel,open,startStage,state,paperSVG,completedTotal };
})();
