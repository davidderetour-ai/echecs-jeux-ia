/**
 * Alicia — validation de propositions GitHub.
 * Lecture/écriture limitée à assistant-ia/ ; aucun secret ou workflow GitHub.
 */
export const EXPECTED_REPOSITORY="davidderetour-ai/echecs-jeux-ia";
export function validateProposal(candidate){
 if(!candidate||typeof candidate!=="object"||Array.isArray(candidate))throw Error("Proposition invalide.");
 const title=String(candidate.title||"").trim(),reason=String(candidate.reason||"").trim();
 if(title.length<12||title.length>100)throw Error("Titre descriptif requis (12 à 100 caractères).");
 if(reason.length<30||reason.length>3000)throw Error("Justification explicite requise (30 à 3 000 caractères).");
 if(!Array.isArray(candidate.files)||candidate.files.length<1||candidate.files.length>5)throw Error("Entre 1 et 5 fichiers par proposition.");
 const files=[],seen=new Set();
 for(const item of candidate.files){
  const path=item?.path,content=item?.content;
  if(typeof path!=="string"||!/^assistant-ia\/[a-zA-Z0-9_-][a-zA-Z0-9_.\/-]{0,160}$/.test(path)||
    path.includes("..")||path.split("/").some(x=>x.startsWith("."))||/\/\//.test(path))throw Error("Chemin interdit : uniquement assistant-ia/.");
  if(/\.(?:env|pem|key|p12|pfx|crt|mobileprovision)$/i.test(path))throw Error("Fichiers de secrets ou certificats interdits.");
  if(typeof content!=="string"||!content.length||content.length>100000)throw Error("Contenu absent ou trop volumineux.");
  if(seen.has(path))throw Error("Chemin répété.");seen.add(path);
  if(/(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})/.test(content))throw Error("Secret probable détecté : ne jamais publier une clé API.");
  files.push({path,content});
 }
 const checks=Array.isArray(candidate.checks)?candidate.checks:[];
 if(!checks.length||checks.some(c=>!c||typeof c.name!=="string"||!c.name.trim()))throw Error("Décris au moins un test reproductible pour cette modification.");
 const tests=checks.slice(0,20).map(c=>String(c.name).slice(0,180));
 return {title,reason,files,checks:tests};
}
export function summarizeRunResults(runs){
 if(!Array.isArray(runs))throw Error("Historique des tests invalide.");
 const completed=runs.filter(r=>r?.status==="completed"&&["success","failure","cancelled","timed_out"].includes(r.conclusion));
 const passed=completed.filter(r=>r.conclusion==="success").length;
 return {total:completed.length,passed,failed:completed.length-passed,
  percent:completed.length?Number((passed/completed.length*100).toFixed(1)):null};
}
