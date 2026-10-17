/* Alicia — catalogue GitHub public + préparation de propositions.
 * Lecture publique uniquement, aucun jeton ou mot de passe dans l'interface.
 * L'accès privé et la création d'une pull request doivent être autorisés séparément
 * via le client Mac sécurisé github-portfolio.mjs (pas de modification automatique).
 */
export const OWNER="davidderetour-ai";
export const MAIN_GAME={name:"Échecs & Jeux IA",repository:"echecs-jeux-ia",website:"https://davidderetour-ai.github.io/echecs-jeux-ia/index.html",source:"https://github.com/davidderetour-ai/echecs-jeux-ia",entry:"index.html"};
const API="https://api.github.com",MAX_PAGES=5;
const SAFE_NAME=/^[A-Za-z0-9_.-]{1,100}$/;
const SECRET=/(?:gh[pousr]_[A-Za-z0-9_]{25,}|github_pat_[A-Za-z0-9_]{25,}|sk-[A-Za-z0-9_-]{20,}|password\s*[:=]|mot de passe\s*[:=]|bearer\s+[A-Za-z0-9_.-]{12,})/i;
const FORBIDDEN=/(?:^|\/)(?:\.github|\.git|node_modules|secrets?|credentials?|passwords?|\.env)(?:\/|$)/i;
const EXT=/\.(?:env|key|pem|p12|pfx|crt|mobileprovision|keystore|db|sqlite|lock)$/i;
export const validName=name=>typeof name==="string"&&SAFE_NAME.test(name)&&name!=="."&&name!=="..";
export function validProjectFile(path){
 return typeof path==="string"&&path.length>0&&path.length<=180&&
  /^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(path)&&
  !path.startsWith("/")&&!path.includes("..")&&!FORBIDDEN.test(path)&&!EXT.test(path)&&
  !["github-portfolio.mjs","github-maintainer.mjs","github-proposal-core.mjs","permission-policy.mjs",
    "evolution-core.mjs","github-projects-core.mjs"].includes(path.split("/").at(-1));
}
export function validatePublicRepo(data){
 if(!data||typeof data!=="object"||!validName(data.name)||
  data.owner?.login?.toLowerCase()!==OWNER.toLowerCase()||data.private||data.archived||data.disabled)return null;
 const url="https://github.com/"+OWNER+"/"+data.name;
 return {name:data.name,fullName:OWNER+"/"+data.name,url,description:String(data.description||"").slice(0,180),
  branch:validName(data.default_branch)?data.default_branch:"main",updated:String(data.updated_at||"").slice(0,32),
  private:false,hasWriteAccess:false};
}
export async function listPublicRepositories({fetcher=fetch,pages=MAX_PAGES}={}){
 const result=[],seen=new Set();
 for(let page=1;page<=Math.min(MAX_PAGES,Math.max(1,pages));page++){
  const path=API+"/users/"+OWNER+"/repos?type=owner&sort=updated&direction=desc&per_page=100&page="+page;
  const response=await fetcher(path,{headers:{"Accept":"application/vnd.github+json"},cache:"no-store"});
  if(!response.ok)throw Error("GitHub public indisponible (code "+response.status+").");
  const list=await response.json();
  if(!Array.isArray(list))throw Error("Réponse GitHub invalide.");
  for(const data of list){
   const project=validatePublicRepo(data);
   if(project&&!seen.has(project.name)){result.push(project);seen.add(project.name);}
  }
  if(list.length<100)break;
 }
 return result;
}
export async function inspectPublicRepository(name,{fetcher=fetch}={}){
 if(!validName(name))throw Error("Nom de dépôt invalide.");
 const endpoint=API+"/repos/"+OWNER+"/"+encodeURIComponent(name);
 const response=await fetcher(endpoint,{headers:{"Accept":"application/vnd.github+json"},cache:"no-store"});
 if(!response.ok)throw Error("Dépôt public inaccessible sur GitHub (code "+response.status+").");
 const data=await response.json();
 const repo=validatePublicRepo(data);
 if(!repo)throw Error("Dépôt privé, archivé ou appartenant à un autre compte.");
 return repo;
}
export function prepareProposal({repo,title,reason,path,content,checks}){
 if(!validName(repo))throw Error("Choisis un dépôt autorisé.");
 if(typeof title!=="string"||title.trim().length<12||title.length>100)throw Error("Titre de 12 à 100 caractères requis.");
 if(typeof reason!=="string"||reason.trim().length<35||reason.length>3000)throw Error("Explique le changement et ses risques (35 caractères minimum).");
 if(!validProjectFile(path))throw Error("Chemin du fichier refusé pour la sécurité.");
 if(typeof content!=="string"||!content.length||content.length>100000||SECRET.test(content))throw Error("Contenu invalide ou secret détecté.");
 if(!Array.isArray(checks)||!checks.length||checks.length>10||
   checks.some(v=>typeof v!=="string"||!v.trim()||v.length>160))throw Error("Ajoute au moins un contrôle reproductible.");
 return {title:title.trim(),reason:reason.trim(),checks:checks.map(v=>v.trim()),
  files:[{path,content}]};
}
export const accessStatus=()=>({
 publicRead:true,privateRead:false,writeConnected:false,
 futurePublicRepos:true,futurePrivateReposRequireAuthorization:true,
 approvalPerChange:true,autoMerge:false,codeExecution:false,
 authorization:"Configurer sur Mac un jeton GitHub restreint au propriétaire, conservé hors navigateur. Aucun accès privé autorisé par cette page."
});
