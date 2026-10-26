/* The portrait and helmet share a 1000 x 1100 coordinate plane.
   Eye anchors refer to the untransformed 1000 x 1200 official front portraits. */
const driverHelmetReveal=(()=>{
  const anchors={
    antonelli:{eye:[500,196],width:430,visor:.51},
    russell:{eye:[500,192],width:422,visor:.52},
    hamilton:{eye:[500,205],width:420,visor:.51},
    verstappen:{eye:[500,196],width:430,visor:.52},
    leclerc:{eye:[500,201],width:426,visor:.51},
    norris:{eye:[500,204],width:426,visor:.51},
    piastri:{eye:[500,207],width:428,visor:.51}
  };
  const cache=new Map(),clamp=n=>Math.max(0,Math.min(1,n));
  const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  const context=c=>c.getContext('2d');
  // File-origin images taint a canvas. Load the same WebP bytes as a data URI
  // only for local files; HTTP deployments keep their regular image requests.
  async function imageSource(id){
    if(location.protocol!=='file:')return `img/driver-helmets-front/${id}.webp`;
    if(!window.driverHelmetLocalTextures?.[id])await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=`js/helmet-local-textures/${id}.js`;
      script.onload=()=>{script.remove();resolve();};
      script.onerror=()=>{script.remove();reject(new Error(`Helmet texture unavailable: ${id}`));};
      document.head.append(script);
    });
    return window.driverHelmetLocalTextures[id];
  }
  async function texture(id){
    if(cache.has(id))return cache.get(id);
    const job=(async()=>{
      const image=new Image();image.src=await imageSource(id);await image.decode();
      const raw=canvas(image.naturalWidth,image.naturalHeight),r=context(raw);r.drawImage(image,0,0);
      const {data}=r.getImageData(0,0,raw.width,raw.height),rows=new Uint32Array(raw.height),cols=new Uint32Array(raw.width);
      for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(data[(y*raw.width+x)*4+3]>32){rows[y]++;cols[x]++;}
      // Ignore detached matte specks when framing the product, without changing its artwork.
      const ys=[...rows.keys()].filter(y=>rows[y]>raw.width*.008),xs=[...cols.keys()].filter(x=>cols[x]>raw.height*.008);
      if(!xs.length||!ys.length)throw new Error('Empty helmet alpha');
      const left=Math.max(0,xs[0]-3),top=Math.max(0,ys[0]-3),width=Math.min(raw.width-left,xs.at(-1)-left+4),height=Math.min(raw.height-top,ys.at(-1)-top+4);
      const w=480,h=Math.round(w*height/width),color=canvas(w,h),c=context(color);c.drawImage(image,left,top,width,height,0,0,w,h);
      const pixels=c.getImageData(0,0,w,h),outline=canvas(w,h),o=context(outline),edge=o.createImageData(w,h);
      for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
        const i=(y*w+x)*4,a=pixels.data[i+3];
        if(a<96)continue;
        const silhouette=[i-8,i+8,i-w*8,i+w*8].some(j=>pixels.data[j+3]<64);
        let gradient=0;
        // RGB Sobel edges include visor seams, vents and paint boundaries.
        for(let k=0;k<3;k++){
          const v=(dx,dy)=>pixels.data[((y+dy)*w+x+dx)*4+k]/255;
          const gx=-v(-1,-1)-2*v(-1,0)-v(-1,1)+v(1,-1)+2*v(1,0)+v(1,1);
          const gy=-v(-1,-1)-2*v(0,-1)-v(1,-1)+v(-1,1)+2*v(0,1)+v(1,1);
          gradient=Math.max(gradient,Math.hypot(gx,gy));
        }
        const strength=silhouette?.8:clamp((gradient-.28)/1.2)*.65;
        edge.data.set([205,205,205,Math.round(strength*255)],i);
      }
      o.putImageData(edge,0,0);
      return{color,outline,pixels,w,h,aspect:width/height};
    })();cache.set(id,job);job.catch(()=>cache.delete(id));return job;
  }
  function mount(visual,hero,portrait,id,{front=true}={}){
    const dialog=visual.closest('dialog'),abort=new AbortController(),signal=abort.signal;
    const entry=document.createElement('div'),motion=document.createElement('div'),plane=document.createElement('div');
    entry.className='driver-composite-entry';motion.className='driver-composite-motion';plane.className='driver-composite-plane';
    portrait.classList.add('driver-composite-portrait');plane.append(portrait);motion.append(plane);entry.append(motion);visual.append(entry);
    visual.classList.add('driver-composite');visual.dataset.framing=front?'front':'legacy';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const image=portrait.querySelector('img');
    const surface=document.createElement('canvas');surface.className='driver-helmet-surface';surface.setAttribute('aria-hidden','true');
    plane.append(surface);
    const hasHelmet=front&&Object.hasOwn(anchors,id);
    let stopped=false,prepared=false,frame=0,start=0,lastPaint=0,tex=null,area=null,animations=[],active=false,visible=!dialog?.dataset.editorialEntering;
    let x=0,y=0,tx=0,ty=0,previous=null,speed=0;
    let mask,mc,low,lc,maskPixels,scan,sc,dabs=[];
    const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
    const label=document.createElement('span');label.className='sr-only';label.textContent='Move over the helmet area to reveal its colors. Press Enter for a brief reveal.';
    if(hasHelmet){visual.tabIndex=0;visual.setAttribute('aria-label',`${image.alt}. Interactive helmet reveal`);visual.append(label);}
    const wake=()=>{if(!frame&&!stopped&&active)frame=requestAnimationFrame(tick);};
    function begin(){
      if(stopped||!prepared||!entry.isConnected||!visible)return;
      if(!active){active=true;start=performance.now();
        if(!reduced){const a=entry.animate([{transform:'translate3d(0,64px,0)'},{transform:'translate3d(0,0,0)'}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'});animations.push(a);a.finished.then(()=>a.cancel()).catch(()=>{});}
      }
      paint(performance.now());lastPaint=performance.now();entry.classList.add('is-ready');wake();
    }
    function stamp(a,b){
      const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/Math.max(7,b.radius*.2)));
      for(let i=1;i<=steps;i++){
        const t=i/steps;
        dabs.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,radius:a.radius+(b.radius-a.radius)*t,
          life:a.life+(b.life-a.life)*t,born:a.time+(b.time-a.time)*t,seed:(a.x+b.y)*.037});
      }
    }
    function paint(now){
      if(!tex)return;
      const c=context(surface),{w,h}=tex,mw=low.width,mh=low.height,scale=mw/w;
      const intro=reduced?1:clamp((now-start)/500),cut=intro*(mh+20)-10;
      for(let yy=0;yy<mh;yy++)for(let xx=0;xx<mw;xx++){
        const edge=yy+Math.sin(xx*.16+yy*.12)*1.9+Math.sin(xx*.39-yy*.23)*.8-cut;
        maskPixels.data[(yy*mw+xx)*4+3]=intro<1?Math.round(smooth((edge+1.5)/3)*255):0;
      }
      dabs=dabs.filter(dab=>now-dab.born<dab.life);
      for(const dab of dabs){
        const fade=1-smooth(Math.max(0,now-dab.born)/dab.life);
        const radius=dab.radius*scale,cx=dab.x*scale,cy=dab.y*scale,reach=radius*1.22;
        const left=Math.max(0,Math.floor(cx-reach)),right=Math.min(mw-1,Math.ceil(cx+reach));
        const top=Math.max(0,Math.floor(cy-reach)),bottom=Math.min(mh-1,Math.ceil(cy+reach));
        for(let yy=top;yy<=bottom;yy++)for(let xx=left;xx<=right;xx++){
          const dx=xx-cx,dy=yy-cy,angle=Math.atan2(dy,dx);
          const warp=1+Math.sin(angle*3+dab.seed)*.12+Math.sin(angle*5-dab.seed*.7)*.065
            +Math.sin(xx*.31+yy*.23+dab.seed)*.035;
          const normalized=Math.hypot(dx,dy)/(radius*warp);
          const opacity=(1-smooth((normalized-.82)/.18))*fade,i=(yy*mw+xx)*4;
          maskPixels.data[i+3]=Math.max(maskPixels.data[i+3],Math.round(opacity*255));
        }
      }
      lc.putImageData(maskPixels,0,0);mc.clearRect(0,0,w,h);mc.drawImage(low,0,0,w,h);
      c.clearRect(0,0,w,h);c.globalAlpha=.08;c.drawImage(tex.outline,0,0);c.globalAlpha=1;
      // A bright leading edge travels downward; its softer wake remains above it.
      const cycle=(now-start-650)%4200;
      if(!reduced&&cycle>=0&&cycle<1800){
        const progress=cycle/1800,sy=progress*(h+100)-25;
        const band=sc.createLinearGradient(0,sy-68,0,sy+8);
        band.addColorStop(0,'transparent');band.addColorStop(.55,'#dbe8ef18');
        band.addColorStop(.84,'#e8f3f78c');band.addColorStop(.9,'#f2fbff');
        band.addColorStop(.94,'#e8f3f7a0');band.addColorStop(1,'transparent');
        sc.clearRect(0,0,w,h);sc.globalCompositeOperation='source-over';sc.drawImage(tex.outline,0,0);
        sc.globalCompositeOperation='source-in';sc.fillStyle=band;sc.fillRect(0,0,w,h);sc.globalCompositeOperation='source-over';
        const strength=Math.min(1,progress*8,(1-progress)*8);
        c.save();c.globalAlpha=strength*.38;c.filter='blur(2px)';c.drawImage(scan,0,0);
        c.filter='none';c.globalAlpha=strength;c.drawImage(scan,0,0);c.restore();
      }
      // Applying the original alpha last clips all liquid color to the helmet.
      mc.globalCompositeOperation='source-in';mc.drawImage(tex.color,0,0);mc.globalCompositeOperation='source-over';c.drawImage(mask,0,0);
      visual.dataset.helmetState=intro<1?'dissolving':dabs.length?'revealing':'idle';
    }
    function tick(now){
      frame=0;if(stopped||!entry.isConnected||!dialog?.open)return;
      x+=(tx-x)*.1;y+=(ty-y)*.1;
      motion.style.transform=`translate3d(${(x*8).toFixed(2)}px,${(y*5).toFixed(2)}px,0)`;
      const scanPhase=(now-start-650)%4200;
      const interval=dabs.length||now-start<520||(!reduced&&scanPhase>=0&&scanPhase<1800)?16:33;
      if(now-lastPaint>=interval||(now-start>=500&&visual.dataset.helmetState==='dissolving')){paint(now);lastPaint=now;}
      const moving=Math.abs(tx-x)+Math.abs(ty-y)>.002;
      if(!document.hidden&&(now-start<520||dabs.length||moving||(!reduced&&tex)))wake();
    }
    function pointer(event){
      if(event.pointerType==='touch'&&event.type==='pointermove')return;
      const bounds=hero.getBoundingClientRect();if(!reduced){tx=clamp((event.clientX-bounds.left)/bounds.width)*2-1;ty=clamp((event.clientY-bounds.top)/bounds.height)*2-1;}
      if(tex){const rect=surface.getBoundingClientRect(),px=(event.clientX-rect.left)/rect.width*tex.w,py=(event.clientY-rect.top)/rect.height*tex.h;
        if(px>=0&&py>=0&&px<tex.w&&py<tex.h&&tex.pixels.data[(Math.floor(py)*tex.w+Math.floor(px))*4+3]>24){
          const now=performance.now(),connected=previous&&now-previous.time<120;
          const distance=connected?Math.hypot(px-previous.x,py-previous.y):0;
          if(!connected||distance>.35){
            const velocity=connected?distance/Math.max(8,now-previous.time):0;
            speed=connected?speed+(clamp(velocity/1.8)-speed)*.3:0;
            const point={x:px,y:py,time:now,radius:38+speed*58,life:560+speed*640};
            stamp(connected?previous:point,point);previous=point;
            visual.dataset.revealRadius=point.radius.toFixed(1);
          }
        }else{previous=null;speed=0;}
      }wake();
    }
    hero.addEventListener('pointermove',pointer,{signal,passive:true});hero.addEventListener('pointerdown',pointer,{signal,passive:true});
    hero.addEventListener('pointerleave',()=>{tx=ty=0;previous=null;speed=0;wake();},{signal});
    visual.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(tex){const now=performance.now(),point={x:tex.w/2,y:tex.h/2,radius:90,life:900,time:now};stamp(point,point);wake();}}},{signal});
    dialog?.addEventListener('driver-profile-visible',()=>{visible=true;begin();},{signal});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();},{signal});
    const destroy=()=>{if(stopped)return;stopped=true;active=false;abort.abort();cancelAnimationFrame(frame);animations.forEach(a=>a.cancel());dabs=[];};
    dialog?.addEventListener('close',destroy,{signal,once:true});
    const photoReady=image.decode().catch(()=>{});
    const ready=(async()=>{
      if(hasHelmet){try{
        tex=await texture(id);if(stopped)return;
        const a=anchors[id],width=a.width*.92,height=width/tex.aspect;
        area={left:a.eye[0]-width/2,top:a.eye[1]+70-height*a.visor,width,height};
        Object.assign(surface.style,{left:`${area.left/10}%`,top:`${area.top/11}%`,width:`${area.width/10}%`,height:`${area.height/11}%`});surface.width=tex.w;surface.height=tex.h;
        mask=canvas(tex.w,tex.h);mc=context(mask);scan=canvas(tex.w,tex.h);sc=context(scan);
        low=canvas(160,Math.round(160/tex.aspect));lc=context(low);maskPixels=lc.createImageData(low.width,low.height);
        for(let i=0;i<maskPixels.data.length;i+=4)maskPixels.data.set([255,255,255,0],i);
      }catch(error){console.error(`Driver helmet failed (${id})`,error);visual.dataset.helmetState='unavailable';surface.remove();tex=null;}}
      else{surface.remove();visual.dataset.helmetState='unavailable';}
      await photoReady;if(stopped)return;prepared=true;requestAnimationFrame(begin);
    })();
    return{destroy,ready,get geometry(){return area;}};
  }
  async function preload(){
    const results=[];
    for(const id of Object.keys(anchors)){
      try{await texture(id);results.push({id,ready:true});}
      catch(error){results.push({id,ready:false});if(typeof garagePreloadStatus!=='undefined')garagePreloadStatus.failed.push(`helmet:${id}`);}
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    return results;
  }
  return{mount,preload,anchors,assets:Object.keys(anchors).map(id=>`img/driver-helmets-front/${id}.webp`)};
})();
