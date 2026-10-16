import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const read=p=>fs.readFileSync(new URL(p,import.meta.url),"utf8");
test("le moteur répond localement au bonjour sans inventer une connexion IA",()=>{
 const ctx={window:{},document:{getElementById:()=>null,addEventListener:()=>{}},
 navigator:{onLine:false},Date,setTimeout,clearTimeout,console,fetch:async()=>{throw Error("offline")}};
 vm.runInNewContext(read("./mac-ai.js"),ctx,{timeout:500});
 const greeting=ctx.window.AliciaMacAI.offlineGreeting("bonjour alicia");
 assert.match(greeting.answer,/Bonjour/);
 assert.match(greeting.answer,/sans Internet/);
 assert.equal(greeting.local,true);
 assert.equal(ctx.window.AliciaMacAI.offlineGreeting("explique la relativité"),null);
});
test("le chargeur natif fournit le SDK en HTTPS sans introduire de clé payante",()=>{
 const swift=read("./AliciaV04.swift");
 assert.match(swift,/https:\/\/js\.puter\.com\/v2\//);
 assert.match(swift,/URLSessionConfiguration\.ephemeral/);
 assert.match(swift,/\/puter-sdk\.js/);
 assert.match(swift,/127\.0\.0\.1/);
 assert.doesNotMatch(swift,/NSAllowsArbitraryLoads.*true/);
});
test("le portrait fidèle est distingué du modèle 3D stylisé",()=>{
 const s=read("./avatar-photo.js");
 assert.match(s,/AliciaPortrait\.jpg/);
 assert.match(s,/corps 3D stylisé/);
});
test("champ de saisie sur plusieurs lignes et diagnostic visibles",()=>{
 const css=read("./mac-v04.css");
 const script=read("./mac-ai.js");
 assert.match(css,/#question\{min-height:155px/);
 assert.match(script,/Puter ne répond pas dans WebKit/);
 assert.match(script,/Tester la connexion IA/);
});
