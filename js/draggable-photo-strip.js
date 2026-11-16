/**
 * Adapted from Codrops DraggableImageStrip/js/demo.js.
 * Copyright 2019 Codrops. MIT license.
 * https://github.com/codrops/DraggableImageStrip
 * Keeps the original image timelines and drag interpolation. Number links,
 * cover copy and content copy have been removed; photos are the click targets.
 */
'use strict';
class GarageStripItem{
  constructor(el){this.DOM={el,image:el.querySelector('.img-inner'),button:el.querySelector('.img-outer')};}
}
class GarageStripContent{
  constructor(el){this.DOM={el,image:el.querySelector('.img-outer--content')};}
}
class GarageDraggablePhotoStrip{
  constructor(host,items,{onPreviewChange=()=>{},enabled=false}={}){
    this.events=new AbortController();this.onPreviewChange=onPreviewChange;this.enabled=enabled;this.current=-1;this.state='idle';this.destroyed=false;this.dragPosition=0;this.dragged=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const el=(tag,cls)=>{const node=document.createElement(tag);node.className=cls;return node;};
    this.root=el('div','team-photo-strip');this.root.setAttribute('aria-label','Draggable photo gallery');this.root.tabIndex=-1;
    this.DOM={el:this.root,outer:el('div','strip-outer'),inner:el('div','strip-inner'),draggable:el('div','draggable'),strip:el('div','strip'),indicator:el('div','frame__indicator'),content:el('div','content'),close:el('button','content__close')};
    this.DOM.indicator.setAttribute('aria-hidden','true');
    this.DOM.close.type='button';this.DOM.close.setAttribute('aria-label','Close photo preview');this.DOM.close.innerHTML='<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    this.items=[];this.contentItems=[];
    const sizes=['s','m','xl','l','s','m','s','l'];
    for(const [index,item]of items.entries()){
      const stripItem=el('div','strip__item'),button=el('button',`img-outer img-outer--size-${sizes[index%sizes.length]}`),image=el('div','img-inner');
      button.type='button';button.setAttribute('aria-label',`Open ${item.alt}`);image.style.backgroundImage=`url("${item.src}")`;button.append(image);stripItem.append(button);this.DOM.strip.append(stripItem);this.items.push(new GarageStripItem(stripItem));
      const content=el('article','content__item'),outer=el('div','img-outer img-outer--content'),large=el('div','img-inner img-inner--content');
      large.style.backgroundImage=`url("${item.src}")`;large.setAttribute('role','img');large.setAttribute('aria-label',item.alt);outer.append(large);content.append(outer);content.inert=true;this.DOM.content.append(content);this.contentItems.push(new GarageStripContent(content));
      const preload=new Image();preload.src=item.src;preload.decode?.().catch(()=>{});
    }
    // Draggabilly moves the original draggable plane. The strip's inverse offset
    // keeps the original 0.1 lerp lag, while allowing real photo buttons inside it.
    this.DOM.draggable.append(this.DOM.strip);this.DOM.inner.append(this.DOM.draggable);this.DOM.outer.append(this.DOM.inner);this.DOM.content.append(this.DOM.close);this.root.append(this.DOM.outer,this.DOM.indicator,this.DOM.content);host.append(this.root);
    this.draggie=new Draggabilly(this.DOM.draggable,{axis:'x'});
    if(!enabled)this.draggie.disable();
    this.styles={position:{previous:0,current:0},scale:{previous:1,current:1},imgScale:{previous:1,current:1},opacity:{previous:1,current:1},indicatorScale:{previous:1,current:1}};
    this.makeCursor(el);this.bind();this.resize();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.root);this.wake();
  }
  random(min,max){return Number((Math.random()*(max-min)+min).toFixed(2));}
  setEnabled(enabled){this.enabled=enabled;if(enabled&&this.state==='idle')this.draggie.enable();else this.draggie.disable();}
  makeCursor(el){
    const cursor=el('div','strip-cursor'),circle=el('div','cursor__inner--circle');this.cursor={el:cursor,circle,left:el('span','cursor__side cursor__side--left'),right:el('span','cursor__side cursor__side--right'),x:0,y:0,previousX:0,previousY:0,scale:1,previousScale:1,visible:false};
    circle.append(this.cursor.left,this.cursor.right);cursor.append(circle);this.root.append(cursor);
  }
  arrows(show){
    gsap.to([this.cursor.left,this.cursor.right],{duration:1,ease:'expo.out',overwrite:'auto',startAt:show?{x:i=>i?10:-10}:undefined,x:show?0:i=>i?10:-10,opacity:show?1:0});
  }
  wake(){if(!this.renderId&&!this.destroyed&&this.state==='idle')this.renderId=requestAnimationFrame(()=>this.render());}
  render(){
    this.renderId=0;if(this.destroyed||this.state!=='idle')return;
    let moving=false;
    for(const value of Object.values(this.styles)){value.previous=this.reduced.matches?value.current:value.previous+(value.current-value.previous)*.1;if(Math.abs(value.current-value.previous)>.0005)moving=true;else value.previous=value.current;}
    gsap.set(this.DOM.strip,{x:this.styles.position.previous-this.draggie.position.x});
    gsap.set(this.items.map(item=>item.DOM.el),{scale:this.styles.scale.previous,opacity:this.styles.opacity.previous});
    gsap.set(this.items.map(item=>item.DOM.image),{scale:this.styles.imgScale.previous});
    gsap.set(this.DOM.indicator,{scaleX:this.styles.indicatorScale.previous});
    const cursor=this.cursor;
    if(cursor.visible){cursor.previousX+=(cursor.x-cursor.previousX)*.2;cursor.previousY+=(cursor.y-cursor.previousY)*.2;cursor.previousScale+=(cursor.scale-cursor.previousScale)*.15;cursor.circle.style.transform=`translate(${cursor.previousX-12.5}px,${cursor.previousY-12.5}px) scale(${cursor.previousScale})`;moving=true;}
    if(moving)this.wake();
  }
  pointer(event,pointer){
    const bounds=this.root.getBoundingClientRect(),p=pointer||event;
    this.cursor.x=(p.clientX??p.pageX)-bounds.left;this.cursor.y=(p.clientY??p.pageY)-bounds.top;this.wake();
  }
  bind(){
    const signal=this.events.signal;
    this.draggie.on('pointerDown',(event,pointer)=>{
      if(!this.enabled||this.state!=='idle')return;
      this.dragged=false;this.pressing=true;this.pressedItem=this.items.find(item=>item.DOM.button.contains(event.target))||null;this.pointer(event,pointer);this.styles.scale.current=.8;this.styles.imgScale.current=1.6;this.styles.opacity.current=.3;this.styles.indicatorScale.current=0;this.cursor.scale=1.5;this.arrows(true);this.wake();
    });
    this.draggie.on('dragStart',()=>{this.dragged=true;});
    this.draggie.on('dragMove',(event,pointer)=>{
      if(this.state!=='idle')return;
      const x=this.draggie.position.x;
      this.dragPosition=x>=0?x*.5:x<-this.maxDrag?(x-this.maxDrag)*.5:x;
      this.styles.position.current=this.dragPosition;this.pointer(event,pointer);this.wake();
    });
    this.draggie.on('pointerUp',()=>this.release());
    // Touch pointerDown is prevented by the original drag library, so a native
    // click is not guaranteed. staticClick is emitted only without a drag.
    this.draggie.on('staticClick',event=>{
      if(event.pointerType!=='touch'&&!event.type.startsWith('touch'))return;
      if(this.enabled&&this.state==='idle'&&!this.dragged&&this.pressedItem)this.showItem(this.pressedItem);
    });
    this.draggie.on('pointerCancel',(event,pointer)=>{this.dragged=true;if(this.draggie.isDragging)this.draggie._dragEnd(event,pointer);this.release();});
    for(const item of this.items){
      item.DOM.button.addEventListener('click',event=>{event.preventDefault();if(!this.enabled||this.state!=='idle'||this.draggie.isDragging||event.detail!==0&&this.dragged)return;this.showItem(item);},{signal});
      item.DOM.button.addEventListener('mouseenter',()=>{if(!this.pressing)this.cursor.scale=1.9;this.wake();},{signal});
      item.DOM.button.addEventListener('mouseleave',()=>{if(!this.pressing)this.cursor.scale=1;this.wake();},{signal});
    }
    this.root.addEventListener('pointermove',event=>this.pointer(event),{signal});
    this.root.addEventListener('pointerenter',event=>{this.cursor.visible=this.state==='idle'&&event.pointerType!=='touch';this.root.classList.toggle('has-strip-cursor',this.cursor.visible);this.pointer(event);},{signal});
    this.root.addEventListener('pointerleave',()=>{this.cursor.visible=false;this.root.classList.remove('has-strip-cursor');},{signal});
    this.DOM.close.addEventListener('click',()=>this.closeContent(),{signal});
    this.root.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&this.active){event.preventDefault();event.stopPropagation();this.closeContent();}
      if(this.state==='idle'&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
        event.preventDefault();this.dragged=false;
        const next=event.key==='Home'?0:event.key==='End'?-this.maxDrag:this.styles.position.current+(event.key==='ArrowLeft'?1:-1)*this.root.clientWidth*.3;
        this.dragPosition=Math.max(-this.maxDrag,Math.min(0,next));this.draggie.setPosition(this.dragPosition,0);this.styles.position.current=this.dragPosition;this.wake();
      }
    },{signal});
    window.addEventListener('blur',()=>{if(this.pressing){this.dragged=true;if(this.draggie.isDragging)this.draggie._dragEnd();this.draggie._pointerDone();this.release();}},{signal});
  }
  release(){
    if(this.state!=='idle')return;
    this.pressing=false;this.dragPosition=Math.max(-this.maxDrag,Math.min(0,this.draggie.position.x));
    this.draggie.setPosition(this.dragPosition,0);this.styles.position.current=this.dragPosition;this.styles.scale.current=1;this.styles.imgScale.current=1;this.styles.opacity.current=1;this.styles.indicatorScale.current=1;this.cursor.scale=1;this.arrows(false);this.wake();
  }
  resize(){
    if(this.destroyed||!this.root.clientHeight||!this.root.clientWidth)return;
    const width=this.root.clientWidth,height=this.root.clientHeight;
    if(this.width===width&&this.height===height)return;
    this.width=width;this.height=height;this.root.style.setProperty('--strip-factor',String(Math.min(Math.max(1,width/1250),Math.max(.5,(height-160)/500))));
    this.maxDrag=Math.max(0,this.DOM.strip.scrollWidth-width);
    if(this.state!=='idle'){
      if(this.state==='opening'||this.state==='closing')this.timeline?.progress(1);
      if(this.state==='open')gsap.set(this.contentItems[this.current].DOM.image,{y:0});
      return;
    }
    this.dragPosition=Math.max(-this.maxDrag,Math.min(0,this.styles.position.previous));this.draggie.setPosition(this.dragPosition,0);this.styles.position.current=this.styles.position.previous=this.dragPosition;this.wake();
  }
  get active(){return this.state!=='idle';}
  showItem(item){
    if(this.destroyed||!this.enabled||this.state!=='idle'||this.draggie.isDragging||this.pressing)return false;
    cancelAnimationFrame(this.renderId);this.renderId=0;
    this.state='opening';this.root.dataset.state=this.state;this.root.setAttribute('aria-busy','true');this.draggie.disable();this.DOM.inner.inert=true;this.current=this.items.indexOf(item);this.savedPosition=this.styles.position.previous;this.closeQueued=false;
    const content=this.contentItems[this.current];content.DOM.el.classList.add('content__item--current');content.DOM.el.inert=false;
    this.onPreviewChange(true);this.cursor.visible=false;this.root.classList.remove('has-strip-cursor');
    const timeline=this.timeline=gsap.timeline({onComplete:()=>{
      if(this.destroyed)return;this.state='open';this.root.dataset.state=this.state;this.root.setAttribute('aria-busy','false');this.DOM.close.focus({preventScroll:true});if(this.closeQueued){this.closeQueued=false;this.closeContent();}
    }})
    .set([content.DOM.image,this.DOM.close],{opacity:0},0)
    .to(this.items.map(item=>item.DOM.el),{duration:.8,ease:'power2.out',scale:.8,opacity:.4},0)
    .to(this.items.map(item=>item.DOM.image),{duration:.8,ease:'power2.out',scale:1.6},0)
    .to(this.DOM.indicator,{duration:.8,ease:'power2.out',scaleX:0},0);
    for(const stripItem of this.items)timeline.to(stripItem.DOM.el,{duration:1,ease:'expo.inOut',y:-this.height},this.random(.2,.4));
    timeline.fromTo(content.DOM.image,{y:this.height*1.3,opacity:1},{duration:1,ease:'expo.inOut',y:0,immediateRender:false},.6)
    .fromTo(this.DOM.close,{y:50,opacity:0},{duration:.8,ease:'power4.out',y:0,opacity:1,immediateRender:false},1);
    if(this.reduced.matches)timeline.progress(1);
    return true;
  }
  closeContent(){
    if(this.destroyed||this.state==='idle'||this.state==='closing')return false;
    if(this.state==='opening'){this.closeQueued=true;return true;}
    this.state='closing';this.root.dataset.state=this.state;this.root.setAttribute('aria-busy','true');
    const content=this.contentItems[this.current];
    const timeline=this.timeline=gsap.timeline({onComplete:()=>{
      if(this.destroyed)return;
      content.DOM.el.classList.remove('content__item--current');content.DOM.el.inert=true;
      this.dragPosition=Math.max(-this.maxDrag,Math.min(0,this.savedPosition));this.draggie.setPosition(this.dragPosition,0);this.styles.position.previous=this.styles.position.current=this.dragPosition;
      for(const key of ['scale','imgScale','opacity','indicatorScale'])this.styles[key].previous=this.styles[key].current=1;
      gsap.set(this.DOM.strip,{x:0});this.DOM.inner.inert=false;this.state='idle';this.root.dataset.state=this.state;this.root.setAttribute('aria-busy','false');if(this.enabled)this.draggie.enable();
      this.onPreviewChange(false);this.items[this.current].DOM.button.focus({preventScroll:true});this.current=-1;this.wake();
    }})
    .set(this.items.map(item=>item.DOM.el),{scale:1,opacity:1},0)
    .set(this.items.map(item=>item.DOM.image),{scale:1},0)
    .to(this.DOM.close,{duration:.8,ease:'power4.out',y:50,opacity:0},.2)
    .to(content.DOM.image,{duration:1,ease:'expo.inOut',y:this.height*1.3,opacity:1},.2);
    for(const item of this.items)timeline.to(item.DOM.el,{duration:this.random(.6,.9),ease:'expo.inOut',y:0},this.random(.4,.6));
    timeline.to(this.DOM.indicator,{duration:1.2,ease:'expo.out',scaleX:1},.5);
    if(this.reduced.matches)timeline.progress(1);
    return true;
  }
  destroy(){
    if(this.destroyed)return;this.destroyed=true;this.events.abort();this.observer.disconnect();cancelAnimationFrame(this.renderId);this.timeline?.kill();
    if(this.draggie.isDragging)this.draggie._dragEnd();if(this.draggie.isPointerDown)this.draggie._pointerDone();this.draggie.destroy();
    gsap.killTweensOf([this.cursor.left,this.cursor.right,this.DOM.strip,...this.items.flatMap(item=>[item.DOM.el,item.DOM.image])]);this.onPreviewChange(false);this.root.remove();
  }
}
