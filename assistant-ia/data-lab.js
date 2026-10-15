import {parseCSV,stats,compare,numeric} from "./data-core.mjs";

const $=id=>document.getElementById(id);
const left=$("data-file-a"),right=$("data-file-b"),choice=$("data-column"),result=$("data-results"),message=$("data-message");
const state={first:null,second:null};
const format=n=>n===null||!Number.isFinite(n)?"—":new Intl.NumberFormat("fr-FR",{maximumFractionDigits:5}).format(n);
function elt(tag,text,className){
 const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;
}
function clear(){result.replaceChildren();message.textContent="";}
function reportError(err){clear();message.textContent="⚠️ "+(err?.message||"Erreur de lecture du fichier");}
function knownColumns(){
 const common=state.first?.table?.headers||[];
 return state.second?common.filter(x=>state.second.table.headers.includes(x)):common;
}
function updateChoice(){
 const previous=choice.value;choice.replaceChildren();
 for(const name of knownColumns()){
  const option=elt("option",name);option.value=name;choice.append(option);
 }
 if([...choice.options].some(opt=>opt.value===previous))choice.value=previous;
 choice.disabled=!choice.options.length;
}
async function readFile(file){
 if(!file)return null;
 if(file.size>1_500_000)throw new Error("Fichier limité à 1,5 Mo.");
 if(!/\.(csv|tsv|txt)$/i.test(file.name))throw new Error("Format attendu : CSV ou TSV (.csv, .tsv, .txt).");
 const table=parseCSV(await file.text());
 return {name:file.name,table};
}
async function update(){
 try{
  clear();
  const [a,b]=await Promise.all([readFile(left.files?.[0]),readFile(right.files?.[0])]);
  state.first=a;state.second=b;updateChoice();
  if(!a){message.textContent="Choisis au moins un CSV pour analyser ses données.";return;}
  message.textContent=a.name+": "+a.table.rows.length+" lignes, "+a.table.headers.length+" colonnes"+
    (b?" · "+b.name+": "+b.table.rows.length+" lignes, "+b.table.headers.length+" colonnes":"")+
    ". Aucun fichier n'est envoyé sur Internet.";
 }catch(err){state.first=null;state.second=null;updateChoice();reportError(err)}
}
left.addEventListener("change",update);right.addEventListener("change",update);
function grid(headers,rows){
 const table=document.createElement("table");table.className="data-table";
 const tr=document.createElement("tr");
 for(const h of headers)tr.append(elt("th",h));
 const thead=document.createElement("thead");thead.append(tr);table.append(thead);
 const tbody=document.createElement("tbody");
 for(const row of rows){const tr=document.createElement("tr");for(const val of row)tr.append(elt("td",String(val)));tbody.append(tr)}
 table.append(tbody);return table;
}
function show(){
 clear();if(!state.first){message.textContent="Choisis d'abord un fichier.";return;}
 const a=state.first,b=state.second,column=choice.value;
 if(!column){message.textContent="Aucune colonne commune à analyser.";return;}
 const aStats=stats(a.table,column),bStats=b?stats(b.table,column):null;
 result.append(elt("h3","Résultats pour : "+column));
 if(b){
  const c=compare(a.table,b.table,column);
  result.append(grid(["Mesure",a.name,b.name],[
   ["Lignes totales",c.first.rows,c.second.rows],
   ["Valeurs numériques valides",c.first.valid,c.second.valid],
   ["Valeurs manquantes / non numériques",c.first.missing,c.second.missing],
   ["Total",format(c.first.sum),format(c.second.sum)],
   ["Moyenne",format(c.first.mean),format(c.second.mean)],
   ["Médiane",format(c.first.median),format(c.second.median)],
   ["Minimum",format(c.first.min),format(c.second.min)],
   ["Maximum",format(c.first.max),format(c.second.max)]
  ]));
  const p=elt("p","Écart des moyennes (2 − 1) : "+format(c.meanDelta)+
   (c.meanPercentChange===null?"":" ("+format(c.meanPercentChange)+" %)"));
  result.append(p);
  if(c.warning)result.append(elt("p","Attention : "+c.warning,"data-warning"));
 }else{
  const rows=a.table.headers.map(name=>stats(a.table,name))
    .filter(s=>s.valid).map(s=>[s.column,s.valid,s.missing,format(s.sum),format(s.mean),format(s.median),format(s.min),format(s.max)]);
  if(rows.length)result.append(grid(["Colonne","Valides","Exclues","Total","Moyenne","Médiane","Min","Max"],rows));
  else result.append(elt("p","Aucune colonne numérique reconnue sans ambiguïté."));
  if(aStats.missing)result.append(elt("p","La colonne choisie contient "+aStats.missing+" valeur(s) absente(s) ou non numérique(s).","data-warning"));
 }
 result.append(elt("p","Méthode : calcul exact sur les nombres reconnus. Aucune unité, causalité, équivalence des groupes ou qualité des sources n'est supposée. Vérifie que les deux fichiers emploient les mêmes unités et définitions.","data-footnote"));
}
$("analyze-data").addEventListener("click",show);
$("reset-data").addEventListener("click",()=>{
 left.value="";right.value="";state.first=null;state.second=null;updateChoice();clear();message.textContent="Données effacées de l'outil.";
});
updateChoice();
