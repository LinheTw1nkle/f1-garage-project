/* Scrollytelling approach: Lenis + GSAP ScrollTrigger scrub.
 * Reference: mattseq/how-to-scrollytell, src/App.jsx and src/GsapAnims.jsx.
 * Scoped to each Garage scroll region; no global scroll takeover.
 */
'use strict';
gsap.registerPlugin(ScrollTrigger);
function createGarageSmoothScroll(viewport,owner,isActive){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const lenis=new Lenis({wrapper:viewport,content:viewport,eventsTarget:viewport,smoothWheel:!reduced.matches,lerp:.095,allowNestedScroll:true,autoRaf:false});
  let running=false,destroyed=false;
  const tick=time=>lenis.raf(time*1000);
  const changed=()=>ScrollTrigger.update();lenis.on('scroll',changed);
  function sync(){
    const active=!destroyed&&!document.hidden&&isActive();
    if(active===running)return;running=active;
    if(active){lenis.start();lenis.resize();gsap.ticker.add(tick);ScrollTrigger.update();}
    else{gsap.ticker.remove(tick);lenis.stop();}
  }
  const observer=new MutationObserver(sync);observer.observe(owner,{attributes:true,attributeFilter:['open','hidden','class']});
  document.addEventListener('visibilitychange',sync);
  const motionChanged=()=>{lenis.options.smoothWheel=!reduced.matches;lenis.scrollTo(viewport.scrollTop,{immediate:true,force:true});};
  reduced.addEventListener('change',motionChanged);sync();
  return{
    lenis,
    resize(){lenis.resize();sync();},
    scrollTo(top,options={}){lenis.scrollTo(top,{immediate:reduced.matches,duration:.85,force:true,...options});},
    destroy(){if(destroyed)return;destroyed=true;gsap.ticker.remove(tick);observer.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',motionChanged);lenis.off('scroll',changed);lenis.destroy();}
  };
}
function bindDriverScrollMotion(viewport,dialog){
  viewport.classList.add('driver-scroll-story');
  const smooth=createGarageSmoothScroll(viewport,dialog,()=>dialog.open&&viewport.isConnected);
  const tweens=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const reveal=(node,from,start='top 90%',end='top 35%')=>{
    if(!node||reduced.matches)return;
    tweens.push(gsap.fromTo(node,from,{opacity:1,x:0,y:0,scale:1,ease:'none',immediateRender:true,scrollTrigger:{trigger:node,scroller:viewport,start,end,scrub:true,invalidateOnRefresh:true}}));
  };
  const story=viewport.querySelector('.driver-editorial-story');
  reveal(story?.querySelector('blockquote,.driver-editorial-intro'),{opacity:.18,y:70,scale:.97});
  reveal(story?.querySelector('.driver-editorial-quote-author'),{opacity:.1,y:35},'top 95%','top 70%');
  reveal(viewport.querySelector('.driver-editorial-career-card'),{opacity:.2,x:-35,y:45});
  reveal(viewport.querySelector('.driver-editorial-biography'),{opacity:.2,x:25,y:65});
  viewport.querySelectorAll('.driver-timeline li').forEach(node=>reveal(node,{opacity:.15,y:35},'top 95%','top 65%'));
  let refreshFrame=0;
  const refresh=()=>{cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>{if(!viewport.isConnected||!dialog.open)return;smooth.resize();for(const tween of tweens)tween.scrollTrigger?.refresh();ScrollTrigger.update();});};
  const resize=new ResizeObserver(refresh);resize.observe(viewport);
  dialog.addEventListener('driver-profile-visible',refresh);
  const observer=new MutationObserver(refresh);observer.observe(dialog,{attributes:true,attributeFilter:['open']});
  document.fonts.ready.then(()=>{if(viewport.isConnected&&viewport.driverScrollMotion?.scrollTo)refresh();});
  return{scrollTo:smooth.scrollTo,destroy(){cancelAnimationFrame(refreshFrame);resize.disconnect();observer.disconnect();dialog.removeEventListener('driver-profile-visible',refresh);tweens.forEach(tween=>{tween.scrollTrigger?.kill();tween.kill();gsap.set(tween.targets(),{clearProps:'opacity,transform'});});smooth.destroy();viewport.classList.remove('driver-scroll-story');}};
}
