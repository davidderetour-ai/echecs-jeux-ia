/* Alicia : avatar WebGL 3D stylise et interaction vocale.
   Fonctionnement hors ligne pour les formes et la lecture vocale si le systeme le permet. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("alicia-avatar"),statusNode=$("avatar-status");
if(!canvas)return;
const sayStatus=value=>{if(statusNode)statusNode.textContent=value};
let yaw=0.12,pitch=-0.04,speaking=false,mouth=0;
const synth=window.speechSynthesis;
const voices=()=>synth?.getVoices?.().filter(v=>v.lang?.toLowerCase().startsWith("fr"))||[];
function updateVoices(){
 const sel=$("voice-choice");if(!sel)return;
 const previous=sel.value;sel.replaceChildren();
 const option=document.createElement("option");option.value="";option.textContent="Voix française automatique";sel.append(option);
 for(const v of voices()){const opt=document.createElement("option");opt.value=v.voiceURI;opt.textContent=v.name+" ("+v.lang+")";sel.append(opt)}
 if([...sel.options].some(o=>o.value===previous))sel.value=previous;
}
updateVoices();synth?.addEventListener?.("voiceschanged",updateVoices);
function speak(text){
 if(!synth||typeof SpeechSynthesisUtterance==="undefined"){sayStatus("Lecture vocale indisponible");return;}
 synth.cancel();
 const u=new SpeechSynthesisUtterance(String(text).replace(/[*#_]/g,"").slice(0,2800));
 u.lang="fr-FR";u.rate=.9;u.pitch=1.12;u.volume=.88;
 const match=voices().find(v=>v.voiceURI===$("voice-choice")?.value);if(match)u.voice=match;
 u.onstart=()=>{speaking=true;sayStatus("Alicia parle…")};
 u.onend=()=>{speaking=false;sayStatus("Alicia est prête")};
 u.onerror=()=>{speaking=false;sayStatus("Lecture vocale indisponible")};
 synth.speak(u);
}
function listen(){
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){sayStatus("Dictée vocale indisponible sur ce navigateur");return;}
 try{
 const rec=new API();rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
 rec.onstart=()=>sayStatus("Alicia écoute…");
 rec.onresult=e=>{const said=e.results?.[0]?.[0]?.transcript;if(!said)return;const q=$("question");q.value+=(q.value?" ":"")+said;q.focus();sayStatus("Dictée reçue : vérifie puis envoie")};
 rec.onerror=e=>sayStatus("Micro ou dictée indisponible : "+(e.error||"erreur"));
 rec.onend=()=>{if(statusNode?.textContent==="Alicia écoute…")sayStatus("Alicia est prête")};
 rec.start();
 }catch{sayStatus("Impossible de démarrer le microphone")}
}
window.AliciaAvatar={speak,listen,onAssistantMessage:text=>{if($("auto-voice")?.checked)speak(text)}};
const gl=canvas.getContext("webgl",{antialias:true,alpha:true,powerPreference:"low-power"});
if(!gl){canvas.hidden=true;sayStatus("WebGL indisponible : l'écrit et la voix restent accessibles");return;}
const vs=[
"attribute vec3 aPos;attribute vec3 aNorm;",
"uniform vec3 uCenter,uScale;uniform float uYaw,uPitch,uAspect;",
"varying vec3 vNorm;",
"void main(){",
"vec3 p=aPos*uScale+uCenter;",
"float c=cos(uYaw),s=sin(uYaw),c2=cos(uPitch),s2=sin(uPitch);",
"p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);",
"p=vec3(p.x,c2*p.y-s2*p.z,s2*p.y+c2*p.z);",
"vec3 n=normalize(aNorm/max(uScale,vec3(.01)));",
"n=vec3(c*n.x+s*n.z,n.y,-s*n.x+c*n.z);",
"vNorm=normalize(vec3(n.x,c2*n.y-s2*n.z,s2*n.y+c2*n.z));",
"float f=4.6/(7.0-p.z);",
"gl_Position=vec4(p.x*f/(uAspect*1.24),p.y*f/2.25,-p.z/7.0,1.0);",
"}"].join("\n");
const fs=[
"precision mediump float;uniform vec3 uColor;varying vec3 vNorm;",
"void main(){float light=max(dot(normalize(vNorm),normalize(vec3(-.35,.8,1.5))),0.);",
"float rim=pow(1.0-abs(dot(normalize(vNorm),vec3(0.,0.,1.))),2.0)*.1;",
"gl_FragColor=vec4(clamp(uColor*(.49+.48*light+rim),0.,1.),1.);}"
].join("\n");
function shader(type,code){
 const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
 return s;
}
let program;
try{
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
}catch{canvas.hidden=true;sayStatus("Moteur 3D indisponible");return;}
const attr=(name)=>gl.getAttribLocation(program,name),uni=(name)=>gl.getUniformLocation(program,name);
const posAttr=attr("aPos"),normAttr=attr("aNorm");
const U={center:uni("uCenter"),scale:uni("uScale"),color:uni("uColor"),yaw:uni("uYaw"),pitch:uni("uPitch"),aspect:uni("uAspect")};
const P=[],N=[],I=[],lat=17,lon=23;
for(let i=0;i<=lat;i++){
 const a=Math.PI*i/lat;
 for(let j=0;j<=lon;j++){
  const b=Math.PI*2*j/lon,x=Math.sin(a)*Math.cos(b),y=Math.cos(a),z=Math.sin(a)*Math.sin(b);
  P.push(x,y,z);N.push(x,y,z);
 }
}
for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){
 const a=i*(lon+1)+j,b=a+lon+1;I.push(a,b,a+1,b,b+1,a+1);
}
function buffer(attr,data){
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,3,gl.FLOAT,false,0,0);
}
buffer(posAttr,P);buffer(normAttr,N);
const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.STATIC_DRAW);
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
const palette={
 skin:[.82,.49,.32],tan:[.67,.34,.22],cheeks:[.8,.38,.33],
 blonde:[.93,.71,.28],gold:[.98,.84,.48],hairShadow:[.66,.42,.17],
 white:[.95,.96,.96],blue:[.26,.65,.97],navy:[.09,.31,.57],black:[.07,.10,.17],
 lips:[.69,.31,.36],lipLight:[.89,.49,.48],brow:[.38,.24,.14],
 jacket:[.23,.22,.49],collar:[.92,.74,.56],sparkle:[1,1,1]
};
function ball(c,s,color){
 gl.uniform3fv(U.center,c);gl.uniform3fv(U.scale,s);gl.uniform3fv(U.color,palette[color]);gl.drawElements(gl.TRIANGLES,I.length,gl.UNSIGNED_SHORT,0);
}
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
function draw(t){
 const dp=Math.min(devicePixelRatio||1,2);
 const w=Math.min(1000,Math.round(canvas.clientWidth*dp)),h=Math.min(1000,Math.round(canvas.clientHeight*dp));
 if(w&&h&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniform1f(U.yaw,yaw+(reduced?0:Math.sin(t/1800)*.018));gl.uniform1f(U.pitch,pitch);
 gl.uniform1f(U.aspect,w/Math.max(h,1));
 const bob=reduced?0:Math.sin(t/1500)*.016;
 ball([0,-1.65+bob,-.17],[1.12,1.0,.64],"jacket");
 ball([0,-1.10+bob,.1],[.33,.45,.32],"tan");
 ball([0,-1.06+bob,.2],[.29,.39,.28],"skin");
 ball([0,.28+bob,-.34],[.98,1.40,.46],"hairShadow");
 for(const side of [-1,1]){
  ball([side*.85,-.28+bob,-.11],[.27,1.13,.27],"blonde");
  ball([side*1.01,-.6+bob,.11],[.18,.72,.21],"gold");
  ball([side*.75,-1.02+bob,.05],[.22,.46,.2],"hairShadow");
 }
 ball([0,.30+bob,.08],[.75,1.0,.62],"skin");
 for(const side of [-1,1])ball([side*.72,.13+bob,.04],[.15,.23,.17],"tan");
 ball([0,.01+bob,.66],[.12,.21,.20],"tan");
 ball([0,.08+bob,.76],[.11,.20,.15],"skin");
 ball([0,-.10+bob,.78],[.20,.075,.12],"skin");
 const phase=(t%4800)/4800,blink=phase>.87&&phase<.91?Math.max(.07,Math.abs(phase-.89)*48):1;
 for(const side of [-1,1]){
  ball([side*.30,.50+bob,.588],[.226,.132*blink,.082],"white");
  ball([side*.30,.50+bob,.666],[.114,.113*blink,.04],"navy");
  ball([side*.30,.50+bob,.697],[.089,.089*blink,.036],"blue");
  ball([side*.30,.50+bob,.732],[.048,.06*blink,.016],"black");
  ball([side*.265,.543+bob,.75],[.025,.027*blink,.012],"sparkle");
  ball([side*.30,.735+bob,.591],[.25,.039,.04],"brow");
  ball([side*.42,-.05+bob,.54],[.26,.135,.04],"cheeks");
 }
 mouth+=(speaking?.65:0-mouth)*.13;
 const mh=.034+mouth*(.06+.026*Math.sin(t/115));
 ball([0,-.35+bob,.643],[.225,mh+.015,.065],"lips");
 ball([0,-.377+bob,.682],[.17,Math.max(.014,mh*.48),.028],"lipLight");
 ball([0,1.10+bob,-.005],[.86,.46,.67],"blonde");
 ball([-.32,.995+bob,.48],[.52,.23,.31],"gold");
 ball([.34,1.045+bob,.38],[.48,.24,.32],"blonde");
 ball([-.68,.72+bob,.40],[.22,.35,.25],"gold");
 ball([.7,.65+bob,.34],[.19,.37,.24],"gold");
 ball([0,-1.34+bob,.47],[.50,.12,.21],"collar");
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
let start=null;
canvas.style.touchAction="pan-y";
canvas.addEventListener("pointerdown",e=>{start={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{if(!start)return;yaw=Math.max(-.65,Math.min(.65,start.yaw+(e.clientX-start.x)*.007));pitch=Math.max(-.25,Math.min(.25,start.pitch+(e.clientY-start.y)*.004))});
canvas.addEventListener("pointerup",()=>start=null);
canvas.addEventListener("pointercancel",()=>start=null);
})();