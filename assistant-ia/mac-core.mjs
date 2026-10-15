/**
 * Analyse deterministe d'un rapport mac-audit.sh, sans connexion Internet.
 * Aucune ecriture sur le Mac, aucun correctif applique.
 */
export function parseMacReport(input){
 if(typeof input!=="string"||input.length>10000)throw new Error("Rapport invalide ou trop volumineux.");
 const clean=input.replace(/\r/g,"");
 if(!clean.includes("ALICIA_MAC_AUDIT_V1")||!clean.includes("END_ALICIA_MAC_AUDIT_V1"))throw new Error("Rapport incomplet : utilise mac-audit.sh.");
 const data={};
 const allow=new Set(["OS_VERSION","MAC_MODEL","RAM_GIB","ARCH","DISK_FREE_GIB"]);
 const lines=clean.split("\n");
 for(const line of lines){
  const match=/^([A-Z_]+)=(.{1,130})$/.exec(line.trim());
  if(!match||!allow.has(match[1]))continue;
  data[match[1]]=match[2];
 }
 if(!/^\d{1,2}\.\d{1,2}(?:\.\d{1,3})?$/.test(data.OS_VERSION||""))throw new Error("Version de macOS absente ou incorrecte.");
 for(const field of ["RAM_GIB","DISK_FREE_GIB"]){
  const val=data[field];
  if(val!==undefined&&val!=="inconnu"&&val!=="inconnue"&&!/^\d{1,6}$/.test(val))throw new Error("Valeur du rapport incorrecte : "+field);
 }
 return data;
}
export function macRecommendations(report){
 const data=typeof report==="string"?parseMacReport(report):report;
 const major=Number(data.OS_VERSION.split(".")[0]);
 const details=[{
  level:"info",title:"Diagnostic en lecture seule",
  description:"Ce rapport n'a installé, modifié ni supprimé aucun fichier. Alicia n'appliquera pas de modification sans ton accord."
 }];
 if(major<14){
  details.push({level:"warning",title:"Ollama actuel incompatible avec ce macOS",
    description:"L'application officielle Ollama exige macOS 14 ou plus récent. Alicia ne peut pas rendre ce logiciel compatible en changeant une simple option système. Vérifier d'abord la compatibilité officielle du Mac avec une version supérieure ou choisir un autre moteur."});
 }else{
  details.push({level:"info",title:"Version de macOS",
    description:"La version indiquée atteint le minimum macOS actuellement déclaré pour Ollama. Il faut aussi contrôler le processeur, la mémoire et l'espace disque."});
 }
 const free=Number(data.DISK_FREE_GIB),ram=Number(data.RAM_GIB);
 if(Number.isInteger(free)&&free>=0&&free<20){
  details.push({level:"warning",title:"Stockage disponible limité",
    description:"Moins de 20 Gio libres sont indiqués. Vérifier les gros fichiers, sauvegardes et téléchargements. Faire une sauvegarde avant tout nettoyage. Aucune suppression automatique."});
 }
 if(Number.isInteger(ram)&&ram>=0&&ram<8){
  details.push({level:"warning",title:"Mémoire limitée pour les modèles IA",
    description:"Moins de 8 Gio de RAM détectés : les grands modèles locaux risquent d'être lents ou inutilisables. Privilégier des modèles compacts et adapter la taille au Mac."});
 }
 if(major<=11){
  details.push({level:"info",title:"Mise à jour macOS",
    description:"Vérifier le modèle exact dans À propos de ce Mac et l'utilitaire Apple Mise à jour de logiciels. Une mise à niveau officielle n'est possible que si le modèle est compatible. Effectuer une sauvegarde au préalable."});
 }
 details.push({level:"info",title:"Améliorations proposées",
  description:"Alicia peut expliquer comment libérer de l'espace, réduire les applications au démarrage, identifier des ralentissements, choisir un logiciel compatible et préparer des changements contrôlés. Elle ne réalise encore aucune optimisation automatique."});
 return details;
}
