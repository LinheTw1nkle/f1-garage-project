'use strict';function createNeonOutline(gl){const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,`#version 300 es
    in vec3 point;in vec3 other;in float side;in float edgeValue;in float ringPhase;in float lineSeed;in float outlineBoundary;in float tailEdge;uniform mat4 vp;uniform vec2 viewport;uniform float time;uniform float wheel;uniform float ground;uniform float halo;uniform float flowLayer;uniform float lampGlow;
    out float edge;out float longitudinal;out float wheelPhase;flat out float randomSeed;flat out float rearLight;
    vec3 flowingCopy(vec3 position){
      float speed=(flowLayer<1.5?.55:flowLayer<2.5?.85:1.15)*mix(1.,4.,wheel);
      float phase=time*speed+position.z*.9;
      vec3 shifted=position+vec3(sin(phase+position.y*.6)*.012,cos(phase+position.x*.6)*.009*(1.-ground)*mix(1.,.35,halo),sin(phase*.7+position.y)*.006)*flowLayer;
      shifted.y+=ground*(.018+.012*sin(time*.85+position.z*.6+position.x*.8+flowLayer*.5));
      return shifted;
    }
    void main(){
      float seed=lineSeed;
      float amplitude=mix(.008,.018,seed)*(1.-outlineBoundary),frequency=mix(1.1,3.2,fract(seed*7.13));
      vec3 sway=vec3(sin(time*frequency*mix(1.,4.,wheel)+seed*6.283185)*amplitude*wheel,0.,0.);
      vec4 a=vp*vec4(flowingCopy(point)+sway,1.),b=vp*vec4(flowingCopy(other)+sway,1.);
      vec2 delta=(b.xy/b.w-a.xy/a.w)*viewport;vec2 normal=normalize(vec2(-delta.y,delta.x)+vec2(.00001));
      float speedScale=mix(.98,1.02,fract(seed*7.13));
      float local=fract((ringPhase-time*22.*speedScale)/6.283185+seed);
      float retained=mix(.85,.95,seed);
      float section=clamp(local/retained,0.,1.);
      float taper=1.+.20*pow(sin(section*3.14159265),2.);
      float thickness=mix(1.,mix(mix(.65,1.4,seed),1.,outlineBoundary)*taper,wheel);
      thickness*=mix(1.,mix(.55,1.2,seed),halo);
      thickness*=mix(1.,1.5,ground);
      float bodyLine=1.-max(wheel,max(ground,halo));
      a.xy+=normal*side*3.5*(1.+ground+.2*wheel)*thickness*mix(1.,3.4,lampGlow)*mix(1.,1.45,bodyLine*(1.-tailEdge))*mix(1.,1.8,tailEdge)/viewport*a.w;gl_Position=a;edge=edgeValue;longitudinal=3.12-point.z;wheelPhase=ringPhase;randomSeed=seed;rearLight=tailEdge;
      }`));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;in float edge;in float longitudinal;in float wheelPhase;flat in float randomSeed;flat in float rearLight;uniform float time;uniform float opacity;uniform float wheel;uniform float ground;uniform float halo;uniform float sweepProgress;uniform float lampGlow;out vec4 color;
    float hash(float value){return fract(sin(value*127.1+randomSeed*311.7)*43758.5453);}
    void main(){
      float phase=mix(longitudinal*2.2,wheelPhase*2.,wheel);
      float speedScale=mix(.98,1.02,fract(randomSeed*7.13));
      float speed=mix(mix(3.2,7.2,ground),44.*speedScale,wheel);
      float wave=pow(.5+.5*cos(phase-time*speed),10.);
      float variation=.75+.25*sin(mix(longitudinal*17.,wheelPhase*7.,wheel)-time*mix(mix(5.,11.25,ground),44.*speedScale,wheel));
      float core=exp(-edge*edge*22.),haloGlow=exp(-edge*edge*mix(4.,2.5,wheel))*mix(.20,.45,wheel);
      float brightness=mix(.35,.28,wheel)+wave*variation;
      float traveled=wheelPhase-time*speed*.5;
      float local=fract(traveled/6.283185+randomSeed);
      float retained=mix(.85,.95,randomSeed);
      float broken=smoothstep(0.,.01,local)*(1.-smoothstep(retained-.01,retained,local));
      brightness*=mix(1.,broken,wheel);
      brightness+=rearLight*.65;
      if(lampGlow>.5){core=0.;haloGlow=exp(-edge*edge*5.)*.34;brightness=.7;}
      float boundary=-.12+sweepProgress*1.24;
      float sweep=1.-smoothstep(boundary-.08,boundary+.08,clamp(longitudinal/5.6,0.,1.));
      float groundFade=smoothstep(2.8,3.1,longitudinal)*(1.-smoothstep(7.9,8.4,longitudinal));
      sweep=mix(sweep,sweepProgress*groundFade,ground);
      float haloStart=pow(smoothstep(2.13,3.06,longitudinal),1.8);
      sweep*=mix(1.,haloStart,halo);
      vec3 tint=mix(vec3(.48,.82,1.),vec3(.05,.62,1.),wheel);
      tint=mix(tint,vec3(.22,.72,1.),ground);
      tint=mix(tint,vec3(1.,.42,.025),halo);
      tint=mix(tint,vec3(1.,.025,.045),rearLight);
      float scanActive=smoothstep(.005,.04,sweepProgress)*(1.-smoothstep(.96,.995,sweepProgress))*(1.-max(ground,halo));
      float scanEdge=exp(-pow((clamp(longitudinal/5.6,0.,1.)-boundary)/.018,2.))*scanActive;
      tint=mix(tint,mix(vec3(.72,.96,1.),vec3(1.,.12,.14),rearLight),scanEdge);
      brightness+=scanEdge*.8;
      color=vec4(tint,(core+haloGlow*mix(1.,1.8,rearLight))*brightness*opacity*sweep*mix(1.,1.5,rearLight));}`));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const groups={body:[],wheel:[],ground:[],halo:[],lamp:[]};let buffers=[];const segment=(target,a,b,phaseA=0,phaseB=0,seed=.5,boundary=0,tailEdge=0)=>{for(const[point,other,side,edge,phase]of[[a,b,-1,-1,phaseA],[a,b,1,1,phaseA],[b,a,1,-1,phaseB],[b,a,1,-1,phaseB],[a,b,1,1,phaseA],[b,a,-1,1,phaseB]])target.push(...point,...other,side,edge,phase,seed,boundary,tailEdge);};const transform=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];return{begin(){for(const data of Object.values(groups))data.length=0;airflowRoofProfile.fill(0);},add(name,positions,indices,m,min,max){if(name==='Pit')return;if(name.startsWith('Tire')){recordAirflowRoof(transform(m,min),transform(m,max),transform(m,[(min[0]+max[0])/2,max[1],(min[2]+max[2])/2]));const cy=(min[1]+max[1])/2,cz=(min[2]+max[2])/2,r=(max[1]-min[1])/2;const rings=[[min[0]-.004,r*1.003],[max[0]+.004,r*1.003]];for(let index=1;index<28;index++){const t=index/28;rings.push([min[0]+(max[0]-min[0])*t,r*1.02]);}
const rotationDirection=1;for(const[index,[x,radius]]of rings.entries()){const seed=Math.random(),boundary=index<2?1:0;for(let i=0;i<96;i++){const a=i*Math.PI/48,b=(i+1)*Math.PI/48;segment(groups.wheel,transform(m,[x,cy+Math.cos(a)*radius,cz+Math.sin(a)*radius]),transform(m,[x,cy+Math.cos(b)*radius,cz+Math.sin(b)*radius]),a*rotationDirection,b*rotationDirection,seed,boundary);}}return;}
const point=i=>positions.slice(i*3,i*3+3),key=p=>p.map(v=>Math.round(v*10000)).join(',');const edges=new Map();for(let i=0;i<indices.length;i+=3){const a=point(indices[i]),b=point(indices[i+1]),c=point(indices[i+2]);recordAirflowRoof(transform(m,a),transform(m,b),transform(m,c));const n=norm(cross(sub(b,a),sub(c,a)));if(!n.every(Number.isFinite))continue;for(const[u,v]of[[a,b],[b,c],[c,a]]){const ku=key(u),kv=key(v),id=ku<kv?ku+'|'+kv:kv+'|'+ku;const existing=edges.get(id);if(existing){existing.crease=Math.max(existing.crease,1-dot(existing.normal,n));existing.shared=true;}
else edges.set(id,{a:u,b:v,normal:n,crease:0,shared:false});}}
const candidates=[...edges.values()].map(e=>({...e,length:Math.hypot(...sub(e.a,e.b))})).filter(e=>e.length>.018).sort((a,b)=>b.length-a.length);const selected=candidates.filter(e=>!e.shared||e.crease>.43).slice(0,1200);const existing=new Set(selected);const extra=candidates.filter(e=>!existing.has(e)&&e.shared&&e.crease>.25).slice(0,Math.ceil(selected.length*.10));selected.push(...extra);for(const e of selected){const tailEdge=name==='LED'?1:0;segment(groups.body,transform(m,e.a),transform(m,e.b),0,0,.5,0,tailEdge);if(tailEdge)segment(groups.lamp,transform(m,e.a),transform(m,e.b),0,0,.5,0,1);}},finish(){smoothAirflowRoof();for(const[lane,seed]of[[6.4,.15],[6.5,.85],[6.6,.45]]){const lowered=t=>{const p=sampleAirflowPath(lane,t);p[1]-=.20;return p;};for(let i=137;i<360;i++)segment(groups.halo,lowered(i/360),lowered((i+1)/360),0,0,seed);}
const floorPoint=(lane,t)=>{const z=.32-t*5.6;const peak=.36;const ease=value=>value*value*(3-2*value);const spread=t<peak?.72+.55*ease(t/peak):1.27-.80*ease((t-peak)/(1-peak));return[lane*spread,.012,z];};for(const x of[-1.1,-.85,-.6,.6,.85,1.1]){for(let index=0;index<64;index++){segment(groups.ground,floorPoint(x,index/64),floorPoint(x,(index+1)/64));}}
for(const buffer of buffers){gl.deleteBuffer(buffer.buffer);gl.deleteVertexArray(buffer.vao);}buffers=[];for(const[name,data]of Object.entries(groups)){const buffer=gl.createBuffer(),vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);for(const[attribute,size,offset]of[['point',3,0],['other',3,12],['side',1,24],['edgeValue',1,28],['ringPhase',1,32],['lineSeed',1,36],['outlineBoundary',1,40],['tailEdge',1,44]]){const location=gl.getAttribLocation(p,attribute);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,48,offset);}
buffers.push({buffer,vao,count:data.length/12,wheel:name==='wheel',ground:name==='ground',halo:name==='halo',lamp:name==='lamp'});}gl.bindVertexArray(null);},draw(matrix,seconds,opacity,width,height,sweepProgress=1){if(opacity<=0||sweepProgress<=0)return;gl.useProgram(p);gl.uniform1f(gl.getUniformLocation(p,'lampGlow'),0);gl.uniform1f(gl.getUniformLocation(p,'sweepProgress'),sweepProgress);gl.uniformMatrix4fv(gl.getUniformLocation(p,'vp'),false,matrix);gl.uniform2f(gl.getUniformLocation(p,'viewport'),width,height);gl.uniform1f(gl.getUniformLocation(p,'time'),reducedMotionPreference.matches?0:seconds);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.depthFunc(gl.LEQUAL);for(const group of buffers){if(group.lamp)continue;gl.bindVertexArray(group.vao);gl.uniform1f(gl.getUniformLocation(p,'wheel'),group.wheel?1:0);gl.uniform1f(gl.getUniformLocation(p,'ground'),group.ground?1:0);gl.uniform1f(gl.getUniformLocation(p,'halo'),group.halo?1:0);const copies=reducedMotionPreference.matches?0:group.wheel||group.ground?2:group.halo?3:0;for(let layer=0;layer<=copies;layer++){gl.uniform1f(gl.getUniformLocation(p,'flowLayer'),layer);gl.uniform1f(gl.getUniformLocation(p,'opacity'),opacity*(layer===0?1:.30-layer*.04)*(group.wheel||group.ground||group.halo?1:.9));gl.drawArrays(gl.TRIANGLES,0,group.count);}}
gl.bindVertexArray(null);gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);gl.depthFunc(gl.LESS);},drawLamp(matrix,seconds,power,width,height){if(power<=.001)return;const lamp=buffers.find(group=>group.lamp);if(!lamp?.count)return;gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'vp'),false,matrix);gl.uniform2f(gl.getUniformLocation(p,'viewport'),width,height);for(const[name,value]of[['lampGlow',1],['sweepProgress',1],['time',0],['wheel',0],['ground',0],['halo',0],['flowLayer',0],['opacity',power*.33]])gl.uniform1f(gl.getUniformLocation(p,name),value);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.CULL_FACE);gl.bindVertexArray(lamp.vao);gl.drawArrays(gl.TRIANGLES,0,lamp.count);gl.uniform1f(gl.getUniformLocation(p,'lampGlow'),0);gl.bindVertexArray(null);gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);gl.depthFunc(gl.LESS);}};}
