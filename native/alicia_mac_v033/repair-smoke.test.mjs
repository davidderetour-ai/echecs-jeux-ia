import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=name=>readFileSync(new URL("./"+name,import.meta.url),"utf8");
test("le portrait est toujours visible avant le chargement du JavaScript",()=>{
 const html=source("avatar-preview.html"),css=source("avatar-preview.css");
 assert.match(html,/id="alicia-avatar-preview"/);
 assert.match(html,/alicia-preview-back/);
 assert.match(html,/alicia-preview-eyes/);
 assert.match(html,/alicia-preview-mouth/);
 assert.match(html,/alicia-preview-arm-left/);
 assert.match(html,/alicia-preview-arm-right/);
 assert.match(css,/alicia-start-turn/);
 assert.match(css,/data-alicia-3d="ready"/);
});
test("la 3D n'écrase pas le portrait avant d'avoir dessiné un vrai pixel",()=>{
 const code=source("avatar-autonomous.js");
 assert.match(code,/gl\.readPixels/);
 assert.match(code,/rgba\[3\]>0/);
 assert.match(code,/window\.AliciaShow3D/);
 assert.doesNotMatch(code,/Object\.hasOwn\(/);
});
test("la connexion Puter peut être retentée par l'utilisateur",()=>{
 const code=source("puter-recovery.js");
 assert.match(code,/puter-retry/);
 assert.match(code,/https:\/\/js\.puter\.com\/v2\//);
 assert.match(code,/window\.AliciaPuterRetry/);
 assert.match(code,/WebKit/);
 assert.doesNotMatch(code,/localStorage\.setItem\(["'].*password/i);
});
test("le serveur Mac conserve un accès local seulement",()=>{
 const code=source("AliciaV033.swift");
 assert.match(code,/127\.0\.0\.1/);
 assert.match(code,/in_addr\(s_addr:/);
});
