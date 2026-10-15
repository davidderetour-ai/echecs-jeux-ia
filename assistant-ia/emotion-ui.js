import {createEmotionSoundPlayer} from "./emotion-sounds.mjs";
const player=createEmotionSoundPlayer();
const $=id=>document.getElementById(id);
const visual={laugh:"joyful",cry:"sad",fear:"afraid",anger:"angry"};
const status={laugh:"Alicia rit 😂",cry:"Alicia sanglote 😢",fear:"Alicia simule la peur 😨",anger:"Alicia gronde 😠"};
let active=null,timer=null,previous=null;
function stop(){
 if(timer!==null){clearTimeout(timer);timer=null;}
 player.stop();
 for(const kind of Object.keys(visual))$(kind+"-sound")?.setAttribute("aria-pressed","false");
 if(previous){
  const choice=$("expression-mode");
  if(choice)choice.value=previous.selection;
  window.AliciaAvatar?.setExpression(previous.intent);
  previous=null;
 }
 active=null;
 const indicator=$("avatar-status");
 if(indicator)indicator.textContent="Alicia est prête";
}
function play(kind){
 if(active===kind){stop();return;}
 if(active)stop();
 const choice=$("expression-mode");
 let ms;
 try{ms=player.play(kind)}catch(e){
  const indicator=$("avatar-status");
  if(indicator)indicator.textContent=String(e?.message||"Bruitage indisponible");
  return;
 }
 window.speechSynthesis?.cancel();
 previous={selection:choice?.value||"auto",intent:"neutral"};
 if(choice)choice.value="auto";
 window.AliciaAvatar?.setExpression(visual[kind]);
 const indicator=$("avatar-status");if(indicator)indicator.textContent=status[kind];
 active=kind;
 $(kind+"-sound")?.setAttribute("aria-pressed","true");
 timer=setTimeout(stop,ms+150);
}
for(const kind of Object.keys(visual)){
 const button=$(kind+"-sound");
 button?.setAttribute("aria-pressed","false");
 button?.addEventListener("click",()=>play(kind));
}
$("preview-voice")?.addEventListener("click",()=>{
 if(active)stop();
 window.AliciaAvatar?.speak("Bonjour ! Je suis Alicia. Je peux parler avec une voix française douce et naturelle.");
});
