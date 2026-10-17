import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const storage=new Map();
globalThis.localStorage={
 getItem:k=>storage.get(k)||null,
 setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k)
};
const {AliciaTraining:t}=await import("../training-core.mjs");
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("Entraînement réel du classificateur bayésien sur un corpus supervisé",()=>{
 const data=t.data(),progress=t.progress();
 assert.equal(data.intentCount,9);
 assert.equal(data.baseSamples,90);
 assert.ok(progress.enabled);
 assert.equal(progress.trainedExamples,72);
 assert.equal(progress.heldOut,18);
 assert.equal(progress.correct>=0,true);
 assert.equal(progress.accuracy>=0&&progress.accuracy<=100,true);
 assert.equal(progress.neuralWeightsTrained,false);
});
test("Les 55 cours intégrés sont évalués et le bilan distingue entraînement et connaissances",()=>{
 const progress=t.progress();
 assert.equal(progress.courseCount,55);
 assert.equal(progress.courseTestsTotal,55);
 assert.ok(progress.courseTestsPassed>0);
 const response=t.command("bilan entraînement");
 assert.match(response.answer,/phrases de test reconnues/);
 assert.match(response.answer,/ne mesure pas une intelligence générale/);
 assert.match(t.command("entraîne toi avec tes cours").answer,/Entraînement supervisé local effectué/);
});
test("Elle apprend les corrections puis réévalue les résultats avant de les conserver",()=>{
 const initial=t.progress();
 const r=t.learn("je veux parcourir ta bibliothèque de cours","list");
 assert.equal(typeof r.ok,"boolean");
 assert.equal(t.progress().accuracy>=initial.accuracy,true);
 if(r.ok){
  assert.ok(storage.get("alicia-entrainement-supervise-v1")?.includes("je veux parcourir"));
  const evo=t.evolve();
  assert.ok(evo.ok);
  assert.ok(evo.accuracy>=initial.accuracy);
 }else assert.match(r.reason,/diminue les tests/);
});
test("Aucun apprentissage de commandes destructrices ni de mots de passe",()=>{
 assert.equal(t.learn("supprime tous les cours","study").ok,false);
 assert.equal(t.learn("mon mot de passe est 123","help").ok,false);
 assert.equal(t.predictAndRespond("supprime tous les fichiers"),null);
 assert.equal(t.predictAndRespond("ouvre le terminal et efface"),null);
});
test("Intégration dans conversation, page et cache, sans modification des préférences vocales",()=>{
 const app=read("app.js"),html=read("index.html"),sw=read("sw.js"),voice=read("avatar.js");
 assert.match(app,/AliciaTraining\?\.command/);
 assert.match(app,/AliciaTraining\?\.predictAndRespond/);
 assert.match(html,/src="\.\/training-core\.mjs"/);
 assert.match(html,/src="\.\/training-ui\.mjs"/);
 assert.match(sw,/\.\/training-core\.mjs/);
 assert.match(sw,/\.\/training-ui\.mjs/);
 assert.match(voice,/alicia-voix-choisie/);
});
