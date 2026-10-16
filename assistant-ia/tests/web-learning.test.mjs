import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {AI_CATALOG_2025,WEB_COURSES,SEARCH_ENGINES,searchUrl,catalogByCategory,compareCatalogTools,relevantExcerpts,findWebCourse} from "../web-learning-core.mjs";
import {publicPageURL,fetchPublicPage} from "../web-browse-core.mjs";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("50 IA distinctes dans le classement historique exact de l'image",()=>{
 assert.equal(AI_CATALOG_2025.length,50);
 assert.deepEqual(AI_CATALOG_2025.map(x=>x.rank2025),Array.from({length:50},(_,i)=>i+1));
 assert.equal(new Set(AI_CATALOG_2025.map(x=>x.name.toLowerCase())).size,50);
 assert.equal(AI_CATALOG_2025[0].name,"ChatGPT");
 assert.equal(AI_CATALOG_2025[1].name,"DeepSeek");
 assert.equal(AI_CATALOG_2025[5].name,"Claude");
 assert.equal(AI_CATALOG_2025[41].name,"Cursor");
 assert.equal(AI_CATALOG_2025[49].name,"Joyland");
 assert.ok(AI_CATALOG_2025.every(x=>x.category!=="divers"));
});
test("Comparaisons historiques n'inventent pas prix ni disponibilité actuels",()=>{
 const out=compareCatalogTools(1,42);
 assert.equal(out.a.name,"ChatGPT");assert.equal(out.b.name,"Cursor");
 assert.match(out.context,/Janvier 2025/);
 assert.match(out.limitations,/NON vérifiés/);
 assert.throws(()=>compareCatalogTools(1,1));
 assert.throws(()=>compareCatalogTools(1,51));
 assert.ok(catalogByCategory("code").some(x=>x.name==="Cursor"));
});
test("Six moteurs réels : liens valides, requêtes encodées et mots de passe exclus",()=>{
 assert.equal(SEARCH_ENGINES.length,6);
 const ids=new Set(SEARCH_ENGINES.map(x=>x.id));
 assert.deepEqual(ids,new Set(["google","bing","duckduckgo","brave","qwant","ecosia"]));
 for(const e of SEARCH_ENGINES){
   const url=new URL(searchUrl(e.id,"cours Python & sécurité"));
   assert.equal(url.protocol,"https:");
   assert.ok(url.searchParams.get("q")==="cours Python & sécurité");
 }
 assert.throws(()=>searchUrl("inexistant","hello"));
 assert.throws(()=>searchUrl("bing",""));
 assert.throws(()=>searchUrl("google","a".repeat(351)));
});
test("12 cours Web disponibles hors ligne et recherches de cours",()=>{
 assert.ok(WEB_COURSES.length>=12);
 for(const c of WEB_COURSES)assert.ok(c.lesson.length>=90&&c.example.length>=30&&c.exercise.length>=15,c.id);
 assert.equal(findWebCourse("comment apprendre HTML").title,"HTML");
 assert.equal(findWebCourse("CSS design").title,"CSS");
 assert.equal(findWebCourse("aucunepareil719zx"),null);
});
test("Comparaison de passages de deux pages sans fabrication de faits",()=>{
 const pages=[{title:"Source A",url:"https://site-a.org/article",text:"Le protocole HTTP utilise une requête et une réponse. La sécurité est importante."},
   {title:"Source B",url:"https://site-b.org/article",text:"Le protocole HTTPS protège la connexion entre un navigateur et un serveur."}];
 const output=relevantExcerpts("protocole HTTPS navigateur",pages);
 assert.equal(output.length,2);
 assert.equal(output[0].url,pages[0].url);
 assert.ok(output[1].excerpts[0].includes("HTTPS"));
 assert.ok(output[0].excerpts.every(x=>pages[0].text.includes(x)));
 assert.ok(output[1].excerpts.every(x=>pages[1].text.includes(x)));
});
test("Lecture externe : deux véritables réponses HTTP via transport contrôlé CORS",async()=>{
 let called=0;
 const fake={fetch:async(url,opt)=>{
    called++; assert.equal(opt.credentials,"omit");assert.equal(opt.redirect,"error");
    return {ok:true,url,headers:{get:k=>k==="content-type"?"text/html":"0"},text:async()=>"<article><p>La recherche informatique exige de citer les sources et de comparer les dates.</p></article>"};
 }};
 const urls=["https://sources-a.org/dossier","https://sources-b.org/dossier"];
 const pages=await Promise.all(urls.map(url=>fetchPublicPage(fake,url)));
 assert.equal(called,2);
 assert.deepEqual(pages.map(x=>x.url),urls);
 assert.ok(pages.every(x=>x.text.includes("comparer les dates")));
 assert.throws(()=>publicPageURL("http://127.0.0.1/admin"));
 assert.throws(()=>publicPageURL("https://localhost/secret"));
});
test("Atelier HTML/CSS encapsulé : ni scripts ni requêtes dans iframe de prévisualisation",()=>{
 const ui=read("web-learning-ui.js"),html=read("index.html"),sw=read("sw.js"),css=read("web-learning.css");
 for(const marker of ['sandbox=""','script-src \\'none\\'','connect-src \\'none\\'','form-action \\'none\\'','referrerpolicy="no-referrer"'])
   assert.ok(ui.includes(marker),marker);
 assert.ok(ui.includes("navigator.onLine"));
 assert.ok(ui.includes("window.fetch(url,{...options,mode:\"cors\"})"));
 assert.ok(ui.includes('window.AliciaOriginalEngine?.addCortectNote'));
 assert.ok(ui.includes('confirm("Enregistrer'));
 assert.doesNotMatch(ui,/eval\s*\(|new Function|allow-same-origin|allow-scripts|https:\/\/js\.puter\.com/);
 assert.match(html,/src="\.\/web-learning-ui\.js"/);
 assert.match(html,/href="\.\/web-learning\.css"/);
 assert.match(sw,/alicia-shell-v30/);
 for(const name of ["web-learning-core.mjs","web-learning-ui.js","web-learning.css"])assert.ok(sw.includes("./"+name));
 assert.match(css,/alicia-web-catalog/);
});
test("Réponses Alicia : oriente vers des recherches réelles et des cours, pas des résultats fictifs",()=>{
 const chat=read("cortect-chat.js");
 assert.match(chat,/window\.AliciaWebStudio/);
 assert.match(chat,/WEB_COURSES/);
 assert.match(chat,/six moteurs|Google, Bing, DuckDuckGo/);
 assert.match(chat,/ne garantit pas|ne garantit pas|sans inventer de résultats/i);
 assert.match(read("index.html"),/Version 0\.8\.4/);
});
