/* Atelier du professeur d'Alicia, hors ligne, notes et corrections sur l'appareil.
 * Il s'agit de consultation/auto-tests, pas d'entraînement de poids de réseau neuronal.
 */
import {LESSONS,subjects,searchLessons,lessonById,gradeLesson,selfCheckAcademy} from "./alicia-academy.mjs";
import {AliciaCourseLearning} from "./course-learning.mjs";
const $=id=>document.getElementById(id);
const engine=window.AliciaOriginalEngine;
const TITLE={info:"Informatique et Python",ia:"Intelligence artificielle",maths:"Mathématiques",science:"Sciences",
 geo:"Géographie",histoire:"Histoire",francais:"Français",jeux:"Échecs, Shogi et Go",
 cyber:"Sécurité numérique",administratif:"Accueil et administratif",art:"Dessin et arts",musique:"Musique",robotique:"Robotique"};
function safeText(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=content;return n;}
function init(){
 if($("alicia-professeur"))return;
 const panel=document.createElement("details");panel.id="alicia-professeur";panel.className="alicia-professeur";
 panel.innerHTML='<summary>🎓 Professeur d’Alicia — bibliothèque de connaissances et exercices</summary>'+
 '<div class="alicia-professeur-body">'+
 '<p>Je suis le professeur d’Alicia. Ses fiches sont chargées sur cet appareil, sans Internet ni API payante. Le moteur peut retrouver leurs explications, mais <strong>cela ne transforme pas Alicia en grand modèle de langage.</strong></p>'+
 '<div id="alicia-professeur-stats" aria-live="polite"></div>'+
 '<div class="alicia-professeur-actions">'+
 '<button type="button" id="alicia-professeur-learn">Apprendre les cours installés</button>'+
 '<button type="button" id="alicia-professeur-autotest">Vérifier ce qu’Alicia sait restituer</button>'+
 '<button type="button" id="alicia-professeur-quiz">Interroge-moi</button>'+
 '</div>'+
 '<label>Matière <select id="alicia-professeur-domain"><option value="all">Toutes les matières</option></select></label>'+
 '<label>Rechercher un cours <input id="alicia-professeur-search" placeholder="fraction, échecs, Python, science…" autocomplete="off"></label>'+
 '<p id="alicia-professeur-status" role="status"></p>'+
 '<div id="alicia-professeur-lesson-list"></div>'+
 '<div id="alicia-professeur-test" class="alicia-professeur-test" hidden></div>'+
 '</div>';
 const insertionPoint=$("alicia-python-school")||$("cortect-panel")||$("data-lab")||$("chat-form");
 if(insertionPoint)insertionPoint.before(panel);else document.querySelector(".shell")?.append(panel);
 const select=$("alicia-professeur-domain"),list=$("alicia-professeur-lesson-list"),status=$("alicia-professeur-status");
 for(const domain of subjects()){const o=document.createElement("option");o.value=domain;o.textContent=TITLE[domain]||domain;select.append(o);}
 function stats(){
  const progress=engine?.listLessonProgress?.()||[];
  const learned=progress.filter(x=>x.correct>0);
  const checked=progress.reduce((n,x)=>n+x.attempts,0);
  const p=$("alicia-professeur-stats");p.replaceChildren();
  p.append(safeText("strong",null,LESSONS.length+" fiches disponibles · "+subjects().length+" matières"));
  p.append(safeText("p",null,learned.length+" fiches réussies au moins une fois · "+checked+" exercice(s) effectués sur cet appareil."));
  const index=AliciaCourseLearning.stats();
  p.append(safeText("p",null,index.indexed+" / "+index.available+" cours intégrés indexés localement."));
 }
 function render(){
  const q=$("alicia-professeur-search").value.trim(),domain=select.value;
  const found=searchLessons(q,{domain,limit:q?14:18});
  list.replaceChildren();
  if(!found.length){list.append(safeText("p",null,"Aucun cours correspondant. Cette bibliothèque est limitée : Alicia doit indiquer quand elle ne sait pas."));return;}
  for(const lesson of found){
    const details=document.createElement("details");details.className="alicia-professeur-fiche";
    const summary=safeText("summary",null,lesson.title+" — "+(TITLE[lesson.domain]||lesson.domain));
    const description=safeText("p",null,lesson.summary),example=safeText("p",null,"Exemple : "+lesson.example);
    const tags=safeText("small",null,"Source : "+lesson.source+" · "+lesson.id);
    const quiz=document.createElement("button");quiz.type="button";quiz.textContent="Faire le test de ce cours";
    quiz.addEventListener("click",()=>startQuiz(lesson.id));
    details.append(summary,description,example,tags,quiz);list.append(details);
  }
 }
 function startQuiz(id){
  const lesson=id?lessonById(id):LESSONS[Math.floor(Math.random()*LESSONS.length)];
  if(!lesson)return;
  const testBox=$("alicia-professeur-test");testBox.hidden=false;testBox.replaceChildren();
  testBox.append(safeText("h3",null,"Exercice : "+lesson.title));
  testBox.append(safeText("p",null,lesson.question));
  const choices=document.createElement("div");choices.className="alicia-professeur-choices";
  const report=safeText("p",null,"Choisis la meilleure réponse.");report.setAttribute("role","status");
  lesson.options.forEach((label,index)=>{
   const button=document.createElement("button");button.type="button";
   button.textContent=String(index+1)+". "+label;
   button.addEventListener("click",async()=>{
    const evaluation=gradeLesson(lesson.id,index);
    if(!evaluation.ok){report.textContent=evaluation.reason;return;}
    if(window.AliciaNativeMemory?.ready)await window.AliciaNativeMemory.ready;
    const saved=engine?.recordLessonResult?.(lesson.id,evaluation.correct);
    const stored=saved?.ok&&window.AliciaNativeMemory?await window.AliciaNativeMemory.flush():saved?.ok;
    report.textContent=(evaluation.correct?"✓ Bonne réponse. ":"Réponse à revoir. ")+
      "La bonne réponse est : "+evaluation.expected+". "+evaluation.explanation+
      (stored?" Résultat conservé.":" Attention : sauvegarde non confirmée.");
    [...choices.querySelectorAll("button")].forEach(x=>x.disabled=true);
    stats();
   });
   choices.append(button);
  });
  testBox.append(choices,report);
  testBox.scrollIntoView({block:"nearest",behavior:"smooth"});
 }
 $("alicia-professeur-learn").addEventListener("click",()=>{
  const result=AliciaCourseLearning.activate();
  stats();
  status.textContent="✓ "+result.indexed+" cours intégrés indexés. Demande maintenant une explication à Alicia. "+(result.persistent?"État sauvegardé sur cet appareil.":"Activation non conservée après fermeture.");
 });
 $("alicia-professeur-autotest").addEventListener("click",()=>{
   const test=selfCheckAcademy();
   status.textContent=test.failures.length?
    test.passed+" / "+test.tested+" fiches passent la vérification de recherche/corrigé. À améliorer : "+test.failures.slice(0,5).join("; "):
    "✓ "+test.tested+" fiches vérifiées : recherche et corrigé cohérents. Attention : ce test ne mesure pas l'intelligence générale d'une IA.";
 });
 $("alicia-professeur-quiz").addEventListener("click",()=>startQuiz(null));
 select.addEventListener("change",render);
 $("alicia-professeur-search").addEventListener("input",render);
 window.AliciaTeacher={
  open(){panel.open=true;panel.scrollIntoView({behavior:"smooth",block:"start"});},
  topics:subjects,availableLessons:LESSONS.length,
  audit:selfCheckAcademy
 };
 stats();render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
