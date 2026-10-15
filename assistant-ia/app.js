"use strict";
const $ = id => document.getElementById(id);
const log = $("conversation");
let messages = [];
let busy = false;
const NOTE_KEY = "atelier-ia-notes-v1";
function getNotes(){try{return JSON.parse(localStorage.getItem(NOTE_KEY)||"[]").filter(x=>typeof x==="string").slice(0,8)}catch{return []}}
function setNotes(items){localStorage.setItem(NOTE_KEY,JSON.stringify(items.slice(0,8)));renderNotes()}
function renderNotes(){const list=$("notes-list");list.replaceChildren();getNotes().forEach(n=>{const li=document.createElement("li");li.textContent=n;list.append(li)})}
$("access").value=sessionStorage.getItem("atelier-code")||"";
$("access").addEventListener("change",()=>sessionStorage.setItem("atelier-code",$("access").value));
$("clear-access").addEventListener("click",()=>{sessionStorage.removeItem("atelier-code");$("access").value="";$("status").textContent="Code effacé"});
$("save-note").addEventListener("click",()=>{const note=$("note").value.trim().slice(0,240);if(!note)return;setNotes([...getNotes(),note].slice(-8));$("note").value=""});
$("clear-notes").addEventListener("click",()=>{if(confirm("Effacer les préférences enregistrées sur cet appareil ?"))setNotes([])});
function messageEl(role,text,sources=[]){
 const article=document.createElement("article");article.className="message "+role;
 const who=document.createElement("div");who.className="who";who.textContent=role==="user"?"Vous":"Alicia";
 const content=document.createElement("div");content.className="message-text";content.textContent=text;article.append(who,content);
 if(role==="assistant"){
   const urls=Array.isArray(sources)?sources:[];if(urls.length){const wrap=document.createElement("div");wrap.className="sources";urls.slice(0,6).forEach(s=>{try{const u=new URL(s.url);if(u.protocol!=="https:")return;const a=document.createElement("a");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Source : "+(s.title||u.hostname);wrap.append(a)}catch{}});article.append(wrap)}
   const copy=document.createElement("button");copy.className="copy";copy.type="button";copy.textContent="Copier";copy.addEventListener("click",()=>navigator.clipboard.writeText(content.textContent).then(()=>copy.textContent="Copié").catch(()=>copy.textContent="Copie indisponible"));article.append(copy);
 }
 log.append(article);log.scrollTop=log.scrollHeight;return article;
}
function setBusy(state){busy=state;$("send").disabled=state;$("review").disabled=state||!messages.some(m=>m.role==="assistant");$("status").textContent=state?"Réflexion en cours…":"Prêt"}
async function callIA(review=false){
 const code=$("access").value.trim();if(!code)throw new Error("Saisis d'abord ton code d'accès personnel (défini sur Netlify).");
 sessionStorage.setItem("atelier-code",code);
 const response=await fetch("./.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json","X-App-Code":code},body:JSON.stringify({messages,mode:$("mode").value,verify:$("verify").checked,web:$("search").checked,review,notes:getNotes()})});
 let result;try{result=await response.json()}catch{throw new Error("Réponse inattendue du serveur. Vérifie le déploiement Netlify.")}
 if(!response.ok)throw new Error(result.error||"Erreur du serveur ("+response.status+").");
 if(!result.answer)throw new Error("Aucune réponse reçue.");
 return result;
}
$("chat-form").addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;const q=$("question").value.trim();if(!q)return;
 const welcome=log.querySelector(".welcome");if(welcome)welcome.remove();
 messages.push({role:"user",content:q});messageEl("user",q);window.AliciaTools?.suggestForTask(q);$("question").value="";setBusy(true);
 try{const data=await callIA(false);messages.push({role:"assistant",content:data.answer});messageEl("assistant",data.answer,data.sources);window.AliciaAvatar?.onAssistantMessage(data.answer);if(data.verified)$("status").textContent="Réponse revérifiée"}catch(err){messages.pop();messageEl("assistant","⚠️ "+err.message);$("question").value=q}finally{setBusy(false)}
});
$("review").addEventListener("click",async()=>{
 if(busy||!messages.length||messages[messages.length-1].role!=="assistant")return;
 setBusy(true);
 try{const data=await callIA(true);messages[messages.length-1].content=data.answer;const last=[...log.querySelectorAll(".message.assistant")].at(-1);if(last){last.querySelector(".message-text").textContent=data.answer;last.querySelector(".sources")?.remove();if(data.sources?.length){const wrap=document.createElement("div");wrap.className="sources";data.sources.forEach(s=>{try{const u=new URL(s.url);if(u.protocol!=="https:")return;const a=document.createElement("a");a.href=u.href;a.textContent="Source : "+(s.title||u.hostname);a.target="_blank";a.rel="noopener noreferrer";wrap.append(a)}catch{}});last.insertBefore(wrap,last.querySelector(".copy"))}}window.AliciaAvatar?.onAssistantMessage(data.answer);$("status").textContent="Réponse corrigée"}catch(err){$("status").textContent=err.message}finally{setBusy(false)}
});
$("new").addEventListener("click",()=>{if(messages.length&&!confirm("Démarrer une nouvelle conversation ?"))return;messages=[];log.replaceChildren();messageEl("assistant","Bonjour ! Je peux t'aider en programmation, réparation informatique, création et formation.");$("review").disabled=true});
document.querySelectorAll("[data-prompt]").forEach(btn=>btn.addEventListener("click",()=>{$("question").value=btn.dataset.prompt;$("question").focus()}));
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
renderNotes();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));