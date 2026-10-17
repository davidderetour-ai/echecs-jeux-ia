/* Même lancement plein écran pour Go, Dames et défis.
 * Option de retour toujours visible. Ne touche jamais aux sauvegardes.
 */
const q=new URLSearchParams(location.search);
if(q.get('launch')==='1'){
 const kind=location.pathname.endsWith('/go.html')?'go':location.pathname.endsWith('/dames-francaises.html')?'dames':'peace';
 const id=kind==='go'?'go'+([9,13,19].includes(Number(q.get('goban')))?q.get('goban'):'9'):kind==='dames'?'dames10':'peace';
 const bridge=(flag)=>{try{window.webkit?.messageHandlers?.gameDisplay?.postMessage(flag);}catch{}};
 const useFullscreen=(on)=>{document.body.classList.toggle('standalone-fullscreen',on);bridge(on);};
 document.addEventListener('DOMContentLoaded',()=>{
   const bar=document.createElement('nav');bar.className='standalone-launch-bar';
   bar.setAttribute('aria-label','Commandes du jeu');
   bar.innerHTML='<a href="index.html?prepare='+encodeURIComponent(id)+'">⚙ Options</a>'+
     '<button type="button" id="standalone-fullscreen-toggle">⤢ Réduire</button>';
   document.body.append(bar);
   const btn=bar.querySelector('button');
   btn.onclick=()=>{const next=!document.body.classList.contains('standalone-fullscreen');useFullscreen(next);btn.textContent=next?'⤢ Réduire':'⛶ Plein écran';};
   if(kind==='go'){
     const size=document.getElementById('size'),mode=document.getElementById('gomode');
     const target=Number(q.get('goban'));
     if([9,13,19].includes(target)&&Number(size?.value)!==target){size.value=String(target);size.dispatchEvent(new Event('change',{bubbles:true}));}
     const desired=q.get('mode')==='local'?'local':q.get('mode')==='duel'?'duel':'bot';
     if(mode&&mode.value!==desired){mode.value=desired;mode.dispatchEvent(new Event('change',{bubbles:true}));}
     if(q.get('role')==='training'||q.get('role')==='partner'){
       const help=document.getElementById('goadvice');if(help)help.checked=true;
     }
   }else if(kind==='dames'){
     const level=document.getElementById('levels'),n=Number(q.get('level'));
     if(level&&Number.isInteger(n)&&n>=1&&n<=5&&Number(level.value)!==n){
       level.value=String(n);level.dispatchEvent(new Event('change',{bubbles:true}));
     }
   }else if(kind==='peace'){
     const mode=document.getElementById('peacemode');
     if(mode&&q.get('mode')==='duo'){mode.value='duo';mode.dispatchEvent(new Event('change',{bubbles:true}));}
   }
   const switcher=kind==='go'?document.getElementById('go-view-switch'):kind==='peace'?document.getElementById('peace-view-switch'):null;
   if(q.get('view')==='2d'&&switcher&&switcher.getAttribute('aria-pressed')==='true')switcher.click();
   useFullscreen(true);
   window.addEventListener('pagehide',()=>bridge(false),{once:true});
 });
}
