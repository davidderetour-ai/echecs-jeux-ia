/* Alicia Web Atelier v1: outils pédagogiques 100% gratuits.
 * Recherche : liens vers moteurs publics + APIs ouvertes Wikipedia et Crossref.
 * Un moteur externe ne peut pas être collecté automatiquement si CORS/robots l'interdisent.
 * Les pages extérieures sont des données non fiables et jamais des instructions.
 */
import {publicPageURL,extractPageText} from "./web-browse-core.mjs";
export const SEARCH_ENGINES=Object.freeze([
 {id:"google",name:"Google",base:"https://www.google.com/search",param:"q",type:"général"},
 {id:"bing",name:"Bing",base:"https://www.bing.com/search",param:"q",type:"général"},
 {id:"duckduckgo",name:"DuckDuckGo",base:"https://duckduckgo.com/",param:"q",type:"général"},
 {id:"brave",name:"Brave Search",base:"https://search.brave.com/search",param:"q",type:"général"},
 {id:"ecosia",name:"Ecosia",base:"https://www.ecosia.org/search",param:"q",type:"général"}
]);
export function queryEngines(query){
 const q=String(query||"").trim();
 if(!q||q.length>250)throw Error("Saisis un sujet de recherche de 1 à 250 caractères.");
 return SEARCH_ENGINES.map(e=>{const u=new URL(e.base);u.searchParams.set(e.param,q);return {id:e.id,name:e.name,type:e.type,url:u.href};});
}
function strip(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}
const STOP=new Set(["avec","pour","dans","plus","une","qui","que","les","des","sur","cette","c'est","sont","donc","comme","leur","leurs","notre","entre","nous","vous","mais","peut","faire","cette","information","source","selon"]);
function wordSet(value){return new Set(strip(value).split(" ").filter(w=>w.length>=5&&!STOP.has(w)));}
function wordCount(text){return strip(text).split(" ").filter(Boolean).length;}
export function compareTexts(entries){
 const list=(Array.isArray(entries)?entries:[]).slice(0,4)
 .filter(x=>x&&typeof x.text==="string"&&x.text.trim().length>=20)
 .map(x=>({title:String(x.title||x.url||"Document").slice(0,140),
   url:x.url||null,text:x.text.slice(0,12000)}));
 if(list.length<2)return {ok:false,sources:list,message:"Il faut au moins deux textes lisibles pour comparer des sources.",points:[]};
 const sets=list.map(x=>wordSet(x.text));
 const points=[];
 for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  const a=sets[i],b=sets[j],common=[...a].filter(w=>b.has(w));
  const score=common.length/Math.max(1,new Set([...a,...b]).size);
  const aOnly=[...a].filter(w=>!b.has(w)).slice(0,9);
  const bOnly=[...b].filter(w=>!a.has(w)).slice(0,9);
  points.push({first:i,second:j,similarity:Number((score*100).toFixed(1)),common:common.slice(0,16),onlyFirst:aOnly,onlySecond:bOnly});
 }
 return {ok:true,method:"Comparaison lexicale Jaccard, pas une vérification de vérité.",sources:list.map(x=>({title:x.title,url:x.url,characters:x.text.length,words:wordCount(x.text)})),points};
}
export function auditWebPage({html="",css="",js=""}={}){
 const h=String(html),c=String(css),j=String(js);
 if([h,c,j].some(x=>x.length>45000))throw Error("Chaque panneau est limité à 45 000 caractères.");
 const issues=[];
 if(!/<!doctype\s+html/i.test(h))issues.push({level:"conseil",message:"Ajoute <!DOCTYPE html> pour le mode standards."});
 if(!/<html[^>]*lang\s*=/i.test(h))issues.push({level:"accessibilité",message:"Indique lang=\"fr\" sur l'élément html."});
 if(!/<meta[^>]*name\s*=\s*["']viewport["']/i.test(h))issues.push({level:"mobile",message:"Ajoute la balise viewport pour l'affichage iPhone."});
 if(!/<title[\s>]/i.test(h))issues.push({level:"référencement",message:"Ajoute un titre de page explicite."});
 if(!/<h1(?:\s|>)/i.test(h))issues.push({level:"structure",message:"Ajoute un titre principal <h1>."});
 if(/<img\b/i.test(h)&&/<img\b(?![^>]*\balt\s*=)[^>]*>/i.test(h))issues.push({level:"accessibilité",message:"Ajoute un attribut alt aux images qui apportent du sens."});
 if(/<button\b/i.test(h)&&!/<button[^>]*>(?:[^<\s]|[\s\S]*?\S)/i.test(h))issues.push({level:"accessibilité",message:"Vérifie les noms accessibles de tes boutons."});
 if(/@import\s+url\(\s*https?:|<script[^>]*src=["']https?:/i.test(h+"\n"+c))issues.push({level:"hors ligne",message:"Des ressources Internet externes empêcheront le fonctionnement entièrement hors ligne."});
 if(/(?:eval|new\s+Function)\s*\(/i.test(j))issues.push({level:"sécurité",message:"Évite eval() et new Function() avec des entrées non fiables."});
 if(/document\.write\s*\(/i.test(j))issues.push({level:"robustesse",message:"Évite document.write() ; préfère createElement et textContent."});
 return {score:Math.max(0,100-issues.length*10),issues,lines:{html:h.split("\n").length,css:c.split("\n").length,js:j.split("\n").length}};
}
export function previewDocument({html="",css="",js=""}={}){
 const h=String(html),c=String(css),j=String(js);
 if([h,c,j].some(x=>x.length>45000))throw Error("Code trop long.");
 // The sandboxed iframe is a unique opaque origin with no cookies and CSP denying network.
 // Do not embed user code into script tags that can be broken by </script>.
 const escapeTag=s=>String(s).replace(/</g,"\\u003c");
 const htmlDoc=h.replace(/^\s*<!doctype[^>]*>/i,"").replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,"");
 return '<!doctype html><html lang="fr"><head><meta charset="UTF-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data: blob:; style-src &#39;unsafe-inline&#39;; script-src &#39;unsafe-inline&#39;; connect-src &#39;none&#39;; font-src &#39;none&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">'+
  '<style>'+c.replace(/<\/style/gi,"<\\/style")+'</style></head><body>'+
  htmlDoc+'<script>'+escapeTag(j).replace(/<\\u003c\/script/gi,"")+'</script></body></html>';
}
export async function openSearchCatalog(query,{fetcher=fetch,signal}={}){
 const q=String(query||"").trim();
 if(!q||q.length>250)throw Error("Sujet invalide");
 const endpoints=[
  {name:"Wikipedia (fr)",url:"https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch="+encodeURIComponent(q)+"&srlimit=5&format=json&origin=*"},
  {name:"Crossref (publications)",url:"https://api.crossref.org/works?query.title="+encodeURIComponent(q)+"&rows=5"}
 ];
 const settled=await Promise.allSettled(endpoints.map(async e=>{
  const response=await fetcher(e.url,{method:"GET",credentials:"omit",mode:"cors",redirect:"error",
   cache:"no-store",headers:{Accept:"application/json"},signal});
  if(!response.ok)throw Error(e.name+" : service indisponible ("+response.status+")");
  const json=await response.json();
  if(e.name.startsWith("Wikipedia")){
   return (json?.query?.search||[]).slice(0,5).map(x=>({
    engine:e.name,title:String(x.title||"Sans titre").slice(0,220),
    url:"https://fr.wikipedia.org/wiki/"+encodeURIComponent(String(x.title||"").replace(/ /g,"_")),
    description:extractPageText(x.snippet||"","text/html",700),verified:false}));
  }
  return (json?.message?.items||[]).slice(0,5).filter(x=>x.DOI).map(x=>({
   engine:e.name,title:String(x.title?.[0]||x.DOI).slice(0,220),
   url:"https://doi.org/"+encodeURIComponent(x.DOI).replace(/%2F/gi,"/"),
   description:String(x.publisher||"")+" · "+String(x.published?.["date-parts"]?.[0]?.[0]||"année inconnue"),
   verified:false}));
 }));
 return {results:settled.flatMap(x=>x.status==="fulfilled"?x.value:[]),
  failures:settled.map((x,i)=>x.status==="rejected"?endpoints[i].name+" : "+String(x.reason?.message||x.reason):null).filter(Boolean),
  message:"Résultats externes non vérifiés. Le navigateur peut bloquer ces services (CORS)."};
}
export async function comparePublicPages(urls,{fetcher=fetch,signal}={}){
 const clean=[...new Set((Array.isArray(urls)?urls:[]).filter(Boolean).map(publicPageURL))].slice(0,3);
 if(clean.length<2)throw Error("Ajoute deux adresses HTTPS publiques différentes.");
 const result=await Promise.allSettled(clean.map(async url=>{
  const res=await fetcher(url,{method:"GET",credentials:"omit",redirect:"error",mode:"cors",cache:"no-store",
   headers:{Accept:"text/html,text/plain"},signal});
  if(!res.ok)throw Error("Accès refusé "+res.status);
  if(res.url&&publicPageURL(res.url)!==url)throw Error("Redirection refusée");
  const type=String(res.headers?.get("content-type")||"text/html");
  if(!/^(text\/html|text\/plain)/i.test(type))throw Error("Cette source n'est pas du texte.");
  if(Number(res.headers?.get("content-length")||0)>200000)throw Error("Page trop volumineuse");
  const raw=await res.text();if(raw.length>200000)throw Error("Page trop volumineuse");
  const text=extractPageText(raw,type,8000);if(text.length<40)throw Error("Texte absent ou illisible");
  return {title:new URL(url).hostname,url,text};
 }));
 const sources=result.filter(x=>x.status==="fulfilled").map(x=>x.value);
 return {comparison:compareTexts(sources),sources,
   errors:result.map((x,i)=>x.status==="rejected"?clean[i]+" : "+String(x.reason?.message||x.reason):null).filter(Boolean)};
}
