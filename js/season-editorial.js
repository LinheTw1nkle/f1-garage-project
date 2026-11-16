/* Highlight the inspected round without moving the results or their frozen columns. */
(()=>{
 const frame=document.querySelector('.results-frame'),body=document.getElementById('resultsBody');
 let activeColumn=null,highlighted=[],fade=null;
 function clear(){for(const cell of highlighted)cell.classList.remove('is-column-active');highlighted=[];activeColumn=null;}
 function highlight(event){
  if(event.pointerType==='touch')return;
  const cell=event.target.closest('[data-results-column]');
  const column=cell?Number(cell.dataset.resultsColumn):null;
  if(column===activeColumn)return;clear();
  if(column===null||column<6)return;activeColumn=column;
  highlighted=[...frame.querySelectorAll(`[data-results-column="${column}"]`)];
  for(const node of highlighted)node.classList.add('is-column-active');
 }
 function decorate(){
  clear();
  for(const row of body.rows){
   [...row.cells].forEach((cell,index)=>cell.dataset.resultsColumn=String(index));
   const rank=Number(row.cells[0]?.textContent);
   if(rank>=1&&rank<=3)row.cells[0].dataset.podium=String(rank);
  }
  let column=0;
  for(const cell of document.querySelectorAll('#resultsHeaders th')){cell.dataset.resultsColumn=String(column);column+=cell.colSpan;}
  fade?.cancel();
  if(body.rows.length&&panel.classList.contains('table-view')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
   fade=body.animate([{opacity:.55},{opacity:1}],{duration:220,easing:'ease-out'});
  }
 }
 frame.addEventListener('pointerover',highlight);frame.addEventListener('focusin',highlight);
 frame.addEventListener('pointerleave',clear);frame.addEventListener('focusout',event=>{if(!frame.contains(event.relatedTarget))clear();});
 new MutationObserver(decorate).observe(body,{childList:true});decorate();
 matchMedia('(max-width:700px)').addEventListener('change',()=>{if(panel.classList.contains('table-view'))renderSeasonOverview(true);});
})();
