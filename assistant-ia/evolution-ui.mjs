/* Alicia : tableau de bord de l'évolution interne, avec export/import volontaire. */
import {AliciaEvolution} from "./evolution-core.mjs";

function init(){
 const $=id=>document.getElementById(id);
 if($("alicia-evolution-panel"))return;
 const parent=$("alicia-professeur")||$("chat-form");
 if(!parent)return;
 const wrap=document.createElement("section");
 wrap.id="alicia-evolution-panel";
 wrap.style.cssText="padding:13px;margin:14px 0;border:1px solid #7791c7;border-radius:12px;background:#0e1d42;color:#eef3ff";
 const heading=document.createElement("h3");heading.textContent="Évolution coordonnée d'Alicia";
 const guide=document.createElement("p");
 guide.textContent="Mes modules partagent leurs bilans de tests. Je peux adapter mes paramètres de compréhension sur cet appareil, même sans Internet, mais je ne modifie ni mon code, ni ta voix, ni le système sans ton accord.";
 const output=document.createElement("p");output.id="alicia-evolution-status";output.setAttribute("role","status");
 const controls=document.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0";
 const check=document.createElement("button");check.type="button";check.textContent="Vérifier et améliorer mes modules";
 const exportBtn=document.createElement("button");exportBtn.type="button";exportBtn.textContent="Exporter mes apprentissages";
 const importBtn=document.createElement("button");importBtn.type="button";importBtn.textContent="Importer mes apprentissages";
 const file=document.createElement("input");file.type="file";file.accept="application/json,.json";file.hidden=true;
 const note=document.createElement("small");
 note.textContent="Le partage iPhone ↔ Mac est manuel. Seuls les exemples de compréhension et les expressions choisies sont exportés : pas tes conversations, ni le réglage de la voix.";
 controls.append(check,exportBtn,importBtn,file);
 wrap.append(heading,guide,output,controls,note);
 parent.append(wrap);
 function update(report=AliciaEvolution.status()){
  const p=report.modules.demandes,c=report.modules.cours;
  output.textContent="Compréhension : "+p.correct+"/"+p.tested+" phrases de test reconnues ("+p.accuracy+" %). Cours : "+c.verified+"/"+c.totalChecks+
   " contrôles validés sur "+c.available+" cours. Corrections : "+p.personalCorrections+". Voix conservée. Évolution limitée aux données vérifiées.";
 }
 check.addEventListener("click",()=>{
  const r=AliciaEvolution.evolve("vérification manuelle");
  update(r.ok?r:AliciaEvolution.status());
  if(!r.ok)output.textContent+=" Attention : "+(r.reason||"les tests n'ont pas permis de valider une amélioration")+".";
 });
 exportBtn.addEventListener("click",()=>{
  const raw=JSON.stringify(AliciaEvolution.exportBackup(),null,2);
  const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="alicia-apprentissage-partage.json";
  document.body.append(link);link.click();link.remove();
  // Pas de minuterie : libération de l'URL lorsqu'Alicia ferme la page.
  window.addEventListener("pagehide",()=>URL.revokeObjectURL(url),{once:true});
  output.textContent="Sauvegarde créée. Tu peux la copier vers ton autre appareil et l'importer volontairement.";
 });
 importBtn.addEventListener("click",()=>file.click());
 file.addEventListener("change",async()=>{
  const picked=file.files?.[0];
  if(!picked)return;
  if(picked.size>100000){output.textContent="Fichier trop volumineux.";file.value="";return;}
  if(!window.confirm("Importer les expressions et exemples du fichier sélectionné ? Les données locales existantes seront conservées ; seules les corrections vérifiées seront ajoutées.")){file.value="";return;}
  try{
   const result=AliciaEvolution.importBackup(await picked.text());
   if(!result.ok){output.textContent="Import impossible : "+result.reason;return;}
   update(AliciaEvolution.status());
   output.textContent+=" Import : "+result.accepted+" exemple(s), "+result.aliasesAccepted+" expression(s) ; "+result.rejected+" refus.";
  }catch(err){output.textContent="Erreur de lecture : "+String(err?.message||err);}
  finally{file.value="";}
 });
 if(typeof window!=="undefined")window.addEventListener("alicia:evolution-checked",e=>update(e.detail));
 update();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
