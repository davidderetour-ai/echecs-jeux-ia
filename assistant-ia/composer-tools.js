import {fileKind,createAdvicePrompt,cleanSharedAdvice} from "./composer-core.mjs";
/* Alicia — menu + inspiré des raccourcis iPhone. Aucune pièce jointe envoyée
 * tant que l'utilisateur ne touche pas « Envoyer » ; conseils ChatGPT collés
 * volontairement, jamais connexion cachée au compte ChatGPT.
 */
const $=id=>document.getElementById(id);
const plus=$("plus"),menu=$("plus-menu"),preview=$("attach-preview");
const inputMap={camera:"attach-camera",photos:"attach-photos",files:"attach-files"};
const LEARN_KEY="alicia-chatgpt-conseils-v1";
let attachment=null;
function announce(message){
 preview.hidden=false;
 if(!attachment)preview.replaceChildren();
 const p=document.createElement("p");p.textContent=message;preview.append(p);
}
function learnings(){
 try{
  const r=JSON.parse(localStorage.getItem(LEARN_KEY)||"[]");
  return Array.isArray(r)?r.filter(x=>typeof x==="string").slice(-5):[];
 }catch{return [];}
}
function toggle(force){
 const show=force??menu.hidden;
 menu.hidden=!show;plus.setAttribute("aria-expanded",String(show));
}
function clearAttachment(){attachment=null;preview.hidden=true;preview.replaceChildren();}
function clear(){clearAttachment();toggle(false);}
function current(){return attachment;}
async function readFile(file){
 const type=fileKind(file);
 if(type.kind==="error"){clearAttachment();announce(type.reason);return;}
 try{
  if(type.kind==="image"){
   const dataUrl=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(Error("Lecture de la photo impossible."));
    reader.onload=()=>resolve(reader.result);
    reader.readAsDataURL(file);
   });
   if(typeof dataUrl!=="string"||!/^data:image\/(jpeg|png|webp|gif);base64,/i.test(dataUrl))
    throw Error("Format de photo non compatible avec l'analyse IA.");
   attachment={kind:"image",name:file.name||"photo",dataUrl};
  }else{
   const text=await file.text();
   attachment={kind:"text",name:file.name,text:text.slice(0,90000)};
  }
  preview.hidden=false;preview.replaceChildren();
  const name=document.createElement("span");
  name.textContent=(attachment.kind==="image"?"📷 Photo : ":"📄 Texte : ")+attachment.name;
  preview.append(name);
  if(attachment.kind==="image"){
   const image=document.createElement("img");image.src=attachment.dataUrl;
   image.alt="Aperçu de la photo choisie";image.className="attach-thumb";preview.append(image);
  }
  const info=document.createElement("small");
  info.textContent=attachment.kind==="image"?
    "Cette image sera transmise à Puter uniquement lorsque tu appuieras sur Envoyer en mode IA iPhone.":
    "Le texte de ce fichier sera joint à ta prochaine question lorsque tu appuieras sur Envoyer.";
  preview.append(info);
  const discard=document.createElement("button");discard.type="button";discard.className="secondary";
  discard.textContent="Retirer la pièce jointe";discard.addEventListener("click",clearAttachment);
  preview.append(discard);
 }catch(err){clearAttachment();announce(err.message||"Impossible de lire le fichier.");}
}
for(const key of Object.keys(inputMap)){
 const el=$(inputMap[key]);
 el?.addEventListener("change",()=>{
  const file=el.files?.[0];el.value="";if(file)readFile(file);
 });
}
async function askChatGPT(){
 const prompt=createAdvicePrompt($("question")?.value||"");
 toggle(false);
 const intro="Question prête pour ChatGPT. Aucun fichier n’est joint à cette question ; seuls les mots affichés ci-dessous seront copiés.";
 announce(intro);
 const textArea=document.createElement("textarea");textArea.value=prompt;textArea.readOnly=true;textArea.rows=5;
 textArea.setAttribute("aria-label","Question à coller dans ChatGPT");
 preview.append(textArea);
 const copy=document.createElement("button");copy.type="button";copy.textContent="Copier la question";copy.className="primary";
 copy.addEventListener("click",async()=>{
  try{
   await navigator.clipboard.writeText(prompt);
   const status=document.createElement("p");
   status.textContent="Question copiée. Ouvre ChatGPT, colle-la, puis importe volontairement sa réponse dans Alicia.";
   preview.append(status);
  }catch{ textArea.focus();textArea.select(); }
 });
 const link=document.createElement("a");link.href="https://chatgpt.com/";
 link.target="_blank";link.rel="noopener noreferrer";link.textContent="Ouvrir ChatGPT ↗";
 preview.append(copy,link);
 try{
  await navigator.clipboard.writeText(prompt);
  const p=document.createElement("p");
  p.textContent="La question a été copiée. Colle-la dans ChatGPT. Ensuite, colle sa réponse dans Alicia avec « + → Apprendre de ChatGPT ».";
  preview.append(p);
 }catch{
  const p=document.createElement("p");
  p.textContent="Si la copie automatique ne marche pas, utilise « Copier la question ».";
  preview.append(p);
 }
}
function updateDeepLabel(){
 const enabled=$("verify")?.checked;
 const node=$("plus-deep-check");
 if(node)node.textContent=enabled?"Activée (2 appels IA)":"Désactivée";
}
$("verify")?.addEventListener("change",updateDeepLabel);
updateDeepLabel();
plus?.addEventListener("click",()=>toggle());
document.addEventListener("pointerdown",event=>{
 if(menu.hidden)return;
 if(!event.target.closest?.(".plus-container"))toggle(false);
});
menu?.addEventListener("click",async event=>{
 const btn=event.target.closest("button[data-plus-action]");
 if(!btn)return;
 const name=btn.dataset.plusAction;
 toggle(false);
 if(name in inputMap){$(inputMap[name])?.click();return;}
 if(name==="plugins"){
  const panel=$("tool-finder");if(panel){panel.open=true;panel.scrollIntoView({behavior:"smooth",block:"start"});}
  announce("Outils disponibles : Alicia recommande des projets GitHub, mais ne les installe pas automatiquement.");
  return;
 }
 if(name==="deep"){
  const check=$("verify");
  if(check){check.checked=!check.checked;updateDeepLabel();}
  announce(check?.checked?
   "Double vérification activée : Alicia fera jusqu'à deux appels IA par réponse, ce qui consomme davantage de quota Puter.":
   "Double vérification désactivée : Alicia fera un seul appel IA par réponse.");
  return;
 }
 if(name==="chatgpt"){
  const panel=$("chatgpt-learning");panel.hidden=false;panel.open=true;
  panel.scrollIntoView({behavior:"smooth",block:"nearest"});
  $("chatgpt-learning-text")?.focus();
  return;
 }
 if(name==="ask-chatgpt"){await askChatGPT();}
});
$("chatgpt-learning-save")?.addEventListener("click",()=>{
 const status=$("chatgpt-learning-status");
 if(!$("chatgpt-learning-consent")?.checked){
  status.textContent="Coche ton accord après avoir relu la réponse de ChatGPT.";return;
 }
 try{
  const advice=cleanSharedAdvice($("chatgpt-learning-text").value);
  const all=[...learnings(),advice].slice(-5);
  localStorage.setItem(LEARN_KEY,JSON.stringify(all));
  status.textContent="Conseil enregistré sur ton iPhone. Alicia pourra le prendre en compte dans tes prochaines questions. Le modèle IA n'est pas réentraîné.";
  $("chatgpt-learning-text").value="";
  $("chatgpt-learning-consent").checked=false;
 }catch(err){status.textContent=err.message;}
});
$("chatgpt-learning-clear")?.addEventListener("click",()=>{
 if(!confirm("Effacer les conseils importés de ChatGPT sur cet iPhone ?"))return;
 localStorage.removeItem(LEARN_KEY);
 $("chatgpt-learning-status").textContent="Conseils importés effacés de cet appareil.";
});
$("chatgpt-learning-close")?.addEventListener("click",()=>{
 const panel=$("chatgpt-learning");panel.open=false;panel.hidden=true;
});
window.AliciaComposer={current,clear,learnings,createAdvicePrompt};
