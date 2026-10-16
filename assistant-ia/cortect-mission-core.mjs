/* Alicia CORTECT agent mission : boucle de tâches bornée, gratuite, opt-in.
   Jamais de code arbitraire ni navigation privée ni action système.
   HTTPS page text via CORS, may be unavailable and is reported honestly.
 */
import {publicPageURL,extractPageText} from "./web-browse-core.mjs";
import {calculateSafe,orchestrate} from "./cortect-agent-core.mjs";
export const MAX_STEPS=3;
export function planMission(text){
 const task=String(text||"").slice(0,1400);
 const matches=task.match(/https?:\/\/[^\s<>"']+/gi)||[];
 const urls=matches.slice(0,1).map(publicPageURL);
 const needCompute=/calcul|somme|addition|total|fibonacci|\d+\s*[+*\/×÷-]\s*\d+/i.test(task);
 return {urls,steps:urls.length?(needCompute?["read","calculate","report"]:["read","report"]):
   (needCompute?["calculate","report"]:["report"]),userText:task};
}
export async function runMission(text,{notes=[],fetcher=fetch,signal}={}){
 const plan=planMission(text),events=[],evidence=[];
 if(plan.steps.length>MAX_STEPS)throw Error("Mission trop longue");
 for(const step of plan.steps){
  if(signal?.aborted)throw Error("Mission annulée.");
  if(step==="read"){
   const url=plan.urls[0];
   events.push({step:"read",status:"started",url});
   try{
    const response=await fetcher(url,{method:"GET",credentials:"omit",mode:"cors",redirect:"error",
      headers:{Accept:"text/html,text/plain"},cache:"no-store",signal});
    if(!response.ok)throw Error("Page refusée ("+response.status+")");
    if(response.url&&publicPageURL(response.url)!==url)throw Error("Redirection interdite");
    const type=String(response.headers?.get("content-type")||"text/plain");
    if(!/^(?:text\/html|text\/plain)/i.test(type))throw Error("Page non textuelle");
    if(Number(response.headers?.get("content-length")||0)>450000)throw Error("Page trop volumineuse");
    const html=await response.text();
    if(html.length>450000)throw Error("Page trop volumineuse");
    const excerpt=extractPageText(html,type,4000);
    if(excerpt.length<30)throw Error("Pas assez de texte accessible");
    evidence.push({url,text:excerpt,kind:"page-publique"});
    events.push({step:"read",status:"done",url,characters:excerpt.length});
   }catch(err){
    events.push({step:"read",status:"failed",message:String(err?.message||err)});
    return {success:false,events,answer:"Je ne peux pas lire cette page depuis cette application (accès refusé, CORS ou connexion). Je n'invente pas son contenu. Essaie une note copiée dans CORTECT-IA.",sources:[]};
   }
  }else if(step==="calculate"){
    const task=plan.userText;
    // Only explicit arithmetic or Fibonacci; never interpret arbitrary page numbers as countries/populations.
    const expression=task.match(/(?:calcule|calculer|combien font|somme de|additionne)\s+(\d[\d\s+\-*\/().×÷,]{1,70})/i)?.[1];
    const fib=task.match(/\b(?:fibonacci|suite de fibonacci)\b.*?\d{1,3}/i)?.[0];
    if(!expression&&!fib){
      events.push({step:"calculate",status:"needs-data"});
      return {success:false,events,answer:"La page n'indique pas clairement quels nombres calculer. Identifie les trois valeurs et demande-moi leur somme, par exemple « Calcule 12 + 16 + 20 ».",sources:evidence.map(x=>x.url)};
    }
    try{
      const result=calculateSafe(expression||fib);
      events.push({step:"calculate",status:"done",value:result.result});
      evidence.push({kind:"calculation",text:result.answer});
    }catch(err){
      events.push({step:"calculate",status:"failed",message:err.message});
      return {success:false,events,answer:"Calcul impossible : "+err.message,sources:evidence.map(x=>x.url)};
    }
  }
 }
 let answer=evidence.length?"Résultat de la mission (données non vérifiées) :\n"+evidence.map(x=>
   x.kind==="calculation"?x.text:"Page "+x.url+" :\n"+x.text.slice(0,2100)).join("\n\n"):
   (orchestrate(plan.userText,{notes}).answer||"Aucune tâche prise en charge.");
 if(!evidence.length)events.push({step:"report",status:"limited"});
 else events.push({step:"report",status:"done"});
 return {success:evidence.length>0,events,answer,sources:evidence.filter(x=>x.url).map(x=>x.url)};
}
