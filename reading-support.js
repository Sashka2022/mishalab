/* Reading support records whether translation was displayed, not whether a child read unaided. */
window.ReadingSupport = (() => {
  'use strict';
  const pair = (he, ru) => ({he, ru});
  const modes = ['hebrewFirst', 'always', 'tap', 'afterMiss'];
  function current() {
    if (typeof data === 'undefined') return null;
    if (window.PlaySession?.isAtlas() || (screen === 'atlas' && window.AtlasQuiz)) return AtlasQuiz.readingContext?.() || null;
    if (window.PlaySession?.isLearning()) return PlaySession.learningRun()?.task || null;
    if (screen === 'learning' && window.LearningUI) {
      const state = LearningUI.state(), run = state.sessions[state.activeGame];
      return state.view !== 'menu' && run?.status !== 'complete' ? run?.task || null : null;
    }
    return (screen === 'task' || window.PlaySession?.isCore()) ? session?.task || null : null;
  }
  function mode() { return modes.includes(data.helpMode) ? data.helpMode : 'hebrewFirst'; }
  function record() {
    const q = current();
    if (q && data.lang === 'both') q.readingTracked = true;
    return q;
  }
  function visible() {
    if (data.lang === 'ru') {const q=current();if(q)q.ruShown=true;return true;}
    if (data.lang === 'he') return false;
    const q = record();
    if (!q) return true;
    if (mode() === 'always') q.ruShown = true;
    return mode() === 'always' || q.ruShown === true;
  }
  function speechLanguages() { return data.lang === 'both' ? visible() ? ['he','ru'] : ['he'] : [data.lang]; }
  function persist() { saveProgress(); if (screen === 'atlas' || window.PlaySession?.isAtlas()) AtlasQuiz.persistReading?.(); }
  function attempt(correct) {
    const q = record();
    if (!q || correct) return;
    q.readingMiss = true;
    if (data.lang === 'both' && ['hebrewFirst','afterMiss'].includes(mode())) q.ruShown = true;
  }
  function controls() {
    if (data.lang !== 'both' || !current() || mode() === 'always') return '';
    const shown = visible(), label = pair('הצגת תרגום לרוסית', 'Показать перевод на русский');
    return `<button type="button" class="reading-translate ${shown?'is-shown':''}" data-reading-action="translate" aria-pressed="${shown}" aria-label="${esc(text(label))}" title="${esc(text(label))}"><span lang="ru" dir="ltr">РУ</span><span aria-hidden="true">${shown?'✓':'＋'}</span></button>`;
  }
  function reveal() {
    const q = record();
    if (!q || q.ruShown) return;
    q.ruShown = true; persist(); window.render();
    document.querySelector('[data-reading-action="translate"]')?.focus({preventScroll:true});
  }
  function promptNodes() {
    return [...document.querySelectorAll('.task-shell h2 [lang="he"], .lg-task-card h2 [lang="he"], #atlas-question [lang="he"]')];
  }
  let wordTimer;
  function clearHighlight() { document.querySelectorAll('.reading-word.is-speaking,.reading-sentence.is-speaking').forEach(n=>n.classList.remove('is-speaking')); }
  function speakWord(node) {
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
    const word = node.textContent.trim(); if (!word) return;
    clearHighlight(); clearTimeout(wordTimer); node.classList.add('is-speaking');
    const utterance = new SpeechSynthesisUtterance(word); utterance.lang='he-IL'; utterance.rate=.78;
    const voice = typeof speechVoice === 'function' ? speechVoice('he-IL') : null; if (voice) utterance.voice=voice;
    utterance.onend=utterance.onerror=()=>{node.classList.remove('is-speaking');};
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
    wordTimer=setTimeout(()=>node.classList.remove('is-speaking'),1800);
  }
  function bindSpeech(utterance, languageOrText, spokenText = languageOrText) {
    if (!utterance.lang?.startsWith('he')) return;
    let sentences=[],words=[],ranges=[],foundBoundary=false;
    utterance.onstart=()=>{
      sentences=promptNodes();words=sentences.flatMap(n=>[...n.querySelectorAll('.reading-word')]);let cursor=0;
      ranges=words.map(node=>{const start=spokenText.indexOf(node.textContent,cursor);cursor=start<0?cursor:start+node.textContent.length;return {node,start,end:cursor};});
      clearHighlight();sentences.forEach(n=>n.classList.add('reading-sentence','is-speaking'));
    };
    utterance.onboundary=event=>{
      if(event.name && event.name!=='word')return;
      if(!foundBoundary){foundBoundary=true;sentences.forEach(n=>n.classList.remove('is-speaking'));}
      if(!ranges.length){let cursor=0;words=sentences.flatMap(n=>[...n.querySelectorAll('.reading-word')]);ranges=words.map(node=>{const start=spokenText.indexOf(node.textContent,cursor);cursor=start<0?cursor:start+node.textContent.length;return {node,start,end:cursor};});}
      const match=ranges.find(r=>r.start>=0&&event.charIndex>=r.start&&event.charIndex<r.end);
      words.forEach(n=>n.classList.toggle('is-speaking',n===match?.node));
    };
    utterance.onend=utterance.onerror=clearHighlight;
  }
  function afterRender() {
    const q=record(); if(q && data.lang==='both' && mode()==='always')q.ruShown=true;
    for(const sentence of promptNodes()) {
      if(sentence.querySelector('.reading-word'))continue;
      sentence.classList.add('reading-sentence');
      const walker=document.createTreeWalker(sentence,NodeFilter.SHOW_TEXT),texts=[];
      while(walker.nextNode())texts.push(walker.currentNode);
      for(const node of texts){const parts=node.textContent.split(/(\s+)/),fragment=document.createDocumentFragment();
        for(const part of parts){if(!part.trim()){fragment.append(document.createTextNode(part));continue;}
          const word=document.createElement('span');word.className='reading-word';word.tabIndex=0;word.setAttribute('role','button');word.setAttribute('aria-label',`הקראת המילה ${part}`);word.textContent=part;fragment.append(word);}
        node.replaceWith(fragment);
      }
    }
    // Read-state is stored with the question so refresh never closes an opened translation.
    if(q && (q.readingTracked || q.ruShown))persist();
  }
  function stats(results) {
    const tracked=results.filter(r=>r.readingTracked===true);
    return {total:tracked.length,withoutTranslation:tracked.filter(r=>!r.ruShown).length};
  }
  function summary(results) {
    const s=stats(results);if(!s.total)return '';
    return `<div class="reading-summary">${ui(pair(`ב־${s.withoutTranslation} מתוך ${s.total} שאלות התרגום לא נפתח`, `В ${s.withoutTranslation} из ${s.total} заданий перевод не открывался`))}<small>${ui(pair('זהו מדד לשימוש בתרגום, ולא מבחן קריאה.', 'Это показатель использования перевода, а не проверка чтения.'))}</small></div>`;
  }
  function teacherPanel() {
    const reports=data.sessionReports||[],recent=reports.slice(-8),labels={hebrewFirst:pair('עברית תחילה + תרגום בלחיצה או אחרי טעות','Сначала иврит: перевод по нажатию или после ошибки'),always:pair('שתי השפות תמיד','Оба языка всегда'),tap:pair('תרגום בלחיצה','Перевод по нажатию'),afterMiss:pair('תרגום אחרי ניסיון שגוי','Перевод после ошибки')};
    return `<section class="panel reading-settings"><h2>${ui(pair('עזרה בקריאה ובתרגום','Помощь с чтением и переводом'))}</h2><label for="reading-help-mode">${ui(pair('איך מציגים רוסית במצב המשולב?','Как показывать русский в двуязычном режиме?'))}</label><select id="reading-help-mode">${modes.map(value=>`<option value="${value}" ${mode()===value?'selected':''}>${esc(labels[value][uiLang()])}</option>`).join('')}</select><p>${ui(pair('לחיצה על מילה עברית בשאלה מקריאה אותה. השימוש בעזרה אינו מוריד נקודות. העברית מוצגת ללא ניקוד.', 'Нажатие на слово вопроса озвучивает его на иврите. Помощь не уменьшает баллы. Иврит показывается без огласовок.'))}</p>${recent.some(r=>stats(r.results||[]).total)?`<h3>${ui(pair('שימוש בתרגום בסשנים האחרונים','Использование перевода за последние занятия'))}</h3><ol>${recent.filter(r=>stats(r.results||[]).total).map(r=>{const s=stats(r.results);return `<li>${esc(new Date(r.at).toLocaleDateString(uiLang()==='ru'?'ru-RU':'he-IL'))} · ${ui(pair(`${s.withoutTranslation}/${s.total} ללא פתיחת תרגום`,`${s.withoutTranslation}/${s.total} без открытия перевода`))}</li>`;}).join('')}</ol>`:''}</section>`;
  }
  document.addEventListener('click',event=>{const translate=event.target.closest('[data-reading-action="translate"]');if(translate){event.preventDefault();reveal();return;}const word=event.target.closest('.reading-word');if(word){event.preventDefault();speakWord(word);}});
  document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.reading-word')){event.preventDefault();speakWord(event.target);}});
  document.addEventListener('change',event=>{if(event.target.id==='reading-help-mode'&&modes.includes(event.target.value)){data.helpMode=event.target.value;persist();window.render();}});
  return {current,mode,visible,speechLanguages,controls,reveal,attempt,afterRender,bindSpeech,stats,summary,teacherPanel};
})();
