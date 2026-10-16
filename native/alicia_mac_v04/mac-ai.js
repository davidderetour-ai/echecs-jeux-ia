/* Alicia V0.4: connexion Puter, état explicite et accueil local sans fausse IA.
 * Ne stocke ni identifiant, ni mot de passe, ni jeton de connexion.
 * La connexion et l'utilisation des crédits Puter demandent le compte du titulaire.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const display=(text,tone)=>{
 const el=$("alicia-mac-connection");
 if(!el)return;
 el.textContent=text;el.dataset.state=tone;
};
function ready(){return typeof window.puter?.ai?.chat==="function"&&typeof window.puter?.auth?.signIn==="function";}
let lastProbe=0;
async function probe(){
 const now=Date.now();
 if(now-lastProbe<1300)return ready();
 lastProbe=now;
 if(!navigator.onLine){display("Hors ligne · réponses de bienvenue locales disponibles","offline");return false;}
 if(ready()){
   try{
     const signed=Boolean(await window.puter.auth.isSignedIn());
     display(signed?"IA Puter chargée et connectée":"IA Puter chargée · connecte ton compte pour discuter",signed?"ok":"pending");
   }catch(e){display("Puter chargé, mais état du compte inaccessible : "+String(e?.message||e).slice(0,140),"error");}
   return true;
 }
 display("Puter ne répond pas dans WebKit. Diagnostic en cours…","pending");
 try{
   const response=await fetch("./api/puter/status",{cache:"no-store"});
   const data=await response.json();
   display(String(data.message||"Puter indisponible")+" Clique sur « Réessayer Puter ».","error");
 }catch(e){display("Puter non chargé et diagnostic local indisponible : "+String(e?.message||e).slice(0,140),"error");}
 return false;
}
let loading=false;
function retryFromCDN(){
 if(loading)return;
 if(!navigator.onLine){display("Hors ligne · Puter requiert Internet.","offline");return;}
 if(ready()){void probe();return;}
 loading=true;
 display("Tentative de chargement direct depuis le site officiel de Puter…","pending");
 const script=document.createElement("script");
 script.src="https://js.puter.com/v2/";
 script.async=true;
 let done=false;
 const end=async(ok,msg)=>{
   if(done)return;
   done=true;loading=false;clearTimeout(timer);
   if(!ok)display(msg,"error");
   else{display("Puter chargé · connecte ton compte pour discuter.","pending");await probe();}
 };
 script.onload=()=>void end(ready(),"La bibliothèque Puter a été reçue mais ne s'initialise pas dans WebKit (macOS Big Sur).");
 script.onerror=()=>void end(false,"Le chargement Puter a échoué : réseau, certificat ou compatibilité WebKit.");
 const timer=setTimeout(()=>void end(false,"Puter ne répond pas après 20 secondes. Vérifie les réglages réseau."),20000);
 document.head.appendChild(script);
}
function offlineGreeting(question){
 const q=String(question||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[!?.,]/g," ").replace(/\s+/g," ").trim();
 const greetings=["bonjour","bonjour alicia","salut","salut alicia","coucou","coucou alicia","bonsoir","bonsoir alicia","hello","hello alicia","cc","merci","merci alicia"];
 if(!greetings.includes(q))return null;
 const text=q.includes("merci")?"Avec plaisir !":"Bonjour ! Je suis Alicia, ton assistante sur Mac.";
 return {
    answer:text+" Cette réponse d'accueil fonctionne sans Internet. Pour discuter de sujets plus complexes, connecte ton compte Puter avec le bouton prévu dans Alicia.",
    local:true,provider:"Accueil local",verified:false
 };
}
window.AliciaMacAI={
 probe,
 retryFromCDN,
 offlineGreeting,
 ready
};
document.addEventListener("DOMContentLoaded",()=>{
 const header=$("puter-panel");
 const box=document.createElement("div");
 box.id="alicia-mac-connection";box.className="alicia-mac-connection";box.role="status";
 box.textContent="Connexion de l'IA en cours de vérification…";
 if(header)header.appendChild(box);
 const btn=$("puter-retry");
 if(btn){
   btn.textContent="↻ Réessayer Puter";
   btn.addEventListener("click",retryFromCDN);
 }
 const diag=document.createElement("button");
 diag.type="button";diag.textContent="🔎 Tester la connexion IA";diag.className="secondary";
 diag.addEventListener("click",()=>void probe());
 if(header)header.appendChild(diag);
 const originalConnect=$("puter-connect");
 originalConnect?.addEventListener("click",(e)=>{
   if(ready())return;
   e.preventDefault();e.stopImmediatePropagation();
   display("Puter absent : clique d'abord sur « Réessayer Puter ».","error");
 },true);
 if(!window.AliciaMacSdkPending){
  window.AliciaMacSdkPending=true;
  setTimeout(()=>void probe(),1800);
 }
 window.addEventListener("online",()=>void probe());
 window.addEventListener("offline",()=>void probe());
});
})();