/**
 * Petits bruitages originaux de synthèse vocale (rire et sanglots).
 * Aucun enregistrement de voix humaine, aucun serveur, aucune API payante.
 * AudioContext se déverrouille uniquement après un clic/toucher de l'utilisateur.
 */
const PATTERNS=Object.freeze({
 laugh:Object.freeze([
  {start:.07,duration:.20,pitch:320,endPitch:375,volume:.16,air:.07},
  {start:.39,duration:.23,pitch:355,endPitch:415,volume:.19,air:.07},
  {start:.76,duration:.17,pitch:375,endPitch:330,volume:.15,air:.07},
  {start:1.04,duration:.25,pitch:345,endPitch:390,volume:.18,air:.07},
  {start:1.47,duration:.34,pitch:305,endPitch:335,volume:.15,air:.10}
 ]),
 cry:Object.freeze([
  {start:.15,duration:.57,pitch:310,endPitch:225,volume:.14,air:.12},
  {start:.91,duration:.69,pitch:290,endPitch:205,volume:.13,air:.15},
  {start:1.85,duration:.75,pitch:255,endPitch:185,volume:.12,air:.17}
 ])
});
export function emotionPulses(kind){
 if(!Object.hasOwn(PATTERNS,kind))throw new Error("Expression sonore inconnue.");
 return PATTERNS[kind].map(p=>({...p}));
}
export function emotionDurationMs(kind){
 const seq=emotionPulses(kind);
 return Math.ceil((Math.max(...seq.map(p=>p.start+p.duration))+.24)*1000);
}
export function createEmotionSoundPlayer(){
 let context=null;
 let active=[];
 let master=null;
 function stop(){
  if(!context)return;
  const t=context.currentTime;
  if(master){
   try{master.gain.cancelScheduledValues(t);master.gain.setTargetAtTime(0,t,.015)}catch{}
  }
  for(const node of active)try{node.stop(t+.07)}catch{}
  active=[];master=null;
 }
 function play(kind){
  const seq=emotionPulses(kind);
  const AudioCtor=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!AudioCtor)throw new Error("Bruitages indisponibles sur ce navigateur.");
  if(!context)context=new AudioCtor();
  stop();
  if(context.state==="suspended")context.resume().catch(()=>{});
  const t0=context.currentTime+.04;
  master=context.createGain();master.gain.value=.68;master.connect(context.destination);
  const bus=master;
  // Oscillateurs harmoniques modulés, recouverts d'une faible expiration.
  for(const p of seq){
   const start=t0+p.start,end=start+p.duration;
   const oscillator=context.createOscillator();
   oscillator.type="sawtooth";
   oscillator.frequency.setValueAtTime(p.pitch,start);
   oscillator.frequency.exponentialRampToValueAtTime(p.endPitch,end);
   if(kind==="cry"){
    const vibrato=context.createOscillator(),depth=context.createGain();
    vibrato.type="sine";vibrato.frequency.value=5.3;depth.gain.value=11;
    vibrato.connect(depth);depth.connect(oscillator.frequency);
    vibrato.start(start);vibrato.stop(end);active.push(vibrato);
   }
   const filter=context.createBiquadFilter();filter.type="lowpass";
   filter.frequency.value=kind==="laugh"?1450:1000;
   const gain=context.createGain();
   gain.gain.setValueAtTime(.0001,start);
   gain.gain.exponentialRampToValueAtTime(p.volume,start+.045);
   gain.gain.setValueAtTime(p.volume,Math.max(start+.05,end-.11));
   gain.gain.exponentialRampToValueAtTime(.0001,end);
   oscillator.connect(filter);filter.connect(gain);gain.connect(bus);
   oscillator.start(start);oscillator.stop(end+.015);active.push(oscillator);
   const sample=context.createBuffer(1,Math.ceil(context.sampleRate*.11),context.sampleRate);
   const values=sample.getChannelData(0);
   for(let i=0;i<values.length;i++)values[i]=Math.random()*2-1;
   const noise=context.createBufferSource();noise.buffer=sample;noise.loop=true;
   const hiss=context.createBiquadFilter();hiss.type="highpass";hiss.frequency.value=800;
   const breath=context.createGain();
   breath.gain.setValueAtTime(.0001,start);
   breath.gain.linearRampToValueAtTime(p.air,start+.025);
   breath.gain.exponentialRampToValueAtTime(.0001,end);
   noise.connect(hiss);hiss.connect(breath);breath.connect(bus);
   noise.start(start);noise.stop(end+.015);active.push(noise);
  }
  return emotionDurationMs(kind);
 }
 return {play,stop};
}
