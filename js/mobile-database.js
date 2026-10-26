/* Keep table gestures inside the table; the surrounding page scrolls separately. */
(()=>{
  const mobile=matchMedia('(max-width:700px)'),viewport=document.querySelector('.results-scroll'),frame=viewport.closest('.results-frame');
  const header=document.getElementById('resultsHeaderViewport'),body=document.getElementById('resultsBody');
  const rail=document.createElement('div');rail.className='results-mobile-identities';rail.setAttribute('aria-hidden','true');rail.inert=true;frame.append(rail);
  let rows=[],paintFrame=0,inertia=0,gesture=null,suppressClickUntil=0;
  const codes={verstappen:'VER',antonelli:'ANT',hulkenberg:'HUL',bortoleto:'BOR',colapinto:'COL',lindblad:'LIN'};
  function rebuild(){
    rows=[...body.rows];rail.replaceChildren();
    for(const row of rows){
      const full=row.querySelector('.driver-name-button');if(!full)continue;
      const name=full.textContent.trim(),driver=seasonData[selectedSeason]?.drivers.find(d=>d.name===name)||seasonData[selectedSeason]?.reserveDrivers?.find(d=>d.name===name);
      const item=document.createElement('button');item.type='button';item.className='results-mobile-identity';item.setAttribute('aria-label',name);
      item.style.setProperty('--team-color',racePositionTeams[driver?.team]?.color||'#75dafa');
      const logo=row.cells[3]?.querySelector('img');if(logo){const image=logo.cloneNode(true);image.alt='';item.append(image);}
      const text=document.createElement('span');text.textContent=codes[driver?.id]||name.split(/\s+/).at(-1).slice(0,3).toUpperCase();item.append(text);
      item.addEventListener('click',()=>full.click());rail.append(item);
    }
    schedule();
  }
  function paint(){
    paintFrame=0;const name=rows[0]?.cells[2],threshold=name?name.offsetLeft+name.offsetWidth:Infinity;
    const visible=mobile.matches&&viewport.scrollLeft>=threshold;
    rail.classList.toggle('is-visible',visible);rail.inert=!visible;rail.setAttribute('aria-hidden',String(!visible));
    rail.style.top=header.offsetHeight+'px';
    if(visible)rows.forEach((row,i)=>{const item=rail.children[i];if(item){item.style.height=row.offsetHeight+'px';item.style.transform=`translateY(${row.offsetTop-viewport.scrollTop}px)`;}});
  }
  function schedule(){if(!paintFrame)paintFrame=requestAnimationFrame(paint);}
  new MutationObserver(rebuild).observe(body,{childList:true});
  new ResizeObserver(schedule).observe(frame);viewport.addEventListener('scroll',schedule,{passive:true});mobile.addEventListener('change',()=>{cancelAnimationFrame(inertia);gesture=null;schedule();});rebuild();

  frame.addEventListener('touchstart',event=>{
    if(!mobile.matches||event.touches.length!==1)return;
    cancelAnimationFrame(inertia);const p=event.touches[0];gesture={x:p.clientX,y:p.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,axis:null,last:p,lastTime:performance.now(),velocity:0};
    event.stopPropagation();
  },{passive:true});
  frame.addEventListener('touchmove',event=>{
    if(!gesture||!mobile.matches)return;
    if(event.touches.length!==1){gesture=null;return;}
    const p=event.touches[0],dx=p.clientX-gesture.x,dy=p.clientY-gesture.y,now=performance.now();
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=7)gesture.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
    if(event.cancelable)event.preventDefault();event.stopPropagation();
    if(!gesture.axis)return;
    const horizontal=gesture.axis==='x',delta=horizontal?p.clientX-gesture.last.clientX:p.clientY-gesture.last.clientY;
    const elapsed=Math.max(8,now-gesture.lastTime);gesture.velocity=gesture.velocity*.35-delta/elapsed*.65;gesture.last=p;gesture.lastTime=now;
    if(horizontal){viewport.scrollLeft=gesture.left-dx;viewport.scrollTop=gesture.top;}
    else{viewport.scrollTop=gesture.top-dy;viewport.scrollLeft=gesture.left;}
    suppressClickUntil=now+450;
  },{passive:false});
  function finish(event){
    if(!gesture)return;const current=gesture;gesture=null;event.stopPropagation();
    if(event.type==='touchcancel'||!current.axis||performance.now()-current.lastTime>100)return;
    let velocity=Math.max(-2.5,Math.min(2.5,current.velocity)),last=performance.now();
    const tick=now=>{
      const dt=Math.min(32,now-last);last=now;const key=current.axis==='x'?'scrollLeft':'scrollTop',previous=viewport[key];viewport[key]+=velocity*dt;velocity*=Math.pow(.9,dt/16.67);
      if(Math.abs(velocity)>.025&&viewport[key]!==previous)inertia=requestAnimationFrame(tick);
    };
    inertia=requestAnimationFrame(tick);
  }
  frame.addEventListener('touchend',finish,{passive:true});frame.addEventListener('touchcancel',finish,{passive:true});
  frame.addEventListener('click',event=>{if(mobile.matches&&performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});

  const card=document.getElementById('nextRaceCard'),details=document.createElement('div');
  details.id='mobileNextRace';details.className='mobile-next-race';details.inert=true;details.setAttribute('aria-hidden','true');
  const inner=document.createElement('div');inner.className='mobile-next-race-inner';const content=document.createElement('div');content.className='mobile-next-race-content';inner.append(content);details.append(inner);card.after(details);
  const plus=document.createElement('span');plus.className='next-race-expand';plus.textContent='+';plus.setAttribute('aria-hidden','true');card.append(plus);
  const add=(tag,text,parent=content)=>{const node=document.createElement(tag);node.textContent=text;parent.append(node);return node;};
  add('p',`${nextRaceData.circuit} · ${nextRaceData.location}`);add('p',`${nextRaceData.start} — ${nextRaceData.end}`);add('p',nextRaceData.description);
  const map=add('img','');map.className='mobile-next-race-map';map.src=nextRaceData.map.src;map.alt=nextRaceData.map.alt;map.decoding='async';
  const stats=add('dl','');stats.className='mobile-next-race-stats';
  for(const[label,value]of[['Circuit Length',nextRaceData.length],['Race Laps / Distance',`${nextRaceData.laps} / ${nextRaceData.distance}`],['Lap Record',`${nextRaceData.lapRecord} · ${nextRaceData.recordDriver} · ${nextRaceData.recordTeam} · ${nextRaceData.recordYear}`],['Previous Winner',`${nextRaceData.previousWinner} · ${nextRaceData.previousTeam} · ${nextRaceData.previousRace}`]]){const row=add('div','',stats);add('dt',label,row);add('dd',value,row);}
  for(const[label,url]of nextRaceData.sources||[]){const link=add('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';content.append(document.createElement('br'));}
  function collapse(){details.classList.remove('is-expanded');details.inert=true;details.setAttribute('aria-hidden','true');card.setAttribute('aria-expanded','false');}
  window.toggleMobileNextRace=()=>{const expanded=!details.classList.contains('is-expanded');details.classList.toggle('is-expanded',expanded);details.inert=!expanded;details.setAttribute('aria-hidden',String(!expanded));card.setAttribute('aria-expanded',String(expanded));};
  function sync(){collapse();card.inert=false;if(mobile.matches){card.setAttribute('aria-controls',details.id);card.removeAttribute('aria-haspopup');}else{card.setAttribute('aria-controls','raceDialog');card.setAttribute('aria-haspopup','dialog');card.removeAttribute('aria-expanded');}}
  mobile.addEventListener('change',sync);new MutationObserver(()=>{if(card.hidden)collapse();}).observe(card,{attributes:true,attributeFilter:['hidden']});sync();
})();
