/* Alicia Mac V0.4.5 — mémoire persistante sur disque. Aucun service externe. */
(function(){
 "use strict";
 const engine=window.AliciaOriginalEngine;
 if(!engine||!window.AliciaNativeMac)return;
 const endpoint="/api/native-memory/v1";
 let pending=Promise.resolve(true),lastOk=true,problem="";
 function state(message,isError){
   const label=document.getElementById("alicia-native-memory-status");
   if(label){label.textContent=message;label.style.color=isError?"#ffccaa":"#abf6d5";}
 }
 const bridge={
   ready:null,
   save(snapshot){
     if(typeof snapshot!=="string"||snapshot.length>300000){lastOk=false;problem="Sauvegarde trop volumineuse";return;}
     pending=pending.catch(()=>false).then(async()=>{
       try{
         const response=await fetch(endpoint,{
           method:"POST",mode:"same-origin",credentials:"omit",cache:"no-store",
           headers:{"Content-Type":"application/json"},body:snapshot});
         if(!response.ok)throw new Error("Erreur "+response.status);
         const data=await response.json();
         if(data.saved!==true)throw new Error("Accusé de sauvegarde manquant");
         lastOk=true;problem="";
         state("✓ Mémoire enregistrée sur le disque du Mac",false);
         return true;
       }catch(e){
         lastOk=false;problem=String(e?.message||e);
         state("⚠️ Mémoire non confirmée sur le disque : "+problem,true);
         return false;
       }
     });
   },
   async flush(){await pending;return lastOk;},
   getError(){return problem;}
 };
 window.AliciaNativeMemory=bridge;
 bridge.ready=(async()=>{
   try{
     const response=await fetch(endpoint,{method:"GET",cache:"no-store",credentials:"omit"});
     if(response.status===404){
       if(engine.inspect().examples>0){bridge.save(engine.nativeSnapshot());return bridge.flush();}
       state("Mémoire native prête. Nouveaux apprentissages sauvegardés sur le Mac.",false);
       return true;
     }
     if(!response.ok)throw new Error("Lecture native impossible ("+response.status+")");
     const json=await response.text();
     const result=engine.restoreSnapshot(json);
     if(!result.ok)throw new Error("Données de mémoire non compatibles");
     await bridge.flush();
     state("✓ "+result.examples+" apprentissage(s) retrouvés dans la mémoire du Mac",false);
     return true;
   }catch(e){
     lastOk=false;problem=String(e?.message||e);
     state("⚠️ Restauration impossible : "+problem,true);
     return false;
   }
 })();
 function init(){
   if(document.getElementById("alicia-native-memory-status"))return;
   const section=document.getElementById("original-engine-controls");
   const label=document.createElement("p");
   label.id="alicia-native-memory-status";label.setAttribute("role","status");
   label.textContent="Vérification de la sauvegarde native…";
   section?.querySelector(".alicia-original-body")?.prepend(label);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
