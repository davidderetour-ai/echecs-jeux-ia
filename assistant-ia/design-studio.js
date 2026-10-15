import {makeFurniture,furnitureSVG,furnitureCSV,furnitureDXF,furnitureBrief} from "./design-core.mjs";
const $=id=>document.getElementById(id);
let current=null;
function showDomain(){
 const type=$("design-domain").value;
 $("design-furniture-fields").hidden=type!=="furniture";
 $("design-professional-fields").hidden=type==="furniture";
}
$("design-domain")?.addEventListener("change",showDomain);
showDomain();
function getSpec(){
 return makeFurniture({
  name:$("design-name").value,
  width:$("design-width").value,
  height:$("design-height").value,
  depth:$("design-depth").value,
  thickness:$("design-thickness").value,
  back:$("design-back").value,
  shelves:$("design-shelves").value,
  material:$("design-material").value
 });
}
function generate(){
 const target=$("design-output");
 target.replaceChildren();
 $("design-downloads").hidden=true;
 try{
  const spec=getSpec();
  current=spec;
  const p=document.createElement("p");
  p.textContent="Plan préparé : "+spec.width+" × "+spec.height+" × "+spec.depth+" mm. "+spec.cuts.reduce((sum,c)=>sum+c.qty,0)+" pièces ; surface nette théorique "+spec.area+" m² (sans chutes).";
  target.append(p);
  // Seul du SVG généré à partir de cotes validées, jamais du code HTML donné par un utilisateur.
  const image=document.createElement("div");
  image.className="design-svg-preview";
  image.innerHTML=furnitureSVG(spec);
  target.append(image);
  const h=document.createElement("p");
  h.textContent="Liste de coupe (longueur × largeur × épaisseur, en mm) :";
  target.append(h);
  const table=document.createElement("table");
  const head=document.createElement("thead");
  const tr=document.createElement("tr");
  for(const title of ["Réf.","Panneau","Qté","Cotes (mm)"]){
   const th=document.createElement("th");th.textContent=title;tr.append(th);
  }
  head.append(tr);table.append(head);
  const body=document.createElement("tbody");
  for(const part of spec.cuts){
   const row=document.createElement("tr");
   for(const value of [part.id,part.title,part.qty,part.length+" × "+part.width+" × "+part.thickness]){
    const td=document.createElement("td");td.textContent=String(value);row.append(td);
   }
   body.append(row);
  }
  table.append(body);target.append(table);
  const warnings=document.createElement("p");
  warnings.className="design-caution";
  warnings.textContent="À faire valider : stabilité et ancrage au mur, charges, quincaillerie, coupes et tolérances. DXF = contours géométriques de panneaux, pas du G-code CNC.";
  target.append(warnings);
  $("design-downloads").hidden=false;
 }catch(e){
  current=null;
  const p=document.createElement("p");
  p.textContent="Impossible de calculer ce plan : "+String(e.message||e);
  target.append(p);
 }
}
$("design-generate")?.addEventListener("click",generate);
function fileOut(text,type,extension){
 if(!current)return;
 const blob=new Blob([text],{type});
 const u=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=u;a.download="alicia-meuble-"+current.width+"x"+current.height+"x"+current.depth+"."+extension;
 document.body.append(a);a.click();a.remove();
 // Libérer l'URL à la fin de la commande, après le déclenchement de Safari.
 setTimeout(()=>URL.revokeObjectURL(u),2500);
}
$("design-save-svg")?.addEventListener("click",()=>fileOut(furnitureSVG(current),"image/svg+xml;charset=utf-8","svg"));
$("design-save-dxf")?.addEventListener("click",()=>fileOut(furnitureDXF(current),"application/dxf","dxf"));
$("design-save-csv")?.addEventListener("click",()=>fileOut(furnitureCSV(current),"text/csv;charset=utf-8","csv"));
function ask(text){
 const field=$("question");
 field.value=text;
 const pane=$("chat-form");
 pane.scrollIntoView({behavior:"smooth",block:"center"});
 field.focus({preventScroll:true});
}
$("design-send-chat")?.addEventListener("click",()=>{
 if(!current)return;
 ask("Analyse ce projet de meuble et pose-moi toutes les questions nécessaires à sa fabrication sécurisée. Ne prétends pas que des calculs de structure ont été effectués.\n\n"+furnitureBrief(current));
});
const TYPE_MAP={
 architecture:{
  title:"architecture ou rénovation de bâtiment",
  questions:"Site et mesures du terrain, règles d'urbanisme, accès, fondations, matériaux, ventilation, réseaux, plans 2D/3D, BIM et calcul structurel par ingénieur.",
  tools:"FreeCAD/Archicad/Revit pour modéliser, puis bureau d'études et logiciels structure spécialisés."
 },
 mechanical:{
  title:"conception mécanique et impression 3D",
  questions:"Usage, matériaux, cotes et tolérances, efforts, assemblages, fabrication, sécurité, export STEP/STL, simulation et validation par essais.",
  tools:"FreeCAD, SolidWorks ou Fusion pour la CAO ; calcul par éléments finis si nécessaire."
 },
 mapping:{
  title:"cartographie, topographie et relevés 3D",
  questions:"Référence géodésique, système de coordonnées, relevés vérifiés, précision LiDAR/drone, géoréférencement, périmètre et autorisations.",
  tools:"QGIS, logiciels de photogrammétrie, relevés géomètres et données SIG certifiées."
 }
};
$("design-pro-ask")?.addEventListener("click",()=>{
 const domain=$("design-domain").value;
 const info=TYPE_MAP[domain];if(!info)return;
 const description=$("design-pro-description").value.trim();
 if(description.length<10){
  $("design-pro-status").textContent="Précise ton idée en au moins dix caractères avant de préparer un cahier des charges.";
  return;
 }
 const text="Aide-moi à préparer un cahier des charges de "+info.title+" pour ce projet : "+description.slice(0,2000)+
  "\nContraintes à vérifier : "+info.questions+
  "\nOutils envisageables : "+info.tools+
  "\nDistingue ce qui est faisable directement dans Alicia de ce qui nécessite un logiciel professionnel, des données réelles ou des validations humaines. Pose des questions d'abord, puis propose les étapes.";
 $("design-pro-status").textContent="Cahier des charges placé dans la question d'Alicia. Vérifie les informations puis touche « Envoyer ».";
 ask(text);
});
