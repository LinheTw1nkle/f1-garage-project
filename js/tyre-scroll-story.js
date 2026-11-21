/* Motion reference: Dieg0arc/3D-scrolling-practice. Fixed Garage stage with virtual scroll. */
'use strict';
function bindTyreScrollStory(root,stage,renderer){
 const viewport=panel.querySelector('.panel-body'),visual=stage.querySelector('.tyre-guide-visual');
 const copy=stage.querySelector('.tyre-catalogue-copy'),facts=copy.querySelector('.tyre-catalogue-facts'),controls=visual.querySelector('.tyre-model-controls');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:700px)');
 const events=new AbortController(),headlines={H:['BUILT FOR','THE DISTANCE'],M:['FIND THE','BALANCE'],S:['GRIP OVER','LONGEVITY'],I:['WHEN THE','TRACK CHANGES'],W:['MADE FOR','THE WET']};
 const pose={yaw:0},playhead={value:0};
 let destroyed=false,timeline=null,scrollTween=null,target=0,touch=null,marquee,mask,statement,features,chars=[],lines=[],wordAnimations=[],wordVersion=0;
 const element=(tag,className)=>{const node=document.createElement(tag);node.className=className;return node;};
 function cancelWords(){wordVersion++;wordAnimations.forEach(animation=>animation.cancel());wordAnimations=[];}
 function updateCompound(id,immediate=false){
  if(!lines.length)return;
  const words=headlines[id]||headlines.S,nodes=lines.map(line=>line.firstElementChild);
  const visible=!immediate&&!reduced.matches&&parseFloat(getComputedStyle(statement).opacity)>.1&&playhead.value>.32&&playhead.value<.8;
  const starts=nodes.map(node=>({opacity:getComputedStyle(node).opacity,transform:getComputedStyle(node).transform}));
  cancelWords();const version=wordVersion;
  if(!visible){nodes.forEach((node,index)=>node.textContent=words[index]);return;}
  wordAnimations=nodes.map((node,index)=>node.animate([starts[index],{opacity:0,transform:'translateY(-6px)'}],{duration:140,easing:'ease-in',fill:'forwards'}));
  Promise.all(wordAnimations.map(animation=>animation.finished)).then(()=>{
   if(destroyed||version!==wordVersion)return;
   wordAnimations.forEach(animation=>animation.cancel());nodes.forEach((node,index)=>node.textContent=words[index]);
   wordAnimations=nodes.map((node,index)=>node.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,delay:index*35,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
  }).catch(()=>{});
 }
 function paint(){
  if(!timeline||destroyed)return;
  timeline.progress(playhead.value);root.dataset.storyProgress=playhead.value.toFixed(4);
  visual.style.pointerEvents=playhead.value>.86?'auto':'none';
 }
 function scrollTo(progress,{immediate=false}={}){
  if(!timeline||destroyed)return;target=Math.max(0,Math.min(1,progress));scrollTween?.kill();
  if(immediate){playhead.value=target;paint();return;}
  scrollTween=gsap.to(playhead,{value:target,duration:.65,ease:'power2.out',overwrite:true,onUpdate:paint});
 }
 function advance(pixels){scrollTo(target+pixels/(Math.max(300,stage.clientHeight)*4));}
 function unmount(){
  scrollTween?.kill();scrollTween=null;cancelWords();timeline?.kill();timeline=null;
  if(!marquee)return;
  gsap.set([visual,copy,facts,controls,...facts.children],{clearProps:'transform,opacity,visibility'});
  for(const divider of facts.querySelectorAll('.tyre-story-divider'))divider.remove();
  copy.append(facts);visual.append(controls);marquee.remove();mask.remove();statement.remove();features.remove();
  marquee=null;chars=[];lines=[];stage.classList.remove('tyre-scroll-stage');visual.style.removeProperty('pointer-events');
  stage.removeAttribute('tabindex');stage.removeAttribute('aria-label');delete root.dataset.storyProgress;renderer.setScrollPose?.(0);
 }
 function mount(){
  if(destroyed||reduced.matches)return;
  stage.classList.add('tyre-scroll-stage');stage.tabIndex=0;stage.setAttribute('aria-label','Tyre presentation. Scroll or use Page Down and Page Up to explore.');
  marquee=element('div','tyre-story-marquee');const heading=element('h2','');heading.setAttribute('aria-label','Tyres in motion');
  for(const character of 'TYRES IN MOTION · TYRES IN MOTION'){
   const clip=element('span','tyre-story-char'),letter=element('span','');letter.textContent=character===' '?'\u00a0':character;clip.setAttribute('aria-hidden','true');clip.append(letter);heading.append(clip);chars.push(letter);
  }
  marquee.append(heading);mask=element('div','tyre-story-mask');mask.setAttribute('aria-hidden','true');
  statement=element('div','tyre-story-statement');statement.setAttribute('aria-hidden','true');
  for(let i=0;i<2;i++){const clip=element('span','tyre-story-line'),line=element('span',''),word=element('span','tyre-story-word');line.append(word);clip.append(line);statement.append(clip);lines.push(line);}
  features=element('aside','tyre-story-features');features.setAttribute('aria-label','Tyre characteristics');features.append(facts);
  for(const row of facts.children){const divider=element('span','tyre-story-divider');divider.setAttribute('aria-hidden','true');row.prepend(divider);}
  stage.append(marquee,mask,statement,features,controls);updateCompound(root.dataset.compound||'S',true);
  const dividers=[...facts.querySelectorAll('.tyre-story-divider')];
  gsap.set(chars,{yPercent:0});gsap.set(marquee,{xPercent:0});gsap.set(mask,{clipPath:'circle(0% at 50% 50%)'});
  gsap.set(statement,{xPercent:12,autoAlpha:0});gsap.set(lines,{yPercent:35,opacity:0});gsap.set([copy,features,controls],{autoAlpha:0});
  gsap.set(dividers,{scaleX:0});gsap.set(facts.children,{opacity:0,y:20});gsap.set(visual,{xPercent:0,yPercent:0,scale:1});pose.yaw=0;
  timeline=gsap.timeline({paused:true});
  timeline.to(marquee,{xPercent:-50,ease:'power1.inOut',duration:2.2},.15)
   .to(pose,{yaw:Math.PI*2,ease:'none',duration:4.15,onUpdate:()=>renderer.setScrollPose?.(pose.yaw)},2.1)
   .to(mask,{clipPath:'circle(150% at 50% 50%)',ease:'power2.inOut',duration:1.6},2.1)
   .to(statement,{xPercent:0,autoAlpha:1,ease:'power2.out',duration:1.1},2.7)
   .to(lines,{yPercent:0,opacity:1,stagger:.12,ease:'power2.out',duration:1.15},2.85)
   .to(lines,{yPercent:-18,opacity:0,stagger:.07,ease:'power2.inOut',duration:.85},4.85)
   .to(statement,{xPercent:-10,autoAlpha:0,ease:'power2.inOut',duration:1},4.95)
   .to([copy,features],{autoAlpha:1,duration:.55,ease:'power2.out'},6)
   .to(visual,{xPercent:mobile.matches?30:0,yPercent:mobile.matches?-10:-12,scale:mobile.matches?.64:.72,ease:'power2.inOut',duration:.9},6)
   .to(dividers,{scaleX:1,stagger:.1,ease:'power3.out',duration:.5},6.25)
   .to(facts.children,{opacity:1,y:0,stagger:.1,ease:'power3.out',duration:.6},6.5)
   .fromTo(copy,{y:20},{y:0,ease:'power3.out',duration:.6},6.5)
   .to(controls,{autoAlpha:1,ease:'power3.out',duration:.6},7);
  paint();
 }
 function rebuild(){unmount();mount();target=playhead.value;paint();}
 viewport.addEventListener('wheel',event=>{
  if(!timeline||event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  if(event.cancelable)event.preventDefault();event.stopPropagation();advance(event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1));
 },{passive:false,signal:events.signal});
 viewport.addEventListener('touchstart',event=>{
  if(!timeline||event.touches.length!==1||event.target.closest('button,input,select')||(playhead.value>.86&&event.target.closest('.tyre-material-stage')))return;
  touch={x:event.touches[0].clientX,y:event.touches[0].clientY};
 },{passive:true,signal:events.signal});
 viewport.addEventListener('touchmove',event=>{
  if(!touch||event.touches.length!==1)return;const p=event.touches[0],dy=touch.y-p.clientY;
  if(event.cancelable)event.preventDefault();event.stopPropagation();advance(dy);touch={x:p.clientX,y:p.clientY};
 },{passive:false,signal:events.signal});
 for(const type of['touchend','touchcancel'])viewport.addEventListener(type,()=>{touch=null;},{passive:true,signal:events.signal});
 viewport.addEventListener('keydown',event=>{
  if(!timeline||event.defaultPrevented||event.target.closest('input,button,select,textarea,[contenteditable]'))return;
  const delta={PageDown:.18,PageUp:-.18,ArrowDown:.035,ArrowUp:-.035,' ':event.shiftKey?-.18:.18}[event.key];
  if(delta===undefined&&event.key!=='Home'&&event.key!=='End')return;
  event.preventDefault();scrollTo(event.key==='Home'?0:event.key==='End'?1:target+delta);
 },{signal:events.signal});
 reduced.addEventListener('change',rebuild);mobile.addEventListener('change',rebuild);mount();
 return{updateCompound,scrollTo,get progress(){return playhead.value;},get active(){return !!timeline;},destroy(){if(destroyed)return;destroyed=true;events.abort();reduced.removeEventListener('change',rebuild);mobile.removeEventListener('change',rebuild);unmount();}};
}
