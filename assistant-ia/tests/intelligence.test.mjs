import test from "node:test";
import assert from "node:assert/strict";
import {BENCHMARK,BENCHMARK_VERSION,gradeAnswer,benchmarkSummary,rubricSummary} from "../intelligence-core.mjs";
test("Questions distinctes, cinq domaines, réponses non préremplies dans l'interface",()=>{
 assert.equal(BENCHMARK.length,10);
 assert.equal(new Set(BENCHMARK.map(q=>q.id)).size,10);
 assert.equal(new Set(BENCHMARK.map(q=>q.topic)).size,5);
 assert.match(BENCHMARK_VERSION,/alicia-bench/);
});
test("Correction déterministe : calcul, français et erreurs",()=>{
 assert.equal(gradeAnswer(BENCHMARK[0],"888"),true);
 assert.equal(gradeAnswer(BENCHMARK[0],"889"),false);
 assert.equal(gradeAnswer(BENCHMARK[4],"adverbe."),true);
 assert.equal(gradeAnswer(BENCHMARK[4],"adjectif"),false);
});
test("Le score n'existe pas avant la réponse à tous les exercices sélectionnés",()=>{
 assert.equal(benchmarkSummary([]),null);
 assert.equal(benchmarkSummary([{id:BENCHMARK[0].id,correct:true}],5),null);
});
test("Score associé au nombre et à la réussite des exercices effectivement répondus",()=>{
 const samples=BENCHMARK.slice(0,5).map((q,i)=>({id:q.id,correct:i!==2}));
 const result=benchmarkSummary(samples,5);
 assert.deepEqual([result.passed,result.total,result.percent,result.label],[4,5,80,"Forte réussite"]);
 assert.throws(()=>benchmarkSummary([samples[0],samples[0]],5),/invalides/);
});
test("Grille descriptive sans résultat si preuves insuffisantes ou critères manquants",()=>{
 assert.equal(rubricSummary([0,0,0,0,0]),null);
 assert.equal(rubricSummary([3,3,0,0,0]),null);
 assert.deepEqual(rubricSummary([3,2,1,0,0]),{observed:3,percent:50});
 assert.throws(()=>rubricSummary([1,2,9,0,0]),/invalide/);
});
