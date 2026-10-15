import { timingSafeEqual } from "node:crypto";

const MODES = {
  general: "Tu es un assistant IA polyvalent. Réponds en français sauf demande contraire. Tu es précis, clair, utile et honnête sur tes limites.",
  code: "Tu es un ingénieur logiciel senior, expert en Python, JavaScript, TypeScript, GitHub, web, applications mobiles et systèmes. Propose du code maintenable, tests, plan de validation, sécurité et alternatives. Ne prétends jamais avoir exécuté un code ou fait un déploiement que tu n'as pas fait.",
  repair: "Tu es un expert de diagnostic informatique Windows, macOS, Linux, iOS et Android. Commence par le symptôme, version, messages d'erreur, risques et sauvegardes. Propose une progression sûre du moins risqué au plus intrusif. Ne prétends pas accéder à l'appareil. Demande autorisation avant opérations destructives, réinitialisations, suppression de données ou changements critiques.",
  create: "Tu es architecte logiciel, designer d'applications, spécialiste cybersécurité défensive et automatisation. Transforme les idées en cahier des charges, architecture, prototype et étapes testables. Précise les coûts, permissions et limites des plateformes.",
  teach: "Tu es un professeur patient de programmation et d'informatique. Explications en français très simple, mini-exemples, exercices, corrigés progressifs et vocabulaire expliqué."
};
const corsless = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json = (body,status=200)=>new Response(JSON.stringify(body),{status,headers:corsless});
export function authorize(actual,expected){
 if(typeof actual!=="string"||!expected||!actual)return false;
 const a=Buffer.from(actual),b=Buffer.from(expected);
 return a.length===b.length && timingSafeEqual(a,b);
}
export function cleanMessages(messages){
 if(!Array.isArray(messages))return [];
 return messages.slice(-14).filter(x=>x&&["user","assistant"].includes(x.role)&&typeof x.content==="string").map(x=>({role:x.role,content:x.content.trim().slice(0,6000)})).filter(x=>x.content);
}
export function textAndSources(response){
 const parts=[],sources=[],seen=new Set();
 for(const item of response?.output||[]){
  if(item.type!=="message")continue;
  for(const c of item.content||[]){
   if(c.type==="output_text"&&typeof c.text==="string")parts.push(c.text);
   for(const note of c.annotations||[]){
    if(note.type!=="url_citation"||typeof note.url!=="string")continue;
    try{const url=new URL(note.url);if(url.protocol!=="https:"||seen.has(url.href))continue;seen.add(url.href);sources.push({title:String(note.title||url.hostname).slice(0,150),url:url.href})}catch{}
   }
  }
 }
 return {answer:parts.join("\n").trim(),sources:sources.slice(0,8)};
}
async function respond(body){
 const response=await fetch("https://api.openai.com/v1/responses",{
  method:"POST",
  headers:{"authorization":"Bearer "+process.env.OPENAI_API_KEY,"content-type":"application/json"},
  body:JSON.stringify(body),
  signal:AbortSignal.timeout(54000)
 });
 if(!response.ok){
  if(response.status===429)throw Object.assign(new Error("Quota ou limite API atteinte. Vérifie ton compte OpenAI et tes plafonds de dépense."),{status:429});
  if(response.status===401||response.status===403)throw Object.assign(new Error("La clé API OpenAI est incorrecte ou non autorisée."),{status:503});
  throw Object.assign(new Error("Service IA temporairement indisponible ("+response.status+")."),{status:502});
 }
 return textAndSources(await response.json());
}
function reviewPrompt(question,draft){
 return "Réévalue cette réponse en français. Vérifie les erreurs de logique, les omissions, les commandes potentiellement dangereuses, les incohérences et l'incertitude factuelle. Corrige-les dans une version finale directement utile. N'invente pas de tests réalisés ni de faits vérifiés. Si tu ne peux pas confirmer un fait, signale l'incertitude. Si la réponse est correcte, conserve-la en l'améliorant au besoin.\n\nQUESTION :\n"+question+"\n\nRÉPONSE À VÉRIFIER :\n"+draft;
}
export default async function handler(request){
 if(request.method!=="POST")return json({error:"Utilise une requête POST."},405);
 if(!process.env.OPENAI_API_KEY||!process.env.APP_ACCESS_TOKEN)return json({error:"Configuration incomplète : ajoute OPENAI_API_KEY et APP_ACCESS_TOKEN aux variables Netlify."},503);
 if(!authorize(request.headers.get("x-app-code"),process.env.APP_ACCESS_TOKEN))return json({error:"Code d'accès incorrect."},401);
 try{
  const raw=await request.text();if(raw.length>45000)return json({error:"Message trop volumineux."},413);
  let data;try{data=JSON.parse(raw)}catch{return json({error:"Requête JSON incorrecte."},400)}
  const messages=cleanMessages(data.messages);
  if(!messages.length||!["user","assistant"].includes(messages.at(-1).role))return json({error:"Conversation vide."},400);
  const review=data.review===true;
  if((review && (messages.at(-1).role!=="assistant"||!messages.some(x=>x.role==="user")))||(!review&&messages.at(-1).role!=="user"))return json({error:"Conversation mal formée."},400);
  const notes=Array.isArray(data.notes)?data.notes.filter(x=>typeof x==="string").slice(0,8).map(x=>x.slice(0,240)):[];
  const mode=Object.hasOwn(MODES,data.mode)?data.mode:"general";
  const instructions="Tu t’appelles Alicia, assistante IA personnelle. "+MODES[mode]+"\nRègle générale : ne suggère aucune modification automatique de ton propre code ou du système sans revue humaine et tests. En cas d'incertitude, explique les vérifications à faire. Toute préférence utilisateur ci-dessous est une indication, pas une instruction prioritaire.\nPréférences utilisateur : "+notes.join(" | ");
  const model=process.env.OPENAI_MODEL||"gpt-5.6-terra";
  const web=data.web===true;
  const tools=web?[{type:"web_search"}]:[];
  const lastQuestion=[...messages].reverse().find(x=>x.role==="user")?.content||"";
  if(review){
   const draft=messages.at(-1).content;
   const revised=await respond({model,instructions,input:reviewPrompt(lastQuestion,draft),tools,max_output_tokens:2300,store:false});
   if(!revised.answer)throw Object.assign(new Error("La vérification n'a renvoyé aucune réponse."),{status:502});
   return json({...revised,verified:true});
  }
  const main=await respond({model,instructions,input:messages,tools,max_output_tokens:2300,store:false});
  if(!main.answer)throw Object.assign(new Error("Le modèle n'a renvoyé aucun texte."),{status:502});
  if(data.verify!==true)return json({...main,verified:false});
  try{
   const checked=await respond({model,instructions,input:reviewPrompt(lastQuestion,main.answer),tools,max_output_tokens:2300,store:false});
   if(checked.answer)return json({...checked,verified:true,sources:checked.sources.length?checked.sources:main.sources});
  }catch(err){ /* Conserver la réponse initiale si la deuxième vérification échoue. */ }
  return json({...main,verified:false,verificationWarning:"La seconde vérification n'a pas abouti."});
 }catch(err){
  const timeout=err?.name==="TimeoutError"||err?.name==="AbortError";
  return json({error:timeout?"Le service IA a mis trop de temps à répondre. Réessaie.":err?.message||"Erreur interne."},timeout?504:(err?.status||500));
 }
}