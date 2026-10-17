#!/usr/bin/env python3
"""Assembler les fichiers des jeux sans copier Alicia ni les données privées."""
from pathlib import Path
import shutil
import sys

source = Path(__file__).resolve().parents[2]
destination = Path(sys.argv[1]).resolve()
destination.mkdir(parents=True, exist_ok=True)
allowed = {".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".svg", ".png", ".jpeg", ".jpg", ".webp", ".pdf", ".woff", ".woff2"}
folders = ["assets", "design", "docs"]

for item in source.iterdir():
    if item.is_file() and item.suffix.lower() in allowed:
        shutil.copy2(item, destination / item.name)
for folder in folders:
    origin = source / folder
    if origin.is_dir():
        shutil.copytree(origin, destination / folder, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns(".DS_Store", "__pycache__"))

required = [
    "index.html", "app.js", "engine.js", "mini.js", "shogi-app.js", "shogi-engine.js",
    "go.html", "go.js", "go-persistence.mjs", "dames-francaises.html",
    "dames-francaises.js", "dames-francaises-engine.mjs", "peace.html", "peace.js",
    "peace-puzzles.json", "sw.js", "backup.js",
    "assets/icone-couleur-241-192.png", "assets/icone-couleur-241-512.png"
]
for name in required:
    if not (destination / name).is_file():
        raise RuntimeError(f"Fichier obligatoire absent dans l'IPA: {name}")
if (destination / "assistant-ia").exists():
    raise RuntimeError("Alicia ne doit pas être remplacée par l'application jeux")
# Le bouton « Retour à Alicia » mène à son application indépendante, et non à un
# faux répertoire sur le serveur local des jeux.
for page in destination.glob("*.html"):
    data = page.read_text(encoding="utf-8")
    updated = data.replace('href="./assistant-ia/"',
        'href="https://davidderetour-ai.github.io/echecs-jeux-ia/assistant-ia/"')
    if updated != data:
        page.write_text(updated, encoding="utf-8")

# Dans l'application native, le paquet est déjà disponible hors ligne.
# Ne pas installer un service worker Web supplémentaire qui pourrait
# naviguer automatiquement/recharger une partie après une mise à jour.
# Ces changements portent UNIQUEMENT sur la copie embarquée dans l'IPA :
# le site GitHub Pages/PWA conserve son service worker.
main_js = destination / "app.js"
source_js = main_js.read_text(encoding="utf-8")
register = "if('serviceWorker' in navigator&&("
assert register in source_js, "Le point d'enregistrement du service worker a changé"
main_js.write_text(source_js.replace(register, "if(false&&'serviceWorker' in navigator&&(", 1), encoding="utf-8")

home = destination / "index.html"
source_html = home.read_text(encoding="utf-8")
assert "</head>" in source_html
# Désinscription des anciens SW dans l'origine isolée de WKWebView :
# ne supprime JAMAIS localStorage, cookies ni sauvegardes de jeu.
cleanup = """<script>
window.__iosNativeVersion="3.9.2";
document.documentElement.classList.add('native-ios');
if ('serviceWorker' in navigator) {
 navigator.serviceWorker.getRegistrations().then(function(list){
  return Promise.all(list.map(function(item){return item.unregister()}));
 }).catch(function(){});
}
</script>"""
home.write_text(source_html.replace("</head>",cleanup+"</head>",1),encoding="utf-8")

files = [p for p in destination.rglob("*") if p.is_file()]
print(f"OK : {len(files)} ressources incluses dans le paquet hors ligne.")
