/* Presentation-only feedback. Existing game modules retain answer checking and persistence. */
window.ExerciseExperience = (() => {
  'use strict';
  const p=(he,ru)=>({he,ru});
  const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let lastRailPosition=null;
  function animate(element,frames,options){if(!reduce()&&element?.animate)return element.animate(frames,options);return null;}
  function keypad(){
    const input=document.querySelector('#answer');
    if(!input||!window.matchMedia?.('(pointer: coarse)').matches)return;
    input.inputMode='none';
    const card=input.closest('.task-shell')||input.parentElement;card.classList.add('has-touch-keypad');
    if(card.querySelector('.numeric-keypad')||input.disabled)return;
    const keys=document.createElement('div');keys.className='numeric-keypad';keys.dir='ltr';keys.setAttribute('role','group');keys.setAttribute('aria-label',typeof text==='function'?text(p('מקלדת מספרים','Цифровая клавиатура')):'');
    const labels=[...'123456789','delete','0','check'];
    keys.innerHTML=labels.map(key=>{
      const label=key==='delete'?p('מחיקה','Удалить'):key==='check'?p('בדיקה','Проверить'):p(key,key);
      return `<button type="button" data-keypad-key="${key}"${key==='check'?' class="primary keypad-check"':''} aria-label="${typeof esc==='function'?esc(text(label)):label.he}">${key==='delete'?'⌫':key==='check'?(typeof ui==='function'?ui(label):'✓'):key}</button>`;
    }).join('');
    input.insertAdjacentElement('afterend',keys);
    syncKeypad();
  }
  function syncKeypad(){const input=document.querySelector('#answer'),keys=document.querySelector('.numeric-keypad');if(!input||!keys)return;const check=keys.querySelector('[data-keypad-key="check"]');check.disabled=input.disabled||!input.value.trim();keys.querySelector('[data-keypad-key="delete"]').disabled=input.disabled||!input.value;}
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-keypad-key]');if(!button)return;
    const input=document.querySelector('#answer');if(!input||input.disabled)return;
    const key=button.dataset.keypadKey;
    if(key==='check'){document.querySelector('[data-action="check"]')?.click();return;}
    // Input stays editable for hardware keyboards; clicking tiles never summons the system keyboard.
    input.value=key==='delete'?input.value.slice(0,-1):input.value+key;
    input.dispatchEvent(new Event('input',{bubbles:true}));syncKeypad();
  });
  document.addEventListener('input',event=>{if(event.target.id==='answer')syncKeypad();});
  function afterRender(){
    keypad();
    // A mixed station has one skip action: the icon in its toolbar. Native game pages keep their own.
    const mixed=document.querySelector('.mixed-session');
    if(mixed?.querySelector('[data-session-action="skip"]'))for(const button of mixed.querySelectorAll('[data-action="skip"],[data-lg-action="skip"],[data-atlas-action="skip"]'))button.hidden=true;
    window.Mishi?.afterRender();
    const rail=document.querySelector('.passport-mini-stations[data-current-position]');
    if(rail){const position=Number(rail.dataset.currentPosition),token=rail.querySelector('.passport-mishi-token');if(lastRailPosition!=null&&position>lastRailPosition&&token)animate(token,[{transform:'translateY(-3px)'},{transform:'translateY(-12px)',offset:.45},{transform:'translateY(-3px)'}],{duration:350,easing:'cubic-bezier(.3,1.4,.5,1)'});lastRailPosition=position;}else lastRailPosition=null;
  }
  function onAnswer(ok,{xp=0,streak=0}={}){
    window.GameSound?.play(ok?'correct':'wrong');window.Mishi?.onAnswer(ok,{xp,streak});
    const card=document.querySelector('.task-shell,.lg-task-card,.atlas-question-card');
    if(ok){
      animate(card,[{boxShadow:'0 0 0 0 transparent'},{boxShadow:`0 0 0 3px ${getComputedStyle(document.documentElement).getPropertyValue('--success').trim()||'currentColor'}`,offset:.25},{boxShadow:'0 0 0 0 transparent'}],{duration:600,easing:'ease-out'});
      const amount=card?.querySelector('.xp-pop,.lg-xp,.atlas-xp');const target=document.querySelector('.reward-rank,.rewards-rank,.rank-progress,.hud-pill');
      if(xp>0&&amount&&target&&!reduce()){
        const a=amount.getBoundingClientRect(),b=target.getBoundingClientRect();
        animate(amount,[{transform:'translate(0,0)',opacity:1},{transform:`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height/2-a.top}px)`,opacity:0}],{duration:600,easing:'ease-in',fill:'none'});
      }
      if([3,5,10].includes(streak))animate(document.querySelector('.combo'),[{transform:'scale(1)'},{transform:'scale(1.25)',offset:.5},{transform:'scale(1)'}],{duration:500,easing:'ease-out'});
    }else animate(card?.querySelector('.answer,.options,.atlas-options,.lg-task-card h2')||card,[{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:300,easing:'ease-in-out'});
  }
  function onHint(){requestAnimationFrame(()=>{const hint=document.querySelector('.hint,.lg-task-hint,.atlas-hint');animate(hint,[{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:250,easing:'ease-out'});});}
  return {afterRender,onAnswer,onHint,syncKeypad};
})();
