/* Alicia : indicateur de connexion réel + indication de réseau (Wi-Fi/Ethernet).
 * navigator.connection.type est NON STANDARD et généralement indisponible dans Safari.
 * Le SSID / réseau principal n'est jamais lisible par une application Web.
 * Les déclarations manuelles ne servent PAS de preuve technique.
 *
 * Règle iPhone : ne charger Puter automatiquement que si le Wi-Fi est
 * explicitement reconnu par le navigateur ; sinon confirmation manuelle.
 * Ne jamais confondre « Internet accessible » et « Wi-Fi garanti ».
 */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const state={confirmed:false,loading:false,authenticated:false};
const button=$("wifi-confirm"),status=$("wifi-state"),choice=$("network-choice");
const indicator=$("network-icon"),label=$("network-label"),dot=$("network-dot");
const sdk="https://js.puter.com/v2/";
let loadingPromise=null;
function isApplePhone(){
 return /iPhone|iPad|iPod/i.test(navigator.userAgent||"") ||
 (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
}
function networkType(){
 const type=(navigator.connection||navigator.webkitConnection)?.type;
 return ["wifi","ethernet","cellular","none"].includes(String(type).toLowerCase())?String(type).toLowerCase():"unknown";
}
function selectedType(){
 const type=networkType();
 // An actual browser-reported type always overrides a user declaration.
 if(type!=="unknown")return {type,observed:true};
 const manual=choice?.value||"auto";
 return {type:manual==="wifi-primary"?"wifi":manual==="ethernet"?"ethernet":"unknown",observed:false};
}
function online(){
 return navigator.onLine!==false && networkType()!=="none";
}
function isApproved(){
 if(!online()||networkType()==="cellular")return false;
 if(!isApplePhone())return true;
 const real=networkType();
 if(real==="wifi")return true;
 // Ethernet + Wi-Fi déclarés : nécessitent une confirmation volontaire sur iPhone.
 return state.confirmed && (selectedType().type==="wifi"||selectedType().type==="ethernet");
}
function requireConfirmed(){
 if(!isApproved())throw Error("Alicia attend une connexion Wi-Fi approuvée (ou Ethernet autorisé) : vérifie le réseau dans l'indicateur puis confirme si Safari ne peut pas l'identifier. Pour empêcher la 4G/5G, désactive les données cellulaires d'Alicia/Safari et Assistance Wi-Fi dans iOS.");
}
function describe(){
 if(!online())return {icon:"◌",text:"Hors ligne",color:"offline",detail:"Aucune connexion Internet détectée."};
 if(networkType()==="cellular")return {icon:"▥",text:"Cellulaire : IA bloquée",color:"offline",detail:"Réseau cellulaire détecté. Alicia ne lancera pas Puter depuis ce réseau."};
 const {type,observed}=selectedType();
 if(type==="ethernet")return {
  icon:"🔌",color:isApproved()?"online":"unknown",
  text:isApproved()?(observed?"Ethernet · connecté":"Ethernet déclaré · connecté"):"Ethernet · à confirmer",
  detail:observed?"Connexion Ethernet rapportée par le navigateur.":"Ethernet choisi manuellement : Safari ne confirme pas le câble ni la connexion utilisée."
 };
 if(type==="wifi")return {
  icon:"📶",color:isApproved()?"online":"unknown",
  text:isApproved()?(observed?"Wi-Fi · connecté":"Wi-Fi principal déclaré · connecté"):"Wi-Fi principal · à confirmer",
  detail:observed?"Type Wi-Fi rapporté par le navigateur : le nom du réseau reste inaccessible.":"Wi-Fi principal choisi manuellement : Safari ne peut pas confirmer le SSID ou exclure la 4G/5G."
 };
 return {
  icon:"🌐",text:"Internet · réseau inconnu",color:"unknown",
  detail:isApplePhone()?"Safari voit Internet, mais ne permet pas de distinguer sûrement Wi-Fi, Ethernet ou cellulaire. Ouvre ce réglage pour confirmer un réseau autorisé.":"Internet semble actif, mais le type de liaison n'est pas communiqué par le navigateur."
 };
}
function show(){
 const info=describe();
 if(indicator)indicator.textContent=info.icon;
 if(label)label.textContent=info.text+(state.authenticated?" · Puter ✓":"");
 if(dot){dot.className="network-dot "+info.color;dot.setAttribute("aria-label",info.color==="online"?"Connexion approuvée":info.color==="offline"?"Déconnecté ou bloqué":"Type de réseau non vérifié");}
 if(status)status.textContent=info.detail+(state.loading?" Connexion d'Alicia en cours…":"");
 if(button){
  button.disabled=state.loading||!online()||networkType()==="cellular"||(!["wifi","ethernet"].includes(selectedType().type));
  button.textContent=isApproved()?"✓ Connexion confirmée pour cette session":"Confirmer le réseau pour cette session";
  // Laisser la confirmation accessible pour contrôler l'état même quand elle est reconnue.
 }
}
async function loadSDK(){
 if(window.puter?.ai?.chat)return;
 if(loadingPromise)return loadingPromise;
 state.loading=true;show();
 loadingPromise=new Promise((resolve,reject)=>{
  const el=document.createElement("script");el.src=sdk;el.async=true;
  el.onload=()=>window.puter?.auth?.signIn?resolve():reject(Error("Puter n'est pas disponible."));
  el.onerror=()=>reject(Error("Puter n'a pas pu être chargé."));
  document.head.append(el);
 });
 try{await loadingPromise}
 finally{loadingPromise=null;state.loading=false;show()}
}
async function activate(){
 if(!isApproved()){show();return;}
 try{
  await loadSDK();
  if(window.AliciaPuter?.refresh)await window.AliciaPuter.refresh();
 }catch(e){
  state.authenticated=false;show();
  if(status)status.textContent="Connexion non disponible : "+String(e.message||e);
 }
}
async function confirm(){
 const t=selectedType().type;
 if(!online()||networkType()==="cellular"||(isApplePhone()&&!["wifi","ethernet"].includes(t))){show();return;}
 state.confirmed=true;show();await activate();
}
button?.addEventListener("click",confirm);
choice?.addEventListener("change",()=>{
 // Une sélection manuelle différente exige une nouvelle autorisation iPhone.
 state.confirmed=false;state.authenticated=false;show();
 if(networkType()==="wifi"||!isApplePhone())activate();
});
function revoke(){
 state.confirmed=false;state.authenticated=false;show();
 if($("puter-state"))$("puter-state").textContent="Connexion à vérifier avant de reprendre l'IA.";
}
async function reconnectIfVerifiedWiFi(){
 if(!online()||networkType()==="cellular"){revoke();return;}
 const real=networkType();
 if(real==="wifi"||(!isApplePhone()&&real!=="cellular")){
  state.confirmed=real==="wifi";show();await activate();
 }else{
  // Unknown sur iPhone : jamais d'utilisation automatique de données mobiles.
  revoke();
 }
}
window.addEventListener("offline",revoke);
window.addEventListener("online",reconnectIfVerifiedWiFi);
(navigator.connection||navigator.webkitConnection)?.addEventListener?.("change",reconnectIfVerifiedWiFi);
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible")reconnectIfVerifiedWiFi();
});
window.AliciaWiFi={isApproved,requireConfirmed,show,reconnectIfVerifiedWiFi,networkType,selectedType,updateAuth(signed){state.authenticated=Boolean(signed);show()}};
show();
if(online()&&(networkType()==="wifi"||!isApplePhone())){
 Promise.resolve().then(reconnectIfVerifiedWiFi);
}
})();