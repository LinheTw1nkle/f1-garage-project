'use strict';

function createCockpitScreenTransition({gl,canvas,panel,capture,restore,setCamera,requestRender}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Measured from the active garage model's LCD face, rather than its cockpit bounds.
  const screen={x:-.000066,y:.661966,z:.67295,width:.0958,height:.0550};
  const zoomDuration=2100,home=document.querySelector('.home-screen');
  let active=false,prepared=false,settling=false,reverse=false,returning=false,elapsed=0,previous=null,resolveFlight,saved,finishTimer,completion;
  let targetEndpoint=1,velocity=1,velocityTween=null;
  let surface=panel,rect,viewportWidth=0,viewportHeight=0,duration=zoomDuration,approach,viewEye;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const program=gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,'#version 300 es\nin vec3 position;uniform mat4 vp;void main(){gl_Position=vp*vec4(position,1.);}'));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(0.);}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const matrixLocation=gl.getUniformLocation(program,'vp'),buffer=gl.createBuffer(),vao=gl.createVertexArray();
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
  const smooth=t=>t*t*t*(10+t*(-15+6*t));
  const clamp=value=>Math.min(1,Math.max(0,value));
  const mix=(a,b,t)=>a.map((value,i)=>value+(b[i]-value)*t);
  const entryEye=[.92,1.68,-1.18],screenAim=[screen.x,screen.y,screen.z],orbitCentre=[0,.64,.3207];
  function planApproach(scene){
    const eye=scene.eye,dx=eye[0]-orbitCentre[0],dz=eye[2]-orbitCentre[2];
    const yaw=Math.atan2(dx,dz),entryYaw=Math.atan2(entryEye[0]-orbitCentre[0],entryEye[2]-orbitCentre[2]);
    const turn=Math.atan2(Math.sin(entryYaw-yaw),Math.cos(entryYaw-yaw));
    const radius=Math.hypot(dx,dz),entryRadius=Math.hypot(entryEye[0]-orbitCentre[0],entryEye[2]-orbitCentre[2]);
    const milliseconds=720+Math.abs(turn)*260+Math.min(420,Math.abs(radius-entryRadius)*55);
    approach={eye:[...eye],aim:[...scene.target],yaw,turn,radius,entryRadius,milliseconds};
    duration=milliseconds*.55+zoomDuration;
  }
  function layout(){
    if(viewportWidth===innerWidth&&viewportHeight===innerHeight)return;
    viewportWidth=innerWidth;viewportHeight=innerHeight;
    const aspect=viewportWidth/viewportHeight,width=Math.min(screen.width,screen.height*aspect),height=width/aspect;
    rect={left:screen.x+width/2,right:screen.x-width/2,top:screen.y+height/2,bottom:screen.y-height/2,width,height};
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([rect.left,rect.top,screen.z,rect.right,rect.top,screen.z,rect.left,rect.bottom,screen.z,rect.left,rect.bottom,screen.z,rect.right,rect.top,screen.z,rect.right,rect.bottom,screen.z]),gl.DYNAMIC_DRAW);
  }
  function cameraAt(progress){
    layout();
    const time=progress*duration,zoomStart=approach.milliseconds*.55;
    const endDistance=rect.height/(2*Math.tan(.68/2)),startDepth=screen.z+1.18,p=smooth(clamp((time-zoomStart)/zoomDuration));
    // One analytic path: continuously lower and align the eye while moving forward.
    // Logarithmic depth keeps apparent screen growth smooth; the quintic time curve
    // has continuous velocity and acceleration, without an intermediate waypoint stop.
    const depth=startDepth*Math.exp(Math.log(endDistance/startDepth)*p),alignment=depth/startDepth*(1-p);
    const innerEye=[screen.x+(entryEye[0]-screen.x)*alignment,screen.y+(entryEye[1]-screen.y)*alignment,screen.z-depth];
    const t=clamp(time/approach.milliseconds),orbit=smooth(t),radial=smooth(clamp((t-.28)/.72));
    const yaw=approach.yaw+approach.turn*orbit,radius=approach.radius+(approach.entryRadius-approach.radius)*radial;
    const lift=Math.max(0,2.05-(approach.eye[1]+entryEye[1])/2);
    const outerEye=[orbitCentre[0]+Math.sin(yaw)*radius,approach.eye[1]+(entryEye[1]-approach.eye[1])*orbit+4*orbit*(1-orbit)*lift,orbitCentre[2]+Math.cos(yaw)*radius];
    // Overlap the orbit and the established close-up; neither stops at their join.
    const blend=smooth(clamp((time-zoomStart)/(approach.milliseconds-zoomStart)));
    viewEye=progress===0?[...approach.eye]:mix(outerEye,innerEye,blend);
    const aim=mix(approach.aim,screenAim,orbit);
    setCamera(viewEye,aim);
  }
  function release(forced=false){
    if(!active)return;
    clearTimeout(finishTimer);
    const done=resolveFlight,result={cancelled:forced||returning,at:forced?'garage':targetEndpoint===1?'titles':'garage'};resolveFlight=null;
    active=false;prepared=false;settling=false;previous=null;
    if(saved.homeParent)saved.homeParent.insertBefore(home,saved.homeNext?.parentNode===saved.homeParent?saved.homeNext:null);
    surface.style.removeProperty('transform');surface.style.removeProperty('transform-origin');surface.style.removeProperty('visibility');surface.style.removeProperty('clip-path');surface.style.removeProperty('opacity');surface.classList.remove('is-screen-surface');
    canvas.style.removeProperty('opacity');document.body.classList.remove('garage-screen-flight','garage-screen-settling','garage-screen-reverse');
    if(home)home.inert=saved.homeInert;
    restore(saved.scene);saved=null;requestRender(true);done?.(result);
  }
  function finish(){
    if(settling)return;settling=true;
    velocity=0;
    if(targetEndpoint===0){surface.style.visibility='hidden';finishTimer=setTimeout(release,0);return;}
    // At this point the projected panel and the full-size panel have identical bounds.
    surface.style.transform=surface.classList.contains('database-portal-stage')?'translate3d(0,0,0)':'none';document.body.classList.add('garage-screen-settling');
    finishTimer=setTimeout(release,110);
  }
  async function run(preparePage,element=panel,reversing=false){
    if(active)return completion;
    if(reduced.matches){await preparePage();return{cancelled:false,at:reversing?'garage':'titles'};}
    surface=element;surface.classList.add('is-screen-surface');
    saved={scene:capture(),homeInert:home?.inert||false};
    // Keep controls in viewport space, outside both the projected page and canvas.
    if(home){saved.homeParent=home.parentNode;saved.homeNext=home.nextSibling;document.body.append(home);}
    planApproach(saved.scene);
    active=true;prepared=false;settling=false;reverse=reversing;returning=false;previous=null;viewportWidth=0;
    targetEndpoint=reverse?0:1;elapsed=reverse?duration:0;velocity=reverse?-1:1;velocityTween=null;
    const finished=new Promise(r=>resolveFlight=r);completion=finished;
    surface.style.visibility=reverse?'visible':'hidden';surface.style.transformOrigin='0 0';surface.style.clipPath='none';surface.style.opacity='1';
    if(reverse)surface.style.transform='translate3d(0,0,0)';
    document.body.classList.add('garage-screen-flight');document.body.classList.toggle('garage-screen-reverse',reverse);
    // On exit the existing title page stays in place until the first LCD cutout
    // has been rendered, so a stale garage frame cannot cover it for one frame.
    canvas.style.opacity=reverse?'0':'1';cameraAt(reverse?1:0);requestRender(true);
    try{
      await preparePage();
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      if(!active)return await finished;
      prepared=true;
      requestRender(true);return await finished;
    }catch(error){release(true);throw error;}
  }
  function interrupt(){
    if(!active)return Promise.resolve();
    if(!returning){
      returning=true;targetEndpoint=reverse?1:0;clearTimeout(finishTimer);settling=false;
      document.body.classList.remove('garage-screen-settling');canvas.style.opacity='1';
      velocityTween={from:velocity,to:targetEndpoint===1?1:-1,time:0};requestRender(true);
    }
    return completion;
  }
  function step(now){
    if(!active||!prepared||settling)return;
    const dt=previous===null?0:Math.max(0,now-previous);previous=now;const oldVelocity=velocity;
    if(velocityTween){velocityTween.time=Math.min(220,velocityTween.time+dt);velocity=velocityTween.from+(velocityTween.to-velocityTween.from)*smooth(velocityTween.time/220);if(velocityTween.time===220)velocityTween=null;}
    elapsed=Math.max(0,Math.min(duration,elapsed+dt*(oldVelocity+velocity)/2));
    cameraAt(elapsed/duration);
  }
  function paint(vp){
    if(!active||!prepared)return;
    layout();
    const atTarget=targetEndpoint===1?elapsed===duration:elapsed===0;
    // From the nose or an edge-on angle, the LCD faces away from the camera.
    // Keep the HTML hidden until its face can be projected safely into the cockpit.
    const lcdDepth=screen.z-viewEye[2],facing=lcdDepth/Math.hypot(viewEye[0]-screen.x,viewEye[1]-screen.y,lcdDepth);
    if(lcdDepth<=.02||facing<.12){surface.style.visibility='hidden';if(atTarget&&!settling)finish();return;}
    // Project the real HTML page onto the LCD. Its aspect ratio is retained on phones too.
    const clip=(x,y,z,w)=>[0,1,2,3].map(row=>vp[row]*x+vp[4+row]*y+vp[8+row]*z+vp[12+row]*w);
    const o=clip(rect.left,rect.top,screen.z,1),u=clip(-rect.width/viewportWidth,0,0,0),v=clip(0,-rect.height/viewportHeight,0,0),w=o[3];
    const x=q=>(q[0]+q[3])*viewportWidth/(2*w),y=q=>(-q[1]+q[3])*viewportHeight/(2*w);
    if(!settling)surface.style.transform=`matrix3d(${[x(u),y(u),0,u[3]/w,x(v),y(v),0,v[3]/w,0,0,1,0,x(o),y(o),0,1].join(',')})`;
    surface.style.visibility='visible';canvas.style.opacity='1';
    // Erase only LCD pixels that pass the scene depth test. Halo, buttons and bodywork
    // remain in front of the page instead of allowing HTML to float over the car.
    gl.useProgram(program);gl.uniformMatrix4fv(matrixLocation,false,vp);gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(false);gl.colorMask(true,true,true,true);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.depthMask(true);gl.depthFunc(gl.LESS);gl.enable(gl.CULL_FACE);gl.bindVertexArray(null);
    // Keep cutting the LCD out during the canvas fade too; drawing the solid
    // instrument again for these frames produces a black flash over the page.
    if(atTarget&&!settling)finish();
  }
  document.addEventListener('visibilitychange',()=>{previous=null;});
  const databaseToggle=document.getElementById('partsToggle');
  new MutationObserver(()=>{if(active&&databaseToggle.getAttribute('aria-pressed')!=='true')release(true);}).observe(databaseToggle,{attributes:true,attributeFilter:['aria-pressed']});
  return{enter:(preparePage,element)=>run(preparePage,element),leave:element=>run(()=>{},element,true),step,paint,interrupt,cancel:interrupt,get active(){return active;},get returning(){return active&&returning;}};
}
