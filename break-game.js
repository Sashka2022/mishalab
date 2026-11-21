/* Original vector mini-game. No engine, network requests or learning-score changes. */
window.BreakGame = (() => {
  let dialog=null, frame=0, last=0, elapsed=0, y=0, velocity=0, stars=0, paused=false, finished=false, trigger=null, objects=[];
  const pair=(he,ru)=>({he,ru});
  function open() {
    if(dialog)return;
    trigger=document.activeElement;window.speechSynthesis?.cancel();
    elapsed=0;y=0;velocity=0;stars=0;last=0;paused=false;finished=false;
    objects=Array.from({length:7},(_,i)=>({x:420+i*175,hit:false,collected:false}));
    dialog=document.createElement('dialog');dialog.className='star-hop-dialog';
    dialog.setAttribute('aria-labelledby','star-hop-title');
    dialog.innerHTML=`<div class="star-hop-heading"><div><span class="review-kicker">${bi(pair('הפוגה קטנה · 15 שניות','Маленькая пауза · 15 секунд'))}</span><h2 id="star-hop-title">${bi(pair('קופצים בין כוכבים','Прыжки к звёздам'))}</h2></div><button data-hop="close" aria-label="${esc(text(pair('חזרה לתרגול','Вернуться к занятию')))}">×</button></div><div class="star-hop-help">${bi(pair('לוחצים על קפיצה או על מקש רווח. מדלגים מעל האבנים ואוספים כוכבים.','Нажимай «Прыжок» или пробел. Перепрыгивай камни и собирай звёзды.'))}</div><svg class="star-hop-scene" viewBox="0 0 720 320" role="img" aria-label="${esc(text(pair('יצור קטן קופץ בנוף איים וכוכבים','Маленький герой прыгает среди островов и звёзд')))}"><defs><linearGradient id="hop-sky" x2="0" y2="1"><stop stop-color="#dce9ff"/><stop offset="1" stop-color="#f4f0ff"/></linearGradient></defs><rect width="720" height="320" rx="22" fill="url(#hop-sky)"/><circle cx="620" cy="62" r="34" fill="#ffe69a"/><g fill="#fff" opacity=".8"><ellipse cx="105" cy="70" rx="62" ry="18"/><ellipse cx="385" cy="100" rx="75" ry="15"/></g><path d="M0 240Q100 180 205 230T430 225T720 208V320H0" fill="#bfcbea"/><path d="M0 270Q130 215 245 264T490 260T720 250V320H0" fill="#9ebeb1"/><rect y="272" width="720" height="48" fill="#689d89"/><path d="M0 272H720" stroke="#e6f0c8" stroke-width="8"/><g id="hop-objects"></g><g id="hop-player" transform="translate(118 252)"><ellipse cy="17" rx="24" ry="6" fill="#335c5b" opacity=".18"/><rect x="-21" y="-33" width="42" height="48" rx="17" fill="#8457c8" stroke="#5f3f94" stroke-width="3"/><path d="m-10-31-4-16 13 13m10-1 9-12 1 18" fill="#a887da" stroke="#5f3f94" stroke-width="3"/><circle cx="-7" cy="-15" r="3" fill="#fff"/><circle cx="8" cy="-15" r="3" fill="#fff"/><path d="M-5-4q6 6 12-1" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g></svg><div class="star-hop-stats" role="status" aria-live="off"><span id="hop-time">15</span><span id="hop-score">★ 0</span></div><div id="hop-message" class="star-hop-message" role="status"></div><div class="star-hop-actions"><button class="primary" data-hop="jump">${bi(pair('קפיצה','Прыжок'))}</button><button data-hop="pause">${bi(pair('השהיה','Пауза'))}</button><button data-hop="close">${bi(pair('חוזרים לתרגול','Вернуться к занятию'))}</button></div>`;
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-hop="jump"]').focus();
    dialog.addEventListener('click',event=>{const a=event.target.closest('[data-hop]')?.dataset.hop;if(a==='jump')jump();else if(a==='pause')toggle();else if(a==='close')close();});
    dialog.addEventListener('keydown',event=>{if((event.code==='Space'||event.code==='ArrowUp')&&!event.target.closest('[data-hop="close"],[data-hop="pause"]')){event.preventDefault();jump();}});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    frame=requestAnimationFrame(tick);
  }
  function jump(){if(dialog&&!paused&&!finished&&y===0)velocity=-470;}
  function toggle(){if(!dialog||finished)return;paused=!paused;last=0;dialog.querySelector('[data-hop="pause"]').innerHTML=bi(paused?pair('להמשיך','Продолжить'):pair('השהיה','Пауза'));dialog.querySelector('#hop-message').innerHTML=paused?bi(pair('המשחק מושהה','Игра на паузе')):'';}
  function tick(now){
    if(!dialog)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!paused&&!finished){
      elapsed+=dt;velocity+=1200*dt;y=Math.min(0,y+velocity*dt);if(y===0)velocity=0;
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,speed=reduced?90:125;
      for(const o of objects){o.x-=speed*dt;if(!o.collected&&Math.abs(o.x-118)<30&&y< -42){o.collected=true;stars++;}if(!o.hit&&Math.abs(o.x-118)<27&&y> -28){o.hit=true;velocity=-240;}}
      dialog.querySelector('#hop-player').setAttribute('transform',`translate(118 ${252+y})`);
      dialog.querySelector('#hop-objects').innerHTML=objects.filter(o=>o.x> -30&&o.x<750).map(o=>`<g transform="translate(${o.x} 0)"><path d="M-16 270V251q0-8 8-8H8q8 0 8 8v19" fill="#e1ad78" stroke="#ac7b51" stroke-width="3"/>${o.collected?'':`<path d="m0 174 5 11 12 1-9 8 2 12-10-6-10 6 2-12-9-8 12-1z" fill="#f2b94b" stroke="#ba8732" stroke-width="2"/>`}</g>`).join('');
      dialog.querySelector('#hop-time').textContent=String(Math.max(0,Math.ceil(15-elapsed)));dialog.querySelector('#hop-score').textContent='★ '+stars;
      if(elapsed>=15){finished=true;dialog.querySelector('#hop-message').innerHTML=bi(pair(`איזה יופי! אספת ${stars} כוכבים. אפשר לחזור בקצב שלך.`,`Здорово! Собрано звёзд: ${stars}. Возвращайся, когда захочешь.`));dialog.querySelector('[data-hop="jump"]').disabled=true;dialog.querySelector('[data-hop="pause"]').disabled=true;dialog.querySelector('[data-hop="close"]').focus();}
    }
    if(!finished)frame=requestAnimationFrame(tick);
  }
  function close(){cancelAnimationFrame(frame);dialog?.close();dialog?.remove();dialog=null;last=0;trigger?.focus({preventScroll:true});}
  document.addEventListener('visibilitychange',()=>{if(dialog&&document.hidden&&!paused&&!finished)toggle();});
  window.addEventListener('blur',()=>{if(dialog&&!paused&&!finished)toggle();});
  return {open,close,jump,toggle,state:()=>({elapsed,stars,paused,finished,y,open:!!dialog})};
})();
