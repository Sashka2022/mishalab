/* Original, dependency-free board puzzles for MishaLab. No third-party game code. */
window.PuzzleGames = (() => {
  const pair = (he, ru) => ({ he, ru });
  const catalog = {
    sudoku: { name: pair('סודוקו קטן', 'Мини-судоку'), desc: pair('ארבע ספרות, הרבה גילויים', 'Четыре цифры, много открытий'), tiles: [1, 0, 3, 0, 0, 4, 0, 2, 2, 0, 4, 0, 0, 3, 0, 1] },
    lights: { name: pair('כיבוי אורות', 'Погаси огни'), desc: pair('כל לחיצה משנה גם את השכנים', 'Нажатие меняет и соседей'), tiles: [1, 0, 1, 0, 1, 0, 1, 0, 1] },
    sliding: { name: pair('פאזל הזזה', 'Сдвигай плитки'), desc: pair('מקום ריק אחד, דרך חדשה לסדר', 'Одна пустая клетка — путь к порядку'), tiles: [1, 2, 3, 4, 0, 6, 7, 5, 8] },
    nonogram: { name: pair('ציור לפי מספרים', 'Нонограмма'), desc: pair('רמזים בשוליים מגלים דפוס', 'Подсказки по краям открывают узор'), tiles: [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0] }
  };
  const kinds = Object.keys(catalog);
  const shuffle = values => {
    const a = values.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const neighbors = (i, n) => [i - n, i + n, i % n ? i - 1 : -1, i % n < n - 1 ? i + 1 : -1].filter(j => j >= 0 && j < n * n);
  function toggle(board, i, n) { for (const j of [i, ...neighbors(i, n)]) board[j] = 1 - board[j]; }
  function runs(line) {
    const result = []; let count = 0;
    for (const v of [...line, 0]) { if (v === 1) count++; else if (count) { result.push(count); count = 0; } }
    return result.length ? result : [0];
  }
  const rowsOf = (board, n) => Array.from({ length: n }, (_, r) => board.slice(r * n, (r + 1) * n));
  const colsOf = (board, n) => Array.from({ length: n }, (_, c) => Array.from({ length: n }, (_, r) => board[r * n + c]));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function sudokuCandidates(board, i) {
    const r = Math.floor(i / 4), c = i % 4;
    return [1, 2, 3, 4].filter(v => !board.some((x, j) => x === v && (Math.floor(j / 4) === r || j % 4 === c || Math.floor(j / 8) === Math.floor(r / 2) && Math.floor(j % 4 / 2) === Math.floor(c / 2))));
  }
  function countSudoku(input, limit = 2) {
    const board = input.slice(); let count = 0;
    function visit() {
      const i = board.indexOf(0);
      if (i < 0) { count++; return; }
      for (const v of sudokuCandidates(board, i)) { board[i] = v; visit(); board[i] = 0; if (count >= limit) return; }
    }
    visit(); return count;
  }
  function countNonogram(rowClues, colClues, limit = 2) {
    const n = rowClues.length, candidates = rowClues.map(clue => Array.from({ length: 1 << n }, (_, mask) => Array.from({ length: n }, (_, c) => mask >> c & 1)).filter(row => same(runs(row), clue)));
    let count = 0;
    function visit(rows) {
      if (rows.length === n) { if (colsOf(rows.flat(), n).every((col, c) => same(runs(col), colClues[c]))) count++; return; }
      for (const row of candidates[rows.length]) { visit([...rows, row]); if (count >= limit) return; }
    }
    visit([]); return count;
  }
  const coordinate = (i, n) => `${Math.floor(i / n) + 1}:${i % n + 1}`;
  function create(kind, level) {
    if (!kinds.includes(kind)) throw new Error('Unknown puzzle kind');
    const q = { domain: 'logic', type: kind, mode: 'puzzle', level, title: catalog[kind].name, n: kind === 'sliding' || kind === 'lights' && level < 6 ? 3 : 4, selected: null, moves: 0, undo: [] };
    if (kind === 'sudoku') {
      const digits = shuffle([1, 2, 3, 4]), groups = () => shuffle([0, 1]).flatMap(g => shuffle([g * 2, g * 2 + 1]));
      const rows = groups(), cols = groups();
      q.answer = rows.flatMap(r => cols.map(c => digits[(r * 2 + Math.floor(r / 2) + c) % 4]));
      q.initial = q.answer.slice(); let removed = 0;
      for (const i of shuffle(Array.from({ length: 16 }, (_, i) => i))) {
        const v = q.initial[i]; q.initial[i] = 0;
        if (countSudoku(q.initial) !== 1) q.initial[i] = v; else removed++;
        if (removed >= Math.min(11, 3 + level)) break;
      }
      const first = q.initial.indexOf(0);
      q.prompt = pair('השלם 1–4 בכל שורה, עמודה וריבוע מודגש, בלי חזרות. בחר תא ואז ספרה.', 'Заполни строки, столбцы и выделенные квадраты цифрами 1–4 без повторов. Выбери клетку, затем цифру.');
      q.hints = [pair('חפש שורה או עמודה שכמעט מלאה.', 'Найди почти заполненную строку или столбец.'), pair('בדוק גם את הריבוע המודגש: כל ספרה מופיעה בו פעם אחת.', 'Проверь выделенный квадрат: каждая цифра встречается один раз.'), pair(`בלוח ההתחלתי, בתא שורה:עמודה ${coordinate(first, 4)} חסרה הספרה ${q.answer[first]}.`, `В начальном поле в клетке строка:столбец ${coordinate(first, 4)} нужна цифра ${q.answer[first]}.`)];
    } else if (kind === 'lights') {
      q.initial = Array(q.n * q.n).fill(0);
      q.solution = shuffle(q.initial.map((_, i) => i)).slice(0, Math.min(q.n * q.n - 1, 1 + level));
      for (const i of q.solution) toggle(q.initial, i, q.n);
      if (!q.initial.some(Boolean)) { toggle(q.initial, 0, q.n); q.solution = q.solution.includes(0) ? q.solution.filter(i => i !== 0) : [...q.solution, 0]; }
      q.answer = Array(q.n * q.n).fill(0);
      q.prompt = pair('כבה את כל האורות. לחיצה משנה את התא ואת שכניו למעלה, למטה ולצדדים.', 'Погаси все огни. Нажатие переключает клетку и её соседей сверху, снизу, слева и справа.');
      q.hints = [pair('בדוק אילו תאים משתנים יחד עם כל אור.', 'Посмотри, какие клетки меняются вместе с огоньком.'), pair('שתי לחיצות על אותו תא מבטלות זו את זו; סדר הלחיצות לא משנה.', 'Два нажатия на клетку отменяют друг друга; порядок нажатий не важен.'), pair(`דרך מהלוח ההתחלתי — לחץ פעם אחת על כל תא (שורה:עמודה): ${q.solution.map(i => coordinate(i, q.n)).join(', ')}.`, `Путь от начального поля — нажми один раз каждую клетку (строка:столбец): ${q.solution.map(i => coordinate(i, q.n)).join(', ')}.`)];
    } else if (kind === 'sliding') {
      q.answer = [1, 2, 3, 4, 5, 6, 7, 8, 0]; q.initial = q.answer.slice();
      let blank = 8, previous = -1; const path = [];
      for (let step = 0; step < 3 + level * 2; step++) {
        const to = shuffle(neighbors(blank, 3).filter(i => i !== previous))[0];
        path.push(q.initial[to]); [q.initial[blank], q.initial[to]] = [q.initial[to], q.initial[blank]]; previous = blank; blank = to;
      }
      if (same(q.initial, q.answer)) { const to = neighbors(blank, 3)[0]; path.push(q.initial[to]); [q.initial[blank], q.initial[to]] = [q.initial[to], q.initial[blank]]; }
      q.solution = path.reverse();
      q.prompt = pair('סדר את האריחים 1–8 משמאל לימין, מלמעלה למטה. המקום הריק בסוף; לחץ על אריח צמוד אליו.', 'Расположи плитки 1–8 слева направо, сверху вниз. Пустая клетка в конце; нажми соседнюю плитку.');
      q.hints = [pair('רק אריח שצמוד למקום הריק יכול לזוז.', 'Двигаться может только плитка рядом с пустой клеткой.'), pair('התחל בסידור השורה העליונה. אפשר להחזיר מהלך ולנסות דרך אחרת.', 'Начни с верхнего ряда. Можно отменить ход и попробовать другой путь.'), pair(`דרך אפשרית מהלוח ההתחלתי — לחץ על האריחים בסדר: ${q.solution.join(' → ')}.`, `Возможный путь от начального поля — нажимай плитки по порядку: ${q.solution.join(' → ')}.`)];
    } else {
      // Small exhaustive solver certifies one solution for every generated board.
      let tries = 0;
      do {
        q.answer = Array.from({ length: 16 }, () => Math.random() < (level < 4 ? .7 : .5) ? 1 : 0);
        if (++tries > 100) q.answer = [1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
        q.rowClues = rowsOf(q.answer, 4).map(runs); q.colClues = colsOf(q.answer, 4).map(runs);
      } while (!q.answer.some(Boolean) || q.answer.every(Boolean) || countNonogram(q.rowClues, q.colClues) !== 1);
      q.initial = Array(16).fill(0);
      q.prompt = pair('צבע תאים לפי רצפי המספרים בשוליים. בין רצפים משאירים רווח. לחיצה נוספת מסמנת ×.', 'Закрась клетки по числам по краям. Между группами оставляй пробел. Повторное нажатие ставит ×.');
      const first = q.answer.indexOf(1);
      q.hints = [pair('כל מספר הוא אורך רצף של תאים צבועים. 0 אומר שהשורה או העמודה ריקה.', 'Число — длина группы закрашенных клеток. 0 означает пустую строку или столбец.'), pair('רצף באורך 4 ממלא שורה שלמה. בין שני רצפים חייב להיות לפחות תא ריק.', 'Группа длиной 4 занимает весь ряд. Между группами нужна хотя бы одна пустая клетка.'), pair(`בתא שורה:עמודה ${coordinate(first, 4)} צריך לצבוע. הצלבת רמזי השורות והעמודות קובעת את שאר הדפוס.`, `Клетку строка:столбец ${coordinate(first, 4)} нужно закрасить. Сопоставь подсказки строк и столбцов, чтобы найти остальные.`)];
    }
    q.board = q.initial.slice();
    return q;
  }
  function check(q) {
    if (q.type === 'nonogram') return q.board.every(v => [-1, 0, 1].includes(v)) && rowsOf(q.board, q.n).every((row, r) => same(runs(row), q.rowClues[r])) && colsOf(q.board, q.n).every((col, c) => same(runs(col), q.colClues[c]));
    return same(q.board, q.answer);
  }
  function act(q, action, value) {
    if (q.finished) return false;
    const i = Number(value);
    if (action === 'select') { if (q.type !== 'sudoku' || q.initial[i]) return false; q.selected = i; return true; }
    if (action === 'undo') { const old = q.undo.pop(); if (!old) return false; q.board = old.board; q.moves = old.moves; return true; }
    if (action === 'reset') { q.board = q.initial.slice(); q.moves = 0; q.undo = []; q.selected = null; return true; }
    if (action === 'digit' && (q.type !== 'sudoku' || q.selected == null || q.initial[q.selected] || i < 0 || i > 4)) return false;
    if (action === 'tile' && (i < 0 || i >= q.board.length || q.type === 'sudoku')) return false;
    if (action === 'tile' && q.type === 'sliding' && !neighbors(q.board.indexOf(0), 3).includes(i)) return false;
    if (!['tile', 'digit'].includes(action)) return false;
    q.undo.push({ board: q.board.slice(), moves: q.moves }); q.undo = q.undo.slice(-100);
    if (action === 'digit') q.board[q.selected] = i;
    else if (q.type === 'lights') toggle(q.board, i, q.n);
    else if (q.type === 'sliding') { const blank = q.board.indexOf(0); [q.board[blank], q.board[i]] = [q.board[i], q.board[blank]]; }
    else q.board[i] = q.board[i] === 0 ? 1 : q.board[i] === 1 ? -1 : 0;
    q.moves++; return true;
  }
  return { catalog, kinds, create, check, act, countSudoku, countNonogram };
})();
