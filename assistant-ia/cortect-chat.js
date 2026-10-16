/* Outils conversationnels locaux pour Alicia Original.
 * Les notes privées ne sont jamais transmises à un service externe.
 */
import {orchestrate,chooseTool} from "./cortect-agent-core.mjs";
import {courseSearch} from "./python-vscode-course.mjs";
import {answerFromContext,indexDocuments} from "./cortect-rag-core.mjs";
import {LESSONS,answerFromLesson,subjects} from "./alicia-academy.mjs";
function docs(){
 const engine=window.AliciaOriginalEngine;
 return engine?.listCortectNotes?.()||[];
}
export function answerWithTools(query){
 const q=String(query||"").trim();
 if(!q)return null;
 // L'atelier est un programme d'enseignement, pas un transfert des poids de ChatGPT.
 if(/(?:professeur|enseignant|enseigne.moi|apprendre\s+tout|apprends\s+tout|enseigne\s+à\s+alicia|ce que tu sais)/i.test(q)){
   window.AliciaTeacher?.open?.();
   return {answer:"Mon professeur m'a donné une bibliothèque de "+LESSONS.length+
     " leçons originales dans "+subjects().length+" matières : informatique, IA, mathématiques, sciences, français, géographie, histoire, jeux, cybersécurité, administratif, arts, musique et robotique. "+
     "Tu peux ouvrir « Professeur d’Alicia » pour voir mes fiches et leurs tests. Je peux retrouver ces connaissances hors ligne, mais je ne suis pas un grand modèle de langage et je ne prétendrai pas savoir ce qui n'est pas dans mes sources.",
    provider:"Professeur local",local:true,verified:false,sources:[]};
 }
 // Commande d'avatar : éviter de répondre « je ne sais pas » à une demande réelle d'interface.
 if(/\b(?:avatar|personnage)\b/i.test(q)&&/(?:3d|trois dimensions|refaire|refais|modifi|am[eé]lior|affiche|montre|tourne|rotation)/i.test(q)){
   const isAvailable=Boolean(window.Alicia3D?.ready);
   if(isAvailable)window.Alicia3D.open();
   return {answer:isAvailable?
     "J'ai ouvert mon avatar 3D stylisé. Tu peux le faire tourner, voir son dos, utiliser les boutons Face et Dos et écouter ma voix française. Mon apparence s'inspire de la référence, mais le modèle n'est pas encore une reproduction photoréaliste ni un personnage 3D entièrement personnalisable.":
     "Le mode avatar 3D nécessite WebGL. Le portrait, la conversation et la voix restent disponibles sur cet appareil. La maquette photoréaliste est conservée comme référence visuelle.",
     provider:"Avatar Alicia",local:true,verified:false,sources:[]};
 }
 if(/\b(?:python|vs\s*code|visual studio code|pip|debugger|débog|print\s*\(|input\s*\(|variables?|venv)\b/i.test(q)){
  const found=courseSearch(q,1)[0];
  if(found)return {answer:"École Alicia — "+found.title+"\n\n"+found.lesson+
   "\n\nExemple :\n"+found.snippet+"\n\nExercice : "+found.exercise+
   "\n\nTu peux ouvrir « École Alicia » pour voir son corrigé.",provider:"Cours locaux Python / VS Code",local:true,sources:[],verified:false};
 }
 const source=docs();
 const tool=chooseTool(q);
 if(tool){
  const out=orchestrate(q,{notes:source});
  if(out.handled)return {answer:out.answer,provider:"Agent local "+(out.tool||"outils"),
    local:true,sources:[],verified:!!out.verified,tool:out.tool};
 }
 if(/(?:que disent mes notes|d.apres mes notes|dans mes notes|cherche dans mes notes|mes documents)/i.test(q)){
  const result=answerFromContext(q,indexDocuments(source),2);
  return {answer:result.answer,provider:"CORTECT RAG local",local:true,verified:false,sources:[]};
 }
 const learned=answerFromLesson(q);
 if(learned)return learned;
 return null;
}
window.AliciaLocalTools={answer:answerWithTools};
