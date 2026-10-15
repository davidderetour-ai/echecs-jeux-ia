import test from "node:test";
import assert from "node:assert/strict";
import {evaluateDeviceAction} from "../permission-policy.mjs";
const local={target:"personal_mac",ownerIdentified:true,verifiedDevice:true};
const other={target:"other_device",ownerIdentified:true,verifiedDevice:true};

test("Bloque tout appareil non identifié",()=>{
 assert.equal(evaluateDeviceAction().allowed,false);
 assert.equal(evaluateDeviceAction({target:"unknown",explicitApproval:true,ownerIdentified:true,verifiedDevice:true}).allowed,false);
});
test("Diagnostic autorisé sur le Mac personnel vérifié",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"read"}).allowed,true);
});
test("Modification du Mac : consentement spécifique nécessaire",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"modify"}).allowed,false);
 assert.equal(evaluateDeviceAction({...local,action:"modify",explicitApproval:true}).allowed,true);
});
test("Autres appareils interdits sans permission explicite",()=>{
 assert.equal(evaluateDeviceAction({...other,action:"modify"}).allowed,false);
 assert.equal(evaluateDeviceAction({...other,action:"modify",explicitApproval:true}).allowed,true);
});
test("Sauvegarde requise avant suppression ou modification administrative sensible",()=>{
 assert.equal(evaluateDeviceAction({...local,action:"delete",explicitApproval:true}).allowed,false);
 assert.equal(evaluateDeviceAction({...local,action:"delete",explicitApproval:true,backupPrepared:true,rollbackPrepared:true}).allowed,true);
});
test("La permission ne contourne jamais la vérification du propriétaire et de l'appareil",()=>{
 assert.equal(evaluateDeviceAction({target:"other_device",action:"modify",explicitApproval:true,verifiedDevice:false,ownerIdentified:true}).allowed,false);
 assert.equal(evaluateDeviceAction({target:"personal_mac",action:"modify",explicitApproval:true,verifiedDevice:true,ownerIdentified:false}).allowed,false);
});
