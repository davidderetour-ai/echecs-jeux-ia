import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LESSONS,subjects,searchLessons,answerFromLesson,gradeLesson,selfCheckAcademy} from "../alicia-academy.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Bibliothèque : plus de 40 fiches originales en français et 13 matières",()=>{
 assert.ok(LESSONS.length>=41);
 assert.ok(subjects().length>=13);
 const ids=new Set();
 for(const l of LESSONS){
  assert.match(l.id,/^fiche-\d{2}$/);
  assert.equal(ids.has(l.id),false,l.id);ids.add(l.id);
  assert.ok(l.summary.length>65,l.id+" explication trop brève");
  assert.ok(l.example.length>25,l.id+" exemple trop bref");
  assert.equal(l.options.length,4);
  assert.ok(Number.isInteger(l.correct)&&l.correct>=0&&l.correct<=3);
  assert.match(l.source,/Cours original Alicia/);
 }
});
test("Leçons retrouvées en conversation sur Python, Go, aire, sciences",()=>{
 const requests=[
 ["Que fait la commande input en Python ?","Python : affichage et saisie"],
 ["Combien d'intersections sur un goban de Go 9x9 ?","Go : intersections"],
 ["Comment calculer une aire rectangle ?","Aire et périmètre"],
 ["Est-ce qu'un cadenas HTTPS prouve la fiabilité d'un marchand ?","Sites et liens"],
 ["Comment fonctionne la respiration et le diaphragme ?","Corps et respiration"]
 ];
 for(const [q,title] of requests){
  const result=answerFromLesson(q);
  assert.ok(result,"Aucune connaissance pour "+q);
  assert.match(result.answer,/Référence : Cours original Alicia/);
  assert.equal(searchLessons(q,{limit:1})[0].title,title,"Mauvais résultat pour "+q);
 }
});
test("Sujet inconnu : Alicia n'invente pas une réponse",()=>{
 assert.equal(answerFromLesson("Quel est le mot de passe privé du compte bancaire XQ999 ?"),null);
 assert.equal(answerFromLesson(""),null);
});
test("Exercices : corrigé exact et refus de choix invalides",()=>{
 const go=LESSONS.find(x=>x.title==="Go : intersections");
 assert.ok(go);
 assert.equal(gradeLesson(go.id,go.correct).correct,true);
 assert.equal(gradeLesson(go.id,(go.correct+1)%4).correct,false);
 assert.equal(gradeLesson("fiche-999",0).ok,false);
 assert.equal(gradeLesson(go.id,99).ok,false);
});
test("Autovérification : chaque fiche retrouvable par titre",()=>{
 const run=selfCheckAcademy();
 assert.equal(run.tested,LESSONS.length);
 assert.deepEqual(run.failures,[]);
 assert.equal(run.passed,LESSONS.length);
});
test("Académie reliée à la conversation et disponible hors ligne",()=>{
 const html=read("index.html"),sw=read("sw.js"),router=read("cortect-chat.js"),ui=read("alicia-professeur-ui.js"),engine=read("original-engine.js");
 assert.match(html,/src="\.\/alicia-professeur-ui\.js"/);
 assert.match(html,/href="\.\/alicia-professeur\.css"/);
 for(const file of ["alicia-academy.mjs","alicia-professeur-ui.js","alicia-professeur.css"])assert.ok(sw.includes("./"+file));
 assert.match(sw,/alicia-shell-v30/);
 assert.match(router,/answerFromLesson\(q\)/);
 assert.match(router,/window\.AliciaTeacher/);
 assert.match(ui,/recordLessonResult/);
 assert.match(engine,/teacherProgress/);
 assert.match(engine,/teacherProgress:data\.teacherProgress/);
 assert.match(engine,/listLessonProgress:listLessonProgress/);
 assert.match(html,/0\.9\.0/);
});
test("Avatar cadré : vrai GLB et contrôles restent présents",()=>{
 const avatar=read("alicia-avatar3d.js"),theme=read("alicia-reference-theme.css");
 assert.match(avatar,/function fitCharacterCamera\(\)/);
 assert.match(avatar,/root\.add\(model\);imported=model;rig\.visible=false;\s*fitCharacterCamera/);
 assert.match(avatar,/floor\.visible=false/);
 assert.match(avatar,/safeDistance/);
 assert.match(avatar,/\.\/models\/alicia_realiste_rocketbox\.glb/);
 assert.match(theme,/\.avatar-stage\.alicia3d-enabled/);
 assert.match(theme,/\.alicia-avatar3d-import/);
});
