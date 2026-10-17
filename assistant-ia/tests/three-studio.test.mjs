import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const text=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Studio 3D charge une copie locale complète de Three.js et OrbitControls (MIT)",()=>{
 const html=text("index.html"),sw=text("sw.js"),three=text("vendor/three.r147.min.js"),orbit=text("vendor/OrbitControls.r147.js"),license=text("vendor/THREE-LICENSE.txt");
 assert.match(three,/THREE/);
 assert.ok(three.length>500000);
 assert.match(orbit,/THREE\.OrbitControls\s*=\s*OrbitControls/);
 assert.match(license,/MIT License/);
 assert.match(html,/src="\.\/vendor\/three\.r147\.min\.js" defer/);
 assert.match(html,/src="\.\/vendor\/OrbitControls\.r147\.js" defer/);
 assert.match(html,/src="\.\/three-studio\.js" defer/);
 assert.match(sw,/\.\/three-studio\.js/);
 assert.match(sw,/\.\/vendor\/three\.r147\.min\.js/);
 assert.match(sw,/\.\/vendor\/OrbitControls\.r147\.js/);
 assert.doesNotMatch(html,/src="https:\/\/cloudflare\.com"|src="https:\/\/jsdelivr\.net"/);
});
test("Geometry studio : formes, réglages, animation et navigation tactile",()=>{
 const code=text("three-studio.js");
 for(const signature of ["THREE.BoxGeometry","THREE.SphereGeometry","THREE.CylinderGeometry","THREE.PerspectiveCamera",
   "THREE.WebGLRenderer","THREE.OrbitControls","THREE.AmbientLight","THREE.DirectionalLight",
   "requestAnimationFrame","cancelAnimationFrame","enableDamping","camera.position.set",
   "alicia-three-shape","alicia-three-width","alicia-three-height","alicia-three-depth","alicia-three-speed"]){
    assert.ok(code.includes(signature),signature+" absent");
 }
 assert.match(code,/texture\.dispose\(\)/);
 assert.match(code,/URL\.revokeObjectURL/);
 assert.match(code,/if\(document\.hidden\)stop\(\)/);
 assert.match(code,/panel\.addEventListener\("toggle"/);
 assert.match(code,/contextlost/);
});
test("Aucun téléchargement dynamique de Three.js ni paiement",()=>{
 const code=text("three-studio.js");
 assert.doesNotMatch(code,/https?:\/\/|new Function|eval\s*\(|fetch\s*\(|OpenAI|payment/i);
 assert.match(code,/ne reconstruit pas le dos/);
 assert.ok(text("three-studio.css").includes("touch-action:none"));
 assert.match(text("sw.js"),/alicia-shell-v43/);
});
