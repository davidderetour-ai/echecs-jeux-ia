/* Contrôles communs Alicia iPhone et Mac, sans réseau ni achats. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const engine=window.AliciaOriginalEngine;
if(!engine)return;
function init(){
  const anchor=$("connection-status");
  if(!anchor||$("original-engine-controls"))return;
  const panel=document.createElement("details");
  panel.id="original-engine-controls";panel.className="alicia-original-controls";
  const summary=document.createElement("summary");
  summary.textContent="🧠 Mon moteur Alicia original · progression et sauvegardes";
  panel.append(summary);
  const content=document.createElement("div");content.className="alicia-original-body";
  const stats=document.createElement("p");
  stats.id="alicia-original-stats";stats.setAttribute("role","status");
  const help=document.createElement("p");
  help.textContent="Apprentissage : écris « Apprends : question => réponse ». Pour corriger ma dernière réponse, écris « Correction : la bonne réponse ». Alicia mémorise et adapte seule ses réglages internes ; aucun changement de code, de fichiers du Mac ou de ton iPhone.";
  const toolbar=document.createElement("div");toolbar.className="alicia-original-buttons";
  const exportBtn=document.createElement("button");exportBtn.type="button";exportBtn.textContent="Exporter ma mémoire";
  const importBtn=document.createElement("button");importBtn.type="button";importBtn.textContent="Importer une mémoire";
  const refreshBtn=document.createElement("button");refreshBtn.type="button";refreshBtn.textContent="Actualiser les progrès";
  const resetBtn=document.createElement("button");resetBtn.type="button";resetBtn.textContent="Effacer mes apprentissages";resetBtn.className="secondary";
  const chooser=document.createElement("input");chooser.type="file";chooser.accept=".json,application/json";chooser.hidden=true;chooser.id="alicia-original-import-file";
  const info=document.createElement("p");info.id="alicia-original-info";info.setAttribute("role","status");
  toolbar.append(exportBtn,importBtn,refreshBtn,resetBtn);
  content.append(stats,help,toolbar,chooser,info);panel.append(content);
  anchor.insertAdjacentElement("afterend",panel);
  function update(){
    const status=engine.inspect();
    stats.textContent="Version "+status.version+" · "+status.examples+" savoirs enseignés · "+status.autonomousAdaptations+" adaptations autonomes · mémoire révision "+status.revision+" · zéro serveur IA externe.";
  }
  exportBtn.addEventListener("click",()=>{
    const text=engine.exportMemory();
    const blob=new Blob([text],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="alicia-memoire-originale.json";document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    info.textContent="Fichier JSON de connaissances préparé. Transfère-le manuellement entre l'iPhone et le Mac. Garde-le privé.";
    update();
  });
  importBtn.addEventListener("click",()=>chooser.click());
  chooser.addEventListener("change",()=>{
    const file=chooser.files&&chooser.files[0];if(!file)return;
    if(file.size>220000){info.textContent="Fichier trop volumineux (limite 220 Ko).";chooser.value="";return;}
    const reader=new FileReader();
    reader.onload=()=>{
      const result=engine.importMemory(String(reader.result||""));
      info.textContent=result.ok?result.imported+" nouveaux apprentissages importés, gratuitement.":result.reason;
      chooser.value="";update();
    };
    reader.onerror=()=>{info.textContent="Impossible de lire la mémoire.";chooser.value="";};
    reader.readAsText(file);
  });
  refreshBtn.addEventListener("click",update);
  resetBtn.addEventListener("click",()=>{
    if(confirm("Effacer seulement la mémoire acquise par le moteur Alicia original sur cet appareil ?")){
      engine.clearMemory();info.textContent="Mémoire du moteur original réinitialisée. Les autres fichiers restent intacts.";update();
    }
  });
  update();
  document.addEventListener("alicia-original-answered",update);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
