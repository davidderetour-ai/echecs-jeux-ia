import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const src=readFileSync(new URL("../wifi-policy.js",import.meta.url),"utf8");

function setup(type="unknown",device="iPhone"){
 const events={},nodes={},created=[];
 const register=(id,fn)=>{events[id]=fn;};
 const document={
  visibilityState:"visible",
  getElementById(id){
   return nodes[id]??={
    value:id==="network-choice"?"auto":"",
    className:"",textContent:"",disabled:false,hidden:false,
    setAttribute(name,value){this[name]=value},
    addEventListener:(ev,fn)=>register(id+":"+ev,fn)
   };
  },
  createElement(tag){const x={tag};created.push(x);return x;},
  head:{append(el){window.puter={ai:{chat(){}},auth:{signIn(){},isSignedIn:async()=>true}};el.onload?.();}},
  addEventListener(event,cb){register("document:"+event,cb);}
 };
 const network={type,addEventListener(event,fn){register("network:"+event,fn);}};
 const navigator={
  userAgent:device==="iPhone"?"iPhone":"Macintosh",
  platform:device==="iPhone"?"iPhone":"MacIntel",
  maxTouchPoints:device==="iPhone"?5:0,
  onLine:true,connection:network
 };
 const window={innerWidth:390,addEventListener(event,fn){register("window:"+event,fn)}};
 runInNewContext(src,{document,navigator,window,console,Promise});
 return {window,document,navigator,nodes,events,created};
}
test("Sur Safari iPhone inconnu, pas de reconnexion non autorisée",async()=>{
 const e=setup();
 await Promise.resolve();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.throws(()=>e.window.AliciaWiFi.requireConfirmed(),/connexion Wi-Fi approuvée/);
 assert.equal(e.created.length,0,"Puter n'est pas chargé automatiquement sur réseau inconnu");
 assert.match(e.nodes["network-label"].textContent,/réseau inconnu/i);
 assert.equal(e.nodes["network-dot"].className,"network-dot unknown");
});
test("Le Wi-Fi réellement signalé affiche l'icône, le vert et reconnecte automatiquement",async()=>{
 const e=setup("wifi");
 await Promise.resolve();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 assert.equal(e.nodes["network-icon"].textContent,"📶");
 assert.equal(e.nodes["network-dot"].className,"network-dot online");
 assert.equal(e.created.length,1);
 assert.equal(e.created[0].src,"https://js.puter.com/v2/");
});
test("Réseau principal déclaré sur Safari : icône Wi-Fi, confirmation requise",async()=>{
 const e=setup();
 e.nodes["network-choice"].value="wifi-primary";
 e.events["network-choice:change"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.match(e.nodes["network-label"].textContent,/à confirmer/);
 await e.events["wifi-confirm:click"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 assert.match(e.nodes["network-label"].textContent,/Wi-Fi principal déclaré/);
 assert.equal(e.nodes["network-icon"].textContent,"📶");
 assert.equal(e.created.length,1);
});
test("Ethernet réellement détecté sur Mac : icône câble et connexion automatique",async()=>{
 const e=setup("ethernet","Mac");
 await Promise.resolve();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 assert.equal(e.nodes["network-icon"].textContent,"🔌");
 assert.equal(e.nodes["network-dot"].className,"network-dot online");
 assert.equal(e.created.length,1);
});
test("Ethernet déclaré sur iPhone : ne passe pas avant confirmation explicite",async()=>{
 const e=setup();
 e.nodes["network-choice"].value="ethernet";
 e.events["network-choice:change"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.equal(e.nodes["network-icon"].textContent,"🔌");
 await e.events["wifi-confirm:click"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 assert.match(e.nodes["network-label"].textContent,/Ethernet déclaré/);
});
test("Le cellulaire identifié reste interdit malgré une déclaration Wi-Fi",async()=>{
 const e=setup("cellular");
 e.nodes["network-choice"].value="wifi-primary";
 e.events["network-choice:change"]();
 assert.equal(e.nodes["network-dot"].className,"network-dot offline");
 await e.events["wifi-confirm:click"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.equal(e.created.length,0);
});
test("Une coupure réseau rougit l'indicateur et invalide la session",async()=>{
 const e=setup("wifi");
 await Promise.resolve();
 e.navigator.onLine=false;
 e.events["window:offline"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
 assert.equal(e.nodes["network-dot"].className,"network-dot offline");
 e.navigator.onLine=true;
 await e.events["window:online"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),true);
 e.navigator.connection.type="cellular";
 await e.events["network:change"]();
 assert.equal(e.window.AliciaWiFi.isApproved(),false);
});
test("Le nom du réseau n'est jamais prétendu détectable via Safari",()=>{
 const e=setup();
 assert.equal(e.window.AliciaWiFi.networkType(),"unknown");
 assert.equal(e.window.AliciaWiFi.selectedType().observed,false);
});
