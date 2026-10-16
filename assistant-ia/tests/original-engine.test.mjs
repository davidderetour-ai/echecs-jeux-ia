import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
const files=new Map();
globalThis.localStorage={
  getItem:k=>files.has(k)?files.get(k):null,
  setItem:(k,v)=>files.set(k,String(v)),
  removeItem:k=>files.delete(k)
};
await import("../original-engine.js");
const engine=globalThis.AliciaOriginalEngine;
const reply=q=>engine.answer({messages:[{role:"user",content:q}]});
test("moteur entièrement original ne dépend d'aucune API externe",()=>{
 const s=readFileSync(new URL("../original-engine.js",import.meta.url),"utf8");
 assert.ok(engine&&typeof engine.answer==="function");
 assert.doesNotMatch(s,/\bfetch\s*\(|XMLHttpRequest|WebSocket|http[s]?:\/\//i);
 assert.doesNotMatch(s,/eval\s*\(|new Function\s*\(/);
 assert.equal(engine.inspect().offline,true);
 assert.equal(engine.inspect().noPaidServices,true);
});
test("répond aux salutations françaises y compris « bonjours »",()=>{
 for(const q of ["Bonjour Alicia","bonjours","Salut !"]){
  const r=reply(q);assert.match(r.answer,/Bonjour/);assert.equal(r.local,true);
 }
});
test("calculs locaux sans eval ni exécution de code arbitraire",()=>{
 assert.match(reply("2 + 3 * 4").answer,/14/);
 assert.match(reply("Calcule 12 / 4").answer,/3/);
 assert.match(reply("8 / 0").answer,/Division par zéro/);
 assert.equal(engine._test.mathParse("console.log(1)"),null);
});
test("ne fabrique pas de réponse lorsqu'il ne sait pas",()=>{
 const r=reply("quels sont les résultats des élections intergalactiques de Trantor en 9812 ?");
 assert.equal(r.local,true);
 assert.match(r.answer,/Je ne sais pas encore/);
});
test("mémorise correction et apprend la réponse correspondante hors ligne",()=>{
 const original=engine.inspect().examples;
 const q="Pourquoi une fleur rare est-elle orange et bleue ?";
 assert.match(reply(q).answer,/Je ne sais pas/);
 const taught=reply("Apprends : "+q+" => Parce que les pétales possèdent deux pigments distincts.");
 assert.ok(taught.trained);assert.equal(engine.inspect().examples,original+1);
 assert.match(reply(q).answer,/deux pigments distincts/);
});
test("évolution interne ne touche ni fichiers ni configuration système",()=>{
 const s=readFileSync(new URL("../original-engine.js",import.meta.url),"utf8");
 assert.doesNotMatch(s,/require\s*\(|child_process|fs\.write|window\.location|navigator\.serviceWorker/);
 assert.equal(typeof engine.autoEvolve,"function");
 const n=engine.inspect().revision;
 engine.autoEvolve();
 assert.ok(engine.inspect().revision>=n);
});
test("mémoire iPhone ↔ Mac exportable et importable sans code ni réseau",()=>{
 const backup=engine.exportMemory();
 assert.match(backup,/"schema": 1/);
 engine.clearMemory();assert.equal(engine.inspect().examples,0);
 const result=engine.importMemory(backup);
 assert.equal(result.ok,true);assert.ok(result.imported>0);
 assert.match(reply("Pourquoi une fleur rare est-elle orange et bleue ?").answer,/deux pigments/);
});
test("import refuse contenu incorrect et conserve la mémoire locale",()=>{
 const before=engine.inspect().examples;
 assert.equal(engine.importMemory('{"schema":0}').ok,false);
 assert.equal(engine.importMemory('not json').ok,false);
 assert.equal(engine.inspect().examples,before);
});
test("mise en page iPhone active le moteur gratuit en premier",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
 assert.match(html,/src="\.\/original-engine\.js" defer/);
 assert.match(html,/src="\.\/original-controls\.js" defer/);
 assert.doesNotMatch(html,/src="\.\/puter-engine\.js"/);
 assert.match(app,/connection.value="original"/);
 assert.match(sw,/\.\/original-engine\.js/);
});
