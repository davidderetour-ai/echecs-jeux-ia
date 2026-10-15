/**
 * Géométrie projective 2D d'une surface PLANE.
 * Ne corrige PAS la distorsion optique et ne reconstruit PAS une scène 3D.
 * Les correspondances et l'échelle sont fournies par l'utilisateur.
 */
export function homography(from,to){
 if(!Array.isArray(from)||!Array.isArray(to)||from.length!==4||to.length!==4)throw new Error("Quatre points dans chaque vue sont nécessaires.");
 const a=[];
 for(let i=0;i<4;i++){
  const p=from[i],q=to[i];const [x,y,u,v]=[p?.x,p?.y,q?.x,q?.y];
  if(![x,y,u,v].every(Number.isFinite))throw new Error("Coordonnées invalides.");
  a.push([x,y,1,0,0,0,-u*x,-u*y,u]);
  a.push([0,0,0,x,y,1,-v*x,-v*y,v]);
 }
 for(let i=0;i<8;i++){
  let best=i;for(let k=i+1;k<8;k++)if(Math.abs(a[k][i])>Math.abs(a[best][i]))best=k;
  if(Math.abs(a[best][i])<1e-10)throw new Error("Points mal placés : rectangle impossible à redresser.");
  [a[i],a[best]]=[a[best],a[i]];
  const d=a[i][i];for(let j=i;j<9;j++)a[i][j]/=d;
  for(let k=0;k<8;k++){if(k===i)continue;const f=a[k][i];for(let j=i;j<9;j++)a[k][j]-=f*a[i][j]}
 }
 const h=a.map(row=>row[8]);return [h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1];
}
export function project(h,point){
 if(!Array.isArray(h)||h.length!==9||!point)throw new Error("Transformation invalide.");
 const {x,y}=point;const d=h[6]*x+h[7]*y+h[8];
 if(!Number.isFinite(d)||Math.abs(d)<1e-10)throw new Error("Point hors de la transformation.");
 return {x:(h[0]*x+h[1]*y+h[2])/d,y:(h[3]*x+h[4]*y+h[5])/d};
}
export function outputGeometry(widthMM,heightMM){
 const w=Number(widthMM),h=Number(heightMM);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>100000||h>100000)throw new Error("Dimensions positives requises (en mm, max. 100 m).");
 const ratio=w/h;return {width:Math.max(2,Math.round(1200*Math.min(1,ratio))),height:Math.max(2,Math.round(1200*Math.min(1,1/ratio))),areaM2:w*h/1e6};
}
export function rectificationMap(points,widthMM,heightMM){
 const out=outputGeometry(widthMM,heightMM);
 const corners=[{x:0,y:0},{x:out.width-1,y:0},{x:out.width-1,y:out.height-1},{x:0,y:out.height-1}];
 return {...out,map:homography(corners,points)};
}
