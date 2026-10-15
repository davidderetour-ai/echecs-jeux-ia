/**
 * Alicia : politique de contrôle des appareils.
 * Cette fonction vérifie un projet d'action ; elle n'autorise jamais un accès système.
 * Les approbations ne sont pas conservées ni transférées entre appareils/opérations.
 */
export const CATEGORIES=Object.freeze(["read","modify","install","delete","admin","deploy","repair"]);
export function evaluateDeviceAction({
 target="unknown",
 action="read",
 ownerIdentified=false,
 explicitApproval=false,
 verifiedDevice=false,
 rollbackPrepared=false,
 backupPrepared=false,
 preflightTests=[]
}={}){
 if(!CATEGORIES.includes(action))return {allowed:false,code:"unknown_action",reason:"Action non reconnue."};
 if(!["personal_mac","other_device"].includes(target))
  return {allowed:false,code:"unknown_device",reason:"Appareil non identifié : aucune action."};
 if(!verifiedDevice)return {allowed:false,code:"device_not_verified",reason:"L'identité de l'appareil cible doit être vérifiée. Une simple déclaration n'est pas une preuve."};
 if(!ownerIdentified)return {allowed:false,code:"owner_not_verified",reason:"Le propriétaire ou la personne autorisée doit être identifié."};
 if(action==="read")return {allowed:true,code:"read_allowed",reason:"Diagnostic en lecture seule, limité à l'appareil identifié, sans transmission de données personnelles."};
 if(!Array.isArray(preflightTests)||preflightTests.length===0||preflightTests.some(test=>!test||typeof test.name!=="string"||test.passed!==true))
  return {allowed:false,code:"tests_required",reason:"Modification bloquée : tous les tests préalables réels doivent réussir. Un test manquant, inconnu ou échoué bloque l'exécution."};
 if(!explicitApproval)return {allowed:false,code:target==="personal_mac"?"approval_required":"other_device_approval_required",
  reason:target==="personal_mac"?"Le Mac personnel est autorisé dans son principe, mais cette modification précise demande ton accord.":"Un autre appareil est interdit sans ton autorisation personnelle pour cette opération précise."};
 if(["repair","delete","admin","deploy"].includes(action)&&(!backupPrepared||!rollbackPrepared))
  return {allowed:false,code:"recovery_required",reason:"Opération sensible : prévoir sauvegarde et retour arrière vérifiés."};
 return {allowed:true,code:"explicitly_approved",reason:"L'accord vaut uniquement pour cette opération et cet appareil ; aucune permission durable ou générale."};
}
