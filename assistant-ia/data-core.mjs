/**
 * Alicia : analyse deterministe de CSV/TSV entierement locale.
 * Les calculs restent sur l'appareil. Aucune transmission au serveur.
 * Valeurs douteuses ou dimensions inconnues => aucune invention.
 */
export function detectDelimiter(input){
 const text=String(input||"").replace(/^\uFEFF/,"");
 const records=text.split(/\r?\n/).filter(x=>x.trim()).slice(0,4);
 const candidates=[";","\t",","];
 const counts=candidates.map(delim=>{
  const perLine=records.map(line=>{
   let quoted=false,n=0;
   for(let i=0;i<line.length;i++){
    if(line[i]==='"'){if(quoted&&line[i+1]==='"'){i++;continue}quoted=!quoted}
    else if(line[i]===delim&&!quoted)n++;
   }
   return n;
  });
  return {delim,score:perLine.reduce((a,b)=>a+b,0),spread:Math.max(0,...perLine)-Math.min(...perLine)};
 });
 counts.sort((a,b)=>b.score-a.score||a.spread-b.spread);
 return counts[0].score>0?counts[0].delim:",";
}
export function parseCSV(input, delimiter=detectDelimiter(input)){
 const text=String(input||"").replace(/^\uFEFF/,"");
 if(text.length>1_500_000)throw new Error("Fichier trop volumineux (maximum 1,5 million de caractères).");
 if(![";",",","\t"].includes(delimiter))throw new Error("Séparateur CSV inconnu.");
 const data=[];let row=[],value="",quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){
   if(quoted&&text[i+1]==='"'){value+='"';i++}
   else if(quoted){quoted=false}
   else if(!value){quoted=true}
   else throw new Error("Guillemets CSV incorrects.");
  }else if(!quoted&&(ch===delimiter||ch==="\n"||ch==="\r")){
   row.push(value);value="";
   if(ch!==delimiter){
    if(ch==="\r"&&text[i+1]==="\n")i++;
    if(row.some(x=>x.trim()))data.push(row);
    row=[];
   }
  }else value+=ch;
  if(data.length>10000)throw new Error("Maximum 10 000 lignes par fichier.");
 }
 if(quoted)throw new Error("Guillemets CSV non fermés.");
 row.push(value);if(row.some(x=>x.trim()))data.push(row);
 if(data.length<2)throw new Error("Le fichier doit contenir un en-tête et au moins une ligne de données.");
 const headers=data[0].map(x=>x.trim());
 if(headers.some(x=>!x))throw new Error("Nom de colonne manquant.");
 if(new Set(headers).size!==headers.length)throw new Error("Colonnes portant le même nom.");
 if(headers.length>80)throw new Error("Maximum 80 colonnes.");
 const rows=data.slice(1).map((r,i)=>{
  if(r.length!==headers.length)throw new Error("Nombre de cellules incohérent à la ligne "+(i+2)+".");
  return r.map(x=>x.trim());
 });
 return {headers,rows,delimiter};
}
export function numeric(text){
 if(typeof text!=="string")return null;
 let value=text.trim().replace(/\u00a0|\u202f/g," ");
 if(!value)return null;
 // Refuse monnaies, pourcentages, mesures sans unite explicite et nombres ambigus.
 if(!/^[+-]?(?:\d{1,3}(?: \d{3})+|\d+)(?:[.,]\d+)?$/.test(value))return null;
 value=value.replace(/ /g,"").replace(",",".");
 const n=Number(value);return Number.isFinite(n)?n:null;
}
export function stats(table,column){
 if(!table||!Array.isArray(table.headers)||!Array.isArray(table.rows))throw new Error("Tableau absent.");
 const index=table.headers.indexOf(column);
 if(index<0)throw new Error("Colonne introuvable.");
 const values=table.rows.map(row=>numeric(row[index])).filter(x=>x!==null);
 const missing=table.rows.length-values.length;
 if(!values.length)return {column,rows:table.rows.length,valid:0,missing,min:null,max:null,mean:null,median:null,sum:null};
 const ordered=[...values].sort((a,b)=>a-b),n=ordered.length;
 const sum=values.reduce((a,b)=>a+b,0);
 const median=n%2?ordered[Math.floor(n/2)]:(ordered[n/2-1]+ordered[n/2])/2;
 return {column,rows:table.rows.length,valid:n,missing,min:ordered[0],max:ordered[n-1],mean:sum/n,median,sum};
}
export function compare(a,b,column){
 const first=stats(a,column),second=stats(b,column);
 const delta=first.mean!==null&&second.mean!==null?second.mean-first.mean:null;
 const pct=delta!==null&&first.mean!==0?delta/Math.abs(first.mean)*100:null;
 return {first,second,meanDelta:delta,meanPercentChange:pct,warning:
  !first.valid||!second.valid?"Comparaison impossible : colonne sans valeurs numériques valides.":
  (first.missing||second.missing)?"Certaines valeurs manquent ou ne sont pas numériques : résultats calculés sur les seules valeurs valides.":
  ""};
}
