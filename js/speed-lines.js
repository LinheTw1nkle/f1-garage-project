'use strict';function createSpeedLines(gl){const mobileView=window.matchMedia('(max-width: 700px)');const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,`#version 300 es
    uniform mat4 vp;uniform float mirrorPass;uniform float exitProgress;uniform float captureMode;uniform float tunnelScale;out vec2 uv;out vec3 tunnelPosition;
    vec3 surface(float across,float along){
      float z=mix(120.,-120.,along),theta=across*3.14159265;
      float width=.72+.28*exp(-pow(z/42.,2.));
      return vec3(cos(theta)*6.885*width*tunnelScale,.035+sin(theta)*6.12*width*tunnelScale,z);
    }
    void main(){
      vec2 corners[6]=vec2[6](vec2(0.,0.),vec2(1.,0.),vec2(1.,1.),vec2(0.,0.),vec2(1.,1.),vec2(0.,1.));
      int quad=gl_VertexID/6;
      vec2 corner=corners[gl_VertexID%6];
      if(captureMode>.5){
        float row=quad%2==0?17.:22.;
        uv=vec2((row+corner.x)/40.,(float(quad/2)+corner.y)/96.);
      }else uv=vec2((float(quad%64)+corner.x)/64.,(float(quad/64)+corner.y)/96.);
      vec3 position=surface(uv.x,uv.y);tunnelPosition=position;
      if(mirrorPass>.5)position.y=-position.y-.008;
      gl_Position=vp*vec4(position,1.);
    }`));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;in vec2 uv;in vec3 tunnelPosition;uniform float time;uniform float opacity;uniform float captureMode;uniform float exitProgress;out vec4 color;
    float hash(float v){return fract(sin(v*127.1)*43758.5453);}
    float noise(float x,float seed){float c=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(hash(c+seed),hash(c+seed+1.),f);}
    void main(){
      float rows=40.,row=floor(uv.x*rows),seed=hash(row+31.);
      float across=fract(uv.x*rows)-.5;
      // The tunnel stays fixed; only its long noise filaments flow nose to tail.
      float flowSpeed=mix(.8,1.5,hash(row+193.));
      float along=uv.y*18.-time*.6685714*flowSpeed+seed*35.;
      float signal=noise(along,row*71.);
      float envelope=smoothstep(.20,.67,signal);
      float thickness=mix(.025,.075,seed);
      if(captureMode>.5)thickness=.22;
      float aa=max(fwidth(uv.x)*rows,.002);
      float edgeSoftness=max(aa,thickness*.75);
      float core=1.-smoothstep(thickness*.45,thickness+edgeSoftness,abs(across));
      core*=min(1.,thickness/aa);
      float glow=exp(-across*across/((thickness+.13)*(thickness+.13)))*.30;
      float softHalo=exp(-across*across/.065)*.055;
      float distant=1.-smoothstep(65.,120.,abs(tunnelPosition.z));
      float floorEdge=smoothstep(.02,.12,tunnelPosition.y);
      // Stop replenishing the tunnel at its entrance; the trailing edge travels
      // along the same UV path as the flowing light, toward the far endpoint.
      float tailPosition=exitProgress*flowSpeed/.8;
      float exitTail=exitProgress>0.?smoothstep(tailPosition-.008,tailPosition+.008,uv.y):1.;
      float brightness=(core*.60+glow+softHalo)*envelope*distant*floorEdge*exitTail;
      // Keep only two overhead emitters in the live reflection capture.
      if(captureMode>.5&&row!=17.&&row!=22.)discard;
      vec3 tint=mix(vec3(1.,.035,.012),vec3(1.,.07,.22),smoothstep(.24,.72,seed));
      tint=mix(tint,vec3(1.,.19,.025),step(.77,seed));
      tint=mix(tint,vec3(1.,.20,.16),core*.28);
      if(captureMode>.5)tint=mix(vec3(1.,.018,.006),vec3(1.,.045,.08),step(20.,row));
      // Six of forty strips retain a warm red-orange hue with a whiter tint.
      float paleStrip=max(1.-step(.5,mod(row+7.,10.)),1.-step(.5,mod(row+12.,20.)));
      tint=mix(tint,vec3(1.,.66,.54),paleStrip);
      color=vec4(tint*mix(1.,2.4,captureMode),brightness*opacity);
    }`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));const vao=gl.createVertexArray(),uniforms=Object.fromEntries(['vp','mirrorPass','time','opacity','captureMode','exitProgress','tunnelScale'].map(name=>[name,gl.getUniformLocation(program,name)]));return(matrix,seconds,amount,camera,capture=false,mirror=false,exitProgress=0)=>{if(exitProgress>=1)return;gl.useProgram(program);gl.bindVertexArray(vao);gl.uniformMatrix4fv(uniforms.vp,false,matrix);gl.uniform1f(uniforms.mirrorPass,mirror?1:0);gl.uniform1f(uniforms.time,seconds);gl.uniform1f(uniforms.opacity,amount);gl.uniform1f(uniforms.captureMode,capture?1:0);gl.uniform1f(uniforms.exitProgress,exitProgress);const tunnelScale=!capture&&mobileView.matches&&camera?Math.max(1.5,Math.hypot(camera[0]/6.885,(camera[1]-.035)/6.12)/.72*1.35):1;gl.uniform1f(uniforms.tunnelScale,tunnelScale);if(capture)gl.disable(gl.DEPTH_TEST);else gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.TRIANGLES,0,(capture?2:64)*96*6);gl.bindVertexArray(null);gl.disable(gl.BLEND);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);};}
