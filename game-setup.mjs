/* Options réellement disponibles pour chacun des jeux.
 * Aucune option virtuelle : la fiche décrit les fonctions du moteur existant.
 * Ce module ne modifie ni les parties ni localStorage.
 */
import {ALICIA_GAMES,getAliciaGame} from './alicia-games.mjs';
const STUDY=new Set(['peace','memory']);
const SIMPLE=new Set(['shogi','go9','go13','go19']);
const DRAUGHTS=new Set(['dames10']);
const CLOCKS=new Set(['chess2','chess4','shogi']);
export function gameSetupSpec(id){
 const g=getAliciaGame(id);
 if(!g)return null;
 const isGo=/^go(9|13|19)$/.test(id);
 const puzzle=STUDY.has(id);
 return {
   id,label:g.label,path:g.path,isGo,puzzle,
   maxLevel:DRAUGHTS.has(id)?5:SIMPLE.has(id)||puzzle?0:6,
   clock:CLOCKS.has(id),
   modes:puzzle?(id==='peace'?['solo','duo']:['solo']):DRAUGHTS.has(id)?['ai']:['ai','local'],
   supportsRoles:!puzzle,
   rules:id==='chess4',
   canChooseGoban:isGo,
   canChangeView:true
 };
}
export function safeSetup(id,values={}){
 const spec=gameSetupSpec(id);if(!spec)return null;
 const mode=spec.modes.includes(values.mode)?values.mode:spec.modes[0];
 const role=['opponent','partner','training'].includes(values.role)?values.role:'opponent';
 const level=spec.maxLevel?Math.min(spec.maxLevel,Math.max(1,Math.round(Number(values.level)||2))):null;
 const goban=[9,13,19].includes(Number(values.goban))?Number(values.goban):(spec.isGo?Number(id.slice(2)):9);
 const view=values.view==='2d'?'2d':'3d';
 const rules=['chesscom-ffa','chesscom-teams','house-a','house-b','house-teams'].includes(values.rules)?values.rules:'chesscom-ffa';
 return {id,mode,role,level,goban,view,rules,clock:spec.clock&&values.clock===true};
}
export function standaloneGameUrl(options){
 const spec=gameSetupSpec(options?.id);
 if(!spec||spec.path==='index.html')return null;
 const opts=safeSetup(spec.id,options);const query=new URLSearchParams();
 query.set('launch','1');
 query.set('alicia',spec.isGo?'go'+opts.goban:spec.id);
 query.set('mode',opts.mode);
 query.set('view',opts.view);
 if(opts.level!==null)query.set('level',String(opts.level));
 if(spec.isGo)query.set('goban',String(opts.goban));
 // Ne pas passer "role" aux dames : cela remettrait une partie existante à zéro.
 if(!DRAUGHTS.has(opts.id))query.set('role',opts.role);
 return spec.path+'?'+query.toString();
}
export const PREPARABLE_GAME_IDS=Object.freeze(ALICIA_GAMES.map(g=>g.id));
