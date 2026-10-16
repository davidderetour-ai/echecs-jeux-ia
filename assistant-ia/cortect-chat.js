/* Outils conversationnels locaux pour Alicia Original.
 * Les notes privées ne sont jamais transmises à un service externe.
 */
import {orchestrate,chooseTool} from "./cortect-agent-core.mjs";
import {courseSearch} from "./python-vscode-course.mjs";
import {answerFromContext,indexDocuments} from "./cortect-rag-core.mjs";
function docs(){
 const engine=window.AliciaOriginalEngine;
 return engine?.listCortectNotes?.()||[];
}
export function answerWithTools(query){
 const q=String(query||"").trim();
 if(!q)return null;
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
 return null;
}
window.AliciaLocalTools={answer:answerWithTools};
