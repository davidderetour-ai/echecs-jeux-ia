import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const start=source.indexOf("function formatMessageText(");
const end=source.indexOf("function messageEl(",start);
if(start<0||end<0)throw Error("Formatteur absent du code.");
const fnText=source.slice(start,end);
function node(tag="fragment"){
 return {
  tag,children:[],textContent:"",
  replaceChildren(){this.children=[];this.textContent="";},
  append(element){this.children.push(element);}
 };
}
const document={
 createTextNode(text){const n=node("#text");n.textContent=text;return n;},
 createElement(tag){return node(tag);}
};
const format=runInNewContext(fnText+";formatMessageText",{document});
function displayed(n){return n.children.map(x=>x.textContent).join("");}

test("Convertit le gras sans garder les étoiles brutes",()=>{
 const target=node();format(target,"Bonjour, **Alicia** répond.");
 assert.equal(displayed(target),"Bonjour, Alicia répond.");
 assert.equal(target.children[1].tag,"strong");
});
test("Accepte des morceaux italiques et les retours à la ligne",()=>{
 const target=node();format(target,"Bonjour\n*Ceci est important* !");
 assert.equal(displayed(target),"Bonjour\nCeci est important !");
 assert.ok(target.children.some(x=>x.tag==="em"));
});
test("N'interprète jamais du HTML fourni par un modèle",()=>{
 const target=node();format(target,"**<script>alert(1)</script>**");
 assert.equal(target.children[0].tag,"strong");
 assert.equal(target.children[0].textContent,"<script>alert(1)</script>");
 assert.ok(!target.children.some(x=>x.tag==="script"));
});
test("Garde le texte ordinaire et vide lisible",()=>{
 const target=node();format(target,"Pas de balise.");
 assert.equal(displayed(target),"Pas de balise.");
 format(target,"");
 assert.equal(displayed(target),"");
});
test("Le même affichage est utilisé lors d'une réponse corrigée",()=>{
 assert.match(source,/formatMessageText\(last\.querySelector\("\.message-text"\),data\.answer\)/);
});
