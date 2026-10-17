import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const memory=new Map();
globalThis.localStorage={
 getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),
 removeItem:k=>memory.delete(k)
};
const {AliciaRequestUnderstanding:r}=await import("../understand-requests.mjs");
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Compréhension française : variantes de demande pour ses cours",()=>{
 for(const q of ["Apprends les cours installés","je veux que tu étudies tes cours","lis toutes tes fiches disponibles","étudie les fiches"]){
  assert.equal(r.classify(q).intent,"study",q);
 }
 for(const q of ["montre moi les cours","affiche tes fiches","donne moi la liste des cours"]){
  assert.equal(r.classify(q).intent,"list",q);
 }
 assert.equal(r.classify("combien de cours connais tu ?").intent,"status");
 assert.equal(r.classify("teste tes connaissances").intent,"test");
});
test("Une demande de suppression ou d'installation n'est jamais exécutée comme apprentissage",()=>{
 for(const q of ["installe un nouveau cours","supprime tous les cours","efface les fichiers","télécharge ce logiciel"]){
  assert.equal(r.classify(q).intent,null,q);
  assert.equal(r.respond(q),null,q);
 }
 assert.equal(r.respond("Bonjour Alicia"),null);
 assert.equal(r.respond("Apprends : soleil => étoile"),null);
});
test("Alicia répond aux commandes en français avec les contenus déjà présents, sans entraîner de modèle",()=>{
 const learn=r.respond("Apprends les cours installés");
 assert.match(learn.answer,/55 cours intégrés/);
 assert.match(learn.answer,/41 fiches/);
 const listed=r.respond("montre moi les cours");
 assert.match(listed.answer,/14 cours Python/);
 const audit=r.respond("teste tes connaissances");
 assert.match(audit.answer,/Auto-test de la bibliothèque/);
});
test("Elle apprend une expression explicitement enseignée et la garde sur l'appareil",()=>{
 const saved=r.respond('Quand je dis « révise tes fiches », je veux dire « apprends les cours installés »');
 assert.match(saved.answer,/J'ai compris/);
 assert.equal(r.classify("révise tes fiches").intent,"study");
 assert.match(memory.get("alicia-intentions-personnalisees-v1"),/revise tes fiches/);
 assert.match(r.respond("révise tes fiches").answer,/55 cours intégrés/);
});
test("Elle demande une clarification pour une expression qui ne correspond à aucune action connue",()=>{
 const unclear=r.respond('Quand je dis « fais tout », je veux dire « fabrique mon application sans permission »');
 assert.match(unclear.answer,/je ne reconnais pas encore l'action/);
 assert.equal(r.classify("fais tout").intent,null);
 assert.equal(r.respond("je veux que tu comprennes mes demandes").provider,"Compréhension locale Alicia");
});
test("Mode demandé et bibliothèques branchées, sans toucher à la voix sélectionnée",()=>{
 const app=read("app.js"),html=read("index.html"),sw=read("sw.js"),mod=read("understand-requests.mjs");
 assert.match(app,/AliciaRequestUnderstanding\?\.respond/);
 assert.match(html,/src="\.\/understand-requests\.mjs"/);
 assert.match(sw,/\.\/understand-requests\.mjs/);
 assert.doesNotMatch(mod,/speechSynthesis|AliciaAvatar\.speak|voice\.value\s*=/);
});
