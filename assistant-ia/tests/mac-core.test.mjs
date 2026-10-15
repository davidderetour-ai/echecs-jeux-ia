import test from "node:test";
import assert from "node:assert/strict";
import {parseMacReport,macRecommendations} from "../mac-core.mjs";
const sample="ALICIA_MAC_AUDIT_V1\nOS_VERSION=11.7.11\nMAC_MODEL=MacBookPro12,1\nRAM_GIB=8\nARCH=x86_64\nDISK_FREE_GIB=9\nEND_ALICIA_MAC_AUDIT_V1\n";
test("Lit le rapport sur Big Sur sans collecte de secrets",()=>{
 const d=parseMacReport(sample);
 assert.equal(d.OS_VERSION,"11.7.11");
 assert.equal(d.RAM_GIB,"8");
 assert.equal(d.MAC_MODEL,"MacBookPro12,1");
});
test("Recommande des mesures sans modifier le Mac",()=>{
 const list=macRecommendations(sample);
 assert.ok(list.some(x=>x.title.includes("Ollama")));
 assert.ok(list.some(x=>x.title.includes("Stockage")));
 assert.ok(list.every(x=>x.description&&!x.command));
});
test("Refuse un rapport partiel ou suspect",()=>{
 assert.throws(()=>parseMacReport("OS_VERSION=11.7.11"));
 assert.throws(()=>parseMacReport("ALICIA_MAC_AUDIT_V1\nOS_VERSION=xx\nEND_ALICIA_MAC_AUDIT_V1"));
});
