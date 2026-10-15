import test from "node:test";
import assert from "node:assert/strict";
import {emotionPulses,emotionDurationMs,createEmotionSoundPlayer} from "../emotion-sounds.mjs";

test("Les quatre bruitages ont des paramètres audio valides et de durée courte",()=>{
 for(const kind of ["laugh","cry","fear","anger"]){
  const pulses=emotionPulses(kind);
  assert.ok(pulses.length>=3);
  assert.ok(emotionDurationMs(kind)>500&&emotionDurationMs(kind)<5000);
  for(const p of pulses){
   assert.ok(p.start>=0&&p.duration>.05);
   assert.ok(p.pitch>40&&p.endPitch>40);
   assert.ok(p.volume>0&&p.volume<.5);
   assert.ok(p.air>=0&&p.air<.5);
  }
 }
});
test("Les paramètres sont protégés contre la modification de l'extérieur",()=>{
 const data=emotionPulses("fear");
 data[0].pitch=1;
 assert.notEqual(emotionPulses("fear")[0].pitch,1);
});
test("Une expression inconnue est refusée sans générer de bruitage",()=>{
 assert.throws(()=>emotionPulses("inconnue"),/inconnue/);
 assert.throws(()=>emotionDurationMs("inconnue"),/inconnue/);
});
test("Le moteur audio se crée sans demander l'accès à un serveur ni au microphone",()=>{
 const player=createEmotionSoundPlayer();
 assert.equal(typeof player.play,"function");
 assert.equal(typeof player.stop,"function");
 assert.doesNotThrow(()=>player.stop());
});
