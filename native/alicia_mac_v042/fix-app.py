#!/usr/bin/env python3
"""Corrige UNIQUEMENT l'interface empaquetée pour Alicia Mac 0.4.2.
La version Safari pour iPhone reste inchangée.
"""
from pathlib import Path
import os
root=Path(os.environ["RUNNER_TEMP"])/"Alicia V0.4.2.app"/"Contents"/"Resources"/"Web"
index=root/"index.html"
html=index.read_text(encoding="utf-8")
assert 'id="connection-mode"' in html and 'id="puter-panel"' in html
assert '<script src="./puter-engine.js" defer></script>' in html
# Supprime entièrement le moteur navigateur Puter pour Mac. La connexion native est autonome.
html=html.replace('<script src="./puter-engine.js" defer></script>',"",1)
# Ancien outil de diagnostics Puter/WebKit non pertinent avec le nouveau moteur natif.
html=html.replace('<script src="./mac-ai.js" defer></script>',"",1)
html=html.replace('id="network-label">Vérification du réseau…', 'id="network-label">Réseau du Mac (non vérifié)')

html=html.replace(
    '<small id="connection-status" role="status">',
    '<a class="alicia-v042-connection-link" href="#puter-panel">🔑 Configurer la connexion IA native sur mon Mac ↓</a><small id="connection-status" role="status">',
    1
)
html=html.replace(
    '<a href="./installer-iphone.html" class="iphone-install-guide">📲 Installer Alicia sur l’écran d’accueil iPhone — guide</a>',
    '<span class="alicia-v042-platform">Alicia pour macOS Big Sur Intel · version V0.4.2</span>',
    1
)
html=html.replace('>v0.6.1</span>','>Mac V0.4.2</span>',1)
html=html.replace('id="app-version-label">Version 0.6.1','id="app-version-label">Application Mac V0.4.2 · moteur Web 0.6.1',1)
html=html.replace('id="puter-panel" class="puter-panel" hidden', 'id="puter-panel" class="puter-panel" hidden', 1)
assert 'Configuer' not in html and 'Configurer la connexion IA native' in html
index.write_text(html,encoding="utf-8")

wifi=root/"wifi-policy.js"
src=wifi.read_text(encoding="utf-8")
needle='(()=>{\n"use strict";'
assert needle in src, "Structure du module Wi-Fi modifiée"
mac_only=r'''
if(window.AliciaNativeMac){
 const $=id=>document.getElementById(id);
 const setLabel=()=>{
   const online=navigator.onLine!==false;
   if($("network-label"))$("network-label").textContent=online
     ?"Mac connecté au réseau · Internet Puter à vérifier":"Mac hors ligne";
   if($("network-icon"))$("network-icon").textContent=online?"🌐":"◌";
   if($("network-dot"))$("network-dot").className="network-dot "+(online?"unknown":"offline");
   if($("wifi-state"))$("wifi-state").textContent=online
     ?"Cette interface Mac ne peut pas certifier le type de réseau. Pour l'IA, utilise le moteur natif et le compte Puter dans le panneau ci-dessous."
     :"Le Mac semble hors ligne. Reconnecte le Wi-Fi ou Ethernet.";
   if($("wifi-confirm"))$("wifi-confirm").hidden=true;
   if($("network-choice"))$("network-choice").disabled=true;
 };
 window.AliciaWiFi={
   isApproved:()=>navigator.onLine!==false,
   requireConfirmed(){if(navigator.onLine===false)throw Error("Connexion Internet indisponible sur ce Mac.");},
   show:setLabel,
   reconnectIfVerifiedWiFi:setLabel,
   networkType:()=>"unknown",
   selectedType:()=>({type:"unknown",observed:false}),
   updateAuth(){setLabel();}
 };
 setLabel();
 window.addEventListener("online",setLabel);
 window.addEventListener("offline",setLabel);
 // Aucun chargement automatique de Puter.js sur macOS ; Swift URLSession effectue les requêtes.
 return;
}
'''
src=src.replace(needle,needle+'\n'+mac_only,1)
wifi.write_text(src,encoding="utf-8")
# S'assurer que le moteur natif est présent et que les anciens scripts ne seront pas chargés.
assert (root/"native-puter-bridge.js").is_file()
assert 'script src="./native-puter-bridge.js"' in html
assert 'src="./puter-engine.js"' not in html
assert 'src="./mac-ai.js"' not in html
print("V0.4.2 : moteur Puter.js désactivé sur Mac, raccourci natif visible, Wi-Fi explicite.")
