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
// Mode unique 100% gratuit pour iPhone et Mac. Pas de Puter ni de jeton API.
connection.value="original";
function showConnection(){
 connection.value="original";
 const panel=$("puter-panel");if(panel)panel.hidden=true;
 const info=$("connection-status");
 if(info)info.textContent="🧠 Moteur original Alicia · entièrement gratuit · fonctionne hors ligne · apprentissage automatique de ses connaissances";
 const search=$("search");if(search){search.checked=false;search.disabled=true;}
 const cost=$("verify");if(cost){cost.checked=false;cost.disabled=true;cost.title="Auto-vérification externe désactivée en mode entièrement gratuit";}
 const box=$("access")?.closest(".controls");if(box)box.hidden=true;
}
connection.addEventListener("change",showConnection);
showConnection();
async function callIA(review=false){
 const engine=window.AliciaOriginalEngine;
 if(!engine)throw Error("Le moteur Alicia Original n'a pas pu charger son programme. Relance l'application.");
 if(review){
   const last=[...messages].reverse().find(x=>x.role==="assistant")?.content;
   if(!last)throw Error("Aucune réponse précédente à relire.");
   return {answer:"Je peux relire ma réponse, mais mon petit moteur original n'a pas encore de vérification avancée. Je conserve donc cette réponse sans la déclarer vérifiée :\n\n"+last,
     provider:"Alicia Original",local:true,verified:false,sources:[]};
 }
 // Attendre la restauration native avant de répondre : sinon les réponses apprises semblent perdues.
 if(window.AliciaNativeMac && window.AliciaNativeMemory)await window.AliciaNativeMemory.ready;
 // Knowledge lessons and safe local tool router are optional plug-ins.
 const query=messages.filter(m=>m.role==="user").slice(-1)[0]?.content||"";
 let plugin=null;
 try{plugin=window.AliciaLocalTools?.answer?.(query)||null;}
 catch(err){console.warn("Outil optionnel indisponible",err);}
 const response=plugin||engine.answer({messages,mode:$("mode").value,notes:getNotes()});
 if(!response||typeof response.answer!=="string"||!response.answer.trim())throw new Error("Le moteur n’a retourné aucune réponse.");
 if(window.AliciaNativeMac && window.AliciaNativeMemory){
   const saved=await window.AliciaNativeMemory.flush();
   if(!saved && response.trained){
     response.answer+=" ⚠️ La sauvegarde sur disque n'a pas été confirmée. Exporte la mémoire avant de fermer Alicia.";
   }
 }
 document.dispatchEvent(new Event("alicia-original-answered"));
 return response;
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
 messages.push({role:"user",content:contents});
 messageEl("user",q+(attachment?"\n📎 "+attachment.name:""));
 $("question").value="";setBusy(true);
 // Les effets visuels et modules optionnels ne doivent pas bloquer le chat.
 try{window.AliciaAvatar?.onUserMessage(q,$("mode").value);}catch(err){console.warn("Avatar",err);}
 try{window.AliciaTools?.suggestForTask(q);}catch(err){console.warn("Outils",err);}
 try{
   const data=await callIA(false);
   messages.push({role:"assistant",content:data.answer});
   messageEl("assistant",data.answer,data.sources);
   $("status").textContent="Alicia a répondu";
   try{window.AliciaComposer?.clear();}catch(err){console.warn("Pièce jointe",err);}
   try{window.AliciaAvatar?.onAssistantMessage(data.answer,$("mode").value);}catch(err){console.warn("Avatar vocal",err);}
   if(data.verified)$("status").textContent="Réponse revérifiée";
 }catch(err){
   messages.pop();
   messageEl("assistant","⚠️ Je n’ai pas pu répondre : "+String(err?.message||err));
   $("status").textContent="Erreur de réponse — ton message reste disponible";
   try{window.AliciaAvatar?.setExpression("supportive");}catch{}
   $("question").value=q;
 }finally{setBusy(false)}
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