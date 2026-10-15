"use strict";
const $ = id => document.getElementById(id);
const log = $("conversation");
let messages = [];
let busy = false;
const NOTE_KEY = "atelier-ia-notes-v1";
function attach(){return window.AliciaComposer?.current?.()||null;}
function getSharedAdvice(){return window.AliciaComposer?.learnings?.()||[];}
function getNotes(){try{return JSON.parse(localStorage.getItem(NOTE_KEY)||"[]").filter(x=>typeof x==="string").slice(0,8)}catch{return []}}
function setNotes(items){localStorage.setItem(NOTE_KEY,JSON.stringify(items.slice(0,8)));renderNotes()}
function renderNotes(){const list=$("notes-list");list.replaceChildren();getNotes().forEach(n=>{const li=document.createElement("li");li.textContent=n;list.append(li)})}
$("access").value=sessionStorage.getItem("atelier-code")||"";
$("access").addEventListener("change",()=>sessionStorage.setItem("atelier-code",$("access").value));
$("clear-access").addEventListener("click",()=>{sessionStorage.removeItem("atelier-code");$("access").value="";$("status").textContent="Code effacé"});
$("save-note").addEventListener("click",()=>{const note=$("note").value.trim().slice(0,240);if(!note)return;setNotes([...getNotes(),note].slice(-8));$("note").value=""});
$("clear-notes").addEventListener("click",()=>{if(confirm("Effacer les préférences enregistrées sur cet appareil ?"))setNotes([])});
// Markdown limité (gras et italique) avec nœuds texte : aucun HTML injecté par l'IA.
function formatMessageText(container, text){
 container.replaceChildren();
 const value=String(text??"");
 const pattern=/\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
 let pos=0;
 for(const match of value.matchAll(pattern)){
  const start=match.index??0;
  if(start>pos)container.append(document.createTextNode(value.slice(pos,start)));
  const element=document.createElement(match[1]!==undefined?"strong":"em");
  element.textContent=match[1]??match[2];
  container.append(element);
  pos=start+match[0].length;
 }
 if(pos<value.length||!value.length)container.append(document.createTextNode(value.slice(pos)));
}
function messageEl(role,text,sources=[]){
 const article=document.createElement("article");article.className="message "+role;
 const who=document.createElement("div");who.className="who";who.textContent=role==="user"?"Vous":"Alicia";
 const content=document.createElement("div");content.className="message-text";if(role==="assistant")formatMessageText(content,text);else content.textContent=text;article.append(who,content);
 if(role==="assistant"){
   const urls=Array.isArray(sources)?sources:[];if(urls.length){const wrap=document.createElement("div");wrap.className="sources";urls.slice(0,6).forEach(s=>{try{const u=new URL(s.url);if(u.protocol!=="https:")return;const a=document.createElement("a");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Source : "+(s.title||u.hostname);wrap.append(a)}catch{}});article.append(wrap)}
   const copy=document.createElement("button");copy.className="copy";copy.type="button";copy.textContent="Copier";copy.addEventListener("click",()=>navigator.clipboard.writeText(content.textContent).then(()=>copy.textContent="Copié").catch(()=>copy.textContent="Copie indisponible"));article.append(copy);
 }
 log.append(article);log.scrollTop=log.scrollHeight;return article;
}
function setBusy(state){busy=state;$("send").disabled=state;$("new").disabled=state;$("review").disabled=state||!messages.some(m=>m.role==="assistant");$("status").textContent=state?"Réflexion en cours…":"Prêt";if(state)window.AliciaAvatar?.onThinking()}
const CONNECTION_KEY="alicia-connection-v1";
const connection=$("connection-mode");
const savedMode=localStorage.getItem(CONNECTION_KEY);
const isApplePhone=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
connection.value=["local","online","puter"].includes(savedMode)?savedMode:(isApplePhone?"puter":"local");
function showConnection(){
 const mode=connection.value;
 const puter=mode==="puter";
 $("puter-panel").hidden=!puter;
 $("connection-status").textContent=puter
  ?"Sur iPhone : connecte ton compte Puter (allocation mensuelle gratuite limitée). Alicia ne procède à aucun achat."
  :mode==="local"
   ?"Mode local : nécessite un serveur Alicia et un modèle téléchargé sur un ordinateur compatible. Ce mode n'est pas encore installé sur ton iPhone."
   :"Mode API distincte facultative ; des frais peuvent être facturés par le fournisseur.";
 $("search").disabled=mode!=="online"&&mode!=="puter";
 if(mode==="local")$("search").checked=false;
 const controls=$("access").closest(".controls");
 if(controls)controls.hidden=puter;
 if(puter)window.AliciaPuter?.refresh();
}
connection.addEventListener("change",()=>{
 if(connection.value==="online"&&!confirm("Le service IA en ligne peut entraîner des frais API. Souhaites-tu sélectionner ce mode (aucun abonnement n'est souscrit ici) ?"))connection.value="local";
 localStorage.setItem(CONNECTION_KEY,connection.value);
 showConnection();
});
showConnection();
async function callIA(review=false){
 const choice=connection.value;
 if(choice!=="local"){
  if(isApplePhone&&!window.AliciaWiFi)throw new Error("La protection Wi-Fi n'est pas chargée. Actualise Alicia pour éviter d'utiliser les données mobiles.");
  window.AliciaWiFi?.requireConfirmed();
 }
 if(choice!=="puter"&&attach()?.kind==="image"){
  throw Error("Pour analyser cette image, sélectionne le mode iPhone — IA en ligne (Puter). Aucune image n’a été envoyée.");
 }
 if(choice==="puter"){
  if(!window.AliciaPuter)throw new Error("Module IA iPhone indisponible. Actualise Alicia dans Safari.");
  return window.AliciaPuter.answer({
   messages,mode:$("mode").value,verify:$("verify").checked,review,
   notes:[...getNotes(),...getSharedAdvice()].slice(-8),attachment:review?null:attach(),web:!review&&$("search").checked
  });
 }
 const code=$("access").value.trim();
 const isLocal=choice==="local";
 if(!isLocal&&!code)throw new Error("Mode API en ligne : code personnel Netlify requis.");
 sessionStorage.setItem("atelier-code",code);
 const headers={"Content-Type":"application/json"};
 if(code)headers["X-App-Code"]=code;
 const url=isLocal?"./api/local/chat":"./.netlify/functions/chat";
 const response=await fetch(url,{
  method:"POST",headers,
  body:JSON.stringify({messages,mode:$("mode").value,verify:$("verify").checked,web:!isLocal&&$("search").checked,review,notes:[...getNotes(),...getSharedAdvice()].slice(-8)})
 });
 let result;
 try{result=await response.json();}
 catch{throw new Error(isLocal?"Moteur IA local absent sur cet appareil.":"Réponse API inattendue du serveur.");}
 if(!response.ok)throw new Error(result.error||"Erreur du serveur ("+response.status+").");
 if(!result.answer)throw new Error("Le moteur n'a renvoyé aucune réponse.");
 return result;
}
$("chat-form").addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;const q=$("question").value.trim();if(!q)return;
 const attachment=attach();
 if(attachment?.kind==="audio"||attachment?.kind==="video"){
  $("status").textContent=attachment.kind==="audio"?
   "Transcris d'abord l'audio avec le bouton sous son aperçu, ou retire-le.":
   "Capture d'abord une image de la vidéo avec le bouton sous son aperçu, ou retire-la.";
  $("attach-preview").scrollIntoView({behavior:"smooth",block:"nearest"});
  return;
 }
 const contents=attachment?.kind==="text"?
  q+"\n\n[Fichier local : "+attachment.name+" — extrait jusqu’à 7 500 caractères]\n"+attachment.text.slice(0,7500):q;
 const notice=$("conversation-notice");if(notice)notice.hidden=true;
 const newLabel=$("new");if(newLabel)newLabel.textContent="Nouveau";
 const welcome=log.querySelector(".welcome");if(welcome)welcome.remove();
 messages.push({role:"user",content:contents});messageEl("user",q+(attachment?"\n📎 "+attachment.name:""));window.AliciaAvatar?.onUserMessage(q,$("mode").value);window.AliciaTools?.suggestForTask(q);$("question").value="";setBusy(true);
 try{const data=await callIA(false);messages.push({role:"assistant",content:data.answer});messageEl("assistant",data.answer,data.sources);window.AliciaComposer?.clear();window.AliciaAvatar?.onAssistantMessage(data.answer,$("mode").value);if(data.verified)$("status").textContent="Réponse revérifiée"}catch(err){messages.pop();messageEl("assistant","⚠️ "+err.message);window.AliciaAvatar?.setExpression("supportive");$("question").value=q}finally{setBusy(false)}
});
$("review").addEventListener("click",async()=>{
 if(busy||!messages.length||messages[messages.length-1].role!=="assistant")return;
 setBusy(true);
 try{const data=await callIA(true);messages[messages.length-1].content=data.answer;const last=[...log.querySelectorAll(".message.assistant")].at(-1);if(last){formatMessageText(last.querySelector(".message-text"),data.answer);last.querySelector(".sources")?.remove();if(data.sources?.length){const wrap=document.createElement("div");wrap.className="sources";data.sources.forEach(s=>{try{const u=new URL(s.url);if(u.protocol!=="https:")return;const a=document.createElement("a");a.href=u.href;a.textContent="Source : "+(s.title||u.hostname);a.target="_blank";a.rel="noopener noreferrer";wrap.append(a)}catch{}});last.insertBefore(wrap,last.querySelector(".copy"))}}window.AliciaAvatar?.onAssistantMessage(data.answer,$("mode").value);$("status").textContent="Réponse corrigée"}catch(err){$("status").textContent=err.message}finally{setBusy(false)}
});
$("new").addEventListener("click",()=>{
 if(busy){$("new").textContent="Patiente…";return;}
 if(messages.length&&!confirm("Commencer une nouvelle conversation et effacer la discussion affichée ?"))return;
 messages=[];
 log.replaceChildren();
 $("question").value="";
 window.AliciaComposer?.clear();
 const message=$("conversation-notice");
 if(message){message.textContent="✓ Nouvelle conversation prête. Écris ta question ci-dessous.";message.hidden=false;log.prepend(message);}
 messageEl("assistant","Bonjour ! Nouvelle conversation prête. Quelle question souhaites-tu me poser ?");
 $("review").disabled=true;
 $("status").textContent="Nouvelle conversation prête";
 $("new").textContent="✓ Nouvelle";
 window.AliciaAvatar?.reset();
 $("chat-form").scrollIntoView({behavior:"smooth",block:"nearest"});
 $("question").focus({preventScroll:true});
});
document.querySelectorAll("[data-prompt]").forEach(btn=>btn.addEventListener("click",()=>{if(btn.dataset.mode)$("mode").value=btn.dataset.mode;$("question").value=btn.dataset.prompt;$("question").focus()}));
$("question").addEventListener("keydown",ev=>{if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();$("chat-form").requestSubmit()}});
$("speak").addEventListener("click",()=>{
 const text=[...messages].reverse().find(m=>m.role==="assistant")?.content;
 if(!text)return;
 if(window.AliciaAvatar){window.AliciaAvatar.speak(text);return;}
 window.speechSynthesis?.cancel();
 if(typeof SpeechSynthesisUtterance==="undefined")return;
 const u=new SpeechSynthesisUtterance(text.slice(0,2800));u.lang="fr-FR";u.rate=.9;u.pitch=1.12;window.speechSynthesis?.speak(u);
});
$("voice").addEventListener("click",()=>{
 if(window.AliciaAvatar){window.AliciaAvatar.listen();return;}
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){$("status").textContent="Dictée indisponible sur ce navigateur";return;}
 const r=new API();r.lang="fr-FR";
 r.onresult=e=>{$("question").value+=($("question").value?" ":"")+e.results[0][0].transcript};
 r.onerror=()=>{$("status").textContent="Dictée indisponible"};
 r.start();
});
$("update-app")?.addEventListener("click",async()=>{
 const btn=$("update-app");btn.disabled=true;btn.textContent="…";
 try{const registration=await navigator.serviceWorker?.getRegistration?.();await registration?.update?.();}
 catch{}
 window.location.reload();
});
renderNotes();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));