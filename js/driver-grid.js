/* Adapted from GridLayoutMotion/demo.js, Copyright 2018 Codrops (MIT).
 * https://github.com/codrops/GridLayoutMotion
 * Original layered tilt, grid explosion and overlay reveal, using native animations.
 */
'use strict';
async function transitionDriverOverview(category){
  if(activeInformationPart!=='Cockpit'||activeCockpitCategory===category||panel.overviewSwitchPending)return;
  if(panel.seasonTransitionPending){
    try{await panel.seasonTransitionAnimation?.finished;}catch{}
    return transitionDriverOverview(category);
  }
  const body=panel.querySelector('.panel-body'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  panel.overviewSwitchPending=true;let animation;
  try{
    panel.cockpitNavigationAnimation?.cancel();
    if(!reduced){animation=body.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:160,easing:'ease-in',fill:'forwards'});await animation.finished;}
    if(activeInformationPart!=='Cockpit')return;
    cockpitTeamContext=null;cockpitDetail=false;activeCockpitCategory=category;renderCockpit();
    panel.cockpitNavigationAnimation?.cancel();body.scrollTop=0;animation?.cancel();
    if(!reduced){animation=body.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,easing:'cubic-bezier(.16,1,.3,1)'});await animation.finished;}
  }catch(error){if(error.name!=='AbortError')console.error(error);}
  finally{animation?.cancel();panel.overviewSwitchPending=false;}
}
function renderDriverOverviewNavigation(){
  document.getElementById('driverOverviewToggle')?.remove();
  const controls=document.querySelector('#panel > .panel-toolbar');
  if(!controls)return;
  const nav=document.createElement('nav');nav.id='driverOverviewToggle';nav.className='driver-overview-nav';nav.setAttribute('aria-label','Teams and drivers');
  const inDrivers=activeCockpitCategory==='drivers';
  ['teams','drivers'].forEach(category=>{const button=document.createElement('button');button.type='button';button.textContent=category.toUpperCase();button.setAttribute('aria-current',inDrivers===(category==='drivers')?'page':'false');button.addEventListener('click',()=>transitionDriverOverview(category));nav.append(button);});
  controls.prepend(nav);
}

function orderDriverGrid(drivers,year=selectedSeason){
  const lineups={Mercedes:['russell','antonelli'],Ferrari:['leclerc','hamilton'],McLaren:['norris','piastri'],'Red Bull Racing':['verstappen','hadjar','tsunoda'],'Racing Bulls':['lawson','hadjar','lindblad'],Alpine:['gasly','colapinto','doohan'],'Haas F1 Team':['ocon','bearman'],Audi:['hulkenberg','bortoleto'],'Kick Sauber':['hulkenberg','bortoleto'],Williams:['albon','sainz'],'Aston Martin':['alonso','stroll'],Cadillac:['perez','bottas']};
  const teamOrder=new Map([...(seasonData[year]?.teams||[])].sort((a,b)=>b.points-a.points||(a.rank||0)-(b.rank||0)).map((team,index)=>[team.name,index]));
  const seat=driver=>{const index=lineups[driver.team]?.indexOf(driver.id)??-1;return index<0?99:index;};
  return [...drivers].sort((a,b)=>(teamOrder.get(a.team)??99)-(teamOrder.get(b.team)??99)||seat(a)-seat(b));
}

function renderDriverMotionGrid(root,drivers){
  root.replaceChildren();root.classList.add('driver-motion-grid');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),items=[];
  const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
  orderDriverGrid(drivers).forEach((driver,index)=>{
    const card=element('button','driver-motion-card');card.type='button';card.dataset.driverId=driver.id;card.setAttribute('aria-label',`View ${driver.name} driver profile`);card.setAttribute('aria-haspopup','dialog');
    const seed=[...driver.id].reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,7);
    card.dataset.layout=String([0,3,6,1,5,2,7,4][index%8]);
    card.style.setProperty('--name-angle',`${seed%9-4}deg`);
    card.style.setProperty('--number-angle',`${seed%13-6}deg`);
    card.style.setProperty('--card-offset',`${[0,36,14,52][index%4]}px`);
    card.style.setProperty('--driver-color',racePositionTeams[driver.team]?.color||'#75dafa');
    const box=element('span','driver-motion-box'),shadow=element('span','driver-motion-shadow'),frame=element('span','driver-motion-frame');
    const media=driverMediaFor(driver),photo=element('span','driver-motion-photo');
    const halfPortrait=selectedSeason!=='2025'&&driverProfiles[driver.id]?.photo;
    if(halfPortrait||media?.photo){const image=element('img','driver-motion-image');image.src=halfPortrait||media.photo;image.dataset.framing='crop';image.alt=driver.name;image.decoding='async';image.loading=index<8?'eager':'lazy';photo.append(image);}else photo.append(element('span','driver-motion-placeholder','PORTRAIT UNAVAILABLE'));
    const parts=driver.name.trim().split(' '),surname=parts.pop(),name=element('span','driver-motion-given',parts.join(' '));
    const title=element('span','driver-motion-surname'),titleText=element('span','driver-motion-surname-text',surname);titleText.dataset.hover=surname;title.append(titleText);
    card.style.setProperty('--surname-size',`${surname.length>10?21:surname.length>8?24:29}px`);
    const number=element('span','driver-motion-number');number.setAttribute('aria-hidden','true');
    if(media?.numberImage){const image=element('img','');image.src=media.numberImage;image.alt='';image.decoding='async';image.loading=index<6?'eager':'lazy';number.append(image);}else number.textContent=driver.number||'—';
    const caption=element('span','driver-motion-caption'),code=element('span','driver-motion-code',String(index+1).padStart(2,'0'));
    caption.append(code,element('span','driver-motion-team',driver.team),element('span','driver-motion-arrow','↗'));
    box.append(shadow,frame,photo,name,title,number,caption);card.append(box);root.append(card);
    const layers=[shadow,photo,title,name,number,caption,frame],ranges=[[30,20,-2],[-10,-10,0],[20,10,0],[20,35,-12],[-20,0,3],[5,3,0],[8,-6,1]];
    let raf=0,x=0,y=0,tx=0,ty=0;
    const tick=()=>{raf=0;if(!card.isConnected||root.classList.contains('is-transitioning'))return;x+=(tx-x)*.12;y+=(ty-y)*.12;layers.forEach((layer,i)=>{const [dx,dy,rotation]=ranges[i];layer.style.transform=`translate3d(${x*dx}px,${y*dy}px,0) rotate(${x*rotation}deg)`;});if(Math.abs(tx-x)+Math.abs(ty-y)>.002)raf=requestAnimationFrame(tick);};
    const move=event=>{if(reduced.matches||event.pointerType==='touch'||root.classList.contains('is-transitioning'))return;const bounds=card.getBoundingClientRect();tx=(event.clientX-bounds.left)/bounds.width*2-1;ty=(event.clientY-bounds.top)/bounds.height*2-1;if(!raf)raf=requestAnimationFrame(tick);};
    card.addEventListener('pointermove',move);card.addEventListener('pointerleave',()=>{tx=ty=0;if(!reduced.matches&&!raf)raf=requestAnimationFrame(tick);});
    card.addEventListener('click',()=>driverGridPreview.open(root,items,driver,card));
    items.push({card,layers});
  });
}

const driverGridPreview=(()=>{
  let state=null,busy=false,curtain=null,wipe=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion=(node,frames,options)=>{const animation=node.animate(frames,{fill:'both',...options});return animation.finished.catch(()=>{}).then(()=>animation);};
  function ensureCurtain(){
    if(curtain)return;
    curtain=document.createElement('dialog');curtain.className='driver-motion-curtain';curtain.setAttribute('aria-label','Opening driver profile');wipe=document.createElement('div');wipe.className='driver-motion-wipe';curtain.append(wipe);document.body.append(curtain);curtain.addEventListener('cancel',event=>event.preventDefault());
    const dialog=document.getElementById('driverDialog');
    dialog.addEventListener('click',event=>{if(!state)return;const bounds=dialog.getBoundingClientRect(),outside=event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom);if(event.target.closest('#driverDialogClose')||outside){event.preventDefault();event.stopImmediatePropagation();close();}},true);
    dialog.addEventListener('cancel',event=>{if(state){event.preventDefault();close();}});
    dialog.addEventListener('close',()=>{if(state&&!busy)restore();});
  }
  function restore(){
    if(!state)return;const {root,items,trigger,scrollTop,scrollLeft}=state;
    items.forEach(({layers})=>layers.forEach(layer=>{layer.getAnimations().forEach(animation=>animation.cancel());layer.style.removeProperty('transform');}));
    root.classList.remove('is-transitioning');const viewport=panel.querySelector('.panel-body');viewport.scrollTop=scrollTop;viewport.scrollLeft=scrollLeft;
    document.getElementById('driverDialog').classList.remove('driver-motion-detail');state=null;busy=false;if(trigger.isConnected)trigger.focus({preventScroll:true});
  }
  async function open(root,items,driver,trigger){
    if(busy||state)return;ensureCurtain();busy=true;
    const viewport=panel.querySelector('.panel-body');state={root,items,trigger,scrollTop:viewport.scrollTop,scrollLeft:viewport.scrollLeft};root.classList.add('is-transitioning');
    const dialog=document.getElementById('driverDialog');dialog.classList.add('driver-motion-detail');
    if(reduced()){showDriverProfile(driver,trigger);busy=false;return;}
    curtain.showModal();wipe.style.transform='translate3d(100%,0,0)';
    items.forEach(({card,layers})=>{const bounds=card.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return;const distance=Math.min(1,Math.abs(bounds.right-innerWidth)/innerWidth),vertical=bounds.top+bounds.height/2-innerHeight/2;layers.forEach((layer,i)=>motion(layer,[{transform:layer.style.transform||'none',opacity:1},{transform:`translate3d(${-20-distance*600}px,${Math.abs(vertical)<innerHeight*.1?0:Math.sign(vertical)*(20+distance*600)}px,0) rotate(${(i%2?1:-1)*8}deg)`,opacity:0}],{duration:400,delay:distance*240,easing:'cubic-bezier(.215,.61,.355,1)'}));});
    await motion(wipe,[{transform:'translate3d(100%,0,0)'},{transform:'translate3d(0,0,0)'}],{duration:500,easing:'ease-in-out'});
    dialog.dataset.editorialEntering='true';showDriverProfile(driver,trigger);curtain.close();curtain.showModal();
    const sections=[...dialog.querySelectorAll('.driver-editorial-hero .driver-identity-card,.driver-editorial-right')];
    const entries=sections.map(node=>{const bounds=node.getBoundingClientRect(),distance=Math.min(1,Math.abs(bounds.right-innerWidth)/innerWidth);return motion(node,[{transform:`translate3d(${distance*800}px,${100-bounds.bottom/innerHeight*200}px,0) rotate(${5+distance*25}deg)`,opacity:0},{transform:'none',opacity:1}],{duration:800+distance*400,delay:200,easing:'cubic-bezier(.19,1,.22,1)'});});
    await motion(wipe,[{transform:'translate3d(0,0,0)'},{transform:'translate3d(-100%,0,0)'}],{duration:500,delay:200,easing:'cubic-bezier(.215,.61,.355,1)'});curtain.close();delete dialog.dataset.editorialEntering;dialog.dispatchEvent(new Event('driver-profile-visible'));await Promise.all(entries);sections.forEach(node=>node.getAnimations().forEach(animation=>animation.cancel()));busy=false;
  }
  async function close(){
    if(busy||!state)return;busy=true;const dialog=document.getElementById('driverDialog');
    if(reduced()){dialog.close();restore();return;}
    curtain.showModal();await motion(wipe,[{transform:'translate3d(-100%,0,0)'},{transform:'translate3d(0,0,0)'}],{duration:500,easing:'cubic-bezier(.215,.61,.355,1)'});
    dialog.close();const {items}=state;items.forEach(({layers})=>layers.forEach(layer=>layer.getAnimations().forEach(animation=>animation.cancel())));
    const returned=items.flatMap(({card,layers})=>{const bounds=card.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return[];const distance=Math.min(1,Math.abs(bounds.right-innerWidth)/innerWidth);return layers.map(layer=>motion(layer,[{transform:`translate3d(${-20-distance*600}px,0,0) rotate(-8deg)`,opacity:0},{transform:'none',opacity:1}],{duration:600,delay:50+distance*200,easing:'cubic-bezier(.19,1,.22,1)'}));});
    await motion(wipe,[{transform:'translate3d(0,0,0)'},{transform:'translate3d(100%,0,0)'}],{duration:500,easing:'cubic-bezier(.215,.61,.355,1)'});curtain.close();await Promise.all(returned);restore();
  }
  return{open};
})();
