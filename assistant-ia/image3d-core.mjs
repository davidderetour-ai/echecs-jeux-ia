/* Alicia Image -> 3D (relief 2.5D), gratuit, local et reproductible.
 * Une image RGB seule ne contient PAS la profondeur réelle.
 * Calcul heuristique par luminance, sans prétendre à une estimation IA.
 * Export d'une surface colorée, pas d'un objet fermé avec dos.
 */
export const MAX_INPUT_SIDE=512;
export const MAX_POINTS=26000;

export function luminance(r,g,b){
 if(![r,g,b].every(Number.isFinite))throw new Error("Pixel invalide");
 return (0.2126*r+0.7152*g+0.0722*b)/255;
}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
export function generatePointCloud(pixels,settings={}){
 const width=Number(pixels?.width),height=Number(pixels?.height),data=pixels?.data;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>MAX_INPUT_SIDE||height>MAX_INPUT_SIDE)
  throw new Error("Image invalide : redimensionne-la à 512 pixels maximum par côté");
 if(!data||data.length!==width*height*4)throw new Error("Pixels RGBA manquants");
 const step=clamp(Math.floor(settings.step||4),2,16);
 const strength=clamp(Number(settings.relief??0.65),0.02,1.8);
 const invert=Boolean(settings.invert);
 const cols=Math.ceil(width/step),rows=Math.ceil(height/step);
 if(cols*rows>MAX_POINTS)throw new Error("Image trop dense");
 const points=[],colors=[];
 function lumaAt(x,y){
   let sum=0,n=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const sx=clamp(x+dx,0,width-1),sy=clamp(y+dy,0,height-1);
     const k=(sy*width+sx)*4;
     if(data[k+3]===0)continue;
     sum+=luminance(data[k],data[k+1],data[k+2]);n++;
   }
   return n?sum/n:0.5;
 }
 const scale=1/Math.max(width,height);
 for(let y=0;y<height;y+=step){
   for(let x=0;x<width;x+=step){
     const k=(y*width+x)*4;
     if(data[k+3]<64)continue;
     let intensity=lumaAt(x,y);
     if(invert)intensity=1-intensity;
     const depth=0.05+Math.pow(intensity,1.1)*strength;
     points.push((x-(width-1)/2)*scale, ((height-1)/2-y)*scale, depth);
     colors.push(data[k],data[k+1],data[k+2]);
   }
 }
 return {positions:new Float32Array(points),colors:new Uint8Array(colors),
  count:points.length/3,width,height,mode:"relief-luminance",metricDepth:false,hasRealBack:false};
}
export function exportPLY(cloud){
 if(!cloud||!Number.isInteger(cloud.count)||cloud.count<1||cloud.count>MAX_POINTS
     ||cloud.positions?.length!==cloud.count*3||cloud.colors?.length!==cloud.count*3)
   throw new Error("Nuage 3D incorrect");
 const head=[
  "ply","format ascii 1.0","comment Alicia : relief 2.5D approximatif selon luminance",
  "comment Pas de profondeur métrique ni de dos reconstruit",
  "element vertex "+cloud.count,
  "property float x","property float y","property float z",
  "property uchar red","property uchar green","property uchar blue",
  "end_header"
 ];
 for(let i=0;i<cloud.count;i++){
  const k=i*3;
  const xyz=[cloud.positions[k],cloud.positions[k+1],cloud.positions[k+2]];
  if(!xyz.every(Number.isFinite))throw new Error("Point non fini");
  head.push(xyz.map(x=>x.toFixed(6)).concat([cloud.colors[k],cloud.colors[k+1],cloud.colors[k+2]]).join(" "));
 }
 return head.join("\n")+"\n";
}
export function projectPoints(cloud,angle=0,tilt=0.12){
 if(!cloud||!cloud.positions)return [];
 const ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
 const projected=[];
 for(let i=0;i<cloud.count;i++){
  const k=i*3,x=cloud.positions[k],y=cloud.positions[k+1],z=cloud.positions[k+2]-0.38;
  const rx=x*ca+z*sa,rz=z*ca-x*sa;
  projected.push({x:rx,y:y*ct-rz*st,depth:y*st+rz*ct,r:cloud.colors[k],g:cloud.colors[k+1],b:cloud.colors[k+2]});
 }
 return projected;
}
