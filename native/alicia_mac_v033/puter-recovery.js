/* Alicia Mac V0.3.3: reprise explicite du chargement Puter, sans achat ni API cachée.
   Cette passerelle ne contourne pas les quotas ou la compatibilité WebKit. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 let pending=null,lastAttempt=0;
 const loaded=()=>Boolean(window.puter?.ai?.chat && window.puter?.auth?.signIn);
 const setStatus=s=>{
   const el=$("puter-state");
   if(el)el.textContent=s;
   const connection=$("connection-status");
   if(connection&&$("connection-mode")?.value==="puter")connection.textContent=s;
 };
 async function retry(){
   if(loaded()){setStatus("Puter est chargé. Utilise « Connecter mon compte IA » pour te connecter.");await window.AliciaPuter?.refresh?.();return true;}
   if(!navigator.onLine){setStatus("Pas d'accès réseau détecté. Mets le Mac en Wi-Fi puis réessaie.");return false;}
   if(pending)return pending;
   if(Date.now()-lastAttempt<1800){setStatus("Patiente une seconde avant de réessayer.");return false;}
   lastAttempt=Date.now();
   setStatus("Connexion à Puter… Vérification du chargement en HTTPS.");
   const button=$("puter-retry");
   if(button)button.disabled=true;
   pending=new Promise(resolve=>{
     const script=document.createElement("script");
     script.async=true;script.src="https://js.puter.com/v2/";
     const done=(ok,message)=>{
       if(button)button.disabled=false;
       pending=null;
       setStatus(message);
       if(ok)window.AliciaPuter?.refresh?.();
       resolve(ok);
     };
     script.onload=()=>{
       if(loaded())done(true,"Puter est chargé. Clique sur « Connecter mon compte IA » si nécessaire.");
       else done(false,"Le téléchargement Puter a abouti, mais cette version WebKit ne peut pas initialiser son moteur. Essaie Alicia Safari.");
     };
     script.onerror=()=>done(false,"Puter n'a pas pu être téléchargé en HTTPS. Vérifie ton Wi-Fi et le domaine js.puter.com, puis réessaie.");
     document.head.append(script);
   });
   return pending;
 }
 // Ne demander l'authentification qu'au cours d'un vrai clic de l'utilisateur.
 // Si le moteur n'existe pas encore, un clic ne doit pas ouvrir une connexion fantôme.
 $("puter-retry")?.addEventListener("click",()=>{void retry();});
 $("puter-connect")?.addEventListener("click",e=>{
   if(loaded())return;
   e.preventDefault();e.stopImmediatePropagation();
   void retry();
 },true);
 window.AliciaPuterRetry=retry;
 window.addEventListener("load",()=>{
   if($("connection-mode")?.value==="puter"&&!loaded()){
     setStatus("Puter n'est pas chargé. Clique sur « Réessayer Puter » pour vérifier la connexion.");
   }
 });
})();
