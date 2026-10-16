/* Alicia V0.4 : commande vocale française + mouvements photographiques automatiques.
   Apparence tirée du visuel de référence, sans prétendre à un modèle 3D articulé. */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id),stage=$("alicia-photo-stage");
 if(!stage)return;
 const speech=window.speechSynthesis;
 const status=text=>{const x=$("avatar-status");if(x)x.textContent=text};
 let talking=false,dialog=null;
 const availableVoices=()=>speech?.getVoices?.().filter(v=>/^fr([-_]|$)/i.test(v.lang))||[];
 function populateVoices(){
   const pick=$("voice-choice");if(!pick)return;
   const current=pick.value||localStorage.getItem("alicia-v04-voice")||"";
   pick.replaceChildren();
   const standard=document.createElement("option");standard.textContent="Voix française automatique";standard.value="";pick.append(standard);
   availableVoices().forEach(v=>{
     const op=document.createElement("option");op.value=v.voiceURI;op.textContent=v.name+" ("+v.lang+")";pick.append(op);
   });
   if([...pick.options].some(o=>o.value===current))pick.value=current;
 }
 populateVoices();speech?.addEventListener?.("voiceschanged",populateVoices);
 $("voice-choice")?.addEventListener("change",e=>localStorage.setItem("alicia-v04-voice",e.target.value));
 const stop=()=>{talking=false;window.Alicia3D?.setSpeaking?.(false);stage.classList.remove("is-speaking");if(dialog)dialog=null;};
 window.addEventListener("pagehide",()=>{speech?.cancel();stop()});
 function speak(text){
   if(!speech||typeof SpeechSynthesisUtterance==="undefined"){status("La synthèse vocale n'est pas disponible sur ce Mac.");return;}
   try{speech.cancel();}catch{}
   const message=String(text||"").replace(/[#*_]/g,"").slice(0,1900).trim();
   if(!message)return;
   const msg=new SpeechSynthesisUtterance(message);dialog=msg;
   msg.lang="fr-FR";msg.rate=.92;msg.pitch=1.05;msg.volume=.9;
   const preferred=availableVoices().find(v=>v.voiceURI===$("voice-choice")?.value);
   const woman=availableVoices().find(v=>/amelie|aurelie|audrey|celine|julie|marie|sophie|alice|lea/i.test(v.name));
   if(preferred||woman)msg.voice=preferred||woman;
   msg.onstart=()=>{talking=true;window.Alicia3D?.setSpeaking?.(true);stage.classList.add("is-speaking");status("Alicia parle…")};
   msg.onend=()=>{stop();status("Alicia prête")};
   msg.onerror=()=>{stop();status("La voix n'a pas pu être lue sur ce Mac")};
   speech.speak(msg);
 }
 let mood="Neutre";
 function expression(code){mood=({"joyful":"Heureuse","supportive":"Bienveillante","thoughtful":"Réfléchie","surprised":"Surprise","sad":"Triste","angry":"Contrariée","neutral":"Neutre"})[code]||"Neutre";
   const x=$("expression-status");if(x)x.textContent="Expression : "+mood;}
 function listen(){
   const Recognizer=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(!Recognizer){status("Dictée vocale non disponible sur le moteur Web de Big Sur.");return;}
   try{
     const r=new Recognizer();r.lang="fr-FR";r.interimResults=false;
     r.onstart=()=>status("Alicia écoute…");
     r.onresult=e=>{
       const heard=e.results?.[0]?.[0]?.transcript||"";
       const q=$("question");if(q){q.value+=(q.value?" ":"")+heard;q.focus();}
       status("Dictée ajoutée à ton message.");
     };
     r.onerror=e=>status("Dictée : "+(e.error||"erreur microphone"));
     r.start();
   }catch{status("La dictée n'a pas pu démarrer.");}
 }
 const player=$("alicia-photo-pause");
 player?.addEventListener("click",()=>{
   const paused=stage.classList.toggle("is-paused");
   player.textContent=paused?"▶ Reprendre les mouvements":"⏸ Pause";
 });
 // Ne jamais forcer d'animation sur un Mac configuré pour réduire les mouvements.
 if(matchMedia("(prefers-reduced-motion: reduce)").matches){
   if(player){player.disabled=true;player.textContent="Animations réduites (macOS)";}
   status("Mouvements réduits conformément aux réglages du Mac.");
 }
 $("avatar-demo")?.addEventListener("click",()=>{
   expression("joyful");
   speak("Bonjour ! Je suis Alicia. Je me retourne automatiquement pour montrer mon dos. Tu peux me poser tes questions.");
 });
 window.AliciaAvatar={
   speak,listen,setExpression:expression,
   onThinking(){expression("thoughtful");status("Alicia prépare sa réponse…")},
   onUserMessage(text){expression(/bonjour|merci|salut/i.test(text)?"joyful":"neutral")},
   onAssistantMessage(text){expression("joyful");if($("auto-voice")?.checked)speak(text);else status("Alicia a répondu.")},
   reset(){stop();expression("neutral")}
 };
 const imageStage=$("alicia-photo-stage");
 const images=[...imageStage.querySelectorAll("img")];
 for(const image of images){
   image.addEventListener("error",()=>{
     status("Portrait manquant. Vérifie que les deux images sont incluses dans l'application.");
   });
 }
 status("Alicia tourne seule. Personnage animé d'après ta photo (2,5D).");
})();
