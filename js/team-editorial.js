/* Adapted from Codrops ShapesSlideshow Demo 1 (MIT).
 * https://github.com/codrops/ShapesSlideshow
 * Original Slide structure and Demo 1 navigate() circle/vertical/text timeline.
 * Garage adaptation: scoped styles, four entries, wheel gestures, touch and cleanup.
 */
'use strict';
class TeamShapeSlide {
  constructor(el) {
    this.DOM={el,imgWrap:el.querySelector('.team-shape-img-wrap'),img:el.querySelector('.team-shape-img'),photoPair:el.querySelector('.team-shape-photo-pair'),text:el.querySelectorAll('.team-shape-text-row > span'),link:el.querySelector('.team-shape-entry')};
  }
}
class TeamShapesSlideshow {
  constructor(root,update) {
    this.root=root;this.slides=[...root.querySelectorAll('.team-shape-slide')].map(el=>new TeamShapeSlide(el));
    this.current=0;this.isAnimating=false;this.destroyed=false;this.update=update;
    this.events=new AbortController();this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.config={clipPath:{initial:'circle(55% at 70% 50%)',final:'circle(15% at 70% 50%)',hover:'circle(20% at 30% 50%)'}};
    this.slides.forEach((slide,i)=>{slide.DOM.el.inert=i!==0;slide.DOM.el.setAttribute('aria-hidden',String(i!==0));});
    this.slides[0].DOM.el.classList.add('slide--current');gsap.set(this.slides[0].DOM.imgWrap,{clipPath:this.config.clipPath.initial});
    for(const slide of this.slides)this.alignDriverSplit(slide);
    const fine=matchMedia('(hover: hover) and (pointer: fine)');
    for(const slide of this.slides)for(const [event,clip] of [['mouseenter','hover'],['mouseleave','initial']]){
      slide.DOM.link.addEventListener(event,()=>{
        if(this.destroyed||this.isAnimating||!fine.matches||this.reduced.matches)return;
        gsap.killTweensOf(slide.DOM.imgWrap);gsap.to(slide.DOM.imgWrap,{duration:1,ease:'expo',clipPath:this.config.clipPath[clip],onUpdate:()=>this.alignDriverSplit(slide)});
      },{signal:this.events.signal});
    }
    this.bindInput();this.update(0);
  }
  next(){return this.navigate('next');}
  prev(){return this.navigate('prev');}
  alignDriverSplit(slide){
    if(!slide.DOM.photoPair)return;
    const width=this.root.clientWidth,height=this.root.clientHeight;
    if(!width||!height)return;
    const clip=getComputedStyle(slide.DOM.imgWrap).clipPath;
    const match=(clip==='none'?this.config.clipPath.initial:clip).match(/circle\(([\d.]+)% at ([\d.]+)% ([\d.]+)%\)/);
    if(!match)return;
    // CSS circle percentages use the normalized viewport diagonal. Center the
    // seam in the visible, viewport-clipped circle, rather than the whole slide.
    const radius=Number(match[1])/100*Math.hypot(width,height)/Math.SQRT2;
    const centerX=Number(match[2])/100*width;
    const left=Math.max(0,centerX-radius),right=Math.min(width,centerX+radius);
    const center=(left+right)/2,tilt=Math.min(width*.1,(right-left)*.14);
    for(const [key,value]of Object.entries({'--visible-left':left,'--visible-right':right,'--split-center':center,'--split-tilt':tilt}))slide.DOM.photoPair.style.setProperty(key,`${value/width*100}%`);
  }
  navigate(direction,index=this.current+(direction==='next'?1:-1)) {
    if(this.destroyed||this.isAnimating||index<0||index>=this.slides.length||index===this.current)return false;
    this.isAnimating=true;this.root.setAttribute('aria-busy','true');
    const currentSlide=this.slides[this.current],upcomingSlide=this.slides[index];
    this.current=index;currentSlide.DOM.el.inert=true;currentSlide.DOM.el.setAttribute('aria-hidden','true');
    gsap.killTweensOf([currentSlide.DOM.imgWrap,upcomingSlide.DOM.imgWrap]);
    this.timeline=gsap.timeline({
      onStart:()=>upcomingSlide.DOM.el.classList.add('slide--current'),
      onUpdate:()=>{this.alignDriverSplit(currentSlide);this.alignDriverSplit(upcomingSlide);},
      onComplete:()=>{
        currentSlide.DOM.el.classList.remove('slide--current');gsap.set(currentSlide.DOM.el,{opacity:0});
        upcomingSlide.DOM.el.inert=false;upcomingSlide.DOM.el.setAttribute('aria-hidden','false');
        this.isAnimating=false;this.root.setAttribute('aria-busy','false');this.update(this.current);
      }
    })
    .addLabel('start',0)
    .set(upcomingSlide.DOM.imgWrap,{y:direction==='next'?'100%':'-100%',clipPath:this.config.clipPath.final},'start')
    .set(upcomingSlide.DOM.el,{opacity:1},'start')
    .set(upcomingSlide.DOM.img,{y:direction==='next'?'-50%':'50%'},'start')
    .set(upcomingSlide.DOM.text,{y:direction==='next'?'100%':'-100%'},'start')
    .to(currentSlide.DOM.imgWrap,{duration:1,ease:'power3',clipPath:this.config.clipPath.final,rotation:.001},'start')
    .to(currentSlide.DOM.text,{duration:1,ease:'power3',y:direction==='next'?'-100%':'100%'},'start')
    .to(currentSlide.DOM.imgWrap,{duration:1,ease:'power2.inOut',y:direction==='next'?'-100%':'100%',rotation:.001},'start+=0.6')
    .to(currentSlide.DOM.img,{duration:1,ease:'power2.inOut',y:direction==='next'?'50%':'-50%'},'start+=0.6')
    .to(upcomingSlide.DOM.imgWrap,{duration:1,ease:'power2.inOut',y:'0%',rotation:.001},'start+=0.6')
    .to(upcomingSlide.DOM.img,{duration:1,ease:'power2.inOut',y:'0%'},'start+=0.6')
    .to(upcomingSlide.DOM.imgWrap,{duration:1.5,ease:'expo.inOut',clipPath:this.config.clipPath.initial},'start+=1.2')
    .to(upcomingSlide.DOM.text,{duration:1.5,ease:'expo.inOut',y:'0%',rotation:.001,stagger:direction==='next'?.1:-.1},'start+=1.1');
    if(this.reduced.matches)this.timeline.progress(1);
    return true;
  }
  bindInput() {
    const signal=this.events.signal;
    let consumed=false,sum=0,lastDirection=0;
    this.root.addEventListener('wheel',event=>{
      if(this.root.dataset.detailOpen)return;
      if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
      event.preventDefault();event.stopPropagation();clearTimeout(this.wheelIdle);
      this.wheelIdle=setTimeout(()=>{consumed=false;sum=0;lastDirection=0;},220);
      if(this.isAnimating){consumed=true;sum=0;return;}
      if(consumed)return;
      const delta=event.deltaY*(event.deltaMode===1?40:event.deltaMode===2?this.root.clientHeight:1),direction=Math.sign(delta);
      if(direction!==lastDirection)sum=0;lastDirection=direction;sum+=Math.abs(delta);
      if(sum<18)return;
      consumed=true;sum=0;this.navigate(direction>0?'next':'prev');
    },{passive:false,signal});
    this.root.addEventListener('keydown',event=>{
      if(this.root.dataset.detailOpen)return;
      const keys=['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'];
      if(!keys.includes(event.key))return;event.preventDefault();event.stopPropagation();if(event.repeat)return;
      if(event.key==='Home')this.navigate('prev',0);
      else if(event.key==='End')this.navigate('next',this.slides.length-1);
      else this.navigate(['ArrowDown','PageDown'].includes(event.key)?'next':'prev');
    },{signal});
    let touch=null;
    this.root.addEventListener('touchstart',event=>{touch=!this.root.dataset.detailOpen&&event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true,signal});
    this.root.addEventListener('touchmove',event=>{
      if(!touch||event.touches.length!==1){touch=null;return;}
      if(Math.abs(event.touches[0].clientY-touch.y)>Math.abs(event.touches[0].clientX-touch.x)&&event.cancelable)event.preventDefault();
    },{passive:false,signal});
    this.root.addEventListener('touchend',event=>{
      if(!touch)return;const point=event.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;
      if(Math.abs(dy)>45&&Math.abs(dy)>Math.abs(dx))this.navigate(dy<0?'next':'prev');
    },{passive:true,signal});
    this.root.addEventListener('touchcancel',()=>{touch=null;},{passive:true,signal});
    let width=this.root.clientWidth,height=this.root.clientHeight;
    this.resize=new ResizeObserver(()=>{const changed=width!==this.root.clientWidth||height!==this.root.clientHeight;width=this.root.clientWidth;height=this.root.clientHeight;if(changed&&this.isAnimating)this.timeline?.progress(1);if(changed)for(const slide of this.slides)this.alignDriverSplit(slide);});this.resize.observe(this.root);
  }
  destroy(){
    if(this.destroyed)return;this.destroyed=true;clearTimeout(this.wheelIdle);this.events.abort();this.resize.disconnect();this.timeline?.kill();
    for(const slide of this.slides)gsap.killTweensOf([slide.DOM.el,slide.DOM.imgWrap,slide.DOM.img,...slide.DOM.text,slide.DOM.link]);
  }
}
function renderTeamEditorial(container,team) {
  container.teamStory?.destroy();container.replaceChildren();container.scrollTop=0;container.onscroll=null;
  const year=selectedSeason,name=team.name,color=racePositionTeams[name]?.color||'#75dafa',media=teamMediaFor(name);
  const photoRoot='img/team-editorial/ferrari/';
  const editorialPhotos=name==='Ferrari'?{profile:photoRoot+'team-profile.webp',drivers:[photoRoot+'driver-leclerc-report.webp',photoRoot+'driver-hamilton-report.webp'],points:photoRoot+'silverstone-2026-podium.webp',photos:[photoRoot+'gallery-track.webp',photoRoot+'gallery-garage.webp',photoRoot+'gallery-helmet.webp']}:null;
  const drivers=orderDriverGrid(seasonData[year].drivers.filter(driver=>driver.team===name),year);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const img=(src,alt,cls)=>{const n=el('img',cls);n.src=src;n.alt=alt;n.draggable=false;n.decoding='async';return n;};
  const portrait=driver=>year==='2026'&&driverProfiles[driver.id]?.photo||driverMediaFor(driver,year)?.photo;
  const root=el('div','team-shapes');root.style.setProperty('--team-color',color);root.tabIndex=0;root.setAttribute('aria-label',`${name}: team profile, drivers, points and photo wall`);root.setAttribute('aria-roledescription','slideshow');
  const brand=el('header','team-shapes-brand');const logo=createRaceTeamLogo(name);if(logo)brand.append(logo);brand.append(el('span','',name));
  const stage=el('div','team-shapes-stage');const navigation=el('nav','team-shapes-pages');navigation.setAttribute('aria-label','Team sections');
  const entries=[{id:'profile',title:['Team','Profile'],label:'Team profile'},{id:'drivers',title:['The','Drivers'],label:'Driver introductions'},{id:'points',title:['Points','& Results'],label:`Historical and ${year} season results`},{id:'photos',title:['Photo','Wall'],label:'Photo wall'}];
  const dots=[];
  for(const [index,entry]of entries.entries()){
    const slide=el('figure',`team-shape-slide team-shape-slide--${entry.id}`);slide.dataset.section=entry.id;slide.setAttribute('role','group');slide.setAttribute('aria-roledescription','slide');slide.setAttribute('aria-label',`${index+1} of 4: ${entry.label}`);
    const wrap=el('div','team-shape-img-wrap'),visual=el('div','team-shape-img');visual.setAttribute('aria-hidden','true');
    if(editorialPhotos){
      if(entry.id==='drivers'){
        const pair=el('div','team-shape-photo-pair');
        for(const source of editorialPhotos.drivers){const half=el('div','team-shape-photo-half');half.append(img(source,'','team-shape-cover'));pair.append(half);}visual.append(pair);
      }else if(entry.id==='photos'){
        const wall=el('div','team-shape-photo-wall');for(const source of editorialPhotos.photos)wall.append(img(source,'','team-shape-cover'));visual.append(wall);
      }else visual.append(img(editorialPhotos[entry.id],'','team-shape-cover'));
    }else if(entry.id==='profile'&&media?.carPhoto)visual.append(img(media.carPhoto,'','team-shape-car'));
    else if(entry.id==='drivers'){
      const pair=el('div','team-shape-pair');for(const driver of drivers){const src=portrait(driver);if(src)pair.append(img(src,'',''));}visual.append(pair);
    }else if(entry.id==='points'){
      visual.append(el('span','team-shape-year',year));const mark=createRaceTeamLogo(name);if(mark){mark.classList.add('team-shape-mark');visual.append(mark);}
    }else if(entry.id==='photos'){
      const wall=el('div','team-shape-wall');if(media?.carPhoto)wall.append(img(media.carPhoto,'','team-shape-wall-car'));
      for(const driver of drivers){const src=portrait(driver);if(src)wall.append(img(src,'','team-shape-wall-portrait'));}visual.append(wall);
    }
    wrap.append(visual);
    const caption=el('figcaption','team-shape-caption'),button=el('button','team-shape-entry');button.type='button';button.dataset.teamSection=entry.id;button.setAttribute('aria-label',entry.label);
    const title=el('h2','team-shape-headline');for(const line of entry.title){const row=el('span','team-shape-text-row');row.append(el('span','',line));title.append(row);}button.append(title);
    button.addEventListener('click',()=>{details.open(entry.id,button);root.dispatchEvent(new CustomEvent('teamsectionrequest',{bubbles:true,detail:{team:name,season:year,section:entry.id}}));});
    caption.append(button);slide.append(wrap,caption);stage.append(slide);
    const dot=el('button','team-shapes-page');dot.type='button';dot.setAttribute('aria-label',entry.label);dot.addEventListener('click',()=>slideshow.navigate(index>slideshow.current?'next':'prev',index));dot.append(el('span','',(['Profile','Drivers','Results','Photos'])[index]));navigation.append(dot);dots.push(dot);
  }
  const status=el('span','team-shapes-status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  root.append(stage,brand,navigation,status);container.append(root);alignTeamStoryLogo(brand);
  const slideshow=new TeamShapesSlideshow(root,index=>{root.dataset.current=String(index);dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});status.textContent=entries[index].label;});
  const details=createTeamStoryDetails(root,{name,year,drivers,media,photos:editorialPhotos,portrait},slideshow);
  const observer=new MutationObserver(()=>{if(container.hidden||!panel.classList.contains('team-detail-view')||!panel.classList.contains('show'))controller.destroy();});observer.observe(panel,{attributes:true,attributeFilter:['class']});observer.observe(container,{attributes:true,attributeFilter:['hidden']});
  const controller={destroy(){observer.disconnect();details.destroy();slideshow.destroy();if(container.teamStory===controller)container.teamStory=null;},slideshow};container.teamStory=controller;
  for(const photo of root.querySelectorAll('img'))photo.decode?.().catch(()=>{});
}
