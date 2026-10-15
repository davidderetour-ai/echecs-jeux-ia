import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileKind,MAX_AUDIO_BYTES,MAX_VIDEO_BYTES} from "../composer-core.mjs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const ui=readFileSync(new URL("../composer-tools.js",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");

test("Accepte les principaux formats audio de l'iPhone",()=>{
 for(const item of [
  ["memo.m4a","audio/mp4"],["memo.mp3","audio/mpeg"],
  ["voix.wav","audio/wav"],["audio.aac","audio/aac"]]){
  assert.equal(fileKind({name:item[0],type:item[1],size:10000}).kind,"audio");
 }
});
test("Accepte les vidéos locales compatibles iPhone",()=>{
 for(const item of [
  ["film.mov","video/quicktime"],["clip.mp4","video/mp4"],
  ["movie.m4v","video/x-m4v"],["video.webm","video/webm"],
  ["sans-type.mov",""]]){
  assert.equal(fileKind({name:item[0],type:item[1],size:100000}).kind,"video");
 }
});
test("Refuse les médias trop volumineux, vides et exécutables",()=>{
 assert.equal(fileKind({name:"audio.m4a",type:"audio/mp4",size:MAX_AUDIO_BYTES+1}).kind,"error");
 assert.equal(fileKind({name:"video.mov",type:"video/quicktime",size:MAX_VIDEO_BYTES+1}).kind,"error");
 assert.equal(fileKind({name:"video.mov",type:"video/quicktime",size:0}).kind,"error");
 assert.equal(fileKind({name:"virus.exe",type:"application/octet-stream",size:1000}).kind,"error");
 assert.equal(fileKind({name:"clip.mp4",type:"application/javascript",size:1000}).kind,"error");
});
test("Le menu + et les sélecteurs iPhone contiennent audio et vidéo",()=>{
 assert.match(html,/data-plus-action="video"/);
 assert.match(html,/data-plus-action="audio"/);
 assert.match(html,/id="attach-video" type="file"/);
 assert.match(html,/id="attach-audio" type="file"/);
 assert.match(ui,/video:"attach-video",audio:"attach-audio"/);
});
test("Les fichiers restent locaux pendant la lecture et la sélection d'image",()=>{
 assert.match(ui,/URL\.createObjectURL\(file\)/);
 assert.match(ui,/URL\.revokeObjectURL\(activeMediaURL\)/);
 assert.match(ui,/media\.controls=true/);
 assert.match(ui,/video\.pause\(\)/);
 assert.match(ui,/ctx\.drawImage\(video/);
 assert.match(ui,/canvas\.toDataURL\("image\/jpeg",\.8\)/);
});
test("Transcription uniquement sur demande expresse et avec Wi-Fi",()=>{
 assert.match(ui,/event=>transcribeAudio\(event\.currentTarget\)/);
 assert.match(ui,/window\.AliciaWiFi\.requireConfirmed\(\)/);
 assert.match(ui,/puter\.ai\.speech2txt\(selected\.file\)/);
 assert.match(ui,/puter\.auth\?\.isSignedIn/);
});
test("La conversation refuse l'envoi direct du média brut",()=>{
 assert.match(app,/attachment\?\.kind==="audio"\|\|attachment\?\.kind==="video"/);
 assert.match(app,/Transcris d'abord l'audio/);
 assert.match(app,/Capture d'abord une image/);
});
