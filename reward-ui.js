/* Rewards appear only for completed sessions, with persistence independent of the current screen. */
window.RewardUI=(()=>{
  let previousXP=null,toastTimer=null,rankFocus=null,lastSummary=null,inerted=[];
  const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isSummary(){return !!document.querySelector('.journey-finish,.lg-course-summary,.atlas-summary')||screen==='end';}
  function afterRender(){
    if(!window.Rewards)return;
    const currentXP=data.xp||0,node=document.querySelector('[data-reward-xp]');
    if(node&&previousXP!=null&&currentXP!==previousXP&&!reduce()){
      const from=previousXP,start=performance.now();
      function tick(now){if(!node.isConnected)return;const t=Math.min(1,(now-start)/600);node.textContent=Math.round(from+(currentXP-from)*t)+' XP';if(t<1)requestAnimationFrame(tick);}
      requestAnimationFrame(tick);
    }
    previousXP=currentXP;
    if(isSummary()){
      const report=data.sessionReports?.at(-1);
      if(report&&!document.querySelector('.reward-summary')){
        const section=document.createElement('section');section.className='reward-summary';
        section.innerHTML=Rewards.renderEnvelope(data,report.id)+Rewards.renderCelebration(data,report.id)+Rewards.renderAlbum(data);
        document.getElementById('app').append(section);
        if(lastSummary!==report.id){lastSummary=report.id;window.Mishi?.onSummary(report.results);}
      }
    }
    const dialog=document.querySelector('.reward-rank-celebration');
    if(dialog){
      const active=document.activeElement;if(active&&active!==document.body&&active!==document.documentElement&&!dialog.contains(active))rankFocus=active;dialog.tabIndex=-1;dialog.focus({preventScroll:true});
      // A modal celebration is deliberately limited to the session summary.
      document.querySelectorAll('header,footer,#app > :not(.reward-summary),.reward-summary > :not(.reward-rank-celebration)').forEach(el=>{if(!el.inert){inerted.push(el);el.inert=true;}});
      window.GameSound?.play('rank');
      if(!reduce())dialog.querySelectorAll('.reward-confetti i').forEach((el,i)=>el.animate([{transform:'translate(0,-20px) rotate(0)',opacity:1},{transform:`translate(${(i%9-4)*22}px,${90+i%6*12}px) rotate(${i*29}deg)`,opacity:0}],{duration:1100+i%5*100,iterations:1,fill:'forwards'}));
    }
    if(!dialog&&inerted.length){inerted.forEach(el=>el.inert=false);inerted=[];}
    if(!dialog&&!document.querySelector('.reward-toast')){
      const badge=Rewards.consumeBadgeToast(data);
      if(badge){
        const def=Rewards.badgeDefs[badge],toast=document.createElement('div');toast.className='reward-toast';toast.setAttribute('role','status');toast.innerHTML=ico(def.icon)+ui(P(`תג חדש: ${def.name.he}`,`Новый значок: ${def.name.ru}`));document.body.append(toast);saveProgress();clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.remove(),3000);
      }
    }
  }
  document.addEventListener('keydown',event=>{
    const modal=document.querySelector('.reward-rank-celebration');if(!modal)return;
    if(event.key==='Tab'){event.preventDefault();modal.querySelector('button')?.focus();}
    if(event.key==='Escape'){event.preventDefault();modal.querySelector('[data-reward-action="dismiss-rank"]')?.click();}
  },true);
  document.addEventListener('click',event=>{
    if(!window.Rewards||typeof data==='undefined')return;
    const button=event.target.closest('[data-reward-action]');if(!button)return;
    if(!Rewards.handleClick(event,data))return;
    event.preventDefault();event.stopPropagation();
    inerted.forEach(el=>el.inert=false);inerted=[];
    const wasEnvelope=button.dataset.rewardAction==='envelope';saveProgress();render();
    if(wasEnvelope&&!reduce())document.querySelector('.reward-envelope')?.animate([{transform:'rotateY(-80deg)',opacity:.3},{transform:'rotateY(0)',opacity:1}],{duration:500});
    else if(rankFocus?.isConnected&&rankFocus.matches('button,a[href],input,select,textarea,[tabindex]')&&!rankFocus.disabled)rankFocus.focus({preventScroll:true});
    else (document.querySelector('.reward-envelope button')||document.querySelector('[data-action="home"]'))?.focus({preventScroll:true});
  },true);
  return {afterRender};
})();
