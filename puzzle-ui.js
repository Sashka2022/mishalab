function puzzleAutoControl() {
  return `<button class="puzzle-auto" data-action="puzzle-auto" role="switch" aria-checked="${data.puzzleAuto !== false}"><span class="switch-track" aria-hidden="true"></span>${bi(P('חידוש אוטומטי אחרי פתרון', 'Новая головоломка после решения'))}</button>`;
}
function renderPuzzleHome() {
  return `<section class="worlds-panel puzzle-lab"><div class="section-head"><div><div class="eyebrow">${bi(P('חושבים עם הידיים', 'Думаем и играем'))}</div><h2>${bi(P('מעבדת החידות', 'Лаборатория головоломок'))}</h2><p>${bi(P('לוחות חדשים בכל פעם · רמזים בקצב שלך · בלי שעון עצר', 'Каждый раз новые поля · подсказки в твоём темпе · без обратного отсчёта'))}</p></div></div><div class="puzzle-catalog">${PuzzleGames.kinds.map(kind => {
    const item = PuzzleGames.catalog[kind];
    return `<button class="puzzle-card" data-puzzle-kind="${kind}"><span class="puzzle-mini ${kind}" style="--n:${Math.sqrt(item.tiles.length)}" aria-hidden="true">${item.tiles.map(v => `<i class="${v ? 'filled' : ''}">${kind === 'sudoku' || kind === 'sliding' ? v || '' : ''}</i>`).join('')}</span><b>${bi(item.name)}</b><span class="meta">${bi(item.desc)}</span></button>`;
  }).join('')}</div><div class="puzzle-start row"><button class="primary" data-puzzle-kind="mixed">${ico('sparkles')}${bi(P('הפתע אותי — ערבוב חידות', 'Удиви меня — разные головоломки'))}</button>${puzzleAutoControl()}</div><p class="tiny puzzle-note">${bi(P('במצב ערבוב סוג החידה מתחלף בכל פתרון. אפשר לכבות את החידוש ולעבור ידנית.', 'В смешанном режиме тип меняется после каждого решения. Автопереход можно выключить и продолжать вручную.'))}</p></section>`;
}
function renderPuzzleBoard(q) {
  const label = text(PuzzleGames.catalog[q.type].name), off = q.finished ? 'disabled' : '';
  let cells = '';
  for (let r = 0; r < q.n; r++) {
    if (q.type === 'nonogram') cells += `<span class="puzzle-clue" aria-label="${esc(text(P(`רמזי שורה ${r + 1}`, `Подсказки строки ${r + 1}`)))}">${q.rowClues[r].join(' ')}</span>`;
    for (let c = 0; c < q.n; c++) {
      const i = r * q.n + c, v = q.board[i], given = q.type === 'sudoku' && !!q.initial[i];
      const state = q.type === 'lights' ? text(v ? P('דלוק', 'горит') : P('כבוי', 'погашен')) : q.type === 'nonogram' ? text(v === 1 ? P('צבוע', 'закрашено') : v === -1 ? P('ריק מסומן', 'отмечено пустым') : P('לא מסומן', 'не отмечено')) : v || text(P('ריק', 'пусто'));
      const tileLabel = `${text(P(`שורה ${r + 1}, עמודה ${c + 1}`, `Строка ${r + 1}, столбец ${c + 1}`))}: ${state}`;
      const classes = [given ? 'given' : '', q.selected === i ? 'chosen' : '', v === 1 && q.type === 'nonogram' || v && q.type === 'lights' ? 'lit' : '', q.type === 'sliding' && !v ? 'blank' : '', q.type === 'sudoku' && c === 1 ? 'box-right' : '', q.type === 'sudoku' && r === 1 ? 'box-bottom' : ''].join(' ');
      const content = q.type === 'lights' ? v ? '●' : '○' : q.type === 'nonogram' ? v === -1 ? '×' : v ? '■' : '' : v || '';
      cells += `<button class="puzzle-tile ${classes}" data-puzzle-action="${q.type === 'sudoku' ? 'select' : 'tile'}" data-puzzle-value="${i}" aria-label="${esc(tileLabel)}" ${q.type === 'sudoku' ? `aria-pressed="${q.selected === i}"` : q.type === 'lights' || q.type === 'nonogram' ? `aria-pressed="${v === 1}"` : ''} ${off || given || q.type === 'sliding' && !v ? 'disabled' : ''}>${content}</button>`;
    }
  }
  const clues = q.type === 'nonogram' ? `<span></span>${q.colClues.map((clue, c) => `<span class="puzzle-clue col-clue" aria-label="${esc(text(P(`רמזי עמודה ${c + 1}`, `Подсказки столбца ${c + 1}`)))}">${clue.join('<br>')}</span>`).join('')}` : '';
  return `<div class="puzzle-play"><div class="puzzle-toolbar"><b>${bi(q.title)}</b><span>${bi(P(`${q.moves} מהלכים`, `${q.moves} ходов`))}</span></div><div class="puzzle-board ${q.type}" style="--n:${q.n + (q.type === 'nonogram' ? 1 : 0)}" role="group" aria-label="${esc(label)}">${clues}${cells}</div>${q.type === 'sudoku' ? `<div class="puzzle-keypad" role="group" aria-label="${esc(text(P('בחירת ספרה לתא שנבחר', 'Цифра для выбранной клетки')))}">${[1, 2, 3, 4, 0].map(v => `<button data-puzzle-action="digit" data-puzzle-value="${v}" ${q.selected == null || q.finished ? 'disabled' : ''}>${v || esc(text(P('מחק', 'Стереть')))}</button>`).join('')}</div>` : ''}<div class="puzzle-tools"><button data-puzzle-action="undo" ${!q.undo.length || q.finished ? 'disabled' : ''}>${bi(T.undo)}</button><button data-puzzle-action="reset" ${off}>${bi(P('ללוח ההתחלתי', 'К начальному полю'))}</button></div></div>`;
}
function schedulePuzzleRenewal() {
  if (document.hidden || screen !== 'task' || session?.track !== 'puzzles' || !session.task.finished || feedback !== 'success' || data.puzzleAuto === false) return;
  const completed = session.task;
  autoNextTimer = setTimeout(() => { if (!document.hidden && screen === 'task' && session?.task === completed && data.puzzleAuto !== false) next(); }, 5000);
}
function revealPuzzleFeedback() {
  if (screen !== 'task' || session?.task?.mode !== 'puzzle' || !feedback && !session.task.hint) return;
  requestAnimationFrame(() => {
    const panel = document.querySelector('.task-shell');
    const message = panel?.querySelector('.feedback, .hint');
    if (panel && message) {
      const bottom = message.getBoundingClientRect().bottom - panel.getBoundingClientRect().bottom;
      if (bottom > 0) panel.scrollTop += bottom + 12;
    }
  });
}
