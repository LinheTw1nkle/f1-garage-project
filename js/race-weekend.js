/* Race weekend layout, independently implemented for F1 Garage.
 * Layout reference: https://github.com/jerosajose/racing-site/tree/main/races
 * Uses the project's existing results and lap-chart sources, without demo data.
 */
'use strict';
const raceWeekendCircuits={
  australia:['albertPark','ALB'],china:['shanghai','SHA'],japan:['suzuka','SUZ'],miami:['miami','MIA'],canada:['montreal','GIL'],monaco:['monaco','MON'],barcelona:['barcelona','BCN'],austria:['spielberg','RBR'],britain:['silverstone','SIL'],belgium:['spa','SPA'],hungary:['hungaroring','HUN'],netherlands:['zandvoort','ZAN'],italy:['monza','MNZ'],spain:['madring','MAD'],azerbaijan:['baku','BAK'],bahrain:['sepang','SEP'],singapore:['singapore','MRB'],usa:['austin','COT'],mexico:['mexico','MEX'],brazil:['interlagos','INT'],'las-vegas':['lasVegas','LAS'],qatar:['lusail','LUS'],'abu-dhabi':['yasMarina','YAS']
};
const raceWeekendNode=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
function raceWeekendTime(value){if(typeof value!=='string'||!/^\d+(?::\d+){1,2}\.\d+$/.test(value))return Infinity;return value.split(':').reduce((total,part)=>total*60+Number(part),0);}
function raceWeekendResults(race,session){
  const drivers=[...seasonData['2026'].drivers,...(seasonData['2026'].reserveDrivers||[]),...(race.practiceGuests||[])];
  const qualifying=session==='qualifying'||session==='sprint-qualifying',prefix=session==='sprint-qualifying'?'SQ':'Q';
  return Object.entries(race.results||{}).flatMap(([id,result])=>{
    const driver=drivers.find(item=>item.id===id);if(!driver)return[];
    if(session==='race'||session==='sprint'){
      if(!result[session])return[];const match=String(result[session]).match(/^P?(\d+)$/),position=match?Number(match[1]):Infinity;
      return[{driver,result,position,value:result[session],time:result[session+'TotalTime']||'—',laps:result[session+'Laps'],phase:0}];
    }
    const times=result.lapTimes||{};
    if(qualifying){
      let phase=0,time='—';for(let i=3;i>=1;i--)if(Number.isFinite(raceWeekendTime(times[prefix+i]))){phase=i;time=times[prefix+i];break;}
      if(!phase)return[];return[{driver,result,phase,time,position:Infinity,value:prefix+phase}];
    }
    if(!Number.isFinite(raceWeekendTime(times[session])))return[];
    return[{driver,result,time:times[session],phase:0,position:Infinity,value:''}];
  }).sort((a,b)=>qualifying?b.phase-a.phase||raceWeekendTime(a.time)-raceWeekendTime(b.time):(session==='race'||session==='sprint')?a.position-b.position:raceWeekendTime(a.time)-raceWeekendTime(b.time));
}
function renderRaceWeekend(root,race,chart,note){
  root.podiumSizeObserver?.disconnect();
  root.pendingWeekendRace=null;
  const changedRace=root.weekendRaceId!==race.id;root.weekendRaceId=race.id;
  const create=raceWeekendNode;
  const workspace=create('div','race-weekend-workspace');
  const tower=create('aside','race-timing-tower');tower.setAttribute('aria-label','Grand Prix circuit selection');
  const towerHeader=create('div','race-tower-heading');towerHeader.append(create('span','race-tower-mark','CIRCUITS'),create('div','race-tower-season','2026'));
  const towerList=create('nav','race-tower-list');towerList.setAttribute('aria-label','Select circuit');
  seasonData['2026'].races.forEach((item,index)=>{
    const info=raceWeekendCircuits[item.id],track=info?circuitData[info[0]]:null,name=track?.name||item.nameEnglish;
    const button=create('button','race-tower-item');button.type='button';button.dataset.positionRace=item.id;button.setAttribute('aria-pressed',String(item.id===race.id));button.setAttribute('aria-label',name);button.title=name;
    const row=create('span','race-tower-row'),round=create('span','race-tower-round',String(index+1).padStart(2,'0')),flag=create('span','race-tower-flag');setFlagLabel(flag,item.flag,'');
    row.append(round,flag,create('strong','race-tower-code',info?.[1]||item.id.slice(0,3).toUpperCase()),create('span','race-tower-indicator'));
    const expanded=create('span','race-tower-expanded'),full=create('span','race-tower-fullname',name);expanded.append(full);button.append(row,expanded);
    button.addEventListener('click',()=>{if(item.id===selectedPositionRace&&!root.pendingWeekendRace)return;root.pendingWeekendRace=item.id;root.weekendTowerScrollTop=towerList.scrollTop;towerList.querySelectorAll('button').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));switchRacePositionChart(()=>{selectedPositionRace=item.id;if(!item.sprint)selectedPositionSession='race';},`[data-position-race="${item.id}"]`);});towerList.append(button);
  });
  towerList.addEventListener('scroll',()=>{root.weekendTowerScrollTop=towerList.scrollTop;},{passive:true});
  towerList.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const buttons=[...towerList.querySelectorAll('button')],current=buttons.indexOf(document.activeElement);if(current<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,current+(event.key==='ArrowDown'?1:-1)));buttons[next].focus();});
  tower.append(towerHeader,towerList);
  const main=create('div','race-weekend-main'),hero=create('header','race-weekend-heading');
  hero.append(create('h2','race-weekend-title',race.nameEnglish));
  const content=create('div','race-weekend-content'),schedule=create('section','race-weekend-schedule');schedule.setAttribute('aria-labelledby','raceWeekendScheduleTitle');
  const scheduleHeader=create('div','race-weekend-section-heading');scheduleHeader.append(create('h3','','WEEKEND SESSIONS'));scheduleHeader.firstElementChild.id='raceWeekendScheduleTitle';schedule.append(scheduleHeader);
  const sessions=race.sprint?[['P1','FP1','FREE PRACTICE 1'],['sprint-qualifying','SQ','SPRINT QUALIFYING'],['sprint','SPR','SPRINT'],['qualifying','Q','QUALIFYING'],['race','GP','RACE']]:[['P1','FP1','FREE PRACTICE 1'],['P2','FP2','FREE PRACTICE 2'],['P3','FP3','FREE PRACTICE 3'],['qualifying','Q','QUALIFYING'],['race','GP','RACE']];
  sessions.forEach(([session,code,label],index)=>{
    const rows=raceWeekendResults(race,session),details=create('details','race-session-card');details.dataset.session=session;
    const summary=create('summary','race-session-summary'),badge=create('span','race-session-code',code),identity=create('span','race-session-identity');
    identity.append(create('strong','',label));
    summary.append(badge,identity,create('span','race-session-expand','+'));details.append(summary);
    const body=create('div','race-session-body');
    if(!rows.length)body.append(create('p','race-session-empty','Session results have not been entered for this Grand Prix.'));
    else{
      const table=create('table','race-session-table'),head=create('thead',''),tr=create('tr','');
      const raceSession=session==='race'||session==='sprint';for(const text of['POS','DRIVER',raceSession?'TOTAL TIME / STATUS':'LAP TIME',raceSession?'LAPS':'PHASE'])tr.append(create('th','',text));head.append(tr);table.append(head);
      const tbody=create('tbody','');rows.forEach((entry,i)=>{const row=create('tr',''),position=raceSession?(Number.isFinite(entry.position)?entry.position:entry.value):i+1,driverCell=create('td','race-session-driver');driverCell.style.setProperty('--race-team-color',racePositionTeams[entry.driver.team]?.color||'#75dafa');driverCell.append(create('strong','',entry.driver.name),create('small','',entry.driver.team));row.append(create('td','',position),driverCell,create('td','',entry.time),create('td','',raceSession?(entry.laps??'—'):(entry.value||code)));tbody.append(row);});table.append(tbody);body.append(table);
    }
    details.append(body);schedule.append(details);
    details.addEventListener('toggle',()=>{if(!details.open||reducedMotionPreference.matches)return;body.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});});
  });
  const podium=create('section','race-weekend-podium');podium.setAttribute('aria-label','Top three finishers');
  const podiumHeading=create('div','race-weekend-section-heading');podiumHeading.append(create('h3','','PODIUM'));podium.append(podiumHeading);
  const podiumGrid=create('div','race-podium-grid'),winners=raceWeekendResults(race,selectedPositionSession).filter(entry=>Number.isFinite(entry.position)).slice(0,3);
  for(let position=1;position<=3;position++){
    const entry=winners.find(item=>item.position===position),card=create('article',`race-podium-driver race-podium-place-${position}`);card.style.setProperty('--race-team-color',racePositionTeams[entry?.driver.team]?.color||'#7c94ad');
    const imageBox=create('div','race-podium-photo');
    if(entry){const media=driverMediaFor(entry.driver,'2026')||archiveDriverMedia[entry.driver.id];if(media?.photo){const image=create('img','');image.src=media.photo;image.alt=entry.driver.name;image.decoding='async';imageBox.append(image);}else imageBox.append(create('span','race-podium-placeholder','PORTRAIT UNAVAILABLE'));}
    else imageBox.append(create('span','race-podium-placeholder','AWAITING RESULTS'));
    const lower=create('div','race-podium-lower'),identity=create('strong','race-podium-name'),ink=create('span','race-podium-name-ink'),name=(entry?.driver.name||'Awaiting Results').split(' ');
    ink.append(create('span','race-podium-given',name.shift()),create('span','race-podium-surname',name.join(' ')));identity.append(ink);identity.setAttribute('aria-label',entry?.driver.name||'Awaiting Results');
    lower.append(create('b','race-podium-rank',String(position)),identity,create('span','race-podium-team',entry?.driver.team||'—'));card.append(imageBox,lower);podiumGrid.append(card);
    if(!reducedMotionPreference.matches){
      const delay=90+(position-1)*85,options={duration:760,delay,easing:'cubic-bezier(.45,0,.4,1)',fill:'backwards'};
      imageBox.animate([{opacity:0,transform:'scale(.78)'},{opacity:1,transform:'scale(1)'}],options);
      lower.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1.035)',offset:.55},{opacity:1,transform:'scale(1)'}],options);
      identity.animate([{opacity:0,transform:'translateX(24px)'},{opacity:1,transform:'none'}],{...options,delay:delay+120,duration:640});
      lower.lastElementChild.animate([{opacity:0,transform:'translateX(14px)'},{opacity:1,transform:'none'}],{...options,delay:delay+200,duration:560});
    }
  }
  podium.append(podiumGrid);content.append(schedule,podium);
  const chartPanel=create('section','race-weekend-chart');chartPanel.setAttribute('aria-label','Lap-by-lap positions');
  const chartHeading=create('div','race-weekend-section-heading'),chartTitle=create('h3','','LAP-BY-LAP POSITIONS'),chartTabs=create('div','race-chart-session-tabs');
  for(const session of race.sprint?['race','sprint']:['race']){const button=create('button','',session.toUpperCase());button.type='button';button.dataset.weekendChartSession=session;button.setAttribute('aria-pressed',String(selectedPositionSession===session));button.addEventListener('click',()=>{if(selectedPositionSession!==session)switchRacePositionChart(()=>{selectedPositionSession=session;},`[data-weekend-chart-session="${session}"]`);});chartTabs.append(button);}
  chartHeading.append(chartTitle,chartTabs);
  const board=chart.querySelector('.race-classification'),plot=chart.querySelector('.race-position-plot');
  if(board){const compare=create('details','race-chart-comparison');compare.append(create('summary','','COMPARE DRIVERS / FINAL CLASSIFICATION'));compare.append(board);chart.replaceChildren(plot,compare);}
  chartPanel.append(chartHeading,chart);main.append(hero,content,chartPanel);workspace.append(tower,main);root.replaceChildren(workspace);towerList.scrollTop=root.weekendTowerScrollTop||0;
  if(changedRace)root.closest('.panel-body').scrollTop=0;
  document.getElementById('raceSessionTabs').hidden=true;
  const fitNames=()=>{if(!workspace.isConnected)return;podiumGrid.querySelectorAll('.race-podium-name').forEach(node=>{const ink=node.firstElementChild,style=getComputedStyle(node),available=node.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-2;ink.style.transform=`scaleX(${Math.min(1,available/Math.max(1,ink.scrollWidth))})`;});};
  root.podiumSizeObserver=new ResizeObserver(fitNames);root.podiumSizeObserver.observe(podiumGrid);fitNames();document.fonts.ready.then(fitNames);
  if(!reducedMotionPreference.matches){
    hero.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:420,easing:'ease-out'});
    schedule.querySelectorAll('.race-session-card').forEach((node,index)=>node.animate([{opacity:0,transform:'translateY(16px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1.008)',offset:.7},{opacity:1,transform:'none'}],{duration:620,delay:40+index*45,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'}));
    towerList.querySelector('[aria-pressed="true"] .race-tower-row')?.animate([{transform:'translateX(-5px)',opacity:.5},{transform:'none',opacity:1}],{duration:350,easing:'ease-out'});
  }
}
