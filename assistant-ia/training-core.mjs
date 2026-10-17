/* ALICIA — apprentissage supervisé local des intentions, sans serveur.
 * Algorithme réel : classificateur multinomial bayésien + données étiquetées.
 * Les 55 cours sont contrôlés et indexés, pas utilisés pour entraîner un LLM.
 * Données personnelles enregistrées uniquement après correction explicite.
 */
import {AliciaCourseLearning} from "./course-learning.mjs";
import {AliciaRequestUnderstanding} from "./understand-requests.mjs";
import {LESSONS,selfCheckAcademy} from "./alicia-academy.mjs";
import {COURSES} from "./python-vscode-course.mjs";

const STATE_KEY="alicia-entrainement-supervise-v1",MAX_EXAMPLES=100,VERSION=1;
const INTENTS=["study","list","status","test","help","mode-code","mode-repair","mode-create","mode-teach"];
const CORPUS={
 "study":[
  "apprends toutes tes leçons intégrées","étudie tes cours de formation","lis les fiches pédagogiques",
  "travaille sur les cours disponibles","révise toute ta bibliothèque","assimile les cours présents",
  "étudie le contenu du programme","intègre les leçons de ton école","apprends les documents pédagogiques","utilise tes fiches pour apprendre"
 ],
 "list":[
  "montre la liste de tes cours","quelles matières as tu","affiche le catalogue des leçons",
  "présente les fiches présentes","donne la liste des formations","montre ta bibliothèque",
  "je veux voir les leçons disponibles","énumère les matières","quels cours sont inclus","affiche tous tes enseignements"
 ],
 "status":[
  "combien de cours as tu étudié","où en es tu dans les leçons","donne ton bilan d apprentissage",
  "montre tes progrès de formation","combien de fiches as tu retenues","qu as tu appris des cours",
  "quel est ton niveau de connaissances","as tu fini ton étude des cours","donne tes statistiques d apprentissage",
  "quel pourcentage des leçons connais tu"
 ],
 "test":[
  "teste tes connaissances des cours","vérifie les corrigés de tes fiches","contrôle ta bibliothèque",
  "évalue tes leçons","fais un audit de tes cours","lance le test des fiches",
  "interroge toi sur les enseignements","teste ton catalogue pédagogique","vérifie si tes cours sont corrects",
  "donne un bilan de tes tests de cours"
 ],
 "help":[
  "comprends mes demandes en français","interprète mes instructions","comment comprends tu ma question",
  "explique comment tu interprètes mes phrases","je veux que tu comprennes mes demandes",
  "reformule ce que je veux dire","comprends tu ce que je demande","améliore ta compréhension de mes phrases",
  "comment reconnaître mes consignes","aide moi à être compris par toi"
 ],
 "mode-code":[
  "mets toi en mode code","passe en mode programmation","active le mode code",
  "choisis le mode développeur","bascule en mode coder","je veux le mode code",
  "active programmation dans les modes","sélectionne le mode code","mode code maintenant","mets le mode programmation"
 ],
 "mode-repair":[
  "mets toi en mode réparation","passe en mode dépannage","active le mode réparation",
  "choisis le mode réparateur","je veux le mode réparation","bascule sur le mode diagnostic",
  "active réparation dans les modes","sélectionne le mode réparer","mode réparation maintenant","mets le mode dépannage"
 ],
 "mode-create":[
  "mets toi en mode création","passe en mode créativité","active le mode création",
  "choisis le mode créateur","je veux le mode création","bascule sur le mode création",
  "active création dans les modes","sélectionne le mode créer","mode création maintenant","mets le mode créatif"
 ],
 "mode-teach":[
  "mets toi en mode professeur","passe en mode enseignant","active le mode professeur",
  "choisis le mode formation","je veux le mode professeur","bascule sur le mode enseigner",
  "active professeur dans les modes","sélectionne le mode pédagogie","mode professeur maintenant","mets le mode éducateur"
 ]
};
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g," ")
 .replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const stop=new Set(["je","tu","tes","ton","ta","des","les","une","dans","sur","avec","plus","moi","toi","pour","que","qui","est","sont","de","du","la","le","en","au","aux","un","a","et","ou","ce","ces","tous","toutes","mes","mon","ma","veux","comment","donne","fais","peux"]);
const stem=t=>t.replace(/(ements|ement|ations|ation|iques|ique|euses|euse|eurs|ment|eurs|ions|ees|es|s)$/, "");
const features=q=>[...new Set(normalize(q).split(" ").filter(w=>w.length>=3&&!stop.has(w)).map(stem).filter(w=>w.length>=3))];
const save=value=>{try{globalThis.localStorage?.setItem(STATE_KEY,JSON.stringify(value));return true;}catch{return false;}};
const safeSentence=s=>typeof s==="string"&&s.trim().length>=4&&s.length<=190
 && !/\b(?:password|mot de passe|token|jeton|api key|bearer|secret|sk-[a-z0-9]{12,})\b/i.test(s);
const getState=()=>{
 try{
  const data=JSON.parse(globalThis.localStorage?.getItem(STATE_KEY)||"null");
  if(!data||data.schema!==VERSION)return {schema:VERSION,enabled:false,corrections:[]};
  const corrections=(Array.isArray(data.corrections)?data.corrections:[]).filter(x=>x&&safeSentence(x.phrase)&&INTENTS.includes(x.intent)).slice(-MAX_EXAMPLES);
  return {schema:VERSION,enabled:data.enabled===true,corrections};
 }catch{return {schema:VERSION,enabled:false,corrections:[]};}
};
let state=getState(),lastReport=null;
const trainingSamples=(holdout=false)=>{
 const rows=[];
 for(const label of INTENTS)for(let i=0;i<CORPUS[label].length;i++){
   const reserved=i%5===4;
   if(reserved===holdout)rows.push({label,text:CORPUS[label][i]});
 }
 if(!holdout)for(const x of state.corrections)rows.push({label:x.intent,text:x.phrase});
 return rows;
};
function fit(rows){
 const vocab=new Set(),count={},total={},prior={};
 for(const label of INTENTS){count[label]=new Map();total[label]=0;prior[label]=0;}
 for(const sample of rows){
   prior[sample.label]++;
   for(const word of features(sample.text)){
     vocab.add(word);
     count[sample.label].set(word,(count[sample.label].get(word)||0)+1);
     total[sample.label]++;
   }
 }
 return {vocab,count,total,prior,rows:rows.length};
}
let classifier=fit(trainingSamples());
function predictWith(model,query){
 const f=features(query),known=f.filter(w=>model.vocab.has(w));
 if(!known.length)return {intent:null,confidence:0,margin:0,reason:"aucun mot appris"};
 const labels=INTENTS.map(label=>{
  const prior=(model.prior[label]+1)/(model.rows+INTENTS.length);
  const denom=model.total[label]+model.vocab.size;
  let score=Math.log(prior);
  for(const word of known)score+=Math.log(((model.count[label].get(word)||0)+1)/denom);
  return {intent:label,score};
 }).sort((a,b)=>b.score-a.score);
 const largest=labels[0].score,sum=labels.reduce((acc,l)=>acc+Math.exp(l.score-largest),0);
 const confidence=1/sum,second=Math.exp(labels[1].score-largest)/sum;
 return {intent:labels[0].intent,confidence,margin:confidence-second,
  matched:known.length,words:f.length,reason:"modèle supervisé"};
}
function predict(query){return predictWith(classifier,query);}
function evaluate(candidate=classifier){
 const hold=trainingSamples(true);
 let correct=0;
 const byIntent={};
 for(const label of INTENTS)byIntent[label]={correct:0,total:0};
 for(const sample of hold){
  const p=predictWith(candidate,sample.text),good=p.intent===sample.label;
  byIntent[sample.label].total++;
  if(good){correct++;byIntent[sample.label].correct++;}
 }
 return {correct,total:hold.length,accuracy:hold.length?Math.round(100*correct/hold.length):0,
  perIntent:byIntent};
}
function curriculum(){
 const check=selfCheckAcademy();
 const courseIds=new Set(),errors=[];
 for(const c of COURSES){
  if(!c.id||!c.title||!c.lesson||!c.exercise||courseIds.has(c.id))errors.push(c.id||"cours sans identifiant");
  courseIds.add(c.id);
 }
 return {available:LESSONS.length+COURSES.length,lessonCount:LESSONS.length,pythonCount:COURSES.length,
  checked:check.tested+COURSES.length,passed:check.passed+COURSES.length-errors.length,
  problems:check.failures.concat(errors).slice(0,20)};
}
function train(){
 const previous=evaluate(classifier);
 const candidate=fit(trainingSamples());
 const next=evaluate(candidate);
 const accepted=next.correct>=previous.correct;
 if(accepted)classifier=candidate;
 const course=AliciaCourseLearning.activate(),evaluation=accepted?next:previous,audit=curriculum();
 state.enabled=true;
 const persisted=save(state);
 lastReport={trainedExamples:classifier.rows,heldOut:evaluation.total,correct:evaluation.correct,
  accuracy:evaluation.accuracy,courseCount:audit.available,courseTestsPassed:audit.passed,
  courseTestsTotal:audit.checked,problems:audit.problems,personalExamples:state.corrections.length,persisted,
  accepted,kind:"apprentissage supervisé d'intentions (non LLM)"};
 return lastReport;
}
function progress(){
 const score=evaluate(),audit=curriculum();
 return {enabled:state.enabled,trainedExamples:classifier.rows,
  heldOut:score.total,correct:score.correct,accuracy:score.accuracy,
  courseCount:audit.available,courseTestsPassed:audit.passed,courseTestsTotal:audit.checked,
  personalExamples:state.corrections.length,modelType:"classificateur bayésien local",
  neuralWeightsTrained:false,previous:lastReport};
}
function learn(phrase,intent){
 if(!safeSentence(phrase)||!INTENTS.includes(intent))return {ok:false,reason:"Phrase invalide ou intention inconnue"};
 const text=normalize(phrase),known=AliciaRequestUnderstanding.classify(phrase,{useAliases:false});
 if(known.reason==="action sur fichiers non autorisée"||/\b(?:supprime|efface|installe|telecharge|desinstalle)\b/.test(text))
  return {ok:false,reason:"Une phrase modifiant les fichiers n'est pas entraînée comme commande"};
 const current=state.corrections.slice();
 const baseline=evaluate();
 const proposed=current.filter(x=>normalize(x.phrase)!==text);
 proposed.push({phrase:String(phrase).trim(),intent});
 state.corrections=proposed.slice(-MAX_EXAMPLES);
 const candidate=fit(trainingSamples());
 const next=evaluate(candidate);
 // La vérification se fait sur les phrases volontairement mises à l'écart.
 if(next.correct<baseline.correct){
   state.corrections=current;
   return {ok:false,reason:"Cette correction diminue les tests de compréhension ("+baseline.correct+"/"+baseline.total+" vers "+next.correct+"/"+next.total+"). Elle n'a pas été enregistrée.",baseline:baseline.accuracy,candidate:next.accuracy};
 }
 classifier=candidate;
 const persisted=save(state);
 return {ok:true,persisted,intent,phrase,examples:classifier.rows,accuracy:next.accuracy,previousAccuracy:baseline.accuracy};
}
function evolve(){
 // Recalcul à partir des seuls exemples prévus ou explicitement corrigés,
 // jamais de messages interceptés ni de pages web non vérifiées.
 const previous=evaluate(classifier),candidate=fit(trainingSamples()),newer=evaluate(candidate);
 const accepted=newer.correct>=previous.correct;
 if(accepted)classifier=candidate;
 return {ok:accepted,accuracy:accepted?newer.accuracy:previous.accuracy,
   previousAccuracy:previous.accuracy,candidateAccuracy:newer.accuracy,
   examples:classifier.rows,personalExamples:state.corrections.length,
   reason:accepted?"Modèle revérifié sur des phrases inédites":"Régression détectée, modèle conservé"};
}
const canon={
 study:"Apprends les cours installés",list:"montre moi les cours",status:"combien de cours connais tu",
 test:"teste tes connaissances",help:"je veux que tu comprennes mes demandes",
 "mode-code":"passe en mode code","mode-repair":"passe en mode réparation",
 "mode-create":"passe en mode création","mode-teach":"passe en mode professeur"
};
const anchors={
 study:/\b(?:cours|lecon|fiche|formation|bibliotheque|connaissance|pedagogie)\b/,
 list:/\b(?:cours|lecon|fiche|formation|matiere|bibliotheque|enseignement)\b/,
 status:/\b(?:cours|lecon|fiche|formation|apprentissage|progres|connaissance)\b/,
 test:/\b(?:cours|lecon|fiche|formation|connaissance|bibliotheque|corrige)\b/,
 help:/\b(?:demande|phrase|instruction|consigne|comprendre|comprends|interpret)\b/,
 "mode-code":/\bmode\b/,"mode-repair":/\bmode\b/,"mode-create":/\bmode\b/,"mode-teach":/\bmode\b/
};
function predictAndRespond(query){
 if(!state.enabled||typeof query!=="string"||query.length>190)return null;
 if(AliciaRequestUnderstanding.classify(query).intent)return null; // garder les règles explicites
 const n=normalize(query);
 if(/\b(?:installe|installer|telecharge|supprime|efface|desinstalle|execute|lance terminal|password|jeton)\b/.test(n))return null;
 if(/^(?:apprends|apprend|correction|retiens|memorise)\s*:/.test(n))return null;
 const p=predict(query);
 if(!p.intent||p.confidence<.78||p.margin<.24||p.matched<2||!anchors[p.intent].test(n))return null;
 const response=AliciaRequestUnderstanding.respond(canon[p.intent]);
 return response?{...response,provider:"Compréhension entraînée d'Alicia",intent:p.intent,
  confidence:Math.round(p.confidence*100)/100}:null;
}
const make=text=>({answer:text,provider:"Entraînement d'Alicia",local:true,verified:false,sources:[]});
function command(query){
 const n=normalize(query);
 if(/\b(?:bilan|resultat|niveau|progression)\b.*\b(?:entrainement|apprentissage supervise)\b/.test(n)){
  const p=progress();
  return make("Bilan de mon entraînement : "+(p.enabled?"modèle local entraîné":"entraînement non lancé")+
    ". "+p.trainedExamples+" exemples d'entraînement ; "+p.correct+"/"+p.heldOut+
    " phrases de test reconnues ("+p.accuracy+" %). "+p.courseTestsPassed+"/"+p.courseTestsTotal+
    " contrôles sur mes "+p.courseCount+" cours intégrés. Ce score ne mesure pas une intelligence générale.");
 }
 if(/\b(?:entraine|entraines|entrainer|entrainement)\b/.test(n)&&
   /\b(?:toi|ton|tes|complet|total|cours|formation|demandes|intelligence)\b/.test(n)){
  const p=train();
  return make("Entraînement supervisé local effectué : "+p.trainedExamples+" exemples étudiés, "+
    p.correct+"/"+p.heldOut+" demandes inédites reconnues ("+p.accuracy+" %). "+
    p.courseTestsPassed+"/"+p.courseTestsTotal+" contrôles de cours réussis ("+p.courseCount+
    " cours disponibles). "+p.personalExamples+" corrections personnelles utilisées. "+
    (p.persisted?"État enregistré sur cet appareil. ":"Sauvegarde de l'état non confirmée. ")+
    "J'ai entraîné ma reconnaissance d'intentions, pas les poids d'un grand modèle de langage. Je ne me suis pas connectée à Internet.");
 }
 return null;
}
export const AliciaTraining={train,progress,predict,evaluate,learn,evolve,predictAndRespond,command,features,
  data:()=>({intentCount:INTENTS.length,baseSamples:Object.values(CORPUS).reduce((x,y)=>x+y.length,0),examples:state.corrections.length}),
  exportCorrections:()=>JSON.stringify({schema:1,corrections:state.corrections},null,2)};
// Au démarrage, réentraîne et contrôle ce petit modèle à partir des seules données locales.
if(!state.enabled)train();else evolve();
if(typeof window!=="undefined")window.AliciaTraining=AliciaTraining;
