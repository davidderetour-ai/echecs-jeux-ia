import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../game-clocks.js",import.meta.url),"utf8");
function loadClock(initial){
 const localData=new Map(initial?[[ "echecs-clock-enabled-v1", initial ]]:[]);
 const handlers={};
 const doc={addEventListener:(kind,fn)=>handlers[kind]=fn,querySelectorAll:()=>[]};
 const window={};
 const context={window,document:doc,performance:{now:()=>1000},setInterval:()=>{},
  localStorage:{getItem:k=>localData.get(k)??null,setItem:(k,v)=>localData.set(k,v)}};
 vm.runInNewContext(source,context);
 return {api:window.GameClocks,localData};
}
test("Pendules désactivées par défaut : aucun affichage et aucun chrono en cours",()=>{
 const {api}=loadClock();
 assert.equal(api.enabled(),false);
 for(const mode of ["chess2","chess4","shogi"])assert.equal(api.markup(mode),"");
 api.sync("chess2","white",false);
 assert.equal(api.enabled(),false);
});
test("L'utilisateur peut activer/désactiver et garder son choix entre deux ouvertures",()=>{
 const {api,localData}=loadClock();
 assert.equal(api.toggle(),true);
 assert.match(api.markup("chess2"),/Pendule/);
 assert.match(api.markup("chess4"),/clock-four-controls/);
 assert.match(api.markup("shogi"),/Shogi/);
 assert.equal(localData.get("echecs-clock-enabled-v1"),"true");
 assert.equal(loadClock("true").api.enabled(),true);
 assert.equal(api.toggle(),false);
 assert.equal(api.markup("chess2"),"");
 assert.equal(localData.get("echecs-clock-enabled-v1"),"false");
});
