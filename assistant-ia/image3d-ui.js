/* Alicia Image → nuage de points 3D, fonctionne sur iPhone et Big Sur sans service externe. */
import {generatePointCloud,exportPLY,projectPoints,MAX_INPUT_SIDE} from "./image3d-core.mjs";
const $=id=>document.getElementById(id);
function attach(){
 if($("alicia-image3d-panel"))return;
 const holder=document.createElement("details");
 holder.id="alicia-image3d-panel";holder.className="alicia-image3d";
 holder.innerHTML='<summary>🖼️ Image vers 3D — relief local, aperçu et export PLY</summary>'+
  '<div class="alicia-image3d-body">'+
  '<p>Choisis une image. Alicia génère un relief coloré approximatif à partir de la luminosité, en local. <strong>Il ne s’agit ni d’une vraie profondeur mesurée, ni d’une reconstruction de l’arrière de l’objet.</strong></p>'+
  '<label>Image JPG, PNG ou WebP <input id="image3d-file" type="file" accept="image/jpeg,image/png,image/webp,image/*"></label>'+
  '<label>Relief <input id="image3d-relief" type="range" min="0.05" max="1.6" step="0.05" value="0.65"></label>'+
  '<label class="alicia-image3d-check"><input type="checkbox" id="image3d-invert"> Inverser clair/foncé</label>'+
  '<div class="alicia-image3d-actions">'+
   '<button type="button" id="image3d-generate">Construire le relief</button>'+
   '<button type="button" id="image3d-pause">⏸ Arrêter la rotation</button>'+
   '<button type="button" id="image3d-export" disabled>Exporter en PLY</button>'+
  '</div>'+
  '<canvas id="image3d-canvas" width="430" height="330" role="img" aria-label="Aperçu du nuage de points coloré en rotation"></canvas>'+
  '<p id="image3d-status" role="status">Aucune image chargée. Toutes les opérations ont lieu sur cet appareil.</p>'+
  '</div>';
 const anchor=$("data-lab")||$("chat-form");
 if(anchor)anchor.before(holder);else document.querySelector("main")?.append(holder);
 const input=$("image3d-file"),make=$("image3d-generate"),exportBtn=$("image3d-export");
 const can=$("image3d-canvas"),ctx=can?.getContext("2d");
 let source=null,cloud=null,angle=0,running=true,rendering=false,last=0;
 const state=msg=>{$("image3d-status").textContent=msg;};
 const draw=(ts)=>{
   if(!can||!ctx||!cloud||!holder.open||document.hidden)return;
   if(running&&ts-last>50){angle+=(ts-last>500?50:ts-last)*0.00024;last=ts;} else last=ts;
   const w=can.width,h=can.height;
   ctx.fillStyle="#09142e";ctx.fillRect(0,0,w,h);
   const points=projectPoints(cloud,angle,0.17);
   // Rear points first: stable, deterministic painter's order, no WebGL required.
   points.sort((a,b)=>a.depth-b.depth);
   const zoom=Math.min(w,h)*0.92;
   for(const p of points){
     const x=w/2+p.x*zoom,y=h/2-p.y*zoom;
     if(x<0||y<0||x>=w||y>=h)continue;
     ctx.fillStyle="rgb("+p.r+","+p.g+","+p.b+")";
     ctx.fillRect(x,y,2.4,2.4);
   }
 };
 function frame(ts){
   if(!rendering)return;
   draw(ts);
   requestAnimationFrame(frame);
 }
 function start(){
   if(!rendering){rendering=true;last=performance.now();requestAnimationFrame(frame);}
 }
 async function loadImage(file){
   if(!file)throw Error("Choisis une image");
   if(file.size>12_000_000)throw Error("Image trop grande (maximum 12 Mo)");
   const uri=URL.createObjectURL(file);
   try{
     const image=new Image();image.decoding="async";
     await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("Image illisible"));image.src=uri;});
     const side=Math.min(1,MAX_INPUT_SIDE/Math.max(image.naturalWidth,image.naturalHeight));
     const width=Math.max(2,Math.round(image.naturalWidth*side)),height=Math.max(2,Math.round(image.naturalHeight*side));
     const scratch=document.createElement("canvas");scratch.width=width;scratch.height=height;
     const sc=scratch.getContext("2d",{willReadFrequently:true})||scratch.getContext("2d");
     if(!sc)throw Error("Le navigateur ne peut pas lire cette image");
     sc.drawImage(image,0,0,width,height);
     return sc.getImageData(0,0,width,height);
   }finally{URL.revokeObjectURL(uri);}
 }
 async function generate(){
   make.disabled=true;state("Calcul local du relief en cours…");
   try{
     if(!source)source=await loadImage(input.files?.[0]);
     cloud=generatePointCloud(source,{step:4,relief:Number($("image3d-relief").value),invert:$("image3d-invert").checked});
     if(!cloud.count)throw Error("Aucun point : image transparente");
     exportBtn.disabled=false;
     state(cloud.count+" points générés sans Internet. Le relief est estimé par la luminosité, non par un modèle IA de profondeur.");
     start();
   }catch(e){state("⚠️ "+e.message);}
   finally{make.disabled=false;}
 }
 input?.addEventListener("change",()=>{source=null;cloud=null;exportBtn.disabled=true;state("Image choisie. Clique sur Construire le relief.");});
 make?.addEventListener("click",()=>void generate());
 $("image3d-pause")?.addEventListener("click",e=>{
   running=!running;e.currentTarget.textContent=running?"⏸ Arrêter la rotation":"▶ Reprendre la rotation";
 });
 exportBtn?.addEventListener("click",()=>{
   try{
     if(!cloud)throw Error("Génère d'abord le nuage de points");
     const data=exportPLY(cloud);
     const url=URL.createObjectURL(new Blob([data],{type:"application/octet-stream"}));
     const link=document.createElement("a");link.href=url;link.download="alicia-relief-image-2_5D.ply";
     document.body.append(link);link.click();link.remove();
     setTimeout(()=>URL.revokeObjectURL(url),5000);
     state("Export PLY préparé ("+cloud.count+" points). Ce fichier est un relief 2,5D sans arrière reconstruit.");
   }catch(e){state("⚠️ "+e.message);}
 });
 holder.addEventListener("toggle",()=>{if(holder.open&&cloud)start();});
 document.addEventListener("visibilitychange",()=>{last=performance.now();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});else attach();
