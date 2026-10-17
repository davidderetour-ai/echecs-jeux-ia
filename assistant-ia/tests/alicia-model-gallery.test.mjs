import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
test("Galerie Alicia : portrait et corps entier pour les deux modèles 3D",()=>{
 const gallery=read("alicia-model-gallery.js"),avatar=read("alicia-avatar3d.js");
 for(const mode of ["real-portrait","real-entier","style-portrait","style-entier","archive-portrait","archive-face","archive-dos"]){
  assert.ok(gallery.includes(mode),mode);
 }
 assert.match(avatar,/setFraming\(value\)/);
 assert.match(avatar,/const full=framing==="entier"/);
 assert.match(avatar,/window\.Alicia3D=/);
 assert.match(gallery,/hasRealistic/);
});
test("Les anciennes photos sont de vrais fichiers embarqués en secours 2D",()=>{
 const gallery=read("alicia-model-gallery.js");
 assert.ok(gallery.includes("data:image/jpeg;base64,"));
 assert.ok(gallery.includes("data:image/webp;base64,"));
 assert.ok(gallery.includes('alicia:3d-rendered'));
 assert.ok(gallery.includes('alicia:3d-model-failed'));
 assert.ok(gallery.includes("2D, pas des modèles 3D"));
});
test("Galerie incluse dans les mêmes versions Web iPhone et Mac",()=>{
 const index=read("index.html"),sw=read("sw.js"),release=JSON.parse(read("fusion-release.json"));
 assert.match(index,/src="\.\/alicia-model-gallery\.js"/);
 assert.match(sw,/\.\/alicia-model-gallery\.js/);
 assert.equal(release.version,"0.9.8");
 assert.ok(release.webFeatures.includes("portrait3DEtCorpsEntier"));
});
