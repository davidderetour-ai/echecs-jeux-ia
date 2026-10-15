#!/usr/bin/env python3
"""À lancer après 'flutter create --platforms=android,ios .' .
Permissions mobiles explicites : réseau, reconnaissance de la voix.
Pas de droits caméra, localisation, contacts ou accès aux autres applications.
"""
from pathlib import Path
import plistlib
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ANDROID = ROOT / "android/app/src/main/AndroidManifest.xml"
IOS = ROOT / "ios/Runner/Info.plist"

if ANDROID.exists():
    NS = "http://schemas.android.com/apk/res/android"
    ET.register_namespace("android", NS)
    tree = ET.parse(ANDROID)
    manifest = tree.getroot()
    for p in ("android.permission.INTERNET",
              "android.permission.ACCESS_NETWORK_STATE",
              "android.permission.RECORD_AUDIO"):
        if not any(e.get(f"{{{NS}}}name") == p for e in manifest.findall("uses-permission")):
            manifest.insert(0, ET.Element("uses-permission", {f"{{{NS}}}name": p}))
    queries = manifest.find("queries")
    if queries is None:
        queries = ET.Element("queries")
        manifest.append(queries)
    for action in ("android.speech.RecognitionService", "android.intent.action.TTS_SERVICE"):
        if any(i.find(f"./action[@{{{NS}}}name='{action}']") is not None
               for i in queries.findall("intent")):
            continue
        intent = ET.SubElement(queries, "intent")
        ET.SubElement(intent, "action", {f"{{{NS}}}name": action})
    tree.write(ANDROID, encoding="utf-8", xml_declaration=True)
    print("Android: réseau et microphone configurés")

if IOS.exists():
    with IOS.open("rb") as src:
        data = plistlib.load(src)
    data["NSMicrophoneUsageDescription"] = (
        "Alicia utilise le microphone seulement pour dicter un message sur votre demande.")
    data["NSSpeechRecognitionUsageDescription"] = (
        "Alicia reconnaît les mots dictés pour remplir le champ de conversation.")
    with IOS.open("wb") as dst:
        plistlib.dump(data, dst)
    print("iOS: mentions de confidentialité microphone et reconnaissance vocale configurées")
