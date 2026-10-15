/** Alicia : contenu local volontaire des pièces jointes et des conseils de ChatGPT.
 * Validation avant analyse pour éviter envoi involontaire ou volumineux.
 */
export const MAX_IMAGE_BYTES=4*1024*1024;
export const MAX_TEXT_BYTES=140*1024;
const TEXT_EXT=/\.(?:txt|md|csv|tsv|json|log|xml)$/i;
const IMAGE_MIME=/^image\/(?:jpeg|png|webp|gif)$/i;
export function fileKind({name="",type="",size=0}={}){
 if(!Number.isFinite(size)||size<=0)return {kind:"error",reason:"Le fichier est vide ou invalide."};
 if(IMAGE_MIME.test(type)){
  if(size>MAX_IMAGE_BYTES)return {kind:"error",reason:"Photo trop volumineuse (4 Mo maximum). Redimensionne-la avant l'envoi."};
  return {kind:"image"};
 }
 if(TEXT_EXT.test(name)&&(!type||type.startsWith("text/")||type==="application/json"||type==="application/xml"||type==="application/octet-stream")){
  if(size>MAX_TEXT_BYTES)return {kind:"error",reason:"Fichier texte trop volumineux (140 Ko maximum)."};
  return {kind:"text"};
 }
 return {kind:"error",reason:"Ce format ne peut pas encore être analysé par Alicia. Pour un PDF ou document Word, copie son texte dans la conversation, ou exporte-le en .txt."};
}
export function createAdvicePrompt(input=""){
 const question=String(input).trim().slice(0,2500);
 return [
  "Bonjour ChatGPT. Je développe Alicia, une assistante IA personnelle en français pour iPhone (application web PWA) et plus tard mon Mac macOS Big Sur.",
  "Peux-tu me donner des conseils, astuces et étapes concrètes pour l'améliorer, en distinguant ce qui est testé de ce qui reste hypothétique ?",
  "Propose des méthodes sûres, des tests avant modification, des solutions gratuites quand elles existent et les limites techniques.",
  question?"Question précise à résoudre :\n"+question:"Question : quelle amélioration utile et réalisable tester ensuite dans Alicia ?",
  "Ne demande aucun mot de passe ou jeton secret. Réponds de manière facile à copier dans Alicia."
 ].join("\n\n");
}
export function cleanSharedAdvice(value){
 const v=String(value??"").trim();
 if(v.length<35)throw Error("Colle une explication d'au moins 35 caractères.");
 if(v.length>1600)throw Error("Ce conseil dépasse 1 600 caractères : sélectionne seulement la partie utile.");
 if(/gh[pousr]_[a-z0-9_]{12,}|github_pat_[a-z0-9_]{12,}|sk-[a-z0-9_-]{20,}|-----BEGIN (?:OPENSSH |RSA )?PRIVATE KEY-----/i.test(v))
  throw Error("Ce texte semble contenir un secret. Ne l'enregistre pas.");
 return v;
}
