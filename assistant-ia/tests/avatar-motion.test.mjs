import test from "node:test";
import assert from "node:assert/strict";
import {blinkAmount,mouthOpening,gazeFromPointer,moodLook,clamp} from "../avatar-motion.mjs";

test("Clignement : paupières ouvertes entre deux cycles",()=>{
 assert.equal(blinkAmount(0),1);
 assert.equal(blinkAmount(1000),1);
 assert.equal(blinkAmount(1000,{reducedMotion:true}),1);
});
test("Clignement naturel : fermeture et réouverture avec bornes",()=>{
 const samples=[];
 for(let t=3300;t<4600;t+=8)samples.push(blinkAmount(t));
 assert.ok(samples.some(x=>x<.15),"au moins un instant paupières fermées");
 assert.ok(samples.every(x=>x>=.06&&x<=1));
 assert.equal(blinkAmount(5200),1,"les paupières réouvrent pour le cycle suivant");
});
test("La bouche reste fermée si Alicia ne parle pas",()=>{
 for(let t=0;t<3000;t+=100)assert.equal(mouthOpening(t,{speaking:false}),0);
});
test("Pendant la parole la bouche est animée même sans lecture phonétique",()=>{
 const values=[];
 for(let t=0;t<500;t+=25)values.push(mouthOpening(t,{speaking:true,lastBoundary:0}));
 assert.ok(new Set(values.map(v=>v.toFixed(3))).size>5);
 assert.ok(values.every(x=>x>=.08&&x<=.88));
 assert.equal(mouthOpening(400,{speaking:true,reducedMotion:true}),.17);
});
test("Le regard suit la zone touchée sans dépasser les limites",()=>{
 const center=gazeFromPointer({x:50,y:50,width:100,height:100});
 assert.equal(center.x,0);assert.equal(center.y,0);
 const right=gazeFromPointer({x:90,y:40,width:100,height:100});
 assert.ok(right.x>0&&right.y>0);
 const beyond=gazeFromPointer({x:1e6,y:-100,width:100,height:100});
 assert.equal(beyond.x,1);assert.equal(beyond.y,1);
});
test("Expressions distinctes et entrée inconnue repli neutre",()=>{
 assert.ok(moodLook("joyful").smile>moodLook("neutral").smile);
 assert.ok(moodLook("curious").brow>moodLook("thoughtful").brow);
 assert.deepEqual(moodLook("n'importe quoi"),moodLook("neutral"));
 assert.equal(clamp(Infinity,0,1),0);
});
