import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const src=readFileSync(new URL("../wifi-policy.js",import.meta.url),"utf8");

function setup(type="unknown"){
 const events={},nodes={},created=[];
 const register=(id,fn)=>{events[id]=fn;};
 const document={
  visibilityState:"visible",
  getElementById(id){return nodes[id]??={textContent:"",disabled:false,addEventListener:(event,fn)=>register(id+":"+event,fn)};},
  createElement(tag){const x={tag};created.push(x);return x;},
  head:{append(el){window.puter={ai:{chat(){}},auth:{signIn(){}}};el.onload?.();}},
  addEventListener(event,cb){register("document:"+event,cb);}
 };
 const network={type,addEventListener(event,fn){register("network:"+event,fn);}};
 const navigator={userAgent:"iPhone",platform:"iPhone",maxTouchPoints:5,onLine:true,connection:network};
 const window={innerWidth:390,addEventListener(event,fn){register("window:"+event,fn)}};
 runInNewContext(src,{document,navigator,window,console});
 return {window,document,navigator,nodes,events,created};
}
test("Sans confirmation, Alicia n'envoie pas de demande IA",()=>{
 const e=setup();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.throws(()=>e.window.AliciaWiFi.requireConfirmed(),/Wi-Fi uniquement/);
 assert.equal(e.created.length,0,"le SDK Puter n'est pas chargé automatiquement");
});
test("Une confirmation volontaire autorise une session Wi-Fi",async()=>{
 const e=setup();
 await e.events["wifi-confirm:click"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 assert.equal(e.created.length,1);
 assert.equal(e.created[0].src,"https://js.puter.com/v2/");
});
test("Le réseau cellulaire explicitement connu bloque le chat",async()=>{
 const e=setup("cellular");
 assert.equal(e.nodes["wifi-confirm"].disabled,true);
 await e.events["wifi-confirm:click"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.equal(e.created.length,0);
});
test("Une coupure réseau ou un changement révoque l'accord",async()=>{
 const e=setup("wifi");
 await e.events["wifi-confirm:click"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 e.events["window:offline"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 await e.events["wifi-confirm:click"]();
 e.events["network:change"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
});
