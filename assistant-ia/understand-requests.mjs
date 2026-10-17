/* Alicia — compréhension locale des demandes françaises.
 * Routage explicable par intentions, pas un entraînement neuronal ni une exécution de commandes système.
 * Seules les expressions enseignées volontairement sont conservées sur l'appareil.
 */
import {AliciaCourseLearning} from "./course-learning.mjs";
import {LESSONS,selfCheckAcademy} from "./alicia-academy.mjs";
import {COURSES} from "./python-vscode-course.mjs";

const STORE="alicia-intentions-personnalisees-v1",MAX_ALIASES=30;
const normal=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
 .replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g," ").replace(/\s+/g," ").trim();
const secrets=/\b(?:mot de passe|password|api key|token|jeton|cle secrete|bearer|sk-[a-z0-9]{12,})\b/i;
const stored=()=>{
 try{
  const data=JSON.parse(globalThis.localStorage?.getItem(STORE)||"[]");
  if(!Array.isArray(data))return [];
  return data.filter(x=>x&&typeof x.trigger==="string"&&typeof x.intent==="string"&&x.trigger.length<150)
    .filter(x=>["study","list","status","test","help","mode-code","mode-repair","mode-create","mode-teach"].includes(x.intent)).slice(-MAX_ALIASES);
 }catch{return [];}
};
let aliases=stored(),previous=null;
const answer=(value,extra={})=>({answer:value,provider:"Compréhension locale Alicia",local:true,verified:false,sources:[],...extra});
const modeNames={code:"Code",repair:"Réparation",create:"Création",teach:"Professeur"};
function classify(query,{useAliases=true}={}){
 const n=normal(query);
 if(!n||n.length>500)return {intent:null,confidence:0};
 if(useAliases){
  const custom=aliases.find(x=>x.trigger===n);
  if(custom)return {intent:custom.intent,confidence:1,origin:"expression enseignée"};
 }
 // Les demandes d'installation et les corrections libres ne sont pas une autorisation de modifier l'appareil.
 if(/\b(?:installer|installe|telecharger|supprimer|effacer|desinstaller|modifier les fichiers)\b/.test(n)
    && !/\b(?:deja installes?|cours installes?|fiches installees?)\b/.test(n))
  return {intent:null,confidence:0,reason:"action sur fichiers non autorisée"};
 if(/^(?:apprends|apprend|retiens|memorise|correction)\s*:/.test(n))return {intent:null,confidence:0};
 // Une courte demande comme « apprend python » doit lancer un vrai cours local,
 // plutôt que tomber dans une réponse approximative du moteur général.
 // Ne confondre ni l'étude des fiches avec un apprentissage neuronal ni avec
 // l'autorisation d'installer Python sur l'ordinateur.
 if(/\b(?:apprend|apprends|apprendre|etudie|etudier|etudies|enseigne|enseigner|explique|expliquer|montre)\b/.test(n)
    && /\bpython\b/.test(n)
    && !/\b(?:print|input|variables?|boucles?|fonctions?|fichiers?|debug|vscode|vs code|pip|terminal|json|venv|conditions?)\b/.test(n))
  return {intent:"study-python",confidence:.98};
 if(/\b(?:mets toi|passe|active|bascule)\s+(?:en|au|sur)\s+mode\s+(code|programmation|reparation|creation|professeur)\b/.test(n)){
  const m=n.match(/\bmode\s+(code|programmation|reparation|creation|professeur)\b/)[1];
  return {intent:"mode-"+({programmation:"code",reparation:"repair",creation:"create",professeur:"teach"}[m]||m),confidence:.97};
 }
 if(/(?:apprends|apprend|etudie|etudies|etudier|memorise|analyse|integre|indexe|charge|lis)\b/.test(n)
    && /\b(?:cours|lecons|fiches|formations|connaissances)\b/.test(n)
    && /\b(?:tes|tous|toutes|installes?|integres?|disponibles?|deja|les|mes|sur ton appareil|du programme)\b/.test(n))
  return {intent:"study",confidence:.97};
 if(/\b(?:apprendre|etudier|etudies|etudie)\b.*\b(?:cours|lecons|fiches)\b/.test(n)
    && /\b(?:tu|toi|tes|a toi|alicia)\b/.test(n))return {intent:"study",confidence:.91};
 if(/\b(?:montre|affiche|liste|enumere|donne moi la liste|quels sont|qu as tu comme)\b.*\b(?:cours|lecons|fiches|matieres)\b/.test(n))
  return {intent:"list",confidence:.94};
 if(/\b(?:combien|nombre|quels cours as tu appris|qu as tu appris|tes apprentissages|progression)\b.*\b(?:cours|fiches|lecons|appris|connai|connaissances)\b/.test(n))
  return {intent:"status",confidence:.94};
 if(/\b(?:teste|interroge|controle|verifie|evalue)\b.*\b(?:tes cours|tes connaissances|les cours|les fiches|ta bibliotheque)\b/.test(n))
  return {intent:"test",confidence:.92};
 if(/\b(?:comprends?|comprennes|comprendre|compris|interpret|reformul)\b.*\b(?:mes demandes|ma demande|mes instructions|mes phrases|ce que je veux)\b/.test(n))
  return {intent:"help",confidence:.9};
 return {intent:null,confidence:0};
}
function teachExpression(query){
 // Ex : Quand je dis « révise tes fiches », je veux dire « apprends les cours installés ».
 const match=String(query||"").trim().match(/^quand\s+je\s+dis\s+[«"“']?(.+?)[»"”']?\s*,?\s*(?:je\s+veux\s+dire|cela\s+veut\s+dire|ça\s+veut\s+dire|ca\s+veut\s+dire|signifie)\s+[«"“']?(.+?)[»"”']?\s*[.!]?$/i);
 if(!match)return null;
 const trigger=normal(match[1].replace(/[»"”']+$/g,"")),meaning=match[2].replace(/[»"”']+$/g,"").trim();
 if(trigger.length<3||trigger.length>110||meaning.length<4||meaning.length>180||secrets.test(trigger+" "+meaning))
  return answer("Je ne peux pas enregistrer cette expression. Utilise une phrase courte sans informations confidentielles.");
 const intended=classify(meaning,{useAliases:false});
 if(!intended.intent||intended.confidence<.9)
  return answer("J'ai compris que tu veux m'enseigner une expression, mais je ne reconnais pas encore l'action correspondante. Donne un sens précis comme « apprends les cours installés » ou « passe en mode code ».");
 aliases=aliases.filter(x=>x.trigger!==trigger);
 aliases.push({trigger,intent:intended.intent});
 aliases=aliases.slice(-MAX_ALIASES);
 let saved=false;
 try{globalThis.localStorage?.setItem(STORE,JSON.stringify(aliases));saved=true;}catch{}
 if(typeof document!=="undefined")document.dispatchEvent(new Event("alicia:learning-updated"));
 return answer("J'ai compris : lorsque tu dis « "+match[1].trim()+" », tu veux que je "+({
  study:"consulte les cours intégrés",list:"présente la bibliothèque de cours",status:"indique mon niveau de consultation",
  test:"vérifie les fiches intégrées",help:"explique ma compréhension",
  "mode-code":"passe en mode Code","mode-repair":"passe en mode Réparation",
  "mode-create":"passe en mode Création","mode-teach":"passe en mode Professeur"
 }[intended.intent]||"reconnaisse cette demande")+". "+(saved?"Expression enregistrée sur cet appareil.":"La nouvelle expression fonctionne maintenant, mais sa sauvegarde n'est pas confirmée."));
}
function respond(query){
 const taught=teachExpression(query);if(taught)return taught;
 const parsed=classify(query);
 if(!parsed.intent)return null;
 const {intent}=parsed;
 if(intent!=="help")previous={intent,request:String(query||"").slice(0,200)};
 if(intent==="study")return AliciaCourseLearning.response("Apprends les cours installés");
 if(intent==="study-python"){
  const index=AliciaCourseLearning.activate();
  const first=COURSES.find(c=>c.id==="print")||COURSES.find(c=>c.topic==="python");
  if(!first)return answer("Je n'ai pas trouvé de leçon Python dans les cours intégrés.");
  return answer("J'ai rendu accessibles "+index.coursPython+" cours Python / VS Code et "+
   index.fiches+" autres fiches pédagogiques sur cet appareil. "+
   (index.persistent?"L'index est enregistré localement. ":"L'enregistrement local n'est pas confirmé. ")+
   "Ce n'est pas un entraînement de mon modèle d'IA ni une installation de Python.\n\n"+
   "Première leçon — "+first.title+"\n"+first.lesson+"\n\n"+
   "Exemple :\n"+first.snippet+"\n\n"+
   "Exercice : "+first.exercise+"\n\n"+
   "Pour continuer, dis « explique input en Python » ou « montre moi les cours ».");
 }

 if(intent==="status")return AliciaCourseLearning.response("Combien de cours as-tu appris ?");
 if(intent==="list"){
  const domains=[...new Set(LESSONS.map(x=>x.domain))].sort();
  return answer("J'ai "+LESSONS.length+" fiches pédagogiques et "+COURSES.length+" cours Python / VS Code intégrés. Matières des fiches : "+domains.join(", ")+". Pour que je m'en serve dans mes réponses, dis « apprends les cours installés ». Tu peux aussi demander une explication précise.");
 }
 if(intent==="test"){
  const audit=selfCheckAcademy(),check=audit.failures.length?"Éléments à revoir : "+audit.failures.slice(0,4).join("; "):"Toutes les fiches ont été retrouvées avec un corrigé cohérent.";
  return answer("Auto-test de la bibliothèque : "+audit.passed+" fiches cohérentes sur "+audit.tested+". "+check+" Ce résultat vérifie le catalogue, pas une intelligence générale.");
 }
 if(intent.startsWith("mode-")){
  const key=intent.slice(5),title=modeNames[key],select=globalThis.document?.getElementById?.("mode");
  if(!title||!select)return answer("Je reconnais le mode demandé, mais je ne peux pas modifier ce réglage ici.");
  select.value=key;
  select.dispatchEvent(new Event("change",{bubbles:true}));
  return answer("J'ai activé le mode "+title+". Dis-moi la tâche précise que tu souhaites faire.");
 }
 if(intent==="help")return answer("Je reconnais plusieurs formulations françaises des mêmes demandes, notamment étudier mes cours, les lister, me tester et sélectionner un mode. Tu peux m'enseigner une expression personnelle en écrivant : « Quand je dis révise tes fiches, je veux dire apprends les cours installés ». Si une demande est ambiguë, reformule-la plutôt que de me laisser deviner. Je ne peux pas exécuter de nouvelles actions système ni devenir un grand modèle de langage simplement avec ces règles.");
 return null;
}
export const AliciaRequestUnderstanding={classify,respond,learn:teachExpression,aliases:()=>aliases.map(x=>({...x})),last:()=>previous};
if(typeof window!=="undefined")window.AliciaRequestUnderstanding=AliciaRequestUnderstanding;
