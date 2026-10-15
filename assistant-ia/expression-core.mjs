/**
 * Alicia : expressions VISUELLES simulées.
 * Ce classifieur local n'est ni un diagnostic d'émotion ni une analyse de la personne.
 */
export const EXPRESSIONS = Object.freeze({
 neutral:"Neutre",
 joyful:"Joyeuse",
 thoughtful:"Concentrée",
 curious:"Curieuse",
 supportive:"Bienveillante",
 creative:"Inspirée"
});
export function normalizeExpression(value){
 return typeof value==="string"&&Object.hasOwn(EXPRESSIONS,value)?value:"neutral";
}
function plain(value){
 return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().slice(0,3500);
}
export function chooseExpression({text="",mode="general",phase="reply"}={}){
 if(phase==="thinking")return "thoughtful";
 if(phase==="listening")return "curious";
 if(phase==="intro")return "neutral";
 const content=plain(text);
 // Réactions guidées par les mots de la conversation, pas par un état interne.
 if(/\b(bravo|felicitations|reussi|excellent|magnifique|super|genial|victoire)\b/.test(content))return "joyful";
 if(/\b(desole|difficile|inquiet|panne|probleme|erreur|triste|desastre|perte|bloque|douleur)\b/.test(content))return "supportive";
 if(/\b(imagine|invente|creativite|dessin|art|peinture|musique|chant|chanson|melodie)\b/.test(content))return "creative";
 if(phase==="user"&&/\?/.test(content))return "curious";
 if(["arts","music","singing"].includes(mode))return "creative";
 if(["math","science","analysis","code"].includes(mode))return "thoughtful";
 if(phase==="reply"&&/(\?|comment|pourquoi|expliquer)/.test(content))return "curious";
 return "neutral";
}
