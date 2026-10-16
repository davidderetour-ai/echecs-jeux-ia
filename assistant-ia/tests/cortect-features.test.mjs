import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createStroopChallenge,evaluateStroop,summarizeStroop,deBonoPrompts,threeChallengeQuestions} from "../cortect-core.mjs";
import {indexDocuments,searchContext,retrieveBroad,rerankCandidates,retrieveAdvanced,answerFromContext,chunkDocument} from "../cortect-rag-core.mjs";
import {generatePointCloud,exportPLY,projectPoints} from "../image3d-core.mjs";
import {fibonacci,calculateSafe,orchestrate,draftNotification,chooseTool} from "../cortect-agent-core.mjs";
import {runMission,planMission} from "../cortect-mission-core.mjs";
import {COURSES,courseSearch} from "../python-vscode-course.mjs";

const file=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const noteDocs=[
 {id:"n1",source:"Procédure technique",content:"Pour configurer le réseau, modifier l'adresse IP dans /etc/network/interfaces."},
 {id:"n2",source:"Courses",content:"Acheter des pommes, du lait et du café pour la réunion de l'équipe Réseau."},
 {id:"n3",source:"Sécurité",content:"Le protocole de sécurité réseau exige un changement de mot de passe tous les 90 jours."}
];
test("RAG 2 passages élimine le faux positif des courses réseau",()=>{
 const index=indexDocuments(noteDocs),q="Comment modifier la configuration de mon réseau ?";
 assert.equal(index.length,3);
 const broad=retrieveBroad(q,index,10);
 assert.ok(broad.length>=2);
 const reranked=rerankCandidates(q,broad,2);
 assert.ok(reranked.length>=1);
 assert.match(reranked[0].text,/adresse IP/);
 assert.ok(reranked.every(x=>!x.text.includes("pommes")));
 const r=answerFromContext(q,index,2);
 assert.equal(r.found,true);
 assert.match(r.answer,/Source : Procédure technique/);
 assert.ok(r.sources.some(x=>x.source==="Procédure technique"));
});
test("RAG hors sujet : répondre je ne sais pas avec zéro citation",()=>{
 const index=indexDocuments(noteDocs);
 const r=answerFromContext("Quel est le numéro de série du moteur spatial de Jupiter ?",index,2);
 assert.equal(r.found,false);assert.match(r.answer,/Je ne sais pas/);
 assert.deepEqual(r.sources,[]);
});
test("Chunking borné et IDs de documents stables",()=>{
 const chunks=chunkDocument("un mot ".repeat(600),{size:250,overlap:40,maxChunks:9});
 assert.equal(chunks.length,9);
 const index=indexDocuments([{id:"perso-123",content:"Le télétravail exige une validation des horaires avant jeudi soir."}]);
 assert.equal(index[0].id,"perso-123#0");
});
test("Stroop : mot et couleur différents, mesure incluant réponse",()=>{
 const challenge=createStroopChallenge(()=>0);
 assert.equal(challenge.word,"ROUGE");assert.equal(challenge.ink,"bleu");
 const ok=evaluateStroop(challenge,"BLEU",1000,2250);
 assert.equal(ok.accuracy,100);assert.equal(ok.durationSeconds,1.25);
 const bad=evaluateStroop(challenge,"rouge",1000,3000);
 assert.equal(bad.accuracy,0);
 const stats=summarizeStroop([ok,bad]);
 assert.equal(stats.count,2);assert.equal(stats.accuracy,50);
 assert.equal(deBonoPrompts("Mon projet IA").length,6);
 assert.equal(threeChallengeQuestions("Une note").length,3);
});
test("Stroop invalide et horloge incohérente rejetés",()=>{
 assert.throws(()=>evaluateStroop({word:"VERT",ink:"vert"},"vert",100,200));
 assert.throws(()=>evaluateStroop({word:"ROUGE",ink:"bleu"},"bleu",500,200));
});
test("Relief image 2D -> nuage PLY reproductible et limité",()=>{
 const data=new Uint8ClampedArray([
  255,0,0,255,   0,255,0,255,   0,0,255,255,   255,255,255,255,
  0,0,0,255,     120,120,120,255, 250,240,230,255, 255,0,0,255,
  255,255,0,255, 255,0,255,255, 0,255,255,255, 24,12,6,255,
  12,34,56,255,  60,70,80,255,  100,110,120,255, 255,255,255,255
 ]);
 const image={width:4,height:4,data};
 const first=generatePointCloud(image,{step:2,relief:0.8});
 const second=generatePointCloud(image,{step:2,relief:0.8});
 assert.equal(first.count,4);assert.deepEqual([...first.positions],[...second.positions]);
 assert.equal(first.hasRealBack,false);assert.equal(first.metricDepth,false);
 const ply=exportPLY(first);
 assert.match(ply,/^ply\nformat ascii 1.0\n/);
 assert.match(ply,/element vertex 4/);
 assert.match(ply,/end_header\n/);
 assert.equal(ply.split("\n").filter(Boolean).length,16);
 assert.equal(projectPoints(first,Math.PI/2).length,4);
});
test("Image trop grande et PLY incorrect rejetés",()=>{
 assert.throws(()=>generatePointCloud({width:1024,height:1024,data:[]})); 
 assert.throws(()=>exportPLY({count:1,positions:[0,1],colors:[0,1,2]}));
});
test("Outils locaux ne lancent jamais de Python non fiable",()=>{
 assert.equal(fibonacci(20),6765);
 assert.equal(calculateSafe("Calcule 3 * (4 + 2)").result,18);
 assert.throws(()=>calculateSafe("exec('os.system')"));
 assert.throws(()=>fibonacci(1000));
 const reminder=draftNotification("Maintenance ce soir","general");
 assert.equal(reminder.sent,false);assert.match(reminder.answer,/Non envoyé/);
 const command=orchestrate("Alerte l'équipe sur Slack canal general que la maintenance commence.",{notes:noteDocs});
 assert.equal(command.tool,"notification-brouillon");
 assert.equal(command.sent,false);
 const knowledge=orchestrate("Donne le statut du projet Alpha",{notes:[{id:"alpha",source:"Projet Alpha",content:"Le projet Alpha est en cours depuis janvier."}]});
 assert.equal(knowledge.handled,true);
});
test("Mission Web: HTTPS publics seulement, données manquantes ne sont pas inventées",async()=>{
 assert.throws(()=>planMission("Lis http://192.168.1.1/admin"));
 assert.throws(()=>planMission("Lis https://localhost/"));
 const noData=await runMission("Va lire https://example.org/info puis calcule la somme des 3 pays",{
  fetcher:async(url)=>({
    ok:true,url,headers:{get:()=> "text/html"},
    text:async()=>"<html><body>Voici une page publique donnant une explication générale sans aucune population ni classement de pays.</body></html>"
  })
 });
 assert.equal(noData.success,false);
 assert.match(noData.answer,/Identifie les trois valeurs/);
 assert.ok(noData.events.some(x=>x.step==="read"&&x.status==="done"));
});
test("Agent ne prétend pas avoir lu une page inaccessible",async()=>{
 const fail=await runMission("Va lire https://example.org/info",{fetcher:async()=>{throw Error("CORS");}});
 assert.equal(fail.success,false);assert.match(fail.answer,/Je ne peux pas lire cette page/);
});
test("Cours Python 3.12.9 VS Code offline, exemples et corrigés",()=>{
 assert.ok(COURSES.length>=12);
 assert.ok(COURSES.some(x=>x.lesson.includes("Python 3.12.9")));
 assert.ok(COURSES.some(x=>x.lesson.includes("Big Sur")));
 assert.ok(COURSES.every(x=>x.snippet&&x.exercise&&x.solution));
 assert.ok(courseSearch("print Python").some(x=>x.id==="print"));
 assert.ok(courseSearch("déboguer VS Code").length>0);
});
test("Toutes interfaces présentes sans API facturée",()=>{
 const html=file("index.html"),sw=file("sw.js"),app=file("app.js");
 for(const name of ["cortect-ui.js","image3d-ui.js","python-vscode-ui.js","cortect-chat.js"]){
  assert.ok(html.includes('src="./'+name+'"'));
  assert.ok(sw.includes('"./'+name+'"'));
 }
 assert.ok(html.includes("cortect-tools.css"));
 assert.ok(app.includes("window.AliciaLocalTools"));
 assert.doesNotMatch(file("cortect-agent-core.mjs"),/\bexec\s*\(|ChatOpenAI|OpenAI\(/);
 assert.doesNotMatch(file("cortect-rag-core.mjs"),/OpenAI\(|fetch\s*\(/);
});
