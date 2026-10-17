import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newFrenchDraughts,legalFrenchMoves,applyFrenchMove,undoFrench,chooseFrenchAlicia,frenchAdvice} from "../dames-francaises-engine.mjs";
import {ALICIA_GAMES,getAliciaGame,aliciaGameLink,GAME_PRICE} from "../alicia-games.mjs";
const read=f=>readFileSync(new URL("../"+f,import.meta.url),"utf8");
function position(items,turn="white"){
 const g=newFrenchDraughts();g.board=Array.from({length:10},()=>Array(10).fill(null));g.turn=turn;
 for(const [r,c,side,king=false] of items)g.board[r][c]={side,king};
 return g;
}
test("Dames 10x10 : 100 cases et vingt pions dans chaque camp",()=>{
 const g=newFrenchDraughts();
 assert.equal(g.board.length,10);
 assert.ok(g.board.every(row=>row.length===10));
 assert.equal(g.board.flat().filter(p=>p?.side==="white").length,20);
 assert.equal(g.board.flat().filter(p=>p?.side==="black").length,20);
 assert.equal(g.turn,"white");
 assert.ok(legalFrenchMoves(g).length>0);
});
test("La prise en arrière du pion est autorisée et obligatoire",()=>{
 const g=position([[4,3,"white"],[5,4,"black"],[1,0,"black"]]);
 const m=legalFrenchMoves(g);
 assert.ok(m.length>0);
 assert.ok(m.every(x=>x.captures.length===1));
 assert.ok(m.some(x=>x.to.r===6&&x.to.c===5));
});
test("Les prises maximales priment sur une rafle plus courte",()=>{
 const g=position([[5,2,"white"],[5,6,"white"],[4,3,"black"],[2,5,"black"],[4,7,"black"]]);
 const m=legalFrenchMoves(g);
 assert.ok(m.length>0);
 assert.ok(m.every(x=>x.captures.length===2),JSON.stringify(m));
 const result=applyFrenchMove(g,m[0]);
 assert.equal(result.board.flat().filter(p=>p?.side==="black").length,1);
 assert.equal(result.turn,"black");
 assert.equal(g.board.flat().filter(p=>p?.side==="black").length,3,"Le coup ne mute pas l'original");
});
test("Promouvoir en dame puis effectuer un déplacement longue portée",()=>{
 const g=position([[1,2,"white"],[8,1,"black"]]);
 const move=legalFrenchMoves(g).find(x=>x.to.r===0);
 assert.ok(move);
 const next=applyFrenchMove(g,move);
 assert.equal(next.board[move.to.r][move.to.c].king,true);
 const king=position([[7,2,"white",true],[0,9,"black"]]);
 assert.ok(legalFrenchMoves(king).some(x=>Math.abs(x.to.r-x.from.r)>=3&&x.captures.length===0));
});
test("Dame volante : rafle à distance de deux pièces",()=>{
 const g=position([[7,2,"white",true],[5,4,"black"],[2,7,"black"]]);
 const moves=legalFrenchMoves(g);
 assert.ok(moves.some(x=>x.captures.length===2),JSON.stringify(moves));
 assert.ok(moves.every(x=>x.captures.length===2));
});
test("Annulation des coups, coup illégal rejeté et choix de l'IA légal",()=>{
 const g=newFrenchDraughts(),move=legalFrenchMoves(g)[0];
 assert.equal(applyFrenchMove(g,{from:{r:9,c:0},to:{r:0,c:0},captures:[]}),null);
 const next=applyFrenchMove(g,move);assert.ok(next);
 const old=undoFrench(next);assert.deepEqual(old.board,g.board);assert.equal(old.turn,g.turn);
 const best=chooseFrenchAlicia(g,{level:3});assert.ok(best);
 assert.ok(legalFrenchMoves(g).some(x=>JSON.stringify(x)===JSON.stringify(best)));
 assert.match(frenchAdvice(g).text,/Alicia propose/);
});
test("Catalogue de tous les jeux : dames françaises, rôles et gratuité",()=>{
 const game=getAliciaGame("dames10");assert.equal(game.path,"dames-francaises.html");
 assert.equal(GAME_PRICE,0);
 assert.ok(ALICIA_GAMES.length>=17);
 for(const role of ["opponent","partner","training"]){
  assert.match(aliciaGameLink("dames10",{role}),new RegExp("role="+role));
  assert.match(aliciaGameLink("go19",{role}),/go\.html\?alicia=go19/);
 }
 assert.equal(aliciaGameLink("inconnu"),null);
});
test("Les pages Alicia iPhone/Mac exposent les trois modes et les 17 jeux",()=>{
 const home=read("app.js"),html=read("dames-francaises.html"),js=read("dames-francaises.js"),
   ui=read("assistant-ia/alicia-play-ui.mjs");
 assert.match(home,/data-alicia-role/);assert.match(home,/dames-francaises\.html/);
 assert.match(html,/data-role="opponent"/);assert.match(html,/data-role="partner"/);
 assert.match(html,/data-role="training"/);
 assert.match(js,/applyFrenchMove/);
 assert.match(ui,/dames10/);
 assert.match(ui,/linkForGame\(id,role/);
 const sw=read("sw.js");
 assert.match(sw,/dames-francaises-engine\.mjs/);
 assert.match(sw,/alicia-games\.mjs/);
});
