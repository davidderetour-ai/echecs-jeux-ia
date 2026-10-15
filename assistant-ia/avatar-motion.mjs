/** Animations faciales locales, sans caméra, micro ni détection d'émotions.
 * La bouche est une animation approximative de la voix de synthèse :
 * SpeechSynthesis ne fournit pas de phonèmes synchronisés sur Safari.
 */
export function clamp(value,min,max){
 return Math.max(min,Math.min(max,Number.isFinite(value)?value:0));
}
export function blinkAmount(milliseconds,{reducedMotion=false}={}){
 if(reducedMotion)return 1;
 const t=Math.max(0,milliseconds);
 const cycle=Math.floor(t/5200);
 // Une irrégularité déterministe évite le clignement exactement périodique.
 const offset=3520+480*Math.sin(cycle*2.17+1.3);
 const elapsed=t-cycle*5200-offset;
 if(elapsed<0||elapsed>215)return 1;
 const u=elapsed/215;
 // Fermer, rester brièvement fermé, puis rouvrir les paupières.
 if(u<.39)return clamp(1-(u/.39)*.94,.06,1);
 if(u<.54)return .06;
 return clamp(.06+((u-.54)/.46)*.94,.06,1);
}
export function mouthOpening(milliseconds,{
 speaking=false,reducedMotion=false,lastBoundary=-1
}={}){
 if(!speaking)return 0;
 if(reducedMotion)return .17;
 const t=Math.max(0,milliseconds);
 const syllables=.5+.5*Math.sin(t*.023+Math.sin(t*.006)*1.8);
 const cadence=.5+.5*Math.sin(t*.009+1.2);
 const started=lastBoundary>=0?t-lastBoundary:1000;
 const wordPulse=started>=0&&started<240?Math.sin(Math.PI*started/240)*.21:0;
 return clamp(.13+.48*syllables*cadence+wordPulse,.08,.88);
}
export function gazeFromPointer({x,y,width,height}){
 return {
  x:clamp((x/Math.max(width,1)-.5)*2,-1,1),
  y:clamp((.5-y/Math.max(height,1))*2,-1,1)
 };
}
export function moodLook(expression){
 const presets={
  neutral:{brow:0,eye:1,smile:0},
  joyful:{brow:.05,eye:.88,smile:.8},
  thoughtful:{brow:-.055,eye:.9,smile:.02},
  curious:{brow:.12,eye:1.08,smile:.13},
  supportive:{brow:.035,eye:.95,smile:.34},
  creative:{brow:.085,eye:1.04,smile:.58}
 };
 return presets[expression]||presets.neutral;
}
