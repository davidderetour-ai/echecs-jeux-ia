/* Alicia Original : boîte à outils locale sans exec, LangChain, API payante ou envoi externe.
 * Orchestrateur déterministe : ne prétend pas utiliser un grand modèle de langage.
 */
import {indexDocuments,answerFromContext} from "./cortect-rag-core.mjs";
const numberText=n=>n.toLocaleString("fr-FR",{maximumFractionDigits:10});
export function fibonacci(index){
 if(!Number.isInteger(index)||index<0||index>70)throw new Error("Indice Fibonacci autorisé : 0 à 70.");
 let a=0,b=1;
 for(let i=0;i<index;i++){const c=a+b;a=b;b=c;}
 return a;
}
function safeArithmetic(expression){
 const tokens=String(expression).replace(/,/g,".").replace(/×/g,"*").replace(/÷/g,"/").match(/\d+(?:\.\d+)?|[()+\-*\/]/g);
 if(!tokens||tokens.length>50||tokens.join("")!==expression.replace(/,/g,".").replace(/×/g,"*").replace(/÷/g,"/").replace(/\s/g,""))throw new Error("Calcul limité aux nombres, parenthèses et +, −, ×, ÷.");
 let p=0;
 function atom(){
  const value=tokens[p++];
  if(value==="("){const result=sum();if(tokens[p++]!==")")throw Error("Parenthèses invalides");return result;}
  if(value==="-")return -atom();
  if(value==="+")return atom();
  if(!/^\d+(?:\.\d+)?$/.test(value||""))throw Error("Nombre invalide");
  return Number(value);
 }
 function product(){
  let n=atom();
  while(tokens[p]==="*"||tokens[p]==="/"){
    const op=tokens[p++],rhs=atom();
    if(op==="/"&&rhs===0)throw Error("Division par zéro");
    n=op==="*"?n*rhs:n/rhs;
  }
  return n;
 }
 function sum(){
  let n=product();
  while(tokens[p]==="+"||tokens[p]==="-"){
   const op=tokens[p++],rhs=product();n=op==="+"?n+rhs:n-rhs;
  }
  return n;
 }
 const n=sum();
 if(p!==tokens.length||!Number.isFinite(n)||Math.abs(n)>1e15)throw Error("Résultat non représentable");
 return n;
}
export function calculateSafe(query){
 const input=String(query||"").trim();
 const fib=input.match(/(?:fibonacci|suite de fibonacci).*?(\d{1,3})(?:er|e|ème)?\s*(?:terme)?/i)||input.match(/(\d{1,3})(?:e|ème)\s+terme\s+(?:de\s+la\s+suite\s+de\s+)?fibonacci/i);
 if(fib){
   const n=Number(fib[1]);const value=fibonacci(n);
   return {answer:"Le terme F("+n+") de la suite de Fibonacci vaut "+numberText(value)+". Convention : F(0)=0 et F(1)=1.",
    tool:"calculateur",result:value,verified:true};
 }
 const expression=input.replace(/^(?:combien font|combien fait|calcule|calculer|résultat de|resultat de|calcul)\s*[: ]*\s*/i,"").replace(/[?! ]+$/,"").trim();
 const n=safeArithmetic(expression);
 return {answer:"Résultat : "+numberText(n)+".",tool:"calculateur",result:n,verified:true};
}
export function searchKnowledge(query,notes){
 const index=indexDocuments(Array.isArray(notes)?notes:[]);
 const result=answerFromContext(String(query||""),index,2);
 return {...result,tool:"recherche-notes",verified:false};
}
export function draftNotification(message,channel){
 const msg=String(message||"").trim().slice(0,1500);
 const target=String(channel||"general").replace(/^#/,"").trim().toLowerCase();
 if(!msg||!target||!/^[a-z0-9_-]{1,70}$/.test(target))
  throw Error("Message ou nom de canal invalide");
 return {tool:"notification-brouillon",channel:target,message:msg,sent:false,verified:false,
  answer:"Brouillon Slack pour #"+target+" :\n"+msg+"\n\n⚠️ Non envoyé : aucune connexion Slack n'est configurée. Tu peux copier ce texte."};
}
export function chooseTool(query){
 const q=String(query||"").trim();
 if(/(?:slack|canal\s+#?|alerte\s+(?:l.équipe|l equipe)|notification\s+à|notification\s+a)/i.test(q))return "notification-brouillon";
 if(/fibonacci|\d+\s*[+*\/×÷-]\s*\d+|^(?:combien font|calcule|calculer)\b/i.test(q))return "calculateur";
 if(/(?:mes notes|mes documents|dans la base|base de donn[eé]es|recherche dans|projet alpha|statut du projet|proc[eé]dure)/i.test(q))return "recherche-notes";
 return null;
}
export function orchestrate(query,{notes=[]}={}){
 const tool=chooseTool(query);
 if(tool==="calculateur"){
  try{return {handled:true,...calculateSafe(query)};}
  catch(err){return {handled:true,tool,answer:"Calcul non effectué : "+err.message,verified:false};}
 }
 if(tool==="recherche-notes"){
  const result=searchKnowledge(query,notes);
  return {handled:true,...result};
 }
 if(tool==="notification-brouillon"){
  const channel=query.match(/(?:canal|#)\s*#?([a-z0-9_-]+)/i)?.[1]||"general";
  const message=query.replace(/^(?:alerte|envoyer|envoie|notifie|notification)\s*/i,"").slice(0,1500);
  try{return {handled:true,...draftNotification(message,channel)};}
  catch(err){return {handled:true,tool,answer:err.message,verified:false};}
 }
 return {handled:false,tool:null};
}
