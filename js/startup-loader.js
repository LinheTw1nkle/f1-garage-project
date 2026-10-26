'use strict';
const garageStartupLoader=(()=>{
  const root=document.getElementById('sf26StartupLoader'),number=document.getElementById('sf26LoadPercent');
  const template=root.querySelector('.sf26-loader-progress');let strokeLength=0;
  // SVG restarts its dash pattern for each subpath; sequence the seams explicitly.
  const strokes=template.getAttribute('d').match(/M[^M]+/g).map(d=>{
    const path=template.cloneNode(false);path.setAttribute('d',d);path.removeAttribute('pathLength');template.before(path);
    const length=path.getTotalLength(),offset=strokeLength;strokeLength+=length;
    path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length);
    return{path,length,offset};
  });template.remove();
  const jobs=new Map();let frame=0,displayed=0,previous=0,completed=false,resolveFinish;
  function progress(){
    const status=garagePreloadStatus;
    const images=status.imagesComplete?1:Math.min(1,(status.imageLoaded||0)/Math.max(1,status.imageTotal||1));
    const fonts=Math.min(1,status.fonts.length/5),resources=status.resourcesComplete?1:0;
    return completed?100:Math.min(99,images*55+fonts*8+resources*18+(jobs.get('model')?8:0)+(jobs.get('effects')?6:0)+(jobs.get('portal')?5:0));
  }
  function tick(now){
    frame=0;const dt=Math.min(80,previous?now-previous:16);previous=now;
    const target=progress();displayed=Math.max(displayed,displayed+(target-displayed)*(1-Math.exp(-dt/100)));
    if(completed&&100-displayed<.25)displayed=100;
    const percent=Math.floor(displayed);number.textContent=String(percent);root.style.setProperty('--load-progress',displayed.toFixed(3));
    const drawn=strokeLength*displayed/100;
    for(const{path,length,offset}of strokes)path.style.strokeDashoffset=String(length-Math.max(0,Math.min(length,drawn-offset)));
    root.setAttribute('aria-valuenow',String(percent));
    if(displayed===100){resolveFinish?.();resolveFinish=null;return;}
    frame=requestAnimationFrame(tick);
  }
  function start(){
    document.getElementById('sceneTransition').classList.add('is-startup');
    document.getElementById('sceneTransition').append(root);frame=requestAnimationFrame(tick);
  }
  function finish(){completed=true;return new Promise(resolve=>{resolveFinish=resolve;if(!frame)frame=requestAnimationFrame(tick);});}
  function stop(){cancelAnimationFrame(frame);frame=0;document.getElementById('sceneTransition').classList.remove('is-startup');}
  return{start,finish,stop,mark:key=>jobs.set(key,true)};
})();
