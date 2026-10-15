import { summarizeRunResults } from "./github-proposal-core.mjs";

const summary=document.getElementById("github-health-status");
const history=document.getElementById("github-health-history");
const button=document.getElementById("github-health-check");
const REPO="davidderetour-ai/echecs-jeux-ia";
const BRANCH="assistant-ia-autocorrection-v1";
const ENDPOINT="https://api.github.com/repos/"+REPO+"/actions/workflows/atelier-ia-tests.yml/runs?per_page=30&branch="+encodeURIComponent(BRANCH);
const statusNames={success:"Réussite",failure:"Échec",cancelled:"Annulé",timed_out:"Délai dépassé",null:"En cours"};
function line(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
async function fetchHealth(){
 if(!summary||!history)return;
 summary.textContent="Consultation du dépôt GitHub…";
 history.replaceChildren();
 button.disabled=true;
 try{
  if(!navigator.onLine)throw Error("Hors ligne : impossible de consulter les nouveaux tests GitHub.");
  const res=await fetch(ENDPOINT,{headers:{"Accept":"application/vnd.github+json"},cache:"no-store"});
  if(!res.ok)throw Error(res.status===403?"Limite d'accès public GitHub atteinte ; réessaie plus tard.":"GitHub indisponible (erreur "+res.status+").");
  const data=await res.json();
  const list=Array.isArray(data.workflow_runs)?data.workflow_runs:[];
  const counts=summarizeRunResults(list);
  summary.textContent=counts.total?
   "Tests GitHub : "+counts.passed+" exécutions réussies sur "+counts.total+
    " terminées ("+counts.percent+" %). Historique descriptif, pas une garantie pour les futures corrections.":
   "Taux inconnu : aucune exécution terminée dans l'historique consulté.";
  for(const run of list.slice(0,7)){
   const row=document.createElement("div");row.className="github-health-row";
   const title=String(run?.conclusion||run?.status||"inconnu");
   const label=statusNames[title]||"En cours";
   const anchor=document.createElement("a");
   const url=typeof run?.html_url==="string"?new URL(run.html_url):null;
   if(url?.hostname==="github.com"&&url.protocol==="https:"){
    anchor.href=url.href;anchor.target="_blank";anchor.rel="noopener noreferrer";anchor.textContent="Voir le rapport des tests";
   }else anchor.textContent="Lien indisponible";
   row.append(line("span",label),anchor);
   history.append(row);
  }
  if(list.some(x=>x.conclusion==="failure"))history.prepend(line("p","Des tests ont échoué : examiner leurs journaux avant toute mise à jour."));
 }catch(err){summary.textContent="État GitHub non vérifié : "+String(err?.message||"erreur inconnue");}
 finally{button.disabled=false;}
}
button?.addEventListener("click",fetchHealth);
