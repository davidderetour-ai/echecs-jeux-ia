/* Alicia iPhone — choix de connexion Wi-Fi seulement.
 * Safari iOS n'expose pas toujours le type réseau. Une déclaration manuelle
 * n'empêche pas iOS de basculer sur le cellulaire. Configurer aussi iOS.
 * Avant confirmation, aucun SDK Puter n'est chargé par cette interface.
 */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const state={confirmed:false,loading:false};
const connect=$("wifi-confirm"),status=$("wifi-state");
const sdk="https://js.puter.com/v2/";
function isApplePhone(){
 return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
 (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
}
function networkType(){
 const type=(navigator.connection||navigator.webkitConnection)?.type;
 return typeof type==="string"?type.toLowerCase():"unknown";
}
function isApproved(){
 return !isApplePhone()||state.confirmed && navigator.onLine!==false && networkType()!=="cellular";
}
function requireConfirmed(){
 if(!isApproved())throw Error("Alicia est réglée sur Wi-Fi uniquement. Vérifie l'icône Wi-Fi en haut de l'iPhone, puis confirme le réseau dans la section Connexion IA. Pour une garantie réelle, désactive les données cellulaires d'Alicia/Safari et Assistance Wi-Fi dans les réglages iOS.");
}
function show(){
 if(!status)return;
 const type=networkType();
 if(type==="cellular"){
  status.textContent="Réseau cellulaire détecté : accès IA bloqué. Connecte le Wi-Fi.";
  if(connect)connect.disabled=true;
 }else if(navigator.onLine===false){
  status.textContent="Hors ligne : Alicia ne contacte pas son moteur IA.";
  if(connect)connect.disabled=true;
 }else{
  if(connect)connect.disabled=state.loading;
  status.textContent=state.confirmed?
    "Wi-Fi déclaré par toi pour cette session. iOS décide du réseau réel ; pour bloquer la 4G/5G, utilise Réglages > Données cellulaires.":
    "Wi-Fi uniquement : vérifie l'icône Wi-Fi de l'iPhone, puis touche « Je suis en Wi-Fi » avant toute connexion IA. Safari ne peut pas vérifier ce réseau de façon fiable.";
 }
}
async function loadSDK(){
 if(window.puter?.ai?.chat)return;
 if(state.loading)return;
 state.loading=true;show();
 try{
  await new Promise((resolve,reject)=>{
   const el=document.createElement("script");
   el.src=sdk;el.async=true;
   el.onload=()=>window.puter?.auth?.signIn?resolve():reject(Error("Puter n'est pas disponible."));
   el.onerror=()=>reject(Error("Impossible de charger Puter avec ce Wi-Fi."));
   document.head.append(el);
  });
 }finally{state.loading=false;show();}
}
async function confirm(){
 if(networkType()==="cellular"||navigator.onLine===false){show();return;}
 state.confirmed=true;show();
 try{
  await loadSDK();
  window.AliciaPuter?.refresh();
 }catch(e){
  if(status)status.textContent="Wi-Fi déclaré, mais "+String(e.message||e)+" Réessaie quand le réseau fonctionne.";
 }
}
connect?.addEventListener("click",confirm);
function revoke(){
 state.confirmed=false;
 show();
 if($("puter-state"))$("puter-state").textContent="Vérifie à nouveau le Wi-Fi avant de te connecter.";
}
// Connexion automatique UNIQUEMENT lorsque le navigateur identifie vraiment un Wi-Fi.
// Safari sur iPhone indique généralement "unknown" : confirmation manuelle obligatoire.
async function reconnectIfVerifiedWiFi(){
 if(networkType()==="wifi"&&navigator.onLine!==false){
  if(!state.confirmed)await confirm();
  else window.AliciaPuter?.refresh();
 }else revoke();
}
window.addEventListener("offline",revoke);
window.addEventListener("online",reconnectIfVerifiedWiFi);
(navigator.connection||navigator.webkitConnection)?.addEventListener?.("change",reconnectIfVerifiedWiFi);
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible"){
  // Réévaluation après sortie d'arrière-plan pour éviter une reprise cellulaire silencieuse.
  reconnectIfVerifiedWiFi();
 }
});
window.AliciaWiFi={isApproved,requireConfirmed,show,reconnectIfVerifiedWiFi};
show();
if(networkType()==="wifi"&&navigator.onLine!==false){
 reconnectIfVerifiedWiFi();
}
})();