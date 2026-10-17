/* Alicia : interface d'entraînement local, sans activation de service payant.
 * Le score provient de phrases tenues à l'écart de l'apprentissage.
 */
import {AliciaTraining} from "./training-core.mjs";

const $=id=>document.getElementById(id);
const labels={
 study:"Étudier les cours",list:"Lister les cours",status:"Bilan des cours",
 test:"Tester les cours",help:"Comprendre mes demandes",
 "mode-code":"Passer en mode Code","mode-repair":"Passer en mode Réparation",
 "mode-create":"Passer en mode Création","mode-teach":"Passer en mode Professeur"
};
function init(){
 if($("alicia-training-panel"))return;
 const anchor=$("alicia-professeur-actions")||document.querySelector(".alicia-professeur-actions");
 const target=$("alicia-professeur")||$("chat-form");
 if(!target)return;
 const section=document.createElement("section");section.id="alicia-training-panel";
 section.setAttribute("aria-label","Entraînement supervisé local des demandes d'Alicia");
 section.style.cssText="margin:14px 0;padding:14px;border:1px solid #6683d1;border-radius:12px;background:#13234b;color:#e6efff";
 const heading=document.createElement("h3");heading.textContent="Apprentissage du langage d’Alicia";
 const explanation=document.createElement("p");explanation.textContent="Alicia peut entraîner un petit modèle statistique pour mieux reconnaître tes demandes, puis tester les résultats sur des phrases inédites. Gratuit et hors ligne. Ce n'est pas GPT-6.";
 const controls=document.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:9px";
 const train=document.createElement("button");train.type="button";train.textContent="Entraîner la compréhension";
 const audit=document.createElement("button");audit.type="button";audit.textContent="Voir le bilan";
 controls.append(train,audit);
 const result=document.createElement("p");result.id="alicia-training-result";result.setAttribute("role","status");
 const label=document.createElement("label");label.textContent="Enseigner une nouvelle formulation";
 label.style.cssText="display:block;margin-top:14px";
 const phrase=document.createElement("input");phrase.id="alicia-training-phrase";phrase.placeholder="Ex. révise tes fiches";
 phrase.maxLength=190;phrase.style.cssText="display:block;width:100%;max-width:100%;min-height:42px;margin:6px 0 8px;padding:8px";
 label.append(phrase);
 const chosen=document.createElement("select");chosen.id="alicia-training-intent";chosen.style.cssText="min-height:42px;width:100%;margin-bottom:8px;padding:8px";
 for(const [key,text] of Object.entries(labels)){
   const o=document.createElement("option");o.value=key;o.textContent=text;chosen.append(o);
 }
 const correction=document.createElement("button");correction.type="button";correction.textContent="Apprendre cette formulation";
 const warning=document.createElement("p");warning.style.cssText="font-size:12px;opacity:.8";
 warning.textContent="Seules les formulations choisies sont mémorisées sur cet appareil. Les demandes de suppression ou d'installation ne deviennent pas des autorisations.";
 section.append(heading,explanation,controls,result,label,chosen,correction,warning);
 const report=p=>{
   result.textContent=(p.enabled?"Entraîné : ":"Modèle prêt à être entraîné : ")+p.trainedExamples+
    " exemples ; "+p.correct+"/"+p.heldOut+" phrases de test reconnues ("+p.accuracy+
    " %) ; "+p.courseTestsPassed+"/"+p.courseTestsTotal+" contrôles de cours. "+
    p.personalExamples+" corrections personnelles. Ce score ne mesure pas la qualité générale d'une IA.";
 };
 train.addEventListener("click",()=>{
  const x=AliciaTraining.train();report(AliciaTraining.progress());
  if(!x.persisted)result.textContent+=" ⚠️ Sauvegarde non confirmée.";
 });
 audit.addEventListener("click",()=>report(AliciaTraining.progress()));
 correction.addEventListener("click",()=>{
  const text=phrase.value.trim();
  if(!text){result.textContent="Écris d'abord une formulation que tu souhaites enseigner.";return;}
  const x=AliciaTraining.learn(text,chosen.value);
  if(!x.ok){result.textContent=x.reason;return;}
  phrase.value="";
  report(AliciaTraining.progress());
  result.textContent+=" "+(x.persisted?"Formulation enregistrée.":"Formulation apprise, sauvegarde non confirmée.");
 });
 if(anchor)anchor.after(section);else target.append(section);
 report(AliciaTraining.progress());
 window.AliciaTrainingUI={open(){const details=$("alicia-professeur");if(details)details.open=true;section.scrollIntoView({behavior:"smooth",block:"start"});},refresh:()=>report(AliciaTraining.progress())};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
