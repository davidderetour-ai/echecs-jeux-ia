/* Alicia articulated 3D avatar — Three.js r147 bundled locally. No API or CDN.
 * Stylized original 3D geometry with autonomous motion. Not a photogrammetric copy.
 * For Big Sur/older iPhone run at 30FPS, low triangle counts, graceful WebGL fallback.
 */
(function(){
"use strict";
const THREE=window.THREE,$=id=>document.getElementById(id);
function init(){
 const stage=document.querySelector(".avatar-stage");
 if(!stage||$("alicia-avatar3d"))return;
 const panel=document.createElement("section");panel.id="alicia-avatar3d";panel.className="alicia-avatar3d";panel.setAttribute("aria-label","Alicia, avatar 3D articulé, tournant sur lui-même");
 panel.innerHTML='<div class="alicia-avatar3d-toolbar"><button type="button" id="alicia-avatar3d-pause">⏸ Rotation</button><button type="button" id="alicia-avatar3d-front">Face</button><button type="button" id="alicia-avatar3d-turn">Dos</button><button type="button" id="alicia-avatar3d-view">Recentrer</button></div>'+
 '<div id="alicia-avatar3d-view" class="alicia-avatar3d-view" aria-label="Avatar de femme blonde en 3D, articulations et expression"></div>'+
 '<p class="alicia-avatar3d-caption" id="alicia-avatar3d-status" role="status">Avatar Alicia 3D : modèle original stylisé, en préparation…</p>';
 stage.prepend(panel);
 const hasReferencePortrait=Boolean($("alicia-photo-stage"));
 if(hasReferencePortrait)panel.hidden=true;
 const status=x=>{$("alicia-avatar3d-status").textContent=x;};
 if(!THREE?.WebGLRenderer||!THREE?.OrbitControls){panel.hidden=true;return;}
 let scene,camera,renderer,orbit,root,rig,face,mouth,eyes=[],hair,armR,armL,legR,legL,head,blinking=false,active=false;
 const canvas=$("alicia-avatar");
 let auto=true,speaking=false,expression="happy",turnTo=null,lastT=0;
 const mat=(color,metalness=0,roughness=.8)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const skin=mat(0xe3ae8b),skinLight=mat(0xedb99d),hairMat=mat(0xdcb856,.15,.65),hairLight=mat(0xf4db8e,.12,.65);
 const iris=mat(0x61b9f2),white=mat(0xfff7f3),pupil=mat(0x153654),lash=mat(0x473527),lip=mat(0x9a5360);
 const outfit=mat(0x252047,.25,.6),jacket=mat(0x32376e,.2,.75),neon=new THREE.MeshStandardMaterial({color:0x85caff,emissive:0x215dc1,emissiveIntensity:.7});
 const shorts=mat(0x222533,.18,.8),shoe=mat(0xdde3f3,.2,.5),sole=mat(0x6aa6df,.25,.5);
 function oval(parent,color,x,y,z,rx,ry,rz,segments=16){
   const item=new THREE.Mesh(new THREE.SphereGeometry(1,segments,12),color);
   item.position.set(x,y,z);item.scale.set(rx,ry,rz);parent.add(item);return item;
 }
 function cylinder(parent,color,from,to,r1,r2){
   const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=new THREE.Vector3().subVectors(end,start);
   const c=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,delta.length(),12,1),color);
   c.position.copy(start).add(end).multiplyScalar(.5);
   c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(c);
   return c;
 }
 function group(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
 function makeBody(){
   root=group(scene,0,0,0);rig=group(root,0,0,0);
   // Body proportions: feet at y=0, hips 1.15, shoulders 2.03 and head above.
   oval(rig,shorts,0,1.17,0,.30,.24,.195);
   oval(rig,skin,0,1.50,0,.265,.30,.165);
   oval(rig,outfit,0,1.67,0,.305,.27,.197);
   oval(rig,jacket,0,1.95,-.015,.398,.19,.19);
   oval(rig,outfit,0,1.91,.146,.2,.075,.055);
   // Blue luminous A insignia, actual 3D three-stroke construction.
   const badge=group(rig,0,1.72,.200);
   cylinder(badge,neon,[-.084,-.095,.015],[0,.12,.015],.016,.016);
   cylinder(badge,neon,[0,.12,.015],[.084,-.095,.015],.016,.016);
   cylinder(badge,neon,[-.05,-.018,.018],[.05,-.018,.018],.012,.012);
   cylinder(rig,skin,[0,2.035,0],[0,2.22,0],.087,.085);
   head=group(rig,0,2.365,0);
   oval(head,skinLight,0,0,0,.207,.27,.19,22);
   // Face placed at z > 0 for forward direction.
   oval(head,skin,0,-.1,.177,.118,.105,.046);
   oval(head,skinLight,0,-.025,.200,.048,.065,.045);
   // Blonde bangs and carefully shaped updo.
   oval(head,hairMat,0,.187,-.025,.229,.14,.181,20);
   oval(head,hairLight,-.12,.2,.071,.107,.07,.105);
   oval(head,hairMat,.08,.235,.076,.139,.075,.099);
   hair=group(head,0,.35,-.048);
   oval(hair,hairMat,0,.06,-.09,.15,.13,.15);
   oval(hair,hairLight,.035,.08,-.04,.10,.10,.115);
   oval(head,hairLight,-.18,.025,.045,.058,.18,.09);
   oval(head,hairMat,.17,.018,-.027,.071,.19,.12);
   for(const side of [-1,1]){
     oval(head,skinLight,side*.206,-.031,0,.038,.07,.045);
     const eye=group(head,side*.089,.02,.170);
     oval(eye,white,0,0,.0,.065,.033,.033);
     oval(eye,iris,0,0,.03,.029,.030,.015);
     oval(eye,pupil,0,0,.042,.013,.014,.009);
     oval(head,lash,side*.09,.071,.186,.063,.008,.013);
     const eyelid=oval(eye,skinLight,0,.037,.009,.068,.003,.039);
     eyes.push({eye,lid:eyelid});
     oval(head,hairMat,side*.163,.18,.082,.061,.081,.073);
   }
   mouth=oval(head,lip,0,-.143,.187,.085,.011,.011);
   oval(head,skinLight,0,-.193,.15,.088,.048,.035);
   // Arms as jointed groups with small hands and fingers.
   function arm(side){
      const shoulder=group(rig,side*.373,1.975,0);
      oval(shoulder,jacket,side*.022,-.07,.005,.145,.155,.142);
      oval(shoulder,jacket,side*.02,-.225,0,.115,.21,.113);
      const elbow=group(shoulder,side*.022,-.39,0);
      oval(elbow,skin,0,-.175,0,.073,.20,.080);
      oval(elbow,skinLight,0,-.35,0,.085,.094,.07);
      for(let i=0;i<4;i++)oval(elbow,skin,side*(i-1.5)*.034,-.45,.02,.016,.095,.02,10);
      return {shoulder,elbow};
   }
   armL=arm(-1);armR=arm(1);
   // Legs: model thighs, knees, calves, shoes with toes forward.
   function leg(side){
      const hip=group(rig,side*.17,1.15,0);
      oval(hip,shorts,0,-.14,0,.16,.21,.16);
      oval(hip,skin,0,-.33,0,.124,.25,.123);
      const knee=group(hip,0,-.57,0);
      oval(knee,skin,0,0,0,.097,.112,.099);
      oval(knee,skin,0,-.215,0,.09,.24,.095);
      oval(knee,shoe,0,-.465,.053,.127,.09,.18);
      oval(knee,sole,0,-.525,.077,.13,.038,.19);
      return {hip,knee};
   }
   legL=leg(-1);legR=leg(1);
 }
 try{
   scene=new THREE.Scene();scene.background=new THREE.Color(0x0f1d45);
   camera=new THREE.PerspectiveCamera(39,1,.1,100);
   camera.position.set(0,1.48,4.85);camera.lookAt(0,1.43,0);
   renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"low-power",alpha:false});
   renderer.setPixelRatio(Math.min(1.3,window.devicePixelRatio||1));
   renderer.outputEncoding=THREE.sRGBEncoding;
   const view=$("alicia-avatar3d-view");view.append(renderer.domElement);
   renderer.domElement.style.touchAction="none";
   scene.add(new THREE.AmbientLight(0xffffff,.73));
   const front=new THREE.DirectionalLight(0xffffff,1.15);front.position.set(3,5,6);scene.add(front);
   const back=new THREE.DirectionalLight(0x87b6ff,.7);back.position.set(-4,3,-5);scene.add(back);
   const floor=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.3,.07,36),mat(0x23386c,.35,.5));
   floor.position.set(0,-.06,0);scene.add(floor);
   makeBody();
   orbit=new THREE.OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.enablePan=false;
   orbit.target.set(0,1.47,0);orbit.minDistance=2.7;orbit.maxDistance=9;
   orbit.maxPolarAngle=Math.PI*.76;orbit.minPolarAngle=Math.PI*.17;
   orbit.update();
   const resize=()=>{
    const w=Math.max(270,Math.min(650,Math.round(view.clientWidth||450)));
    const h=Math.round(Math.min(630,w*1.0));renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
   };
   window.addEventListener("resize",resize);resize();
   function showAvatar3D(){
     panel.hidden=false;
     if(canvas)canvas.style.display="none";
     stage.classList.add("alicia3d-enabled");
     resize();
     document.querySelector(".avatar-shell")?.scrollIntoView({behavior:"smooth",block:"center"});
     status("Avatar 3D stylisé : glisse pour faire le tour, ou utilise les boutons Face/Dos.");
   }
   if(!hasReferencePortrait)showAvatar3D();
   window.Alicia3D={
      ready:true,open:showAvatar3D,
      setExpression(x){expression=String(x||"happy");},
      setSpeaking(on){speaking=!!on;},
      rotateTo(angle){turnTo=angle;auto=false;},
      restart(){auto=true;turnTo=null;}
   };
   status("Alicia en vraie 3D stylisée : mouvements autonomes, vue 360°, visage et voix.");
 }catch(e){panel.hidden=true;if(canvas)canvas.style.display="";status("Moteur 3D indisponible : "+e.message);try{renderer?.dispose();}catch{}return;}
 $("alicia-avatar3d-pause").addEventListener("click",e=>{auto=!auto;turnTo=null;e.currentTarget.textContent=auto?"⏸ Rotation":"▶ Rotation";});
 $("alicia-avatar3d-front").addEventListener("click",()=>{turnTo=0;auto=false;});
 $("alicia-avatar3d-turn").addEventListener("click",()=>{turnTo=Math.PI;auto=false;});
 $("alicia-avatar3d-view").addEventListener("click",()=>{camera.position.set(0,1.48,4.85);orbit.target.set(0,1.47,0);orbit.update();});
 let last=0;
 function frame(t){
   requestAnimationFrame(frame);
   if(document.hidden||panel.hidden||t-last<32)return;
   const dt=Math.min(.075,(t-last)/1000||.033);last=t;
   // Auto rotation 25-second cycle unless user selects Face or Dos.
   if(turnTo!==null){
     const diff=Math.atan2(Math.sin(turnTo-root.rotation.y),Math.cos(turnTo-root.rotation.y));
     root.rotation.y+=diff*Math.min(1,dt*4);
   } else if(auto)root.rotation.y+=dt*.18;
   const phase=t*.0015;
   rig.position.y=Math.sin(phase*2)*.012;
   legL.hip.rotation.x=Math.sin(phase)*.12;
   legR.hip.rotation.x=-Math.sin(phase)*.12;
   legL.knee.rotation.x=Math.max(0,-Math.sin(phase))*.055;
   legR.knee.rotation.x=Math.max(0,Math.sin(phase))*.055;
   armL.shoulder.rotation.z=-.14+Math.sin(phase)*.035;
   armR.shoulder.rotation.z=.14-Math.sin(phase)*.035;
   armL.shoulder.rotation.x=Math.sin(phase+.5)*.09;
   armR.shoulder.rotation.x=-Math.sin(phase+.5)*.09;
   head.rotation.y=Math.sin(t*.00059)*.07;
   head.rotation.z=Math.sin(t*.00113)*.024;
   // Blink without depending on server/audio access; mouth follows TTS signal.
   const blink=Math.pow(Math.max(0,Math.cos(t*.0018+1.9)),28);
   for(const e of eyes)e.lid.scale.y=.004+blink*.034;
   mouth.scale.y=speaking ? (.025+Math.abs(Math.sin(t*.017))*.035) : .009;
   orbit.update();renderer.render(scene,camera);
 }
 requestAnimationFrame(frame);
 window.addEventListener("pagehide",()=>{try{renderer.dispose();}catch{}},{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
