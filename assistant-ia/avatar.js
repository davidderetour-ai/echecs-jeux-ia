import { chooseExpression, normalizeExpression, EXPRESSIONS } from "./expression-core.mjs";
import { blinkAmount, mouthOpening, gazeFromPointer, moodLook, clamp } from "./avatar-motion.mjs";
/* Alicia : avatar WebGL 3D stylise et interaction vocale.
   Fonctionnement hors ligne pour les formes et la lecture vocale si le systeme le permet. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("alicia-avatar"),statusNode=$("avatar-status");
if(!canvas)return;
const sayStatus=value=>{if(statusNode)statusNode.textContent=value};
let yaw=0.12,pitch=-0.04,speaking=false,mouth=0,lastBoundary=-1;
let expression="neutral",intent="neutral",gazeX=0,gazeY=0,gazeTargetX=0,gazeTargetY=0;
function setExpression(value){
 intent=normalizeExpression(value);
 const configured=$("expression-mode")?.value||"auto";
 expression=configured==="auto"?intent:normalizeExpression(configured);
 const label=$("expression-status");if(label)label.textContent="Expression : "+EXPRESSIONS[expression];
}
$("expression-mode")?.addEventListener("change",()=>setExpression(intent));
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
 const available=voices();const selected=available.find(v=>v.voiceURI===$("voice-choice")?.value);const preferred=available.find(v=>/amelie|aurelie|audrey|celine|julie|marie|sylvie|sophie|alice|lea/i.test(v.name));if(selected||preferred)u.voice=selected||preferred;
 u.onstart=()=>{speaking=true;lastBoundary=performance.now();sayStatus("Alicia parle…")};
 u.onboundary=()=>{lastBoundary=performance.now()};
 u.onend=()=>{speaking=false;mouth=0;lastBoundary=-1;sayStatus("Alicia est prête")};
 u.onerror=()=>{speaking=false;mouth=0;lastBoundary=-1;sayStatus("Lecture vocale indisponible")};
 synth.speak(u);
}
function listen(){
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){sayStatus("Dictée vocale indisponible sur ce navigateur");return;}
 try{
 const rec=new API();rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
 rec.onstart=()=>{setExpression("curious");sayStatus("Alicia écoute…")};
 rec.onresult=e=>{const said=e.results?.[0]?.[0]?.transcript;if(!said)return;const q=$("question");q.value+=(q.value?" ":"")+said;q.focus();sayStatus("Dictée reçue : vérifie puis envoie")};
 rec.onerror=e=>sayStatus("Micro ou dictée indisponible : "+(e.error||"erreur"));
 rec.onend=()=>{if(statusNode?.textContent==="Alicia écoute…")sayStatus("Alicia est prête")};
 rec.start();
 }catch{sayStatus("Impossible de démarrer le microphone")}
}
window.AliciaAvatar={
 speak,listen,setExpression,
 onUserMessage(text,mode){setExpression(chooseExpression({text,mode,phase:"user"}))},
 onThinking(){setExpression("thoughtful")},
 onAssistantMessage(text,mode){setExpression(chooseExpression({text,mode,phase:"reply"}));if($("auto-voice")?.checked)speak(text)},
 reset(){setExpression("neutral")}
};
$("avatar-demo")?.addEventListener("click",()=>{
 setExpression("joyful");
 speak("Bonjour, je suis Alicia. Je cligne des yeux, je te regarde quand tu touches l'écran, et ma bouche bouge quand je parle.");
});
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
 skin:[.82,.52,.36],tan:[.71,.43,.29],cheeks:[.84,.46,.39],skinLight:[.91,.65,.49],ear:[.74,.41,.30],
 blonde:[.94,.72,.34],gold:[1,.85,.52],hairShadow:[.59,.37,.15],hairLight:[1,.91,.63],
 white:[.95,.96,.96],blue:[.26,.65,.97],navy:[.09,.31,.57],black:[.07,.10,.17],
 lips:[.70,.29,.35],lipLight:[.92,.51,.48],lipShadow:[.29,.09,.13],brow:[.43,.26,.14],lashes:[.23,.16,.16],
 jacket:[.23,.22,.49],collar:[.92,.74,.56],sparkle:[1,1,1]
};
function ball(c,s,color){
 gl.uniform3fv(U.center,c);gl.uniform3fv(U.scale,s);gl.uniform3fv(U.color,palette[color]);gl.drawElements(gl.TRIANGLES,I.length,gl.UNSIGNED_SHORT,0);
}
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
function draw(t){
 const dp=Math.min(devicePixelRatio||1,1.65); // résolution modérée : Safari iPhone
 const w=Math.min(1000,Math.round(canvas.clientWidth*dp)),h=Math.min(1000,Math.round(canvas.clientHeight*dp));
 if(w&&h&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniform1f(U.yaw,yaw+(reduced?0:Math.sin(t/1800)*.018));gl.uniform1f(U.pitch,pitch);
 gl.uniform1f(U.aspect,w/Math.max(h,1));
 const bob=reduced?0:Math.sin(t/1500)*.016;
 ball([0,-1.65+bob,-.17],[1.12,1.0,.64],"jacket");
 ball([0,-1.10+bob,.1],[.33,.45,.32],"tan");
 ball([0,-1.06+bob,.2],[.29,.39,.28],"skin");
 ball([0,.24+bob,-.38],[.92,1.38,.49],"hairShadow");
 for(const side of [-1,1]){
  ball([side*.85,-.28+bob,-.11],[.27,1.13,.27],"blonde");
  ball([side*1.01,-.6+bob,.11],[.18,.72,.21],"gold");
  ball([side*.75,-1.02+bob,.05],[.22,.46,.2],"hairShadow");
 }
 // Visage plus ovale : front, joues et menton avec relief discret.
 ball([0,.30+bob,.08],[.73,1.04,.59],"skin");
 ball([0,-.31+bob,.26],[.49,.41,.39],"skin");
 ball([0,-.57+bob,.37],[.31,.15,.22],"skin");
 for(const side of [-1,1]){
  ball([side*.715,.12+bob,.04],[.125,.225,.15],"ear");
  ball([side*.726,.13+bob,.151],[.057,.116,.038],"tan");
 }
 ball([0,.01+bob,.64],[.105,.205,.16],"tan");
 ball([0,.052+bob,.735],[.091,.195,.115],"skinLight");
 ball([0,-.125+bob,.76],[.145,.057,.087],"skin");
 for(const side of [-1,1])ball([side*.105,-.11+bob,.738],[.047,.018,.026],"ear");
 const blink=blinkAmount(t,{reducedMotion:reduced});
 const mood=moodLook(expression);
 gazeX+=(gazeTargetX-gazeX)*.065;gazeY+=(gazeTargetY-gazeY)*.065;
 const joyful=expression==="joyful",supportive=expression==="supportive";
 const thoughtful=expression==="thoughtful",curious=expression==="curious",creative=expression==="creative";
 const eyeHeight=blink*mood.eye;
 const lookX=gazeX*.058,lookY=gazeY*.046;
 for(const side of [-1,1]){
  ball([side*.30,.50+bob,.588],[.226,.132*eyeHeight,.082],"white");
  ball([side*.30+lookX,.50+bob+lookY,.666],[.114,.113*eyeHeight,.04],"navy");
  ball([side*.30+lookX,.50+bob+lookY,.697],[.089,.089*eyeHeight,.036],"blue");
  ball([side*.30+lookX,.50+bob+lookY,.732],[.048,.06*eyeHeight,.016],"black");
  ball([side*.265+lookX,.543+bob+lookY,.75],[.025,.027*eyeHeight,.012],"sparkle");
  // Paupières et cils : silhouette visible même pendant un clignement.
  ball([side*.30,.633+bob+(1-blink)*-.033,.623],[.233,.031+(1-blink)*.094,.036],"skin");
  ball([side*.30,.639+bob+(1-blink)*-.04,.657],[.222,.017,.022],"lashes");
  ball([side*.30,.372+bob+(1-blink)*.05,.618],[.22,.017+(1-blink)*.066,.04],"skin");
  for(const edge of [-1,1])ball([side*.30+edge*.205,.619+bob,.625],[.019,.05,.022],"lashes");
  ball([side*.30,.752+bob+mood.brow,.585],[.245,.033,.038],"brow");
  ball([side*.43,-.06+bob,.56],[.19,joyful?.135:.095,.024],"cheeks");
 }
 // Mouvement approximatif associé à la synthèse vocale (pas phonèmes exacts).
 const target=mouthOpening(t,{speaking,reducedMotion:reduced,lastBoundary});
 mouth+=(target-mouth)*.19;
 const open=.004+mouth*.16;
 const smile=mood.smile;
 ball([0,-.345+bob,.654],[.207+smile*.048,.029+open*.12,.049],"lips");
 ball([0,-.355-open*.43+bob,.661],[.161+smile*.02,.009+open*.95,.034],open>.019?"lipShadow":"lips");
 ball([0,-.38-open*.75+bob,.642],[.205+smile*.03,.031,.048],"lipLight");
 for(const side of [-1,1]){
  ball([side*(.18+smile*.045),-.35+smile*.031+bob,.637],[.047,.032,.034],"lips");
 }
 // Cheveux blond doré : mèches frontales, volume à l'arrière, reflets.
 ball([0,1.105+bob,-.012],[.86,.44,.63],"blonde");
 ball([-.33,1.011+bob,.437],[.46,.205,.296],"hairLight");
 ball([.33,1.064+bob,.392],[.49,.215,.308],"gold");
 ball([-.68,.72+bob,.397],[.20,.31,.248],"gold");
 ball([.70,.675+bob,.34],[.21,.38,.245],"gold");
 for(const side of [-1,1]){
  ball([side*.79,-.35+bob,.288],[.118,.83,.147],"blonde");
  ball([side*.91,-.62+bob,.13],[.091,.41,.11],"hairLight");
  ball([side*.66,.91+bob,.43],[.14,.33,.13],"blonde");
 }
 // Encolure et veste : buste plus détaillé en gardant peu de triangles.
 ball([0,-1.35+bob,.46],[.45,.12,.21],"collar");
 for(const side of [-1,1]){
  ball([side*.43,-1.31+bob,.25],[.23,.20,.18],"collar");
  ball([side*.72,-1.45+bob,.20],[.19,.23,.28],"jacket");
 }
}
let lastFrame=0;
function animate(t){
 if(document.visibilityState!=="hidden"&&t-lastFrame>=30){draw(t);lastFrame=t;}
 requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
let start=null;
function followPointer(e){
 if(!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;
 const next=gazeFromPointer({x:e.clientX,y:e.clientY,width:window.innerWidth,height:window.innerHeight});
 gazeTargetX=next.x;gazeTargetY=next.y;
}
window.addEventListener("pointermove",followPointer,{passive:true});
window.addEventListener("pointerdown",followPointer,{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){gazeTargetX=0;gazeTargetY=0;}});

canvas.style.touchAction="pan-y";
canvas.addEventListener("pointerdown",e=>{start={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{if(!start)return;yaw=Math.max(-.65,Math.min(.65,start.yaw+(e.clientX-start.x)*.007));pitch=Math.max(-.25,Math.min(.25,start.pitch+(e.clientY-start.y)*.004))});
canvas.addEventListener("pointerup",()=>start=null);
canvas.addEventListener("pointercancel",()=>start=null);
})();