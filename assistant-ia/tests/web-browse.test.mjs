import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publicPageURL,findPublicLinks,extractPageText,fetchPublicPage,sourceAnnotations} from "../web-browse-core.mjs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const engine=readFileSync(new URL("../puter-engine.js",import.meta.url),"utf8");
const menu=readFileSync(new URL("../composer-tools.js",import.meta.url),"utf8");

test("Navigation HTTPS publique, refuse adresses internes, privées et exécutions",()=>{
 assert.equal(publicPageURL("https://www.example.org/articles?x=2#haut"),"https://www.example.org/articles?x=2");
 for(const url of ["http://example.org","https://localhost","https://127.0.0.1/test","https://[::1]/","https://router.local","https://10.0.0.2","https://a.internal","javascript:alert(1)","file:///etc/passwd","https://nom:motdepasse@example.org","https://exemple.fr:8443"]){
  assert.throws(()=>publicPageURL(url),undefined,url);
 }
});
test("Les liens retenus sont publics, deux maximum, non répétés",()=>{
 const list=findPublicLinks("Voir https://example.org/a, https://example.org/a et https://docs.puter.com/Networking/fetch/ et https://localhost/private",2);
 assert.equal(list.length,2);
 assert.equal(list[0],"https://example.org/a");
 assert.equal(list[1],"https://docs.puter.com/Networking/fetch/");
});
test("Lecture du texte HTML sans instructions de script ni balises actives",()=>{
 const data='<html><head><title>Page</title></head><body><nav>Menu</nav><h1>Plan en bois</h1><p>Une bonne méthode consiste à mesurer chaque cote.</p><script>NE_FAIS_PAS_CELA()</script><style>.bug{}</style></body></html>';
 const text=extractPageText(data);
 assert.match(text,/Plan en bois/);
 assert.match(text,/mesurer chaque cote/);
 assert.doesNotMatch(text,/NE_FAIS_PAS_CELA|\.bug|<script>/);
});
test("Requête Web effective avec contenu et URL sourcés",async()=>{
 let count=0;
 const net={fetch:async(url,options)=>{
  count++;assert.equal(options.redirect,"error");assert.equal(options.credentials,"omit");
  return {ok:true,url,headers:{get:k=>k==="content-type"?"text/html":null},text:async()=>"<article><h1>Une information vérifiée par la page</h1><p>Ceci est le contenu actuel du site.</p></article>"};
 }};
 const result=await fetchPublicPage(net,"https://www.example.org/actualites");
 assert.equal(count,1);
 assert.equal(result.url,"https://www.example.org/actualites");
 assert.match(result.text,/contenu actuel/);
});
test("Une page ou redirection non textuelle est refusée",async()=>{
 await assert.rejects(fetchPublicPage({fetch:async()=>({ok:true,url:"https://local.test/private",headers:{get:()=> "text/html"},text:async()=> "texte suffisant pour être lu"})},"https://www.example.org/"),/privée|locale|IP|redirection|adresse/i);
 await assert.rejects(fetchPublicPage({fetch:async()=>({ok:true,url:"https://www.example.org/",headers:{get:()=> "application/pdf"},text:async()=> "pdf"})},"https://www.example.org/"),/document texte/);
});
test("Citations Internet seulement sur des URL publiques HTTPS",()=>{
 const s=sourceAnnotations({message:{annotations:[{url_citation:{url:"https://www.example.org/","title":"Exemple"}},{url_citation:{url:"https://localhost/a","title":"privé"}}]}});
 assert.equal(s.length,1);
 assert.equal(s[0].title,"Exemple");
});
test("L'utilisateur choisit entre connaissance du modèle et Internet réel",()=>{
 assert.match(html,/id="search" type="checkbox"/);
 assert.match(html,/Naviguer sur Internet en direct/);
 assert.match(html,/id="share-link-read"/);
 assert.match(menu,/\$\("share-link-read"\)\?\.addEventListener/);
 assert.match(engine,/if\(web&&!review\)/);
 assert.match(engine,/window\.AliciaWeb\.readLinks/);
 assert.match(engine,/model:"openai\/gpt-5\.6-luna"/);
 assert.match(engine,/tools:\[\{type:"web_search"\}\]/);
});
