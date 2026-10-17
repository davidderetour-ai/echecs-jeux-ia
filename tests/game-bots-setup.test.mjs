import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALICIA_GAMES} from '../alicia-games.mjs';
import {GAME_BOT_PROFILES,botSettings,supportsLocalDuel} from '../game-bots.mjs';
import {gameSetupSpec,safeSetup,standaloneGameUrl,PREPARABLE_GAME_IDS} from '../game-setup.mjs';
import {renderGamePreparation} from '../game-setup-ui.mjs';
import {newChess,botChess,playMove} from '../engine.js';
import {newMini,botMini,playMini} from '../mini.js';
import {freshShogi,shogiBot,playShogi} from '../shogi-engine.js';

test('Tous les jeux ont une fiche de préparation sans option invalide',()=>{
 assert.equal(PREPARABLE_GAME_IDS.length,ALICIA_GAMES.length);
 for(const game of ALICIA_GAMES){
  const spec=gameSetupSpec(game.id);
  assert(spec,game.id);assert.equal(spec.id,game.id);
  const safe=safeSetup(game.id,{level:999,mode:'admin',bot:'inexistant'});
  assert(safe,game.id);assert(spec.modes.includes(safe.mode));
  if(spec.maxLevel)assert(safe.level<=spec.maxLevel);
  const rendered=renderGamePreparation(game.id,safe,[]);
  assert.match(rendered,/Préparer ma partie/);
  assert.match(rendered,/launch-configured-game/);
  if(spec.path!=='index.html'){
   const url=standaloneGameUrl(safe);assert(url?.includes('launch=1'),game.id);
   assert(!url.includes('role=')||game.id!=='dames10','pas de réinitialisation de dames via le rôle');
  }
 }
});
test('IA locale : cinq profils, niveaux bornés et choix cohérent',()=>{
 assert.deepEqual(GAME_BOT_PROFILES.map(p=>p.id),['alicia','explorateur','tacticien','stratège','maitre']);
 for(const p of GAME_BOT_PROFILES){
  const opts=botSettings(p.id,3,6);
  assert(opts.level>=1&&opts.level<=6);
  assert(['balanced','explorer','offensive','cautious'].includes(opts.style));
  assert(renderGamePreparation('chess2',{mode:'ai',bot:p.id,level:3},[]).includes(p.name));
 }
 assert.equal(botSettings('maitre',5,5).level,5);
 assert.equal(botSettings('explorateur',1,6).level,1);
});
test('Mode Alicia contre IA uniquement lorsque les deux camps peuvent jouer',()=>{
 for(const id of PREPARABLE_GAME_IDS){
  const spec=gameSetupSpec(id);
  assert.equal(spec.modes.includes('duel'),supportsLocalDuel(id),id);
  if(spec.modes.includes('duel'))assert.match(renderGamePreparation(id,{mode:'duel',bot:'tacticien'},[]),/Alicia contre une autre IA/);
 }
 assert.equal(gameSetupSpec('go19').modes.includes('duel'),false);
 assert.equal(gameSetupSpec('dames10').modes.includes('duel'),false);
 assert.equal(gameSetupSpec('peace').modes.includes('duel'),false);
});
test('Moteurs réels : deux coups IA légaux aux échecs à deux',()=>{
 let g=newChess('chess2');
 for(const side of ['white','black']){
  assert.equal(g.colors[g.turn],side);
  const bot=botSettings(side==='white'?'alicia':'tacticien',2);
  const m=botChess(g,bot.level,bot.style);
  assert(m,'coup IA manquant '+side);
  g=playMove(g,m);
  assert(g,'coup IA illégal '+side);
 }
});
test('Moteurs réels : les deux camps des mini-jeux peuvent bouger',()=>{
 for(const id of ['checkers','reversi','connect4','fox','saut','north','nim']){
  let g=newMini(id),count=0;
  for(let turn=0;turn<2&&!g.over;turn++){
   const m=botMini(g,2);
   if(!m)break;
   const next=playMini(g,m);
   assert(next,'coup illégal pour '+id);
   g=next;count++;
  }
  assert(count>=1,'aucun coup IA pour '+id);
 }
});
test('Shogi : le même moteur permet les deux camps',()=>{
 let g=freshShogi();
 for(let i=0;i<2;i++){
  const m=shogiBot(g);assert(m,'aucun coup Shogi à '+i);
  const next=playShogi(g,m);assert(next);
  g=next;
 }
});
test('iPhone : cache et script de duel présents, sans perte du stockage',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const shogi=readFileSync(new URL('../shogi-app.js',import.meta.url),'utf8');
 assert.match(sw,/game-bots\.mjs/);
 assert.match(app,/controllers=\{\.\.\.controllers,white:aiDuel\?'bot':'human'/);
 assert.match(app,/botSettings\(aiDuel&&aliciaSide\?'alicia':gameBotId/);
 assert.match(app,/localStorage\.setItem\("v2-saves"/);
 assert.match(shogi,/scheduleShogiDuel\(\)/);
 assert.match(shogi,/export function unmountShogi\(\)\{state\.root=null/);
});
