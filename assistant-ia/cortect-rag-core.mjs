/* Alicia CORTECT RAG 0.2 : recherche large + reclassement local par contexte.
 * Aucun OpenAI, ChromaDB, modèle externe ou appel réseau.
 * Sources = documents personnels non fiables; aucune commande n'est exécutée.
 */
const STOP = new Set(["comment","quelle","quelles","quel","quels","est","sont","les","des","une","dans","pour","sur","par","avec","sans","plus","que","qui","quoi","dont","une","un","la","le","du","de","et","ou","au","aux","en","je","tu","nous","vous","mes","mon","ma","son","sa","ses","quelle","procedure","information","selon","document","donne","donner","trouve","cherche"]);
export function normalize(text){
 return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
}
function stem(word){
 return word.length>6?word.replace(/(ements|ement|ations|ation|ments|ment|iques|ique|elles|elle|eurs|euse|ions|ion|ees|ent|es|s)$/,""):word;
}
export function tokens(text){
 return normalize(text).split(" ").filter(x=>x.length>2&&!STOP.has(x)).map(stem);
}
export function chunkDocument(text,{size=650,overlap=90,maxChunks=24}={}){
 if(typeof text!=="string"||text.length>100000)throw new Error("Document trop grand");
 if(size<120||size>1800||overlap<0||overlap>=size)throw new Error("Paramètres de découpage invalides");
 const cleaned=text.replace(/\0/g,"").trim();
 const result=[];
 if(!cleaned)return result;
 let start=0;
 while(start<cleaned.length&&result.length<maxChunks){
  const end=Math.min(cleaned.length,start+size);
  let stop=end;
  if(end<cleaned.length){
    const at=cleaned.lastIndexOf(" ",end);
    if(at>start+Math.floor(size*0.65))stop=at;
  }
  const part=cleaned.slice(start,stop).trim();
  if(part)result.push(part);
  if(stop>=cleaned.length)break;
  start=Math.max(start+1,stop-overlap);
 }
 return result;
}
export function indexDocuments(documents){
 if(!Array.isArray(documents))throw new Error("Documents invalides");
 const index=[],seen=new Set();
 for(let i=0;i<Math.min(documents.length,120);i++){
  const doc=documents[i];
  if(!doc||typeof doc.content!=="string")continue;
  const source=String(doc.source||"Note sans titre").slice(0,110);
  // Stable ID derived from document ID + chunk index, not just position in a list.
  const docid=String(doc.id||"document-"+i).slice(0,90);
  const pieces=chunkDocument(doc.content,{size:650,overlap:80,maxChunks:8});
  pieces.forEach((text,indexInDoc)=>{
    const id=docid+"#"+indexInDoc;
    if(seen.has(id))return;
    seen.add(id);
    const ts=tokens(text);
    index.push({id,source,text,tokens:ts});
  });
 }
 return index;
}
export function searchContext(query,index,limit=2){
 const terms=[...new Set(tokens(query))];
 if(terms.length===0||!Array.isArray(index)||index.length===0)return [];
 const df=new Map();
 for(const term of terms){
  df.set(term,index.reduce((n,doc)=>n+(doc.tokens.includes(term)?1:0),0));
 }
 const avg=index.reduce((n,d)=>n+d.tokens.length,0)/index.length||1;
 const results=[];
 for(const doc of index){
  if(!doc||!Array.isArray(doc.tokens))continue;
  const counts=new Map();
  for(const t of doc.tokens)counts.set(t,(counts.get(t)||0)+1);
  let score=0,matched=0;
  for(const term of terms){
    const tf=counts.get(term)||0;
    if(!tf)continue;
    matched++;
    const idf=Math.log(1+(index.length-(df.get(term)||0)+.5)/((df.get(term)||0)+.5));
    score+=idf*(tf*2.2)/(tf+1.2*(.25+.75*doc.tokens.length/avg));
  }
  if(matched===0)continue;
  const coverage=matched/terms.length;
  // Require >= 1 relevant term and ~50% coverage for multi-term questions.
  if(terms.length>=3&&coverage<.45)continue;
  const normalized=score*(.55+.45*coverage);
  results.push({...doc,score:normalized,coverage});
 }
 results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return results.slice(0,Math.max(1,Math.min(6,Math.floor(limit)||2)));
}
/* Second passage de reclassement : inspecte la paire (question, extrait).
   Ce score est déterministe et lexical, pas un CrossEncoder neuronal entraîné.
   Le score est comparable au sein d'une recherche, pas une probabilité. */
const TERM_FAMILIES=[
 ["configurer","configuration","configure","configur","parametrer","parametrage","parametre"],
 ["modifier","modification","modifie","modifier","modifi","changer","change"],
 ["reseau","network"],
 ["teletravail","distance"],
 ["adresse","ip"],
 ["securite","securiser"]
];
function canonicalTerm(x){
 const n=normalize(x);
 for(const family of TERM_FAMILIES){
   if(family.some(v=>n===v||n.startsWith(v)&&v.length>=5))return family[0];
 }
 return stem(n);
}
function contextTerms(v){
 return normalize(v).split(" ").filter(w=>w.length>2&&!STOP.has(w)).map(canonicalTerm);
}
export function rerankCandidates(query,candidates,topN=2){
 const q=[...new Set(contextTerms(query))];
 if(!q.length||!Array.isArray(candidates))return [];
 const ranked=[];
 for(let i=0;i<Math.min(30,candidates.length);i++){
   const d=candidates[i],text=typeof d==="string"?d:d?.text;
   if(!text)continue;
   const ts=contextTerms(text),found=q.filter(t=>ts.includes(t));
   const coverage=found.length/q.length;
   if(coverage<.45||!found.length)continue;
   const indices=found.map(t=>ts.indexOf(t));
   const span=indices.length>1?Math.max(...indices)-Math.min(...indices)+1:ts.length;
   const density=found.length/Math.max(span,1);
   let ordered=0;
   for(let j=1;j<q.length;j++){
     for(let k=0;k<ts.length-1;k++)if(ts[k]===q[j-1]&&ts[k+1]===q[j]){ordered++;break;}
   }
   const topical=found.length>=2?0.75:0;
   // Explicit, limited hard-negative example: product-shopping context when
   // the question is about configuring/changing a network.
   const technical=q.includes("configurer")||q.includes("modifier");
   const shopping=ts.some(t=>["acheter","pommes","lait","cafe","courses"].includes(t));
   const penalty=technical&&shopping?2:0;
   const score=coverage*4+Math.min(density,1)*1.4+ordered*.6+topical-penalty;
   if(score>=2.5)ranked.push({...typeof d==="string"?{id:"candidate-"+i,source:"Note",text:d,tokens:tokens(d)}:d,
     rerankScore:Number(score.toFixed(4)),coverage:Number(coverage.toFixed(3)),ranker:"lexical-contextuel-local"});
 }
 ranked.sort((a,b)=>b.rerankScore-a.rerankScore||String(a.id).localeCompare(String(b.id)));
 return ranked.slice(0,Math.min(6,Math.max(1,Math.floor(topN)||2)));
}
export function retrieveBroad(query,index,topK=10){
 // 1er passage BM25 avec couverture plus permissive pour constituer le panier.
 const q=[...new Set(tokens(query))];
 if(!q.length||!Array.isArray(index))return [];
 const matches=[];
 for(const doc of index){
   if(!doc?.text||!Array.isArray(doc.tokens))continue;
   const count=q.reduce((n,t)=>n+(doc.tokens.includes(t)?1:0),0);
   // Canonical matches recover "configuration" / "configurer" variants.
   const canon=[...new Set(contextTerms(query))];
   const actual=new Set(contextTerms(doc.text));
   const related=canon.reduce((n,t)=>n+(actual.has(t)?1:0),0);
   if(count||related)matches.push({...doc,score:count+related*1.1});
 }
 matches.sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
 return matches.slice(0,Math.min(30,Math.max(1,Math.floor(topK)||10)));
}
export function retrieveAdvanced(query,index,{topK=10,topN=2}={}){
 return rerankCandidates(query,retrieveBroad(query,index,topK),topN);
}
export function answerFromContext(query,index,limit=2){
 const hits=retrieveAdvanced(query,index,{topK:10,topN:limit});
 if(!hits.length)return {answer:"Je ne sais pas : mes notes ne contiennent pas de passage suffisamment pertinent pour répondre.",sources:[],found:false,mode:"extraction-locale"};
 // Extractive answer, never invent details or pretend to have generative AI.
 const citations=hits.map((hit,i)=>({id:hit.id,source:hit.source,snippet:hit.text,score:Number(hit.rerankScore.toFixed(3)),label:"Note "+(i+1)}));
 const answer="Voici ce que j'ai trouvé dans tes notes (citations, pas une réponse générée) :\n\n"+
   hits.map((h,i)=>"["+(i+1)+"] "+h.text.slice(0,610)+"\n— Source : "+h.source).join("\n\n");
 return {answer,sources:citations,found:true,mode:"extraction-locale"};
}
