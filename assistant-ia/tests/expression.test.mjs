import test from "node:test";
import assert from "node:assert/strict";
import {chooseExpression,normalizeExpression,EXPRESSIONS} from "../expression-core.mjs";

test("Expressions définies et mode inconnu neutre",()=>{
 assert.equal(Object.keys(EXPRESSIONS).length,9);
 assert.equal(normalizeExpression("joyful"),"joyful");
 assert.equal(normalizeExpression("sad"),"sad");
 assert.equal(normalizeExpression("afraid"),"afraid");
 assert.equal(normalizeExpression("angry"),"angry");
 assert.equal(normalizeExpression("quelque-chose-d'autre"),"neutral");
});
test("Une activité intellectuelle passe par la concentration",()=>{
 assert.equal(chooseExpression({text:"",mode:"math"}),"thoughtful");
 assert.equal(chooseExpression({text:"",mode:"science",phase:"thinking"}),"thoughtful");
});
test("Alicia peut exprimer l'encouragement sans attribuer des sentiments à l'utilisateur",()=>{
 assert.equal(chooseExpression({text:"Bravo pour ta réussite !"}),"joyful");
 assert.equal(chooseExpression({text:"Désolé pour la panne."}),"supportive");
 assert.equal(chooseExpression({text:"Que veux-tu savoir ?",phase:"user"}),"curious");
});
test("La composition musicale déclenche une expression inspirée",()=>{
 assert.equal(chooseExpression({mode:"music"}),"creative");
 assert.equal(chooseExpression({text:"Je prépare un dessin."}),"creative");
});
test("Le visage est neutre lorsque le texte ne donne pas d'indice",()=>{
 assert.equal(chooseExpression({text:"Bonjour."}),"neutral");
 assert.equal(chooseExpression({phase:"intro"}),"neutral");
});
