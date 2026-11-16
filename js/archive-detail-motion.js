/* Team detail surfaces: only the wipe moves; content fades in its travel order. */
'use strict';
function createArchiveDetailMotion(){
  let curtain=null,wipe=null,busy=false,destroyed=false,version=0;
  const animations=new Set(),reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(node,frames,options){
    const animation=node.animate(frames,{fill:'both',...options});animations.add(animation);
    return animation.finished.catch(()=>{});
  }
  function layers(source){return [...(typeof source==='function'?source():source||[])].filter(node=>node.isConnected&&node.getBoundingClientRect().bottom>0&&node.getBoundingClientRect().top<innerHeight);}
  function fade(source,appearing,fromLeft,delay=0){
    return layers(source).map(node=>{
      const bounds=node.getBoundingClientRect(),distance=Math.max(0,Math.min(1,fromLeft?bounds.left/innerWidth:1-bounds.right/innerWidth));
      const opacity=getComputedStyle(node).opacity;
      return animate(node,[{opacity:appearing?0:opacity},{opacity:appearing?opacity:0}],{duration:appearing?350:300,delay:delay+distance*180,easing:'cubic-bezier(.215,.61,.355,1)'});
    });
  }
  async function run({closing=false,exitLayers,swap,entryLayers,valid=()=>true,onCancel}){
    if(busy||destroyed||!valid())return false;
    busy=true;const token=++version;
    const alive=()=>!destroyed&&version===token&&valid();
    try{
      if(reduced()){swap();return alive();}
      curtain=document.createElement('dialog');curtain.className='driver-motion-curtain archive-detail-curtain';curtain.setAttribute('aria-label',closing?'Returning to team overview':'Opening team details');
      wipe=document.createElement('div');wipe.className='driver-motion-wipe';curtain.append(wipe);document.body.append(curtain);
      curtain.addEventListener('cancel',event=>{event.preventDefault();onCancel?.();});
      curtain.showModal();
      fade(exitLayers,false,closing);
      await animate(wipe,[{transform:`translate3d(${closing?'-100%':'100%'},0,0)`},{transform:'translate3d(0,0,0)'}],{duration:500,easing:closing?'cubic-bezier(.215,.61,.355,1)':'ease-in-out'});
      if(!alive())return false;
      swap();
      if(!alive())return false;
      // Reinsert the transparent carrier above any dialog opened by the swap.
      curtain.close();curtain.showModal();
      const entries=fade(entryLayers,true,closing,closing?0:200);
      await animate(wipe,[{transform:'translate3d(0,0,0)'},{transform:`translate3d(${closing?'100%':'-100%'},0,0)`}],{duration:500,delay:closing?0:200,easing:'cubic-bezier(.215,.61,.355,1)'});
      if(!alive())return false;
      curtain.close();await Promise.all(entries);return alive();
    }finally{
      for(const animation of animations)animation.cancel();animations.clear();
      curtain?.close();curtain?.remove();curtain=null;wipe=null;busy=false;
    }
  }
  return{run,get busy(){return busy;},destroy(){destroyed=true;version++;for(const animation of animations)animation.cancel();animations.clear();curtain?.close();curtain?.remove();}};
}
const teamArchiveMotion=createArchiveDetailMotion();
