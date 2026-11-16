'use strict';

function createDatabasePortal(onOpen){
  const root=document.getElementById('databasePortal'),stage=root.querySelector('.database-portal-stage'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const modules=[
    {key:'Frontwing',title:'CIRCUITS',images:['img/bahrain-circuit-aerial.webp','img/monaco-f1-panorama.webp','img/singapore-circuit-panorama.webp','img/suzuka-f1-panorama.webp','img/spa-f1-panorama.webp','img/silverstone-circuit-panorama.webp','img/lasVegas-f1-panorama.webp']},
    {key:'Cockpit',title:'DRIVERS & TEAMS',images:['img/driver-front-portraits/norris.webp','img/driver-front-portraits/russell.webp','img/driver-front-portraits/leclerc.webp','img/driver-front-portraits/verstappen.webp']},
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
  const wordAngles=['-.5deg','.4deg','-.3deg','.5deg','-.3deg'];
  let visible=false,active=-1,selected=-1,detailIndex=-1,parallaxFrame=0,moduleTimer=0,transitioning=false,switchVersion=0,detailVersion=0;
  const hoverCapable=matchMedia('(hover: hover) and (pointer: fine)'),previewAnimations=new Map();
  let hoverTimer=0,leaveTimer=0,hovered=-1;
  const canPreview=()=>visible&&!transitioning&&!panel.classList.contains('show')&&!root.classList.contains('is-module-leaving');
  function cancelHover(){clearTimeout(hoverTimer);clearTimeout(leaveTimer);hovered=-1;}
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
      module.images.slice(0,4).forEach((source,index)=>{const layout=layoutSets[moduleIndex][index],figure=document.createElement('figure'),cx=parseFloat(layout.x)+parseFloat(layout.w)/2,cy=parseFloat(layout.y)+parseFloat(layout.h)/2,rx=(cy<50?-1:1)*(2.5+Math.abs(cy-50)*.07),ry=(cx<50?1:-1)*(4+Math.abs(cx-50)*.1),tz=-560+Math.abs(cx-50)*7;figure.className='database-preview-card';figure.style.cssText=`--x:${layout.x};--y:${layout.y};--w:${layout.w};--h:${layout.h};--depth:${layout.d};--rx:${rx.toFixed(2)}deg;--ry:${ry.toFixed(2)}deg;--tz:${tz.toFixed(0)}px;--order:${index};--delay:${index*26}`;const image=document.createElement('img');image.src=source;image.alt='';image.loading='eager';image.decoding='async';image.fetchPriority='high';previewImages.push(image);figure.append(image);group.append(figure);});
      previews.append(group);groups.push(group);
      button.addEventListener('pointerenter',event=>{
        if(event.pointerType!=='mouse'||!hoverCapable.matches||!canPreview())return;
        clearTimeout(hoverTimer);clearTimeout(leaveTimer);hovered=moduleIndex;
        hoverTimer=setTimeout(()=>{if(hovered===moduleIndex&&canPreview())preview(moduleIndex);},90);
      });
      button.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);hovered=-1;});
      button.addEventListener('focus',()=>{if(button.matches(':focus-visible')&&canPreview()){cancelHover();preview(moduleIndex);}});
      button.addEventListener('click',event=>select(moduleIndex,event.detail===0||hoverCapable.matches&&event.pointerType!=='touch'));

    });
    list.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));
    list.addEventListener('pointerleave',event=>{
      if(event.pointerType!=='mouse'||!hoverCapable.matches)return;
      clearTimeout(hoverTimer);hovered=-1;
      leaveTimer=setTimeout(()=>{if(canPreview()&&!list.querySelector('.database-word:focus-visible'))dismissPreview();},150);
    });
    list.addEventListener('focusout',event=>{if(!list.contains(event.relatedTarget)&&!list.matches(':hover')&&canPreview())dismissPreview();});
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
  function animatePreviewCard(card,frames,options){
    previewAnimations.get(card)?.cancel();
    if(reduced.matches)return Promise.resolve();
    const animation=card.animate(frames,{fill:'both',...options});
    previewAnimations.set(card,animation);runningAnimations.add(animation);
    return animation.finished.catch(()=>{}).finally(()=>{
      runningAnimations.delete(animation);
      if(previewAnimations.get(card)===animation)previewAnimations.delete(card);
    });
  }
  function preview(index){selected=index;updateWords();showPreview(index);}
  async function showPreview(index){
    if(!visible||index===active)return;
    const version=++switchVersion,previous=active,direction=previous<0||index>previous?1:-1,next=groups[index];
    const displayed=groups.filter(group=>group.classList.contains('is-active')||group.classList.contains('is-exiting'));
    // Read before cancelling: an interrupted card continues from its rendered pose.
    const poses=new Map(displayed.flatMap(group=>[...group.children].map(card=>{const style=getComputedStyle(card);return[card,{transform:style.transform,opacity:style.opacity}];})));
    active=index;
    const outgoing=displayed.filter(group=>group!==next).flatMap(group=>{
      group.classList.remove('is-active');group.classList.add('is-exiting');
      return [...group.children].map((card,i)=>animatePreviewCard(card,[poses.get(card),{transform:cardOffset(-direction,innerHeight+card.offsetHeight+120),opacity:0}],{duration:480,delay:i*12,easing:'cubic-bezier(.55,0,.3,1)'}));
    });
    next.classList.remove('is-exiting');next.classList.add('is-active');startParallax();
    const incoming=[...next.children].map((card,i)=>animatePreviewCard(card,poses.has(card)?[
      poses.get(card),{transform:baseCardTransform,opacity:.84}
    ]:[
      {transform:cardOffset(direction,innerHeight+card.offsetHeight+120),opacity:0},
      {offset:.48,transform:cardOffset(direction,65),opacity:.5},
      {transform:baseCardTransform,opacity:.84}
    ],{duration:poses.has(card)?420:720,delay:poses.has(card)?0:i*20,easing:'cubic-bezier(.16,1,.3,1)'}));
    await Promise.all([...outgoing,...incoming]);if(version!==switchVersion)return;
    for(const group of groups){
      if(group!==next)group.classList.remove('is-active','is-exiting');
      for(const card of group.children)card.getAnimations().forEach(animation=>animation.cancel());
    }
  }
  async function dismissPreview(){
    if(active<0)return;
    const version=++switchVersion;active=-1;selected=-1;updateWords();
    const displayed=groups.filter(group=>group.classList.contains('is-active')||group.classList.contains('is-exiting'));
    const outgoing=displayed.flatMap(group=>[...group.children].map(card=>{
      const style=getComputedStyle(card),pose={transform:style.transform,opacity:style.opacity};
      group.classList.add('is-exiting');
      return animatePreviewCard(card,[pose,{transform:cardOffset(1,90,false),opacity:0}],{duration:300,easing:'cubic-bezier(.4,0,.6,1)'});
    }));
    await Promise.all(outgoing);if(version!==switchVersion)return;
    for(const group of displayed){group.classList.remove('is-active','is-exiting');for(const card of group.children)card.getAnimations().forEach(animation=>animation.cancel());}
  }
  function clearPreview(){cancelHover();switchVersion++;cancelAnimations();previewAnimations.clear();groups.forEach(group=>{group.classList.remove('is-active','is-exiting');for(const card of group.children)card.getAnimations().forEach(animation=>animation.cancel());});active=-1;}
  const detailClosedClip='inset(49.5% 49.5% 49.5% 49.5% round 18px)',detailFullClip='inset(0% 0% 0% 0% round 0px)';
  function animateDetail(opening){
    // Reverse the same closing keyframes, including their timing curve.
    const options={duration:720,easing:'cubic-bezier(.325,.81,.45,.945)',direction:opening?'reverse':'normal'};
    const titles=words.map((word,i)=>animateElement(word,[
      {transform:`translate3d(0,0,0) rotate(${wordAngles[i]}) scale(.08)`,opacity:0},
      {transform:`translate3d(0,0,0) rotate(${wordAngles[i]}) scale(1)`,opacity:1}
    ],options));
    return Promise.all([...titles,animateElement(panel,[
      {clipPath:detailFullClip,opacity:1},
      {offset:.82,clipPath:'inset(45% 44% 45% 44% round 14px)',opacity:1},
      {clipPath:detailClosedClip,opacity:.96}
    ],options)]);
  }
  async function select(index,direct=false){
    if(!canPreview())return;
    cancelHover();
    if(!direct&&selected!==index){preview(index);return;}
    const version=++detailVersion;
    transitioning=true;detailIndex=index;clearPreview();document.body.classList.add('database-detail-transition');
    panel.style.clipPath=detailClosedClip;panel.style.opacity='.96';
    try{
      const preparePage=()=>Promise.resolve(onOpen(modules[index].key));
      await preparePage();
      await waitFrame();
      if(version!==detailVersion)return;
      document.getElementById('particleEarth')?.refreshParticleEarth?.();
      await animateDetail(true);
      if(version!==detailVersion)return;
      for(const element of[panel,...words])element.getAnimations().forEach(animation=>animation.cancel());
      panel.style.removeProperty('clip-path');panel.style.removeProperty('opacity');
      if(databaseToggle.getAttribute('aria-pressed')!=='true'){panel.classList.remove('show');return;}
      document.getElementById('particleEarth')?.refreshParticleEarth?.();
      clearPreview();root.hidden=false;root.className='database-portal is-visible is-detail-background';
      document.body.classList.add('database-portal-active');
    }catch(error){panel.classList.remove('show');restoreTitleScreen();console.error(error);}
    finally{if(version===detailVersion){document.body.classList.remove('database-detail-transition');transitioning=false;}}
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
    detailVersion++;
    clearTimeout(moduleTimer);cancelAnimations();visible=true;transitioning=false;selected=-1;active=-1;root.hidden=false;root.style.opacity='';root.style.pointerEvents='';root.className='database-portal is-visible';document.body.classList.add('database-portal-active');document.body.classList.remove('database-detail-transition');
    groups.forEach(group=>group.classList.remove('is-active','is-exiting'));words.forEach(word=>{word.getAnimations().forEach(animation=>animation.cancel());word.style.removeProperty('opacity');word.style.removeProperty('transform');});panel.getAnimations().forEach(animation=>animation.cancel());panel.style.removeProperty('clip-path');panel.style.removeProperty('transform');panel.style.removeProperty('opacity');panel.style.removeProperty('transform-origin');updateWords();
  }
  async function show(){
    if(panel.classList.contains('show')||visible)return;
    clearTimeout(moduleTimer);resetSelection();visible=true;transitioning=true;
    root.hidden=false;root.className='database-portal is-visible';document.body.classList.add('database-portal-active');
    let outcome;
    try{
      if(window.garageScreenTransition&&!reduced.matches)outcome=await window.garageScreenTransition.enter(()=>{},stage);
    }catch(error){console.error(error);}
    finally{
      if(outcome?.at==='garage')hide(false);
      else if(databaseToggle.getAttribute('aria-pressed')==='true')root.className='database-portal is-visible';
      transitioning=false;
    }
    return outcome;
  }

  function hide(animate=true){
    if(!visible||root.classList.contains('is-module-leaving'))return;detailVersion++;const fromDetail=root.classList.contains('is-detail-background');clearTimeout(moduleTimer);clearPreview();if(animate&&!reduced.matches){transitioning=true;root.className=`database-portal is-visible is-module-leaving${fromDetail?' is-from-detail':''}`;moduleTimer=setTimeout(()=>{visible=false;transitioning=false;root.hidden=true;root.className='database-portal';document.body.classList.remove('database-portal-active');},560);}else{visible=false;transitioning=false;root.className='database-portal';root.hidden=true;document.body.classList.remove('database-portal-active');}
  }
  async function leave(){
    if(!visible||panel.classList.contains('show')||window.garageScreenTransition?.active)return;
    transitioning=true;clearTimeout(moduleTimer);
    let outcome;
    try{
      if(window.garageScreenTransition&&!reduced.matches)outcome=await window.garageScreenTransition.leave(stage);
    }catch(error){console.error(error);}
    finally{if(outcome?.at==='titles')root.className='database-portal is-visible';else hide(false);transitioning=false;}
    return outcome;
  }
  async function prepareReturn(){
    if(databaseToggle.getAttribute('aria-pressed')!=='true')return;
    detailVersion++;
    clearTimeout(moduleTimer);cancelAnimations();transitioning=true;visible=true;
    selected=-1;active=-1;root.hidden=false;root.style.opacity='';root.style.pointerEvents='';root.className='database-portal is-visible is-detail-returning';document.body.classList.add('database-portal-active','database-detail-transition');groups.forEach(group=>group.classList.remove('is-active','is-exiting'));updateWords();
    panel.style.clipPath=detailFullClip;panel.style.opacity='1';await waitFrame();
    await animateDetail(false);
  }

  function completeReturn(){detailIndex=-1;restoreTitleScreen();}
  root.addEventListener('pointerdown',()=>{if(window.garageScreenTransition?.active)window.garageScreenTransition.interrupt();},{passive:true});
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',()=>{pointerTargetX=0;pointerTargetY=0;startParallax();});
  const databaseToggle=document.getElementById('partsToggle'),panel=document.getElementById('panel');
  new MutationObserver(()=>{if(databaseToggle.getAttribute('aria-pressed')!=='true')hide();}).observe(databaseToggle,{attributes:true,attributeFilter:['aria-pressed']});
  new MutationObserver(()=>{if(!panel.classList.contains('show')&&databaseToggle.getAttribute('aria-pressed')==='true'&&(root.hidden||!root.classList.contains('is-visible')||root.classList.contains('is-detail-background')))restoreTitleScreen();}).observe(panel,{attributes:true,attributeFilter:['class']});
  build();const ready=preload();return{show,hide,leave,prepareReturn,completeReturn,preload,ready,get visible(){return visible;}};
}
