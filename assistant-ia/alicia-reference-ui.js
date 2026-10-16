/* Alicia UI 2026 : transposition interactive de la référence iPhone.
 * Les contrôles sont branchés sur les éléments déjà existants; pas de promesse d'IA illimitée.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const modes=[
  {value:"general",label:"⌂ Général"},
  {value:"code",label:"⌘ Code"},
  {value:"repair",label:"⚒ Réparation"},
  {value:"create",label:"✦ Création"},
  {value:"teach",label:"▣ Professeur"}
];
function init(){
 const avatarStage=document.querySelector(".avatar-stage");
 const avatar=document.querySelector(".avatar-shell");
 const modeSelector=$("mode");
 if(!avatarStage||!avatar||!modeSelector||$("alicia-reference-overlay"))return;
 const info=document.createElement("div");
 info.id="alicia-reference-overlay";
 info.className="alicia-reference-overlay";
 info.innerHTML='<p class="alicia-reference-status"><span class="alicia-reference-dot" aria-hidden="true"></span><span>Alicia est prête</span></p>'+
 '<p class="alicia-reference-subtitle">Écouter · apprendre · créer, localement sur ton appareil.</p>'+
 '<div class="alicia-reference-tags" aria-label="Caractéristiques"><span>✧ Française</span><span>♡ Bienveillante</span><span>∞ Sans abonnement</span></div>';
 const avatarButton=document.createElement("button");
 avatarButton.type="button";avatarButton.id="alicia-reference-open3d";
 avatarButton.textContent="↻ Ouvrir mon avatar 3D";
 avatarButton.setAttribute("aria-label","Afficher l'avatar Alicia en trois dimensions");
 avatarButton.addEventListener("click",()=>{
   if(window.Alicia3D?.ready){window.Alicia3D.open();return;}
   // Graceful fallback: user still receives a clear explanation, never fake 3D.
   const existing=$("alicia-avatar3d-status")||$("avatar-status");
   if(existing)existing.textContent="La 3D WebGL est indisponible sur cet appareil. Le portrait et la voix restent accessibles.";
 });
 info.append(avatarButton);
 avatarStage.append(info);
 const nav=document.createElement("nav");
 nav.className="alicia-reference-modes";nav.id="alicia-reference-modes";
 nav.setAttribute("aria-label","Modes d'expertise rapides d'Alicia");
 const title=document.createElement("span");title.className="alicia-reference-modes-label";title.textContent="✦ Expertise";
 nav.append(title);
 const buttons=[];
 for(const item of modes){
   const btn=document.createElement("button");
   btn.type="button";btn.textContent=item.label;btn.dataset.aliciaMode=item.value;
   btn.addEventListener("click",()=>{
     modeSelector.value=item.value;
     modeSelector.dispatchEvent(new Event("change",{bubbles:true}));
     sync();
   });
   nav.append(btn);buttons.push(btn);
 }
 avatar.insertAdjacentElement("afterend",nav);
 function sync(){for(const btn of buttons)btn.setAttribute("aria-pressed",String(btn.dataset.aliciaMode===modeSelector.value));}
 modeSelector.addEventListener("change",sync);
 sync();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
