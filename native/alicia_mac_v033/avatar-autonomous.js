import { chooseExpression, normalizeExpression, EXPRESSIONS } from "./expression-core.mjs";
import { blinkAmount, mouthOpening, moodLook } from "./avatar-motion.mjs";
import { livingPose } from "./avatar-motion-autonomous.mjs";
/* Alicia : avatar WebGL 3D stylise et interaction vocale.
   Fonctionnement hors ligne pour les formes et la lecture vocale si le systeme le permet. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("alicia-avatar"),statusNode=$("avatar-status");
if(!canvas)return;
const sayStatus=value=>{if(statusNode)statusNode.textContent=value};
let yaw=0,pitch=0,speaking=false,mouth=0,lastBoundary=-1,paused=false;
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
 const previous=sel.value||localStorage.getItem("alicia-voix-choisie")||"";sel.replaceChildren();
 const option=document.createElement("option");option.value="";option.textContent="Voix française automatique";sel.append(option);
 for(const v of voices()){const opt=document.createElement("option");opt.value=v.voiceURI;opt.textContent=v.name+" ("+v.lang+")";sel.append(opt)}
 if([...sel.options].some(o=>o.value===previous))sel.value=previous;
}
updateVoices();synth?.addEventListener?.("voiceschanged",updateVoices);
$("voice-choice")?.addEventListener("change",e=>localStorage.setItem("alicia-voix-choisie",e.target.value));
const voiceStyles={douce:{rate:.88,pitch:1.08,volume:.86},naturelle:{rate:1,pitch:1,volume:1},dynamique:{rate:1.07,pitch:1.1,volume:.93}};
const voiceStyle=$("voice-style");
if(voiceStyle){
 const saved=localStorage.getItem("alicia-style-vocal");
 if(Object.prototype.hasOwnProperty.call(voiceStyles,saved))voiceStyle.value=saved;
 voiceStyle.addEventListener("change",()=>localStorage.setItem("alicia-style-vocal",voiceStyle.value));
}
function speak(text){
 if(!synth||typeof SpeechSynthesisUtterance==="undefined"){sayStatus("Lecture vocale indisponible");return;}
 synth.cancel();
 const u=new SpeechSynthesisUtterance(String(text).replace(/[*#_]/g,"").slice(0,2800));
 const p=voiceStyles[voiceStyle?.value]||voiceStyles.douce;
 u.lang="fr-FR";u.rate=p.rate;u.pitch=p.pitch;u.volume=p.volume;
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
 speak("Bonjour ! Je suis Alicia. Je cligne des yeux, je fais des gestes et je tourne toute seule pour montrer aussi mon dos. Ma bouche bouge lorsque je parle.");
});
const gl=canvas.getContext("webgl",{antialias:true,alpha:true,powerPreference:"low-power"});
if(!gl){window.AliciaFallback?.("Le moteur 3D WebGL n’est pas disponible sur ce Mac.");return;}
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
"gl_Position=vec4(p.x*f/(uAspect*1.18),(p.y+.17)*f/2.30,-p.z/7.0,1.0);",
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
}catch(e){window.AliciaFallback?.("Erreur graphique WebGL : "+(e?.message||"initialisation"));return;}
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
 jacket:[.08,.10,.25],jacketBlue:[.13,.19,.53],pants:[.09,.12,.27],shoes:[.17,.17,.32],collar:[.92,.74,.56],sparkle:[1,1,1],tear:[.47,.75,.98]
};
function ball(c,s,color){
 gl.uniform3fv(U.center,c);gl.uniform3fv(U.scale,s);gl.uniform3fv(U.color,palette[color]);gl.drawElements(gl.TRIANGLES,I.length,gl.UNSIGNED_SHORT,0);
}
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
function draw(t){
 const dp=Math.min(devicePixelRatio||1,1.5);
 const w=Math.min(1000,Math.round(canvas.clientWidth*dp)),h=Math.min(1000,Math.round(canvas.clientHeight*dp));
 if(w&&h&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const p=livingPose(t,{reducedMotion:reduced,paused,speaking});
 yaw=p.yaw;pitch=0;
 gl.uniform1f(U.yaw,yaw);gl.uniform1f(U.pitch,pitch);gl.uniform1f(U.aspect,w/Math.max(h,1));
 const bob=p.breath;
 function limb(a,b,r,color){
   const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],n=Math.max(1,Math.ceil(Math.hypot(dx,dy,dz)/(r*.55)));
   for(let j=0;j<=n;j++){const f=j/n;
      ball([a[0]+dx*f,a[1]+dy*f,a[2]+dz*f],[r,r,r],color);
   }
 }
 // Chaussures, jambes, taille et veste. Les positions changent sans souris.
 for(const side of [-1,1]){
   const hip=[side*.27,-.62,0],knee=[side*.28,-1.24,side*p.step*.5],ankle=[side*.28,-1.85,.03];
   limb(hip,knee,.15,"pants");ball(knee,[.19,.22,.19],"pants");
   limb(knee,ankle,.135,"pants");ball([side*.28,-1.98,.15],[.20,.12,.30],"shoes");
 }
 ball([0,-.52+bob,0],[.43,.35,.28],"jacket");
 ball([0,.02+bob,0],[.50,.60,.32],"jacket");
 ball([0,.1+bob,.28],[.27,.38,.085],"jacketBlue");
 // Emblème lumineux sur le dos, visible lorsqu'elle se retourne.
 ball([0,.13+bob,-.318],[.12,.145,.04],"blue");
 ball([0,.15+bob,-.353],[.055,.081,.024],"white");
 ball([0,.52+bob,0],[.17,.22,.18],"tan");
 // Bras, mains et doigts en mouvement autonome et pendant les réponses.
 for(const side of [-1,1]){
   const gesture=side<0?p.armL:-p.armR;
   const shoulder=[side*.48,.36+bob,.02];
   const elbow=[side*(.70+Math.abs(gesture)*.11),-.16+bob+gesture*.22,.05];
   const hand=[side*(.74+Math.abs(gesture)*.30),-.72+bob+gesture*.5,.19];
   limb(shoulder,elbow,.145,"jacket");
   ball(elbow,[.14,.14,.14],"jacketBlue");
   limb(elbow,hand,.106,"jacket");
   ball(hand,[.09,.12,.06],"skin");
   ball([hand[0],hand[1]-.12,hand[2]],[.09,.13,.055],"skinLight");
   for(let j=0;j<4;j++){
     ball([hand[0]+side*(j-1.5)*.039,hand[1]-.23+.02*Math.sin(t*.002+j),hand[2]+.05],
          [.025,.085,.027],"skinLight");
   }
   ball([hand[0]-side*.11,hand[1]-.12,hand[2]+.08],[.05,.10,.04],"skin");
 }
 // Chevelure, volume blond, chignon et mèches arrière pour la vue de dos.
 ball([0,1.13+bob,-.25],[.54,.56,.45],"blonde");
 ball([0,1.37+bob,-.61],[.27,.26,.26],"gold");
 for(const side of [-1,1]){
   ball([side*.42,.96+bob,-.32],[.16,.48,.17],"hairShadow");
   ball([side*.49,.68+bob,-.32],[.13,.34,.15],"blonde");
 }
 // Visage à l'avant. Tête mobile, mais sans suivi caméra.
 const head=p.head;
 ball([head*.25,1.08+bob,.09],[.40,.52,.37],"skin");
 ball([head*.25,1.44+bob,.12],[.43,.27,.34],"blonde");
 for(const side of [-1,1]){
   ball([side*.36+head*.25,1.06+bob,.11],[.11,.18,.13],"tan");
   ball([side*.35+head*.25,1.43+bob,.33],[.17,.25,.19],"hairLight");
   ball([side*.40+head*.25,1.04+bob,.27],[.09,.33,.16],"gold");
 }
 const blink=blinkAmount(t,{reducedMotion:reduced});
 const mood=moodLook(expression);
 gazeTargetX=Math.sin(t*.00057)*.66;gazeTargetY=Math.sin(t*.00083)*.35;
 gazeX+=(gazeTargetX-gazeX)*.05;gazeY+=(gazeTargetY-gazeY)*.05;
 for(const side of [-1,1]){
   const x=side*.18+head*.25+gazeX*.02,y=1.17+bob+gazeY*.02;
   const eye=Math.max(.05,blink*mood.eye);
   ball([x,y,.422],[.132,.080*eye,.046],"white");
   ball([x+gazeX*.015,y+gazeY*.01,.461],[.069,.069*eye,.024],"blue");
   ball([x+gazeX*.016,y+gazeY*.01,.480],[.038,.047*eye,.017],"black");
   ball([x-.022,y+.027,.495],[.02,.018*eye,.011],"sparkle");
   ball([side*.18+head*.25,1.32+bob+mood.brow,.389],[.15,.027,.027],"brow");
   ball([side*.26+head*.25,1.01+bob,.38],[.13,.05,.025],"cheeks");
 }
 ball([head*.25,1.00+bob,.46],[.065,.12,.067],"tan");
 const target=mouthOpening(t,{speaking,reducedMotion:reduced,lastBoundary});
 mouth+=(target-mouth)*.17;
 ball([head*.25,.84+bob,.43],[.16,.03+mouth*.04,.044],"lips");
 ball([head*.25,.83+bob,.467],[.112,.004+mouth*.07,.022],"lipShadow");
 ball([head*.25,.82-mouth*.04+bob,.44],[.135,.021,.034],"lipLight");
}
let lastFrame=0;
function animate(t){
 if(document.visibilityState!=="hidden"&&t-lastFrame>=30){
  try{
    draw(t);
    if(!window.Alicia3DReady && canvas.width>100 && canvas.height>100){
      const rgba=new Uint8Array(4);
      const xs=[.46,.5,.54],ys=[.39,.49,.59];
      for(let i=0;i<xs.length;i++){
        gl.readPixels(Math.round(canvas.width*xs[i]),Math.round(canvas.height*ys[i]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
        if(rgba[3]>0){window.Alicia3DReady=true;window.AliciaShow3D?.();break;}
      }
    }
  }catch(e){window.AliciaFallback?.("Erreur de rendu 3D : "+(e?.message||"dessin"));return;}
  lastFrame=t;
}
 requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Pas de glisser pour tourner Alicia : toutes ses actions sont automatiques.
// Possibilité de mettre en pause (sans commander ses membres).
const bar=document.createElement("div");bar.className="alicia-motion-toolbar";
const button=document.createElement("button");button.type="button";button.className="secondary";
button.textContent=reduced?"Mouvement réduit par macOS":"⏸ Pause de l'animation";
button.disabled=reduced;
button.addEventListener("click",()=>{paused=!paused;button.textContent=paused?"▶ Reprendre Alicia":"⏸ Pause de l'animation";});
const caption=document.createElement("small");
caption.textContent="Alicia tourne seule à 360° : dos, mains, bras, jambes, yeux et bouche.";
bar.append(button,caption);canvas.parentElement?.append(bar);
canvas.setAttribute("aria-label","Avatar 3D d'Alicia animé automatiquement : corps, visage, mains et rotation montrant le dos.");
sayStatus("Alicia bouge et se retourne toute seule");
})();
