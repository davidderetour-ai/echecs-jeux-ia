import {BENCHMARK,BENCHMARK_VERSION,benchmarkSummary,gradeAnswer,rubricSummary} from "./intelligence-core.mjs";

const $=id=>document.getElementById(id);
const STORAGE_KEY="alicia-evaluation-niveau-v1";
const badge=$("alicia-level"),caption=$("alicia-level-caption"),progress=$("intelligence-progress"),detail=$("intelligence-detail");
const start=$("intelligence-start"),full=$("intelligence-extended"),connection=$("connection-mode");
function safeStorage(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch{return null}}
function display(summary,date){
 if(!summary){
  badge.textContent="Non évaluée";caption.textContent="Aucun test du modèle exécuté";
  detail.textContent="Aucun score attribué avant de tester le moteur IA actif.";return;
 }
 badge.textContent=summary.label+" · "+summary.percent+" %";
 const when=date?new Date(date).toLocaleDateString("fr-FR"):"date inconnue";
 caption.textContent=summary.passed+"/"+summary.total+" exercices réussis · "+when;
 detail.textContent="Score observé sur "+summary.total+" exercices simples. Ni QI, ni preuve de capacités dans tous les domaines.";
}
function restore(){
 const data=safeStorage();
 if(!data||data.version!==BENCHMARK_VERSION||!Array.isArray(data.samples)||typeof data.date!=="string")return display(null);
 const age=Date.now()-Date.parse(data.date);
 if(!Number.isFinite(age)||age<0||age>30*86400000){display(null);return;}
 try{display(benchmarkSummary(data.samples,data.samples.length),data.date)}catch{display(null)}
}
restore();
let busy=false;
async function evaluate(){
 if(busy)return;
 // Pour garantir un test sans coût, on ne sollicite JAMAIS l'API cloud automatiquement.
 if(connection?.value!=="local"){
  progress.textContent="Sélectionne « Local gratuit ». L'évaluation en ligne n'est pas lancée pour éviter des frais API.";return;
 }
 const questions=BENCHMARK.slice(0,full?.checked?10:5);
 const code=$("access")?.value?.trim()||"";
 const samples=[];
 start.disabled=true;busy=true;
 const session=new AbortController();
 try{
  for(const [i,q] of questions.entries()){
   progress.textContent="Test "+(i+1)+"/"+questions.length+" : "+q.topic+"…";
   const headers={"Content-Type":"application/json"};
   if(code)headers["X-App-Code"]=code;
   const r=await fetch("./api/local/chat",{
    method:"POST",headers,signal:session.signal,
    body:JSON.stringify({messages:[{role:"user",content:q.question}],mode:"general",verify:false,web:false,review:false,notes:[]})
   });
   let data;try{data=await r.json()}catch{throw Error("Le serveur local ne répond pas en JSON.")}
   if(!r.ok)throw Error(data.error||"Serveur local indisponible ("+r.status+").");
   if(typeof data.answer!=="string")throw Error("Réponse IA manquante.");
   samples.push({id:q.id,topic:q.topic,correct:gradeAnswer(q,data.answer)});
  }
  const result=benchmarkSummary(samples,questions.length);
  const date=new Date().toISOString();
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:BENCHMARK_VERSION,samples,date}))}catch{}
  display(result,date);
  progress.textContent="Évaluation terminée : "+result.passed+"/"+result.total+" réponses correctes.";
 }catch(e){
  progress.textContent="Test interrompu : "+String(e.message||e)+". Aucun nouveau niveau attribué.";
 }finally{start.disabled=false;busy=false;}
}
start?.addEventListener("click",evaluate);
$("intelligence-reset")?.addEventListener("click",()=>{
 if(busy)return;
 try{localStorage.removeItem(STORAGE_KEY)}catch{}
 display(null);progress.textContent="Évaluation effacée sur cet appareil.";
});
$("capability-evaluate")?.addEventListener("click",()=>{
 const kind=$("capability-kind").value,consent=$("capability-consent").checked;
 const result=$("capability-result");
 if(kind==="inert"){
  result.textContent="Objet passif : une note d'intelligence n'est pas pertinente. Compare plutôt des propriétés mesurables (durabilité, fiabilité, etc.).";return;
 }
 if(kind==="human"&&!consent){
  result.textContent="Pour une personne, demande sa participation volontaire à des exercices de compétences. Aucun QI ni diagnostic ne sera établi.";return;
 }
 const evidence=$("capability-evidence").value.trim();
 if(evidence.length<30){
  result.textContent="Décris au moins 30 caractères de faits ou résultats observables avant toute évaluation.";return;
 }
 const ratings=[...document.querySelectorAll("[data-capability-rating]")].map(x=>Number(x.value));
 try{
  const summary=rubricSummary(ratings);
  if(!summary){result.textContent="Données insuffisantes : évalue au moins 3 critères sur 5, et indique « Non observé » si tu ne sais pas.";return;}
  result.textContent=summary.percent+" % des points de la grille descriptive ("+summary.observed+" critères observés sur 5). Ce n'est PAS un niveau d'intelligence ni un QI, et ce chiffre n'est pas comparable entre sujets.";
 }catch(e){result.textContent=String(e.message||e);}
});
