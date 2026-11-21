/* Product-led tyre guide; wear is an illustrative model, not measured race data. */
'use strict';
const tyreGuideCompounds={H:{name:'HARD',color:'#e2e6ed',surface:'SLICK',description:'The hardest nominated dry compound. A durable option for longer stints.',grip:'Lower peak grip',duration:'Longer stint potential'},M:{name:'MEDIUM',color:'#f5d54f',surface:'SLICK',description:'The middle nominated compound balances performance and durability.',grip:'Balanced dry grip',duration:'Balanced stint potential'},S:{name:'SOFT',color:'#ff4b50',surface:'SLICK',description:'The softest nominated dry compound prioritises grip and short-run performance.',grip:'Higher peak grip',duration:'Shorter stint potential'},I:{name:'INTERMEDIATE',color:'#54cf88',surface:'GROOVED',description:'For damp tracks and changing conditions, with grooves to clear water.',grip:'Damp track conditions',duration:'Depends on water level'},W:{name:'FULL WET',color:'#59b8ff',surface:'GROOVED',description:'Deep grooves help clear standing water in wet conditions.',grip:'Wet track conditions',duration:'Depends on water level'}};
function renderTyreGuide(){
 const root=document.getElementById('tyreGuide');root.tyreRenderer?.destroy();
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
 const notes={
  H:[['USE','Longer dry stints'],['CHARACTER','Durability over peak grip'],['WARM-UP','More gradual']],
  M:[['USE','Versatile dry running'],['CHARACTER','Grip and durability in balance'],['WARM-UP','Balanced']],
  S:[['USE','Shorter dry stints'],['CHARACTER','Grip over longevity'],['WARM-UP','Quicker']],
  I:[['USE','Damp or drying tracks'],['TREAD','Grooves disperse water'],['CONDITIONS','Changing water levels']],
  W:[['USE','Wet tracks with standing water'],['TREAD','Deeper drainage grooves'],['CONDITIONS','Heavy water coverage']]
 };
 const rates={H:.72,M:.92,S:1.2,I:.86,W:.78};let selected='S',maxLaps=40;
 const layout=el('div','tyre-guide-layout'),hero=el('section','tyre-catalogue'),choices=el('nav','tyre-guide-choices');
 choices.setAttribute('aria-label','Tyre type');
 for(const[id,c]of Object.entries(tyreGuideCompounds)){
  const button=el('button','tyre-guide-choice');button.type='button';button.dataset.guideCompound=id;
  button.style.setProperty('--choice-color',c.color);button.setAttribute('aria-label',c.name);
  button.append(el('span','tyre-choice-code',id),el('span','tyre-choice-name',c.name));
  button.addEventListener('click',()=>{if(selected===id)return;selected=id;update();});choices.append(button);
 }
 const visual=el('div','tyre-guide-visual'),wheel=el('div','tyre-guide-wheel tyre-material-stage');
 const control=el('label','tyre-wear-control'),controlHead=el('span','tyre-distance-heading'),lapValue=el('strong','tyre-distance-value','00');
 controlHead.append(el('span','','LAPS COMPLETED'),lapValue);
 const range=el('input');range.type='range';range.min=0;range.max=40;range.step=1;range.value=0;range.setAttribute('aria-label','Illustrative laps completed');
 const endpoints=el('span','tyre-distance-endpoints');endpoints.append(el('span','','FRESH'),el('span','','WORN'));
 control.append(controlHead,range,endpoints);
 const wearStatus=el('div','tyre-wear-status'),phase=el('span'),reset=el('button','','RESET');reset.type='button';reset.setAttribute('aria-label','Reset tyre wear');reset.addEventListener('click',()=>{range.value=0;updateWear();});wearStatus.append(phase,reset);
 const wheelControls=el('div','tyre-model-controls');wheelControls.append(control,wearStatus);visual.append(wheel,wheelControls);
 const copy=el('div','tyre-catalogue-copy'),name=el('h2','tyre-catalogue-name'),surface=el('span','tyre-catalogue-surface'),description=el('p','tyre-guide-description'),facts=el('dl','tyre-catalogue-facts');
 copy.append(surface,name,description,facts);hero.append(choices,visual,copy);

 layout.append(hero);root.replaceChildren(layout);root.tyreRenderer=createTyreMaterialRenderer(wheel,selected);
 const wearAt=lap=>Math.min(1,Math.pow(Math.max(0,lap)/maxLaps,1.18));
 function updateWear(){
  const lap=Number(range.value),wear=wearAt(lap);
  lapValue.textContent=String(lap).padStart(2,'0');phase.textContent=wear<.15?'Fresh rubber':wear<.45?'Light wear':wear<.75?'Worn tread':'Heavy wear';reset.disabled=lap===0;
  range.setAttribute('aria-valuetext',`${lap} illustrative laps, ${phase.textContent.toLowerCase()}`);
  root.tyreRenderer.setWear(wear);wheel.dataset.wear=String(wear);
 }
 function update(){
  const c=tyreGuideCompounds[selected];root.style.setProperty('--tire-theme',c.color);panel.style.setProperty('--tire-theme',c.color);root.dataset.compound=selected;
  name.textContent=c.name;surface.textContent=c.surface==='SLICK'?'DRY WEATHER / SLICK':'WET WEATHER / GROOVED';description.textContent=c.description;
  notes[selected].forEach(([label,value],index)=>{let row=facts.children[index];if(!row){row=el('div');row.append(el('dt'),el('dd'));facts.append(row);}row.querySelector('dt').textContent=label;row.querySelector('dd').textContent=value;});
  root.tyreRenderer.setType(selected);maxLaps=Math.round(40*Math.pow(1/rates[selected],1/1.18));range.max=maxLaps;range.value=Math.min(Number(range.value),maxLaps);
  choices.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.guideCompound===selected)));updateWear();
  root.tyreStory?.updateCompound(selected);
 }
 range.addEventListener('input',updateWear);update();
 root.tyreStory=bindTyreScrollStory(root,hero,root.tyreRenderer);
 const destroyRenderer=root.tyreRenderer.destroy;
 root.tyreRenderer.destroy=()=>{root.tyreStory?.destroy();root.tyreStory=null;destroyRenderer();};
}
