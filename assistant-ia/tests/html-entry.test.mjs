import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
test("L'avatar qui utilise import ES est chargé comme module",()=>{
 assert.match(html,/<script\s+type="module"\s+src="\.\/avatar\.js"><\/script>/);
 assert.doesNotMatch(html,/<script\s+src="\.\/avatar\.js"\s+defer><\/script>/);
});
test("Le moteur IA iPhone est réellement relié à l'interface",()=>{
 assert.match(html,/id="connection-mode"/);
 assert.match(html,/option value="puter"/);
 assert.match(html,/src="\.\/puter-engine\.js"/);
 assert.match(sw,/puter-engine\.js/);
});
test("Le guide iPhone et l'avatar figurent dans le cache de l'application",()=>{
 assert.match(sw,/installer-iphone\.html/);
 assert.match(sw,/expression-core\.mjs/);
 assert.match(sw,/avatar\.js/);
});
