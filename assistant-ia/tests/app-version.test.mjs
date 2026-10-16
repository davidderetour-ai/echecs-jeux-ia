import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");

test("Alicia affiche sa version lisible sous son nom",()=>{
 assert.match(html,/<small class="app-version-label" id="app-version-label">Version 0\.8\.0<\/small>/);
 assert.match(css,/\.brand \.app-version-label/);
});
test("La rubrique À propos explique version et mise à jour",()=>{
 assert.match(html,/<details class="version-details" id="app-version-details">/);
 assert.match(html,/Version de l’application : 0\.8\.0/);
 assert.match(html,/numéro interne du cache/);
});
test("Le cache ne supprime pas les sauvegardes/caches des jeux",()=>{
 assert.match(sw,/const CACHE="alicia-shell-v28"/);
 assert.match(sw,/const ALICIA_CACHE_PREFIX="alicia-shell-"/);
 assert.match(sw,/names\.filter\(n=>n\.startsWith\(ALICIA_CACHE_PREFIX\)&&n!==CACHE\)/);
 assert.doesNotMatch(sw,/names\.filter\(n=>n!==CACHE\)/);
});
