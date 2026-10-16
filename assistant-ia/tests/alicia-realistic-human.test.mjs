import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url));
test("GLB 3D humanoïde réaliste : binaire valide, matériaux, textures et squelette",()=>{
  const buf=load("models/alicia_realiste_rocketbox.glb");
  assert.ok(buf.length>1_000_000&&buf.length<16_000_000);
  assert.equal(buf.toString("ascii",0,4),"glTF");
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  const jsonLen=buf.readUInt32LE(12);
  assert.equal(buf.toString("ascii",16,20),"JSON");
  const doc=JSON.parse(buf.toString("utf8",20,20+jsonLen));
  assert.ok(doc.meshes.length>=1);
  assert.ok(doc.skins.length>=1);
  assert.ok(doc.materials.length>=3);
  assert.ok(doc.textures.length>=1);
  assert.ok(doc.nodes.length>40);
  assert.ok(doc.animations.some(a=>a.name==="Alicia_Idle_Respiration"));
  const animated=doc.animations.find(a=>a.name==="Alicia_Idle_Respiration");
  assert.ok(animated.channels.length>=1);
  for(const ch of animated.channels){
    assert.equal(ch.target.path,"rotation");
    assert.ok(ch.target.node>=0&&ch.target.node<doc.nodes.length);
  }
  const binStart=20+jsonLen;
  assert.equal(buf.toString("ascii",binStart+4,binStart+8),"BIN\0");
  assert.equal(buf.readUInt32LE(binStart),doc.buffers[0].byteLength + ((4-(doc.buffers[0].byteLength%4))%4));
  const report=JSON.parse(load("models/alicia_realiste_manifest.json").toString("utf8"));
  assert.ok(report.skinnedMesh>=1&&report.animationCount>=1);
  assert.equal(report.fileBytes,buf.length);
});
test("Avatar humain activé par défaut, avec mode stylisé conservé et chargeur local",()=>{
  const code=load("alicia-avatar3d.js").toString("utf8");
  const html=load("index.html").toString("utf8");
  const sw=load("sw.js").toString("utf8");
  assert.match(code,/loadRealisticModel\(\)/);
  assert.match(code,/\.\/models\/alicia_realiste_rocketbox\.glb/);
  assert.match(code,/window\.Alicia3D=/);
  assert.match(code,/faceJaw\.rotation\.x/);
  assert.match(code,/mixer\.update\(dt\)/);
  assert.match(code,/Personnage stylisé/);
  assert.match(html,/src="\.\/vendor\/GLTFLoader\.r147\.js" defer/);
  assert.match(sw,/\.\/vendor\/GLTFLoader\.r147\.js/);
  assert.match(sw,/\.\/models\/alicia_realiste_rocketbox\.glb/);
});
test("Modèle féminin riggé MIT conservant la source et sa licence",()=>{
  const lic=load("models/ROCKETBOX-MIT-LICENSE.md").toString("utf8");
  const report=JSON.parse(load("models/alicia_realiste_manifest.json").toString("utf8"));
  assert.match(lic,/MIT License/i);
  assert.match(report.notes,/not exact likeness/i);
  assert.ok(report.boneNames.includes("Head"));
  assert.ok(report.boneNames.includes("LeftArm"));
  assert.ok(report.boneNames.includes("RightArm"));
});
