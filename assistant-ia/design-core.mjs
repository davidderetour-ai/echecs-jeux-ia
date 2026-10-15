/** Dessins paramétriques pour un rangement OUVERT sans porte, non certifiés.
 * Toutes les cotes sont en millimètres et les panneaux sont coupés à angles droits.
 * Ni étude de stabilité, ni calcul de charge, ni instructions de machines CNC.
 */
const MATERIALS=["Contreplaqué","Mélaminé","Bois massif"];
function integer(n,label,min,max){
 const v=Number(n);
 if(!Number.isInteger(v)||v<min||v>max)
  throw Error(label+" : saisir un nombre entier de "+min+" à "+max+" mm"+(label==="Étagères"?"":"")+".");
 return v;
}
export function makeFurniture(input={}){
 const name=String(input.name||"Bibliothèque").trim().slice(0,64).replace(/[<>]/g,"")||"Meuble";
 const width=integer(input.width??800,"Largeur",300,2400);
 const height=integer(input.height??1200,"Hauteur",300,2500);
 const depth=integer(input.depth??350,"Profondeur",180,900);
 const thickness=integer(input.thickness??18,"Épaisseur des panneaux",12,36);
 const back=integer(input.back??5,"Épaisseur du fond",3,18);
 const shelves=integer(input.shelves??3,"Étagères",0,8);
 const material=MATERIALS.includes(input.material)?input.material:MATERIALS[0];
 const innerWidth=width-2*thickness;
 const interiorHeight=height-2*thickness;
 const carcassDepth=depth-back;
 const clear=(interiorHeight-shelves*thickness)/(shelves+1);
 if(innerWidth<160||carcassDepth<150||clear<70)
  throw Error("Dimensions insuffisantes : augmente la largeur, profondeur ou hauteur, ou réduis le nombre d'étagères.");
 const cuts=[
  {id:"C1",title:"Côtés gauche et droit",qty:2,length:height,width:carcassDepth,thickness,material},
  {id:"C2",title:"Dessus et dessous",qty:2,length:innerWidth,width:carcassDepth,thickness,material},
  ...(shelves?[{id:"C3",title:"Étagères horizontales",qty:shelves,length:innerWidth,width:carcassDepth,thickness,material}]:[]),
  {id:"F1",title:"Fond extérieur (à confirmer)",qty:1,length:height,width,thickness:back,material:"Fond panneau"}
 ];
 const elevations=Array.from({length:shelves},(_,i)=>Number((thickness+clear+i*(thickness+clear)).toFixed(1)));
 const area=cuts.reduce((sum,c)=>sum+c.qty*c.length*c.width,0)/1000000;
 return {name,width,height,depth,thickness,back,shelves,material,innerWidth,carcassDepth,clear:Number(clear.toFixed(1)),elevations,cuts,area:Number(area.toFixed(3)),safety:[
  "Vérifier chaque cote, l'équerrage, le trait de scie et le sens du fil avant la découpe.",
  "Le fond extérieur de "+back+" mm doit être fixé selon le matériau et la quincaillerie réellement choisis.",
  "Choisir et vérifier les fixations et les appuis d'étagères selon les charges prévues.",
  "Prévoir une fixation anti-basculement au mur compatible avec la cloison, surtout pour les meubles hauts.",
  "Ce dessin ne certifie ni résistance aux charges, ni stabilité, ni conformité réglementaire."
 ]};
}
function svgText(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function f(n){return Number(n.toFixed(2));}
export function furnitureSVG(spec){
 const s=spec,scale=Math.min(580/s.width,390/s.height,200/s.depth);
 const x=72,y=66,w=s.width*scale,h=s.height*scale,t=s.thickness*scale;
 const sideX=695,sideW=s.depth*scale,back=s.back*scale;
 const sideLeft=sideX+Math.max(1,sideW-back);
 const r=(x,y,w,h,fill="#f4e2bf")=>'<rect x="'+f(x)+'" y="'+f(y)+'" width="'+f(Math.max(w,0.5))+'" height="'+f(Math.max(h,0.5))+'" fill="'+fill+'" stroke="#29303a" stroke-width="1.4"/>';
 const line=(x1,y1,x2,y2)=>'<line x1="'+f(x1)+'" y1="'+f(y1)+'" x2="'+f(x2)+'" y2="'+f(y2)+'" stroke="#263b67" stroke-width="1.5"/>';
 const label=(x,y,msg,size=14)=>'<text x="'+f(x)+'" y="'+f(y)+'" font-family="Arial, sans-serif" font-size="'+size+'" fill="#1d2b48">'+svgText(msg)+'</text>';
 const out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="710" viewBox="0 0 1000 710" role="img" aria-label="Plan coté de meuble"><rect width="1000" height="710" fill="#fff"/>'];
 out.push(label(44,30,s.name+" — vue de face et profil",22));
 out.push(r(x,y,w,h,"#fbf9f5"));
 out.push(r(x,y,t,h),r(x+w-t,y,t,h));
 out.push(r(x+t,y,w-2*t,t),r(x+t,y+h-t,w-2*t,t));
 for(const pos of s.elevations){out.push(r(x+t,y+h-(pos+s.thickness)*scale,w-2*t,t));}
 out.push(label(x,y+h+34,s.width+" mm (largeur)",15));
 out.push(line(x,y+h+12,x+w,y+h+12));
 out.push(line(x,y+h+6,x,y+h+19),line(x+w,y+h+6,x+w,y+h+19));
 out.push(label(x+w+10,y+h/2,s.height+" mm",15));
 out.push(label(x+4,y+h+63,"Ouvert — "+s.shelves+" étagère(s), ép. "+s.thickness+" mm",13));
 out.push(label(sideX,y-14,"Profil",16));
 out.push(r(sideX,y,sideW,h,"#f4e2bf"));
 out.push(r(sideLeft,y,Math.max(1,back),h,"#b0c3db"));
 out.push(label(sideX,y+h+34,s.depth+" mm (profondeur totale)",14));
 out.push(line(sideX,y+h+12,sideX+sideW,y+h+12));
 out.push(label(sideX,y+h+60,"Fond extérieur : "+s.back+" mm",13));
 out.push(label(44,555,"Liste de découpe — millimètres, sans jeu d'assemblage ni trait de scie",18));
 s.cuts.forEach((part,i)=>{
  out.push(label(52,586+i*25,part.id+"   "+part.title+" : "+part.qty+" × "+part.length+" × "+part.width+" × "+part.thickness+" mm",14));
 });
 out.push(label(44,696,"AVERTISSEMENT : projet préliminaire non dimensionné pour les charges ni certifié pour fabrication.",12));
 out.push("</svg>");
 return out.join("");
}
export function furnitureCSV(spec){
 const rows=[["Référence","Élément","Quantité","Longueur mm","Largeur mm","Épaisseur mm","Matière"],...spec.cuts.map(p=>[p.id,p.title,p.qty,p.length,p.width,p.thickness,p.material])];
 const escape=v=>'"'+String(v).replace(/"/g,'""')+'"';
 return "\ufeff"+rows.map(row=>row.map(escape).join(";")).join("\r\n")+"\r\n";
}
export function furnitureDXF(spec){
 // DXF R12 : contours rectangulaires indicatifs de chaque panneau, PAS du G-code CNC.
 const lines=["0","SECTION","2","HEADER","9","$ACADVER","1","AC1009","0","ENDSEC","0","SECTION","2","ENTITIES"];
 const segment=(x1,y1,x2,y2)=>{
  lines.push("0","LINE","8","PANNEAUX","10",String(x1),"20",String(y1),"30","0","11",String(x2),"21",String(y2),"31","0");
 };
 const annotation=(x,y,txt)=>{
  lines.push("0","TEXT","8","COTES","10",String(x),"20",String(y),"30","0","40","24","1",txt.replace(/[^\x20-\x7e]/g," ").slice(0,90));
 };
 let x=0,y=0,maxRow=0,count=0;
 for(const part of spec.cuts){
  for(let i=0;i<part.qty;i++){
   const w=part.length,h=part.width;
   segment(x,y,x+w,y);segment(x+w,y,x+w,y+h);segment(x+w,y+h,x,y+h);segment(x,y+h,x,y);
   annotation(x+15,y+h+25,part.id+" "+(i+1)+" "+w+"x"+h+"x"+part.thickness+" mm");
   x+=w+120;maxRow=Math.max(maxRow,h);count++;
   if(count%3===0){x=0;y+=maxRow+180;maxRow=0;}
  }
 }
 lines.push("0","ENDSEC","0","EOF");
 return lines.join("\r\n")+"\r\n";
}
export function furnitureBrief(spec){
 return [
  spec.name+" — cahier des charges et quantitatif PRELIMINAIRES",
  "Encombrement : largeur "+spec.width+" mm ; hauteur "+spec.height+" mm ; profondeur totale "+spec.depth+" mm.",
  "Corps : "+spec.material+" épaisseur "+spec.thickness+" mm. Fond extérieur : "+spec.back+" mm.",
  "Étagères : "+spec.shelves+" ; largeur intérieure "+spec.innerWidth+" mm ; profondeur corps "+spec.carcassDepth+" mm.",
  "Ouverture libre théorique entre tablettes : "+spec.clear+" mm.",
  "Position du dessous des étagères depuis le bas extérieur : "+(spec.elevations.join(", ")||"aucune")+" mm.",
  "Surface de panneaux nette approximative, sans chute : "+spec.area+" m².",
  "Fixations, assemblages, panneaux disponibles et tolérances à préciser avec un menuisier.",
  ...spec.safety
 ].join("\n");
}
