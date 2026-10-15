import {findPublicLinks,fetchPublicPage,sourceAnnotations} from "./web-browse-core.mjs";
/** Lire une page publique explicitement donnée ; sinon le moteur IA peut
 * chercher sur le Web avec son outil intégré. Les pages sont des données
 * non fiables, pas de nouvelles instructions pour Alicia.
 */
async function readLinks(text){
 const urls=findPublicLinks(text,2);
 if(!urls.length)return {pages:[],sources:[]};
 if(typeof window.puter?.net?.fetch!=="function")
  throw Error("Le module réseau Puter n'est pas disponible. Vérifie la connexion Puter et le Wi-Fi.");
 const pages=[];
 for(const url of urls){
  try{
   const page=await fetchPublicPage(window.puter.net,url);
   pages.push(page);
  }catch(e){
   throw Error("La lecture de "+new URL(url).hostname+" a échoué : "+String(e.message||e)+". Alicia n'a pas pu consulter cette page.");
  }
 }
 return {pages,sources:pages.map(p=>({url:p.url,title:"Page consultée : "+p.title}))};
}
window.AliciaWeb={readLinks,sourceAnnotations,findPublicLinks};
