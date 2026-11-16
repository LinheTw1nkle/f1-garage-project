/* Continuous scroll control, following how-to-scrollytell's Lenis + scrub pattern. */
'use strict';
function bindRaceWeekendScroll(root,pages,chart,changedRace){
  const events=new AbortController(),signal=events.signal;
  const smooth=createGarageSmoothScroll(pages,panel,()=>panel.classList.contains('show')&&panel.classList.contains('race-position-view')&&!root.hidden);
  let height=0,frame=0,destroyed=false,trigger=null,tween=null;
  const state={progress:0};
  function fitSession(){
    for(const card of pages.querySelectorAll('.race-session-card[open]')){
      const summary=card.querySelector('.race-session-summary'),body=card.querySelector('.race-session-body');
      const available=Math.max(0,card.clientHeight-summary.offsetHeight);
      body.style.height=`${available}px`;body.style.maxHeight=`${available}px`;
    }
    smooth.resize();
  }
  function draw(){
    if(!height||destroyed)return;
    const position=pages.scrollTop/height;
    root.weekendScrollTop=pages.scrollTop;
    root.weekendChartProgress=state.progress;
    root.weekendChartVisible=position>.55&&position<2.95;
    root.chartSetScrollProgress?.(state.progress,root.weekendChartVisible);
    pages.dataset.page=position<.55?'sessions':position<2.55?'laps':'classification';
    for(const button of root.querySelectorAll('[data-race-chapter]')){
      if(button.dataset.raceChapter===pages.dataset.page)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');
    }
  }
  function update(){frame=0;ScrollTrigger.update();draw();}
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  const resize=new ResizeObserver(()=>{
    const next=pages.clientHeight;if(!next||next===height)return;
    const position=height?pages.scrollTop/height:(changedRace?0:(root.weekendScrollTop||0)/next);
    height=next;pages.style.setProperty('--race-page-height',`${height}px`);
    smooth.resize();smooth.scrollTo(position*height,{immediate:true});
    if(!tween){
      tween=gsap.fromTo(state,{progress:0},{progress:1,ease:'none',onUpdate:draw,scrollTrigger:{scroller:pages,trigger:pages.querySelector('.race-weekend-lap-stage'),start:'top top',end:'bottom bottom',scrub:true,invalidateOnRefresh:true}});
      trigger=tween.scrollTrigger;
    }
    trigger.refresh();update();fitSession();
  });resize.observe(pages);
  pages.addEventListener('scroll',schedule,{passive:true,signal});
  pages.addEventListener('toggle',fitSession,{capture:true,signal});
  const go=position=>smooth.scrollTo(Math.max(0,Math.min(3,position))*height);
  pages.addEventListener('keydown',event=>{
    if(!['PageDown','PageUp','Home','End'].includes(event.key)||event.target.closest('button,input,select,summary'))return;
    event.preventDefault();event.stopPropagation();
    if(event.key==='Home')go(0);else if(event.key==='End')go(3);
    else go(pages.scrollTop/height+(event.key==='PageDown'?1:-1));
  },{signal});
  pages.scrollTop=changedRace?0:root.weekendScrollTop||0;
  return{go,lenis:smooth.lenis,destroy(){destroyed=true;events.abort();resize.disconnect();cancelAnimationFrame(frame);trigger?.kill();tween?.kill();smooth.destroy();}};
}
