import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const code=readFileSync(new URL("../puter-engine.js",import.meta.url),"utf8");
function env({online=true,signed=true,ai=true}={}){
 const nodes={};let calls=[];
 const document={getElementById:id=>(nodes[id]??={
  value:"",textContent:"",disabled:false,addEventListener(){},
 })};
 const puter={
  ai:{chat:async(msg,opts)=>{calls.push({msg,opts});return {message:{content:"Bonjour, je suis Alicia."}}}},
  auth:{signIn:async()=>({}),isSignedIn:async()=>signed}
 };
 const window={puter:ai?puter:undefined,addEventListener:()=>{}};
 const context={window,navigator:{onLine:online},document,console};
 runInNewContext(code,context);
 return {engine:window.AliciaPuter,nodes,calls,puter};
}
test("Répond par un vrai appel IA avec contexte français, sans achat",async()=>{
 const e=env();
 const r=await e.engine.answer({messages:[{role:"user",content:"Bonjour"}],mode:"french"});
 assert.equal(r.answer,"Bonjour, je suis Alicia.");
 assert.equal(e.calls.length,1);
 assert.equal(e.calls[0].opts.normalize,true);
 assert.equal(e.calls[0].opts.model,"gpt-5.4-nano");
 assert.match(e.calls[0].msg[0].content,/Alicia/);
});
test("Refuse l'IA si utilisateur non connecté ou hors ligne",async()=>{
 const a=env({signed:false});
 await assert.rejects(a.engine.answer({messages:[{role:"user",content:"Bonjour"}]}),/Connecte/);
 assert.equal(a.calls.length,0);
 const b=env({online:false});
 await assert.rejects(b.engine.answer({messages:[{role:"user",content:"Bonjour"}]}),/Internet/);
});
test("Ne fait jamais la seconde lecture si vérification non demandée",async()=>{
 const a=env();
 await a.engine.answer({messages:[{role:"user",content:"Bonjour"}],verify:false});
 assert.equal(a.calls.length,1);
 const b=env();
 await b.engine.answer({messages:[{role:"user",content:"Bonjour"}],verify:true});
 assert.equal(b.calls.length,2);
});
test("Si le fournisseur refuse, pas de repli sur une API payante",async()=>{
 const e=env();
 e.puter.ai.chat=async()=>{throw Error("quota épuisé")};
 await assert.rejects(e.engine.answer({messages:[{role:"user",content:"Bonjour"}]}),/quota/);
 assert.equal(e.calls.length,0);
});
