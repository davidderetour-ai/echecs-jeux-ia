/** Alicia : contenu local volontaire des pièces jointes et des conseils de ChatGPT.
 * Validation avant analyse pour éviter envoi involontaire ou volumineux.
 */
export const MAX_IMAGE_BYTES=4*1024*1024;
export const MAX_TEXT_BYTES=140*1024;
export const MAX_AUDIO_BYTES=20*1024*1024;
export const MAX_VIDEO_BYTES=80*1024*1024;
const AUDIO_EXT=/\.(?:mp3|m4a|aac|wav|ogg|opus)$/i;
const VIDEO_EXT=/\.(?:mp4|mov|m4v|webm)$/i;

const TEXT_EXT=/\.(?:txt|md|csv|tsv|json|log|xml)$/i;
const IMAGE_MIME=/^image\/(?:jpeg|png|webp|gif)$/i;
export function fileKind({name="",type="",size=0}={}){
 if(!Number.isFinite(size)||size<=0)return {kind:"error",reason:"Le fichier est vide ou invalide."};
 if(AUDIO_EXT.test(name)&&(/^(?:audio\/(?:mpeg|mp4|x-m4a|aac|wav|x-wav|ogg|opus|webm|3gpp)|application\/octet-stream)$/.test(type)||!type)){
  if(size>MAX_AUDIO_BYTES)return {kind:"error",reason:"Enregistrement trop volumineux : 20 Mo maximum."};
  return {kind:"audio"};
 }
 if(VIDEO_EXT.test(name)&&(/^(?:video\/(?:mp4|quicktime|x-m4v|webm)|application\/octet-stream)$/.test(type)||!type)){
  if(size>MAX_VIDEO_BYTES)return {kind:"error",reason:"Vidéo trop volumineuse : 80 Mo maximum."};
  return {kind:"video"};
 }
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

/** Prépare un lien pour le partager, sans jamais consulter son contenu.
 * Seules les adresses Web HTTP(S) sont autorisées. Les URL avec mot de passe
 * embarqué ou caractères de contrôle sont refusées avant d'ouvrir Safari.
 */
export function parseSharedLink(input){
 const raw=String(input??"").trim();
 if(!raw||raw.length>2048)throw Error("Saisis un lien Internet de 2 048 caractères maximum.");
 if(/[\u0000-\u001f\u007f]/.test(raw))throw Error("Le lien contient des caractères non autorisés.");
 let candidate=raw;
 // Aide pour les liens « exemple.fr » sans préfixe.
 if(!/^[a-z][a-z0-9+.-]*:/i.test(candidate)&&/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i.test(candidate)){
  candidate="https://"+candidate;
 }
 let url;
 try{url=new URL(candidate);}
 catch{throw Error("Ce lien est invalide. Exemple : https://www.exemple.fr");}
 if(!["https:","http:"].includes(url.protocol))throw Error("Seuls les liens Web https:// ou http:// sont acceptés.");
 if(url.username||url.password)throw Error("Les liens contenant un identifiant ou mot de passe sont refusés.");
 if(!url.hostname||url.href.length>2500)throw Error("L'adresse du site est invalide ou trop longue.");
 return {url:url.href,host:url.hostname,secure:url.protocol==="https:"};
}
