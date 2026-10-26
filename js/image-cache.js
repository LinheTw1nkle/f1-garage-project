'use strict';
const imageResourceCache=new Map(),canonicalImageCache=new Map(),imageLoadQueue=[];
const imageLoadLimit=navigator.deviceMemory&&navigator.deviceMemory<=4?3:6;
let activeImageLoads=0;
function runImageQueue(){while(activeImageLoads<imageLoadLimit&&imageLoadQueue.length){activeImageLoads++;imageLoadQueue.shift()().finally(()=>{activeImageLoads--;runImageQueue();});}}
function cachedImage(src){
  if(imageResourceCache.has(src))return imageResourceCache.get(src).image;
  const canonical=new URL(src,document.baseURI).href;
  if(canonicalImageCache.has(canonical)){const resource=canonicalImageCache.get(canonical);imageResourceCache.set(src,resource);return resource.image;}
  const image=new Image();image.referrerPolicy='no-referrer';image.decoding='async';
  let resolveReady;const ready=new Promise(resolve=>{resolveReady=resolve;});
  const resource={image,ready,state:'queued'};imageResourceCache.set(src,resource);canonicalImageCache.set(canonical,resource);
  garagePreloadStatus.imageTotal=(garagePreloadStatus.imageTotal||0)+1;
  imageLoadQueue.push(async()=>{
    resource.state='loading';let retries=0;
    await new Promise(resolve=>{
      const finish=success=>{clearTimeout(timer);image.onload=image.onerror=null;resource.state=success?'loaded':'failed';if(!success&&!garagePreloadStatus.failed.includes(src))garagePreloadStatus.failed.push(src);resolve();};
      const timer=setTimeout(()=>finish(false),12000);
      image.onload=()=>finish(true);image.onerror=()=>{if(retries++<1)image.src=src;else finish(false);};image.src=src;
    });
    if(resource.state==='loaded'){try{await image.decode();}catch{resource.state='failed';if(!garagePreloadStatus.failed.includes(src))garagePreloadStatus.failed.push(src);}}
    garagePreloadStatus.imageLoaded=(garagePreloadStatus.imageLoaded||0)+1;resolveReady(image);
  });runImageQueue();return image;
}
async function preloadArchiveImages(...collections){
  const urls=new Set(),seen=new WeakSet();
  function visit(value,key=''){
    if(/source/i.test(key))return;
    if(typeof value==='string'){
      if(value&&(/^(src|photo|image|portrait)$/i.test(key)||/\.(png|jpe?g|webp|gif|svg|avif)([?#].*)?$/i.test(value)))urls.add(value);
      const letters=[...value];if(letters.length===2&&letters.every(c=>c.codePointAt(0)>=0x1f1e6&&c.codePointAt(0)<=0x1f1ff)){const code=letters.map(c=>String.fromCharCode(c.codePointAt(0)-0x1f1e6+97)).join('');urls.add(`img/flags/w160/${code}.png`);}
    }else if(value&&typeof value==='object'&&!seen.has(value)){seen.add(value);Object.entries(value).forEach(([k,v])=>visit(v,k));}
  }
  collections.forEach(value=>visit(value));garageAssetManifest.images.forEach(src=>urls.add(src));
  for(const src of[...urls])if(src.includes('img/flags/w160/'))urls.add(src.replace('/w160/','/w80/'));
  for(const src of[...urls])if(src.includes('-color.webp')){const white=src.replace('-color.webp','.webp');if(!white.startsWith('img/')||garageAssetManifest.images.includes(white))urls.add(white);}
  document.querySelectorAll('img[src]').forEach(image=>urls.add(image.getAttribute('src')));
  const scanRules=rules=>{for(const rule of rules){if(rule.cssRules)scanRules(rule.cssRules);if(!rule.style)continue;for(const match of rule.style.cssText.matchAll(/url\(["']?([^"')]+)["']?\)/g)){const raw=match[1];if(/\.(png|jpe?g|webp|gif|svg|avif)([?#].*)?$/i.test(raw))urls.add(new URL(raw,rule.parentStyleSheet?.href||document.baseURI).href);}}};
  for(const sheet of document.styleSheets){try{scanRules(sheet.cssRules);}catch{}}
  const ordered=[...urls].filter(Boolean).sort((a,b)=>Number(/^https?:/i.test(a))-Number(/^https?:/i.test(b)));
  await Promise.allSettled(ordered.map(src=>{cachedImage(src);return imageResourceCache.get(src).ready;}));garagePreloadStatus.imagesComplete=true;
}
