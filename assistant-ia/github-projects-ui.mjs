/* Alicia : accès GitHub public en lecture seule et propositions téléchargeables.
 * Les identifiants privés ne sont jamais demandés dans le navigateur.
 */
import {listPublicRepositories,prepareProposal,accessStatus,OWNER} from "./github-projects-core.mjs";
const $=id=>document.getElementById(id);
const node=(tag,value)=>{const e=document.createElement(tag);if(value!=null)e.textContent=value;return e;};
const state={loaded:false,projects:[],error:""};
function init(){
 if($("alicia-github-projects"))return;
 const root=node("details");root.id="alicia-github-projects";root.className="tool-finder";
 root.style.cssText="margin:16px 0;padding:13px;border:1px solid #687caa;border-radius:12px";
 root.append(node("summary","Mes projets GitHub — actuels et futurs"));
 const intro=node("p","Lecture des dépôts publics du compte "+OWNER+". Les nouveaux projets publics apparaissent après actualisation. Projets privés et modifications : connexion GitHub distincte obligatoire, avec ton autorisation.");
 const toolbar=node("div");toolbar.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0";
 const refresh=node("button","Actualiser les projets publics");refresh.type="button";
 const status=node("p","Non connecté aux dépôts privés. Clique pour consulter les projets publics GitHub.");status.setAttribute("role","status");
 const list=node("div");list.id="alicia-github-public-projects";
 toolbar.append(refresh);root.append(intro,toolbar,status,list);
 const proposal=node("details");proposal.style.cssText="margin-top:12px;padding:10px;border:1px solid #7890c0;border-radius:9px";
 proposal.append(node("summary","Préparer une modification pour approbation"));
 const info=node("p","Cette étape fabrique seulement un fichier de proposition. Elle ne modifie aucun projet. Sur Mac, la commande github-portfolio.mjs peut ensuite créer une pull request brouillon après ton accord dans le Terminal et une autorisation GitHub séparée.");
 proposal.append(info);
 const form=node("form");form.style.cssText="display:grid;gap:9px";
 function field(title,kind="input",placeholder=""){
  const label=node("label",title);
  const input=node(kind);input.placeholder=placeholder;
  input.style.cssText="display:block;width:100%;min-height:42px;max-width:100%;margin-top:3px;padding:8px";
  label.append(input);form.append(label);return input;
 }
 const selected=node("select");selected.style.cssText="width:100%;min-height:42px;padding:8px";
 const selectLabel=node("label","Dépôt GitHub public");selectLabel.append(selected);form.append(selectLabel);
 const title=field("Titre précis","input","Améliorer les règles de mon jeu d'échecs");
 const reason=field("But du changement et précautions","textarea","Indique ce qui doit changer, les risques, les contrôles et la sauvegarde prévue.");
 reason.rows=3;
 const filepath=field("Chemin d'un fichier autorisé","input","assistant-ia/mon-module.js");
 const content=field("Nouveau contenu du fichier","textarea","Écris ou colle le contenu proposé. Alicia ne l'exécute pas.");
 content.rows=4;
 const checks=field("Vérification à réaliser","input","Ex. lancer les tests du projet et vérifier la fonctionnalité modifiée");
 const download=node("button","Préparer le fichier de proposition");download.type="submit";
 const notice=node("p","Aucune modification GitHub ne sera effectuée depuis cette page.");notice.setAttribute("role","status");
 form.append(download,notice);proposal.append(form);root.append(proposal);
 const anchor=$("github-health")||$("chat-form");if(anchor)anchor.before(root);else document.querySelector(".shell")?.append(root);
 const draw=()=>{
  list.replaceChildren();selected.replaceChildren();
  if(!state.projects.length){list.append(node("p","Aucun dépôt public détecté. Les dépôts privés ne sont pas visibles ici."));return;}
  const ul=node("ul");ul.style.cssText="padding-left:20px;display:grid;gap:8px";
  for(const project of state.projects){
   const li=node("li"),link=node("a",project.name);link.href=project.url;link.target="_blank";link.rel="noopener noreferrer";
   li.append(link);
   if(project.description)li.append(node("small"," — "+project.description));
   ul.append(li);
   const opt=node("option",project.name);opt.value=project.name;selected.append(opt);
  }
  list.append(node("p",state.projects.length+" dépôt(s) public(s) trouvé(s), lecture seule."),ul);
 };
 async function reload(){
  if(!navigator.onLine){status.textContent="Hors ligne : conserve la dernière liste affichée ; aucune vérification GitHub possible.";return;}
  refresh.disabled=true;status.textContent="Recherche des projets publics GitHub…";
  try{
   const repos=await listPublicRepositories();
   state.projects=repos;state.loaded=true;state.error="";draw();
   status.textContent=repos.length+" projet(s) public(s) détecté(s). Aucun accès aux projets privés ni droit d'écriture n'a été accordé.";
  }catch(err){state.error=String(err?.message||err);status.textContent="Lecture GitHub impossible : "+state.error;}
  finally{refresh.disabled=false;}
 }
 refresh.addEventListener("click",reload);
 form.addEventListener("submit",e=>{
  e.preventDefault();
  if(!state.loaded){notice.textContent="Actualise d'abord la liste des projets publics.";return;}
  try{
   if(!state.projects.some(r=>r.name===selected.value))throw Error("Ce dépôt ne fait pas partie de la liste publique vérifiée.");
   const proposalObj=prepareProposal({repo:selected.value,title:title.value,reason:reason.value,
    path:filepath.value,content:content.value,checks:[checks.value]});
   const raw=JSON.stringify(proposalObj,null,2)+"\n";
   const blobUrl=URL.createObjectURL(new Blob([raw],{type:"application/json"}));
   const a=node("a");a.href=blobUrl;a.download="alicia-proposition-"+selected.value+".json";
   document.body.append(a);a.click();a.remove();
   window.addEventListener("pagehide",()=>URL.revokeObjectURL(blobUrl),{once:true});
   notice.textContent="Fichier de proposition généré pour "+selected.value+". Aucun changement envoyé à GitHub. Il faut ton autorisation dans le Terminal Mac pour créer une branche et une pull request.";
  }catch(err){notice.textContent="Proposition refusée : "+String(err?.message||err);}
 });
 window.AliciaGitHubProjects={
  open(){root.open=true;root.scrollIntoView({behavior:"smooth",block:"start"});},
  refresh:reload,projects:()=>state.projects.map(x=>({...x})),status:accessStatus,
  answer(query){
   const q=String(query||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
   if(!/\b(?:github|git hub)\b/.test(q)||!/\b(?:mes|tes|nos|tous|projets|depots|repositories)\b/.test(q)||
       /\b(?:qu est ce que|comment utiliser|comment marche)\b/.test(q))return null;
   root.open=true;
   return {answer:state.loaded?
     "Mes projets publics GitHub : "+(state.projects.length?state.projects.map(x=>x.name).join(", "):"aucun dépôt public détecté")+
      ". Ouvre la section Mes projets GitHub pour inspecter les liens et préparer une proposition. Les dépôts privés nécessitent une autorisation distincte.":
     "J'ai ouvert la rubrique Mes projets GitHub. Appuie sur « Actualiser les projets publics » pour découvrir les projets présents et futurs. Aucun accès privé ni droit de modification ne m'a encore été donné.",
    provider:"Catalogue GitHub public Alicia",local:true,verified:false,sources:[]};
  }
 };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
