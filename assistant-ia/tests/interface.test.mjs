import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const avatar=readFileSync(new URL("../avatar.js",import.meta.url),"utf8");
const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
function countId(id){
 return [...html.matchAll(/\bid="([^"]+)"/g)].filter(m=>m[1]===id).length;
}
test("L'interface affiche chaque commande utilisée par le JavaScript une seule fois",()=>{
 const ids=["mode","connection-mode","connection-status","search","verify","alicia-avatar","avatar-status","expression-mode","voice-choice","voice-style","preview-voice","auto-voice","laugh-sound","cry-sound","fear-sound","anger-sound","conversation","new","question","voice","speak","review","send","access","save-note","clear-notes","notes-list","clear-access","note","status","chat-form","tool-query","data-file-a","mac-report"];
 for(const id of ids)assert.equal(countId(id),1,`Élément #${id} manquant ou en double`);
});
test("Les cinq modes rapides pointent vers de vraies options du moteur",()=>{
 for(const value of ["general","code","repair","create","teach"]){
  assert.match(html,new RegExp('data-expertise-mode="'+value+'"'));
  assert.match(html,new RegExp('<option value="'+value+'">'));
 }
 assert.match(app,/function syncExpertise\(\)/);
 assert.match(app,/aria-pressed/);
});
test("Avatar 3D importé comme module et quatre émotions activables",()=>{
 assert.match(html,/<script type="module" src="\.\/avatar\.js"><\/script>/);
 assert.match(avatar,/import \{ createEmotionSoundPlayer \}/);
 for(const id of ["laugh-sound","cry-sound","fear-sound","anger-sound"])assert.equal(countId(id),1);
 assert.match(sw,/emotion-sounds\.mjs/);
});
test("Interface soignée et responsive intégrée sans bibliothèque externe",()=>{
 assert.match(html,/class="experience-grid"/);
 assert.match(html,/class="expertise-panel glass-panel"/);
 assert.match(html,/class="conversation-card glass-panel"/);
 assert.match(css,/\.alicia-dashboard/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(sw,/alicia-shell-v13/);
});
