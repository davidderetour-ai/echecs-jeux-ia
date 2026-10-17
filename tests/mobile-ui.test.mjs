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
 const ids=["chess2","chess4","dames10","go9","shogi"];
 for(const id of ids){
  assert(ALICIA_GAMES.some(g=>g.id===id),id);
  assert(js.includes('["'+id+'",'),id+" absent de l'accueil simple");
 }
 assert(ALICIA_GAMES.some(g=>g.id==="peace"),"Les défis restent accessibles dans les autres jeux");
 assert.match(js,/ALICIA_GAMES\.filter\(g=>!mainIds\.has\(g\.id\)\)/);
});
test("Accueil simple : bouton reprendre sans réinitialiser la partie",()=>{
 assert.match(js,/data-action="resume-fullscreen" class="chosen-resume-button">▶ Reprendre/);
 assert.match(js,/game&&!game.over/);
 assert.match(js,/data-alicia-role=/);
 assert.match(js,/chosen-home/);
 assert.match(js,/chosen-header/);
 assert.match(js,/chosen-games/);
 assert.match(js,/chosen-continue/);
 assert.match(js,/data-prepare-game=/);
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
 assert.match(ipa,/3\.9\.3/);
 assert.match(swift,/private let displayVersion = "3\.9\.3"/);
});

test("Changement de jeu : confirmation et copie sûre sans remplacer les anciennes sauvegardes",()=>{
 assert.match(js,/function protectCurrentGame\(\)/);
 assert.match(js,/if\(!confirm\(/);
 assert.match(js,/localStorage\.setItem\("v2-saves",JSON\.stringify\(slots\)\)/);
 assert.match(js,/function start\(id,previousProtected=false\)/);
 assert.match(js,/function launchConfiguredGame\(\)/);
 assert.match(js,/if\(!protectCurrentGame\(\)\)return;/);
});
test("iPhone : barre compacte et navigation native de secours",()=>{
 assert.match(swift,/nativeBar\.heightAnchor\.constraint\(equalToConstant: 54\)/);
 assert.match(swift,/#selector\(nativeGamesMenu\)/);
 assert.match(swift,/#selector\(nativeDiagnostic\)/);
 assert.match(swift,/UIAlertController\(title: "Choisis ton jeu"/);
 assert.match(swift,/nativeHome\(\)/);
 assert.match(swift,/nativeGo\(\)/);
 assert.match(swift,/nativeDames\(\)/);
});

test("Interface exacte choisie : rubriques et actions fonctionnelles",()=>{
 for(const label of ["Échecs & Jeux IA","Bonjour !","Jouer","Continuer","Réglages rapides","Mode de jeu","Minuteur","Difficulté de l'IA","Partager avec mes amis"]){
  assert(js.includes(label),label);
 }
 for(const key of ['data-action="toggle-clock"','data-ui-level="','data-action="share-app"','data-action="show-other-games"','data-action="choose-local"','data-tab="friends"']){
  assert(js.includes(key),key);
 }
 assert.match(js,/navigator\.share\(/);
 assert.match(js,/level=chosen;save\(\);render\(\)/);
});
test("La barre inférieure a Accueil, Jouer, Amis, Plus",()=>{
 const nav=html.match(/<nav class="topnav"[\s\S]*?<\/nav>/)?.[0];
 assert(nav);
 for(const key of ['data-tab="home"','data-tab="play"','data-tab="friends"','data-tab="train"']){
  assert(nav.includes(key),key);
 }
 assert.match(css,/body\.chosen-home-active \.topnav\{position:fixed/);
 assert.match(css,/\.chosen-role button\.selected/);
});
