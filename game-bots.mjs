/* Adversaires IA locaux : variantes configurées des moteurs existants, pas des LLM.
 * Toutes les décisions sont calculées sur l'appareil. Alicia reste disponible.
 */
export const GAME_BOT_PROFILES=Object.freeze([
 Object.freeze({id:'alicia',name:'Alicia',desc:'Équilibrée, elle peut aussi te conseiller.',style:'balanced',levelOffset:0}),
 Object.freeze({id:'explorateur',name:'Explorateur',desc:'Imprévisible et adapté aux débutants.',style:'explorer',levelOffset:-1}),
 Object.freeze({id:'tacticien',name:'Tacticien',desc:'Privilégie les prises et l’attaque.',style:'offensive',levelOffset:0}),
 Object.freeze({id:'stratège',name:'Stratège',desc:'Prudent, il protège ses pièces.',style:'cautious',levelOffset:0}),
 Object.freeze({id:'maitre',name:'Maître',desc:'Recherche des coups plus difficiles.',style:'balanced',levelOffset:1})
]);
const profileMap=new Map(GAME_BOT_PROFILES.map(p=>[p.id,p]));
export function selectedBot(id){return profileMap.get(id)||profileMap.get('alicia');}
export function botSettings(id,level=2,maxLevel=6){
 const profile=selectedBot(id);const n=Math.max(1,Math.min(maxLevel,Math.round(Number(level)||2)+profile.levelOffset));
 return {id:profile.id,name:profile.name,style:profile.style,level:n};
}
export const LOCAL_DUEL_IDS=Object.freeze(['chess2','chess4','checkers','reversi','connect4','fox','saut','north','nim','shogi']);
export function supportsLocalDuel(id){return LOCAL_DUEL_IDS.includes(id);}
export const GAME_BOT_NOTE='Ces noms sont des styles de jeu calculés par les moteurs locaux et non des intelligences conversationnelles séparées.';
