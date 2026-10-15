import {parseMacReport,macRecommendations} from "./mac-core.mjs";
const area=document.getElementById("mac-report"),results=document.getElementById("mac-results");
const button=document.getElementById("mac-analyze");
function output(tag,text,cls){
 const el=document.createElement(tag);el.textContent=text;
 if(cls)el.className=cls;
 return el;
}
button?.addEventListener("click",()=>{
 results.replaceChildren();
 try{
  const report=parseMacReport(area.value);
  results.append(output("p","Rapport : macOS "+report.OS_VERSION+" · "+(report.MAC_MODEL||"Modèle inconnu")+" · "+(report.RAM_GIB||"?")+" Gio RAM · "+(report.DISK_FREE_GIB||"?")+" Gio libres."));
  for(const x of macRecommendations(report)){
   const item=output("section","","mac-note "+x.level);
   item.append(output("strong",x.title),output("p",x.description));
   results.append(item);
  }
 }catch(err){results.append(output("p","⚠️ "+err.message,"data-warning"));}
});
