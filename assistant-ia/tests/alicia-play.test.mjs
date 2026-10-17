import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GAMES,linkForGame,understandPlayRequest} from "../alicia-play-ui.mjs";
const read=f=>readFileSync(new URL("../"+f,import.meta.url),"utf8");
test("Tous les jeux, dont les dames françaises internationales, sont disponibles sur iPhone et Mac",()=>{
 assert.ok(GAMES.length>=17);
 assert.ok(GAMES.some(([id])=>id==="dames10"));
 assert.ok(GAMES.some(([id])=>id==="go19"));
 assert.ok(GAMES.some(([id])=>id==="shogi"));
 assert.ok(GAMES.some(([id])=>id==="memory"));
 assert.ok(GAMES.some(([id])=>id==="peace"));
});
test("Les trois rôles sont accessibles pour chaque jeu avec un lien GitHub Pages",()=>{
 for(const [id,name,type] of GAMES)for(const role of ["opponent","partner","training"]){
  const url=linkForGame(id,role);
  assert.ok(url.startsWith("https://davidderetour-ai.github.io/echecs-jeux-ia/"));
  assert.ok(url.includes("alicia="+id));
  assert.ok(url.includes("role="+role));
 }
 assert.match(linkForGame("dames10"),/dames-francaises\.html/);
 assert.equal(linkForGame("inconnu"),null);
});
test("Alicia comprend plusieurs demandes en français sur les dames",()=>{
 assert.equal(understandPlayRequest("Alicia joue avec moi aux dames françaises"),"dames10");
 assert.equal(understandPlayRequest("Je veux jouer aux échecs à quatre joueurs"),"chess4");
 assert.equal(understandPlayRequest("Jouer au jeu de Go 19"),"go19");
 assert.equal(understandPlayRequest("Alicia entraîne-moi aux dames internationales"),"dames10");
 assert.equal(understandPlayRequest("Quelle est la météo demain"),null);
});
test("Les commandes de jeu fonctionnent via le moteur de chat sans changer les voix",()=>{
 const app=read("app.js"),html=read("index.html"),sw=read("sw.js"),ui=read("alicia-play-ui.mjs");
 assert.match(app,/AliciaPlay\?\.answer/);
 assert.match(html,/alicia-play-ui\.mjs/);
 assert.match(sw,/alicia-play-ui\.mjs/);
 assert.match(ui,/data-role/);
 assert.match(ui,/target="_self"|a\.target="_self"/);
 assert.doesNotMatch(ui,/speechSynthesis\.getVoices|ALICIA_GITHUB_TOKEN/);
});
