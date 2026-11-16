/* Detail views owned by one team slideshow; no global navigation state. */
'use strict';
function alignTeamStoryLogo(brand){
  const logo=brand.querySelector('img');if(!logo)return;
  logo.decode().then(()=>{
    if(!logo.isConnected)return;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    const scale=Math.min(64/logo.naturalWidth,64/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;
    context.drawImage(logo,(64-w)/2,(64-h)/2,w,h);
    const pixels=context.getImageData(0,0,64,64).data;let left=64;
    for(let y=0;y<64;y++)for(let x=0;x<left;x++)if(pixels[(y*64+x)*4+3]>32){left=x;break;}
    if(left<64)brand.style.setProperty('--logo-inset',String(left/64));
  }).catch(()=>{});
}
function createTeamStoryDetails(root,{name,year,drivers,media,photos,portrait},slideshow){
  const events=new AbortController(),signal=events.signal;
  const view=document.createElement('section');view.className='team-story-detail';view.hidden=true;view.tabIndex=-1;view.setAttribute('aria-label','Team section details');root.append(view);
  const closeButton=document.getElementById('back');
  const previousLabel=closeButton.getAttribute('aria-label'),previousTitle=closeButton.title;
  const profile=teamProfileData[name],facts=profile?.facts||{};
  const labels={profile:'Team Profile',drivers:'The Drivers',points:'Points & Results',photos:'Photo Wall'};
  let current=null,trigger=null,gallery=null,destroyed=false,opening=false,closing=false,closeQueued=false;
  const transition=createArchiveDetailMotion();
  const valid=()=>!destroyed&&root.isConnected&&panel.classList.contains('team-detail-view')&&panel.classList.contains('show');
  const previewLayers=()=>root.querySelectorAll('.team-shapes-brand,.slide--current .team-shape-img,.slide--current .team-shape-caption,.team-shapes-pages');
  const detailLayers=()=>view.querySelectorAll('.team-story-heading,.team-story-profile-visual,.team-story-profile-copy,.team-story-driver,.team-story-history,.team-story-season,.team-photo-strip');
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const image=(src,alt,cls)=>{const n=el('img',cls);n.src=src;n.alt=alt;n.decoding='async';n.draggable=false;return n;};
  const number=value=>Number.isFinite(Number(value))?Number(value).toLocaleString('en-US'):value||'—';
  function factList(entries,cls='team-story-facts'){
    const list=el('dl',cls);
    for(const [title,value]of entries){if(value===undefined||value===null||value==='')continue;const row=el('div','');row.append(el('dt','',title),el('dd','',String(value)));list.append(row);}return list;
  }
  function renderProfile(){
    const layout=el('div','team-story-profile');
    const figure=el('figure','team-story-profile-visual');
    const source=photos?.profile||media?.carPhoto;if(source)figure.append(image(source,`${name} racing team`,photos?'':'is-car'));
    const copy=el('div','team-story-profile-copy');copy.append(el('h2','',teamLandingFullName(name,year)));
    const keys=['Base','First Team Entry'];if(year==='2026')keys.push('Team Chief','Technical Chief','Chassis','Power Unit','Reserve Driver');
    copy.append(factList(keys.map(key=>[key,facts[key]])));
    layout.append(figure,copy);view.append(layout);
  }
  function renderDrivers(){
    const grid=el('div','team-story-drivers'),navigation=el('nav','team-lineup-navigation');
    grid.setAttribute('aria-label',`${year} ${name} driver lineup`);navigation.setAttribute('aria-label','Choose a team driver');
    const countries={ARG:'ar',AUS:'au',BRA:'br',CAN:'ca',ESP:'es',FIN:'fi',FRA:'fr',GBR:'gb',GER:'de',ITA:'it',JPN:'jp',MEX:'mx',MON:'mc',NED:'nl',NZL:'nz',THA:'th'};
    const choices=[];
    drivers.forEach((driver,index)=>{
      const button=el('button','team-story-driver');button.type='button';button.dataset.driverId=driver.id;button.setAttribute('aria-label',`View ${driver.name} profile`);button.setAttribute('aria-haspopup','dialog');
      const media=driverMediaFor(driver,year),carNumber=el('span','team-lineup-number');carNumber.setAttribute('aria-hidden','true');
      carNumber.textContent=String(driver.number??(year==='2026'?driverProfiles[driver.id]?.number:undefined)??'');
      if(!carNumber.textContent&&media?.numberImage)carNumber.append(image(media.numberImage,'',''));
      const front=year==='2026'&&Object.hasOwn(driverIntroductions,driver.id);
      const visual=el('div',`team-story-driver-visual${front?'':' is-full-portrait'}`),src=front?`img/driver-front-portraits/${driver.id}.webp`:portrait(driver);if(src)visual.append(image(src,driver.name,''));
      const identity=el('div','team-story-driver-copy'),words=driver.name.split(' '),given=words.shift(),surname=words.join(' ');
      const title=el('h2','');title.append(el('span','team-story-given',given),el('span','team-story-surname',surname));
      const stats=el('span','team-lineup-stats'),country=el('span','team-lineup-country'),code=countries[driver.nationality];
      if(code){const flag=image(`img/flags/w160/${code}.png`,driver.nationality,'country-flag');flag.width=24;flag.height=16;country.append(flag);}
      country.append(el('span','',driver.nationality||'—'));
      const rank=el('span','team-lineup-stat'),points=el('span','team-lineup-stat');
      rank.append(el('small','','RANK'),el('strong','',driver.rank?`P${driver.rank}`:'—'));
      points.append(el('small','','POINTS'),el('strong','',number(driver.points)));
      stats.append(country,rank,points);identity.append(title,stats);button.append(carNumber,visual,identity);
      button.addEventListener('click',()=>showDriverProfile(driver,button),{signal});grid.append(button);
      const choice=el('button','',surname);choice.type='button';choice.setAttribute('aria-current',index===0?'true':'false');
      choice.addEventListener('click',()=>grid.scrollTo({left:button.offsetLeft-grid.firstElementChild.offsetLeft,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}),{signal});
      choices.push(choice);navigation.append(choice);
    });
    grid.addEventListener('scroll',()=>{
      const items=[...grid.children],origin=items[0]?.offsetLeft||0;
      const current=items.reduce((nearest,item,index)=>Math.abs(item.offsetLeft-origin-grid.scrollLeft)<Math.abs(items[nearest].offsetLeft-origin-grid.scrollLeft)?index:nearest,0);
      choices.forEach((choice,index)=>choice.setAttribute('aria-current',String(index===current)));
    },{signal,passive:true});
    view.append(grid,navigation);
  }
  function renderPoints(){
    const standing=seasonData[year].teams?.find(team=>team.name===name);
    const layout=el('div','team-story-results'),history=el('section','team-story-history'),season=el('section','team-story-season');
    history.append(el('h2','','All-time record'));
    history.append(factList([['Team points',number(facts['Team Points'])],['World championships',facts['World Championships']],['Grand Prix entries',number(facts['Grands Prix Entered'])],['Race wins',facts['Highest Race Finish']?.match(/x([\d,]+)/)?.[1]],['Podiums',number(facts.Podiums)],['Pole positions',number(facts['Pole Positions'])]],'team-story-records'));
    season.append(el('h2','',`${year} Season`));season.append(factList([['Championship',standing?.rank?`#${standing.rank}`:'—'],['Team points',number(standing?.points)]],'team-story-season-summary'));
    const scroll=el('div','team-story-race-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',`${year} driver race finishes`);
    const table=el('table','team-story-race-table'),head=el('thead',''),headRow=el('tr','');
    const gp=el('th','','Grand Prix');gp.scope='col';headRow.append(gp);
    for(const driver of drivers){const th=el('th','',driver.name);th.scope='col';headRow.append(th);}head.append(headRow);table.append(head);
    const body=el('tbody','');
    for(const race of seasonData[year].races){
      if(!Object.values(race.results||{}).some(result=>result.race))continue;
      const row=el('tr',''),title=el('th','',race.nameEnglish);title.scope='row';row.append(title);
      const positions=seasonRacePositions(race);
      for(const driver of drivers){const value=positions.get(driver.id);const cell=el('td','',value===undefined?'—':typeof value==='number'?`P${value}`:value);if(typeof value==='number'&&value<=3)cell.classList.add('is-podium');row.append(cell);}body.append(row);
    }
    table.append(body);scroll.append(table);season.append(el('h3','','Driver race finishes'),scroll);layout.append(history,season);view.append(layout);
  }
  function renderPhotos(){
    const sources=photos?[photos.profile,...photos.drivers,photos.points,...photos.photos]:[media?.carPhoto,...drivers.map(portrait)];
    const unique=[...new Set(sources.filter(Boolean))];
    const captions=photos?[`${name} on track`,'Charles Leclerc','Lewis Hamilton','British Grand Prix podium',`${name} on track`,`${name} in the garage`,'Race helmet']:['Team car',...drivers.map(driver=>driver.name)];
    gallery=new GarageDraggablePhotoStrip(view,unique.map((src,index)=>({src,alt:captions[index]||name})),{onPreviewChange:active=>{
      view.toggleAttribute('data-gallery-preview',active);closeButton.style.visibility=active?'hidden':'';closeButton.inert=active;
    }});
    view.photoStrip=gallery;
  }
  async function open(section,button){
    if(destroyed||current||opening||closing||slideshow.isAnimating)return;
    current=section;trigger=button;opening=true;closeQueued=false;root.dataset.detailTransition='opening';
    try{
      const complete=await transition.run({valid,exitLayers:previewLayers,onCancel:()=>{closeQueued=true;},
        swap:()=>{
          root.dataset.detailOpen=section;slideshow.slides.forEach(slide=>slide.DOM.el.inert=true);root.querySelector('.team-shapes-pages').inert=true;
          const wrap=slideshow.slides[slideshow.current].DOM.imgWrap;gsap.killTweensOf(wrap);gsap.set(wrap,{clipPath:slideshow.config.clipPath.initial});
          view.classList.toggle('team-story-detail--photos',section==='photos');view.classList.toggle('team-story-detail--drivers',section==='drivers');view.replaceChildren();view.hidden=false;view.scrollTop=0;
          const header=el('header','team-story-heading'),brand=el('div','team-story-brand');const logo=createRaceTeamLogo(name);if(logo)brand.append(logo);brand.append(el('span','',name));header.append(brand,el('h1','',labels[section]));view.append(header);alignTeamStoryLogo(brand);
          ({profile:renderProfile,drivers:renderDrivers,points:renderPoints,photos:renderPhotos})[section]();
          closeButton.setAttribute('aria-label','Close section and return to team introduction');closeButton.title='Close section';
        },entryLayers:detailLayers
      });
      if(complete&&!closeQueued){gallery?.setEnabled(true);view.focus({preventScroll:true});}
    }finally{opening=false;if(!destroyed)delete root.dataset.detailTransition;}
    if(closeQueued&&!destroyed){closeQueued=false;close();}
  }
  async function close(){
    if(!current||destroyed||closing)return;
    if(opening){closeQueued=true;return;}
    closing=true;root.dataset.detailTransition='closing';
    try{
      const complete=await transition.run({closing:true,valid,exitLayers:detailLayers,
        swap:()=>{
          gallery?.destroy();gallery=null;view.photoStrip=null;current=null;delete root.dataset.detailOpen;view.hidden=true;view.replaceChildren();view.classList.remove('team-story-detail--photos','team-story-detail--drivers');
          slideshow.slides[slideshow.current].DOM.el.inert=false;root.querySelector('.team-shapes-pages').inert=false;
          closeButton.setAttribute('aria-label',previousLabel);closeButton.title=previousTitle;
        },entryLayers:previewLayers
      });
      if(complete&&trigger?.isConnected)trigger.focus({preventScroll:true});
    }finally{closing=false;if(!destroyed)delete root.dataset.detailTransition;}
  }
  closeButton.addEventListener('click',event=>{if(current){event.preventDefault();event.stopImmediatePropagation();if(gallery?.active)gallery.closeContent();else close();}},{capture:true,signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&current&&!document.querySelector('dialog[open]')){event.preventDefault();event.stopImmediatePropagation();if(gallery?.active)gallery.closeContent();else close();}},{capture:true,signal});
  return{open,close,destroy(){destroyed=true;events.abort();transition.destroy();gallery?.destroy();view.remove();delete root.dataset.detailOpen;}};
}
