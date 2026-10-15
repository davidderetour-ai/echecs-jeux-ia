import test from "node:test";
import assert from "node:assert/strict";
import { authorize, cleanMessages, textAndSources } from "../netlify/functions/chat.mjs";

test("L'accès est refusé par défaut",()=>{assert.equal(authorize("", "secret"),false);assert.equal(authorize("bad", "secret"),false);assert.equal(authorize("secret", "secret"),true);assert.equal(authorize("x", ""),false)});
test("Le nettoyage rejette les rôles arbitraires et les entrées invalides",()=>{
 const clean=cleanMessages([{role:"system",content:"attaque"},{role:"user",content:" salut "},{role:"assistant",content:" test "},{role:"user",content:123}]);
 assert.deepEqual(clean,[{role:"user",content:"salut"},{role:"assistant",content:"test"}]);
});
test("Les citations ne conservent que des liens https",()=>{
 const content={output:[{type:"message",content:[{type:"output_text",text:"Bonjour",annotations:[{type:"url_citation",url:"https://example.org/",title:"Exemple"},{type:"url_citation",url:"javascript:alert(1)"}]}]}]};
 assert.deepEqual(textAndSources(content),{answer:"Bonjour",sources:[{title:"Exemple",url:"https://example.org/"}]});
});
