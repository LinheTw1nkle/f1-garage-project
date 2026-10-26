'use strict';const airflowRoofProfile=new Float32Array(64);function smoothAirflowRoof(){const raw=airflowRoofProfile.slice();for(let i=0;i<64;i++){let height=0;for(let j=Math.max(0,i-3);j<=Math.min(63,i+3);j++)height=Math.max(height,raw[j]);airflowRoofProfile[i]=height;}}
function airflowSmoothMax(a,b,width=.06){return.5*(a+b+Math.sqrt((a-b)*(a-b)+width*width));}
function airflowSafeHeight(z){if(z<-3.2||z>3.6)return 0;const coordinate=(z+3.2)/6.8*64-.5,i=Math.floor(coordinate),f=coordinate-i;const at=n=>airflowRoofProfile[Math.max(0,Math.min(63,n))];return(at(i-1)*Math.pow(1-f,3)+at(i)*(3*f*f*f-6*f*f+4)+at(i+1)*(-3*f*f*f+3*f*f+3*f+1)+at(i+2)*f*f*f)/6;}
function recordAirflowRoof(a,b,c){const minZ=Math.min(a[2],b[2],c[2]),maxZ=Math.max(a[2],b[2],c[2]),height=Math.max(a[1],b[1],c[1]);const start=Math.max(0,Math.floor((minZ+3.2)/6.8*64)-1),end=Math.min(63,Math.floor((maxZ+3.2)/6.8*64)+1);for(let i=start;i<=end;i++)airflowRoofProfile[i]=Math.max(airflowRoofProfile[i],height);}
function sampleAirflowPath(lane,t){const z=4.8-t*10.,x=(lane-6.5)*(.8925/6.5);const rise=Math.max(0,Math.min(1,(t-.08)/.48)),eased=rise*rise*(3-2*rise);const settle=Math.max(0,Math.min(1,(t-.56)/.14));const tailRise=Math.max(0,Math.min(1,(t-.70)/.23));const arch=Math.pow(Math.abs(x)/.8925,1.7);const y=.56+.94*eased-.20*settle*settle*(3-2*settle)+.22*tailRise*tailRise*(3-2*tailRise)-.24*arch*(.3+.7*eased);return[x,y,z];}
function createAirflowRenderer(gl){const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,`#version 300 es
    in vec4 point; in float progress; uniform mat4 vp; uniform float time; uniform vec3 camera; uniform float captureMode; 
    out float edge; out float along; flat out float laneSeed;
    void main(){
      edge=point.w;along=progress;
      laneSeed=floor((point.x+.8925)/.1373+.5);
      vec3 ribbon=normalize(cross(vec3(0.,0.,-1.),normalize(camera-point.xyz)));
      gl_Position=vp*vec4(point.xyz+ribbon*point.w*.028*mix(1.,4.8,captureMode),1.);
    }`));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float; in float edge; in float along; flat in float laneSeed; uniform float time; uniform float captureMode; uniform float opacity; uniform float sweepProgress; out vec4 color;
    float hash(float x){return fract(sin(x*127.1)*43758.5453);}
    void main(){
      if(captureMode>.5 && abs(laneSeed-4.)>.5 && abs(laneSeed-9.)>.5)discard;
      float speedScale=mix(.8,1.5,hash(laneSeed+193.));
      float travel=along*18.-time*3.4*speedScale;
      float pulse=.58+.28*sin(travel)+.08*sin(travel*1.7+edge*2.);
      float fade=smoothstep(0.,.12,along)*(1.-smoothstep(.86,1.,along));
      float wisps=sin(along*28.-time*3.4*speedScale+edge*3.)*.045;
      float core=exp(-pow((edge+wisps)*mix(6.,3.,captureMode),2.))*.70;
      float mist=exp(-edge*edge*3.2)*.075;
      float stream=along*5.-time*.71*speedScale+hash(laneSeed+7.)*8.;
      float cell=floor(stream),phase=fract(stream);
      float random=hash(cell+laneSeed*53.);
      float end=mix(.72,.95,random);
      float segment=smoothstep(.0,.12,phase)*(1.-smoothstep(end-.12,end,phase));
      segment=mix(segment,.55+.45*segment,captureMode);
      float visibility=mix(1.-clamp(sweepProgress,0.,1.),1.,captureMode);
      color=vec4(vec3(.94,.97,1.),(core+mist)*pulse*fade*segment*opacity*visibility);
    }`));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const values=[];const segments=360;const sample=(lane,i,side)=>{const t=i/segments,[x,y,z]=sampleAirflowPath(lane,t);values.push(x,y,z,side,t);};for(let lane=0;lane<14;lane++)for(let i=0;i<segments;i++){sample(lane,i,-1);sample(lane,i,1);sample(lane,i+1,-1);sample(lane,i+1,-1);sample(lane,i,1);sample(lane,i+1,1);}
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);const vao=gl.createVertexArray();gl.bindVertexArray(vao);const point=gl.getAttribLocation(p,'point'),progress=gl.getAttribLocation(p,'progress');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,4,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(progress);gl.vertexAttribPointer(progress,1,gl.FLOAT,false,20,16);gl.bindVertexArray(null);const vp=gl.getUniformLocation(p,'vp'),time=gl.getUniformLocation(p,'time'),camera=gl.getUniformLocation(p,'camera');const captureMode=gl.getUniformLocation(p,'captureMode');const opacityUniform=gl.getUniformLocation(p,'opacity');const sweepUniform=gl.getUniformLocation(p,'sweepProgress');const render=(matrix,angle,seconds,eye,capture=false,opacity=1,sweepProgress=0)=>{gl.useProgram(p);gl.uniform1f(captureMode,capture?1:0);gl.uniform1f(opacityUniform,opacity);gl.uniform1f(sweepUniform,sweepProgress);gl.useProgram(p);gl.bindVertexArray(vao);gl.uniformMatrix4fv(vp,false,matrix);gl.uniform1f(time,seconds);gl.uniform3fv(camera,eye);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.CULL_FACE);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,values.length/5);gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);gl.bindVertexArray(null);};return render;}
