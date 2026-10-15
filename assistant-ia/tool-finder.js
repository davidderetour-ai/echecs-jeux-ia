/* Catalogue de logiciels libres : recommendations locales, aucun téléchargement automatique. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const items=[
["Godot","Créer des jeux vidéo 2D et 3D","https://github.com/godotengine/godot","jeu jeux video videogame moteur 2d 3d plateforme rpg simulation"],
["Blender","Modélisation, animation et rendu 3D","https://github.com/blender/blender","3d avatar femme visage animation objet modeliser render personnage video"],
["Kdenlive","Montage vidéo avec pistes audio et sous-titres","https://github.com/KDE/kdenlive","video montage film montage video transition sous titre"],
["FFmpeg","Assembler, convertir et traiter audio/vidéo","https://github.com/FFmpeg/FFmpeg","video audio encoder transcodage convertir exporter extrait sous titre format"],
["whisper.cpp","Transcription et sous-titrage de voix avec modèle local","https://github.com/ggml-org/whisper.cpp","traduction transcription dictee parole audio sous titre reconnaissance langues offline"],
["Piper","Synthèse vocale locale, si voix compatible disponible","https://github.com/rhasspy/piper","voix parler synthese vocal speech tts francais doux"],
["LibreTranslate","Service de traduction de textes auto-hébergeable","https://github.com/LibreTranslate/LibreTranslate","traduction texte anglais francais traduire multilingue"],
["OpenCV","Vision par ordinateur et analyse d'images","https://github.com/opencv/opencv","image photo perspective camera ordinateur vision stereovision detection calibrage"],
["Tesseract OCR","Reconnaissance de texte dans des images","https://github.com/tesseract-ocr/tesseract","ocr texte image photo lecture cotation scan"],
["three.js","Rendu 3D interactif dans le navigateur","https://github.com/mrdoob/three.js","3d webgl avatar personnage navigateur animation"],
["Ollama","Utiliser un modèle conversationnel local sur ordinateur","https://github.com/ollama/ollama","ia hors ligne local modèle llm programmation assistant ordinateur"],
["Krita","Peinture et illustration numérique","https://github.com/KDE/krita","image dessin illustration concept art texture graphisme"],
["Audacity","Enregistrement et montage de son","https://github.com/audacity/audacity","audio son enregistrer voix bruitage musique"],
["OBS Studio","Capturer l'écran et enregistrer une vidéo","https://github.com/obsproject/obs-studio","enregistrer video capture ecran streaming"],
["GDevelop","Créer des jeux vidéo avec peu de code","https://github.com/4ian/GDevelop","jeu jeux debutant enfant sans code 2d programmation"]
].map(([name,description,url,terms])=>({name,description,url,terms}));
const normal=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
function rank(question){
 const q=normal(question);
 const words=q.split(/\s+/).filter(w=>w.length>2);
 if(!words.length)return [];
 return items.map(tool=>{
  const name=normal(tool.name),terms=normal(tool.terms),desc=normal(tool.description);
  let score=0;
  for(const word of words){
   if(name.includes(word))score+=6;
   if(terms.split(" ").includes(word))score+=5;
   else if(word.length>=4&&terms.includes(word))score+=2;
   if(desc.includes(word))score+=2;
  }
  return {tool,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.tool);
}
function present(question){
 const box=$("tool-results");if(!box)return;
 box.replaceChildren();
 const results=rank(question);
 if(!results.length){const p=document.createElement("p");p.textContent="Aucun outil local identifié. Essaie des mots-clés comme jeu, traduction, vidéo, voix, 3D ou OCR.";box.append(p);return;}
 const title=document.createElement("p");title.textContent="Outils libres possibles — vérifier leur compatibilité et leurs licences avant installation :";box.append(title);
 for(const item of results){
  const div=document.createElement("div");div.className="tool-result";
  const strong=document.createElement("strong");strong.textContent=item.name;
  const desc=document.createElement("span");desc.textContent=item.description;
  const link=document.createElement("a");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Voir le projet sur GitHub ↗";
  div.append(strong,desc,link);box.append(div);
 }
}
function searchOnGitHub(){
 const query=$("tool-query")?.value.trim();if(!query)return;
 const url="https://github.com/search?q="+encodeURIComponent(query)+"&type=repositories";
 window.open(url,"_blank","noopener,noreferrer");
}
window.AliciaTools={rank,suggestForTask:question=>{
 const panel=$("tool-finder");const query=$("tool-query");
 if(query)query.value=question.slice(0,180);
 if(rank(question).length){if(panel)panel.open=true;present(question)}
}};
$("find-tools")?.addEventListener("click",()=>present($("tool-query")?.value||""));
$("find-online")?.addEventListener("click",searchOnGitHub);
$("tool-query")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();present(e.target.value)}});
})();