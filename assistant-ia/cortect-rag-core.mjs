/* Alicia CORTECT RAG 0.1 : indexation/recherche locale lexicale.
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
export function answerFromContext(query,index,limit=2){
 const hits=searchContext(query,index,limit);
 if(!hits.length)return {answer:"Je ne sais pas : mes notes ne contiennent pas de passage suffisamment pertinent pour répondre.",sources:[],found:false,mode:"extraction-locale"};
 // Extractive answer, never invent details or pretend to have generative AI.
 const citations=hits.map((hit,i)=>({id:hit.id,source:hit.source,snippet:hit.text,score:Number(hit.score.toFixed(3)),label:"Note "+(i+1)}));
 const answer="Voici ce que j'ai trouvé dans tes notes (citations, pas une réponse générée) :\n\n"+
   hits.map((h,i)=>"["+(i+1)+"] "+h.text.slice(0,610)+"\n— Source : "+h.source).join("\n\n");
 return {answer,sources:citations,found:true,mode:"extraction-locale"};
}
