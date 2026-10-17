#!/usr/bin/env python3
"""Vérification statique des chemins clés de l'application iOS locale."""
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
for entry in ("index.html", "go.html", "peace.html", "dames-francaises.html"):
    page = (root / entry).read_text(encoding="utf-8")
    assert "<html" in page.lower(), entry
    for path in re.findall(r'(?:src|href)="(\.[^"]+|[a-zA-Z0-9][^":?#]*\.(?:js|mjs|css|json|png|webmanifest))(?:\?[^"]*)?"', page):
        path = path.partition("?")[0]
        if path.endswith("/") or path.startswith("./assistant-ia/"):
            continue  # lien vers Alicia ou dossier, pas une ressource locale de jeu
        assert (root / path).is_file(), f"{entry} -> {path}"

# Le moteur local JS utilise des modules ES : tous les imports relatifs doivent être embarqués.
for file in list(root.glob("*.js")) + list(root.glob("*.mjs")):
    text = file.read_text(encoding="utf-8")
    for path in re.findall(r'\b(?:import|export)\s+(?:[^;]*?\s+from\s+)?[\'"](\./[^\'"]+)[\'"]', text):
        assert (file.parent / path).is_file(), f"{file.name} -> {path}"

assert (root / "backup.js").exists(), "Import / export des sauvegardes absent"
assert (root / "go-persistence.mjs").exists(), "Sauvegardes des trois Go absentes"
assert not (root / "assistant-ia").exists(), "L'interface Alicia ne doit pas être écrasée"
assert 'window.__iosNativeVersion="3.8.8"' in (root / "index.html").read_text(encoding="utf-8"), "Marqueur native IPA absent"
assert "if(false&&'serviceWorker' in navigator" in (root / "app.js").read_text(encoding="utf-8"), "Service worker PWA encore actif dans l'app native"
print("OK : ressources principales, imports JS et sauvegardes présents dans l'IPA.")
