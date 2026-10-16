import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { livingPose } from "./avatar-motion-autonomous.mjs";

test("Alicia tourne seule de face jusqu'au dos puis revient de face",()=>{
 const front=livingPose(0).yaw, back=livingPose(15_000).yaw, again=livingPose(25_000).yaw;
 assert.ok(Math.abs(front)<.2);
 assert.ok(Math.abs(back-Math.PI)<.01);
 assert.ok(Math.abs(again-2*Math.PI)<.15);
});
test("Le corps et les mains bougent pendant qu'Alicia parle sans intervention",()=>{
 const a=livingPose(0,{speaking:true}),b=livingPose(3000,{speaking:true});
 assert.notEqual(a.armL,b.armL);
 assert.notEqual(a.armR,b.armR);
 assert.notEqual(a.head,b.head);
 assert.notEqual(a.step,b.step);
});
test("Respecte la réduction de mouvement et la pause",()=>{
 const a=livingPose(15_000,{reducedMotion:true}),b=livingPose(15_000,{paused:true});
 assert.equal(a.yaw,0);assert.equal(b.yaw,0);
});
test("Le portrait WebGL a deux jambes, des mains, et un dos éclairé",()=>{
 const s=readFileSync(new URL("./avatar-autonomous.js",import.meta.url),"utf8");
 for(const fragment of ["p.armL","p.armR","p.head","ball(hand","p.step","- .318"]) {
  if(fragment==="- .318") assert.match(s,/,-\.318/);
  else assert.ok(s.includes(fragment),fragment);
 }
 assert.match(s,/AliciaFallback/);
 assert.doesNotMatch(s,/canvas\.addEventListener\("pointermove"/);
});
test("Le mode de secours reste clairement étiqueté 2D",()=>{
 const css=readFileSync(new URL("./avatar-fallback.css",import.meta.url),"utf8");
 const script=readFileSync(new URL("./avatar-fallback.js",import.meta.url),"utf8");
 assert.match(css,/alicia-fallback-turn/);
 assert.match(script,/avatar 2D autonome de secours/);
});
