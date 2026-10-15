import {fileKind,createAdvicePrompt,cleanSharedAdvice} from "./composer-core.mjs";
/* Alicia — menu + inspiré des raccourcis iPhone. Aucune pièce jointe envoyée
 * tant que l'utilisateur ne touche pas « Envoyer » ; conseils ChatGPT collés
 * volontairement, jamais connexion cachée au compte ChatGPT.
 */
const $=id=>document.getElementById(id);
const plus=$("plus"),menu=$("plus-menu"),preview=$("attach-preview");
const inputMap={camera:"attach-camera",photos:"attach-photos",files:"attach-files",video:"attach-video",audio:"attach-audio"};
const LEARN_KEY="alicia-chatgpt-conseils-v1";
let attachment=null;
let activeMediaURL=null;
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
function revokeMediaURL(){
 if(activeMediaURL){URL.revokeObjectURL(activeMediaURL);activeMediaURL=null;}
}
function clearAttachment(){
 attachment=null;revokeMediaURL();
 preview.hidden=true;preview.replaceChildren();
}
function clear(){clearAttachment();toggle(false);}
function current(){return attachment;}
function setAttachment(next){
 revokeMediaURL();
 attachment=next;
 renderAttachment();
}
function label(value){
 const el=document.createElement("span");el.textContent=value;return el;
}
function explanation(text){
 const el=document.createElement("small");el.textContent=text;return el;
}
function addAction(title,handler,variant="secondary"){
 const button=document.createElement("button");
 button.type="button";button.className=variant;button.textContent=title;
 button.addEventListener("click",handler);
 preview.append(button);
 return button;
}
async function transcribeAudio(button){
 const selected=attachment;
 if(selected?.kind!=="audio"||!selected.file)return;
 try{
  window.AliciaWiFi?.requireConfirmed?.();
  if(!window.puter?.ai?.speech2txt)throw Error("Le moteur de transcription Puter n'est pas chargé. Confirme le Wi-Fi dans Alicia.");
  if(!(await window.puter.auth?.isSignedIn?.()))throw Error("Connecte ton compte Puter avant la transcription.");
  button.disabled=true;button.textContent="Transcription en cours…";
  const result=await window.puter.ai.speech2txt(selected.file);
  const text=typeof result==="string"?result:result?.text;
  if(typeof text!=="string"||!text.trim())throw Error("Aucun texte reconnu dans cet enregistrement.");
  if(attachment!==selected)return;
  setAttachment({kind:"text",name:"Transcription de "+selected.name,text:text.slice(0,7500)});
  announce("Transcription terminée. Lis le texte avant de toucher « Envoyer ». Des crédits Puter peuvent avoir été utilisés.");
 }catch(e){
  if(attachment===selected){button.disabled=false;button.textContent="Transcrire avec l'IA";announce(e.message||"La transcription a échoué.");}
 }
}
function captureVideoFrame(video){
 if(attachment?.kind!=="video")return;
 if(!video.videoWidth||!video.videoHeight){announce("Démarre la vidéo et sélectionne l'image souhaitée avant de la capturer.");return;}
 try{
  video.pause();
  const factor=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(video.videoWidth*factor));
  canvas.height=Math.max(1,Math.round(video.videoHeight*factor));
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Capture vidéo indisponible sur cet iPhone.");
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const dataUrl=canvas.toDataURL("image/jpeg",.8);
  if(dataUrl.length>5.6e6)throw Error("Cette image est trop volumineuse. Essaie une autre vidéo.");
  const name="Image de "+attachment.name;
  setAttachment({kind:"image",name,dataUrl});
  announce("Une seule image du film a été préparée. Elle ne sera envoyée à Puter que si tu touches « Envoyer ». Le reste de la vidéo ne sera pas envoyé.");
 }catch(e){announce(e.message||"Impossible d'extraire l'image de la vidéo.");}
}
function renderAttachment(){
 preview.hidden=false;preview.replaceChildren();
 if(!attachment)return;
 const names={image:"📷 Photo : ",audio:"🎵 Audio : ",video:"🎬 Vidéo : ",text:"📄 Texte : "};
 preview.append(label((names[attachment.kind]||"📎 Fichier : ")+attachment.name));
 if(attachment.kind==="image"){
  const image=document.createElement("img");image.src=attachment.dataUrl;
  image.alt="Aperçu de la photo choisie";image.className="attach-thumb";preview.append(image);
  preview.append(explanation("Seule cette image sera transmise au moteur IA Puter après avoir touché « Envoyer »."));
 }else if(attachment.kind==="audio"||attachment.kind==="video"){
  const media=document.createElement(attachment.kind);
  media.controls=true;media.preload="metadata";
  media.src=attachment.objectUrl;
  media.className="attach-player";
  if(attachment.kind==="video")media.playsInline=true;
  preview.append(media);
  preview.append(explanation(attachment.kind==="audio"?
   "Écoute ton audio sur cet iPhone. « Transcrire avec l'IA » enverra l'enregistrement à Puter seulement avec ton accord, et peut utiliser des crédits.":
   "Regarde la vidéo localement. Tu peux capturer une image pour la faire analyser. Le film entier n'est pas transmis à l'IA."));
  if(attachment.kind==="audio")addAction("Transcrire avec l'IA",button=>transcribeAudio(button));
  else addAction("Capturer l'image affichée",()=>captureVideoFrame(media));
 }else{
  preview.append(explanation("Le texte du fichier sera joint à ta prochaine question quand tu toucheras « Envoyer »."));
 }
 addAction("Retirer la pièce jointe",clearAttachment);
}
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
   setAttachment({kind:"image",name:file.name||"photo",dataUrl});
  }else if(type.kind==="audio"||type.kind==="video"){
   clearAttachment();
   activeMediaURL=URL.createObjectURL(file);
   attachment={kind:type.kind,name:file.name||type.kind,file,objectUrl:activeMediaURL};
   renderAttachment();
  }else{
   const text=await file.text();
   setAttachment({kind:"text",name:file.name,text:text.slice(0,90000)});
  }
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
