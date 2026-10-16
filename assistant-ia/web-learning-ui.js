/* Alicia — Atelier Recherche & Développement Web, gratuit.
 * Recherche multi-moteurs via ouverture volontaire; aucun résultat simulé.
 * Prévisualisation HTML/CSS isolée sans JS ni réseau; comparaison de pages
 * publiques seulement si le site autorise une lecture directe CORS.
 */
import {AI_CATALOG_2025,WEB_COURSES,SEARCH_ENGINES,searchUrl,catalogByCategory,compareCatalogTools,relevantExcerpts} from "./web-learning-core.mjs";
import {fetchPublicPage,publicPageURL} from "./web-browse-core.mjs";
const $=id=>document.getElementById(id);
const addText=(tag,value,cls="")=>{const el=document.createElement(tag);el.textContent=String(value);if(cls)el.className=cls;return el;};
const categories={all:"Toutes les catégories",assistants:"Assistants IA",research:"Recherche et ressources",code:"Programmation",image:"Images et création",video:"Vidéo",audio:"Audio",education:"Éducation",productivity:"Productivité",characters:"Personnages et conversations"};
function init(){
 if($("alicia-web-lab"))return;
 const details=document.createElement("details");
 details.id="alicia-web-lab";details.className="alicia-web-lab";
 details.innerHTML='<summary>🌐 Internet, moteurs de recherche, développement Web et 50 outils IA</summary>'+
 '<div class="alicia-web-body">'+
 '<p>Les cours et le catalogue sont disponibles hors ligne. La recherche actuelle nécessite Internet : Alicia ouvre les moteurs choisis, <strong>sans inventer ni récupérer automatiquement leurs résultats</strong>.</p>'+
 '<h3>Rechercher avec plusieurs moteurs</h3>'+
 '<label>Ta recherche <input id="alicia-web-query" placeholder="ex. Python 3.12.9 macOS Big Sur" maxlength="350"></label>'+
 '<div id="alicia-web-engines" class="alicia-web-actions"></div>'+
 '<p id="alicia-web-search-status" role="status"></p>'+
 '<h3>Comparer deux pages Internet</h3>'+
 '<p>Indique deux pages HTTPS publiques précises (et non leurs pages de résultats). Leur lecture dépend de l’accès autorisé par chaque site.</p>'+
 '<label>Première page HTTPS <input id="alicia-web-source-a" inputmode="url" placeholder="https://exemple.fr/article" maxlength="2048"></label>'+
 '<label>Deuxième page HTTPS <input id="alicia-web-source-b" inputmode="url" placeholder="https://exemple.org/article" maxlength="2048"></label>'+
 '<button type="button" id="alicia-web-compare-pages">Lire et comparer ces deux sources</button>'+
 '<button type="button" id="alicia-web-save-compare" disabled>Enregistrer les extraits dans mes notes</button>'+
 '<div id="alicia-web-page-result" class="alicia-web-results" role="status"></div>'+
 '<h3>Les 50 outils IA de la référence</h3>'+
 '<p>Source : illustration « Top 50 Gen AI Web Products », Similarweb, <strong>janvier 2025</strong>. Rang historique de fréquentation, pas classement actuel de qualité, de fiabilité ou de gratuité.</p>'+
 '<label>Catégorie <select id="alicia-web-category"></select></label>'+
 '<div id="alicia-web-catalog" class="alicia-web-catalog"></div>'+
 '<label>Comparer deux outils <select id="alicia-web-tool-a"></select><select id="alicia-web-tool-b"></select></label>'+
 '<button type="button" id="alicia-web-compare-tools">Comparer leurs caractéristiques connues</button>'+
 '<div id="alicia-web-tool-result" class="alicia-web-results" role="status"></div>'+
 '<h3>Apprendre à développer pour le Web</h3>'+
 '<div id="alicia-web-courses"></div>'+
 '<h3>Mon atelier HTML / CSS</h3>'+
 '<p>Tu peux écrire du HTML et du CSS et créer une prévisualisation isolée. Les scripts JavaScript, les formulaires actifs et les requêtes réseau restent désactivés dans cet aperçu. Le JavaScript s’étudie dans les cours.</p>'+
 '<label>HTML <textarea id="alicia-web-html" rows="5" spellcheck="false" maxlength="12000"></textarea></label>'+
 '<label>CSS <textarea id="alicia-web-css" rows="5" spellcheck="false" maxlength="8000"></textarea></label>'+
 '<div class="alicia-web-actions"><button type="button" id="alicia-web-render">Afficher mon site</button>'+
 '<button type="button" id="alicia-web-copy">Copier le code HTML/CSS</button></div>'+
 '<iframe id="alicia-web-preview" sandbox="" referrerpolicy="no-referrer" title="Aperçu isolé de ma page Web sans scripts ni réseau"></iframe>'+
 '<p id="alicia-web-editor-status" role="status">Aucun code n’a été exécuté.</p>'+
 '</div>';
 const anchor=$("alicia-professeur")||$("alicia-python-school")||$("cortect-panel")||$("chat-form");
 if(anchor)anchor.before(details);else document.querySelector(".shell")?.append(details);
 const status=(id,text)=>{$(id).textContent=String(text);};
 const categoriesSelect=$("alicia-web-category");
 for(const [id,title] of Object.entries(categories)){const opt=document.createElement("option");opt.value=id;opt.textContent=title;categoriesSelect.append(opt);}
 const query=$("alicia-web-query"),engineBox=$("alicia-web-engines");
 for(const engine of SEARCH_ENGINES){
   const btn=addText("button",engine.name);btn.type="button";
   btn.addEventListener("click",()=>{
     try{
       const link=searchUrl(engine.id,query.value);
       const newTab=window.open(link,"_blank","noopener,noreferrer");
       status("alicia-web-search-status","Recherche transmise à "+engine.name+" dans un nouvel onglet. Alicia n'a pas lu ses résultats. Si rien ne s'ouvre, autorise les nouveaux onglets.");
     }catch(e){status("alicia-web-search-status",e.message);}
   });
   engineBox.append(btn);
 }
 const catalogBox=$("alicia-web-catalog");
 function renderCatalog(){
   catalogBox.replaceChildren();
   for(const item of catalogByCategory(categoriesSelect.value)){
     const card=document.createElement("div");card.className="alicia-web-tool";
     card.append(addText("strong",item.rank2025+". "+item.name));
     card.append(addText("small",categories[item.category]||"Catégorie non confirmée"));
     const inspect=addText("button","Rechercher cet outil");inspect.type="button";
     inspect.addEventListener("click",()=>{
       query.value=item.name+" site officiel fonctions tarifs confidentialité";
       details.open=true;details.scrollIntoView({behavior:"smooth",block:"start"});
       status("alicia-web-search-status","Question préparée : choisis Google, Bing, DuckDuckGo, Brave, Qwant ou Ecosia. Alicia ne garantit pas que l'outil est encore disponible ou gratuit.");
     });
     card.append(inspect);catalogBox.append(card);
   }
 }
 categoriesSelect.addEventListener("change",renderCatalog);renderCatalog();
 for(const id of ["alicia-web-tool-a","alicia-web-tool-b"]){
   const select=$(id);for(const item of AI_CATALOG_2025){const opt=document.createElement("option");opt.value=String(item.rank2025);opt.textContent=item.rank2025+". "+item.name;select.append(opt);}
 }
 $("alicia-web-tool-b").value="2";
 $("alicia-web-compare-tools").addEventListener("click",()=>{
   const result=$("alicia-web-tool-result");result.replaceChildren();
   try{
     const compared=compareCatalogTools(Number($("alicia-web-tool-a").value),Number($("alicia-web-tool-b").value));
     result.append(addText("p",compared.context));
     for(const line of compared.differences)result.append(addText("p",line));
     result.append(addText("p",compared.limitations));
   }catch(e){result.append(addText("p",e.message));}
 });
 const courseBox=$("alicia-web-courses");
 for(const course of WEB_COURSES){
   const card=document.createElement("details");card.className="alicia-web-course";
   card.append(addText("summary",course.title),addText("p",course.lesson),
     addText("pre",course.example),addText("p","Exercice : "+course.exercise));
   courseBox.append(card);
 }
 const sourceBox=$("alicia-web-page-result"),save=$("alicia-web-save-compare");
 let captured=null,busy=false;
 $("alicia-web-compare-pages").addEventListener("click",async()=>{
   if(busy)return;busy=true;captured=null;save.disabled=true;sourceBox.replaceChildren();
   try{
     if(!navigator.onLine)throw Error("Mode hors ligne : les sources en direct ne sont pas consultables.");
     const a=publicPageURL($("alicia-web-source-a").value),b=publicPageURL($("alicia-web-source-b").value);
     if(a===b)throw Error("Choisis deux pages différentes.");
     sourceBox.append(addText("p","Lecture de deux pages HTTPS publiques, sans cookies…"));
     // Browser CORS restrictions are respected: no scraping bypass, no proxy.
     const net={fetch:(url,options)=>window.fetch(url,{...options,mode:"cors"})};
     const pages=[];
     for(const url of [a,b])pages.push(await fetchPublicPage(net,url));
     const q=query.value.trim()||"contenu de cette page";
     const excerpts=relevantExcerpts(q,pages);
     sourceBox.replaceChildren();
     sourceBox.append(addText("p","Comparaison de passages lus. Ces extraits ne sont pas une vérification indépendante des affirmations."));
     for(const s of excerpts){
       const el=document.createElement("div");el.className="alicia-web-result-source";
       el.append(addText("strong",s.title),addText("small",s.url));
       for(const e of s.excerpts)el.append(addText("p",e));
       if(!s.matched)el.append(addText("small","Aucun mot de la question repéré : pertinence incertaine."));
       sourceBox.append(el);
     }
     captured={question:q,excerpts};
     save.disabled=false;
   }catch(e){
     sourceBox.replaceChildren();
     sourceBox.append(addText("p","⚠️ Lecture non confirmée : "+(e.message||e)+". Certains sites bloquent la lecture intersites (CORS) ; Alicia ne contourne pas cette protection. Tu peux les ouvrir dans les moteurs ci-dessus, ou copier manuellement leurs passages dans CORTECT."));
   }finally{busy=false;}
 });
 save.addEventListener("click",async()=>{
   if(!captured)return;
   if(!confirm("Enregistrer les extraits de ces deux pages dans la mémoire locale d'Alicia ?"))return;
   const text="Recherche : "+captured.question+"\n"+captured.excerpts.map(e=>
    "Source : "+e.url+"\n"+e.excerpts.join("\n")).join("\n---\n");
   if(window.AliciaNativeMemory?.ready)await window.AliciaNativeMemory.ready;
   const res=window.AliciaOriginalEngine?.addCortectNote?.("Pages publiques : extraits non vérifiés",text.slice(0,1950),["#web","#recherche","#a_verifier"]);
   const ok=res?.ok&&(window.AliciaNativeMemory?await window.AliciaNativeMemory.flush():true);
   sourceBox.append(addText("p",ok?"Extraits enregistrés localement avec leurs sources.":"Sauvegarde non confirmée : le contenu reste affiché."));
 });
 const html=$("alicia-web-html"),css=$("alicia-web-css");
 html.value='<main><h1>Bonjour, je suis Alicia</h1><p>Mon premier site Web hors ligne.</p><button>Explorer</button></main>';
 css.value='body { font: 16px system-ui; color: #182447; padding: 20px; background: #f3f7ff; } h1 { color: #674ce6; }';
 $("alicia-web-render").addEventListener("click",()=>{
   const preview=$("alicia-web-preview");
   // HTML sandbox lacks allow-scripts and allow-same-origin. CSP forbids all
   // network loads, scripts, forms and embeds, even if user HTML requests them.
   const csp="default-src 'none'; script-src 'none'; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
   preview.srcdoc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+csp+'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css.value+'</style></head><body>'+html.value+'</body></html>';
   status("alicia-web-editor-status","Aperçu HTML/CSS isolé. Aucun JavaScript ni connexion réseau n'a été autorisé dans cette fenêtre.");
 });
 $("alicia-web-copy").addEventListener("click",async()=>{
   const documentText='<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>'+css.value+'</style></head><body>'+html.value+'</body></html>';
   try{await navigator.clipboard.writeText(documentText);
     status("alicia-web-editor-status","Code HTML/CSS copié. Vérifie-le avant de le publier.");
   }catch{status("alicia-web-editor-status","Copie impossible ici : sélectionne le code dans les champs.");}
 });
 window.AliciaWebStudio={open(){details.open=true;details.scrollIntoView({behavior:"smooth",block:"start"});},catalogSize:AI_CATALOG_2025.length};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
