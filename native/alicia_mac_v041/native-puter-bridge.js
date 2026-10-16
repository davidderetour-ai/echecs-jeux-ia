/* Alicia Mac V0.4.1 : assistant Puter via Swift URLSession (pas via WebKit).
 * Le jeton personnel est saisi dans cette interface, transmis au serveur local
 * 127.0.0.1 puis enregistré dans le Trousseau du Mac. Pas de localStorage/token.
 */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const api="/api/native-puter/";
 let configured=false;
 const link="https://puter.com/dashboard#account";
 function output(text,type="info"){
   const el=$("alicia-native-status");
   if(el){el.textContent=text;el.dataset.type=type;}
   const p=$("puter-state");if(p)p.textContent=text;
   const con=$("connection-status");if(con&&$("connection-mode")?.value==="puter")con.textContent=text;
 }
 function setBusy(b){["alicia-native-save","alicia-native-forget","alicia-native-check"].forEach(id=>{
    if($(id))$(id).disabled=b;
 });}
 function timeout(promise,seconds){
   const c=new AbortController();
   const timer=setTimeout(()=>c.abort(),seconds*1000);
   return {controller:c,cancel:()=>clearTimeout(timer)};
 }
 async function call(path,{method="GET",data,seconds=45}={}){
   const {controller,cancel}=timeout(null,seconds);
   try{
     const response=await fetch(api+path,{
       method,headers:{"Content-Type":"application/json"},
       body: data===undefined?undefined:JSON.stringify(data),
       cache:"no-store",credentials:"omit",mode:"same-origin",signal:controller.signal
     });
     let result;
     try{result=await response.json()}catch{throw Error("Réponse du serveur natif illisible.");}
     if(!response.ok)throw Error(result.error||"Erreur réseau "+response.status);
     return result;
   }catch(e){
     if(e?.name==="AbortError")throw Error("Le moteur natif n'a pas répondu dans le délai prévu.");
     throw e;
   }finally{cancel()}
 }
 async function refresh(){
   try{
     const response=await call("status",{seconds:7});
     configured=Boolean(response.configured);
     output(configured
       ?"Jeton conservé dans le Trousseau : Alicia peut interroger le moteur IA en ligne. Teste une question précise."
       :"L'ancien moteur WebKit est incompatible. Utilise un jeton Puter personnel pour connecter le moteur Mac natif.",
       configured?"connected":"attention");
     const button=$("alicia-native-forget");if(button)button.hidden=!configured;
     const entry=$("alicia-native-token");if(entry)entry.value="";
     return configured;
   }catch(e){configured=false;output("Service natif indisponible : "+e.message,"error");return false;}
 }
 async function saveToken(){
   const el=$("alicia-native-token");
   const token=el?.value.trim()||"";
   if(token.length<20){output("Colle le jeton personnel obtenu sur le site officiel Puter.","error");return;}
   setBusy(true);output("Enregistrement sécurisé du jeton dans le Trousseau…");
   try{
     await call("token",{method:"POST",data:{token},seconds:12});
     if(el)el.value="";
     await refresh();
   }catch(e){output("Enregistrement refusé : "+e.message,"error")}
   finally{setBusy(false);}
 }
 async function forget(){
   if(!confirm("Effacer le jeton Puter du Trousseau de ce Mac ?"))return;
   setBusy(true);
   try{
     await call("token",{method:"DELETE",seconds:12});
     configured=false;await refresh();
   }catch(e){output("Suppression impossible : "+e.message,"error")}
   finally{setBusy(false);}
 }
 function localHello(last){
   const text=String(last||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[!?.,]/g," ").replace(/\s+/g," ").trim();
   if(!["bonjour","bonjour alicia","salut","salut alicia","coucou","coucou alicia","bonsoir","bonsoir alicia","cc"].includes(text))return null;
   return {answer:"Bonjour ! Je suis Alicia, ton assistante sur Mac. Cette réponse est programmée et fonctionne sans modèle IA. Pour discuter librement, connecte ton jeton Puter personnel.",provider:"Accueil local, sans IA",local:true,verified:false,sources:[]};
 }
 async function answer({messages=[]}={}){
   const q=messages.filter(m=>m?.role==="user").slice(-1)[0]?.content||"";
   if(!configured){
     const greetings=localHello(q);
     if(greetings)return greetings;
     throw Error("Le moteur IA natif n'est pas connecté. Ouvre « Connexion IA (Mac) » et enregistre un jeton Puter personnel.");
   }
   if(navigator.onLine===false)throw Error("Le Mac est hors ligne. Le moteur Puter REST nécessite Internet.");
   output("Envoi HTTPS de ta question à Puter…");
   try{
     const r=await call("chat",{method:"POST",data:{messages},seconds:55});
     if(!r.answer)throw Error("Le modèle a renvoyé une réponse vide.");
     output("Alicia a répondu via Puter, sans WebKit.","connected");
     return r;
   }catch(e){output("Échec de la réponse : "+e.message,"error");throw e;}
 }
 function init(){
   const panel=$("puter-panel");if(!panel)return;
   const old=$("puter-connect"),retry=$("puter-retry");if(old)old.hidden=true;if(retry)retry.hidden=true;
   const oldConnection=$("alicia-mac-connection");if(oldConnection)oldConnection.hidden=true;
   const div=document.createElement("section");div.className="alicia-native-puter";
   div.innerHTML=
   '<h3>Connexion IA native — Mac Big Sur</h3>'+
   '<p>Le moteur Puter.js ne fonctionne pas dans WebKit de Big Sur. La nouvelle version utilise la connexion HTTPS native de macOS et le jeton personnel de ton compte Puter.</p>'+
   '<p><a id="alicia-native-dashboard" href="'+link+'" target="_blank" rel="noopener noreferrer">1. Ouvrir le tableau de bord Puter et créer un jeton personnel</a></p>'+
   '<label for="alicia-native-token">2. Coller ton jeton Puter (il restera uniquement dans le Trousseau du Mac)</label>'+
   '<input id="alicia-native-token" type="password" autocomplete="off" spellcheck="false" placeholder="Jeton personnel (ne jamais le publier sur GitHub ni dans le chat)">'+
   '<div class="alicia-native-buttons">'+
    '<button type="button" id="alicia-native-save" class="primary">Enregistrer le jeton</button>'+
    '<button type="button" id="alicia-native-check" class="secondary">Tester la connexion</button>'+
    '<button type="button" id="alicia-native-forget" class="secondary" hidden>Effacer mon jeton</button>'+
   '</div>'+
   '<p role="status" id="alicia-native-status">Vérification du Trousseau…</p>'+
   '<small>Les questions sont envoyées à Puter uniquement lorsque tu cliques sur Envoyer. Les quotas et éventuels frais relèvent de Puter : Alicia ne souscrit aucun abonnement, n’achète pas de crédits et n’effectue aucun paiement.</small>';
   panel.prepend(div);
   $("alicia-native-save")?.addEventListener("click",()=>void saveToken());
   $("alicia-native-check")?.addEventListener("click",()=>void refresh());
   $("alicia-native-forget")?.addEventListener("click",()=>void forget());
   const select=$("connection-mode");
   if(select){select.value="puter";select.dispatchEvent(new Event("change"));}
   // Le module historique est chargé avant celui-ci dans le conteneur Mac.
   window.AliciaPuter={answer,ready:()=>configured,refresh,connect:()=>{},nativeMac:true};
   window.AliciaPuterRetry=refresh;
   void refresh();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
})();
