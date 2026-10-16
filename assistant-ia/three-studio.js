/* Alicia 3D Studio — Three.js r147 + OrbitControls MIT, both bundled locally.
 * Shape editor (cube, sphere, cylinder), image texture, orbit by mouse or touch.
 * The same picture pasted on 3D faces is NOT a reconstruction of unseen geometry.
 * Works fully offline when WebGL is supported; pauses animation while collapsed.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const THREE=window.THREE;
function attach(){
 if($("alicia-three-panel"))return;
 const panel=document.createElement("details");panel.id="alicia-three-panel";panel.className="alicia-three-panel";
 panel.innerHTML='<summary>🧊 Studio 3D — objet modulable et animé, 360°</summary>'+
 '<div class="alicia-three-body">'+
 '<p>Véritable objet 3D rotatif. Glisse le doigt ou la souris pour tourner autour et voir toutes ses faces. Ce mode applique éventuellement une photo comme texture, <strong>mais ne reconstruit pas le dos de la photo.</strong></p>'+
 '<div class="alicia-three-controls">'+
 '<label>Forme <select id="alicia-three-shape"><option value="box">Cube / pavé</option><option value="sphere">Sphère</option><option value="cylinder">Cylindre</option></select></label>'+
 '<label>Largeur <input type="range" id="alicia-three-width" min="0.5" max="3.5" step="0.1" value="1.8"></label>'+
 '<label>Hauteur <input type="range" id="alicia-three-height" min="0.5" max="3.5" step="0.1" value="1.8"></label>'+
 '<label>Profondeur <input type="range" id="alicia-three-depth" min="0.5" max="3.5" step="0.1" value="1.8"></label>'+
 '<label>Couleur <input id="alicia-three-color" type="color" value="#00ff88"></label>'+
 '<label>Vitesse de rotation <input type="range" id="alicia-three-speed" min="0" max="3" step="0.1" value="0.5"></label>'+
 '<label>Image sur l’objet (facultatif) <input id="alicia-three-image" type="file" accept="image/jpeg,image/png,image/webp"></label>'+
 '</div>'+
 '<div class="alicia-three-actions"><button type="button" id="alicia-three-animation">⏸ Pause</button>'+
 '<button type="button" id="alicia-three-reset">Recentrer la caméra</button>'+
 '<button type="button" id="alicia-three-clear">Retirer la photo</button></div>'+
 '<div id="alicia-three-canvas" class="alicia-three-viewport" aria-label="Objet 3D interactif et rotatif"></div>'+
 '<p id="alicia-three-status" role="status">Ouvre cette section pour initialiser WebGL.</p>'+
 '<small>Three.js r147 et OrbitControls sont enregistrés avec Alicia, sous licence MIT. Aucune bibliothèque téléchargée à chaque ouverture.</small>'+
 '</div>';
 const anchor=$("alicia-image3d-panel")||$("data-lab")||$("chat-form");
 if(anchor)anchor.before(panel);else document.querySelector("main")?.append(panel);
 if(!THREE||typeof THREE.WebGLRenderer!=="function"||typeof THREE.OrbitControls!=="function"){
  $("alicia-three-status").textContent="Bibliothèque 3D indisponible. Utilise le mode « Image vers 3D — relief » en attendant.";
  return;
 }
 let renderer=null,scene=null,camera=null,controls=null,mesh=null,material=null,texture=null,animation=0,active=false,lastFrame=0,auto=true,objectURL=null;
 const status=t=>{$("alicia-three-status").textContent=t;};
 const viewport=$("alicia-three-canvas");
 const num=(id)=>Math.max(.5,Math.min(3.5,Number($(id)?.value)||1.8));
 function geometry(){
  const w=num("alicia-three-width"),h=num("alicia-three-height"),d=num("alicia-three-depth");
  const shape=$("alicia-three-shape").value;
  if(shape==="sphere"){const g=new THREE.SphereGeometry(1,32,24);g.scale(w/2,h/2,d/2);return g;}
  if(shape==="cylinder"){const g=new THREE.CylinderGeometry(1,1,1,32);g.scale(w/2,h,d/2);return g;}
  return new THREE.BoxGeometry(w,h,d);
 }
 function resize(){
  if(!renderer||!camera||!viewport)return;
  const w=Math.max(180,Math.min(1200,Math.round(viewport.clientWidth||420)));
  const h=Math.max(220,Math.min(600,Math.round(w*.70)));
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
 }
 function updateMaterial(){
  if(!material)return;
  material.color.set($("alicia-three-color").value);
  material.map=texture||null;
  material.needsUpdate=true;
 }
 function rebuild(){
  if(!scene||!material)return;
  if(mesh){scene.remove(mesh);mesh.geometry.dispose();}
  mesh=new THREE.Mesh(geometry(),material);
  scene.add(mesh);
 }
 function initialise(){
  if(renderer)return true;
  try{
   scene=new THREE.Scene();scene.background=new THREE.Color(0x08132d);
   camera=new THREE.PerspectiveCamera(50,1,.1,100);
   camera.position.set(3.4,2.6,4.5);
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
   renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
   renderer.outputEncoding=THREE.sRGBEncoding;
   renderer.domElement.style.display="block";
   renderer.domElement.style.width="100%";
   renderer.domElement.style.touchAction="none";
   viewport.append(renderer.domElement);
   const ambient=new THREE.AmbientLight(0xffffff,.65);scene.add(ambient);
   const sunlight=new THREE.DirectionalLight(0xffffff,1.2);sunlight.position.set(4,6,7);scene.add(sunlight);
   const fill=new THREE.DirectionalLight(0x728dff,.65);fill.position.set(-4,-1,-4);scene.add(fill);
   scene.add(new THREE.GridHelper(5,10,0x335380,0x1f345d));
   material=new THREE.MeshStandardMaterial({color:0x00ff88,metalness:.5,roughness:.35,side:THREE.DoubleSide});
   rebuild();
   controls=new THREE.OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
   controls.minDistance=2.2;controls.maxDistance=11;
   controls.target.set(0,0,0);controls.update();
   resize();status("WebGL opérationnel. Rotation automatique active ; glisse pour déplacer la caméra.");
   window.addEventListener("resize",resize);
   renderer.domElement.addEventListener("webglcontextlost",event=>{
    event.preventDefault();active=false;status("Le moteur graphique a perdu son contexte. Ferme puis rouvre cette section.");
   },false);
   return true;
  }catch(error){
   status("WebGL indisponible sur cet appareil : "+String(error.message||error)+". Le relief 2,5D reste utilisable.");
   if(renderer){try{renderer.dispose();renderer.domElement.remove();}catch{}}renderer=null;
   return false;
  }
 }
 function animate(now){
  if(!active)return;
  animation=requestAnimationFrame(animate);
  const delta=Math.min(.05,Math.max(0,(now-(lastFrame||now))/1000));lastFrame=now;
  if(auto&&mesh)mesh.rotation.y+=delta*(Number($("alicia-three-speed").value)||0)*.75;
  if(auto&&mesh)mesh.rotation.x+=delta*.08;
  controls?.update();
  renderer?.render(scene,camera);
 }
 function start(){
  if(active||document.hidden||!panel.open||!initialise())return;
  active=true;lastFrame=0;animation=requestAnimationFrame(animate);
 }
 function stop(){active=false;if(animation)cancelAnimationFrame(animation);animation=0;}
 panel.addEventListener("toggle",()=>{if(panel.open)start();else stop();});
 document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else if(panel.open)start();});
 ["alicia-three-shape","alicia-three-width","alicia-three-height","alicia-three-depth"].forEach(id=>$(id).addEventListener("input",rebuild));
 $("alicia-three-color").addEventListener("input",updateMaterial);
 $("alicia-three-animation").addEventListener("click",e=>{auto=!auto;e.currentTarget.textContent=auto?"⏸ Pause":"▶ Relancer l’animation";});
 $("alicia-three-reset").addEventListener("click",()=>{
  if(!camera||!controls)return;
  camera.position.set(3.4,2.6,4.5);controls.target.set(0,0,0);
  if(mesh)mesh.rotation.set(0,0,0);
  controls.update();
  status("Caméra recentrée ; tu peux faire le tour de l’objet.");
 });
 function clearImage(){
  if(texture){texture.dispose();texture=null;}
  if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}
  updateMaterial();
 }
 $("alicia-three-clear").addEventListener("click",()=>{clearImage();$("alicia-three-image").value="";status("Texture effacée ; couleur d’origine affichée.");});
 $("alicia-three-image").addEventListener("change",e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>8_000_000||!/^image\/(png|jpeg|webp)$/.test(file.type)){
   status("Image refusée : utilise JPG, PNG ou WebP de moins de 8 Mo.");return;
  }
  if(!initialise())return;
  const url=URL.createObjectURL(file);
  new THREE.TextureLoader().load(url,(newTexture)=>{
    clearImage();objectURL=url;texture=newTexture;
    texture.encoding=THREE.sRGBEncoding;
    updateMaterial();
    status("Photo appliquée à la surface de l’objet. La vue arrière montre la texture, pas un dos réellement reconstruit.");
  },undefined,()=>{
    URL.revokeObjectURL(url);status("Impossible d’appliquer cette photo.");
  });
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});else attach();
})();
