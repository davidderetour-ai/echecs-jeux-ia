/* Portrait de référence intégré depuis la version V0.2, sans représenter la 2D comme un maillage 3D. */
(function() {
"use strict";
function render(){
 const stage=document.querySelector(".avatar-stage");
 if(!stage||document.getElementById("alicia-reference-photo"))return;
 const visual=document.createElement("aside");
 visual.id="alicia-reference-photo";visual.className="alicia-photo-identity";
 const photo=document.createElement("img");
 photo.src="./AliciaPortrait.jpg";photo.alt="Visage de référence d'Alicia, cheveux blonds et yeux bleus";
 photo.onerror=()=>visual.remove();
 const title=document.createElement("small");
 title.textContent="Visage de référence · corps 3D stylisé en développement";
 visual.append(photo,title);stage.appendChild(visual);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);
else render();
})();
