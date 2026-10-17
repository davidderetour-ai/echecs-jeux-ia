import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ALICIA_GAMES} from "../alicia-games.mjs";

const js=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const swift=readFileSync(new URL("../native/echecs_ios/EchecsJeuxIA.swift",import.meta.url),"utf8");
const ipa=readFileSync(new URL("../native/echecs_ios/build_ipa.sh",import.meta.url),"utf8");

test("Les six jeux directs sont disponibles avec un moteur Alicia",()=>{
 const ids=["chess2","chess4","dames10","go9","shogi","peace"];
 for(const id of ids){
  assert(ALICIA_GAMES.some(g=>g.id===id),id);
  assert(js.includes('["'+id+'",'),id+" absent de l'accueil simple");
 }
});
test("Accueil simple : bouton reprendre sans réinitialiser la partie",()=>{
 assert.match(js,/data-tab="play">↩ Reprendre ma partie/);
 assert.match(js,/game&&!game.over/);
 assert.match(js,/data-alicia-role=/);
 assert.match(js,/data-alicia-game=/);
 assert.match(js,/easy-games-extra/);
 assert.match(js,/easy-more/);
 assert.match(js,/data-tab="friends"/);
});
test("Navigation claire conservant les anciens jeux et aides",()=>{
 const nav=html.match(/<nav class="topnav"[\s\S]*?<\/nav>/)?.[0];
 assert(nav,"navigation absente");
 for(const name of ['data-tab="home"','data-tab="play"','data-tab="train"','data-tab="shogi"','data-tab="friends"','data-tab="junior"','data-tab="settings"','data-action="voice-ask"','data-action="toggle-network"']){
  assert(nav.includes(name),name);
 }
 assert.match(nav,/class="nav-more"/);
 assert.match(css,/\.easy-games/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/\.native-ios \.header\{display:none\}/);
});
test("App iPhone : identité préservée et lancement pleine taille",()=>{
 assert.match(ipa,/<string>fr\.echecsjeuxia\.iphone\.native<\/string>/);
 assert.match(ipa,/LaunchScreen\.storyboardc/);
 assert.match(ipa,/UILaunchStoryboardName/);
 assert.match(ipa,/3\.9\.1/);
 assert.match(swift,/private let displayVersion = "3\.9\.1"/);
});
