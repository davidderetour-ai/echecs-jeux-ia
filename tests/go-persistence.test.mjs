import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {goStorageKey,validGoState,readGoSave,writeGoSave} from "../go-persistence.mjs";
const store=new Map(),storage={
 getItem:key=>store.get(key)||null,
 setItem:(key,value)=>store.set(key,String(value))
};
const board=n=>Array.from({length:n},()=>Array(n).fill(0));
const state=(n,mode="bot")=>({board:board(n),turn:1,captures:[0,0,0],passes:0,ended:false,mode,history:[]});
const source=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("Go : les 3 gobans ont des sauvegardes séparées",()=>{
 for(const n of [9,13,19]){
  const game=state(n);game.board[0][0]=1;game.board[n-1][n-1]=2;
  assert.equal(writeGoSave(n,game,storage),true);
  assert.equal(readGoSave(n,storage).board.length,n);
  assert.equal(readGoSave(n,storage).board[n-1][n-1],2);
 }
 assert.notEqual(goStorageKey(9),goStorageKey(13));
 assert.notEqual(goStorageKey(13),goStorageKey(19));
});
test("Go : le tour, les captures, les passes et l'historique sont restaurés",()=>{
 const original=state(9);
 const past=board(9);past[1][1]=1;
 original.board[1][1]=1;original.turn=2;original.captures=[0,3,4];original.passes=1;
 original.history=[{b:past,turn:1,captures:[0,0,0],passes:0,ended:false,key:past.flat().join("")}];
 assert.equal(writeGoSave(9,original,storage),true);
 const recovered=readGoSave(9,storage);
 assert.deepEqual(recovered.board,original.board);
 assert.deepEqual(recovered.history,original.history);
 assert.equal(recovered.turn,2);
 assert.deepEqual(recovered.captures,[0,3,4]);
 assert.equal(recovered.passes,1);
});
test("Go : sauvegarde corrompue ou taille invalide rejetée sans crash",()=>{
 const invalid=state(9);invalid.board[0][0]=9;
 assert.equal(writeGoSave(9,invalid,storage),false);
 store.set(goStorageKey(9),"{erreur");
 assert.equal(readGoSave(9,storage),null);
 store.set(goStorageKey(9),JSON.stringify({...state(9),schema:1,size:9,turn:8}));
 assert.equal(readGoSave(9,storage),null);
 assert.equal(validGoState({schema:1,...state(19),size:19},19),true);
 assert.equal(readGoSave(8,storage),null);
 assert.equal(writeGoSave(9,state(9),{setItem(){throw Error("quota");}}),false);
});
test("Go : chargement de la partie avant toute création, cache hors ligne inclus",()=>{
 const app=source("go.js"),serviceWorker=source("sw.js"),page=source("go.html");
 assert.match(app,/restoreOrFresh\(\)/);
 assert.match(app,/readGoSave\(size\)/);
 assert.match(app,/writeGoSave\(n,/);
 assert.match(app,/\$\(['\"]size['\"]\)\.onchange=restoreOrFresh/);
 assert.match(serviceWorker,/go-persistence\.mjs/);
 assert.match(page,/sauvegardées automatiquement/);
});
test("Dames : ouverture d'un lien Alicia sans effacer une partie du même rôle",()=>{
 const app=source("dames-francaises.js");
 assert.match(app,/if\(params\.has\("role"\)&&role!==savedRole\)/);
 assert.match(app,/study:study/);
 assert.doesNotMatch(app,/if\(params\.has\("role"\)\)\{game=newFrenchDraughts\(\);study=0;\}/);
});
