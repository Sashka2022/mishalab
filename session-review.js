/* Practice summaries use observable performance from this session, not diagnostic labels. */
window.SessionReview = (() => {
  const pair = (he, ru) => ({he, ru});
  function label(key) {
    if(key==='mixed')return pair('מיקס חידות לוח','Смешанные головоломки');
    return domains[key]?.title || PuzzleGames.catalog[key]?.name || LearningGames.catalog[key]?.title || (key === 'atlas' ? AtlasQuestions.title : AtlasQuestions.categories[key]) || pair('חשיבה וגילוי','Мышление и открытия');
  }
  function snapshot(q, result = {}, key) {
    let detail=q.id?pair(`תרגיל ${q.index+1 || 1} · שלב ${q.stage || q.round || q.level || 1}`,`Задание ${q.index+1 || 1} · этап ${q.stage || q.round || q.level || 1}`):null;
    if(q.letter)detail=pair(`האות: ${q.letter}`,`Буква: ${q.letter}`);
    else if(q.word)detail=pair(`המילה: ${q.word}`,`Слово: ${q.word}`);
    else if(q.picture)detail=LearningArt.label(q.picture);
    else if(q.game==='maze')detail=pair(`מבוך ${q.n} על ${q.n}`,`Лабиринт ${q.n} на ${q.n}`);
    let preview=null;
    if(q.paper) preview={kind:'paper',paper:q.paper,target:q.target,point:q.point};
    else if(q.media) preview={kind:'media',media:q.media,alt:q.alt};
    else if(q.mode==='puzzle'||q.mode==='chess'||q.visual||q.mode==='grid') preview={kind:'visual',question:Object.fromEntries(['mode','visual','type','variant','title','n','w','h','count','initial','answer','board','from'].filter(k=>q[k]!==undefined).map(k=>[k,q[k]]))};
    let display=q.display||'';
    if(q.game==='matches'){
      const digits=Array.from({length:q.width*3},(_,i)=>LearningGames.SEG.findIndex(v=>v.every((n,j)=>n===q.initial[i*7+j])));
      const nums=[0,1,2].map(i=>digits.slice(i*q.width,(i+1)*q.width).join(''));
      display=`${nums[0]} ${q.operator} ${nums[1]} = ${nums[2]}`;
    }
    return { ...result, id:q.id || q.signature, activity:key || q.game || (q.mode === 'puzzle' ? q.type : q.domain), skill:q.game ? q.variant || q.game : q.type || q.category,
      prompt:q.prompt, detail, display, preview, solution:q.fact || q.hints?.[2], level:q.stage || q.level || 1,
      correct:!!result.correct, skipped:!!result.skipped, open:!!result.open, hints:result.hints || 0, attempts:result.attempts || 0 };
  }
  function previewHTML(preview) {
    if(!preview)return '';
    if(preview.kind==='paper')return LearningUI.paperSVG(preview.paper,{point:preview.point})+(preview.target?LearningUI.paperSVG(preview.target):'');
    if(preview.kind==='media'){
      const id=preview.media+(preview.media.startsWith('map-')?'-'+(data.lang==='ru'?'ru':'he'):'');
      const m=AtlasMedia.find(m=>m.id===id);return m?`<img src="${esc(m.path)}" alt="${esc(text(preview.alt))}" loading="lazy">`:'';
    }
    const q=preview.question;
    return renderVisual({...q,board:q.mode==='puzzle'?q.initial:q.board,finished:true,selected:q.mode==='grid'?[]:null,moves:0,undo:[],hint:0});
  }
  function archive(id, title, results, level) {
    data.sessionReports ||= [];
    if (!data.sessionReports.some(r => r.id === id)) data.sessionReports.push({id,title,results:JSON.parse(JSON.stringify(results)),level,at:new Date().toISOString()});
    data.sessionReports = data.sessionReports.slice(-40);
  }
  function render(results, title) {
    const closed = results.filter(r=>!r.open), solved=closed.filter(r=>r.correct), groups = new Map();
    for (const r of closed) {
      const key=r.activity || r.domain || r.game || 'logic';
      if (!groups.has(key)) groups.set(key,{key,total:0,solved:0,independent:0});
      const group=groups.get(key);group.total++;if(r.correct){group.solved++;if(!r.hints&&r.attempts===1)group.independent++;}
    }
    const strengths=[...groups.values()].filter(g=>g.solved).sort((a,b)=>b.independent-a.independent||b.solved/b.total-a.solved/a.total).slice(0,3);
    return `<section class="session-review" aria-labelledby="review-title"><div class="review-heading"><span class="review-symbol" aria-hidden="true">✦</span><div><div class="review-kicker">${bi(title || pair('הסשן שלי','Моё занятие'))}</div><h2 id="review-title" tabindex="-1">${bi(pair('מה גיליתי על עצמי היום?','Что у меня получилось сегодня?'))}</h2></div></div><div class="review-count">${bi(pair(`${solved.length} מתוך ${closed.length} תרגילים נפתרו`, `Решено ${solved.length} из ${closed.length} заданий`))}</div><h3>${bi(pair('נקודות חוזק בתרגול הזה','Сильные стороны в этом занятии'))}</h3>${strengths.length?`<div class="review-strengths">${strengths.map(g=>`<article><span aria-hidden="true">✓</span><b>${bi(label(g.key))}</b><div>${bi(pair(`${g.solved} מתוך ${g.total} נפתרו`,`${g.solved} из ${g.total} решено`))}</div><small>${bi(pair(`${g.independent} בפתרון עצמאי, בניסיון הראשון וללא רמז`,`${g.independent} самостоятельно, с первой попытки без подсказки`))}</small></article>`).join('')}</div>`:`<div class="review-empty">${bi(pair('עוד אין מספיק פתרונות כדי לסמן חוזקות. כל ניסיון עוזר ללמוד.','Пока недостаточно решений, чтобы выделить сильные стороны. Каждая попытка помогает учиться.'))}</div>`}<details class="review-exercises"><summary>${bi(pair('התרגילים שנפתרו ומה עוד תרגלנו','Решённые задания и другие попытки'))}</summary><ol>${results.map(r=>`<li class="review-exercise ${r.correct?'solved':''}"><span class="review-result" aria-hidden="true">${r.correct?'✓':r.open?'◇':'↗'}</span><div><b>${bi(label(r.activity || r.domain || r.game))}</b><div class="review-prompt">${bi(r.prompt || pair('תרגיל שנשמר בגרסה קודמת','Задание из предыдущей версии'))}</div>${r.detail?`<div class="review-detail">${bi(r.detail)}</div>`:''}${r.display?`<div dir="ltr" class="review-expression">${esc(r.display)}</div>`:''}<small class="review-status">${bi(r.open?pair('משימת חקר — הושוותה לדוגמה','Исследование — сравнили с образцом'):r.correct?r.hints?pair(`נפתר עם ${r.hints} רמזים`,`Решено с подсказками: ${r.hints}`):r.attempts===1?pair('נפתר עצמאית בניסיון הראשון','Решено самостоятельно с первой попытки'):pair('נפתר אחרי כמה ניסיונות','Решено после нескольких попыток'):r.skipped?pair('דולג — אפשר לחזור לתרגל','Пропущено — можно попробовать ещё'):pair('עדיין לא נפתר','Пока не решено'))}</small>${r.preview?`<details class="review-visual"><summary>${bi(pair('לראות שוב את התרגיל','Посмотреть задание'))}</summary><div class="review-preview" inert>${previewHTML(r.preview)}</div></details>`:''}${r.solution?`<details><summary>${bi(pair('להיזכר בדרך לפתרון','Вспомнить решение'))}</summary><div>${bi(r.solution)}</div></details>`:''}</div></li>`).join('')}</ol></details><button data-break-action="open" class="review-break">${bi(pair('רגע של משחק · קופצים בין כוכבים','Игровая пауза · прыжки к звёздам'))}</button></section>`;
  }
  function home() {
    const last=data.sessionReports?.at(-1);
    return last?`<section class="last-session"><span>${ico('trophy')}</span><div><b>${bi(pair('הסשן האחרון שלך מחכה כאן','Итоги последнего занятия здесь'))}</b><div>${bi(last.title)}</div></div><button data-session-action="last">${bi(pair('חוזקות ותרגילים','Успехи и задания'))}</button></section>`:'';
  }
  function page() {
    const report=data.sessionReports?.at(-1);
    return report?`<div class="review-page"><h1>${bi(report.title)}</h1>${render(report.results,report.title)}<button data-action="home">${bi(T.home)}</button></div>`:'';
  }
  const jumpButton=()=>`<button data-session-action="review-current">${bi(pair('החוזקות והתרגילים שלי','Мои успехи и задания'))}</button>`;
  return {snapshot,archive,render,home,page,label,jumpButton};
})();
