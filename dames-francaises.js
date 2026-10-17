/* Dames françaises gratuites — interface tactile iPhone / Mac.
 * Alicia utilise le moteur local ; aucun compte, réseau ni paiement requis après chargement.
 */
import {SIZE,newFrenchDraughts,legalFrenchMoves,applyFrenchMove,undoFrench,chooseFrenchAlicia,frenchAdvice,square} from "./dames-francaises-engine.mjs";
import {botSettings} from "./game-bots.mjs";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const duelActive=params.get("mode")==="duel";
const STORE=duelActive?"alicia-dames-francaises-duel-v1":"alicia-dames-francaises-v1",PROGRESS="alicia-dames-francaises-exercices-v1";
const roles=["opponent","partner","training"];
let role=roles.includes(params.get("role"))?params.get("role"):"opponent";
const initialState=()=>({game:newFrenchDraughts(),level:3,role:"opponent",score:0,study:0});
let loaded=initialState();
try{const v=JSON.parse(localStorage.getItem(STORE)||"null");if(v?.game?.kind==="french-draughts"&&v.game.board?.length===10){loaded={...loaded,...v};}}catch{}
const savedRole=roles.includes(loaded.role)?loaded.role:"opponent";
if(!params.has("role"))role=duelActive?"opponent":savedRole;
let game=loaded.game,level=Number(loaded.level)||3,score=Number(loaded.score)||0,
 study=Number.isInteger(loaded.study)?Math.max(0,Math.min(2,loaded.study)):0,
 chosen=null,coach="",busy=false,options=[];
if(params.has("role")&&role!==savedRole){game=newFrenchDraughts();study=0;}
let activeRole=role;
const lessons=[
 {name:"Prise obligatoire",desc:"Tu joues les Blancs : capture les deux pions noirs en une rafle.",board:[
 [5,2,"white",false],[4,3,"black",false],[2,5,"black",false],[9,8,"white",true],[0,1,"black",true]],goal:2},
 {name:"Promotion en dame",desc:"Déplace ton pion blanc sur la dernière rangée pour devenir dame.",board:[
 [1,2,"white",false],[9,8,"white",true],[0,9,"black",true],[8,1,"black",false]],goal:"promotion"},
 {name:"Dame volante",desc:"Avec ta dame blanche, trouve la rafle la plus longue.",board:[
 [7,2,"white",true],[5,4,"black",false],[2,7,"black",false],[0,9,"black",true]],goal:2}
];
function makeLesson(i){
 const g=newFrenchDraughts();
 g.board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
 for(const [r,c,side,king] of lessons[i].board)g.board[r][c]={side,king};
 g.turn="white";g.ply=0;g.over=null;g.history=[];g.lastMove=null;
 return g;
}
if(activeRole==="training"&&savedRole!=="training"){game=makeLesson(0);study=0;}
function persist(){
 try{localStorage.setItem(STORE,JSON.stringify({game,level,role:activeRole,score,study:study}));}catch{}
 try{localStorage.setItem(PROGRESS,String(score));}catch{}
}
function setMessage(s){$("message").textContent=s;}
function getMoves(){return legalFrenchMoves(game);}
function line(m){return square(m.from.r,m.from.c)+" → "+m.landings.map(p=>square(p.r,p.c)).join(" → ");}
function lessonComplete(move){
 const target=lessons[study]?.goal;
 return target==="promotion"?!!move.promotion:move.captures.length>=target;
}
function setRole(newRole){
 if(duelActive){setMessage("Mode duel : retourne aux options pour choisir une autre partie.");return;}
 if(!roles.includes(newRole))return;
 activeRole=newRole;game=newFrenchDraughts();study=0;chosen=null;options=[];busy=false;
 if(newRole==="training"){game=makeLesson(0);setMessage(lessons[0].desc);}
 else setMessage(newRole==="partner"?"Alicia est ta partenaire : ses conseils sont disponibles pendant ta partie contre le moteur local.":"Défie Alicia ! Tu joues les Blancs, elle joue les Noirs.");
 history.replaceState(null,"",location.pathname+"?alicia=dames10&role="+newRole);
 persist();render();if(game.turn==="black")scheduleBot();
}
function setLesson(i){
 study=Math.max(0,Math.min(lessons.length-1,i));game=makeLesson(study);chosen=null;options=[];
 setMessage(lessons[study].desc);persist();render();
}
function select(r,c){
 if(duelActive)return;
 if(busy||game.over||(activeRole!=="training"&&game.turn!=="white"))return;
 const moves=getMoves();
 if(chosen){
  const viable=moves.filter(m=>m.from.r===chosen.r&&m.from.c===chosen.c&&m.to.r===r&&m.to.c===c);
  if(viable.length===1){play(viable[0]);return;}
  if(viable.length>1){options=viable;setMessage("Plusieurs rafles possibles pour arriver sur cette case. Choisis le parcours proposé sous le plateau.");render();return;}
 }
 chosen=moves.some(m=>m.from.r===r&&m.from.c===c)?{r,c}:null;
 options=[];
 if(chosen){
  const count=moves.filter(m=>m.from.r===r&&m.from.c===c).length;
  setMessage(count+" coup(s) autorisé(s) depuis "+square(r,c)+". Sélectionne une case surlignée.");
 }else setMessage(moves.some(m=>m.captures.length)?"Prise obligatoire : sélectionne une pièce qui peut réaliser une rafle maximale.":"Sélectionne un pion blanc qui peut bouger.");
 render();
}
function play(m){
 if(activeRole==="training"&&!lessonComplete(m)){
  setMessage("Presque ! "+lessons[study].desc+" Utilise le bouton Indice pour voir un exemple.");
  render();return;
 }
 const next=applyFrenchMove(game,m);
 if(!next){setMessage("Coup interdit. Regarde les cases surlignées.");return;}
 game=next;chosen=null;options=[];
 if(activeRole==="training"){
  score++;persist();
  const msg="Bravo ! "+line(m)+". Exercice "+(study+1)+"/"+lessons.length+" réussi.";
  setMessage(msg);coach=msg;
  if(study===lessons.length-1){$("training-done").hidden=false;render();return;}
  const nextLesson=study+1;
  setLesson(nextLesson);
  setMessage(msg+" Ensuite : "+lessons[nextLesson].desc);
  return;
 }
 const didCapture=m.captures.length?" · "+m.captures.length+" prise(s)":"";
 setMessage("Tu as joué "+line(m)+didCapture+". Alicia prépare sa réponse.");
 persist();render();scheduleBot();
}
let botTicket=0;
function scheduleBot(){
 if((game.turn!=="black"&&!duelActive)||game.over||activeRole==="training"||busy)return;
 const ticket=++botTicket;busy=true;render();
 setTimeout(()=>{
  if(ticket!==botTicket||(game.turn!=="black"&&!duelActive)||game.over){busy=false;render();return;}
  if(document.hidden){busy=false;return;}
  try{
   const aiName=duelActive&&game.turn==="white"?"alicia":params.get("bot");
   const move=chooseFrenchAlicia(game,{level:botSettings(aiName,level,5).level});
   if(move){const n=applyFrenchMove(game,move);if(n){const name=duelActive?(game.turn==="white"?"Alicia":"IA choisie"):"Alicia";game=n;setMessage("✦ "+name+" joue "+line(move)+(move.captures.length?" et capture "+move.captures.length+" pièce(s)":"")+". À toi !"+(activeRole==="partner"&&!game.over?" 🤝 Conseil pour ton tour : "+frenchAdvice(game,level).text:""));persist();}}
  }catch(error){setMessage("Calcul d'Alicia interrompu : "+String(error?.message||error));}
  busy=false;render();if(duelActive&&!game.over)scheduleBot();
 },duelActive?700:280);
}
function render(){
 const moves=getMoves();
 const possibleFrom=new Set(moves.map(m=>m.from.r+"-"+m.from.c));
 const targets=new Set(chosen?moves.filter(m=>m.from.r===chosen.r&&m.from.c===chosen.c).map(m=>m.to.r+"-"+m.to.c):[]);
 const html=[];
 for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
  const piece=game.board[r][c],isDark=(r+c)%2===1,from=possibleFrom.has(r+"-"+c),
   to=targets.has(r+"-"+c),picked=chosen?.r===r&&chosen?.c===c;
  const label=square(r,c)+(piece?" "+(piece.side==="white"?"blanc":"noir")+(piece.king?" dame":" pion"):"");
  html.push('<button type="button" class="cell '+(isDark?"dark":"light")+(from?" from":"")+(to?" target":"")+(picked?" selected":"")+
   '" data-r="'+r+'" data-c="'+c+'" aria-label="'+label+'"'+(!isDark?' disabled':'')+'>'+
   (piece?'<span class="piece '+piece.side+(piece.king?" king":"")+'">'+(piece.king?"♛":"●")+'</span>':'')+
   (r===SIZE-1?'<small class="coord">'+String.fromCharCode(65+c)+'</small>':'')+'</button>');
 }
 $("board").innerHTML=html.join("");
 $("turn").textContent=game.over?"Partie terminée : "+(game.over.winner==="white"?"tu as gagné !":"Alicia a gagné.") :
  activeRole==="training"?"🎓 Entraînement : "+lessons[study]?.name:
  busy?"✦ Alicia réfléchit…":game.turn==="white"?"À toi de jouer (Blancs)":"✦ Tour d'Alicia (Noirs)";
 $("turn").className=game.over?"final":"";
 $("roles").querySelectorAll("[data-role]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.role===activeRole)));
 $("coach-note").textContent=activeRole==="opponent"?"Tu défies Alicia. Ses coups utilisent une IA tactique hors ligne.":
  activeRole==="partner"?"Alicia t'accompagne pendant la partie avec des conseils après chaque coup.":
  "Cours : "+lessons[study]?.desc+" Progrès : "+score+" exercices réussis.";
 $("paths").innerHTML=options.map((m,i)=>'<button type="button" data-path="'+i+'">'+line(m)+" ("+m.captures.length+" prise(s))</button>").join("");
 $("levels").value=String(level);
 $("undo").disabled=activeRole==="training"||!game.history.length;
 $("next-training").hidden=activeRole!=="training";
}
$("board").addEventListener("click",e=>{const b=e.target.closest("[data-r][data-c]");if(b)select(+b.dataset.r,+b.dataset.c);});
$("roles").addEventListener("click",e=>{const b=e.target.closest("[data-role]");if(b)setRole(b.dataset.role);});
$("paths").addEventListener("click",e=>{const b=e.target.closest("[data-path]");if(b&&options[+b.dataset.path])play(options[+b.dataset.path]);});
$("new").addEventListener("click",()=>{if(!confirm("Commencer une nouvelle partie ? La dernière position non sauvegardée sera remplacée."))return;setRole(activeRole);});
$("undo").addEventListener("click",()=>{
 botTicket++;busy=false;const prev=undoFrench(game);
 if(!prev)return;game=prev;
 if(game.turn==="black"){const before=undoFrench(game);if(before)game=before;}
 chosen=null;persist();render();setMessage("Dernier tour annulé.");
});
$("hint").addEventListener("click",()=>{
 const a=frenchAdvice(game,level);
 chosen=a.move?.from||null;
 setMessage(a.text);render();
});
$("levels").addEventListener("change",e=>{level=Math.max(1,Math.min(5,+e.target.value||3));persist();render();});
$("next-training").addEventListener("click",()=>{setLesson((study+1)%lessons.length);$("training-done").hidden=true;});
$("training-done").hidden=true;
if(activeRole==="training")setMessage(lessons[study].desc);
else setMessage(activeRole==="partner"?"Alicia est ton coach pendant cette partie.":"Bienvenue ! Défie Alicia gratuitement, même sans Internet après installation.");
render();
if(game.turn==="black")scheduleBot();
