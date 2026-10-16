// Tests de regression du moteur, sans dependances externes.
// Execution : node --test tests/engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {newChess, legalMoves, playMove, undo, valid, COLORS4} from '../engine.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

test('echecs classiques : 20 coups legaux au depart',()=>{
 const g=newChess('chess2');
 assert.equal(g.colors[g.turn],'white');
 assert.equal(legalMoves(g).length,20);
});

test('echecs a 4 : cases des coins interdites et 4 joueurs',()=>{
 const g=newChess('chess4');
 assert.equal(g.size,14);
 assert.deepEqual(g.colors,COLORS4);
 assert.equal(valid(g,0,0),false);
 assert.equal(valid(g,3,3),true);
 assert.ok(legalMoves(g).length>0);
});

test('un coup valide avance le tour, annuler restaure la position',()=>{
 const g=newChess('chess4');
 const move=legalMoves(g)[0];
 assert.ok(move,'un coup initial est disponible');
 const next=playMove(g,move);
 assert.ok(next,'le coup est accepte');
 assert.equal(next.ply,g.ply+1);
 assert.notEqual(next.turn,g.turn);
 const back=undo(next);
 assert.ok(back,'annulation disponible');
 assert.ok(same(back.board,g.board));
 assert.equal(back.turn,g.turn);
});

test('une sequence de 12 coups ne fait pas planter le moteur',()=>{
 let g=newChess('chess4');
 for(let i=0;i<12;i++){
  if(g.over)break;
  const moves=legalMoves(g);
  if(!moves.length)break;
  const next=playMove(g,moves[0]);
  assert.ok(next,`coup ${i+1} accepte`);
  assert.equal(next.ply,g.ply+1);
  g=next;
 }
 assert.ok(g.ply>=3,'au moins trois coups effectues');
});


test('24 coups : chaque coup conserve un plateau valide et un historique borne',()=>{
 let g=newChess('chess4');
 for(let i=0;i<24;i++){
  if(g.over)break;
  const moves=legalMoves(g);
  if(!moves.length)break;
  const before=JSON.stringify(g);
  const next=playMove(g,moves[i%moves.length]);
  assert.ok(next,`coup ${i+1}`);
  assert.equal(JSON.stringify(g),before,'le coup ne modifie pas la position precedente');
  assert.equal(next.board.length,14);
  assert.ok(next.board.every(row=>row.length===14));
  assert.ok(next.history.length<=40);
  g=next;
 }
 assert.ok(g.ply>=3);
});

test('coup impossible refuse sans modifier la partie',()=>{
 const g=newChess('chess4');
 const before=JSON.stringify(g);
 const result=playMove(g,{from:{r:0,c:0},to:{r:1,c:1}});
 assert.equal(result,null);
 assert.equal(JSON.stringify(g),before);
});

test('sauvegarde JSON et restauration conservent les coups possibles',()=>{
 let g=newChess('chess4');
 for(let i=0;i<4;i++){
  const moves=legalMoves(g);
  assert.ok(moves.length);
  g=playMove(g,moves[0]);
  assert.ok(g);
 }
 const restored=JSON.parse(JSON.stringify(g));
 assert.deepEqual(restored.board,g.board);
 assert.deepEqual(legalMoves(restored),legalMoves(g));
});
