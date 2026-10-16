/* Alicia Mac 0.3.2 : avatar 2D animé autonome de secours si WebGL échoue.
 * Ne pas présenter cet affichage comme un modèle 3D natif. */
(function(){
 "use strict";
 window.AliciaFallback=function(){
  const canvas=document.getElementById("alicia-avatar"),status=document.getElementById("avatar-status");
  if(!canvas||canvas.parentElement.querySelector(".alicia-fallback-container"))return;
  canvas.hidden=true;
  if(status)status.textContent="WebGL indisponible : avatar 2D autonome de secours. Voix et messages restent utilisables.";
  const svg=(isBack)=>'<svg viewBox="0 0 260 395" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
     +'<defs><linearGradient id="coat'+(isBack?'b':'f')+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1a3c8c"/><stop offset="1" stop-color="#101633"/></linearGradient></defs>'
     +'<ellipse cx="130" cy="371" rx="76" ry="11" fill="#5b6bfc" opacity=".20"/>'
     +'<path d="M106 245L99 334Q97 352 108 352H127L131 252Z" fill="#121b38"/>'
     +'<path d="M153 245L162 335Q163 352 152 352H133L130 250Z" fill="#141d42"/>'
     +'<ellipse cx="107" cy="352" rx="22" ry="10" fill="#28244e"/>'
     +'<ellipse cx="154" cy="352" rx="22" ry="10" fill="#28244e"/>'
     +'<path d="M91 141Q130 120 169 141L184 248Q130 265 77 248Z" fill="url(#coat'+(isBack?'b':'f')+')" stroke="#5a72f5" stroke-width="3"/>'
     +'<g class="alicia-arm-l"><path d="M88 149L61 236" fill="none" stroke="#27377c" stroke-width="25" stroke-linecap="round"/><ellipse cx="61" cy="244" rx="13" ry="24" fill="#e3a28b"/><path d="M50 254v14M58 257v15M65 257v14M74 252v13" stroke="#e3a28b" stroke-width="5" stroke-linecap="round"/></g>'
     +'<g class="alicia-arm-r"><path d="M171 148L198 231" fill="none" stroke="#27377c" stroke-width="25" stroke-linecap="round"/><ellipse cx="198" cy="242" rx="13" ry="23" fill="#e3a28b"/><path d="M188 252v13M195 256v15M202 255v16M209 251v12" stroke="#e3a28b" stroke-width="5" stroke-linecap="round"/></g>'
     +'<rect x="118" y="124" width="24" height="34" rx="9" fill="#d48e7c"/>'
     +'<ellipse cx="130" cy="88" rx="50" ry="66" fill="#b77a39"/>'
     +(isBack?'<ellipse cx="130" cy="93" rx="52" ry="68" fill="#e5b75d"/><ellipse cx="131" cy="37" rx="28" ry="21" fill="#efc96e"/><path d="M115 178L130 159L145 178L130 196Z" fill="#4fbcff"/>':
       '<ellipse cx="130" cy="90" rx="44" ry="59" fill="#e9b5a0"/>'
      +'<g class="alicia-eyes"><ellipse cx="111" cy="85" rx="11" ry="7" fill="#f5fcff"/><ellipse cx="149" cy="85" rx="11" ry="7" fill="#f5fcff"/>'
      +'<circle cx="111" cy="85" r="5" fill="#38a0ea"/><circle cx="149" cy="85" r="5" fill="#38a0ea"/>'
      +'<circle cx="111" cy="85" r="2" fill="#142044"/><circle cx="149" cy="85" r="2" fill="#142044"/></g>'
      +'<path d="M98 74q12-5 24 0M139 74q11-5 23 0" stroke="#694c35" stroke-width="4" fill="none"/>'
      +'<path class="alicia-mouth" d="M116 122q14 10 28 0q-14 16-28 0" fill="#9a445c"/>'
      +'<path d="M85 63Q80 22 120 16Q172 4 177 68L163 72Q156 33 131 36Q97 34 99 70Z" fill="#f2c26c"/>')
     +'</svg>';
  const view=document.createElement("div");view.className="alicia-fallback-container";
  const figure=document.createElement("div");figure.className="alicia-fallback-figure";
  const front=document.createElement("div");front.className="alicia-fallback-face";
  const back=document.createElement("div");back.className="alicia-fallback-face alicia-fallback-back";
  front.innerHTML=svg(false);back.innerHTML=svg(true);figure.append(front,back);view.append(figure);
  const caption=document.createElement("small");caption.className="alicia-fallback-caption";
  caption.textContent="Affichage de secours animé. La véritable 3D nécessite WebGL.";view.append(caption);
  canvas.parentElement.prepend(view);
 };
})();
