/* Alicia : index local des cours fournis avec l'application.
 * La lecture des fiches n'entraîne pas un modèle neuronal ; elle rend les contenus
 * explicitement consultables, interrogeables et vérifiables sans serveur ni paiement.
 */
import {LESSONS,answerFromLesson,searchLessons,norm} from "./alicia-academy.mjs";
import {COURSES,courseSearch} from "./python-vscode-course.mjs";

const KEY="alicia-cours-index-v1", SCHEMA=1;
const count=()=>LESSONS.length+COURSES.length;
const safeStore=()=>{
  try{return typeof localStorage!=="undefined"?localStorage:null;}catch{return null;}
};
const sourceVersion=()=>LESSONS.map(l=>l.id).join("|")+"#"+COURSES.map(c=>c.id).join("|");
let active=false, savedOnDevice=false;
function readIndex(){
  try{
    const value=JSON.parse(safeStore()?.getItem(KEY)||"null");
    if(value?.schema===SCHEMA&&value?.signature===sourceVersion()&&value?.enabled===true) {
      active=true;savedOnDevice=true;
    }
  }catch{}
}
readIndex();
function stats(){
  return {available:count(),fiches:LESSONS.length,coursPython:COURSES.length,
    indexed:active?count():0,persistent:savedOnDevice,
    source:"Cours intégrés à Alicia",trainedModel:false};
}
function activate(){
  active=true;
  savedOnDevice=false;
  try{
    const store=safeStore();
    if(store){
      store.setItem(KEY,JSON.stringify({schema:SCHEMA,signature:sourceVersion(),enabled:true}));
      savedOnDevice=store.getItem(KEY)!==null;
    }
  }catch{}
  return {...stats(),ok:true};
}
function command(query){
  const q=norm(query).replace(/\s+/g," ").trim();
  if(!q)return null;
  if(/\b(?:apprend|apprends|etudie|memorise|indexe|integre|analyse|lis|charge)\s+(?:(?:tous|toutes|l ensemble)\s+)?(?:(?:les|mes|tes|des)\s+)?(?:cours|fiches|lecons|formations)\b/.test(q) ||
     /\b(?:etudie|apprends)\s+(?:tout ce qui est installe|toutes tes connaissances)\b/.test(q))return "index";
  if(/(?:^|\b)(?:combien de cours|quels cours|cours appris|cours indexes|cours etudies|verifie tes cours|as tu appris les cours|qu as tu appris)\b/.test(q))return "status";
  return null;
}
const make=answer=>({answer,provider:"Cours locaux Alicia",local:true,verified:false,sources:[]});
function response(query){
  const cmd=command(query);
  if(cmd==="index"){
    const x=activate();
    return make("J'ai indexé "+x.available+" cours intégrés sur cet appareil : "+x.fiches+
      " fiches pédagogiques et "+x.coursPython+" cours Python / VS Code. "+
      (x.persistent?"La sélection est conservée localement. ":"Je peux les consulter maintenant, mais leur activation n'a pas été enregistrée. ")+
      "Tu peux m'interroger sur leurs sujets, demander un cours précis ou me faire passer un test. "+
      "Cela ne modifie pas mes poids d'IA et je n'ai pas lu les fichiers externes de ton Mac ou iPhone.");
  }
  if(cmd==="status"){
    const x=stats();
    return make(x.available+" cours intégrés sont disponibles ("+x.fiches+" fiches et "+x.coursPython+
      " cours Python/VS Code). "+(x.indexed?x.indexed+" sont indexés pour mes réponses sur cet appareil.":"Dis « Apprends les cours installés » pour activer leur index local.")+
      " Leur consultation n'est pas un entraînement de modèle neuronal.");
  }
  return null;
}
function answerCourse(query){
  const q=String(query||"").trim(),n=norm(q);
  if(!q||q.length>400||!active)return null;
  // Ne pas intercepter salutations et commandes de correction/mémorisation.
  if(/^(bonjour|salut|bonsoir|coucou|correction|corrige|retiens|memorise|apprends\s*:)/.test(n))return null;
  const hits=searchLessons(q,{limit:2});
  const first=hits[0];
  if(first&&first.score>=7&&first.coverage>=.6){
    const result=answerFromLesson(q);
    if(result&&result.lessonId===first.id)return {...result,provider:"Cours intégrés Alicia"};
  }
  const courses=courseSearch(q,2);
  if(courses.length && (/(python|visual studio|vscode|vs code|print|input|variable|boucle|fonction|debug|terminal|pip|json|venv)/.test(n))){
    const chosen=courses[0];
    return make(chosen.title+"\n\n"+chosen.lesson+"\n\nExercice : "+chosen.exercise+"\n\nSource : cours intégré Alicia ("+chosen.id+").");
  }
  return null;
}
export const AliciaCourseLearning={activate,stats,command,response,answerCourse,answer:q=>response(q)||answerCourse(q)};
if(typeof window!=="undefined"){
  window.AliciaCourseLearning=AliciaCourseLearning;
  window.dispatchEvent(new Event("alicia:courses-ready"));
}
