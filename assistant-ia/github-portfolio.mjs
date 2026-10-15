/**
 * Alicia : connexion facultative à TOUS les dépôts du compte GitHub autorisé.
 * Aucun secret dans le navigateur. Ne fusionne jamais et ne publie pas de branche sans accord.
 * Node.js 20+ requis pour ce programme, sur un ordinateur compatible.
 *
 * node github-portfolio.mjs list
 * node github-portfolio.mjs inspect NOM_DU_REPO
 * node github-portfolio.mjs preview NOM_DU_REPO proposition.json
 * node github-portfolio.mjs propose NOM_DU_REPO proposition.json
 */
import {readFile} from "node:fs/promises";
import {stdin,stdout} from "node:process";
const OWNER="davidderetour-ai",TOKEN=process.env.ALICIA_GITHUB_TOKEN||"";
const CMD=process.argv[2]||"help";
const API="https://api.github.com";
const forbidden=/^(?:\.|\/)|\.\.|\/\.|\/\//;
const sensitive=/(?:^|\/)(?:node_modules|\.github|\.git|secrets?|credentials?|passwords?)(?:\/|$)/i;
const keyExtension=/\.(?:env|key|pem|p12|pfx|crt|mobileprovision|keystore|db|sqlite|lock)$/i;
const keyText=/(?:gh[pousr]_[A-Za-z0-9_]{25,}|github_pat_[A-Za-z0-9_]{25,}|sk-[A-Za-z0-9_-]{25,})/;
function validName(n){return typeof n==="string"&&/^[A-Za-z0-9_.-]{1,100}$/.test(n)&&n!=="."&&n!=="..";}
function validPath(path){
 return typeof path==="string"&&path.length<190&&/^[A-Za-z0-9_-][\w./-]*$/.test(path)&&
  !forbidden.test(path)&&!sensitive.test(path)&&!keyExtension.test(path)&&
  !["github-portfolio.mjs","github-maintainer.mjs","github-proposal-core.mjs","permission-policy.mjs"].includes(path.split("/").at(-1));
}
export function validatePortfolioProposal(value){
 if(!value||typeof value!=="object")throw Error("Proposition incorrecte.");
 if(typeof value.title!=="string"||value.title.trim().length<12||value.title.length>100)throw Error("Titre explicite requis.");
 if(typeof value.reason!=="string"||value.reason.trim().length<35||value.reason.length>3000)throw Error("Justification avec risque et méthode de vérification obligatoire.");
 if(!Array.isArray(value.files)||value.files.length<1||value.files.length>4)throw Error("De 1 à 4 fichiers maximum.");
 if(!Array.isArray(value.checks)||!value.checks.length||value.checks.some(c=>typeof c!=="string"||!c.trim()||c.length>160))throw Error("Liste de tests reproductibles obligatoire.");
 const paths=new Set();
 for(const f of value.files){
  if(!validPath(f.path))throw Error("Fichier non autorisé : "+String(f.path));
  if(typeof f.content!=="string"||f.content.length<1||f.content.length>100000)throw Error("Contenu invalide.");
  if(keyText.test(f.content))throw Error("Clé secrète détectée dans le correctif.");
  if(paths.has(f.path))throw Error("Fichier en double.");
  paths.add(f.path);
 }
 return {title:value.title.trim(),reason:value.reason.trim(),
  checks:value.checks,files:value.files.map(x=>({path:x.path,content:x.content}))};
}
async function api(path,method="GET",data){
 const headers={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"alicia-portfolio"};
 if(TOKEN)headers.Authorization="Bearer "+TOKEN;
 if(data!==undefined)headers["Content-Type"]="application/json";
 const res=await fetch(API+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw Error("GitHub "+res.status+" : "+String(body.message||"Accès refusé").slice(0,150));
 return body;
}
async function repositories(){
 if(!TOKEN)throw Error("Jeton GitHub privé requis pour découvrir aussi les dépôts privés.");
 const items=[];
 for(let page=1;page<=20;page++){
  const list=await api("/user/repos?affiliation=owner&visibility=all&per_page=100&page="+page);
  if(!Array.isArray(list))throw Error("Liste des projets indisponible.");
  for(const x of list)if(x.owner?.login?.toLowerCase()===OWNER.toLowerCase()&&!x.archived){
   items.push({name:x.name,private:x.private,branch:x.default_branch,url:x.html_url});
  }
  if(list.length<100)break;
 }
 return items;
}
async function verifyRepo(name){
 if(!validName(name))throw Error("Nom de projet GitHub invalide.");
 const repo=await api("/repos/"+OWNER+"/"+encodeURIComponent(name));
 if(repo.owner?.login?.toLowerCase()!==OWNER.toLowerCase())throw Error("Alicia ne peut pas agir sur un dépôt hors du compte autorisé.");
 if(repo.archived||repo.disabled)throw Error("Dépôt archivé ou désactivé.");
 return repo;
}
async function promptConfirmation(fullName){
 if(!stdin.isTTY)throw Error("Permission refusée : Terminal interactif obligatoire.");
 stdout.write("Pour créer uniquement une PR dans "+fullName+", saisis : AUTORISER PR "+fullName+"\n> ");
 stdin.setEncoding("utf8");
 return new Promise((resolve,reject)=>{
  stdin.once("data",s=>resolve(s.trim()==="AUTORISER PR "+fullName));
  stdin.once("error",reject);
 });
}
async function showRepo(name){
 const repo=await verifyRepo(name);
 console.log("Projet : "+repo.full_name+" | Privé : "+(repo.private?"oui":"non")+" | Branche : "+repo.default_branch);
 console.log("État : "+(repo.archived?"archivé":"actif")+" | "+repo.html_url);
}
async function propose(name,filepath,previewOnly){
 const r=await verifyRepo(name);
 if(!filepath||filepath.length>400)throw Error("Indique un fichier JSON de proposition local.");
 const content=await readFile(filepath,"utf8");
 const proposal=validatePortfolioProposal(JSON.parse(content));
 console.log("Dépôt autorisé : "+r.full_name);
 console.log("Objectif : "+proposal.title+"\n"+proposal.reason);
 for(const f of proposal.files)console.log("Fichier proposé : "+f.path+" ("+f.content.length+" caractères)");
 console.log("Tests nécessaires : "+proposal.checks.join(" ; "));
 console.log("Aucune mise à jour ne sera appliquée au Mac, ni fusionnée dans la branche principale.");
 if(previewOnly)return;
 if(!TOKEN)throw Error("Jeton GitHub personnel requis.");
 if(!(await promptConfirmation(r.full_name))){console.log("Refusé : aucune écriture GitHub.");return;}
 const base=r.default_branch;
 if(!validName(base))throw Error("Branche par défaut invalide.");
 const b=await api("/repos/"+r.full_name+"/git/ref/heads/"+encodeURIComponent(base));
 const sha=b?.object?.sha;
 if(!sha)throw Error("Commit de base introuvable.");
 const branch="alicia-proposal-"+Date.now();
 await api("/repos/"+r.full_name+"/git/refs","POST",{ref:"refs/heads/"+branch,sha});
 for(const item of proposal.files){
  let original=null;
  try{original=await api("/repos/"+r.full_name+"/contents/"+item.path+"?ref="+encodeURIComponent(base));}
  catch(e){if(!String(e.message).includes("GitHub 404"))throw e;}
  const payload={message:"Alicia : "+proposal.title,branch,content:Buffer.from(item.content).toString("base64")};
  if(original?.sha)payload.sha=original.sha;
  await api("/repos/"+r.full_name+"/contents/"+item.path,"PUT",payload);
 }
 const body="Brouillon généré par Alicia à la demande du propriétaire.\n\n"+proposal.reason+"\n\nTests AVANT fusion :\n"+
 proposal.checks.map(x=>"- [ ] "+x).join("\n")+
 "\n\nAucune fusion ni déploiement automatique. Examiner tous les fichiers et risques.";
 const pr=await api("/repos/"+r.full_name+"/pulls","POST",{
  title:"Alicia : "+proposal.title,body,head:branch,base,draft:true
 });
 console.log("PR en brouillon créée : "+pr.html_url);
}
try{
 if(CMD==="list"){
  const repos=await repositories();
  console.log("Projets accessibles : "+repos.length+" (projets futurs possibles si la permission GitHub couvre « Tous les dépôts »).");
  for(const r of repos)console.log((r.private?"PRIVÉ ":"PUBLIC ")+r.name+" — "+r.url);
 }else if(CMD==="inspect")await showRepo(process.argv[3]);
 else if(CMD==="preview")await propose(process.argv[3],process.argv[4],true);
 else if(CMD==="propose")await propose(process.argv[3],process.argv[4],false);
 else console.log("Alicia : list | inspect DEPOT | preview DEPOT FICHIER.json | propose DEPOT FICHIER.json");
}catch(e){console.error("Alicia GitHub : "+String(e.message||e));process.exitCode=1;}
