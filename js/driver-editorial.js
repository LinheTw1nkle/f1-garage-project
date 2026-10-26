/* Driver editorial with a helmet hero and the original scrollable archive. */
const driverFrontAssets=Object.keys(driverIntroductions).map(id=>`img/driver-front-portraits/${id}.webp`);
if(typeof garageAssetManifest!=='undefined')garageAssetManifest.images.push(...driverFrontAssets,...driverHelmetReveal.assets);
function renderDriverEditorial(container,driver,profile,season,media,parts){
  container.driverSwitching=false;container.editorialObserver?.disconnect();container.editorialCleanup?.();
  const el=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const {portrait,identity,basics,honorsTitle,honors,timelineTitle,timeline}=parts,dialog=container.closest('dialog');
  const teamColor=racePositionTeams[driver.team]?.color||'#75dafa';dialog?.style.setProperty('--driver-light',teamColor);
  container.classList.add('driver-editorial');
  const hero=el('section','driver-editorial-screen driver-editorial-hero');hero.setAttribute('aria-label',`${driver.name} driver profile`);
  const visual=el('div','driver-editorial-visual');
  const front=String(season)==='2026'&&Object.hasOwn(driverIntroductions,driver.id),image=portrait.querySelector('img');
  if(front){image.src=`img/driver-front-portraits/${driver.id}.webp`;image.decoding='async';}
  const copy=el('div','driver-editorial-copy driver-editorial-left'),identityList=el('div','driver-editorial-identity-list');
  const nationality=basics.querySelectorAll('.stat-card')[1]?.querySelector('strong');
  if(nationality){const row=el('div','driver-editorial-nationality');row.append(nationality.cloneNode(true));identityList.append(row);}
  identityList.append(el('div','',driver.team));
  if(media?.numberImage){const numberRow=el('div','driver-editorial-id-number','DRIVER'),number=el('img','');number.src=media.numberImage;number.alt=String(profile.number||driver.number||driver.name);numberRow.append(number);identityList.append(numberRow);}
  else if(profile.number||driver.number)identityList.append(el('div','',`DRIVER ${profile.number||driver.number}`));
  copy.append(identity,identityList);
  const right=el('aside','driver-editorial-right');right.setAttribute('aria-label','Season and career statistics');
  const metricValues=[];
  const metric=(label,value)=>{const item=el('div','driver-editorial-metric'),caption=el('span','',label),amount=el('strong','',value===undefined||value===null?'—':String(value));if(Number.isFinite(Number(value))&&value!==null&&value!==undefined)metricValues.push({node:amount,value:Number(value)});item.append(caption,amount);return item;};
  const races=seasonData[season]?.races||[],entries=races.filter(race=>race.results?.[driver.id]?.race),podiums=entries.filter(race=>/^P?[123]$/.test(String(race.results[driver.id].race))).length;
  const seasonBlock=el('section','driver-editorial-fact-block driver-editorial-season'),seasonMetrics=el('div','driver-editorial-metrics');seasonMetrics.append(metric('RACES',entries.length||undefined),metric('PODIUMS',entries.length?podiums:undefined),metric('POINTS',driver.points));seasonBlock.append(el('h3','',`${season} SEASON`),seasonMetrics);
  const careerBlock=el('section','driver-editorial-fact-block driver-editorial-career'),careerMetrics=el('div','driver-editorial-metrics');careerMetrics.append(metric('WINS',profile.career?.wins),metric('PODIUMS',profile.career?.podiums),metric('TITLES',profile.career?.titles));careerBlock.append(el('h3','','CAREER'),careerMetrics);
  right.append(seasonBlock,careerBlock);hero.append(copy,visual,right);
  const screens=[hero],introduction=driverIntroductions[driver.id]?.text;
  if(introduction){
    const story=el('section','driver-editorial-screen driver-editorial-story');
    const quote=driverIntroductions[driver.id]?.quote;
    if(quote){
      story.classList.add('driver-editorial-quote');story.setAttribute('aria-label',`${driver.name} quote`);
      const mark=el('span','driver-editorial-quote-mark','”');mark.setAttribute('aria-hidden','true');
      story.append(mark,el('blockquote','driver-editorial-quote-text',quote),el('p','driver-editorial-quote-author',driver.name));
    }else{
      story.setAttribute('aria-label','Driver biography');
      story.append(el('h2','driver-editorial-heading','DRIVER BIOGRAPHY'),el('p','driver-editorial-intro',introduction));
    }
    screens.push(story);
  }
  const data=el('section','driver-editorial-screen driver-editorial-data');data.setAttribute('aria-label','Career achievements and driver biography');
  const achievements=el('div','driver-editorial-career-card'),biography=el('article','driver-editorial-biography');
  const biographyText=el('div','driver-editorial-biography-text');
  const paragraphs=driverIntroductions[driver.id]?.paragraphs||(introduction?[introduction]:[]);
  if(paragraphs.length>4)biography.classList.add('driver-editorial-biography-long');
  biography.append(el('h2','driver-editorial-heading','DRIVER BIOGRAPHY'));
  for(const paragraph of paragraphs)biographyText.append(el('p','',paragraph));
  if(!paragraphs.length)biographyText.append(el('p','','Biography not available.'));
  biography.append(biographyText);achievements.append(honorsTitle,honors);data.append(achievements,biography);screens.push(data);
  const history=el('section','driver-editorial-screen driver-editorial-history');history.setAttribute('aria-label','Career timeline');
  history.append(timelineTitle,timeline);screens.push(history);
  container.replaceChildren(...screens);container.scrollTop=0;
  const reveal=driverHelmetReveal.mount(visual,hero,portrait,driver.id,{front});container.helmetReveal=reveal;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let countFrame=0;
  const startCount=()=>{if(reduced)return;const start=performance.now();const count=now=>{if(!hero.isConnected||!dialog?.open)return;const t=Math.min(1,(now-start)/1100),progress=1-Math.pow(1-t,3);metricValues.forEach(({node,value})=>node.textContent=(Math.round(value*progress*(Number.isInteger(value)?1:10))/(Number.isInteger(value)?1:10)).toLocaleString('en-US'));if(t<1)countFrame=requestAnimationFrame(count);};countFrame=requestAnimationFrame(count);};
  const visible=()=>startCount();dialog?.addEventListener('driver-profile-visible',visible,{once:true});
  if(!dialog?.dataset.editorialEntering)requestAnimationFrame(startCount);
  const cleanup=()=>{cancelAnimationFrame(countFrame);reveal.destroy();dialog?.removeEventListener('driver-profile-visible',visible);dialog?.removeEventListener('close',cleanup);};
  dialog?.addEventListener('close',cleanup,{once:true});container.editorialCleanup=cleanup;
}
