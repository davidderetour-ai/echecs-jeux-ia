/**
 * Mesures factuelles. Un taux d'essais reussis n'est PAS une probabilite
 * de succes futur. Aucun chiffre simule n'est comptabilise.
 */
export function summarizeChecks(checks){
 if(!Array.isArray(checks))throw new Error("Liste de tests incorrecte.");
 const valid=checks.filter(c=>c&&typeof c.name==="string"&&typeof c.passed==="boolean");
 const passed=valid.filter(c=>c.passed).length;
 const tested=valid.length,failed=tested-passed;
 return {passed,failed,unknown:checks.length-tested,tested,
  percent:tested?Number((100*passed/tested).toFixed(1)):null,
  allPassed:tested>0&&failed===0&&checks.length===tested};
}
export function summarizeOutcomes(actions){
 if(!Array.isArray(actions))throw new Error("Historique incorrect.");
 const outcomes=actions.filter(x=>x&&x.verified===true&&["success","failure"].includes(x.result));
 const successes=outcomes.filter(x=>x.result==="success").length,attempts=outcomes.length;
 return {successes,failures:attempts-successes,attempts,unknown:actions.length-attempts,
  percent:attempts?Number((100*successes/attempts).toFixed(1)):null,
  reliability:attempts<10?"échantillon insuffisant pour prédire une réussite":"historique descriptif uniquement"};
}
export function parseMacHistory(input){
 if(typeof input!=="string"||input.length>12000)throw new Error("Historique trop long.");
 const result=[];
 for(const line of input.trim().split(/\r?\n/)){
  if(!line.trim())continue;
  const [kind,status]=line.split("\t");
  if(!["apply","undo"].includes(kind)||!["success","failure"].includes(status))continue;
  result.push({action:kind,result:status,verified:true});
 }
 return result;
}
