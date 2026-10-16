import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Référence iPhone Alicia officiellement documentée",()=>{
 const design=readFileSync(new URL("../../design/ALICIA_REFERENCE_IPHONE_2026-10-16.md",import.meta.url),"utf8");
 assert.match(design,/portrait blonde en chignon/i);
 assert.match(design,/bleu nuit/);
 assert.match(design,/iPhone et Android/);
 assert.match(design,/La capture est une/);
});
test("Même style bleu-violet sur iPhone et Mac avec commandes accessibles",()=>{
 const html=load("index.html"),css=load("alicia-reference-theme.css"),ui=load("alicia-reference-ui.js");
 for(const script of ["alicia-reference-ui.js","alicia-avatar3d.js"])
  assert.match(html,new RegExp('src="\\.\\/'+script.replace(".","\\.")+'" defer'));
 assert.match(html,/href="\.\/alicia-reference-theme\.css"/);
 for(const value of ["general","code","repair","create","teach"]){
  assert.ok(ui.includes('value:"'+value+'"'));
  assert.ok(ui.includes('modeSelector.value=item.value'));
 }
 assert.match(ui,/avatarButton\.addEventListener\("click"/);
 assert.match(css,/alicia-reference-overlay/);
 assert.match(css,/\.alicia-reference-modes/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/prefers-reduced-motion/);
});
test("Avatar Alicia articulé 3D et repli portrait Mac",()=>{
 const code=load("alicia-avatar3d.js"),css=load("alicia-reference-theme.css");
 for(const expected of ["THREE.WebGLRenderer","THREE.OrbitControls","THREE.SphereGeometry","THREE.CylinderGeometry","requestAnimationFrame(frame)","window.Alicia3D=","setSpeaking(on)","rotateTo(angle)","const hasReferencePortrait"]){
  assert.ok(code.includes(expected),expected);
 }
 assert.match(code,/if\(hasReferencePortrait\)panel.hidden=true/);
 assert.match(code,/if\(!hasReferencePortrait\)showAvatar3D\(\)/);
 assert.match(code,/panel\.hidden=false/);
 assert.match(css,/\.alicia-avatar3d\[hidden\]/);
});
test("La voix française pilote la bouche et la nouvelle scène",()=>{
 const code=load("avatar.js");
 assert.match(code,/window\.Alicia3D\?\.setSpeaking\?\.\(true\)/);
 assert.match(code,/window\.Alicia3D\?\.setSpeaking\?\.\(false\)/);
 assert.match(code,/if\(window\.Alicia3D\?\.ready\)/);
 assert.doesNotMatch(code,/Object\.hasOwn\(/);
});
test("Alicia interprète la commande d'avatar au lieu de dire qu'elle ne sait pas",()=>{
 const code=load("cortect-chat.js");
 assert.match(code,/window\.Alicia3D\.open\(\)/);
 assert.match(code,/avatar 3D stylisé/);
 assert.match(code,/reproduction photoréaliste/);
});
test("Cache hors ligne inclut la nouvelle référence et le moteur 3D",()=>{
 const sw=load("sw.js");
 assert.match(sw,/alicia-shell-v30/);
 for(const path of ["alicia-reference-ui.js","alicia-reference-theme.css","alicia-avatar3d.js","vendor\/three.r147.min.js"]){
  assert.ok(sw.includes(path),path);
 }
 assert.doesNotMatch(load("alicia-avatar3d.js"),/\bfetch\s*\(|new Function|eval\s*\(/);
});
