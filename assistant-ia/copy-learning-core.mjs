/**
 * Alicia — échanges volontaires entre les copies et le dépôt de référence.
 * Aucun accès à l'appareil, aucune collecte automatique, aucun entraînement du modèle.
 */
const TYPES=["bug","solution","suggestion","security"];
const SENSITIVE=/(?:gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{12,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|bearer\s+[a-z0-9._-]{15,})/i;
export function validateVolunteerReport({category,description,consent}={}){
 if(consent!==true)throw Error("Le partage nécessite ton consentement explicite.");
 if(!TYPES.includes(category))throw Error("Type de retour invalide.");
 if(typeof description!=="string")throw Error("Retour manquant.");
 const clean=description.trim();
 if(clean.length<30||clean.length>1100)throw Error("Décris le problème et ses vérifications en 30 à 1 100 caractères.");
 if(SENSITIVE.test(clean))throw Error("Clé ou secret potentiel détecté : retire cette information avant de partager.");
 if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean))throw Error("Le texte comporte des caractères interdits.");
 return {category,description:clean};
}
export function validateLearningCatalog(value){
 if(!value||typeof value!=="object"||Array.isArray(value)||
  value.schema!==1||value.project!=="Alicia"||value.publisher!=="davidderetour-ai"||
  !Array.isArray(value.reviewedEntries)||value.reviewedEntries.length>100)
  throw Error("Catalogue non conforme.");
 const ids=new Set();
 return value.reviewedEntries.map(e=>{
  if(!e||typeof e!=="object"||!/^AL-[0-9]{4,8}$/.test(e.id)||
   typeof e.title!=="string"||e.title.length<5||e.title.length>120||
   typeof e.lesson!=="string"||e.lesson.length<30||e.lesson.length>950||
   !TYPES.includes(e.category)||e.reviewed!==true||
   typeof e.source!=="string"||e.source.length>350)
   throw Error("Fiche de connaissance invalide.");
  const source=new URL(e.source);
  if(source.protocol!=="https:"||source.hostname!=="github.com"||
   !/^\/davidderetour-ai\/echecs-jeux-ia\/(?:issues|pull)\/[1-9]\d*$/.test(source.pathname))
   throw Error("Preuve de validation absente.");
  if(ids.has(e.id))throw Error("Identifiant de fiche en double.");
  if(SENSITIVE.test(e.lesson))throw Error("Secret potentiel dans une fiche.");
  ids.add(e.id);
  return {id:e.id,title:e.title,lesson:e.lesson,category:e.category,source:source.href};
 });
}
export function validateSafetyNotices(value){
 if(!value||typeof value!=="object"||value.schema!==1||
 value.project!=="Alicia"||value.publisher!=="davidderetour-ai"||
 !Array.isArray(value.blockedVersions)||value.blockedVersions.length>100||
 !Array.isArray(value.notices)||value.notices.length>30)throw Error("Manifeste d'alerte incorrect.");
 const versions=value.blockedVersions.map(x=>{
  if(typeof x!=="string"||!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\w.-]+)?$/.test(x))
   throw Error("Numéro de version incorrect.");
  return x;
 });
 const notices=value.notices.map(x=>{
  if(!x||typeof x.title!=="string"||x.title.length<5||x.title.length>120||
   typeof x.description!=="string"||x.description.length<15||x.description.length>1000||
   !["information","warning","critical"].includes(x.level)||
   typeof x.source!=="string")throw Error("Alerte incorrecte.");
  const source=new URL(x.source);
  if(source.protocol!=="https:"||source.hostname!=="github.com"||
   !source.pathname.startsWith("/davidderetour-ai/echecs-jeux-ia/"))
    throw Error("Source d'alerte non officielle.");
  return {title:x.title,description:x.description,level:x.level,source:source.href};
 });
 return {versions,notices};
}
