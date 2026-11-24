/* Curated, manual-paced atlas. Uses the host app's language and speech helpers. */
window.AtlasQuiz = (() => {
  'use strict';
  const KEY = 'misha-curiosity-atlas-v1';
  const bank = window.AtlasQuestions;
  const questions = new Map(bank.questions.map(q => [q.id, q]));
  const media = new Map(window.AtlasMedia.map(m => [m.id, m]));
  const pair = (he, ru) => ({ he, ru });
  const fresh = () => ({ version: 1, bankVersion: bank.version, view: 'menu', activeRound: null, runs: {}, progress: {}, learned: [], accessible: false });
  const validSelection = value => Number.isInteger(value) && value >= 0 && value < 3;
  const count = (value, max = Number.MAX_SAFE_INTEGER) => Number.isInteger(value) && value > 0 ? Math.min(value, max) : 0;
  function restoreQuestionState(source, ids, answers) {
    const result = {};
    for (const id of ids) {
      const q = questions.get(id), value = source?.[id];
      if (!q?.hints || !value || typeof value !== 'object') continue;
      const original = answers.find(a => a.id === id), mayPractice = original && !original.correct;
      const attempts = mayPractice ? count(value.practiceAttempts) : 0;
      result[id] = {
        hint: count(value.hint, q.hints.length),
        practiceAttempts: attempts,
        practicing: !!mayPractice && value.practicing === true,
        practiceSelected: mayPractice && validSelection(value.practiceSelected) ? value.practiceSelected : null,
        practiceResult: attempts && validSelection(value.practiceResult?.selected)
          ? { selected: value.practiceResult.selected, correct: value.practiceResult.selected === q.answer } : null
      };
    }
    return result;
  }
  function questionSupport(s, q) {
    if (!q.hints) return null;
    s.questionState ||= {};
    return s.questionState[q.id] ||= { hint: 0, practiceAttempts: 0, practicing: false, practiceSelected: null, practiceResult: null };
  }
  const hintText = (q, support) => (saved.accessible && q.accessibleHints ? q.accessibleHints : q.hints)?.[support.hint - 1];
  let saved = fresh(), narrated = '', narrationFocus = '', storageOK = true;
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (value?.version === 1 && value.bankVersion === bank.version) {
      saved.accessible = value.accessible === true;
      saved.learned = Array.isArray(value.learned) ? value.learned.filter(id => questions.has(id)) : [];
      for (const round of bank.rounds) {
        const r = value.runs?.[round.id];
        // A run must be a contiguous prefix of THIS bank, never a legacy trivia session.
        if (r && Array.isArray(r.answers) && r.answers.length <= 8 && Number.isInteger(r.index) && r.index >= 0 && r.index < 8 && r.answers.length >= r.index && r.answers.length <= r.index + 1 && r.answers.every((a, i) => a.id === round.questionIds[i] && Number.isInteger(a.selected) && a.selected >= 0 && a.selected < 3)) {
          const answers = r.answers.map(a => ({ id: a.id, selected: a.selected, correct: a.selected === questions.get(a.id).answer, hints: count(a.hints, questions.get(a.id).hints?.length || 0), attempts: 1, ruShown: a.ruShown === true, readingTracked: a.readingTracked === true, rewardTaskId:typeof a.rewardTaskId==='string'?a.rewardTaskId:undefined }));
          saved.runs[round.id] = { index: r.index, selected: validSelection(r.selected) ? r.selected : null, answers, complete: r.complete === true && r.answers.length === 8,
            questionState: restoreQuestionState(r.questionState, round.questionIds, answers),
            started: typeof r.started === 'number' ? r.started : Date.now(),
            reading: Object.fromEntries(round.questionIds.filter(id=>r.reading?.[id] && typeof r.reading[id]==='object').map(id=>[id,{ruShown:r.reading[id].ruShown===true,readingTracked:r.reading[id].readingTracked===true,readingMiss:r.reading[id].readingMiss===true}])) };
        }
        const p = value.progress?.[round.id];
        if (p && Number.isInteger(p.best) && p.best >= 0 && p.best <= 8) saved.progress[round.id] = { best: p.best, attempts: Math.max(1, Number(p.attempts) || 1) };
      }
      if (saved.runs[value.activeRound]) saved.activeRound = Number(value.activeRound);
      saved.view = value.view === 'task' && saved.activeRound ? 'task' : 'menu';
    }
  } catch { storageOK = false; }
  const state = () => saved;
  const round = () => PlaySession.isAtlas()?PlaySession.atlasRound():bank.rounds.find(r => r.id === saved.activeRound);
  const run = () => PlaySession.isAtlas()?PlaySession.atlasRun():saved.runs[saved.activeRound];
  const current = () => questions.get(round()?.questionIds[run()?.index]);
  function readingContext() {
    const s=run(),q=current();
    if(!s||!q||s.complete||(!PlaySession.isAtlas()&&saved.view!=='task'))return null;
    s.reading ||= {};
    return s.reading[q.id] ||= {};
  }
  const completedCount = () => Object.keys(saved.progress).length;
  const score = r => r.answers.filter(a => a.correct).length;
  function persist() {
    saveProgress();
    try { localStorage.setItem(KEY, JSON.stringify(saved)); storageOK = true; }
    catch { storageOK = false; }
  }
  function redraw(focus) {
    window.render();
    if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
  }
  function open() {
    pause(); clearTimeout(autoNextTimer); window.speechSynthesis?.cancel();
    screen = 'atlas'; feedback = null; narrated = '';
    try { sessionStorage.setItem('misha-atlas-entry', '1'); } catch (_) {}
    history.replaceState(null, '', location.pathname + location.search + '#atlas');
    redraw(); window.scrollTo(0, 0);
  }
  function openMenu(){saved.view='menu';persist();open();}
  function resume(){const id=saved.runs[saved.activeRound]&&!saved.runs[saved.activeRound].complete?saved.activeRound:Object.keys(saved.runs).map(Number).sort((a,b)=>b-a).find(id=>!saved.runs[id].complete);if(id){saved.activeRound=id;saved.view='task';persist();}open();}
  function start(id) {
    if (!bank.rounds.some(r => r.id === id)) return;
    saved.activeRound = id;
    saved.runs[id] = { index: 0, selected: null, answers: [], complete: false, started: Date.now(), reading: {} };
    saved.view = 'task'; narrated = ''; persist(); redraw('#atlas-question'); window.scrollTo(0, 0);
  }
  function imageRecord(q) { return media.get(q.media?.startsWith('map-') ? q.media + '-' + (data.lang === 'ru' ? 'ru' : 'he') : q.media); }
  function button(action, label, value, classes = '', disabled = false) {
    return `<button class="atlas-button ${classes}" data-atlas-action="${action}" ${value != null ? `data-atlas-value="${value}"` : ''} ${disabled ? 'disabled' : ''}><span>${ui(label)}</span></button>`;
  }
  function top() {
    return `<div class="atlas-top"><a class="atlas-wordmark" href="#atlas" data-atlas-action="menu"><span aria-hidden="true">✷</span><span>${ui(bank.title)}</span></a><div class="atlas-top-actions">${button('hear', pair('הקראה', 'Слушать'), null, 'atlas-small', !speechSupported)}${button('menu', pair('לסבבים', 'К раундам'), null, 'atlas-small')}</div></div>`;
  }
  function menu() {
    return `<section class="atlas-menu"><div class="atlas-intro"><span class="atlas-kicker">${ui(pair('המסע של מישה', 'Путешествие Миши'))}</span><h1 tabindex="-1">${ui(bank.title)}</h1><div class="atlas-prose">${ui(pair('גלויה, שאלה ותגלית קטנה. יוצאים להכיר את העולם?', 'Открытка, вопрос и маленькое открытие. Отправимся узнавать мир?'))}</div><div class="atlas-menu-meta">${ui(pair('10 סבבים · 8 שאלות בכל סבב · בקצב שלך', '10 раундов · по 8 вопросов · в твоём темпе'))}</div></div><div class="atlas-rounds">${bank.rounds.map(r => { const s = saved.runs[r.id], p = saved.progress[r.id]; return `<article class="atlas-round-card"><span class="atlas-round-number" aria-hidden="true">${String(r.id).padStart(2, '0')}</span><div><span class="atlas-kicker">${ui(pair(`סבב ${r.id}`, `Раунд ${r.id}`))}</span><h2>${ui(r.title)}</h2><div class="atlas-prose">${ui(pair(r.id <= 3 ? 'מזהים ומגלים' : r.id <= 7 ? 'מבחינים ומחברים' : 'קוראים מפה ומשווים', r.id <= 3 ? 'Узнаём и открываем' : r.id <= 7 ? 'Различаем и связываем' : 'Читаем карты и сравниваем'))}</div>${p ? `<div class="atlas-prose atlas-stamp">✓ ${ui(pair(`שיא: ${p.best} מתוך 8`, `Лучший результат: ${p.best} из 8`))}</div>` : ''}</div><div class="atlas-round-actions">${s && !s.complete ? button('resume', pair(`המשך · ${s.index + 1} מתוך 8`, `Продолжить · ${s.index + 1} из 8`), r.id, 'atlas-primary') : button('start', p ? pair('לשחק שוב', 'Ещё раз') : pair('יוצאים לדרך', 'В путь'), r.id, 'atlas-primary')}${s?.complete ? button('results', pair('לתוצאה', 'Результат'), r.id, 'atlas-small') : ''}</div></article>`; }).join('')}</div><div class="atlas-prose atlas-menu-foot">${ui(pair(`${completedCount()} מתוך 10 סבבים הושלמו`, `Завершено ${completedCount()} из 10 раундов`))}</div></section>`;
  }
  function questionView() {
    const r = round(), s = run(), q = current(), result = s.answers[s.index];
    const support = questionSupport(s, q), practicing = !!support?.practicing;
    const checked = !!result && !practicing, shownResult = support?.practiceResult || result;
    const selectedIndex = practicing ? support.practiceSelected : checked ? shownResult.selected : s.selected;
    const record = imageRecord(q), compactMap = media.get(q.media + '-mobile-' + (data.lang === 'ru' ? 'ru' : 'he')), noImage = saved.accessible && q.accessiblePrompt;
    const prompt = noImage ? q.accessiblePrompt : q.prompt;
    return `<div class="atlas-run"><div class="atlas-run-meta"><span>${ui(pair(`סבב ${r.id} · ${r.title.he}`, `Раунд ${r.id} · ${r.title.ru}`))}</span><span class="atlas-counter">${ui(pair(`${s.index + 1} מתוך 8`, `${s.index + 1} из 8`))}</span></div><div class="atlas-progress" aria-hidden="true">${r.questionIds.map((_, i) => `<span class="${i < s.index ? 'done' : i === s.index ? 'current' : ''}"></span>`).join('')}</div>
      <section class="atlas-question-card ${record && !noImage ? 'atlas-visual' : 'atlas-text'}">
        <div class="atlas-question-heading"><span class="atlas-kicker">${ui(bank.categories[q.category])}</span><h1 id="atlas-question" tabindex="-1">${bi(prompt)}</h1>${window.ReadingSupport?.controls()||''}</div>
        ${record && !noImage ? `<figure class="atlas-postcard ${q.media.startsWith('flag-') ? 'atlas-flag' : q.media.startsWith('map-') ? 'atlas-map' : ''}"><picture>${compactMap ? `<source media="(max-width: 680px)" srcset="${esc(compactMap.path)}">` : ''}<img src="${esc(record.path)}" alt="${esc(text(q.alt))}" width="800" height="490" decoding="async"></picture><span class="atlas-postcard-corner" aria-hidden="true">✷</span></figure>` : ''}
        ${support?.hint ? `<div class="atlas-hint" id="atlas-hint" tabindex="-1" role="status"><strong>${ui(pair(`רמז ${support.hint} מתוך ${q.hints.length}`, `Подсказка ${support.hint} из ${q.hints.length}`))}</strong><div>${bi(hintText(q, support))}</div></div>` : ''}
        ${practicing || support?.practiceAttempts ? `<div class="atlas-practice-note">${bi(pair('כבר גילינו את התשובה. עכשיו אפשר לתרגל. הציון נשמר לפי הבחירה הראשונה.', 'Ответ уже открыт. Теперь можно потренироваться. Балл сохраняется по первому ответу.'))}</div>` : ''}
        <div class="atlas-options" role="group" aria-labelledby="atlas-question">${q.options.map((option, i) => {
          const selected = selectedIndex === i, correct = checked && i === q.answer;
          return `<button class="atlas-button atlas-option ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${checked && selected && !correct ? 'incorrect' : ''}" data-atlas-action="select" data-atlas-value="${i}" aria-pressed="${selected}" ${checked ? 'disabled' : ''}><span class="atlas-choice-mark" aria-hidden="true">${correct ? '✓' : checked && selected ? '×' : selected ? '●' : String(i + 1)}</span><span class="atlas-option-label">${bi(option)}${checked && (correct || selected) ? `<small>${ui(correct ? pair('התשובה הנכונה', 'Правильный ответ') : pair('הבחירה שלך', 'Твой ответ'))}</small>` : ''}</span></button>`;
        }).join('')}</div>
        ${checked ? `<div class="atlas-feedback" id="atlas-feedback" tabindex="-1" role="status"><span class="atlas-feedback-icon" aria-hidden="true">${shownResult.correct ? '✓' : '↗'}</span><div><strong>${bi(support?.practiceResult ? shownResult.correct ? pair('נכון, תרגול יפה!', 'Верно, хорошая тренировка!') : pair('אפשר להמשיך לתרגל.', 'Можно ещё потренироваться.') : result.correct ? pair('נכון! גילוי יפה.', 'Верно! Отличное открытие.') : pair('גילינו משהו חדש.', 'Мы узнали кое-что новое.'))}</strong><div class="atlas-prose atlas-correct-answer">${bi(pair(`התשובה הנכונה: ${q.options[q.answer].he}`, `Правильный ответ: ${q.options[q.answer].ru}`))}</div><div class="atlas-prose atlas-fact">${bi(q.fact)}</div></div></div>` : ''}
        <div class="atlas-question-actions">
          ${!result || practicing ? button('check', pair('בדיקה', 'Проверить'), null, 'atlas-primary', selectedIndex == null) : ''}
          ${support && (!result || practicing) ? button('hint', pair(`רמז (${support.hint}/${q.hints.length})`, `Подсказка (${support.hint}/${q.hints.length})`), null, 'atlas-hint-button', support.hint >= q.hints.length) : ''}
          ${checked && support && !result.correct && !support.practiceResult?.correct ? button('practice', pair('לנסות שוב לתרגול', 'Повторить для тренировки'), null, 'atlas-practice-button') : ''}
          ${result ? button('next', s.index === r.questionIds.length - 1 ? pair('לסיכום הסבב', 'Итоги раунда') : pair('הבא', 'Дальше'), null, practicing ? '' : 'atlas-primary') : ''}
          ${q.media ? button('accessible', noImage ? pair('בחזרה לתמונה', 'Вернуть изображение') : pair('שאלה ללא תמונה', 'Вопрос без изображения'), null, 'atlas-link') : ''}
        </div>
      </section>${checked ? `<details class="atlas-question-sources"><summary>${ui(pair('מקורות לשאלה', 'Источники вопроса'))}</summary><ul>${q.sources.map(url => `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(new URL(url).hostname)}</a></li>`).join('')}</ul></details>` : ''}</div>`;
  }
  function resultSnapshot(q, answer, s = run(), level = q.round, index = s.answers.findIndex(a => a.id === q.id)) {
    const support = questionSupport(s, q), practiceAttempts = support?.practiceAttempts || 0;
    return SessionReview.snapshot({...q, level, index}, {
      correct: answer.correct, attempts: 1 + practiceAttempts,
      hints: Math.max(answer.hints || 0, support?.hint || 0),
      practiced: practiceAttempts > 0, practiceSolved: support?.practiceResult?.correct === true,
      firstSelected: answer.selected, rewardTaskId: answer.rewardTaskId,
      ruShown: s.reading?.[q.id]?.ruShown ?? answer.ruShown ?? false,
      readingTracked: s.reading?.[q.id]?.readingTracked ?? answer.readingTracked ?? false
    }, q.category);
  }
  function reportResults() { return run().answers.map((a, index) => resultSnapshot(questions.get(a.id), a, run(), round().id, index)); }
  function summary() {
    const r = round(), s = run();
    return `<section class="atlas-summary atlas-question-card"><div class="atlas-finish-stamp" aria-hidden="true">✷</div><span class="atlas-kicker">${ui(pair(`סבב ${r.id} הושלם`, `Раунд ${r.id} завершён`))}</span><h1 tabindex="-1" id="atlas-summary-title">${ui(pair('עוד עמוד באטלס שלך!', 'Ещё одна страница твоего атласа!'))}</h1><div class="atlas-score" dir="ltr">${score(s)}<small>/8</small></div><div class="atlas-prose">${ui(pair('תשובות נכונות', 'Правильных ответов'))}</div><h2>${ui(pair('שתי תגליות לקחת לדרך', 'Два открытия на память'))}</h2><ol class="atlas-remember">${r.remember.map(id => `<li><div>${bi(questions.get(id).fact)}</div></li>`).join('')}</ol><div class="atlas-summary-actions">${SessionReview.jumpButton()}${r.id < 10 ? button('start', pair('לסבב הבא', 'Следующий раунд'), r.id + 1, 'atlas-primary') : button('menu', pair('לאטלס שלי', 'К моему атласу'), null, 'atlas-primary')}${button('start', pair('לשחק שוב', 'Ещё раз'), r.id)}${button('menu', pair('לבחירת סבב', 'Выбрать раунд'))}</div></section>${SessionReview.render(reportResults(),bank.title)}`;
  }
  function credits() {
    return `<details class="atlas-credits"><summary>${ui(pair('תמונות, מפות וקרדיטים', 'Изображения, карты и авторы'))}</summary><div class="atlas-prose">${ui(pair('התצלומים והדגלים נשמרו מ־Wikimedia Commons; המפות מבוססות על Natural Earth.', 'Фотографии и флаги сохранены с Wikimedia Commons; карты основаны на Natural Earth.'))}</div><ul>${window.AtlasMedia.map(m => `<li><a href="${esc(m.source)}" target="_blank" rel="noopener noreferrer">${esc(m.id)}</a> — <span dir="auto">${esc(m.creator)}</span> · ${m.licenseUrl ? `<a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a>` : esc(m.license)}<small dir="auto">${esc(m.modifications)}</small></li>`).join('')}</ul><div class="atlas-prose">${ui(pair('מסגרות ותחושת לחיצה הותאמו מ־PaperCSS ברישיון ISC.', 'Рамки и нажатия адаптированы из PaperCSS по лицензии ISC.'))} <a href="vendor/papercss/LICENSE.md">PaperCSS © Rhyne Vlaservich</a></div></details>`;
  }
  function render() {
    if (PlaySession.isAtlas()) return `<div class="atlas-page">${questionView()}</div>`;
    return `<div class="atlas-page">${top()}${!storageOK ? `<div class="atlas-prose atlas-save-warning" role="alert">${ui(T.saveError)}</div>` : ''}${saved.view === 'menu' || !run() ? menu() : run().complete ? summary() : questionView()}${credits()}</div>`;
  }
  function handleClick(event) {
    const b = event.target.closest('[data-atlas-action]');
    if (!b) return false;
    event.preventDefault(); if (b.disabled) return true;
    const action = b.dataset.atlasAction, n = Number(b.dataset.atlasValue);
    if (action === 'menu') { saved.view = 'menu'; persist(); narrated = ''; redraw('.atlas-intro h1'); window.scrollTo(0, 0); return true; }
    if (action === 'start') { start(n); return true; }
    if (action === 'resume' || action === 'results') {
      if (saved.runs[n]) { saved.activeRound = n; saved.view = 'task'; narrated = ''; persist(); redraw(run().complete ? '#atlas-summary-title' : '#atlas-question'); window.scrollTo(0, 0); } return true;
    }
    if (action === 'hear') { data.readAloud = true; saveProgress(); narrated = ''; narrationFocus = ''; redraw(); return true; }
    const s = run(), q = current(); if (!s || !q || s.complete) return true;
    if (action === 'accessible') { saved.accessible = !saved.accessible; narrated = ''; narrationFocus = ''; persist(); redraw('#atlas-question'); return true; }
    const support = questionSupport(s, q), result = s.answers[s.index];
    if (action === 'hint' && support && (!result || support.practicing) && support.hint < q.hints.length) {
      support.hint++; narrationFocus = 'hint'; persist(); redraw('#atlas-hint');
      document.querySelector('#atlas-hint')?.scrollIntoView({block:'nearest'}); window.ExerciseExperience?.onHint(); return true;
    }
    if (action === 'practice' && support && result && !result.correct && !support.practicing) {
      support.practicing = true; support.practiceSelected = null; support.practiceResult = null;
      narrated = ''; narrationFocus = ''; persist(); redraw('[data-atlas-action="select"]');
      document.querySelector('.atlas-options')?.scrollIntoView({block:'nearest'}); return true;
    }
    if (action === 'select' && validSelection(n) && (!result || support?.practicing)) {
      if (support?.practicing) support.practiceSelected = n; else s.selected = n;
      persist(); redraw(`[data-atlas-action="select"][data-atlas-value="${n}"]`);
    }
    if (action === 'check' && support?.practicing && support.practiceSelected != null) {
      support.practiceAttempts++;
      window.ReadingSupport?.attempt(support.practiceSelected === q.answer);
      support.practiceResult = {selected: support.practiceSelected, correct: support.practiceSelected === q.answer};
      support.practicing = false; narrated = ''; narrationFocus = ''; persist(); redraw('#atlas-feedback');
      document.querySelector('#atlas-feedback')?.scrollIntoView({block:'nearest'});
      window.ExerciseExperience?.onAnswer(support.practiceResult.correct,{xp:0,streak:0});
    } else if (action === 'check' && s.selected != null && !result) {
      const correct = s.selected === q.answer;
      window.ReadingSupport?.attempt(correct);
      const reading=readingContext()||{};
      const answer={id:q.id,selected:s.selected,correct,hints:support?.hint||0,attempts:1,ruShown:reading.ruShown===true,readingTracked:reading.readingTracked===true};
      const rewardResult=SessionReview.snapshot(q,answer,q.category);
      window.Rewards?.recordTask(data,rewardResult,{id:`atlas:${s.started||(s.started=Date.now())}:${q.id}`});
      answer.rewardTaskId=rewardResult.rewardTaskId;
      s.answers.push(answer);
      let earned=0;
      if (correct && !saved.learned.includes(q.id)) {
        earned=24;
        saved.learned.push(q.id); data.xp = (data.xp || 0) + 24;
        // The independent atlas ledger prevents duplicate XP after refresh or replay.
        persist(); saveProgress();
      }
      narrated = ''; narrationFocus = ''; persist(); redraw('#atlas-feedback');
      document.querySelector('#atlas-feedback')?.scrollIntoView({ block: 'nearest' });
      window.ExerciseExperience?.onAnswer(correct,{xp:earned,streak:data.currentStreak});
    }
    if (action === 'next' && s.answers[s.index]) {
      if(PlaySession.isAtlas()){PlaySession.next();return true;}
      if (s.index === 7) {
        s.complete = true; SessionReview.archive(`atlas:${saved.activeRound}:${s.started || (s.started=Date.now())}`,bank.title,reportResults(),saved.activeRound); const old = saved.progress[saved.activeRound];
        saved.progress[saved.activeRound] = { best: Math.max(old?.best || 0, score(s)), attempts: (old?.attempts || 0) + 1 };
      } else { s.index++; s.selected = null; }
      persist(); redraw(s.complete ? '#atlas-summary-title' : '#atlas-question'); window.scrollTo(0, 0);
    }
    return true;
  }
  function afterRender() {
    if ((screen !== 'atlas' && !PlaySession.isAtlas()) || !data.readAloud) { if (screen === 'atlas') narrated = ''; return; }
    const s = run(), q = current(), r = round();
    const support = s && q ? questionSupport(s, q) : null;
    const token = [saved.view, r?.id, q?.id, s?.index, s?.answers.length, s?.complete, saved.accessible, data.lang, support?.hint, support?.practicing, support?.practiceAttempts, s?.reading?.[q?.id]?.ruShown].join(':');
    if (token === narrated) return; narrated = token;
    if (!PlaySession.isAtlas() && (saved.view === 'menu' || !s)) speakParts([bank.title, pair('בחר סבב. שמונה שאלות בכל סבב.', 'Выбери раунд. В каждом восемь вопросов.')]);
    else if (s.complete) speakParts([pair(`הסבב הסתיים. ${score(s)} תשובות נכונות מתוך שמונה.`, `Раунд завершён. Правильных ответов: ${score(s)} из восьми.`), ...r.remember.map(id => questions.get(id).fact)]);
    else if (narrationFocus === 'hint' && support?.hint) speakParts([pair(`רמז ${support.hint}`, `Подсказка ${support.hint}`), hintText(q, support)]);
    else if (s.answers[s.index] && !support?.practicing) speakParts([pair(`התשובה הנכונה היא ${q.options[q.answer].he}`, `Правильный ответ: ${q.options[q.answer].ru}`), q.fact]);
    else speakParts([...(support?.practicing ? [pair('זהו תרגול נוסף אחרי שגילינו את התשובה. הציון הראשון נשמר.', 'Это тренировка после открытия ответа. Первый балл сохраняется.')] : []), saved.accessible && q.accessiblePrompt ? q.accessiblePrompt : q.prompt, ...q.options.map((o, i) => pair(`${i + 1}. ${o.he}`, `${i + 1}. ${o.ru}`)), ...(support?.hint ? [hintText(q, support)] : [])]);
    narrationFocus = '';
  }
  function reset() { saved = fresh(); narrated = ''; persist(); }
  return { open, openMenu, resume, start, render, handleClick, afterRender, state, current, completedCount, resultSnapshot, readingContext, persistReading:persist, reset, storageKey: KEY };
})();
