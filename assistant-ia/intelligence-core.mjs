/**
 * Alicia : mesures descriptives, PAS un test de QI, ni un diagnostic.
 * La réussite à quelques exercices ne mesure pas « l'intelligence globale ».
 * Aucun score par défaut sans réponse effective du modèle.
 */
export const BENCHMARK_VERSION="alicia-bench-1";
export const BENCHMARK=Object.freeze([
 {id:"math1",topic:"Calcul",question:"Calcule 37 multiplié par 24. Réponds uniquement par le nombre entier.",answer:"888"},
 {id:"logic1",topic:"Logique",question:"Dans la suite 2, 6, 12, 20, 30, quel est le nombre suivant ? Réponds uniquement avec le nombre.",answer:"42"},
 {id:"geo1",topic:"Géométrie",question:"Quelle est l'aire en cm² d'un rectangle de largeur 7 cm et longueur 12 cm ? Réponds uniquement par le nombre.",answer:"84"},
 {id:"code1",topic:"Programmation",question:"En Python, que vaut len([4,5,6]) ? Réponds uniquement par le nombre.",answer:"3"},
 {id:"fr1",topic:"Français",question:"Quelle est la classe grammaticale de « rapidement » dans « Il court rapidement » ? Réponds par un seul mot.",answer:"adverbe"},
 {id:"math2",topic:"Calcul",question:"Calcule (81 - 27) / 6. Réponds uniquement par le nombre entier.",answer:"9"},
 {id:"logic2",topic:"Logique",question:"Cinq machines fabriquent cinq pièces en cinq minutes. Combien de minutes faut-il à cent machines pour fabriquer cent pièces, avec les mêmes machines et la même cadence ? Réponds uniquement par le nombre.",answer:"5"},
 {id:"geo2",topic:"Géométrie",question:"Quel est le volume en cm³ d'un pavé droit de côtés 3, 4 et 5 cm ? Réponds uniquement par le nombre.",answer:"60"},
 {id:"code2",topic:"Programmation",question:"En JavaScript, que vaut 2 ** 5 ? Réponds uniquement par le nombre.",answer:"32"},
 {id:"fr2",topic:"Français",question:"Complète l'accord : « Les fleurs sont ... » (adjectif beau). Réponds uniquement par l'adjectif correctement accordé.",answer:"belles"}
]);
function normalize(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/[.!?;,]+$/g,"").trim();}
export function gradeAnswer(item,response){
 if(!item||typeof item.answer!=="string")throw Error("Exercice inconnu");
 const actual=normalize(response),expected=normalize(item.answer);
 // Réponses strictes : vérification déterministe, sans second modèle de notation.
 if(/^\d+(?:\.\d+)?$/.test(expected)){
  const compact=actual.replace(/\s+/g,"").replace(",",".");
  return /^\d+(?:\.\d+)?$/.test(compact)&&Number(compact)===Number(expected);
 }
 return actual===expected;
}
export function benchmarkSummary(samples,expectedCount=10){
 if(!Array.isArray(samples)||samples.length===0) return null;
 if(!Number.isInteger(expectedCount)||expectedCount<1||expectedCount>BENCHMARK.length)throw Error("Nombre d'exercices invalide");
 const allowed=new Set(BENCHMARK.slice(0,expectedCount).map(q=>q.id));
 const seen=new Set();
 for(const s of samples){
  if(!allowed.has(s?.id)||typeof s.correct!=="boolean"||seen.has(s.id))throw Error("Résultats incomplets ou invalides");
  seen.add(s.id);
 }
 if(seen.size!==expectedCount)return null;
 const passed=samples.filter(x=>x.correct).length;
 const percent=Math.round(100*passed/expectedCount);
 const label=percent>=80?"Forte réussite":percent>=50?"Réussite partielle":"À renforcer";
 return {passed,total:expectedCount,percent,label,version:BENCHMARK_VERSION};
}
export function rubricSummary(ratings){
 if(!Array.isArray(ratings)||ratings.length!==5)throw Error("Cinq critères nécessaires");
 // 0 non observé ; 1 non démontré ; 2 partiellement observé ; 3 observé.
 if(!ratings.every(x=>Number.isInteger(x)&&x>=0&&x<=3))throw Error("Évaluation de critère invalide");
 const known=ratings.filter(x=>x>0);
 if(known.length<3)return null;
 const points=known.reduce((sum,x)=>sum+(x-1),0);
 return {observed:known.length,percent:Math.round(100*points/(known.length*2))};
}
