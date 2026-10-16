/* Alicia Mac V0.3.3 : avatar visible même si le script 3D ne fonctionne pas. */
(function(){
 "use strict";
 const node=()=>document.getElementById("avatar-status");
 const stage=()=>document.querySelector(".avatar-stage");
 window.Alicia3DReady=false;
 window.AliciaFallback=function(reason){
   stage()?.removeAttribute("data-alicia-3d");
   window.Alicia3DReady=false;
   const el=node();
   if(el)el.textContent=(reason?reason+" ":"")+"Alicia utilise son avatar animé de secours.";
 };
 window.AliciaShow3D=function(){
   if(!window.Alicia3DReady)return;
   stage()?.setAttribute("data-alicia-3d","ready");
   const el=node();
   if(el)el.textContent="Alicia 3D est affichée et s'anime toute seule.";
 };
 // Écoute de WebGL perdu, sans supprimer le personnage d'attente visible.
 const canvas=document.getElementById("alicia-avatar");
 canvas?.addEventListener("webglcontextlost",e=>{
   e.preventDefault();
   window.AliciaFallback("Le moteur 3D a perdu le contexte graphique.");
 });
})();
