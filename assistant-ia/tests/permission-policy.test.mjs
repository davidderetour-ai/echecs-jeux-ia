import test from "node:test";
import assert from "node:assert/strict";
import {evaluateDeviceAction} from "../permission-policy.mjs";
const local={target:"personal_mac",ownerIdentified:true,verifiedDevice:true};
const other={target:"other_device",ownerIdentified:true,verifiedDevice:true};
const tests=[{name:"Sauvegarde du réglage testée",passed:true},{name:"Compatibilité vérifiée",passed:true}];

test("Bloque tout appareil non identifié",()=>{
 assert.equal(evaluateDeviceAction().allowed,false);
 assert.equal(evaluateDeviceAction({target:"unknown",explicitApproval:true,ownerIdentified:true,verifiedDevice:true}).allowed,false);
});
test("Diagnostic autorisé sur le Mac personnel vérifié",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"read"}).allowed,true);
});
test("Modification du Mac : consentement spécifique nécessaire",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"modify"}).allowed,false);
 assert.equal(evaluateDeviceAction({...local,action:"modify",explicitApproval:true,preflightTests:tests}).allowed,true);
});
test("Autres appareils interdits sans permission explicite",()=>{
 assert.equal(evaluateDeviceAction({...other,action:"modify"}).allowed,false);
 assert.equal(evaluateDeviceAction({...other,action:"modify",explicitApproval:true,preflightTests:tests}).allowed,true);
});
test("Sauvegarde requise avant suppression ou modification administrative sensible",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"delete",explicitApproval:true,preflightTests:tests}).allowed,false);
 assert.equal(evaluateDeviceAction({...local,action:"delete",explicitApproval:true,preflightTests:tests,backupPrepared:true,rollbackPrepared:true}).allowed,true);
});
test("La permission ne contourne jamais la vérification du propriétaire et de l'appareil",()=>{
 assert.equal(evaluateDeviceAction({target:"other_device",action:"modify",explicitApproval:true,preflightTests:tests,verifiedDevice:false,ownerIdentified:true}).allowed,false);
 assert.equal(evaluateDeviceAction({target:"personal_mac",action:"modify",explicitApproval:true,preflightTests:tests,verifiedDevice:true,ownerIdentified:false}).allowed,false);
});

test("Un test préalable manquant, inconnu ou échoué bloque la modification",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"modify",explicitApproval:true}).code,"tests_required");
 assert.equal(evaluateDeviceAction({...local,action:"modify",explicitApproval:true,preflightTests:[{name:"Test réel",passed:false}]}).allowed,false);
 assert.equal(evaluateDeviceAction({...local,action:"repair",explicitApproval:true,preflightTests:tests,backupPrepared:true,rollbackPrepared:true}).allowed,true);
});
