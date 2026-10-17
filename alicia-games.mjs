/* Pont Alicia ↔ Échecs & Jeux IA.
 * Les adversaires utilisent les moteurs LOCAUX existants : pas de GPT-6,
 * pas de compte, pas de paiement, pas de synchronisation des données entre apps.
 * Les jeux de logique à un joueur proposent une aide coopérative.
 */
export const ALICIA_GAME_ORIGIN="https://davidderetour-ai.github.io/echecs-jeux-ia/";
const GAME_MODES=Object.freeze([
 {id:"chess2",label:"Échecs classiques",type:"opponent",path:"index.html",engine:"engine.js"},
 {id:"chess4",label:"Échecs à 4 joueurs",type:"opponent",path:"index.html",engine:"engine.js"},
 {id:"checkers",label:"Dames",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"reversi",label:"Reversi",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"connect4",label:"Puissance 4",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"fox",label:"Renard et oies",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"saut",label:"Jeu de Saut",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"north",label:"Jeu du Nord",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"nim",label:"Nim",type:"opponent",path:"index.html",engine:"mini.js"},
 {id:"shogi",label:"Shogi",type:"opponent",path:"index.html",engine:"shogi-engine.js"},
 {id:"go9",label:"Go 9 × 9",type:"opponent",path:"go.html",engine:"go.js",size:9},
 {id:"go13",label:"Go 13 × 13",type:"opponent",path:"go.html",engine:"go.js",size:13},
 {id:"go19",label:"Go 19 × 19",type:"opponent",path:"go.html",engine:"go.js",size:19},
 {id:"tictactoe",label:"Morpion",type:"opponent",path:"index.html",engine:"extras.js"},
 {id:"memory",label:"Jeu des paires",type:"coach",path:"index.html",engine:"extras.js"},
 {id:"peace",label:"Défis de paix",type:"coach",path:"peace.html",engine:"peace.js"}
]);
export const ALICIA_GAMES=GAME_MODES;
export function getAliciaGame(id){return GAME_MODES.find(g=>g.id===id)||null;}
export function aliciaGameLink(id,{local=false}={}){
 const g=getAliciaGame(id);
 if(!g)return null;
 const target=new URL(g.path,local?"https://local.invalid/":ALICIA_GAME_ORIGIN);
 target.searchParams.set("alicia",g.id);
 return local?target.pathname+target.search:target.href;
}
export function aliciaGameAction(id){
 const game=getAliciaGame(id);
 if(!game)return null;
 return {id:game.id,type:game.type,engine:game.engine,url:aliciaGameLink(id)};
}
export const GAME_PRICE=0;
export const ALICIA_GAME_NOTE="Alicia est le nom de l'adversaire local du jeu, qui utilise les moteurs existants. Le moteur général de conversation d'Alicia n'est pas physiquement connecté à chaque coup.";
