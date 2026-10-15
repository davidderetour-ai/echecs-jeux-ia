"use strict";
const $=id=>document.getElementById(id);
const state={code:""};
function say(message){$("state").textContent=message;}
function viewMessage(msg){
 const div=document.createElement("article");
 div.className="message";
 const author=document.createElement("strong");
 author.textContent=(msg.from==="iphone"?"iPhone":"Mac")+" · "+(msg.at||"");
 const body=document.createElement("p");body.textContent=msg.text||"";
 div.append(author,body);return div;
}
async function api(method,text){
 const headers={"X-Alicia-Code":state.code};
 if(method==="POST")headers["Content-Type"]="application/json";
 const response=await fetch("./api/bridge/messages",{method,headers,cache:"no-store",
  body:method==="POST"?JSON.stringify({text,from:$("source").value}):undefined});
 const result=await response.json().catch(()=>({error:"Réponse illisible"}));
 if(!response.ok)throw Error(result.error||"Erreur "+response.status);
 return result;
}
async function refresh(){
 if(!state.code){say("Saisis le code affiché dans le Terminal du Mac.");return;}
 try{
 const data=await api("GET");
 const container=$("history");container.replaceChildren();
 for(const item of data.messages||[])container.append(viewMessage(item));
 say("Liaison active : messages reçus ("+(data.messages?.length||0)+").");
 }catch(err){say(err.message)}
}
$("pair").addEventListener("submit",event=>{
 event.preventDefault();
 const code=$("code").value.trim();
 if(!/^[0-9a-f]{32}$/.test(code)){say("Copie les 32 caractères du code affiché dans le Terminal.");return;}
 state.code=code; // Uniquement en mémoire : pas de localStorage ni transmission à GitHub.
 $("code").value="";
 refresh();
});
$("send").addEventListener("submit",async event=>{
 event.preventDefault();
 const txt=$("text").value.trim();
 if(!txt||!state.code)return;
 if(new TextEncoder().encode(txt).length>1500){say("Message trop long : maximum 1 500 octets.");return;}
 try{await api("POST",txt);$("text").value="";await refresh();}
 catch(err){say(err.message)}
});
$("refresh").addEventListener("click",refresh);
$("forget").addEventListener("click",()=>{
 state.code="";$("history").replaceChildren();say("Code oublié par cette page.");
});
