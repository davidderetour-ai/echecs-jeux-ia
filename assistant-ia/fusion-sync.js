/* Alicia Fusion : contrôle commun des versions, sans toucher aux données des appareils.
   Version hébergée sur GitHub Pages, pas d'accès aux autres appareils ni aux fichiers privés. */
(function(){
 "use strict";
 const RELEASE_URL="https://davidderetour-ai.github.io/echecs-jeux-ia/assistant-ia/fusion-release.json";
 const WEB_URL="https://davidderetour-ai.github.io/echecs-jeux-ia/assistant-ia/";
 function compare(a,b){
  const pa=String(a||"0").split(".").map(n=>parseInt(n,10)||0);
  const pb=String(b||"0").split(".").map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(pa.length,pb.length);i++){if((pa[i]||0)>(pb[i]||0))return 1;if((pa[i]||0)<(pb[i]||0))return -1;}
  return 0;
 }
 async function check(force=false){
  const label=document.getElementById("alicia-fusion-version-state");
  if(label)label.textContent="Comparaison de version en cours…";
  let url;
  try{
   url=RELEASE_URL+"?v="+(force?Date.now():Math.floor(Date.now()/300000));
   const response=await fetch(url,{cache:"no-store",mode:"cors"});
   if(!response.ok)throw new Error("Version non disponible : HTTP "+response.status);
   const release=await response.json();
   if(!release||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(release.version))throw new Error("Numéro de version invalide");
   if(release.webUrl!==WEB_URL)throw new Error("Origine de mise à jour non reconnue");
   const local=document.querySelector('meta[name="alicia-version"]')?.content||"0.0.0";
   const newer=compare(release.version,local)>0;
   const older=compare(release.version,local)<0;
   if(label)label.textContent=newer?"Nouvelle version "+release.version+" disponible":older?"Version locale en avance sur la référence ("+local+")":"Alicia web à jour — "+local;
   const action=document.getElementById("alicia-fusion-refresh");
   if(action){action.hidden=!newer;action.onclick=()=>{
     if(location.origin==="https://davidderetour-ai.github.io"){
       if("serviceWorker" in navigator)navigator.serviceWorker.getRegistration()?.then(r=>r?.update()).finally(()=>location.reload());
       else location.reload();
     }else location.assign(WEB_URL);
   };}
   return {local,reference:release.version,newer,older};
  }catch(e){
   if(label)label.textContent="Impossible de comparer hors connexion · fonctionnement local conservé";
   return {error:String(e?.message||e)};
  }
 }
 function init(){
  if(document.getElementById("alicia-fusion-version-state"))return;
  const host=document.querySelector(".fusion-title")||document.querySelector("header");
  if(!host)return;
  const area=document.createElement("div");area.className="alicia-fusion-sync";
  const state=document.createElement("span");state.id="alicia-fusion-version-state";state.setAttribute("role","status");state.textContent="Vérification de la version…";
  const retry=document.createElement("button");retry.type="button";retry.className="secondary";retry.textContent="Comparer";retry.addEventListener("click",()=>check(true));
  const update=document.createElement("button");update.type="button";update.className="primary";update.id="alicia-fusion-refresh";update.hidden=true;update.textContent="Actualiser Alicia";
  area.append(state,retry,update);
  host.append(area);
  check();
 }
 window.AliciaVersionSync={compare,check,latestUrl:WEB_URL};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();