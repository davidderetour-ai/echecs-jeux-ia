/* Interface de préparation commune aux 17 jeux. */
import {gameSetupSpec,safeSetup} from './game-setup.mjs';
import {GAME_BOT_PROFILES,GAME_BOT_NOTE} from './game-bots.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const choice=(label,key,value,selected)=>'<button type="button" class="setup-choice'+(selected?' selected':'')+'" data-setup-'+key+'="'+esc(value)+'" aria-pressed="'+selected+'">'+label+'</button>';
const buttons=(pairs,key,current)=>pairs.map(([value,label])=>choice(label,key,value,String(value)===String(current))).join('');
const block=(title,contents,subtitle='')=>'<section class="setup-section"><h2>'+title+'</h2>'+contents+(subtitle?'<p class="setup-hint">'+subtitle+'</p>':'')+'</section>';
const viewOptions=[['2d','▦ Vue 2D tactile'],['3d','◈ Vue 3D si disponible']];
const roleOptions=[['opponent','♟ Adversaire'],['partner','🤝 Partenaire'],['training','🎓 Entraîneuse']];
export function renderGamePreparation(gameId,pending,rules){
 const spec=gameSetupSpec(gameId);if(!spec)return '<div class="card"><p>Choisis un jeu sur l’accueil.</p><button data-tab="home">Retour</button></div>';
 const v=safeSetup(gameId,pending||{});
 const modeOptions=[['ai','🤖 Contre Alicia'],['local','👥 Deux joueurs sur cet appareil'],['solo','🧩 Seul'],['duo','🤝 En coopération'],['duel','🎮 Alicia contre une autre IA']];
 const modes=modeOptions.filter(([id])=>spec.modes.includes(id));
 let html=block('Qui joue ?',buttons(modes,'mode',v.mode));
 if(spec.supportsRoles&&v.mode==='ai')html+=block("Rôle d'Alicia",buttons(roleOptions,'role',v.role));
 if(spec.chooseBot&&(v.mode==='ai'||v.mode==='duel'))html+=block(v.mode==='duel'?"Choisir l’adversaire d’Alicia":"Choisir ton adversaire IA",
  buttons(GAME_BOT_PROFILES.map(p=>[p.id,p.name+' · '+p.desc]),'bot',v.bot),
  v.mode==='duel'?"Alicia joue le premier camp et ton IA sélectionnée joue le suivant. La partie avance automatiquement.":GAME_BOT_NOTE);
 if(spec.maxLevel)html+=block("Niveau de l'IA",buttons(Array.from({length:spec.maxLevel},(_,i)=>[i+1,'Niveau '+(i+1)]),'level',v.level),'Niveaux disponibles pour ce moteur local.');
 if(spec.rules)html+=block('Règles des échecs à 4','<label class="setup-label">Règlement <select data-setup-rules>'+rules.map(([id,title])=>'<option value="'+esc(id)+'"'+(v.rules===id?' selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>');
 if(spec.canChooseGoban)html+=block('Taille du plateau',buttons([[9,'9 × 9'],[13,'13 × 13'],[19,'19 × 19']],'goban',v.goban),'Chaque goban conserve sa propre sauvegarde.');
 if(spec.clock)html+=block('Minuteur',buttons([['false','Sans minuteur'],['true','Avec minuteur']],'clock',v.clock));
 if(spec.canChangeView)html+=block('Affichage',buttons(viewOptions,'view',v.view));
 return '<section class="setup-screen" aria-label="Préparation '+esc(spec.label)+'"><div class="setup-step"><button type="button" data-tab="home">← Tous les jeux</button><span>Avant de jouer</span></div>'+
 '<h1>⚙ Préparer ma partie</h1><p class="setup-subtitle"><strong>'+esc(spec.label)+'</strong> · Choisis tes options avant de lancer.</p>'+
 '<div class="setup-form">'+html+'</div>'+
 '<div class="setup-actions"><button class="setup-launch" data-action="launch-configured-game">▶ Jouer en plein écran</button><button class="setup-cancel" data-tab="home">Annuler</button></div>'+
 '<p class="setup-hint">Les options restent modifiables. Tes parties précédentes sont conservées selon les sauvegardes du jeu.</p></section>';
}
