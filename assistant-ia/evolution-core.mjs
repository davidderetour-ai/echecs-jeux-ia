/* Alicia : évolution coordonnée et locale, sous contrôle.
 * Aucun changement de code, voix, système, application, réseau ou fichiers du téléphone.
 * Fonctionne seulement quand Alicia est ouverte ; tests obligatoires avant adaptation.
 */
import {AliciaTraining} from "./training-core.mjs";
import {AliciaCourseLearning} from "./course-learning.mjs";
import {AliciaRequestUnderstanding} from "./understand-requests.mjs";
import {selfCheckAcademy} from "./alicia-academy.mjs";

const KEY="alicia-evolution-coordonnee-v1", SCHEMA=1, CYCLE_MESSAGES=6;
const intentTarget={
 study:"apprends les cours installés",list:"montre moi les cours",
 status:"combien de cours connais tu",test:"teste tes connaissances",
 help:"je veux que tu comprennes mes demandes",
 "mode-code":"passe en mode code","mode-repair":"passe en mode réparation",
 "mode-create":"passe en mode création","mode-teach":"passe en mode professeur"
};
const validIntent=s=>Object.hasOwn(intentTarget,s);
const result=(ok,data={})=>({ok,...data});
let seen=0,active=false,cycle=0,last=null;

function getReport(){
 const training=AliciaTraining.progress();
 const course=AliciaCourseLearning.stats();
 const academy=selfCheckAcademy();
 let memory=null,threeD=null;
 try{memory=globalThis.AliciaOriginalEngine?.inspect?.()||null;}catch{}
 try{threeD=globalThis.Alicia3D?.getStatus?.()||null;}catch{}
 return {
  revision:SCHEMA,cycle,modules:{
   demandes:{examples:training.trainedExamples,tested:training.heldOut,correct:training.correct,accuracy:training.accuracy,
     personalCorrections:training.personalExamples},
   cours:{available:course.available,indexed:course.indexed,verified:academy.passed,totalChecks:academy.tested},
   connaissances:{learnedResponses:memory?.examples??null,localAdaptations:memory?.autonomousAdaptations??null},
   apparence:{rendered:threeD?.rendered??null,model3d:threeD?.realistic??null},
   voix:{changed:false}
  },
  autonomousScope:"Données locales et paramètres évalués seulement",
  requiresPermission:["Modification du code","Installation de logiciels","Modification du système","Synchronisation externe"],
  runningOnlyWhileOpen:true,modelIsGPT6:false
 };
}
function safeStore(report){
 const record={schema:SCHEMA,cycle:report.cycle,metrics:{
  exact:report.modules.demandes.correct,tested:report.modules.demandes.tested,
  courseChecks:report.modules.cours.verified,courseCount:report.modules.cours.totalChecks
 }};
 try{globalThis.localStorage?.setItem(KEY,JSON.stringify(record));return true;}catch{return false;}
}
function notify(report){
 if(typeof window!=="undefined" && typeof CustomEvent==="function"){
  window.dispatchEvent(new CustomEvent("alicia:evolution-checked",{detail:report}));
 }
}
function evolve(reason="vérification manuelle"){
 if(active)return result(false,{reason:"Vérification déjà en cours"});
 active=true;
 try{
  const before=getReport();
  const learning=AliciaTraining.evolve(); // refuse toute régression du score sur les phrases tenues à l'écart
  let localImproved=false;
  try{
   const engine=globalThis.AliciaOriginalEngine;
   if(engine?.inspect?.().examples>=3)localImproved=Boolean(engine.autoEvolve?.());
  }catch{} // Un module ne doit jamais bloquer les autres.
  const after=getReport();
  const noRegression=after.modules.demandes.correct>=before.modules.demandes.correct &&
   after.modules.cours.verified>=before.modules.cours.verified;
  cycle++;
  const report={...after,cycle,trigger:reason,localImproved,trainingAccepted:Boolean(learning.ok),noRegression};
  last=report;
  const persisted=safeStore(report);
  notify(report);
  return result(noRegression,{...report,persisted});
 }finally{active=false;}
}
function observeAnswer(){
 seen++;
 if(seen<CYCLE_MESSAGES)return null;
 seen=0;return evolve("six réponses fournies dans l'application");
}
function status(){return last||getReport();}
function readBackup(){
 return {schema:SCHEMA,kind:"alicia-apprentissage-partage",version:"1",
  corrections:JSON.parse(AliciaTraining.exportCorrections()).corrections,
  expressions:AliciaRequestUnderstanding.aliases(),createdAt:new Date().toISOString(),
  note:"Ne comprend ni conversations, ni mots de passe, ni préférences de voix ; transfert manuel seulement."};
}
function importBackup(raw){
 if(typeof raw!=="string"||raw.length>100000)return result(false,{reason:"Sauvegarde invalide ou trop volumineuse"});
 let obj;try{obj=JSON.parse(raw);}catch{return result(false,{reason:"Fichier JSON invalide"});}
 if(obj?.schema!==SCHEMA||obj.kind!=="alicia-apprentissage-partage"||
  !Array.isArray(obj.corrections)||!Array.isArray(obj.expressions))
  return result(false,{reason:"Ce fichier n'est pas une sauvegarde d'apprentissage Alicia"});
 let accepted=0,rejected=0,aliasesAccepted=0;
 const corrections=obj.corrections.slice(0,100);
 for(const sample of corrections){
  if(!sample||typeof sample.phrase!=="string"||!validIntent(sample.intent)){rejected++;continue;}
  const r=AliciaTraining.learn(sample.phrase,sample.intent);
  if(r.ok)accepted++;else rejected++;
 }
 const aliases=obj.expressions.slice(0,30);
 for(const a of aliases){
  if(!a||typeof a.trigger!=="string"||!validIntent(a.intent)||a.trigger.length>110){rejected++;continue;}
  const taught=AliciaRequestUnderstanding.learn('Quand je dis « '+a.trigger+' », je veux dire « '+intentTarget[a.intent]+' »');
  if(taught?.answer?.includes("Expression enregistrée"))aliasesAccepted++;else rejected++;
 }
 const audit=evolve("importation autorisée par l'utilisateur");
 return result(true,{accepted,rejected,aliasesAccepted,courseCount:status().modules.cours.available,
  accuracy:status().modules.demandes.accuracy,checksPassed:audit.ok});
}
const AliciaEvolution={
 evolve,observeAnswer,status,report:getReport,exportBackup:readBackup,importBackup,
 modules:()=>["Compréhension","Cours","Entraînement","Mémoire","Conversation","Avatar 3D","Voix (inchangée)"]
};
if(typeof window!=="undefined"){
 window.AliciaEvolution=AliciaEvolution;
 if(typeof document!=="undefined"){
  document.addEventListener("alicia-original-answered",observeAnswer);
  document.addEventListener("alicia:learning-updated",()=>evolve("correction explicitement approuvée"));
 }
 // Première vérification dès l'ouverture ; ne change ni l'interface ni le système.
 evolve("ouverture d'Alicia");
}
export {AliciaEvolution};
