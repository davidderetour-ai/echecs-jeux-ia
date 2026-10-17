/* Dames internationales 10 × 10 — moteur hors ligne indépendant.
 * Hommes : prises avant/arrière. Dames : déplacement et rafle longue distance.
 * Prise obligatoire et rafle du plus grand nombre de pièces.
 * Simplifications : pas d'arbitrage complet des nulles selon la règle FMJD.
 */
export const SIZE=10;
const directions=[[-1,-1],[-1,1],[1,-1],[1,1]];
const inside=(r,c)=>r>=0&&r<SIZE&&c>=0&&c<SIZE;
const dark=(r,c)=>inside(r,c)&&(r+c)%2===1;
const enemy=(p,side)=>p&&p.side!==side;
const clone=b=>b.map(row=>row.map(p=>p?{...p}:null));
export function newFrenchDraughts(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
 for(let r=0;r<4;r++)for(let c=0;c<SIZE;c++)if(dark(r,c))board[r][c]={side:"black",king:false};
 for(let r=6;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(dark(r,c))board[r][c]={side:"white",king:false};
 return {kind:"french-draughts",board,turn:"white",ply:0,over:null,lastMove:null,history:[]};
}
export const square=(r,c)=>String.fromCharCode(65+c)+(SIZE-r);
const cloneGame=g=>({...g,board:clone(g.board),history:[...(g.history||[])]});
const pathKey=move=>JSON.stringify([move.from,move.to,move.landings,move.captures]);
function captureSequences(board,side,fr,fc){
 const piece=board[fr][fc],results=[];
 if(!piece||piece.side!==side)return [];
 function search(b,r,c,captured,landings,blocked){
  let found=false;
  for(const [dr,dc] of directions){
   if(!piece.king){
    const er=r+dr,ec=c+dc,tr=r+2*dr,tc=c+2*dc;
    if(!dark(tr,tc)||!enemy(b[er]?.[ec],side)||b[tr][tc]||blocked.has(er*10+ec))continue;
    found=true;
    const next=clone(b);next[r][c]=null;next[er][ec]=null;next[tr][tc]={...piece};
    search(next,tr,tc,[...captured,{r:er,c:ec}], [...landings,{r:tr,c:tc}],new Set([...blocked,er*10+ec]));
   }else{
    let rr=r+dr,cc=c+dc;
    // Dames volantes : les pièces déjà capturées restent des obstacles jusqu'à la fin de la rafle.
    while(inside(rr,cc)&&!b[rr][cc]&&!blocked.has(rr*10+cc)){rr+=dr;cc+=dc;}
    if(!inside(rr,cc)||blocked.has(rr*10+cc)||!enemy(b[rr][cc],side))continue;
    const victim={r:rr,c:cc},victimPos=rr*10+cc;
    let tr=rr+dr,tc=cc+dc;
    while(dark(tr,tc)&&!b[tr][tc]&&!blocked.has(tr*10+tc)){
     found=true;
     const next=clone(b);next[r][c]=null;next[rr][cc]=null;next[tr][tc]={...piece};
     search(next,tr,tc,[...captured,victim],[...landings,{r:tr,c:tc}],new Set([...blocked,victimPos]));
     tr+=dr;tc+=dc;
    }
   }
  }
  if(!found&&captured.length)results.push({
   from:{r:fr,c:fc},to:{r,c},landings:[...landings],captures:[...captured],
   promotion:!piece.king&&((side==="white"&&r===0)||(side==="black"&&r===SIZE-1))
  });
 }
 search(board,fr,fc,[],[],new Set());
 return results;
}
function quietMoves(board,side,r,c){
 const piece=board[r][c];if(!piece)return [];
 const moves=[];
 for(const [dr,dc] of directions){
  if(!piece.king&&dr!==(side==="white"?-1:1))continue;
  let tr=r+dr,tc=c+dc;
  while(dark(tr,tc)&&!board[tr][tc]){
   moves.push({from:{r,c},to:{r:tr,c:tc},landings:[{r:tr,c:tc}],captures:[],
    promotion:!piece.king&&((side==="white"&&tr===0)||(side==="black"&&tr===9))});
   if(!piece.king)break;
   tr+=dr;tc+=dc;
  }
 }
 return moves;
}
export function legalFrenchMoves(g){
 if(!g||g.over)return [];
 const side=g.turn,all=[];
 for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
  if(g.board[r][c]?.side===side)all.push(...captureSequences(g.board,side,r,c));
 }
 if(all.length){
  const maximum=Math.max(...all.map(m=>m.captures.length));
  const found=new Set();
  return all.filter(m=>m.captures.length===maximum&&!found.has(pathKey(m))&&found.add(pathKey(m)));
 }
 const quiet=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)
  if(g.board[r][c]?.side===side)quiet.push(...quietMoves(g.board,side,r,c));
 return quiet;
}
export function applyFrenchMove(g,move){
 if(!g||!move||g.over)return null;
 const legal=legalFrenchMoves(g);
 const selected=legal.find(m=>pathKey(m)===pathKey(move))||
  legal.find(m=>m.from.r===move.from?.r&&m.from.c===move.from?.c&&m.to.r===move.to?.r&&m.to.c===move.to?.c
   &&m.captures.length===(move.captures?.length||0));
 if(!selected)return null;
 const next=cloneGame(g);
 const piece=next.board[selected.from.r][selected.from.c];
 next.board[selected.from.r][selected.from.c]=null;
 for(const v of selected.captures)next.board[v.r][v.c]=null;
 next.board[selected.to.r][selected.to.c]={...piece,king:piece.king||selected.promotion};
 next.lastMove={from:{...selected.from},to:{...selected.to},landings:selected.landings.map(p=>({...p})),
  captures:selected.captures.map(p=>({...p}))};
 next.history.push({board:clone(g.board),turn:g.turn,ply:g.ply,over:g.over,lastMove:g.lastMove});
 if(next.history.length>24)next.history.shift();
 next.turn=g.turn==="white"?"black":"white";next.ply++;
 if(!legalFrenchMoves(next).length)next.over={winner:g.turn,reason:"plus aucun coup légal"};
 return next;
}
export function undoFrench(g){
 const h=g?.history||[];if(!h.length)return null;
 const prev=h[h.length-1];
 return {...g,board:clone(prev.board),turn:prev.turn,ply:prev.ply,over:prev.over,lastMove:prev.lastMove,history:h.slice(0,-1)};
}
export function chooseFrenchAlicia(g,{level=3}={}){
 const moves=legalFrenchMoves(g);if(!moves.length)return null;
 if(level<=1)return moves[Math.floor(Math.random()*moves.length)];
 const score=m=>{
  const piece=g.board[m.from.r][m.from.c],forward=piece.side==="white"?
   m.from.r-m.to.r:m.to.r-m.from.r;
  const center=5-Math.abs(4.5-m.to.c), promoted=m.promotion?12:0;
  const captured=m.captures.length*20;
  let risk=0;
  if(level>=3){
   const next=applyFrenchMove(g,m);
   if(next&&!next.over){
    const replies=legalFrenchMoves(next);
    const attacks=replies.filter(x=>x.captures.some(v=>v.r===m.to.r&&v.c===m.to.c));
    if(attacks.length)risk=piece.king?12:6;
   }
  }
  return captured+promoted+center*.9+forward*.3-risk+(Math.random()*(level<4?2:.15));
 };
 return moves.map(m=>({m,v:score(m)})).sort((a,b)=>b.v-a.v)[0].m;
}
export function frenchAdvice(g,level=3){
 if(!g||g.over)return {text:"La partie est terminée.",move:null};
 const moves=legalFrenchMoves(g);if(!moves.length)return {text:"Aucun coup autorisé.",move:null};
 const m=chooseFrenchAlicia(g,{level}),mandatory=m.captures.length>0;
 const text=(mandatory?"Une prise est obligatoire ; choisis une rafle du plus grand nombre. ":"Développe tes pions et contrôle le centre. ")+
  "Alicia propose "+square(m.from.r,m.from.c)+" → "+m.landings.map(p=>square(p.r,p.c)).join(" → ")+
  (m.promotion?". Ce pion devient dame.":"")+". Ce conseil est indicatif.";
 return {text,move:m};
}
