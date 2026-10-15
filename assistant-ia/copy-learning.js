import {validateVolunteerReport,validateLearningCatalog,validateSafetyNotices} from "./copy-learning-core.mjs";
const $=id=>document.getElementById(id);
const PREFIX="https://raw.githubusercontent.com/davidderetour-ai/echecs-jeux-ia/main/assistant-ia/";
const ISSUE="https://github.com/davidderetour-ai/echecs-jeux-ia/issues/new";
const CATEGORY={bug:"Anomalie",solution:"Solution testée",suggestion:"Suggestion",security:"Signalement de sécurité"};
function line(tag,txt){const n=document.createElement(tag);n.textContent=txt;return n;}
$("copy-preview")?.addEventListener("click",()=>{
 const box=$("copy-feedback-preview");box.replaceChildren();
 try{
  const item=validateVolunteerReport({
   category:$("copy-type").value,description:$("copy-feedback").value,consent:$("copy-consent").checked
  });
  box.append(line("p","Aperçu de ton retour volontaire. Aucun envoi n'est effectué sans ton action sur GitHub :"));
  box.append(line("pre",item.description));
  box.append(line("p","GitHub est public pour ce dépôt : relis et retire toute information personnelle avant publication."));
  const a=line("a","Ouvrir le formulaire GitHub avec mon retour ↗");
  const title="[Alicia copie] "+CATEGORY[item.category];
  const body="Type : "+CATEGORY[item.category]+"\n\nRetour volontaire envoyé par son auteur :\n\n"+item.description+
   "\n\nCe signalement ne donne aucun accès à l'appareil de l'utilisateur. Il doit être évalué et testé avant toute intégration.";
  a.href=ISSUE+"?"+new URLSearchParams({title,body}).toString();
  a.target="_blank";a.rel="noopener noreferrer";box.append(a);
 }catch(e){box.append(line("p",e.message));}
});
async function fetchCatalog(filename){
 const res=await fetch(PREFIX+filename,{cache:"no-store"});
 if(!res.ok)throw Error("GitHub a renvoyé une erreur "+res.status+".");
 const raw=await res.text();
 if(raw.length>50000)throw Error("Document trop volumineux.");
 return JSON.parse(raw);
}
$("copy-receive")?.addEventListener("click",async()=>{
 const box=$("copy-learning-results"),msg=$("copy-learning-status");
 box.replaceChildren();msg.textContent="Consultation des solutions examinées…";
 try{
  const entries=validateLearningCatalog(await fetchCatalog("copy-learning-catalog.json"));
  msg.textContent=entries.length+" fiche(s) publiées après revue par le responsable du dépôt.";
  if(!entries.length)box.append(line("p","Aucune solution validée n'a encore été publiée."));
  for(const e of entries){
   const section=document.createElement("section");section.className="mac-note";
   section.append(line("strong",e.title),line("p",e.lesson));
   const btn=line("button","Ajouter ce conseil à ma question");btn.type="button";
   btn.addEventListener("click",()=>{
    const q=$("question");if(q){q.value+=(q.value?"\n\n":"")+"Conseil publié ("+e.id+") : "+e.lesson;q.focus();}
   });
   const a=line("a","Lire la vérification sur GitHub");a.href=e.source;a.target="_blank";a.rel="noopener noreferrer";
   section.append(btn,a);box.append(section);
  }
 }catch(e){msg.textContent="Impossible de confirmer les fiches actuelles : "+e.message;}
});
$("copy-safety-check")?.addEventListener("click",async()=>{
 const msg=$("copy-safety-status"),box=$("copy-safety-results");
 box.replaceChildren();msg.textContent="Recherche des alertes officielles…";
 try{
  const data=validateSafetyNotices(await fetchCatalog("copy-safety.json"));
  const localVersion="0.1.0";
  const blocked=data.versions.includes(localVersion);
  msg.textContent=blocked?"ALERTE : cette version est déconseillée. Arrête son utilisation et consulte les recommandations.":
   "Aucun blocage publié pour cette version. Cela ne garantit pas l'absence de problème.";
  for(const n of data.notices){
   const div=document.createElement("section");div.className="mac-note";
   div.append(line("strong",n.title),line("p",n.description));
   const a=line("a","Voir la source officielle");a.href=n.source;a.target="_blank";a.rel="noopener noreferrer";div.append(a);
   box.append(div);
  }
 }catch(e){msg.textContent="Vérification des alertes indisponible : "+e.message;}
});
