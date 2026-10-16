// Mouvement autonome Alicia — aucun suivi de caméra et aucune nécessité de glisser.
export function clamp(v,min,max) { return Math.max(min,Math.min(max,Number.isFinite(v)?v:0)); }
export function ease(v) { const n=clamp(v,0,1);return n*n*(3-2*n); }
export function livingPose(ms,{reducedMotion=false,paused=false,speaking=false}={}){
 const t=Math.max(0,ms)/1000;
 if(reducedMotion || paused) return {yaw:0,head:0,breath:0,armL:.13,armR:-.13,elbowL:0,elbowR:0,step:0};
 // Tour complet sans intervention : profil puis dos, puis face de nouveau.
 // La boucle laisse le temps de voir le dos et les mains.
 const cycle=t%32;
 const yaw=cycle<8? .07*Math.sin(cycle*.45)
    :cycle<13?Math.PI*ease((cycle-8)/5)
    :cycle<18?Math.PI
    :cycle<24?Math.PI+Math.PI*ease((cycle-18)/6)
    :2*Math.PI+.06*Math.sin((cycle-24)*.65);
 const wave=.38*Math.sin(t*.85),breath=.025*Math.sin(t*1.9);
 const gentle=speaking? .28: .08;
 return {
   yaw, head:.08*Math.sin(t*.7)+(speaking?.045*Math.sin(t*4.3):0),
   breath,
   armL: .14 + gentle*Math.sin(t*1.17)+wave*.4,
   armR: -.14 - gentle*Math.sin(t*.94)-wave*.38,
   elbowL: .15*Math.sin(t*.93)+ (speaking?.13:0),
   elbowR: -.14*Math.sin(t*1.21)-(speaking?.13:0),
   step:.055*Math.sin(t*.72)
 };
}
