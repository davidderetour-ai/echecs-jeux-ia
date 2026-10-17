/* Sauvegardes Go locales, par taille de goban. Aucune donnée envoyée sur Internet. */
const PREFIX="alicia-go-save-v1-";
const SIZES=new Set([9,13,19]);
const boardOK=(board,n)=>Array.isArray(board)&&board.length===n&&board.every(row=>Array.isArray(row)&&row.length===n&&row.every(v=>v===0||v===1||v===2));
const capturesOK=a=>Array.isArray(a)&&a.length===3&&a.every(x=>Number.isSafeInteger(x)&&x>=0);
export function goStorageKey(size){
 if(!SIZES.has(size))throw new RangeError("Taille de Go non prise en charge");
 return PREFIX+size;
}
function validHistory(history,n){
 return Array.isArray(history)&&history.length<=120&&history.every(h=>
  h&&boardOK(h.b,n)&&(h.turn===1||h.turn===2)&&capturesOK(h.captures)&&
  Number.isInteger(h.passes)&&h.passes>=0&&h.passes<=2&&typeof h.ended==="boolean"&&
  typeof h.key==="string"&&h.key.length===n*n&&/^[012]+$/.test(h.key));
}
export function validGoState(state,size){
 return !!state&&state.schema===1&&state.size===size&&boardOK(state.board,size)&&
  (state.turn===1||state.turn===2)&&capturesOK(state.captures)&&
  Number.isInteger(state.passes)&&state.passes>=0&&state.passes<=2&&
  typeof state.ended==="boolean"&&["bot","local"].includes(state.mode)&&
  validHistory(state.history,size);
}
export function readGoSave(size,storage=null){
 try{
  const raw=(storage??globalThis.localStorage)?.getItem(goStorageKey(size));
  if(!raw||raw.length>250000)return null;
  const value=JSON.parse(raw);
  return validGoState(value,size)?value:null;
 }catch{return null;}
}
export function writeGoSave(size,state,storage=null){
 try{
  const value={...state,schema:1,size,history:(state?.history||[]).slice(-120)};
  if(!validGoState(value,size))return false;
  (storage??globalThis.localStorage)?.setItem(goStorageKey(size),JSON.stringify(value));
  return true;
 }catch{return false;}
}
