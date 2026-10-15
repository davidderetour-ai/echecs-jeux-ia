import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileKind,createAdvicePrompt,cleanSharedAdvice} from "../composer-core.mjs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const composer=readFileSync(new URL("../composer-tools.js",import.meta.url),"utf8");

test("Accepte les photos légères et les fichiers texte, refuse les formats non analysés",()=>{
 assert.equal(fileKind({name:"photo.jpg",type:"image/jpeg",size:1000}).kind,"image");
 assert.equal(fileKind({name:"cours.txt",type:"text/plain",size:2000}).kind,"text");
 assert.equal(fileKind({name:"table.csv",type:"text/csv",size:1000}).kind,"text");
 assert.equal(fileKind({name:"document.pdf",type:"application/pdf",size:1000}).kind,"error");
 assert.equal(fileKind({name:"malware.exe",type:"application/octet-stream",size:1000}).kind,"error");
});
test("Refuse une photo volumineuse et un texte vide",()=>{
 assert.equal(fileKind({name:"photo.png",type:"image/png",size:9e6}).kind,"error");
 assert.equal(fileKind({name:"texte.txt",type:"text/plain",size:0}).kind,"error");
});
test("La demande de conseil ChatGPT est préparée sans accès caché à un compte",()=>{
 const prompt=createAdvicePrompt("Comment résoudre un bug d'affichage ?");
 assert.match(prompt,/ChatGPT/);
 assert.match(prompt,/Comment résoudre un bug/);
 assert.doesNotMatch(prompt,/github_pat_|sk-[A-Za-z0-9]{20,}/);
 assert.match(composer,/https:\/\/chatgpt\.com\//);
 assert.match(composer,/navigator\.clipboard\.writeText/);
});
test("Les conseils importés demandent du contenu et n'acceptent pas de jetons",()=>{
 assert.throws(()=>cleanSharedAdvice("court"),/35 caractères/);
 assert.throws(()=>cleanSharedAdvice("github_pat_abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrst"),/secret/);
 assert.equal(cleanSharedAdvice("Une méthode testable consiste à reproduire le bug et lancer les tests."),"Une méthode testable consiste à reproduire le bug et lancer les tests.");
});
test("Menu plus, photo, apprentissage et conseil disponibles dans l'interface",()=>{
 for(const role of ["camera","photos","files","plugins","deep","ask-chatgpt","chatgpt"]){
  assert.match(html,new RegExp('data-plus-action="'+role+'"'));
 }
 assert.match(html,/id="plus"/);
 assert.match(html,/type="module" src="\.\/composer-tools\.js"/);
 assert.match(html,/id="chatgpt-learning-consent"/);
});
test("Une nouvelle conversation est remise à zéro avec état visible",()=>{
 assert.match(app,/\$\("new"\)\.addEventListener\("click"/);
 assert.match(app,/messages=\[\]/);
 assert.match(app,/window\.AliciaComposer\?\.clear\(\)/);
 assert.match(app,/Nouvelle conversation prête/);
});
