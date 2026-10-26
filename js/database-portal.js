'use strict';

function createDatabasePortal(onOpen){
  const root=document.getElementById('databasePortal'),stage=root.querySelector('.database-portal-stage'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const modules=[
    {key:'Frontwing',title:'CIRCUITS',images:['img/bahrain-circuit-aerial.webp','img/monaco-f1-panorama.webp','img/singapore-circuit-panorama.webp','img/suzuka-f1-panorama.webp','img/spa-f1-panorama.webp','img/silverstone-circuit-panorama.webp','img/lasVegas-f1-panorama.webp']},
    {key:'Cockpit',title:'DRIVERS & TEAMS',images:['img/team-logos/ferrari-color.webp','img/team-logos/mclaren-color.webp','img/team-logos/redbullracing-color.webp','img/team-logos/mercedes-color.webp','img/team-drivers/charles-leclerc-photo.webp','img/team-drivers/lando-norris-photo.webp','img/team-drivers/max-verstappen-photo.webp']},
    {key:'Sidepod',title:'SEASON OVERVIEW',images:['img/database-previews/season-start-australia.webp','img/database-previews/season-start-china.webp','img/database-previews/season-start-grid.webp','img/database-previews/season-parc-ferme.webp','img/database-previews/season-grid-crew.webp','img/database-previews/season-grid-lineup.webp']},
    {key:'Rearwing',title:'RACE RESULTS',images:['img/database-previews/podium-australia.webp','img/database-previews/podium-china.webp','img/database-previews/podium-japan.webp','img/database-previews/podium-monaco.webp','img/database-previews/podium-canada.webp','img/database-previews/podium-belgium.webp']},
    {key:'Tire',title:'TYRE GUIDE',images:['img/database-previews/tyre-wet-tread.webp','img/database-previews/tyre-stack-wet.webp','img/database-previews/tyre-blankets.webp','img/database-previews/tyre-aston-close.webp','img/database-previews/season-pit-mercedes.webp','img/database-previews/season-pit-track.webp','img/database-previews/tyre-compounds.webp']}
  ];
  const layoutSets=[
    [{x:'2%',y:'17%',w:'13vw',h:'13vh',d:.75},{x:'84%',y:'10%',w:'12vw',h:'16vh',d:1.05},{x:'7%',y:'71%',w:'11vw',h:'15vh',d:.9},{x:'79%',y:'67%',w:'14vw',h:'14vh',d:1.15},{x:'27%',y:'7%',w:'10vw',h:'12vh',d:.55},{x:'59%',y:'77%',w:'11vw',h:'13vh',d:.7},{x:'35%',y:'79%',w:'9vw',h:'11vh',d:.5}],
    [{x:'4%',y:'9%',w:'11vw',h:'16vh',d:.8},{x:'82%',y:'13%',w:'12vw',h:'15vh',d:1.05},{x:'2%',y:'60%',w:'13vw',h:'18vh',d:.7},{x:'85%',y:'63%',w:'11vw',h:'17vh',d:1.15},{x:'21%',y:'74%',w:'10vw',h:'14vh',d:.55},{x:'67%',y:'6%',w:'10vw',h:'13vh',d:.7},{x:'71%',y:'75%',w:'9vw',h:'14vh',d:.6}],
    [{x:'1%',y:'18%',w:'14vw',h:'13vh',d:.7},{x:'84%',y:'8%',w:'13vw',h:'14vh',d:1.1},{x:'4%',y:'69%',w:'12vw',h:'14vh',d:.85},{x:'82%',y:'69%',w:'14vw',h:'15vh',d:1.2},{x:'23%',y:'7%',w:'9vw',h:'12vh',d:.55},{x:'63%',y:'76%',w:'10vw',h:'13vh',d:.7}],
    [{x:'3%',y:'10%',w:'10vw',h:'16vh',d:.8},{x:'86%',y:'12%',w:'11vw',h:'16vh',d:1.1},{x:'6%',y:'68%',w:'11vw',h:'16vh',d:.75},{x:'82%',y:'67%',w:'12vw',h:'16vh',d:1.2},{x:'24%',y:'5%',w:'9vw',h:'14vh',d:.55},{x:'65%',y:'76%',w:'10vw',h:'14vh',d:.7}],
    [{x:'2%',y:'12%',w:'13vw',h:'15vh',d:.75},{x:'84%',y:'8%',w:'12vw',h:'14vh',d:1.05},{x:'5%',y:'69%',w:'12vw',h:'16vh',d:.85},{x:'81%',y:'67%',w:'13vw',h:'16vh',d:1.15},{x:'24%',y:'7%',w:'9vw',h:'12vh',d:.55},{x:'63%',y:'76%',w:'11vw',h:'13vh',d:.7},{x:'36%',y:'80%',w:'9vw',h:'12vh',d:.5}]
  ];
  const wordAngles=['-1.7deg','1.1deg','-1deg','1.5deg','-.8deg'];
  let visible=false,active=-1,selected=-1,detailIndex=-1,parallaxFrame=0,moduleTimer=0,transitioning=false,switchVersion=0;
  let pointerTargetX=0,pointerTargetY=0,pointerX=0,pointerY=0;
  const words=[],groups=[],previewImages=[],runningAnimations=new Set();
  const waitFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  function animateElement(element,keyframes,options){
    if(reduced.matches)return Promise.resolve();
    const animation=element.animate(keyframes,{fill:'both',...options});runningAnimations.add(animation);
    return animation.finished.catch(()=>{}).finally(()=>runningAnimations.delete(animation));
  }
  function cancelAnimations(){for(const animation of runningAnimations)animation.cancel();runningAnimations.clear();}
  function build(){
    const list=document.createElement('ul');list.className='database-word-list';
    const previews=document.createElement('div');previews.className='database-preview-layer';previews.setAttribute('aria-hidden','true');
    modules.forEach((module,moduleIndex)=>{
      const item=document.createElement('li');item.className='database-word-item';
      const button=document.createElement('button');button.type='button';button.className='database-word';button.dataset.module=module.key;button.style.setProperty('--word-rotation',wordAngles[moduleIndex]);button.textContent=module.title;button.setAttribute('aria-label',`Preview ${module.title}`);button.setAttribute('aria-pressed','false');item.append(button);list.append(item);words.push(button);
      const group=document.createElement('div');group.className='database-preview-group';group.dataset.module=module.key;
      module.images.forEach((source,index)=>{const layout=layoutSets[moduleIndex][index],figure=document.createElement('figure'),cx=parseFloat(layout.x)+parseFloat(layout.w)/2,cy=parseFloat(layout.y)+parseFloat(layout.h)/2,rx=(cy<50?-1:1)*(2.5+Math.abs(cy-50)*.07),ry=(cx<50?1:-1)*(4+Math.abs(cx-50)*.1),tz=-560+Math.abs(cx-50)*7;figure.className='database-preview-card';figure.style.cssText=`--x:${layout.x};--y:${layout.y};--w:${layout.w};--h:${layout.h};--depth:${layout.d};--rx:${rx.toFixed(2)}deg;--ry:${ry.toFixed(2)}deg;--tz:${tz.toFixed(0)}px;--order:${index};--delay:${index*26}`;const image=document.createElement('img');image.src=source;image.alt='';image.loading='eager';image.decoding='async';image.fetchPriority='high';previewImages.push(image);figure.append(image);group.append(figure);});
      previews.append(group);groups.push(group);
      button.addEventListener('click',()=>select(moduleIndex));
    });
    stage.append(previews,list);
  }
  async function preload(){
    const sources=[...new Set(modules.flatMap(module=>module.images))];
    await Promise.allSettled([document.fonts?.load("82px 'Garage Anton'"),...sources.map(source=>{cachedImage(source);return imageResourceCache.get(source)?.ready;})]);
    await Promise.allSettled(previewImages.map(image=>image.decode?.()));
    if(!visible){
      const previousOpacity=root.style.opacity,previousPointerEvents=root.style.pointerEvents;
      root.hidden=false;root.classList.add('is-preloading');root.style.opacity='.001';root.style.pointerEvents='none';groups.forEach(group=>group.classList.add('is-active'));
      stage.getBoundingClientRect();for(const element of [...words,...groups,...groups.flatMap(group=>[...group.children]),...previewImages])element.getBoundingClientRect();
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      groups.forEach(group=>group.classList.remove('is-active'));root.classList.remove('is-preloading');root.style.opacity=previousOpacity;root.style.pointerEvents=previousPointerEvents;root.hidden=true;
    }
    root.dataset.ready='true';
  }
  function updateWords(){words.forEach((word,index)=>{const chosen=index===selected;word.classList.toggle('is-selected',chosen);word.setAttribute('aria-pressed',String(chosen));word.setAttribute('aria-label',`${chosen?'Open':'Preview'} ${modules[index].title}`);});}
  const baseCardTransform='translate3d(var(--mouse-x),var(--mouse-y),var(--tz)) rotateX(var(--rx)) rotateY(var(--ry)) scale(1)';
  const cardOffset=(sign,distance,stretch=true)=>`translate3d(var(--mouse-x),calc(var(--mouse-y) + ${sign*distance}px),var(--tz)) rotateX(var(--rx)) rotateY(var(--ry)) scale(${stretch?'.58,1.42':'1'})`;
  async function showPreview(index){
    if(!visible||index===active)return;
    const version=++switchVersion,previous=active,direction=previous<0||index>previous?1:-1,old=previous>=0?groups[previous]:null,next=groups[index];
    active=index;old?.classList.add('is-exiting');next.classList.add('is-active');
    const outgoing=old?[...old.children].map((card,i)=>animateElement(card,[{transform:baseCardTransform,opacity:.84},{offset:.46,transform:cardOffset(-direction,70),opacity:.5},{transform:cardOffset(-direction,innerHeight+card.offsetHeight+120),opacity:0}],{duration:760,delay:i*22,easing:'cubic-bezier(.76,0,.24,1)'})):[];
    const incoming=[...next.children].map((card,i)=>animateElement(card,[{transform:cardOffset(direction,innerHeight+card.offsetHeight+120),opacity:0},{offset:.48,transform:cardOffset(direction,65),opacity:.5},{transform:baseCardTransform,opacity:.84}],{duration:820,delay:i*24,easing:'cubic-bezier(.16,1,.3,1)'}));
    await Promise.all([...outgoing,...incoming]);if(version!==switchVersion)return;
    old?.classList.remove('is-active','is-exiting');next.classList.add('is-active');for(const card of [...(old?.children||[]),...next.children])card.getAnimations().forEach(animation=>animation.cancel());startParallax();
  }
  function clearPreview(){switchVersion++;cancelAnimations();groups.forEach(group=>group.classList.remove('is-active','is-exiting'));active=-1;}
  async function select(index){
    if(transitioning)return;
    if(selected!==index){selected=index;updateWords();transitioning=true;await showPreview(index);transitioning=false;return;}
    transitioning=true;detailIndex=index;cancelAnimations();document.body.classList.add('database-detail-transition');
    const initialClip='inset(49.5% 49.5% 49.5% 49.5% round 18px)';panel.style.clipPath=initialClip;panel.style.opacity='.96';await Promise.resolve(onOpen(modules[index].key));await waitFrame();
    document.getElementById('particleEarth')?.refreshParticleEarth?.();
    const cards=[...groups[index].children],cardExit=cards.map(card=>animateElement(card,[{transform:baseCardTransform,opacity:.84},{transform:'translate3d(var(--mouse-x),var(--mouse-y),0) rotateX(0deg) rotateY(0deg) scale(.06)',opacity:0}],{duration:720,easing:'cubic-bezier(.55,.055,.675,.19)'}));
    const wordExit=words.map((word,i)=>animateElement(word,[{opacity:i===index?1:.25,transform:`translate3d(0,0,0) rotate(${wordAngles[i]}) scale(1)`},{transform:`translate3d(0,0,0) rotate(${wordAngles[i]}) scale(.08)`,opacity:0}],{duration:720,easing:'cubic-bezier(.55,.055,.675,.19)'}));
    const panelIn=animateElement(panel,[{clipPath:initialClip,opacity:.96},{offset:.18,clipPath:'inset(45% 44% 45% 44% round 14px)',opacity:1},{clipPath:'inset(0% 0% 0% 0% round 0px)',opacity:1}],{duration:720,easing:'cubic-bezier(.55,.055,.675,.19)'});
    await Promise.all([...cardExit,...wordExit,panelIn]);for(const element of [...cards,...words,panel])element.getAnimations().forEach(animation=>animation.cancel());panel.style.removeProperty('clip-path');panel.style.removeProperty('opacity');panel.style.removeProperty('transform');panel.style.removeProperty('transform-origin');document.getElementById('particleEarth')?.refreshParticleEarth?.();clearPreview();root.hidden=false;root.className='database-portal is-visible is-detail-background';document.body.classList.remove('database-detail-transition');document.body.classList.add('database-portal-active');transitioning=false;
  }
  function startParallax(){
    if(parallaxFrame)return;
    const tick=()=>{parallaxFrame=0;pointerX+=(pointerTargetX-pointerX)*.14;pointerY+=(pointerTargetY-pointerY)*.14;if(active>=0){for(const card of groups[active].children){const depth=Number(card.style.getPropertyValue('--depth'))||1;card.style.setProperty('--mouse-x',`${pointerX*30*depth}px`);card.style.setProperty('--mouse-y',`${pointerY*22*depth}px`);}}if(Math.abs(pointerTargetX-pointerX)+Math.abs(pointerTargetY-pointerY)>.002)parallaxFrame=requestAnimationFrame(tick);};
    parallaxFrame=requestAnimationFrame(tick);
  }
  function move(event){
    if(!visible)return;pointerTargetX=event.clientX/innerWidth-.5;pointerTargetY=event.clientY/innerHeight-.5;startParallax();
  }
  function resetSelection(){selected=-1;clearPreview();updateWords();}
  function restoreTitleScreen(){
    clearTimeout(moduleTimer);cancelAnimations();visible=true;transitioning=false;selected=-1;active=-1;root.hidden=false;root.style.opacity='';root.style.pointerEvents='';root.className='database-portal is-visible';document.body.classList.add('database-portal-active');document.body.classList.remove('database-detail-transition');
    groups.forEach(group=>group.classList.remove('is-active','is-exiting'));words.forEach(word=>{word.getAnimations().forEach(animation=>animation.cancel());word.style.removeProperty('opacity');word.style.removeProperty('transform');});panel.getAnimations().forEach(animation=>animation.cancel());panel.style.removeProperty('clip-path');panel.style.removeProperty('transform');panel.style.removeProperty('opacity');panel.style.removeProperty('transform-origin');updateWords();
  }
  function show(){
    if(panel.classList.contains('show')||visible)return;clearTimeout(moduleTimer);resetSelection();visible=true;root.hidden=false;root.className='database-portal is-visible is-module-entering';document.body.classList.add('database-portal-active');moduleTimer=setTimeout(()=>root.classList.remove('is-module-entering'),reduced.matches?0:650);
  }
  function hide(animate=true){
    if(!visible||root.classList.contains('is-module-leaving'))return;const fromDetail=root.classList.contains('is-detail-background');clearTimeout(moduleTimer);clearPreview();if(animate&&!reduced.matches){transitioning=true;root.className=`database-portal is-visible is-module-leaving${fromDetail?' is-from-detail':''}`;moduleTimer=setTimeout(()=>{visible=false;transitioning=false;root.hidden=true;root.className='database-portal';document.body.classList.remove('database-portal-active');},560);}else{visible=false;transitioning=false;root.className='database-portal';root.hidden=true;document.body.classList.remove('database-portal-active');}
  }
  async function prepareReturn(){
    if(databaseToggle.getAttribute('aria-pressed')!=='true')return;
    clearTimeout(moduleTimer);cancelAnimations();transitioning=true;visible=true;
    selected=-1;active=-1;root.hidden=false;root.style.opacity='';root.style.pointerEvents='';root.className='database-portal is-visible is-detail-returning';document.body.classList.add('database-portal-active','database-detail-transition');groups.forEach(group=>group.classList.remove('is-active','is-exiting'));updateWords();
    const initialClip='inset(49.5% 49.5% 49.5% 49.5% round 18px)';
    panel.style.clipPath='inset(0% 0% 0% 0% round 0px)';panel.style.opacity='1';await waitFrame();
    if(!reduced.matches){
      const wordReturn=words.map((word,i)=>animateElement(word,[{transform:`translate3d(0,0,0) rotate(${wordAngles[i]}) scale(.08)`,opacity:0},{transform:`translate3d(0,0,0) rotate(${wordAngles[i]}) scale(1)`,opacity:1}],{duration:720,easing:'cubic-bezier(.325,.81,.45,.945)'}));
      const panelOut=animateElement(panel,[{clipPath:'inset(0% 0% 0% 0% round 0px)',opacity:1},{offset:.82,clipPath:'inset(45% 44% 45% 44% round 14px)',opacity:1},{clipPath:initialClip,opacity:.96}],{duration:720,easing:'cubic-bezier(.325,.81,.45,.945)'});
      await Promise.all([...wordReturn,panelOut]);
    }
  }
  function completeReturn(){detailIndex=-1;restoreTitleScreen();}
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',()=>{pointerTargetX=0;pointerTargetY=0;startParallax();});
  const databaseToggle=document.getElementById('partsToggle'),panel=document.getElementById('panel');
  new MutationObserver(()=>{if(databaseToggle.getAttribute('aria-pressed')!=='true')hide();}).observe(databaseToggle,{attributes:true,attributeFilter:['aria-pressed']});
  new MutationObserver(()=>{if(!panel.classList.contains('show')&&databaseToggle.getAttribute('aria-pressed')==='true'&&(root.hidden||!root.classList.contains('is-visible')||root.classList.contains('is-detail-background')))restoreTitleScreen();}).observe(panel,{attributes:true,attributeFilter:['class']});
  build();const ready=preload();return{show,hide,prepareReturn,completeReturn,preload,ready,get visible(){return visible;}};
}
