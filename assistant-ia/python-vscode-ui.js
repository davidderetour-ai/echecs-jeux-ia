/* Cours interactifs Alicia Python 3.12.9 et VS Code. Lecture et exercices, pas d'exécution de code. */
import {COURSES,courseSearch} from "./python-vscode-course.mjs";
const $=id=>document.getElementById(id);
function init(){
 if($("alicia-python-school"))return;
 const panel=document.createElement("details");
 panel.id="alicia-python-school";panel.className="alicia-school";
 panel.innerHTML='<summary>📚 École Alicia — Python 3.12.9 et Visual Studio Code</summary>'+
 '<div class="alicia-school-body"><p>Cours gratuits disponibles hors ligne après installation de l’application. Exemples et exercices à taper sur ton Mac. Aucun script n’est exécuté depuis cette page.</p>'+
 '<label>Rechercher une notion <input id="alicia-school-search" placeholder="print, input, variables, VS Code, pip…" autocomplete="off"></label>'+
 '<label>Matière <select id="alicia-school-filter"><option value="all">Tous les cours</option><option value="python">Python 3.12.9</option><option value="vscode">Visual Studio Code</option></select></label>'+
 '<div id="alicia-school-lessons"></div></div>';
 const where=$("data-lab")||$("chat-form");
 if(where)where.before(panel);else document.querySelector(".shell")?.append(panel);
 const list=$("alicia-school-lessons");
 function render(){
  const query=$("alicia-school-search").value.trim(),filter=$("alicia-school-filter").value;
  const entries=(query?courseSearch(query,30):COURSES).filter(x=>filter==="all"||x.topic===filter);
  list.replaceChildren();
  if(!entries.length){const p=document.createElement("p");p.textContent="Aucun cours trouvé. Essaie « Python », « print », « input » ou « VS Code ».";list.append(p);return;}
  for(const lesson of entries){
   const item=document.createElement("details");item.className="alicia-school-lesson";
   const h=document.createElement("summary");h.textContent=lesson.title+" — "+lesson.description;
   const body=document.createElement("p");body.textContent=lesson.lesson;
   const h4=document.createElement("strong");h4.textContent="Exemple à copier (pas exécuté) :";
   const pre=document.createElement("pre");pre.textContent=lesson.snippet;
   const copy=document.createElement("button");copy.type="button";copy.textContent="Copier l'exemple";
   copy.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(lesson.snippet);copy.textContent="✓ Exemple copié";}
    catch{copy.textContent="Sélectionne le texte de l'exemple et copie-le";}
   });
   const exercise=document.createElement("p");exercise.textContent="Exercice : "+lesson.exercise;
   const sol=document.createElement("details");
   const sh=document.createElement("summary");sh.textContent="Voir le corrigé";
   const sp=document.createElement("pre");sp.textContent=lesson.solution;
   sol.append(sh,sp);
   item.append(h,body,h4,pre,copy,exercise,sol);list.append(item);
  }
 }
 $("alicia-school-search").addEventListener("input",render);
 $("alicia-school-filter").addEventListener("change",render);
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
