/* Original MishaLab companion using the owner-approved shared SVG character. */
window.Mishi = (() => {
  'use strict';
  const p=(he,ru)=>({he,ru});
  const praise=[p('יפה, מצאת!','Отлично, ты нашёл!'),p('רעיון מוצלח!','Хорошая мысль!'),p('עוד תגלית לאוסף.','Ещё одно открытие.'),p('כל הכבוד על החשיבה.','Молодец, хорошо подумал.'),p('הפתרון בידיים שלך.','Решение у тебя в руках.'),p('זה הסתדר!','Получилось!'),p('צעד קטן, תגלית חדשה.','Маленький шаг, новое открытие.'),p('נפלא, אפשר להמשיך.','Здорово, можно продолжить.')];
  let spriteTemplate=null,spritePromise=null;
  let lastBubble=-Infinity,bubbleTimer=null,idleTimer=null,summaryTimer=null,praiseIndex=0,host=null,pending=null,lastHomeDate=null;
  const motion=()=>!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const speaking=()=>!!window.speechSynthesis?.speaking;
  const activeCard=()=>document.querySelector('.task-shell,.lg-task-card,.atlas-question-card:not(.atlas-summary)');
  const companionCard=()=>activeCard()||document.querySelector('.journey-finish,.lg-course-summary,.atlas-summary,.personal-status')||(typeof screen==='string'&&screen==='end'?document.querySelector('#app>.hero'):null);
  const imageFor=mood=>mood==='think'?'assets/characters/mishi-think.svg':mood==='cheer'?'assets/characters/mishi-cheer.svg':mood==='sleepy'?'assets/characters/mishi-sleepy.svg':['happy','success'].includes(mood)?'assets/characters/mishi-success.svg':'assets/characters/mishi-explorer.svg';
  function normalizedMood(mood){return mood==='happy'?'success':mood;}
  function applyMood(portrait,mood){
    if(!portrait)return;
    if(portrait.tagName.toLowerCase()==='svg'){
      for(const group of portrait.querySelectorAll('g[data-mood]'))group.style.display=group.dataset.mood===normalizedMood(mood)?'':'none';
    }else{portrait.src=imageFor(mood);portrait.onerror=()=>{portrait.onerror=null;portrait.src='assets/characters/mishi-explorer.svg';};}
  }
  function installSprite(target){
    if(!spriteTemplate||!target)return;
    const current=target.querySelector('img.mishi-portrait');if(!current)return;
    const svg=document.importNode(spriteTemplate,true);svg.classList.add('mishi-portrait');svg.setAttribute('width',current.getAttribute('width')||'56');svg.setAttribute('height',current.getAttribute('height')||'64');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    // Every rendered copy is decorative, so shared art IDs never leak into DOM references.
    for(const el of svg.querySelectorAll('[id]'))el.removeAttribute('id');svg.removeAttribute('aria-labelledby');
    applyMood(svg,target.dataset.mood||'idle');current.replaceWith(svg);
  }
  function loadSprite(){
    if(spritePromise||spriteTemplate)return;
    spritePromise=fetch('assets/characters/mishi.svg').then(response=>{if(!response.ok)throw new Error('Companion sprite unavailable');return response.text();}).then(source=>{
      const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
      if(parsed.querySelector('parsererror')||parsed.querySelector('script,foreignObject,image')||parsed.documentElement.localName!=='svg')return;
      spriteTemplate=parsed.documentElement;
      for(const el of document.querySelectorAll('.mishi-companion,.personal-status'))installSprite(el);
    }).catch(()=>{});
  }
  function ensure(){
    const card=companionCard();
    if(!card){host=null;return null;}
    if(card.matches('.personal-status')){host=card;card.querySelector('img')?.classList.add('mishi-portrait');installSprite(card);loadSprite();if(!card.querySelector('.mishi-bubble')){const b=document.createElement('div');b.className='mishi-bubble';b.setAttribute('role','status');b.hidden=true;card.append(b);}return host;}
    host=card.querySelector('.mishi-companion');
    if(!host){host=document.createElement('div');host.className='mishi-companion';host.innerHTML='<img class="mishi-portrait" src="assets/characters/mishi-explorer.svg" alt="" width="56" height="64"><div class="mishi-bubble" role="status" aria-live="polite" hidden></div>';card.append(host);}
    installSprite(host);loadSprite();return host;
  }
  function setMood(mood){
    const target=ensure();if(!target)return;
    target.dataset.mood=mood;
    const img=target.querySelector('.mishi-portrait');applyMood(img,mood);
    if(motion()&&['happy','success','cheer'].includes(mood))img.animate([{transform:'translateY(0)'},{transform:'translateY(-5px)',offset:.45},{transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
  }
  function clearBubble(){clearTimeout(bubbleTimer);if(host?.isConnected){const b=host.querySelector('.mishi-bubble');b.hidden=true;b.replaceChildren();}pending=null;}
  function say(message,mood='idle',duration=3500){
    const target=ensure();if(!target||!message||speaking()||performance.now()-lastBubble<10000)return false;
    clearBubble();lastBubble=performance.now();setMood(mood);
    const b=target.querySelector('.mishi-bubble');
    // The regular screen reader announcement yields while the optional narrator is enabled.
    b.setAttribute('aria-live',typeof data!=='undefined'&&data.readAloud?'off':'polite');
    b.innerHTML=typeof ui==='function'?ui(message):String(message.he||message.ru||'');b.hidden=false;
    pending={message,mood,expires:performance.now()+Math.min(3500,Math.max(0,duration))};
    bubbleTimer=setTimeout(clearBubble,Math.min(3500,Math.max(0,duration)));return true;
  }
  function scheduleIdle(){
    clearTimeout(idleTimer);if(!activeCard())return;
    idleTimer=setTimeout(()=>{
      const card=activeCard(),hint=card?.querySelector('[data-action="hint"],[data-lg-action="hint"],[data-atlas-action="hint"]');
      if(!card||!hint||hint.disabled||card.querySelector('.feedback.success,.lg-feedback.success,.atlas-feedback'))return;
      if(say(p('רוצה רמז? אפשר להיעזר.','Хочешь подсказку? Можно воспользоваться.'),'think')&&motion())hint.animate([{transform:'scale(1)'},{transform:'scale(1.035)'},{transform:'scale(1)'}],{duration:500,easing:'ease-out'});
    },25000);
  }
  function afterRender(){
    const old=pending;ensure();
    if(host&&old&&old.expires>performance.now()&&!speaking()){
      host.dataset.mood=old.mood;applyMood(host.querySelector('.mishi-portrait'),old.mood);
      const b=host.querySelector('.mishi-bubble');b.innerHTML=typeof ui==='function'?ui(old.message):String(old.message.he||'');b.hidden=false;b.setAttribute('aria-live','off');
    }
    scheduleIdle();
    if(document.body.classList.contains('home-screen')&&typeof data!=='undefined'){
      const today=typeof dayKey==='function'?dayKey():new Date().toISOString().slice(0,10);
      if(lastHomeDate!==today){lastHomeDate=today;const previous=data.lastMishiVisit;data.lastMishiVisit=today;if(previous&&previous<today)say(p('התגעגעתי! מה נפצח היום?','Рад тебя видеть! Что разгадаем сегодня?'),'happy');else say(p('נפצח משהו יחד, בקצב שלך.','Разгадаем что-нибудь вместе, в твоём темпе.'),'idle');if(typeof saveProgress==='function')saveProgress();}
    }
  }
  function onAnswer(ok,{streak=0}={}){
    if(ok&&[3,5,10].includes(streak))return say(p(`${streak} פתרונות ברצף!`,`Уже ${streak} решений подряд!`),'cheer');
    return ok?say(praise[praiseIndex++%praise.length],'happy'):say(p('בוא נבדוק שוב. אפשר לשנות את הבחירה.','Давай проверим ещё раз. Можно изменить ответ.'),'think');
  }
  function onSummary(results=[]){
    clearTimeout(summaryTimer);
    const count=results.filter(r=>r.correct&&r.attempts===1&&!r.hints).length;
    const message=count?p(`היום מצאת ${count} פתרונות בלי רמז או ניסיון נוסף.`,`Сегодня ты нашёл ${count} решений без подсказок и повторной попытки.`):p(`היום ניסית ${results.length} תרגילים, בקצב שלך.`,`Сегодня ты попробовал ${results.length} заданий в своём темпе.`);
    if(say(message,'cheer'))return true;
    // Summary copy waits for the shared bubble budget; leaving the summary cancels it naturally.
    const summary=companionCard();if(summary&&!activeCard())summaryTimer=setTimeout(()=>{if(summary.isConnected&&!activeCard())say(message,'cheer');},Math.max(0,10010-(performance.now()-lastBubble)));
    return false;
  }
  function react(event,detail={}){if(event==='correct'||event==='wrong')return onAnswer(event==='correct',detail);if(event==='summary')return onSummary(detail.results);if(event==='hint')return say(p('נסתכל על הרמז, צעד אחד בכל פעם.','Посмотрим на подсказку, шаг за шагом.'),'think');if(event==='rank')return say(p('עוד דרגה בדרך שלך!','Новая ступень на твоём пути!'),'cheer');}
  for(const name of ['pointerdown','keydown','input'])document.addEventListener(name,scheduleIdle,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(idleTimer);clearBubble();}else scheduleIdle();});
  return {say,react,afterRender,onAnswer,onSummary,stop(){clearTimeout(idleTimer);clearTimeout(summaryTimer);clearBubble();},setMood};
})();
