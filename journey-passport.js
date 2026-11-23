/* Original MishaLab journey UI. All learning states come from the existing expedition. */
window.JourneyPassport = (() => {
  'use strict';
  const pair = (he, ru) => ({he, ru});
  const STATES = {
    independent: {symbol:'✓', label:pair('נפתר עצמאית','Решено самостоятельно')},
    assisted: {symbol:'✦', label:pair('נפתר בעזרה','Решено с подсказкой')},
    solved: {symbol:'✓', label:pair('נפתר','Решено')},
    rehearsed: {symbol:'↻', label:pair('תורגל שוב','Повторная тренировка')},
    skipped: {symbol:'→', label:pair('דולג','Пропущено')},
    attempted: {symbol:'↗', label:pair('ניסינו','Попробовали')},
    current: {symbol:'◆', label:pair('כאן עכשיו','Ты здесь')},
    next: {symbol:'➜', label:pair('התחנה הבאה','Следующая станция')},
    untried: {symbol:'○', label:pair('עוד לפנינו','Впереди')}
  };
  let dialog = null, trigger = null;
  function statusFor(result, {current=false, next=false, preview=false} = {}) {
    if (!preview && result) {
      if (result.skipped) return 'skipped';
      if (result.practiced || result.practiceSolved) return 'rehearsed';
      if (result.correct) {
        if (result.attempts === 1 && result.hints === 0) return 'independent';
        if (result.hints > 0) return 'assisted';
        return 'solved';
      }
      return 'attempted';
    }
    return !preview && current ? 'current' : !preview && next ? 'next' : 'untried';
  }
  function model(expedition, currentResult=null, {preview=false} = {}) {
    const entries = Array.isArray(expedition?.entries) ? expedition.entries : [];
    const results = Array.isArray(expedition?.results) ? expedition.results : [];
    const total = entries.length;
    const cursor = Number.isInteger(expedition?.index) ? Math.max(0, Math.min(total, expedition.index)) : 0;
    const complete = !preview && expedition?.status === 'complete';
    const stations = entries.map((entry, index) => {
      const atCursor = !preview && !complete && index === cursor;
      const current = atCursor && expedition.phase === 'task';
      const next = atCursor && expedition.phase === 'interlude';
      const result = preview ? null : index < cursor || complete ? results[index] || null : current ? currentResult : null;
      const status = statusFor(result, {current, next, preview});
      const label = typeof SessionReview !== 'undefined' ? SessionReview.label(entry.key) : pair(entry.key, entry.key);
      return {index, key:entry.key, kind:entry.kind, level:entry.level, label, status, current, next, result, viewable:!!result};
    });
    const counts = Object.fromEntries(Object.keys(STATES).map(key => [key, 0]));
    for (const station of stations) counts[station.status]++;
    return {stations, passed:preview ? 0 : complete ? total : cursor, total, counts};
  }
  // Small original vector stickers; decorative artwork never substitutes for question media.
  function icon(key) {
    const paths = {
      math:'<rect x="15" y="9" width="34" height="46" rx="6"/><path d="M22 18h20v8H22zM23 34h2m7 0h2m7 0h2m-20 9h2m7 0h2m7 0h2"/>',
      matches:'<path d="m18 48 27-30M24 51 9 21M36 51l18-26"/><circle cx="46" cy="16" r="5"/><circle cx="8" cy="18" r="5"/><circle cx="55" cy="22" r="5"/>',
      sudoku:'<rect x="9" y="9" width="46" height="46" rx="6"/><path d="M9 32h46M32 9v46M20 9v46M43 9v46M9 20h46M9 43h46"/><text x="20" y="30">1</text><text x="42" y="42">4</text>',
      atlas:'<circle cx="32" cy="30" r="21"/><ellipse cx="32" cy="30" rx="9" ry="21"/><path d="M12 30h40M16 19h32M16 41h32M24 55h16M32 51v4"/>',
      geometry:'<path d="m18 11 13 23H5z"/><rect x="32" y="11" width="23" height="23" rx="3"/><circle cx="32" cy="47" r="11"/>',
      origami:'<path d="m7 25 49-17-15 48-11-20zM7 25l25 3L56 8 30 36M32 28l9 28"/>',
      lights:'<path d="M23 43c0-7-9-9-9-22a18 18 0 0 1 36 0c0 13-9 15-9 22zM24 49h16M27 55h10M32 4V1M8 10 4 7m52 3 4-3M6 29H1m57 0h5"/>',
      hebrew:'<path d="M13 11h38v42H13zM7 17v36h38"/><text class="passport-hebrew-letter" x="32" y="41">א</text>',
      chess:'<path d="m9 22 9 23h28l9-23-14 8-9-18-9 18zM17 52h30"/><circle cx="9" cy="19" r="3"/><circle cx="32" cy="9" r="3"/><circle cx="55" cy="19" r="3"/>',
      maze:'<path d="M31 9H9v46h46V9H42v13H22v20h20V31M9 22h13M42 55V42M31 31v11"/><path d="m49 31 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z"/>',
      sliding:'<rect x="9" y="9" width="20" height="20" rx="4"/><rect x="35" y="9" width="20" height="20" rx="4"/><rect x="9" y="35" width="20" height="20" rx="4"/><path d="M36 45h17m-6-6 6 6-6 6"/><text x="19" y="24">1</text><text x="45" y="24">2</text><text x="19" y="50">3</text>',
      logic:'<path d="M10 35V15h18a7 7 0 1 1 11 0h15v18a7 7 0 1 0 0 11v11H35a7 7 0 1 0-11 0H10V45a7 7 0 1 0 0-10z"/>',
      nonogram:'<rect x="10" y="10" width="44" height="44" rx="4"/><path d="M25 10v44M39 10v44M10 25h44M10 39h44"/><path class="passport-fill" d="M26 11h12v13H26zM11 26h13v12H11zM26 26h12v12H26zM40 26h13v12H40zM26 40h12v13H26z"/>'
    };
    return `<svg class="passport-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${paths[key] || paths.logic}</svg>`;
  }
  const cornerArrow = '<svg class="passport-corner-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 12 12 4M4 4h8v8"/></svg>';
  function stateLabel(status) { return STATES[status]?.label || STATES.untried.label; }
  function badge(station) {
    const state = STATES[station.status];
    return `<span class="passport-status"><span aria-hidden="true">${state.symbol}</span><span class="passport-status-label">${bi(state.label)}</span></span>`;
  }
  function render(expedition, {preview=false, currentResult=null, id='journey-passport'} = {}) {
    const view = model(expedition, currentResult, {preview});
    const lead = preview ? pair('13 תחנות. בכל אחת משחק אחר.','13 станций. На каждой — новая игра.') : pair(`${view.passed} מתוך ${view.total} תחנות מאחוריך`, `Позади ${view.passed} из ${view.total} станций`);
    return `<section class="journey-passport ${preview ? 'passport-preview' : ''}" aria-labelledby="${esc(id)}-title"><div class="passport-heading"><div><span class="passport-kicker">${bi(pair('המסע שלך, תחנה אחר תחנה','Твоё путешествие, станция за станцией'))}</span><h2 id="${esc(id)}-title">${bi(pair('דרכון התגליות','Паспорт открытий'))}</h2><p>${bi(lead)}</p></div><div class="passport-seal" aria-hidden="true"><span>✦</span><b>${view.total}</b></div></div><ol class="passport-stations">${view.stations.map(station => {
      const contents = `<span class="passport-station-number">${station.index + 1}</span><span class="passport-illustration passport-art-${esc(station.key)}">${icon(station.key)}</span><strong>${bi(station.label)}</strong>${badge(station)}${station.current && station.status !== 'current' ? `<span class="passport-location">${bi(STATES.current.label)}</span>` : ''}`;
      const attrs = `class="passport-station passport-${station.status}" data-station-index="${station.index}" data-status="${station.status}"${station.current ? ' aria-current="step"' : ''}`;
      const action = station.viewable ? `<button class="passport-station-content" data-passport-action="detail" data-station-index="${station.index}" aria-label="${esc(text(pair(`תחנה ${station.index + 1}: ${station.label.he}. ${stateLabel(station.status).he}. לצפייה בתרגיל`, `Станция ${station.index + 1}: ${station.label.ru}. ${stateLabel(station.status).ru}. Посмотреть задание`)))}">${contents}<span class="passport-view"><span class="passport-view-label">${bi(pair('לראות את התרגיל','Посмотреть задание'))}</span>${cornerArrow}</span></button>` : `<div class="passport-station-content">${contents}</div>`;
      return `<li ${attrs}>${action}</li>`;
    }).join('')}</ol><div class="passport-note">${bi(preview ? pair('בוחרים רמה, ומתחילים. אפשר לעצור ולהמשיך בכל תחנה.','Выбери уровень и начинай. На любой станции можно сделать паузу.') : pair('החותמות מתארות את הניסיון הזה. אפשר להמשיך בקצב שלך.','Отметки описывают эту попытку. Продолжай в своём темпе.'))}</div></section>`;
  }
  function compact(expedition, currentResult=null) {
    const view = model(expedition, currentResult);
    return `<div class="passport-compact" aria-label="${esc(text(pair('התקדמות במסע','Прогресс путешествия')))}"><div class="passport-mini-stations" aria-hidden="true">${view.stations.map(station => `<span class="passport-mini-station passport-${station.status} ${station.current ? 'is-current' : ''}" data-station-index="${station.index}" data-status="${station.status}">${STATES[station.status].symbol}</span>`).join('')}</div><button class="passport-open" data-session-action="passport">${icon('atlas')}<span>${bi(pair('דרכון התגליות','Паспорт открытий'))}</span>${cornerArrow}</button></div>`;
  }
  function detailHTML(station) {
    const r = station.result;
    if (!r) return '';
    return `<div class="passport-detail-header"><span class="passport-detail-icon passport-art-${esc(station.key)}">${icon(station.key)}</span><div><span class="passport-kicker">${bi(pair(`תחנה ${station.index + 1}`, `Станция ${station.index + 1}`))}</span><h3 tabindex="-1" id="passport-detail-title">${bi(station.label)}</h3></div>${badge(station)}</div>${r.prompt ? `<div class="passport-detail-prompt">${bi(r.prompt)}</div>` : ''}${r.display ? `<div class="passport-detail-expression" dir="ltr">${esc(r.display)}</div>` : ''}<p>${bi(pair(`ניסיונות בדיקה: ${r.attempts || 0} · רמזים: ${r.hints || 0}`, `Проверок: ${r.attempts || 0} · подсказок: ${r.hints || 0}`))}</p>${r.practiced || r.practiceSolved ? `<p>${bi(pair('זהו תרגול אחרי שהפתרון הוצג. הציון נשמר לפי הבחירה הראשונה.','Это тренировка после показа ответа. Результат сохранён по первому ответу.'))}</p>` : ''}${r.solution ? `<details><summary>${bi(pair('להיזכר בפתרון','Вспомнить решение'))}</summary><div>${bi(r.solution)}</div></details>` : ''}`;
  }
  function open(expedition, currentResult=null) {
    if (dialog || !expedition) return;
    const view = model(expedition, currentResult);
    trigger = document.activeElement;
    window.speechSynthesis?.cancel();
    dialog = document.createElement('dialog'); dialog.className='passport-dialog';
    dialog.setAttribute('aria-labelledby','passport-dialog-title');
    dialog.innerHTML=`<div class="passport-dialog-header"><div><span class="passport-kicker">${bi(pair('רגע להסתכל על הדרך','Посмотрим на пройденный путь'))}</span><h2 id="passport-dialog-title">${bi(pair('דרכון התגליות','Паспорт открытий'))}</h2></div><button class="passport-close" data-passport-action="close" aria-label="${esc(text(pair('חזרה לתרגיל','Вернуться к заданию')))}">×</button></div>${render(expedition,{currentResult,id:'passport-modal'})}<section id="passport-detail" class="passport-detail" hidden></section><button class="passport-return" data-passport-action="close">${bi(pair('חוזרים לאותה תחנה','Вернуться на ту же станцию'))}</button>`;
    dialog.addEventListener('click', event => {
      event.stopPropagation();
      const b=event.target.closest('[data-passport-action]');if(!b)return;
      if(b.dataset.passportAction==='close'){close();return;}
      const station=view.stations[Number(b.dataset.stationIndex)];
      if(b.dataset.passportAction==='detail' && station?.viewable){
        const panel=dialog.querySelector('#passport-detail');panel.innerHTML=detailHTML(station);panel.hidden=false;
        panel.querySelector('#passport-detail-title')?.focus({preventScroll:true});panel.scrollIntoView({block:'nearest'});
      }
    });
    // Maze shortcuts belong to the underlying game, never to this reading-only dialog.
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('cancel', event => {event.preventDefault();close();});
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-passport-action="close"]').focus();
  }
  function close() {
    const old=dialog;if(!old)return;dialog=null;old.close();old.remove();
    if(trigger?.isConnected)trigger.focus({preventScroll:true});trigger=null;
  }
  function handleDetail(event) {
    const b=event.target.closest('[data-passport-action="detail"]');
    if(!b || b.closest('.passport-dialog'))return false;
    const s=typeof PlaySession!=='undefined'?PlaySession.state():null;
    if(!s)return false;
    open(s,typeof PlaySession.currentResult==='function' && PlaySession.active()?PlaySession.currentResult():null);
    dialog?.querySelector(`[data-passport-action="detail"][data-station-index="${b.dataset.stationIndex}"]`)?.click();
    return true;
  }
  return {statusFor, model, render, compact, open, close, isOpen:()=>!!dialog, handleDetail, icon, stateLabel};
})();
