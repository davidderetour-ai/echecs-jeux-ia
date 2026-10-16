/* Alicia Web : multi-moteurs, comparaison sourcée et laboratoire Web isolé. */
import {queryEngines,openSearchCatalog,comparePublicPages,compareTexts,auditWebPage,previewDocument} from "./alicia-web-core.mjs";
const $=id=>document.getElementById(id);
function e(tag,txt){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;}
function link(url,txt){const a=e("a",txt);a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";return a;}
function init(){
 if($("alicia-web-atelier"))return;
 const p=document.createElement("details");p.id="alicia-web-atelier";p.className="alicia-web-atelier";
 p.innerHTML='<summary>🌐 Alicia Web — développement, recherche et comparaison</summary><div class="alicia-web-body">'+
 '<p>Hors ligne : cours et création de sites. En ligne : liens vers 5 moteurs, accès aux catalogues gratuits et comparaison de pages HTTPS accessibles. Aucune API payante.</p>'+
 '<h3>Recherche multi-moteurs</h3><label>Sujet <input id="alicia-web-query" maxlength="250" placeholder="Comment créer un site accessible ?"></label>'+
 '<div class="alicia-web-actions"><button type="button" id="alicia-web-search">Préparer 5 recherches</button><button type="button" id="alicia-web-catalogs">Chercher dans Wikipédia et Crossref</button></div>'+
 '<div id="alicia-web-engines" class="alicia-web-actions"></div><div id="alicia-web-results"></div><p id="alicia-web-status" role="status"></p>'+
 '<h3>Comparer deux sources</h3><p>Les sources doivent être des pages publiques HTTPS. Certains sites interdisent la lecture automatique (CORS).</p>'+
 '<label>Page A <input type="url" id="alicia-web-url1" placeholder="https://exemple.fr/source1"></label>'+
 '<label>Page B <input type="url" id="alicia-web-url2" placeholder="https://autre-site.fr/source2"></label>'+
 '<button type="button" id="alicia-web-compare">Lire et comparer les pages accessibles</button>'+
 '<details><summary>Ou coller deux textes à comparer hors ligne</summary>'+
 '<label>Texte A<textarea id="alicia-web-text1" rows="4"></textarea></label>'+
 '<label>Texte B<textarea id="alicia-web-text2" rows="4"></textarea></label>'+
 '<button type="button" id="alicia-web-compare-paste">Comparer les deux textes</button></details>'+
 '<div id="alicia-web-comparison" role="status"></div>'+
 '<button type="button" id="alicia-web-memorize" disabled>Conserver les extraits dans CORTECT</button>'+
 '<h3>Atelier HTML, CSS et JavaScript</h3><p>Exécution limitée à un aperçu isolé : aucun accès à tes fichiers, au compte Alicia ou au réseau.</p>'+
 '<label>HTML<textarea id="alicia-web-html" rows="7" spellcheck="false"></textarea></label>'+
 '<label>CSS<textarea id="alicia-web-css" rows="5" spellcheck="false"></textarea></label>'+
 '<label>JavaScript<textarea id="alicia-web-js" rows="4" spellcheck="false"></textarea></label>'+
 '<div class="alicia-web-actions"><button type="button" id="alicia-web-preview">Tester mon site</button>'+
 '<button type="button" id="alicia-web-audit">Vérifier l’accessibilité et le code</button>'+
 '<button type="button" id="alicia-web-export">Exporter HTML</button></div>'+
 '<iframe id="alicia-web-frame" title="Aperçu du site isolé" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>'+
 '<div id="alicia-web-audit-result" role="status"></div>'+
 '<small>Les résultats des moteurs ne sont pas collectés sans autorisation. La comparaison de mots ne prouve ni la vérité des faits ni l’indépendance des sources.</small></div>';
 const target=$("alicia-professeur")||$("alicia-python-school")||$("cortect-panel")||$("data-lab")||$("chat-form");
 if(target)target.before(p);else document.querySelector(".shell")?.append(p);
 const say=(id,t)=>{$(id).textContent=t;},q=$("alicia-web-query"),eng=$("alicia-web-engines"),out=$("alicia-web-results"),cmp=$("alicia-web-comparison");
 function makeEngines(){
   eng.replaceChildren();
   try{for(const item of queryEngines(q.value))eng.append(link(item.url,item.name+" ↗"));say("alicia-web-status","Ouvre les résultats de chaque moteur. Comparer les moteurs ne garantit pas de comparer des sources indépendantes.");}
   catch(err){say("alicia-web-status",err.message);}
 }
 $("alicia-web-search").addEventListener("click",makeEngines);
 $("alicia-web-catalogs").addEventListener("click",async()=>{
  out.replaceChildren();say("alicia-web-status","Recherche des catalogues publics…");
  const button=$("alicia-web-catalogs");button.disabled=true;
  try{
   const data=await openSearchCatalog(q.value);
   for(const item of data.results){const row=e("article");row.className="alicia-web-result";row.append(link(item.url,item.title),e("p",item.engine+" — "+item.description));out.append(row);}
   if(!data.results.length)out.append(e("p","Aucun résultat accessible."));
   say("alicia-web-status",data.results.length+" résultat(s) non vérifiés. "+(data.failures.length?"Accès indisponibles : "+data.failures.join(" ; "):"Deux catalogues consultés."));
  }catch(err){say("alicia-web-status","Impossible de rechercher : "+err.message);}
  finally{button.disabled=false;}
 });
 let selected=[];
 function present(result,docs,errors=[]){
  cmp.replaceChildren();selected=docs; $("alicia-web-memorize").disabled=!docs.some(x=>x.text?.length>40);
  cmp.append(e("p",result.message||result.method));
  if(result.ok){
   for(const source of result.sources)cmp.append(e("p",source.title+" — "+source.words+" mots"+(source.url?" ("+source.url+")":"")));
   for(const pair of result.points){
    const d=e("details"),title=e("summary","Documents "+(pair.first+1)+" et "+(pair.second+1)+" : "+pair.similarity+" % de vocabulaire partagé");
    d.append(title,e("p","Termes communs : "+pair.common.join(", ")),
      e("p","Spécifiques à A : "+pair.onlyFirst.join(", ")),
      e("p","Spécifiques à B : "+pair.onlySecond.join(", ")));
    cmp.append(d);
   }
  }
  for(const error of errors)cmp.append(e("p","⚠️ "+error));
 }
 $("alicia-web-compare").addEventListener("click",async()=>{
  const button=$("alicia-web-compare");button.disabled=true;say("alicia-web-comparison","Lecture HTTPS en cours…");
  try{
   const res=await comparePublicPages([$("alicia-web-url1").value,$("alicia-web-url2").value]);
   present(res.comparison,res.sources,res.errors);
   if(res.errors.length)cmp.append(e("p","Un site peut refuser CORS. Dans ce cas, colle son texte dans la comparaison hors ligne."));
  }catch(err){say("alicia-web-comparison","Lecture impossible : "+err.message);}
  finally{button.disabled=false;}
 });
 $("alicia-web-compare-paste").addEventListener("click",()=>{
  const docs=[{title:"Texte A",text:$("alicia-web-text1").value},{title:"Texte B",text:$("alicia-web-text2").value}];
  present(compareTexts(docs),docs);
 });
 $("alicia-web-memorize").addEventListener("click",async()=>{
  const engine=window.AliciaOriginalEngine;
  if(!engine?.addCortectNote){cmp.append(e("p","Mémoire CORTECT non disponible."));return;}
  if(window.AliciaNativeMemory?.ready)await window.AliciaNativeMemory.ready;
  let count=0;
  for(const item of selected){
   if(item.text?.length<40)continue;
   if(engine.addCortectNote(item.url||item.title,item.text.slice(0,1800),["web","non-verifie"]).ok)count++;
  }
  const flushed=window.AliciaNativeMemory?.flush?await window.AliciaNativeMemory.flush():true;
  cmp.append(e("p",count+" extrait(s) enregistré(s) localement."+(flushed?"":" Sauvegarde native Mac non confirmée.")));
 });
 const H=$("alicia-web-html"),C=$("alicia-web-css"),J=$("alicia-web-js");
 H.value='<!DOCTYPE html>\n<html lang="fr">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mon site Alicia</title></head>\n<body><h1>Bonjour Alicia !</h1><p>Mon premier site fonctionne sur iPhone et Mac.</p><button id="bonjour">Tester</button></body></html>';
 C.value='body { font: 17px system-ui; background: #eef4ff; color: #172443; padding: 20px; } h1 { color: #5748c5; } button { padding: 12px; }';
 J.value='document.querySelector("#bonjour").addEventListener("click", () => { document.querySelector("p").textContent = "Bravo, mon JavaScript fonctionne !"; });';
 const code=()=>({html:H.value,css:C.value,js:J.value});
 $("alicia-web-preview").addEventListener("click",()=>{
  try{$("alicia-web-frame").srcdoc=previewDocument(code());say("alicia-web-audit-result","Aperçu mis à jour. Il fonctionne dans un cadre isolé, sans accès réseau.");}
  catch(err){say("alicia-web-audit-result","Erreur : "+err.message);}
 });
 $("alicia-web-audit").addEventListener("click",()=>{
  try{const check=auditWebPage(code());say("alicia-web-audit-result","Score indicatif : "+check.score+"/100. "+(check.issues.length?check.issues.map(x=>x.level+" : "+x.message).join("\n"):"Aucun avertissement détecté. Cela ne garantit pas l'absence de bugs."));}
  catch(err){say("alicia-web-audit-result",err.message);}
 });
 $("alicia-web-export").addEventListener("click",()=>{
  try{
   const html=previewDocument(code());
   const blob=new Blob([html],{type:"text/html;charset=utf-8"}),url=URL.createObjectURL(blob);
   const a=e("a");a.href=url;a.download="mon-site-alicia.html";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
   say("alicia-web-audit-result","Fichier HTML local prêt. Certains navigateurs iPhone demanderont de confirmer l'enregistrement.");
  }catch(err){say("alicia-web-audit-result",err.message);}
 });
 window.AliciaWebAtelier={open(){p.open=true;p.scrollIntoView({block:"start",behavior:"smooth"});},getEngines:queryEngines};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
