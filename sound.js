/* Tiny synthesized motifs. Audio starts only after a trusted user gesture. */
window.GameSound = (() => {
  'use strict';
  let context=null,unlocked=false;
  function enabled(){return typeof data!=='undefined'&&data.sound!==false&&!window.speechSynthesis?.speaking;}
  function unlock(event){
    if(event&&event.isTrusted===false)return false;
    unlocked=true;
    if(!enabled())return false;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;context ||= new Audio();if(context.state==='suspended')context.resume().catch(()=>{});return true;}catch(_){return false;}
  }
  function play(kind){
    if(!unlocked||!enabled()||!context||context.state!=='running')return false;
    const notes=kind==='rank'?[440,554.37,659.25,880]:kind==='wrong'?[293.66]:kind==='correct'?[659.25,880]:null;
    if(!notes)return false;
    const duration=kind==='wrong'?.15:kind==='rank'?.11:.09;
    try{notes.forEach((frequency,index)=>{
      const start=context.currentTime+index*duration,osc=context.createOscillator(),gain=context.createGain();
      osc.type='triangle';osc.frequency.value=frequency;
      gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(kind==='wrong'?.025:.055,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
      osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.01);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};
    });return true;}catch(_){return false;}
  }
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true,passive:true});
  return {unlock,play,get ready(){return unlocked&&context?.state==='running';}};
})();
