/* Five deterministic courses: 100 stages × 10 exercises each. No network required. */
window.LearningGames = (() => {
  const p = (he, ru) => ({ he, ru });
  const catalog = {
    matches: { title: p('קסם הגפרורים', 'Магия спичек'), desc: p('מזיזים גפרור ומפצחים את החידה', 'Переложи спичку и реши загадку'), color: 'amber', domain: 'logic', art: 'matches' },
    origami: { title: p('סטודיו אוריגמי', 'Студия оригами'), desc: p('מקפלים, מנקבים ומגלים מה נפתח', 'Складывай и открывай узоры'), color: 'mint', domain: 'geometry', art: 'origami' },
    trivia: { title: p('חכמים בתמונות', 'Умные картинки'), desc: p('מגלים את העולם דרך איורים', 'Узнаём мир по рисункам'), color: 'sky', domain: 'logic', art: 'trivia' },
    hebrew: { title: p('עברית קטנה', 'Иврит шаг за шагом'), desc: p('אותיות, מילים וקצת קסם', 'Буквы, слова и немного волшебства'), color: 'rose', domain: 'logic', art: 'hebrew' },
    maze: { title: p('הרפתקת מבוכים', 'Приключения в лабиринте'), desc: p('מוצאים דרך אל הכוכב', 'Найди дорогу к звезде'), color: 'violet', domain: 'logic', art: 'maze' }
  };
  function random(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, rng) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { let j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = (a, rng) => a[Math.floor(rng() * a.length)];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const SEG = [[1,1,1,0,1,1,1],[0,0,1,0,0,1,0],[1,0,1,1,1,0,1],[1,0,1,1,0,1,1],[0,1,1,1,0,1,0],[1,1,0,1,0,1,1],[1,1,0,1,1,1,1],[1,0,1,0,0,1,0],[1,1,1,1,1,1,1],[1,1,1,1,0,1,1]];
  const matchCache = {};
  const digitsToNumbers = (digits, width) => [0, 1, 2].map(i => Number(digits.slice(i * width, (i + 1) * width).join('')));
  const readable = (digits, width) => digits.every(v => v >= 0) && (width === 1 || [0, width, width * 2].every(i => digits[i] > 0));
  const equation = (numbers, op) => (op === '+' ? numbers[0] + numbers[1] : numbers[0] - numbers[1]) === numbers[2];
  function matchBank(width) {
    if (matchCache[width]) return matchCache[width];
    const min = width === 1 ? 0 : 10, max = width === 1 ? 9 : 99;
    const equations = [];
    for (let a = min; a <= max; a++) for (let b = min; b <= max; b++) for (const op of ['+', '−']) {
      const c = op === '+' ? a + b : a - b;
      if (c >= min && c <= max) equations.push({ numbers: [a, b, c], op });
    }
    const bank = [], seen = new Set();
    for (const item of shuffle(equations, random(9281 + width))) {
      const solvedDigits = item.numbers.join('').split('').map(Number), solved = solvedDigits.flatMap(d => SEG[d]);
      for (let from = 0; from < solved.length; from++) if (solved[from]) for (let to = 0; to < solved.length; to++) if (!solved[to]) {
        const board = solved.slice(); board[from] = 0; board[to] = 1;
        const digits = solvedDigits.map((_, i) => SEG.findIndex(segments => segments.every((v, j) => v === board[i * 7 + j])));
        if (!readable(digits, width) || equation(digitsToNumbers(digits, width), item.op)) continue;
        const key = item.op + ':' + digits.join('');
        if (!seen.has(key)) { seen.add(key); bank.push({ digits, initial: board, solution: solvedDigits, solutionMove: [to, from], operator: item.op, width }); }
        if (width === 2 && bank.length >= 1200) return matchCache[width] = bank;
      }
    }
    return matchCache[width] = bank;
  }
  function createMatches(serial) {
    const width = serial < 200 ? 1 : 2, bank = matchBank(width), index = serial < 200 ? serial : serial - 200;
    if (!bank[index]) throw new Error('Insufficient distinct matchstick puzzles');
    const item = bank[index];
    return { ...item, initial: item.initial.slice(), board: item.initial.slice(), source: null, moves: 0,
      prompt: p('העבר גפרור אחד: בחר גפרור, ואז מקום ריק, כדי שהתרגיל יהיה נכון.', 'Переложи одну спичку: выбери спичку, затем пустое место, чтобы равенство стало верным.'),
      hints: [p('אפשר לשנות ספרה אחת או להעביר גפרור בין שתי ספרות.', 'Можно изменить одну цифру или перенести спичку между двумя цифрами.'), p('הגפרור המסומן הוא התחלה אפשרית. חפש מקום פנוי שיתקן את המשוואה.', 'Выделенная спичка — возможное начало. Найди пустое место, чтобы исправить равенство.'), p(`פתרון אפשרי: ${digitsToNumbers(item.solution, width).slice(0, 2).join(' ' + item.operator + ' ')} = ${digitsToNumbers(item.solution, width)[2]}.`, `Один из ответов: ${digitsToNumbers(item.solution, width).slice(0, 2).join(' ' + item.operator + ' ')} = ${digitsToNumbers(item.solution, width)[2]}.`)] };
  }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const area = poly => Math.abs(poly.reduce((sum, v, i) => sum + v[0] * poly[(i + 1) % poly.length][1] - v[1] * poly[(i + 1) % poly.length][0], 0)) / 2;
  const pointIn = (point, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside; }
    return inside;
  };
  function clip(poly, n, offset, side) {
    const output = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], da = dot(a, n) - offset, db = dot(b, n) - offset;
      if (side * da >= -1e-9) output.push(a);
      if ((da > 1e-9 && db < -1e-9) || (da < -1e-9 && db > 1e-9)) { const t = da / (da - db); output.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
    }
    return output;
  }
  function foldPaper(layers, operation) {
    const { n, offset } = operation, stationary = [], moving = [];
    const reflect = v => { const d = 2 * (dot(v, n) - offset); return [v[0] - d * n[0], v[1] - d * n[1]]; };
    for (const layer of layers) {
      const stay = clip(layer.poly, n, offset, -1), move = clip(layer.poly, n, offset, 1);
      if (stay.length >= 3 && area(stay) > 1e-8) stationary.push({ ...layer, poly: stay });
      if (move.length >= 3 && area(move) > 1e-8) {
        const [a, b, c, d, e, f] = layer.matrix;
        const r00 = 1 - 2 * n[0] ** 2, r01 = -2 * n[0] * n[1], r11 = 1 - 2 * n[1] ** 2;
        moving.push({ poly: move.map(reflect).reverse(), face: 1 - layer.face,
          matrix: [r00*a+r01*b, r01*a+r11*b, r00*c+r01*d, r01*c+r11*d, r00*e+r01*f+2*offset*n[0], r01*e+r11*f+2*offset*n[1]] });
      }
    }
    return [...stationary, ...moving.reverse()];
  }
  const square = () => [{ poly: [[0,0], [1,0], [1,1], [0,1]], face: 0, matrix: [1,0,0,1,0,0] }];
  const paperKey = layers => layers.map(l => l.face + ':' + l.poly.map(v => v.map(x => Math.round(x * 10000))).sort().join(';')).sort().join('|');
  function foldChoices(layers, rng, advanced) {
    const points = layers.flatMap(l => l.poly), result = [], seen = new Set();
    for (const angle of shuffle([0, 90, 180, 270, 45, 135, 225, 315], rng)) {
      const a = angle * Math.PI / 180, n = [Math.cos(a), Math.sin(a)], values = points.map(v => dot(v, n));
      const low = Math.min(...values), high = Math.max(...values);
      for (const fraction of shuffle(advanced ? [.25, 1/3, .5, 2/3, .75] : [.5, 1/3, 2/3], rng)) {
        const op = { n, offset: low + (high - low) * fraction }, folded = foldPaper(layers, op), key = paperKey(folded);
        if (!seen.has(key) && folded.length > layers.length) { seen.add(key); result.push({ fold: op, paper: folded }); }
      }
    }
    if (result.length < 4) throw new Error('Not enough distinguishable folds');
    return shuffle(result, rng);
  }
  function punch(layers, point) {
    const holes = [];
    for (const layer of layers) if (pointIn(point, layer.poly)) {
      const [a,b,c,d,e,f] = layer.matrix, determinant = a*d-b*c, x = point[0]-e, y = point[1]-f;
      const original = [(d*x-c*y)/determinant, (-b*x+a*y)/determinant];
      if (!holes.some(h => Math.hypot(h[0]-original[0], h[1]-original[1]) < 1e-6)) holes.push(original);
    }
    return holes;
  }
  function createOrigami(stage, serial, rng) {
    let paper = square(); const recipe = [];
    const count = stage === 1 ? 0 : stage < 35 ? 1 : stage < 70 ? 2 : 3;
    for (let i = 0; i < count; i++) { const op = pick(foldChoices(paper, rng, stage > 25), rng); recipe.push({ before: paper, fold: op.fold, after: op.paper }); paper = op.paper; }
    const choices = foldChoices(paper, rng, stage > 20).slice(0, 4), answer = Math.floor(rng() * 4);
    if (stage > 5 && serial % 3 === 1) {
      // Punch through the folded sheet, then map each hole back to the original square.
      const folded = choices[answer].paper, polygon = folded.at(-1).poly;
      let point = [0, 0];
      for (const v of polygon) { point[0] += v[0] / polygon.length; point[1] += v[1] / polygon.length; }
      const holes = punch(folded, point);
      const wrong = [0.12, 0.21, 0.3].map(offset => holes.map(h => [Math.min(.95, Math.max(.05, h[0] + offset)), Math.min(.95, Math.max(.05, h[1] - offset / 2))]));
      const options = shuffle([{ holes, correct: true }, ...wrong.map(h => ({ holes: h, correct: false }))], rng);
      return { variant: 'holes', paper: folded, recipe: [...recipe, { before: paper, fold: choices[answer].fold, after: folded }], point, holes, options, answer: options.findIndex(o => o.correct),
        prompt: p('ניקבנו חור בדף המקופל. איזה ציור נראה כשנפתח אותו?', 'Мы прокололи сложенную бумагу. Какой узор увидим, когда её развернём?'),
        hints: [p('חור אחד עובר דרך כל שכבות הנייר שמתחתיו.', 'Один прокол проходит через все слои под ним.'), p('כשפותחים קיפול, החורים שבשכבות נפתחים יחד איתו.', 'При разворачивании отверстия в слоях разворачиваются вместе с бумагой.'), p(`אחרי הפתיחה יהיו ${holes.length} חורים. השווה גם את המקומות שלהם.`, `После разворачивания будет ${holes.length} отверстий. Сравни и их расположение.`)] };
    }
    return { variant: 'fold', paper, recipe, options: choices, answer, target: choices[answer].paper,
      prompt: p('איזה קיפול ייצור את הצורה שבדוגמה? בחר קו קיפול וראה מה קורה.', 'Какой сгиб даст фигуру из образца? Выбери линию и посмотри на результат.'),
      hints: [p('הקו המקווקו הוא מקום הקיפול. החץ מראה איזה צד זז.', 'Пунктир — линия сгиба. Стрелка показывает, какая сторона движется.'), p('השווה את המיקום והצורה, וגם איזה צד של הנייר רואים.', 'Сравни положение и форму, а также видимую сторону бумаги.'), p('בחר קיפול, השווה את התוצאה לדוגמה ונסה אותו גם עם דף אמיתי.', 'Выбери сгиб, сравни результат с образцом и попробуй сложить настоящий лист.') ] };
  }
  const habitats = {
    sea: ['fish','dolphin','octopus','whale','seahorse','jellyfish'],
    forest: ['owl','fox','squirrel','deer','woodpecker'],
    savanna: ['lion','giraffe','zebra','elephant'],
    polar: ['polarBear','emperorPenguin','walrus'],
    desert: ['camel','fennec','scorpion']
  };
  const coverings = { feathers: ['owl','hen','duck','woodpecker','emperorPenguin'], fur: ['cat','dog','rabbit','fox','lion','polarBear','squirrel'], scales: ['fish','snake','lizard'] };
  const routes = { road: ['car','bus','bicycle','truck'], sea: ['boat','sailboat','submarine'], air: ['plane','helicopter','balloon'], rails: ['train','tram'], space: ['rocket'] };
  const products = [['bee','honey'], ['cow','milk'], ['hen','egg'], ['sheep','wool'], ['appleTree','apple'], ['caterpillar','butterfly'], ['wheat','bread'], ['orangeTree','orange'], ['oliveTree','oil']];
  function relationQuestion(groups, rng, category, reverse = false) {
    const categories = Object.keys(groups), correct = pick(categories, rng), item = pick(groups[correct], rng);
    const wrong = shuffle(categories.filter(v => v !== correct), rng).slice(0, 3);
    const options = shuffle([correct, ...wrong].map(group => ({ art: reverse ? pick(groups[group], rng) : group, category: group })), rng);
    return { family: category, picture: reverse ? correct : item, options, answer: options.findIndex(o => o.category === correct), relation: correct, visualOnly: true, prompt: p('בחר את האיור המתאים.', 'Выбери подходящий рисунок.') };
  }
  function createTrivia(serial, rng) {
    let q;
    if (serial % 5 === 0) q = relationQuestion(habitats, rng, 'habitat', serial % 10 === 0 || serial > 800);
    else if (serial % 5 === 1) q = relationQuestion(coverings, rng, 'covering', true);
    else if (serial % 5 === 2) q = relationQuestion(routes, rng, 'transport', true);
    else if (serial % 5 === 3) {
      const selected = pick(products, rng), reverse = serial % 10 === 3, distractors = shuffle(products.filter(v => v !== selected), rng).slice(0, 3);
      const options = shuffle([selected, ...distractors].map(v => ({ art: v[reverse ? 0 : 1], product: v[1] })), rng);
      q = { family: 'source', picture: selected[reverse ? 1 : 0], options, answer: options.findIndex(o => o.product === selected[1]), relation: selected.join(':'), visualOnly: true, prompt: p('בחר את האיור המתאים.', 'Выбери подходящий рисунок.') };
    } else {
      const items = ['apple','carrot','pear','banana','flower','tree','house','boat','plane','car','fish','cat','rabbit','butterfly','star','moon','sun','ball','book','key','cup','umbrella','clock','kite'];
      const correct = pick(items, rng), options = shuffle([correct, ...shuffle(items.filter(v => v !== correct), rng).slice(0, 3)], rng).map(art => ({ art, silhouette: true }));
      q = { family: 'shadow', picture: correct, options, answer: options.findIndex(o => o.art === correct), visualOnly: true, prompt: p('מצא את הצל של האיור.', 'Найди тень рисунка.') };
    }
    const right = q.options[q.answer].art;
    q.hints = [p('הסתכל בפרטים של האיורים והשווה ביניהם.', 'Рассмотри детали рисунков и сравни их.'), p('חשוב איזה קשר יש בין האיור הגדול לאפשרויות.', 'Подумай, что связывает большой рисунок с вариантами.'), p(`האיור המתאים הוא: ${LearningArt.label(right).he}.`, `Подходящий рисунок: ${LearningArt.label(right).ru}.`)];
    return q;
  }
  const words = [
    ['apple','תפוח'],['fish','דג'],['house','בית'],['tree','עץ'],['flower','פרח'],['sun','שמש'],['moon','ירח'],['star','כוכב'],['cat','חתול'],['dog','כלב'],['rabbit','ארנב'],['cow','פרה'],['sheep','כבש'],['duck','ברווז'],['hen','תרנגולת'],['bee','דבורה'],['butterfly','פרפר'],['lion','אריה'],['elephant','פיל'],['giraffe','ג׳ירפה'],['camel','גמל'],['fox','שועל'],['owl','ינשוף'],['snake','נחש'],['car','מכונית'],['bus','אוטובוס'],['train','רכבת'],['boat','סירה'],['plane','מטוס'],['bicycle','אופניים'],['ball','כדור'],['book','ספר'],['key','מפתח'],['cup','כוס'],['umbrella','מטרייה'],['clock','שעון'],['kite','עפיפון'],['carrot','גזר'],['pear','אגס'],['banana','בננה'],['egg','ביצה'],['milk','חלב'],['honey','דבש'],['wool','צמר']
  ];
  const letters = Array.from('אבגדהוזחטיכלמנסעפצקרשת');
  function createHebrew(stage, serial, rng) {
    const pool = words.filter(([, word]) => !word.includes('׳') && (stage < 15 ? word.length <= 4 : stage < 50 ? word.length <= 5 : true));
    const [picture, word] = pick(pool, rng), available = letters.slice(0, Math.min(22, 4 + Math.floor(stage / 3)));
    let q;
    const mode = stage <= 10 ? serial % 2 : stage <= 35 ? serial % 4 : serial % 5;
    if (mode === 0) {
      const letter = pick(available, rng), options = shuffle([letter, ...shuffle(letters.filter(v => v !== letter), rng).slice(0, 3)], rng);
      q = { variant: 'letter', letter, options: options.map(he => ({ he })), answer: options.indexOf(letter), spoken: letter, prompt: p('מצא את אותה האות.', 'Найди такую же букву.') };
    } else if (mode === 1) {
      const first = Array.from(word)[0], options = shuffle([first, ...shuffle(letters.filter(v => v !== first), rng).slice(0, 3)], rng);
      q = { variant: 'initial', picture, word, options: options.map(he => ({ he })), answer: options.indexOf(first), spoken: word, prompt: p('באיזו אות מתחילה המילה?', 'С какой буквы начинается слово?') };
    } else if (mode === 2) {
      const position = Math.floor(rng() * word.length), correct = word[position], options = shuffle([correct, ...shuffle([...letters, 'ך','ם','ן','ף','ץ'].filter(v => v !== correct), rng).slice(0, 3)], rng);
      q = { variant: 'missing', picture, word, masked: Array.from(word).map((v, i) => i === position ? '□' : v).join(''), position, options: options.map(he => ({ he })), answer: options.indexOf(correct), spoken: word, prompt: p('איזו אות חסרה במילה?', 'Какая буква пропущена?') };
    } else if (mode === 3) {
      const options = shuffle([[picture, word], ...shuffle(pool.filter(([, w]) => w !== word), rng).slice(0, 3)], rng).map(([art, he]) => ({ art, he }));
      q = { variant: 'word', picture, word, options, answer: options.findIndex(o => o.he === word), spoken: word, prompt: p('איזו מילה מתאימה לאיור?', 'Какое слово подходит к рисунку?') };
    } else {
      q = { variant: 'build', picture, word, tiles: shuffle([...Array.from(word), ...shuffle(letters.filter(v => !word.includes(v)), rng).slice(0, 2)], rng), chosen: [], answer: word, spoken: word, prompt: p('הרכב את המילה. יש גם שתי אותיות שלא צריך. אפשר לשמוע את המילה.', 'Составь слово. Две буквы лишние. Можно послушать слово.') };
    }
    q.hints = [p('אפשר ללחוץ על הרמקול ולשמוע.', 'Нажми на динамик и послушай.'), p('בעברית קוראים את המילה מימין לשמאל.', 'На иврите слово читают справа налево.'), p(q.variant === 'letter' ? `האות היא ${q.letter}.` : `המילה היא ${word}.`, q.variant === 'letter' ? `Это буква ${q.letter}.` : `Слово: ${word}.`)];
    return q;
  }
  function mazeNeighbors(i, n) { return [i-n, i+n, i%n ? i-1 : -1, i%n < n-1 ? i+1 : -1].filter(v => v >= 0 && v < n*n); }
  function createMaze(stage, rng) {
    const n = Math.min(10, 4 + Math.floor((stage - 1) / 15)), passages = Array.from({ length: n*n }, () => []), stack = [0], seen = new Set(stack);
    while (stack.length) {
      const current = stack.at(-1), choices = mazeNeighbors(current, n).filter(v => !seen.has(v));
      if (!choices.length) stack.pop();
      else { const next = pick(choices, rng); passages[current].push(next); passages[next].push(current); seen.add(next); stack.push(next); }
    }
    const start = n*(n-1), goal = n-1;
    return { n, passages, start, goal, position: start, path: [start], answer: goal,
      prompt: p('מצא דרך אל הכוכב. זוז עם החצים; אי אפשר לעבור דרך קיר.', 'Найди дорогу к звезде. Двигайся стрелками; через стену пройти нельзя.'),
      hints: [p('בחר מסדרון פתוח. אפשר לחזור אחורה כשמגיעים למבוי סתום.', 'Выбери открытый проход. Из тупика можно вернуться назад.'), p('הצעד הבא בדרך אל הכוכב מסומן בלוח.', 'Следующий шаг к звезде выделен на поле.'), p('המסלול המודגש מראה דרך מהנקודה שלך אל הכוכב.', 'Выделенный маршрут ведёт от твоей точки к звезде.')] };
  }
  function mazePath(q, from = q.position) {
    const queue = [from], previous = new Map([[from, null]]);
    for (let head = 0; head < queue.length; head++) {
      const at = queue[head]; if (at === q.goal) break;
      for (const next of q.passages[at]) if (!previous.has(next)) { previous.set(next, at); queue.push(next); }
    }
    const path = []; for (let at = q.goal; at != null; at = previous.get(at)) path.push(at);
    return path.reverse();
  }
  const courseCache = {}, courseKeys = {};
  function contentKey(game, q) {
    if (game === 'matches') return JSON.stringify([q.initial, q.operator]);
    if (game === 'maze') return JSON.stringify(q.passages.map(row => row.slice().sort((a,b)=>a-b)));
    if (game === 'trivia') return JSON.stringify([q.family, q.picture, q.options.map(o=>o.art).sort()]);
    if (game === 'hebrew') return JSON.stringify([q.variant, q.picture, q.word, q.letter, q.masked, q.tiles?.slice().sort(), q.options?.map(o=>o.he).sort()]);
    return JSON.stringify([q.variant, paperKey(q.paper), q.target&&paperKey(q.target), q.point, q.options.map(o=>o.paper?paperKey(o.paper):o.holes).sort()]);
  }
  function create(game, stage, index) {
    if (!catalog[game] || !Number.isInteger(stage) || stage < 1 || stage > 100 || !Number.isInteger(index) || index < 0 || index >= 10) throw new Error('Invalid course, stage or exercise');
    const serial = (stage-1)*10+index, deck = courseCache[game] ||= [], seen = courseKeys[game] ||= new Set();
    for (let cursor=deck.length;cursor<=serial;cursor++) {
      const level=Math.floor(cursor/10)+1, seed=71237+cursor*137+Object.keys(catalog).indexOf(game)*1000003;
      let generated, key, attempts=0;
      do {
        const rng=random(seed+attempts*4201);
        generated=game==='matches'?createMatches(cursor):game==='origami'?createOrigami(level,cursor,rng):game==='trivia'?createTrivia(cursor,rng):game==='hebrew'?createHebrew(level,cursor,rng):createMaze(level,rng);
        key=contentKey(game,generated);
        if(++attempts>500)throw new Error(`Could not create a distinct exercise: ${game}:${cursor}`);
      } while(seen.has(key));
      seen.add(key);deck.push(generated);
    }
    const generated=JSON.parse(JSON.stringify(deck[serial]));
    return { id: `${game}:${stage}:${index}:1`, game, stage, index, ...generated, selected: null, hint: 0, attempts: 0, finished: false, correct: false, notice: null };
  }
  function check(q) {
    if (q.game === 'matches') {
      const digits = Array.from({ length: q.width * 3 }, (_, i) => SEG.findIndex(segments => segments.every((v, j) => v === q.board[i*7+j])));
      return q.moves === 1 && q.board.filter((v, i) => v !== q.initial[i]).length === 2 && readable(digits, q.width) && equation(digitsToNumbers(digits, q.width), q.operator);
    }
    if (q.game === 'maze') return q.position === q.goal;
    if (q.game === 'hebrew' && q.variant === 'build') return q.chosen.map(i => q.tiles[i]).join('') === q.word;
    return q.selected === q.answer;
  }
  function act(q, action, value) {
    if (q.finished) return false;
    const i = Number(value);
    if (action === 'option' && q.options?.[i]) { q.selected = i; return true; }
    if (q.game === 'matches' && action === 'match' && Number.isInteger(i) && i >= 0 && i < q.board.length && !q.moves) {
      if (q.board[i]) q.source = q.source === i ? null : i;
      else if (q.source != null) { q.board[q.source] = 0; q.board[i] = 1; q.moves = 1; q.source = null; }
      return true;
    }
    if (q.game === 'maze' && action === 'move') {
      const next = q.position + ({ up:-q.n, down:q.n, left:-1, right:1 }[value] || 0);
      if (!q.passages[q.position].includes(next)) return false;
      q.position = next; q.path.push(next); return true;
    }
    if (q.game === 'hebrew' && q.variant === 'build') {
      if (action === 'letter' && q.tiles[i] != null && !q.chosen.includes(i)) { q.chosen.push(i); return true; }
      if (action === 'remove-letter' && q.chosen[i] != null) { q.chosen.splice(i, 1); return true; }
    }
    if (action === 'undo' || action === 'reset') {
      if (q.game === 'matches') { q.board = q.initial.slice(); q.moves = 0; q.source = null; }
      else if (q.game === 'maze') { if (action === 'reset') q.path = [q.start]; else if (q.path.length > 1) q.path.pop(); q.position = q.path.at(-1); }
      else if (q.game === 'hebrew' && q.variant === 'build') { if (action === 'reset') q.chosen = []; else q.chosen.pop(); }
      else q.selected = null;
      return true;
    }
    return false;
  }
  return { catalog, create, check, act, contentKey, random, SEG, matchBank, foldPaper, area, pointIn, punch, paperKey, mazePath, habitats, coverings, routes, products, words };
})();
