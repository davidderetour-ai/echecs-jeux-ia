/**
 * Alicia : prépare une modification en lisant quelques fichiers du projet.
 * Aucune commande proposée n'est exécutée. Aucune PR ou fusion automatique.
 * node github-draft.mjs "Corriger une erreur décrite ici"
 */
import {readFile,writeFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {validateProposal} from "./github-proposal-core.mjs";
const ROOT=dirname(fileURLToPath(import.meta.url));
const ALLOWED=["app.js","avatar.js","tool-finder.js","expression-core.mjs","data-core.mjs","data-lab.js","mac-core.mjs","mac-lab.js","github-health.js"];
const MODEL=process.env.ALICIA_LOCAL_MODEL||"qwen3:1.7b";
export function parseModelJSON(text){
 if(typeof text!=="string")throw Error("Réponse du modèle invalide.");
 return JSON.parse(text.trim());
}
export async function loadSources(names=ALLOWED){
 const context=[];
 for(const name of names){
  if(!ALLOWED.includes(name))throw Error("Fichier non autorisé.");
  const content=await readFile(resolve(ROOT,name),"utf8");
  context.push({path:"assistant-ia/"+name,content:content.slice(0,16000)});
 }
 return context;
}
export async function prepare(task,context,fetcher=fetch){
 if(typeof task!=="string"||!task.trim()||task.length>9000)throw Error("Décris un problème en moins de 9 000 caractères.");
 const allowed=new Set(context.map(x=>x.path));
 const prompt="Tu es Alicia. Prépare une correction et explique les risques. Aucune exécution. Retourne exclusivement un objet JSON "+
  "avec title (12-100 caractères), reason (30 caractères minimum), files (1 à 3 objets path et content COMPLET), "+
  "checks (au moins un objet name). Modifie UNIQUEMENT un chemin parmi les sources. Ne propose jamais de désactiver les protections.";
 let response;
 try{
  response=await fetcher("http://127.0.0.1:11434/api/chat",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({model:MODEL,stream:false,think:false,format:"json",messages:[
    {role:"system",content:prompt},
    {role:"user",content:"BUG OU AMÉLIORATION : "+task+"\nFICHIERS : "+JSON.stringify(context)}],
    options:{temperature:0.1,num_predict:4500}}),
   signal:AbortSignal.timeout(160000)
  });
 }catch{throw Error("Moteur local indisponible : configure un modèle compatible avant de générer une correction.");}
 if(!response.ok)throw Error("Le moteur local a renvoyé "+response.status);
 let result;
 try{result=validateProposal(parseModelJSON((await response.json())?.message?.content));}
 catch(err){throw Error("Proposition rejetée : "+err.message);}
 if(result.files.length>3)throw Error("Trop de fichiers proposés.");
 if(result.files.some(f=>!allowed.has(f.path)))throw Error("Fichier non fourni : correction rejetée.");
 if(result.files.some(f=>/assistant-ia\/(permission-policy|github-proposal-core)\.mjs$/.test(f.path)))
  throw Error("Les protections ne peuvent pas être réécrites par le générateur.");
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const task=process.argv.slice(2).join(" ");
  const proposal=await prepare(task,await loadSources());
  const path=resolve(process.cwd(),"alicia-proposition.json");
  await writeFile(path,JSON.stringify(proposal,null,2)+"\n",{mode:0o600,flag:"wx"});
  console.log("Brouillon enregistré en local : "+path);
  console.log("Fichiers : "+proposal.files.map(f=>f.path).join(", "));
  console.log("Aucun test, changement ou déploiement n'a été exécuté sur ce code.");
  console.log("Pour voir l'aperçu : node github-maintainer.mjs preview alicia-proposition.json");
 }catch(err){console.error(String(err.message||err));process.exitCode=1;}
}
