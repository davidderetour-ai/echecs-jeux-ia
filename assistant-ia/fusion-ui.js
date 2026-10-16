/* Alicia Fusion : navigation et page d'accueil. Toutes les fonctions historiques sont conservées. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const q=s=>document.querySelector(s);
 function init(){
  if($("fusion-dashboard"))return;
  const shell=q(".shell"), header=shell?.querySelector("header"), avatar=q(".avatar-shell"), tools=q(".tools"), mode=$("mode");
  if(!shell||!header||!avatar||!tools||!mode)return;
  document.body.classList.add("fusion-on");
  const make=(tag,cls,html)=>{const el=document.createElement(tag);el.className=cls;if(html)el.innerHTML=html;return el;};
  const menu=make("aside","fusion-drawer",'<div class="fusion-drawer-head"><span class="fusion-mark">✦</span><strong>ALICIA</strong><button class="fusion-close" aria-label="Fermer le menu" type="button">✕</button></div><nav class="fusion-menu" aria-label="Navigation Alicia"></nav><hr><p class="fusion-section-caption">ACCÈS AUX OUTILS</p><nav class="fusion-extra" aria-label="Outils Alicia"></nav>');
  menu.id="fusion-drawer";menu.hidden=true;
  const backdrop=make("div","fusion-backdrop");backdrop.hidden=true;
  document.body.append(backdrop,menu);
  function toggle(open){menu.hidden=!open;backdrop.hidden=!open;document.body.classList.toggle("fusion-menu-open",open);}
  const menuButton=make("button","fusion-menu-button","☰");menuButton.type="button";menuButton.setAttribute("aria-label","Ouvrir le menu Alicia");menuButton.setAttribute("aria-controls","fusion-drawer");menuButton.setAttribute("aria-expanded","false");
  header.prepend(menuButton);
  const setMenu=open=>{toggle(open);menuButton.setAttribute("aria-expanded",String(open));};
  menuButton.addEventListener("click",()=>setMenu(menu.hidden));
  menu.querySelector(".fusion-close").addEventListener("click",()=>setMenu(false));
  backdrop.addEventListener("click",()=>setMenu(false));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!menu.hidden)setMenu(false);});
  function jump(selector){setMenu(false);const el=q(selector);if(!el)return false;el.scrollIntoView({behavior:"smooth",block:"start"});return true;}
  function ask(modeValue){mode.value=modeValue;mode.dispatchEvent(new Event("change",{bubbles:true}));jump("#question");$("question")?.focus();}
  function avatarSettings(selector){document.body.classList.add("fusion-controls-open");requestAnimationFrame(()=>jump(selector||".avatar-side"));}
  function item(nav,label,icon,action,unavailable=false){
    const b=make("button","fusion-nav-item","<span aria-hidden='true'>"+icon+"</span><span>"+label+"</span>");
    b.type="button";b.disabled=unavailable;b.addEventListener("click",action);nav.append(b);
  }
  const nav=menu.querySelector(".fusion-menu"),extras=menu.querySelector(".fusion-extra");
  item(nav,"Conversation","◉",()=>jump("#chat-form"));
  item(nav,"Bibliothèque","▤",()=>jump(".feedback"));
  item(nav,"Projets","▱",()=>jump(".design-studio"));
  item(nav,"Outils & plugins","✧",()=>jump(".tool-finder"));
  item(nav,"Planifié (à venir)","◷",()=>{},true);
  item(nav,"Codex","</>",()=>ask("code"));
  item(nav,"Explorer","▦",()=>jump(".tools"));
  item(extras,"Professeur","♧",()=>ask("teach"));
  item(extras,"Réparation","⚒",()=>ask("repair"));
  item(extras,"Réglages","⚙",()=>{setMenu(false);document.body.classList.toggle("fusion-tools-open");jump(".tools");});
  const dashboard=make("section","fusion-dashboard",`
    <div class="fusion-title"><div class="fusion-hero-logo">✦</div><h1>ALICIA</h1><p>Assistant · Code · Diagnostic · Création</p><span class="fusion-ready"><i></i> Alicia est prête</span></div>
    <div class="fusion-section-head"><h2>Accès rapides</h2></div>
    <div class="fusion-grid">
       <button type="button" data-go="voice"><span class="fusion-tile-icon">♩</span><strong>Voix d’Alicia</strong><small>Parler et écouter en français</small></button>
       <button type="button" data-go="emotion"><span class="fusion-tile-icon">♡</span><strong>Émotions</strong><small>Expressions et sons</small></button>
       <button type="button" data-go="expertise"><span class="fusion-tile-icon">♧</span><strong>Mode d’expertise</strong><small>Code, réparation, professeur</small></button>
       <button type="button" data-go="chat"><span class="fusion-tile-icon">▢</span><strong>Conversation</strong><small>Écrire à Alicia</small></button>
    </div>
    <div class="fusion-section-head"><h2>Modes rapides</h2></div>
    <nav class="fusion-modes" aria-label="Modes rapides">
      <button type="button" data-mode="general"><span>★</span>Général</button>
      <button type="button" data-mode="code"><span>⌘</span>Code</button>
      <button type="button" data-mode="repair"><span>⚒</span>Réparation</button>
      <button type="button" data-mode="create"><span>✎</span>Création</button>
      <button type="button" data-mode="teach"><span>▣</span>Professeur</button>
    </nav>`);
  dashboard.id="fusion-dashboard";
  header.after(dashboard);
  dashboard.after(avatar);
  const intro=make("div","fusion-intro",'<h2>Bonjour ! 👋</h2><p>Je suis Alicia, ton assistante. Comment puis-je t’aider aujourd’hui ?</p><span>Portrait 3D animé</span>');
  const ideas=make("div","fusion-ideas",'<button type="button" data-ask="create">💡 Une idée créative ?</button><button type="button" data-ask="repair">🛠 Un problème technique ?</button><button type="button" data-ask="code">⌘ Écrire du code ?</button><button type="button" data-ask="teach">▣ Apprendre ?</button>');
  avatar.insertBefore(intro,q(".avatar-side"));
  avatar.append(ideas);
  dashboard.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{
   switch(b.dataset.go){
    case "voice":avatarSettings(".voice-picker");break;
    case "emotion":avatarSettings(".emotion-controls");break;
    case "expertise":jump(".fusion-modes");break;
    case "chat":jump("#chat-form");$("question")?.focus();break;
   }
  }));
  dashboard.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>ask(b.dataset.mode)));
  ideas.querySelectorAll("[data-ask]").forEach(b=>b.addEventListener("click",()=>ask(b.dataset.ask)));
  function selectMode(){dashboard.querySelectorAll("[data-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===mode.value)));}
  mode.addEventListener("change",selectMode);selectMode();
  // Ne pas effacer notes, historique ni préférences des versions précédentes.
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();