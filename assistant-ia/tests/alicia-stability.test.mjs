import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Les réponses ne sont pas bloquées par les outils et les animations facultatifs",()=>{
  const app=read("app.js");
  assert.match(app,/try\{window\.AliciaAvatar\?\.onUserMessage/);
  assert.match(app,/try\{window\.AliciaTools\?\.suggestForTask/);
  assert.match(app,/try\{window\.AliciaAvatar\?\.onAssistantMessage/);
  assert.match(app,/messages\.push\(\{role:"assistant",content:data\.answer\}\)/);
  assert.match(app,/Je n’ai pas pu répondre/);
  assert.match(app,/try\{plugin=window\.AliciaRequestUnderstanding\?\.respond/);\n  assert.match(app,/window\.AliciaCourseLearning\?\.answer/);
  assert.match(app,/window\.AliciaLocalTools\?\.answer/);
});
test("Moteur 3D : une erreur WebGL ne cache pas le portrait de secours",()=>{
  const avatar=read("alicia-avatar3d.js");
  const gallery=read("alicia-model-gallery.js");
  assert.match(avatar,/webglcontextlost/);
  assert.match(avatar,/alicia:3d-failed/);
  assert.match(avatar,/getStatus\(\)/);
  assert.match(avatar,/if\(!firstDrawn\)/);
  assert.match(gallery,/3D non affichée/);
  assert.match(gallery,/alicia-model-photo-fallback/);
  for(const kind of ["real-portrait","real-entier","style-portrait","style-entier"]){
    assert.ok(gallery.includes(kind),kind);
  }
});
test("Choix vocal conservé : sélection et style stockés localement",()=>{
  const voice=read("avatar.js");
  assert.match(voice,/alicia-voix-choisie/);
  assert.match(voice,/alicia-style-vocal/);
  assert.match(voice,/fr-FR/);
});
