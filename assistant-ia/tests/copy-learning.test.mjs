import test from "node:test";
import assert from "node:assert/strict";
import {validateVolunteerReport,validateLearningCatalog,validateSafetyNotices} from "../copy-learning-core.mjs";
const base={schema:1,project:"Alicia",publisher:"davidderetour-ai",reviewedEntries:[]};
test("Consentement obligatoire pour chaque partage",()=>{
 assert.throws(()=>validateVolunteerReport({category:"bug",description:"J'ai constaté un problème après deux tentatives documentées.",consent:false}),/consentement/);
 assert.equal(validateVolunteerReport({category:"solution",description:"Cette opération fonctionne après une sauvegarde et trois tests.",consent:true}).category,"solution");
});
test("Bloque les secrets probables avant prévisualisation",()=>{
 assert.throws(()=>validateVolunteerReport({category:"bug",description:"Bug et clé github_pat_abcdefghijk12345678901234567890 en clair",consent:true}),/secret/i);
});
test("N'invente pas de connaissances validées",()=>{
 assert.deepEqual(validateLearningCatalog(base),[]);
 assert.throws(()=>validateLearningCatalog({...base,reviewedEntries:[{
 id:"AL-0001",title:"Correctif",lesson:"Le correctif fonctionne selon un scénario de test reproductible.",category:"bug",
 reviewed:false,source:"https://github.com/davidderetour-ai/echecs-jeux-ia/issues/2"
 }]}),/invalide/);
});
test("Accepte une fiche revue avec source officielle",()=>{
 assert.equal(validateLearningCatalog({...base,reviewedEntries:[{
 id:"AL-0001",title:"Corriger un formulaire",lesson:"Tester le formulaire avec un champ vide, une erreur et une valeur valide.",category:"solution",reviewed:true,
 source:"https://github.com/davidderetour-ai/echecs-jeux-ia/issues/2"
 }]}).length,1);
});
test("Les alertes sont informatives et ne suppriment aucune copie",()=>{
 assert.deepEqual(validateSafetyNotices({...base,blockedVersions:[],notices:[]}).versions,[]);
 assert.throws(()=>validateSafetyNotices({...base,blockedVersions:["../evil"],notices:[]}),/version/);
});
