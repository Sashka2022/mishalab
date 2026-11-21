/* Curated, manual-paced atlas. Uses the host app's language and speech helpers. */
window.AtlasQuiz = (() => {
  'use strict';
  const KEY = 'misha-curiosity-atlas-v1';
  const bank = window.AtlasQuestions;
  const questions = new Map(bank.questions.map(q => [q.id, q]));
  const media = new Map(window.AtlasMedia.map(m => [m.id, m]));
  const pair = (he, ru) => ({ he, ru });
  const fresh = () => ({ version: 1, bankVersion: bank.version, view: 'menu', activeRound: null, runs: {}, progress: {}, learned: [], accessible: false });
  let saved = fresh(), narrated = '', storageOK = true;
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (value?.version === 1 && value.bankVersion === bank.version) {
      saved.accessible = value.accessible === true;
      saved.learned = Array.isArray(value.learned) ? value.learned.filter(id => questions.has(id)) : [];
      for (const round of bank.rounds) {
        const r = value.runs?.[round.id];
        // A run must be a contiguous prefix of THIS bank, never a legacy trivia session.
        if (r && Array.isArray(r.answers) && r.answers.length <= 8 && Number.isInteger(r.index) && r.index >= 0 && r.index < 8 && r.answers.length >= r.index && r.answers.length <= r.index + 1 && r.answers.every((a, i) => a.id === round.questionIds[i] && Number.isInteger(a.selected) && a.selected >= 0 && a.selected < 3)) {
          saved.runs[round.id] = { index: r.index, selected: Number.isInteger(r.selected) && r.selected >= 0 && r.selected < 3 ? r.selected : null, answers: r.answers.map(a => ({ id: a.id, selected: a.selected, correct: a.selected === questions.get(a.id).answer })), complete: r.complete === true && r.answers.length === 8 };
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
    history.replaceState(null, '', location.pathname + location.search + '#atlas');
    redraw(); window.scrollTo(0, 0);
  }
  function openMenu(){saved.view='menu';persist();open();}
  function resume(){const id=saved.runs[saved.activeRound]&&!saved.runs[saved.activeRound].complete?saved.activeRound:Object.keys(saved.runs).map(Number).sort((a,b)=>b-a).find(id=>!saved.runs[id].complete);if(id){saved.activeRound=id;saved.view='task';persist();}open();}
  function start(id) {
    if (!bank.rounds.some(r => r.id === id)) return;
    saved.activeRound = id;
    saved.runs[id] = { index: 0, selected: null, answers: [], complete: false };
    saved.view = 'task'; narrated = ''; persist(); redraw('#atlas-question'); window.scrollTo(0, 0);
  }
  function imageRecord(q) { return media.get(q.media?.startsWith('map-') ? q.media + '-' + (data.lang === 'ru' ? 'ru' : 'he') : q.media); }
  function button(action, label, value, classes = '', disabled = false) {
    return `<button class="atlas-button ${classes}" data-atlas-action="${action}" ${value != null ? `data-atlas-value="${value}"` : ''} ${disabled ? 'disabled' : ''}><span>${bi(label)}</span></button>`;
  }
  function top() {
    return `<div class="atlas-top"><a class="atlas-wordmark" href="#atlas" data-atlas-action="menu"><span aria-hidden="true">✷</span><span>${bi(bank.title)}</span></a><div class="atlas-top-actions">${button('hear', pair('הקראה', 'Слушать'), null, 'atlas-small', !speechSupported)}${button('menu', pair('לסבבים', 'К раундам'), null, 'atlas-small')}</div></div>`;
  }
  function menu() {
    return `<section class="atlas-menu"><div class="atlas-intro"><span class="atlas-kicker">${bi(pair('המסע של מישה', 'Путешествие Миши'))}</span><h1 tabindex="-1">${bi(bank.title)}</h1><div class="atlas-prose">${bi(pair('גלויה, שאלה ותגלית קטנה. יוצאים להכיר את העולם?', 'Открытка, вопрос и маленькое открытие. Отправимся узнавать мир?'))}</div><div class="atlas-menu-meta">${bi(pair('10 סבבים · 8 שאלות בכל סבב · בקצב שלך', '10 раундов · по 8 вопросов · в твоём темпе'))}</div></div><div class="atlas-rounds">${bank.rounds.map(r => { const s = saved.runs[r.id], p = saved.progress[r.id]; return `<article class="atlas-round-card"><span class="atlas-round-number" aria-hidden="true">${String(r.id).padStart(2, '0')}</span><div><span class="atlas-kicker">${bi(pair(`סבב ${r.id}`, `Раунд ${r.id}`))}</span><h2>${bi(r.title)}</h2><div class="atlas-prose">${bi(pair(r.id <= 3 ? 'מזהים ומגלים' : r.id <= 7 ? 'מבחינים ומחברים' : 'קוראים מפה ומשווים', r.id <= 3 ? 'Узнаём и открываем' : r.id <= 7 ? 'Различаем и связываем' : 'Читаем карты и сравниваем'))}</div>${p ? `<div class="atlas-prose atlas-stamp">✓ ${bi(pair(`שיא: ${p.best} מתוך 8`, `Лучший результат: ${p.best} из 8`))}</div>` : ''}</div><div class="atlas-round-actions">${s && !s.complete ? button('resume', pair(`המשך · ${s.index + 1} מתוך 8`, `Продолжить · ${s.index + 1} из 8`), r.id, 'atlas-primary') : button('start', p ? pair('לשחק שוב', 'Ещё раз') : pair('יוצאים לדרך', 'В путь'), r.id, 'atlas-primary')}${s?.complete ? button('results', pair('לתוצאה', 'Результат'), r.id, 'atlas-small') : ''}</div></article>`; }).join('')}</div><div class="atlas-prose atlas-menu-foot">${bi(pair(`${completedCount()} מתוך 10 סבבים הושלמו`, `Завершено ${completedCount()} из 10 раундов`))}</div></section>`;
  }
  function questionView() {
    const r = round(), s = run(), q = current(), result = s.answers[s.index], checked = !!result;
    const record = imageRecord(q), compactMap = media.get(q.media + '-mobile-' + (data.lang === 'ru' ? 'ru' : 'he')), noImage = saved.accessible && q.accessiblePrompt;
    const prompt = noImage ? q.accessiblePrompt : q.prompt;
    return `<div class="atlas-run"><div class="atlas-run-meta"><span>${bi(pair(`סבב ${r.id} · ${r.title.he}`, `Раунд ${r.id} · ${r.title.ru}`))}</span><span class="atlas-counter">${bi(pair(`${s.index + 1} מתוך 8`, `${s.index + 1} из 8`))}</span></div><div class="atlas-progress" aria-hidden="true">${r.questionIds.map((_, i) => `<span class="${i < s.index ? 'done' : i === s.index ? 'current' : ''}"></span>`).join('')}</div><section class="atlas-question-card ${record && !noImage ? 'atlas-visual' : 'atlas-text'}"><div class="atlas-question-heading"><span class="atlas-kicker">${bi(bank.categories[q.category])}</span><h1 id="atlas-question" tabindex="-1">${bi(prompt)}</h1></div>${record && !noImage ? `<figure class="atlas-postcard ${q.media.startsWith('flag-') ? 'atlas-flag' : q.media.startsWith('map-') ? 'atlas-map' : ''}"><picture>${compactMap ? `<source media="(max-width: 680px)" srcset="${esc(compactMap.path)}">` : ''}<img src="${esc(record.path)}" alt="${esc(text(q.alt))}" width="800" height="490" decoding="async"></picture><span class="atlas-postcard-corner" aria-hidden="true">✷</span></figure>` : ''}<div class="atlas-options" role="group" aria-labelledby="atlas-question">${q.options.map((option, i) => { const selected = (checked ? result.selected : s.selected) === i, correct = checked && i === q.answer; return `<button class="atlas-button atlas-option ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${checked && selected && !correct ? 'incorrect' : ''}" data-atlas-action="select" data-atlas-value="${i}" aria-pressed="${selected}" ${checked ? 'disabled' : ''}><span class="atlas-choice-mark" aria-hidden="true">${correct ? '✓' : checked && selected ? '×' : selected ? '●' : String(i + 1)}</span><span class="atlas-option-label">${bi(option)}${checked && (correct || selected) ? `<small>${bi(correct ? pair('התשובה הנכונה', 'Правильный ответ') : pair('הבחירה שלך', 'Твой ответ'))}</small>` : ''}</span></button>`; }).join('')}</div>${checked ? `<div class="atlas-feedback" id="atlas-feedback" tabindex="-1" role="status"><span class="atlas-feedback-icon" aria-hidden="true">${result.correct ? '✓' : '↗'}</span><div><strong>${bi(result.correct ? pair('נכון! גילוי יפה.', 'Верно! Отличное открытие.') : pair('גילינו משהו חדש.', 'Мы узнали кое-что новое.'))}</strong><div class="atlas-prose atlas-correct-answer">${bi(pair(`התשובה הנכונה: ${q.options[q.answer].he}`, `Правильный ответ: ${q.options[q.answer].ru}`))}</div><div class="atlas-prose atlas-fact">${bi(q.fact)}</div></div></div>` : ''}<div class="atlas-question-actions">${checked ? button('next', s.index === 7 ? pair('לסיכום הסבב', 'Итоги раунда') : pair('הבא', 'Дальше'), null, 'atlas-primary') : button('check', pair('בדיקה', 'Проверить'), null, 'atlas-primary', s.selected == null)}${q.media ? button('accessible', noImage ? pair('בחזרה לתמונה', 'Вернуть изображение') : pair('שאלה ללא תמונה', 'Вопрос без изображения'), null, 'atlas-link') : ''}</div></section>${checked ? `<details class="atlas-question-sources"><summary>${bi(pair('מקורות לשאלה', 'Источники вопроса'))}</summary><ul>${q.sources.map(url => `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(new URL(url).hostname)}</a></li>`).join('')}</ul></details>` : ''}</div>`;
  }
  function reportResults() { return run().answers.map(a=>{const q=questions.get(a.id);return SessionReview.snapshot({...q,level:round().id},{correct:a.correct,attempts:1,hints:0},q.category);}); }
  function summary() {
    const r = round(), s = run();
    return `<section class="atlas-summary atlas-question-card"><div class="atlas-finish-stamp" aria-hidden="true">✷</div><span class="atlas-kicker">${bi(pair(`סבב ${r.id} הושלם`, `Раунд ${r.id} завершён`))}</span><h1 tabindex="-1" id="atlas-summary-title">${bi(pair('עוד עמוד באטלס שלך!', 'Ещё одна страница твоего атласа!'))}</h1><div class="atlas-score" dir="ltr">${score(s)}<small>/8</small></div><div class="atlas-prose">${bi(pair('תשובות נכונות', 'Правильных ответов'))}</div><h2>${bi(pair('שתי תגליות לקחת לדרך', 'Два открытия на память'))}</h2><ol class="atlas-remember">${r.remember.map(id => `<li><div>${bi(questions.get(id).fact)}</div></li>`).join('')}</ol><div class="atlas-summary-actions">${SessionReview.jumpButton()}${r.id < 10 ? button('start', pair('לסבב הבא', 'Следующий раунд'), r.id + 1, 'atlas-primary') : button('menu', pair('לאטלס שלי', 'К моему атласу'), null, 'atlas-primary')}${button('start', pair('לשחק שוב', 'Ещё раз'), r.id)}${button('menu', pair('לבחירת סבב', 'Выбрать раунд'))}</div></section>${SessionReview.render(reportResults(),bank.title)}`;
  }
  function credits() {
    return `<details class="atlas-credits"><summary>${bi(pair('תמונות, מפות וקרדיטים', 'Изображения, карты и авторы'))}</summary><div class="atlas-prose">${bi(pair('התצלומים והדגלים נשמרו מ־Wikimedia Commons; המפות מבוססות על Natural Earth.', 'Фотографии и флаги сохранены с Wikimedia Commons; карты основаны на Natural Earth.'))}</div><ul>${window.AtlasMedia.map(m => `<li><a href="${esc(m.source)}" target="_blank" rel="noopener noreferrer">${esc(m.id)}</a> — <span dir="auto">${esc(m.creator)}</span> · ${m.licenseUrl ? `<a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a>` : esc(m.license)}<small dir="auto">${esc(m.modifications)}</small></li>`).join('')}</ul><div class="atlas-prose">${bi(pair('מסגרות ותחושת לחיצה הותאמו מ־PaperCSS ברישיון ISC.', 'Рамки и нажатия адаптированы из PaperCSS по лицензии ISC.'))} <a href="vendor/papercss/LICENSE.md">PaperCSS © Rhyne Vlaservich</a></div></details>`;
  }
  function render() {
    if (PlaySession.isAtlas()) return `<div class="atlas-page">${questionView()}</div>`;
    return `<div class="atlas-page">${top()}${!storageOK ? `<div class="atlas-prose atlas-save-warning" role="alert">${bi(T.saveError)}</div>` : ''}${saved.view === 'menu' || !run() ? menu() : run().complete ? summary() : questionView()}${credits()}</div>`;
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
    if (action === 'hear') { data.readAloud = true; saveProgress(); narrated = ''; redraw(); return true; }
    const s = run(), q = current(); if (!s || !q || s.complete) return true;
    if (action === 'accessible') { saved.accessible = !saved.accessible; narrated = ''; persist(); redraw('#atlas-question'); return true; }
    if (action === 'select' && !s.answers[s.index] && Number.isInteger(n) && n >= 0 && n < 3) { s.selected = n; persist(); redraw(`[data-atlas-action="select"][data-atlas-value="${n}"]`); }
    if (action === 'check' && s.selected != null && !s.answers[s.index]) {
      const correct = s.selected === q.answer;
      s.answers.push({ id: q.id, selected: s.selected, correct });
      if (correct && !saved.learned.includes(q.id)) {
        saved.learned.push(q.id); data.xp = (data.xp || 0) + 24;
        // The independent atlas ledger prevents duplicate XP after refresh or replay.
        persist(); saveProgress();
      }
      persist(); redraw('#atlas-feedback'); document.querySelector('#atlas-feedback')?.scrollIntoView({ block: 'nearest' });
    }
    if (action === 'next' && s.answers[s.index]) {
      if(PlaySession.isAtlas()){PlaySession.next();return true;}
      if (s.index === 7) {
        s.complete = true; SessionReview.archive(`atlas:${saved.activeRound}:${Date.now()}`,bank.title,reportResults(),saved.activeRound); const old = saved.progress[saved.activeRound];
        saved.progress[saved.activeRound] = { best: Math.max(old?.best || 0, score(s)), attempts: (old?.attempts || 0) + 1 };
      } else { s.index++; s.selected = null; }
      persist(); redraw(s.complete ? '#atlas-summary-title' : '#atlas-question'); window.scrollTo(0, 0);
    }
    return true;
  }
  function afterRender() {
    if ((screen !== 'atlas' && !PlaySession.isAtlas()) || !data.readAloud) { if (screen === 'atlas') narrated = ''; return; }
    const s = run(), q = current(), r = round();
    const token = [saved.view, r?.id, q?.id, s?.index, s?.answers.length, s?.complete, saved.accessible, data.lang].join(':');
    if (token === narrated) return; narrated = token;
    if (!PlaySession.isAtlas() && (saved.view === 'menu' || !s)) speakParts([bank.title, pair('בחר סבב. שמונה שאלות בכל סבב.', 'Выбери раунд. В каждом восемь вопросов.')]);
    else if (s.complete) speakParts([pair(`הסבב הסתיים. ${score(s)} תשובות נכונות מתוך שמונה.`, `Раунд завершён. Правильных ответов: ${score(s)} из восьми.`), ...r.remember.map(id => questions.get(id).fact)]);
    else if (s.answers[s.index]) speakParts([pair(`התשובה הנכונה היא ${q.options[q.answer].he}`, `Правильный ответ: ${q.options[q.answer].ru}`), q.fact]);
    else speakParts([saved.accessible && q.accessiblePrompt ? q.accessiblePrompt : q.prompt, ...q.options.map((o, i) => pair(`${i + 1}. ${o.he}`, `${i + 1}. ${o.ru}`))]);
  }
  function reset() { saved = fresh(); narrated = ''; persist(); }
  return { open, openMenu, resume, start, render, handleClick, afterRender, state, current, completedCount, reset, storageKey: KEY };
})();
