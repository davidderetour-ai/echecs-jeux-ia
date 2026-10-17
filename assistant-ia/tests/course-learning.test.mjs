import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const store=new Map();
globalThis.localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
const {AliciaCourseLearning:tool}=await import("../course-learning.mjs");
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("Les 41 fiches et 14 cours Python sont présents sans Internet",()=>{
 const status=tool.stats();
 assert.equal(status.fiches,41);
 assert.equal(status.coursPython,14);
 assert.equal(status.available,55);
 assert.equal(status.trainedModel,false);
});
test("La commande naturelle apprend les cours installés est opérationnelle",()=>{
 for(const text of ["apprend les cours installer pour elle","Apprends tous les cours installés","Étudie les fiches"]){
   assert.equal(tool.command(text),"index",text);
 }
 const answer=tool.answer("Apprends les cours installés");
 assert.match(answer.answer,/55 cours intégrés/);
 assert.match(answer.answer,/41 fiches/);
 assert.equal(tool.stats().indexed,55);
 assert.equal(tool.stats().persistent,true);
 assert.equal(JSON.parse(store.get("alicia-cours-index-v1")).enabled,true);
});
test("Alicia utilise ensuite les cours pour répondre à une question",()=>{
 const result=tool.answer("comment utiliser print en python");
 assert.ok(result&&typeof result.answer==="string");
 assert.match(result.answer,/print\(\)/i);
 assert.equal(result.local,true);
});
test("Les commandes de suivi et le moteur général restent accessibles",()=>{
 assert.match(tool.answer("Combien de cours as tu appris ?").answer,/55/);
 assert.equal(tool.answer("Bonjour Alicia"),null);
 assert.equal(tool.answer("Apprends : clé => valeur"),null);
});
test("Le bouton et le moteur conversationnel utilisent le même module installé",()=>{
 assert.match(read("app.js"),/AliciaCourseLearning\?\.answer/);
 assert.match(read("alicia-professeur-ui.js"),/alicia-professeur-learn/);
 assert.match(read("index.html"),/src="\.\/course-learning\.mjs"/);
 assert.match(read("sw.js"),/\.\/course-learning\.mjs/);
});
