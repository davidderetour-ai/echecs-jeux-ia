/* Alicia — accès gratuit à tous les jeux depuis iPhone et Mac.
 * La partie est jouée par l'IA locale du jeu ; ce n'est pas un lien direct avec
 * le cerveau conversationnel ni une connexion entre les sauvegardes des deux apps.
 */
const GAME_URL="https://davidderetour-ai.github.io/echecs-jeux-ia/";
export const GAMES=[
 ["chess2","Échecs classiques","versus"],["chess4","Échecs à quatre","versus"],
 ["checkers","Dames","versus"],["reversi","Reversi","versus"],
 ["connect4","Puissance 4","versus"],["fox","Renard et oies","versus"],
 ["saut","Sauterelle","versus"],["north","Northcote","versus"],["nim","Nim","versus"],
 ["shogi","Shogi","versus"],["go9","Go 9 × 9","versus"],
 ["go13","Go 13 × 13","versus"],["go19","Go 19 × 19","versus"],
 ["tictactoe","Morpion","versus"],["memory","Jeu des paires","coach"],
 ["peace","Défis de paix","coach"]
];
export function linkForGame(id){
 const found=GAMES.find(x=>x[0]===id);if(!found)return null;
 return GAME_URL+(/^go/.test(id)?"go.html":id==="peace"?"peace.html":"index.html")+"?alicia="+encodeURIComponent(id);
}
export function understandPlayRequest(message){
 const n=String(message||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(!/\b(?:jouer|jouons|partie|defi|affronter|adversaire)\b/.test(n))return null;
 if(!/\b(?:alicia|echecs|jeu|shogi|go|morpion|dames|reversi|nim|paix|paires|quatre|puissance|renard)\b/.test(n))return null;
 const rules=[
  [/\b(?:quatre|4 joueurs|4 joueur)\b/,"chess4"],
  [/\bshogi\b/,"shogi"],[/\bgo\b.*\b19\b/,"go19"],[/\bgo\b.*\b13\b/,"go13"],
  [/\bgo\b/,"go9"],[/\bmorpion\b/,"tictactoe"],[/\bdames\b/,"checkers"],
  [/\breversi\b/,"reversi"],[/\b(?:puissance|quatre en ligne|4 en ligne)\b/,"connect4"],
  [/\brenard\b/,"fox"],[/\b(?:sauterelle|saut)\b/,"saut"],
  [/\bnorthcote\b/,"north"],[/\bnim\b/,"nim"],
  [/\bpaires\b/,"memory"],[/\bpaix\b/,"peace"],
  [/\b(?:echecs|chess)\b/,"chess2"]
 ];
 return rules.find(([p])=>p.test(n))?.[1]||"chess2";
}
const $=id=>document.getElementById(id);
function init(){
 if($("alicia-play-panel"))return;
 const root=document.createElement("details");
 root.id="alicia-play-panel";root.className="tool-finder";root.style.cssText="padding:13px;margin:12px 0;border:1px solid #7388be;border-radius:12px";
 const heading=document.createElement("summary");heading.textContent="♟ Jouer avec Alicia — tous les jeux gratuits";root.append(heading);
 const expl=document.createElement("p");expl.textContent="Choisis un jeu pour défier Alicia gratuitement. Les adversaires sont calculés par les moteurs locaux déjà inclus ; les défis solo sont accompagnés d'un coach. La première ouverture du jeu peut nécessiter Internet. Une fois son application web installée, son mode hors ligne est disponible sur les appareils compatibles.";
 root.append(expl);
 const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;margin:10px 0";
 for(const [id,name,type] of GAMES){
  const a=document.createElement("a");a.href=linkForGame(id);a.target="_blank";a.rel="noopener noreferrer";
  a.style.cssText="padding:11px;min-height:58px;border-radius:10px;border:1px solid #6777ba;color:inherit;text-decoration:none";
  a.textContent=(type==="coach"?"🎓 ":"♟ ")+name+" →";a.dataset.aliciaGame=id;
  grid.append(a);
 }
 root.append(grid);
 const foot=document.createElement("p");foot.textContent="Le jeu s'ouvre depuis Alicia mais conserve sa propre sauvegarde. Le dialogue d'Alicia et le moteur du jeu ne partagent pas automatiquement leurs mémoires.";
 foot.style.cssText="font-size:12px;opacity:.85";root.append(foot);
 const target=$("github-health")||$("chat-form");
 if(target)target.before(root);else document.querySelector(".shell")?.append(root);
 window.AliciaPlay={
  open(){root.open=true;root.scrollIntoView({behavior:"smooth",block:"start"});},
  answer(query){
   const id=understandPlayRequest(query);if(!id)return null;
   const item=GAMES.find(x=>x[0]===id);
   root.open=true;
   return {answer:"Avec plaisir ! Nous pouvons "+(item[2]==="coach"?"résoudre ensemble":"jouer ensemble à")+" "+item[1]+
     ". Ouvre le jeu ici : "+linkForGame(id)+". C'est gratuit. Je jouerai avec le moteur IA local du jeu. La section « Jouer avec Alicia » est ouverte pour choisir un autre jeu.",
    provider:"Alicia — Jeux gratuits",local:true,verified:false,sources:[]};
  }
 };
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
}
