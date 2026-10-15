import test from "node:test";
import assert from "node:assert/strict";
import {makeFurniture,furnitureSVG,furnitureCSV,furnitureDXF,furnitureBrief} from "../design-core.mjs";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const ui=readFileSync(new URL("../design-studio.js",import.meta.url),"utf8");
test("Un rangement paramétrique fournit les vrais panneaux en millimètres",()=>{
 const s=makeFurniture({name:"Étagère bureau",width:800,height:1200,depth:350,thickness:18,back:5,shelves:3,material:"Contreplaqué"});
 assert.equal(s.innerWidth,764);
 assert.equal(s.carcassDepth,345);
 assert.equal(s.cuts.length,4);
 assert.equal(s.cuts.find(x=>x.id==="C1").qty,2);
 assert.equal(s.cuts.find(x=>x.id==="C2").length,764);
 assert.equal(s.cuts.find(x=>x.id==="C3").qty,3);
 assert.equal(s.cuts.find(x=>x.id==="F1").width,800);
 assert.equal(s.elevations.length,3);
 assert.ok(s.elevations.every((x,i,a)=>x>0&&(i===0||x>a[i-1])));
 assert.equal(s.cuts.reduce((a,b)=>a+b.qty,0),8);
});
test("Chaque dimension insuffisante ou incohérente est refusée",()=>{
 for(const spec of [{width:100},{height:100},{depth:50},{thickness:40},{back:0},{shelves:9},{height:300,shelves:8},{width:"abc"}]){
  assert.throws(()=>makeFurniture(spec));
 }
});
test("SVG est bien un plan dessiné, libellé et échappé",()=>{
 const s=makeFurniture({name:"Test <script> & mairie",shelves:2});
 const svg=furnitureSVG(s);
 assert.match(svg,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.match(svg,/Test script &amp; mairie/);
 assert.doesNotMatch(svg,/<script>/);
 assert.match(svg,/800 mm \(largeur\)/);
 assert.match(svg,/2 étagère/);
 assert.match(svg,/AVERTISSEMENT/);
});
test("CSV contient quantité, cotes et en-tête Excel français",()=>{
 const s=makeFurniture();
 const csv=furnitureCSV(s);
 assert.ok(csv.startsWith("\ufeff"));
 assert.match(csv,/Longueur mm/);
 assert.match(csv,/"C3";"Étagères horizontales";"3";"764";"345";"18"/);
});
test("DXF ASCII contient des lignes CAD mais aucun G-code dangereux",()=>{
 const s=makeFurniture();
 const d=furnitureDXF(s);
 assert.match(d,/SECTION\r\n2\r\nHEADER/);
 assert.match(d,/\$ACADVER\r\n1\r\nAC1009/);
 assert.match(d,/0\r\nLINE\r\n8\r\nPANNEAUX/);
 assert.ok(d.endsWith("0\r\nEOF\r\n"));
 assert.doesNotMatch(d,/G0[01] |M[0-9]{2}/);
});
test("Le cahier des charges rappelle stabilité et vérification humaine",()=>{
 const brief=furnitureBrief(makeFurniture({width:900,height:1800}));
 assert.match(brief,/anti-basculement/);
 assert.match(brief,/PRELIMINAIRES/);
 assert.match(brief,/900 mm/);
});
test("Le menu atelier est disponible, avec exports et autres domaines non prétendus",()=>{
 for(const term of ["design-studio","design-width","design-height","design-shelves","design-save-dxf","design-save-svg","design-save-csv","design-pro-ask"]){
  assert.match(html,new RegExp('id="'+term+'"'));
 }
 assert.match(html,/option value="architecture"/);
 assert.match(html,/option value="mechanical"/);
 assert.match(html,/option value="mapping"/);
 assert.match(html,/logiciels de fabrication/);
 assert.match(ui,/furnitureDXF\(current\)/);
 assert.match(ui,/furnitureCSV\(current\)/);
 assert.match(ui,/furnitureSVG\(current\)/);
});
