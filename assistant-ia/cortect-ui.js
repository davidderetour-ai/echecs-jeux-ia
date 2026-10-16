/* Interface CORTECT IA pour iPhone Safari et Alicia Mac Big Sur.
   Notes non fiables, stockage local, aucun achat, aucun script utilisateur exécuté. */
import {createStroopChallenge,evaluateStroop,summarizeStroop,deBonoPrompts,threeChallengeQuestions} from "./cortect-core.mjs";
import {indexDocuments,answerFromContext,retrieveAdvanced} from "./cortect-rag-core.mjs";
import {orchestrate} from "./cortect-agent-core.mjs";
import {runMission} from "./cortect-mission-core.mjs";
const $=id=>document.getElementById(id);
const engine=window.AliciaOriginalEngine;
const say=(id,s)=>{const n=$(id);if(n)n.textContent=s;};
const notes=()=>engine?.listCortectNotes?.()||[];
function addRow(container,title,text){
 const div=document.createElement("div");div.className="cortect-result-row";
 const b=document.createElement("strong");b.textContent=title;
 const p=document.createElement("p");p.textContent=text;
 div.append(b,p);container.append(div);
}
function detectPossibleContradictions(arr){
 // Heuristic only: flag apparent negative/positive claims about the same key phrases.
 const found=[];
 for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
  const a=arr[i].content.toLowerCase(),b=arr[j].content.toLowerCase();
  const neg=s=>/\b(?:ne\s+\w+\s+pas|interdit|jamais|impossible|n.est pas)\b/i.test(s);
  const terms=s=>new Set(s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").match(/[a-z]{5,}/g)||[]);
  const aa=terms(a),bb=terms(b),common=[...aa].filter(t=>bb.has(t)&&!["comme","avoir","faire","toujours","encore","quand","alors","cette","leurs"].includes(t));
  if(common.length>=2&&neg(a)!==neg(b))
   found.push("À vérifier entre « "+arr[i].source+" » et « "+arr[j].source+" » (termes communs : "+common.slice(0,3).join(", ")+").");
  if(found.length>=5)return found;
 }
 return found;
}
function renderNotes(){
 const list=$("cortect-notes");if(!list)return;
 list.replaceChildren();
 const arr=notes();
 for(const entry of arr.slice(-20).reverse()){
  const row=document.createElement("div");row.className="cortect-note-row";
  const p=document.createElement("p");p.textContent=entry.content.slice(0,480);
  const small=document.createElement("small");small.textContent=entry.source+" · "+entry.tags.join(", ");
  const remove=document.createElement("button");remove.textContent="Supprimer";remove.type="button";
  remove.addEventListener("click",()=>{
    if(confirm("Supprimer uniquement cette note ?")){
      engine.deleteCortectNote(entry.id);renderNotes();say("cortect-status","Note supprimée localement.");
    }
  });
  row.append(small,p,remove);list.append(row);
 }
 say("cortect-count",arr.length+" notes locales mémorisées");
}
function recordMetrics(){
 const history=engine.listStroopScores();
 const summary=summarizeStroop(history);
 say("cortect-stroop-metrics",summary.count?
  summary.count+" essai(s) · exactitude "+summary.accuracy+" % · temps moyen "+summary.averageSeconds.toFixed(2)+" s"+
    (summary.bestSeconds===null?"":" · meilleur temps correct "+summary.bestSeconds.toFixed(2)+" s"):
  "Aucune session pour le moment.");
}
function insert(){
 if($("cortect-panel"))return;
 const root=document.createElement("details");root.id="cortect-panel";root.className="cortect-panel";
 root.innerHTML='<summary>🧠 CORTECT-IA — second cerveau, RAG, apprentissage et exercices</summary>'+
 '<div class="cortect-body">'+
 '<p class="cortect-disclaimer">Fonctions gratuites et locales. Les exercices cognitifs n’évaluent pas la santé neurologique ; les réponses de notes sont des extraits et non des faits vérifiés.</p>'+
 '<h3>1. Capturer une connaissance</h3>'+
 '<label>Source <input id="cortect-source" maxlength="120" value="Note personnelle"></label>'+
 '<label>Note <textarea id="cortect-text" rows="4" maxlength="2000" placeholder="Écris ou colle une note, sans mots de passe…"></textarea></label>'+
 '<label>Tags séparés par virgule <input id="cortect-tags" placeholder="projet, formation"></label>'+
 '<button type="button" id="cortect-save">Sauvegarder la note</button><p id="cortect-status" role="status"></p>'+
 '<p id="cortect-count"></p><div id="cortect-notes"></div>'+
 '<h3>2. Question à mes notes : retrieval + reranking</h3>'+
 '<label>Question <input id="cortect-query" placeholder="Quelle est la procédure de télétravail ?"></label>'+
 '<button type="button" id="cortect-search">Rechercher dans mes notes</button>'+
 '<button type="button" id="cortect-check">Tester les contradictions possibles</button>'+
 '<pre id="cortect-results" class="cortect-results" role="status"></pre>'+
 '<button type="button" id="cortect-questions">Générer trois questions de réflexion</button>'+
 '<label>Projet pour la méthode de Bono <input id="cortect-project" placeholder="Mon prochain projet"></label>'+
 '<button type="button" id="cortect-bono">Afficher les six chapeaux de Bono</button>'+
 '<div id="cortect-thinking"></div>'+
 '<h3>3. Moniteur Stroop</h3>'+
 '<p>Nomme la <strong>couleur de l’encre</strong>, et non le mot. Le chronomètre inclut ta réponse sur écran.</p>'+
 '<button type="button" id="cortect-stroop-start">Commencer une session</button>'+
 '<div id="cortect-stroop-word" aria-live="polite" class="cortect-stroop-word">PRÊT</div>'+
 '<div id="cortect-stroop-choices"></div><p id="cortect-stroop-result" role="status"></p>'+
 '<p id="cortect-stroop-metrics"></p>'+
 '<h3>4. Agent de missions contrôlé</h3>'+
 '<label>Mission <textarea id="cortect-mission" rows="3" placeholder="Calcule 12 + 4 * 2 ou lis une page HTTPS publique"></textarea></label>'+
 '<button type="button" id="cortect-mission-run">Exécuter la mission demandée</button>'+
 '<button type="button" id="cortect-mission-cancel">Annuler</button>'+
 '<pre id="cortect-mission-result" class="cortect-results" role="status"></pre>'+
 '</div>';
 const before=$("data-lab")||$("chat-form");
 if(before)before.before(root);else document.querySelector(".shell")?.append(root);
 $("cortect-save").addEventListener("click",async()=>{
  const text=$("cortect-text").value.trim();
  const source=$("cortect-source").value.trim()||"Note personnelle";
  const tags=$("cortect-tags").value.split(",").map(x=>x.trim()).filter(Boolean);
  if(!text){say("cortect-status","Écris une note d’abord.");return;}
  if(window.AliciaNativeMemory?.ready)await window.AliciaNativeMemory.ready;
  const result=engine.addCortectNote(source,text,tags);
  if(result.ok){$("cortect-text").value="";renderNotes();}
  const stored=result.ok&&window.AliciaNativeMemory?await window.AliciaNativeMemory.flush():result.ok;
  say("cortect-status",stored?"Note enregistrée localement.":result.reason||"La sauvegarde Mac n’a pas été confirmée.");
 });
 $("cortect-search").addEventListener("click",()=>{
  const q=$("cortect-query").value.trim();if(!q){say("cortect-results","Écris une question.");return;}
  const index=indexDocuments(notes()),response=answerFromContext(q,index,2);
  say("cortect-results",response.answer+(response.found?"\n\n[Recherche locale + reclassement de pertinence, sans modèle externe]":""));
 });
 $("cortect-check").addEventListener("click",()=>{
  const possible=detectPossibleContradictions(notes());
  say("cortect-results",possible.length?possible.join("\n"):"Aucune contradiction apparente détectée par les règles simples. Cela ne garantit pas l’absence de contradictions.");
 });
 $("cortect-questions").addEventListener("click",()=>{
  const n=notes().slice(-5).map(x=>x.content).join("\n");
  const out=$("cortect-thinking");out.replaceChildren();
  if(!n){addRow(out,"Notes","Ajoute d’abord des notes.");return;}
  threeChallengeQuestions(n).forEach((q,i)=>addRow(out,"Question "+(i+1),q));
 });
 $("cortect-bono").addEventListener("click",()=>{
  const out=$("cortect-thinking");out.replaceChildren();
  const lines=deBonoPrompts($("cortect-project").value);
  if(!lines.length){addRow(out,"Projet","Décris d’abord un projet.");return;}
  lines.forEach(x=>addRow(out,"Chapeau "+x.hat,x.question));
 });
 let challenge=null,started=0;
 function choose(color){
  if(!challenge)return;
  const record=evaluateStroop(challenge,color,started,performance.now());
  const result=engine.addStroopScore(record);
  say("cortect-stroop-result",(record.correct?"Bonne réponse.":"Réponse incorrecte, la couleur était "+record.expected+".")+
   " Durée : "+record.durationSeconds.toFixed(2)+" seconde(s). "+
   (result.ok?"Score enregistré.":"Sauvegarde locale non confirmée."));
  $("cortect-stroop-choices").replaceChildren();
  challenge=null;recordMetrics();
 }
 $("cortect-stroop-start").addEventListener("click",()=>{
  challenge=createStroopChallenge();
  const word=$("cortect-stroop-word");
  word.textContent=challenge.word;word.style.color=challenge.inkCss;
  const choices=$("cortect-stroop-choices");choices.replaceChildren();
  for(const [key] of [["rouge"],["bleu"],["vert"],["jaune"],["noir"]]){
   const btn=document.createElement("button");btn.type="button";btn.textContent=key;
   btn.addEventListener("click",()=>choose(key));choices.append(btn);
  }
  say("cortect-stroop-result","Choisis uniquement la couleur du texte.");
  started=performance.now();
 });
 let abort=null;
 $("cortect-mission-cancel").addEventListener("click",()=>{abort?.abort();say("cortect-mission-result","Mission annulée.");});
 $("cortect-mission-run").addEventListener("click",async()=>{
  const mission=$("cortect-mission").value.trim();
  if(!mission){say("cortect-mission-result","Écris d’abord une mission.");return;}
  if(abort)abort.abort();abort=new AbortController();
  say("cortect-mission-result","Mission commencée, sans achats ni modification des fichiers…");
  try{
   const local=orchestrate(mission,{notes:notes()});
   if(local.handled){say("cortect-mission-result",local.answer);return;}
   const result=await runMission(mission,{notes:notes(),signal:abort.signal});
   const trace=result.events.map(s=>s.step+" : "+s.status).join(" → ");
   say("cortect-mission-result",result.answer+"\n\nÉtapes : "+trace);
  }catch(err){say("cortect-mission-result","Mission arrêtée : "+err.message);}
 });
 renderNotes();recordMetrics();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",insert,{once:true});else insert();
