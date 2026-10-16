import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => readFileSync(path.join(root,name),"utf8");
test("Alicia Fusion : numéro de version commun et origine de confiance",()=>{
 const release=JSON.parse(read("fusion-release.json"));
 const html=read("index.html");
 const sync=read("fusion-sync.js");
 assert.match(release.version,/^\d+\.\d+\.\d+$/);
 assert.equal(release.version,"0.9.1");
 assert.ok(html.includes('name="alicia-version" content="'+release.version+'"'));
 assert.match(sync,/alicia\.github\.io|davidderetour-ai\.github\.io/);
 assert.match(sync,/newer/);
 assert.match(sync,/cache:"no-store"/);
});
test("Alicia Fusion : portrait 3D, sans enlever les fonctions de l'ancienne app",()=>{
 const html=read("index.html"), ui=read("fusion-ui.js"), avatar=read("alicia-avatar3d.js");
 assert.match(html,/fusion-ui\.js/);
 assert.match(html,/fusion-sync\.js/);
 assert.match(ui,/Mode d.expertise/);
 assert.match(ui,/mode\.dispatchEvent/);
 assert.match(avatar,/setFraming\(value\)/);
 assert.match(avatar,/full\?size.y/);
 assert.match(html,/alicia-model-gallery\\.js/);
 assert.match(html,/id="voice"/);
 assert.match(html,/id="expression-mode"/);
});
test("Alicia Fusion : cache conservé et nouvelle version isolée",()=>{
 const sw=read("sw.js");
 assert.match(sw,/alicia-shell-v34/);
 assert.match(sw,/fusion-release\.json/);
 assert.match(sw,/ALICIA_CACHE_PREFIX/);
 assert.doesNotMatch(sw,/caches\.delete\("games/);
});