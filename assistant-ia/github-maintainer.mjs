/**
 * Alicia mainteneur GitHub, usage local (Node.js >=20).
 * Aucun token dans l'interface ou dans Git ; pas de fusion automatique.
 *
 * node github-maintainer.mjs status
 * node github-maintainer.mjs preview proposition.json
 * ALICIA_GITHUB_TOKEN=... node github-maintainer.mjs propose proposition.json
 */
import { readFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { validateProposal, summarizeRunResults, EXPECTED_REPOSITORY } from "./github-proposal-core.mjs";
const API="https://api.github.com/repos/"+EXPECTED_REPOSITORY;
const TOKEN=process.env.ALICIA_GITHUB_TOKEN||"";
const BASE=process.env.ALICIA_GITHUB_BASE_BRANCH||"main";
const ACTION=process.argv[2]||"help";

async function request(path,{method="GET",data}={}){
 const headers={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"alicia-maintainer"};
 if(TOKEN)headers.authorization="Bearer "+TOKEN;
 if(data!==undefined)headers["Content-Type"]="application/json";
 const response=await fetch(API+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
 const json=await response.json().catch(()=>({}));
 if(!response.ok){throw Error("GitHub "+response.status+": "+String(json.message||"requête refusée").slice(0,200));}
 return json;
}
async function getProposal(path){
 if(!path||path.length>300)throw Error("Indique un fichier JSON de proposition local.");
 return validateProposal(JSON.parse(await readFile(path,"utf8")));
}
function preview(p){
 console.log("\nALICIA — APERÇU DU CHANGEMENT (aucun envoi)");
 console.log("Dépôt :",EXPECTED_REPOSITORY," | Branche de base :",BASE);
 console.log("Titre :",p.title,"\nBut :",p.reason);
 for(const f of p.files)console.log("Fichier proposé :",f.path,"("+f.content.length+" caractères)");
 console.log("Vérifications à effectuer :");
 for(const check of p.checks)console.log(" - "+check);
 console.log("Taux réel de réussite : inconnu tant que les tests n'ont pas été exécutés et validés.");
 console.log("Jamais de fusion automatique vers la branche utilisée.");
}
async function status(){
 const data=await request("/actions/workflows/atelier-ia-tests.yml/runs?per_page=20");
 const runs=(data.workflow_runs||[]).filter(x=>x.head_branch===BASE);
 const summary=summarizeRunResults(runs);
 console.log("Alicia — état réel des tests du projet : "+summary.passed+"/"+summary.total+" exécutions terminées réussies"+(summary.percent===null?" (taux inconnu)":" ("+summary.percent+" %)"));
 for(const run of runs.slice(0,7)){console.log(run.conclusion||run.status,run.name,run.html_url);}
 console.log("Il s'agit d'un historique descriptif, pas d'une chance de réussite future.");
}
async function confirm(){
 if(!stdin.isTTY)throw Error("Terminal interactif obligatoire : impossible d'approuver cette proposition en mode automatique.");
 stdout.write("\nPour autoriser uniquement la création d'une branche et d'une PR, écris CREER PR ALICIA : ");
 stdin.setEncoding("utf8");
 return await new Promise((resolve,reject)=>{
  stdin.once("data",v=>resolve(v.trim()==="CREER PR ALICIA"));
  stdin.once("error",reject);
 });
}
async function createProposal(p){
 if(!TOKEN||TOKEN.length<15)throw Error("Configure un jeton GitHub privé, limité au dépôt, dans ALICIA_GITHUB_TOKEN sur le serveur local uniquement.");
 preview(p);
 console.log("Attention : le jeton doit autoriser Contents et Pull Requests sur ce dépôt UNIQUEMENT.");
 if(!(await confirm())){console.log("Refusé : aucune modification.");return;}
 const base=await request("/git/ref/heads/"+encodeURIComponent(BASE));
 const sha=base?.object?.sha;
 if(!sha)throw Error("Référence de branche introuvable.");
 const ref="alicia-proposal-"+Date.now();
 await request("/git/refs",{method:"POST",data:{ref:"refs/heads/"+ref,sha}});
 for(const file of p.files){
  let originalSha=null;
  try{const original=await request("/contents/"+file.path+"?ref="+encodeURIComponent(BASE));originalSha=original.sha||null;}
  catch(err){if(!String(err.message).includes("GitHub 404:"))throw err;}
  const value={message:"Alicia : "+p.title,path:file.path,branch:ref,content:Buffer.from(file.content,"utf8").toString("base64")};
  if(originalSha)value.sha=originalSha;
  await request("/contents/"+file.path,{method:"PUT",data:value});
 }
 const body="## Objectif\n"+p.reason+"\n\n## Contrôles exigés avant toute fusion\n"+p.checks.map(x=>"- [ ] "+x).join("\n")+
 "\n\n## Sécurité\nProposition créée après accord explicite. Aucune fusion automatique, aucun déploiement ni modification d'un appareil. Examiner le diff et attendre les tests CI.\n";
 const pr=await request("/pulls",{method:"POST",data:{title:"Alicia : "+p.title,head:ref,base:BASE,body,draft:true}});
 console.log("Proposition enregistrée sur une nouvelle branche : "+pr.html_url);
 console.log("Vérifie la PR, les tests et les changements ; la fusion exige toujours ta décision.");
}
try{
 if(ACTION==="status")await status();
 else if(ACTION==="preview")preview(await getProposal(process.argv[3]));
 else if(ACTION==="propose")await createProposal(await getProposal(process.argv[3]));
 else console.log("Utilisation : node github-maintainer.mjs status | preview proposition.json | propose proposition.json");
}catch(err){console.error("Alicia — erreur : "+String(err.message||err));process.exitCode=1;}
