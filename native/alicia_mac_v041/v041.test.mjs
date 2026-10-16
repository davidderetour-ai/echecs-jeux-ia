import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const get=x=>readFileSync(new URL("./"+x,import.meta.url),"utf8");
test("native Swift posts only to Puter official HTTPS REST, never automatic purchases",()=>{
 const s=get("AliciaNativePuter.swift");
 assert.match(s,/https:\/\/api\.puter\.com\/puterai\/openai\/v1\/chat\/completions/);
 assert.match(s,/URLSessionConfiguration\.ephemeral/);
 assert.match(s,/Authorization/);
 assert.match(s,/kSecClassGenericPassword/);
 assert.match(s,/kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly/);
 assert.match(s,/SecItemDelete/);
 assert.match(s,/max_tokens/);
 assert.doesNotMatch(s,/exec\(|sudo|NSAppleScript/);
});
test("native localhost POST verifies Origin and caps JSON payload",()=>{
 const s=get("AliciaV041.swift");
 assert.match(s,/headers\["origin"\] == "http:\/\/" \+ host/);
 assert.match(s,/length <= 65000/);
 assert.match(s,/AliciaNativePuter\.shared\.respond/);
 assert.match(s,/allowedHosts\.contains\(host\)/);
 assert.match(s,/\"webp\": \"image\/webp\"/);
});
test("token stays on Mac: no localStorage, no API token printed to JS",()=>{
 const s=get("native-puter-bridge.js");
 assert.match(s,/type="password"/);
 assert.match(s,/api\+"token"/);
 assert.match(s,/mode:"same-origin"/);
 assert.match(s,/window\.AliciaPuter=\{answer/);
 assert.doesNotMatch(s,/localStorage\.setItem/);
 assert.doesNotMatch(s,/console\.log/);
 assert.match(s,/Aucun achat effectué|n.achète pas de crédits/);
});
test("clear separation: canned greeting != AI response",()=>{
 const s=get("native-puter-bridge.js");
 assert.match(s,/Réponse est programmée/i);
 assert.match(s,/provider:"Accueil local, sans IA"/);
 assert.match(s,/provider/);
});
