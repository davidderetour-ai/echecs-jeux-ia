/** Alicia : lecture de pages Web publiques, uniquement sur demande.
 * Jamais d'envoi de cookies, de navigation connectée ni d'ouverture de liens
 * internes au réseau de l'utilisateur. Une page externe reste non fiable.
 */
export function publicPageURL(input){
 const raw=String(input||"").trim();
 if(raw.length>2048)throw Error("Lien trop long.");
 let url;
 try{url=new URL(raw);}catch{throw Error("Adresse Internet non valide.");}
 if(url.protocol!=="https:")throw Error("La lecture en direct nécessite une adresse HTTPS publique.");
 if(url.username||url.password||(url.port&&url.port!=="443"))
  throw Error("Ce lien contient des identifiants ou un port interdit.");
 const host=url.hostname.toLowerCase();
 if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal")||host.endsWith(".lan")||host.endsWith(".home")||host.endsWith(".onion")||host.endsWith(".test")||host.endsWith(".invalid")||host.endsWith(".arpa")||host.endsWith(".example")||!host.includes(".")||host.startsWith("[")||/^\d+(?:\.\d+){3}$/.test(host))
  throw Error("La navigation ne peut pas consulter une adresse privée, locale ou IP.");
 if(/[\u0000-\u001f\u007f]/.test(raw))throw Error("Lien contenant des caractères non autorisés.");
 url.hash="";
 return url.href;
}
export function findPublicLinks(value,limit=2){
 const list=[];
 for(const found of String(value??"").match(/https?:\/\/[^\s<>"']+/gi)||[]){
  const candidate=found.replace(/[.,!?;)]+$/g,"");
  try{const clean=publicPageURL(candidate);if(!list.includes(clean))list.push(clean);}
  catch{/* L'adresse n'est pas consultée si invalide ou privée. */}
  if(list.length>=limit)break;
 }
 return list;
}
export function extractPageText(raw,contentType="text/html",maxChars=8500){
 let text=String(raw??"");
 if(!/text\/plain/i.test(contentType)){
  text=text.replace(/<!--[\s\S]*?-->/g," ")
    .replace(/<(script|style|noscript|template|svg|iframe|form|head|nav|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi," ")
    .replace(/<[^>]*>/g," ");
 }
 const entities={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",eacute:"é",agrave:"à",uuml:"ü"};
 text=text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi,(full,e)=>{
  if(e.startsWith("#")){const n=e[1].toLowerCase()==="x"?parseInt(e.slice(2),16):parseInt(e.slice(1),10);
   return n>0&&n<0x110000&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):" ";}
  return entities[e.toLowerCase()]??" ";
 }).replace(/\s+/g," ").trim();
 return text.slice(0,Math.max(100,Math.min(8500,maxChars)));
}
export function sourceAnnotations(response){
 const arr=[
  ...(Array.isArray(response?.message?.annotations)?response.message.annotations:[]),
  ...(Array.isArray(response?.annotations)?response.annotations:[])
 ];
 const result=[];
 for(const item of arr){
  const data=item?.url_citation||item;
  if(typeof data?.url!=="string")continue;
  try{
   const url=publicPageURL(data.url);
   if(!result.some(s=>s.url===url))result.push({url,title:String(data.title||new URL(url).hostname).slice(0,110)});
  }catch{/* Ignore les citations qui ne sont pas des sites publics HTTPS. */}
  if(result.length===6)break;
 }
 return result;
}
export async function fetchPublicPage(net,url){
 const safe=publicPageURL(url);
 if(typeof net?.fetch!=="function")throw Error("Puter ne permet pas la navigation à cet instant.");
 // Les redirections ne doivent jamais conduire à des adresses privées.
 const res=await net.fetch(safe,{method:"GET",redirect:"error",credentials:"omit",headers:{"Accept":"text/html,text/plain;q=0.9"},cache:"no-store"});
 if(!res?.ok)throw Error("Page inaccessible ou refusée ("+(res?.status||"réseau")+").");
 if(res.url&&publicPageURL(res.url)!==safe)throw Error("Redirection vers une autre page refusée par sécurité.");
 const type=String(res.headers?.get?.("content-type")||"text/html");
 if(!/^(?:text\/html|text\/plain)\b/i.test(type))throw Error("La page n'est pas un document texte HTML.");
 const n=Number(res.headers?.get?.("content-length")||0);
 if(n>600000)throw Error("Cette page est trop volumineuse pour être lue sur l'iPhone.");
 const body=await res.text();
 if(body.length>600000)throw Error("Cette page dépasse la taille autorisée.");
 const text=extractPageText(body,type);
 if(text.length<40)throw Error("Page vide, protégée ou générée en JavaScript : texte non accessible.");
 return {url:safe,title:new URL(safe).hostname,text};
}
