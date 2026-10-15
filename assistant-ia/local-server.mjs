/**
 * Alicia local : serveur statique + passerelle Ollama.
 * Aucune API cloud, aucun abonnement ni cle API.
 * Par defaut, ECOUTE UNIQUEMENT SUR 127.0.0.1.
 * Mode LAN opt-in : node local-server.mjs --lan avec ALICIA_LOCAL_TOKEN.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, dirname, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import { cleanMessages } from "./netlify/functions/chat.mjs";

const ROOT=dirname(fileURLToPath(import.meta.url));
const IS_LAN=process.argv.includes("--lan");
const HOST=IS_LAN?"0.0.0.0":"127.0.0.1";
const PORT=Number(process.env.ALICIA_PORT||8765);
const TOKEN=process.env.ALICIA_LOCAL_TOKEN||"";
const MODEL=process.env.ALICIA_LOCAL_MODEL||"qwen3:1.7b";
const OLLAMA="http://127.0.0.1:11434/api/chat";
if(!Number.isInteger(PORT)||PORT<1024||PORT>65535)throw Error("ALICIA_PORT invalide (1024 à 65535)");
if(IS_LAN&&TOKEN.length<16)throw Error("En mode --lan, définir ALICIA_LOCAL_TOKEN d'au moins 16 caractères avant de démarrer.");

const security={
 "X-Content-Type-Options":"nosniff",
 "X-Frame-Options":"DENY",
 "Referrer-Policy":"no-referrer",
 "Cache-Control":"no-store",
 "Content-Security-Policy":"default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
};
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".json":"application/json; charset=utf-8",".png":"image/png",".ico":"image/x-icon"};
const json=(res,status,obj)=>{res.writeHead(status,{...security,"Content-Type":"application/json; charset=utf-8"});res.end(JSON.stringify(obj));};
function authorized(input){
 if(!IS_LAN)return true;
 if(typeof input!=="string"||!input||!TOKEN)return false;
 const a=Buffer.from(input),b=Buffer.from(TOKEN);
 return a.length===b.length&&timingSafeEqual(a,b);
}
function sameOrigin(req){
 const origin=req.headers.origin;
 if(!origin)return true;
 try{
  const u=new URL(origin);
  return u.host===req.headers.host && u.protocol==="http:";
 }catch{return false;}
}
function parseJSON(req,max=46000){
 return new Promise((resolve,reject)=>{
  let size=0,parts=[];
  req.on("data",chunk=>{
   size+=chunk.length;
   if(size>max){reject(Object.assign(new Error("Requête trop volumineuse."),{code:413}));req.destroy();return;}
   parts.push(chunk);
  });
  req.on("end",()=>{
   try{resolve(JSON.parse(Buffer.concat(parts).toString("utf8")))}
   catch{reject(Object.assign(new Error("JSON incorrect."),{code:400}))}
  });
  req.on("error",reject);
 });
}
const MODE_HINTS={
 general:"Réponds avec précision et honnêteté ; reconnais les limites de tes connaissances.",
 code:"Aide en programmation et tests ; n'affirme pas avoir exécuté du code.",
 repair:"Propose un diagnostic progressif et des sauvegardes ; ne modifie jamais des appareils sans permission.",
 create:"Conçois des applications et des plans vérifiables, sans prétendre avoir déployé.",
 teach:"Explique en français simple avec exemples et exercices.",
 analysis:"Sépare données, calculs, hypothèses et conclusions ; n'invente pas de sources.",
 french:"Corrige orthographe, syntaxe, accords et grammaire en expliquant les corrections.",
 math:"Résous avec étapes, unités, cohérence et contrôles numériques.",
 science:"Sépare résultats établis, expériences, théories et incertitudes.",
 geography:"Explique géographie et cartes ; distingue faits historiques et chiffres actuels non vérifiés.",
 history:"Contextualise dates, sources et interprétations sans inventer de témoignages.",
 arts:"Aide au dessin, à la perspective, à la couleur et aux arts plastiques.",
 music:"Explique solfège, rythme, composition et arrangements ; n'invente pas de fichier audio produit.",
 singing:"Enseigne le chant et la technique vocale avec exercices doux et conseils de prudence."
};
function prompt(mode,notes=[]){
 const known=Object.hasOwn(MODE_HINTS,mode)?mode:"general";
 const preferences=Array.isArray(notes)?notes.filter(x=>typeof x==="string").slice(0,8).map(x=>x.slice(0,240)).join(" ; "):"";
 return "Tu t'appelles Alicia, assistante personnelle en français. "+MODE_HINTS[known]+
 " Si tu ne sais pas, dis-le. Pas d'accès Internet dans ce mode ; ne prétends pas avoir vérifié l'actualité. "+
 "Distingue faits, calculs et suppositions. Exige une permission spécifique avant tout changement ou installation. "+
 "Préférences facultatives de l'utilisateur : "+preferences;
}
async function ollama(messages,mode,notes){
 let response;
 try{
  response=await fetch(OLLAMA,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({model:MODEL,stream:false,think:false,messages:[{role:"system",content:prompt(mode,notes)},...messages],options:{temperature:0.3,num_predict:1900}}),
   signal:AbortSignal.timeout(150000)
  });
 }catch(err){
  if(err?.name==="TimeoutError")throw Object.assign(new Error("Le modèle local met trop de temps à répondre."),{code:504});
  throw Object.assign(new Error("Ollama inaccessible. Installe Ollama, puis télécharge le modèle : ollama pull "+MODEL),{code:503});
 }
 if(!response.ok){
  const message=response.status===404
   ?"Modèle local introuvable. Lance : ollama pull "+MODEL
   :"Ollama a signalé une erreur ("+response.status+").";
  throw Object.assign(new Error(message),{code:503});
 }
 const data=await response.json();
 const answer=String(data?.message?.content||"").trim();
 if(!answer)throw Object.assign(new Error("Réponse vide du modèle local."),{code:502});
 return answer.replace(/<think>[\s\S]*?<\/think>\s*/g,"").trim();
}
function reviewMessage(question,answer){
 return "Relis cette réponse de façon critique : corrige uniquement ce qui est justifiable. N'invente pas de faits, données, expériences ou sources. Réponds avec la réponse finale corrigée, sans prétendre l'avoir vérifiée avec Internet.\nQUESTION : "+question+"\nRÉPONSE : "+answer;
}
async function chat(req,res){
 if(!sameOrigin(req))return json(res,403,{error:"Origine non autorisée."});
 if(!req.headers["content-type"]?.startsWith("application/json"))return json(res,415,{error:"Type JSON requis."});
 if(!authorized(req.headers["x-app-code"]))return json(res,401,{error:"Code d'accès local incorrect."});
 let data;
 try{data=await parseJSON(req)}catch(err){return json(res,err.code||400,{error:err.message})}
 const original=cleanMessages(data?.messages);
 const review=data?.review===true;
 if(!original.length||(review?original.at(-1).role!=="assistant":original.at(-1).role!=="user"))return json(res,400,{error:"Conversation mal formée."});
 const mode=typeof data.mode==="string"?data.mode:"general",notes=data.notes||[];
 const lastQuestion=[...original].reverse().find(x=>x.role==="user")?.content||"";
 try{
  if(review){
   const result=await ollama([{role:"user",content:reviewMessage(lastQuestion,original.at(-1).content)}],mode,notes);
   return json(res,200,{answer:result,verified:true,local:true,sources:[]});
  }
  const first=await ollama(original,mode,notes);
  if(data.verify!==true)return json(res,200,{answer:first,verified:false,local:true,sources:[]});
  try{
   const corrected=await ollama([{role:"user",content:reviewMessage(lastQuestion,first)}],mode,notes);
   return json(res,200,{answer:corrected,verified:true,local:true,sources:[]});
  }catch{return json(res,200,{answer:first,verified:false,local:true,sources:[],verificationWarning:"Deuxième vérification indisponible."})}
 }catch(err){return json(res,err.code||500,{error:err.message||"Erreur locale."})}
}
async function serveStatic(pathname,res){
 let decoded;
 try{decoded=decodeURIComponent(pathname)}catch{return json(res,400,{error:"Chemin incorrect."})}
 if(decoded.includes("\0"))return json(res,400,{error:"Chemin incorrect."});
 const relative=decoded==="/"?"index.html":decoded.replace(/^\/+/,"");
 if(relative.startsWith(".")||relative.includes("\\")||relative.split("/").some(part=>part.startsWith(".")||part===".."))return json(res,404,{error:"Fichier introuvable."});
 const full=resolve(ROOT,relative);
 if(!full.startsWith(ROOT+sep))return json(res,404,{error:"Fichier introuvable."});
 const extension=extname(full);
 if(!Object.hasOwn(MIME,extension))return json(res,404,{error:"Fichier introuvable."});
 try{
  const content=await readFile(full);
  res.writeHead(200,{...security,"Content-Type":MIME[extension],...(extension===".html"?{"Cache-Control":"no-cache"}:{})});
  res.end(content);
 }catch{return json(res,404,{error:"Fichier introuvable."})}
}
const server=createServer((req,res)=>{
 const parsed=new URL(req.url||"/","http://localhost");
 if(parsed.pathname==="/api/local/status"&&req.method==="GET"){
  return json(res,200,{available:true,mode:"local",model:MODEL,lan:IS_LAN,protected:IS_LAN});
 }
 if(parsed.pathname==="/api/local/chat"){
  if(req.method!=="POST")return json(res,405,{error:"Méthode POST requise."});
  return void chat(req,res);
 }
 if(req.method!=="GET"&&req.method!=="HEAD")return json(res,405,{error:"Méthode non autorisée."});
 return void serveStatic(parsed.pathname,res);
});
server.listen(PORT,HOST,()=>{
 console.log("Alicia locale : http://"+(IS_LAN?"ADRESSE-IP-DU-PC":HOST)+":"+PORT);
 console.log("Modèle : "+MODEL+" | Internet non nécessaire une fois le modèle installé.");
 if(IS_LAN)console.log("ATTENTION : réseau local seulement, sans chiffrement HTTPS. Utilise un Wi-Fi de confiance ; n'ouvre pas ce port sur Internet.");
});
