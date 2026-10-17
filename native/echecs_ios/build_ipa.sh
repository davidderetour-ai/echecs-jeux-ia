#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"
OUT="$REPO/dist/Echecs-Jeux-IA-iPhone"
APP="$OUT/Payload/EchecsJeuxIA.app"
rm -rf "$OUT"
mkdir -p "$APP/GameWeb"
python3 native/echecs_ios/prepare_web.py "$APP/GameWeb"
python3 native/echecs_ios/test_bundle.py "$APP/GameWeb"
cat > "$APP/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDevelopmentRegion</key><string>fr</string>
  <key>CFBundleExecutable</key><string>EchecsJeuxIA</string>
  <key>CFBundleIdentifier</key><string>fr.echecsjeuxia.iphone.native</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>Échecs &amp; Jeux IA</string>
  <key>CFBundleDisplayName</key><string>Échecs &amp; Jeux IA</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>3.8.8</string>
  <key>CFBundleVersion</key><string>3863</string>
  <key>LSRequiresIPhoneOS</key><true/>
  <key>MinimumOSVersion</key><string>15.0</string>
  <key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array>
  <key>UIRequiredDeviceCapabilities</key><array><string>arm64</string></array>
  <key>NSAppTransportSecurity</key><dict>
    <key>NSAllowsLocalNetworking</key><true/>
  </dict>
  <key>CFBundleIcons</key><dict>
    <key>CFBundlePrimaryIcon</key><dict>
      <key>CFBundleIconFiles</key><array>
        <string>AppIcon120</string><string>AppIcon180</string>
      </array>
      <key>UIPrerenderedIcon</key><true/>
    </dict>
  </dict>
</dict></plist>
PLIST
plutil -lint "$APP/Info.plist"
sips -s format png -z 120 120 assets/icone-couleur-241-512.png --out "$APP/AppIcon120.png" >/dev/null
sips -s format png -z 180 180 assets/icone-couleur-241-512.png --out "$APP/AppIcon180.png" >/dev/null
SDK="$(xcrun --sdk iphoneos --show-sdk-path)"
xcrun --sdk iphoneos swiftc \
  -parse-as-library -O \
  -target arm64-apple-ios15.0 \
  -sdk "$SDK" \
  -framework UIKit -framework WebKit -framework Network \
  native/echecs_ios/EchecsJeuxIA.swift \
  -o "$APP/EchecsJeuxIA"
chmod 755 "$APP/EchecsJeuxIA"
file "$APP/EchecsJeuxIA"
# AltStore assure la signature gratuite lors de l'installation ; IPA ici volontairement non signée.
(cd "$OUT" && zip -qry Echecs-Jeux-IA-iPhone-unsigned.ipa Payload)
test -s "$OUT/Echecs-Jeux-IA-iPhone-unsigned.ipa"
unzip -l "$OUT/Echecs-Jeux-IA-iPhone-unsigned.ipa" | grep -q 'Payload/EchecsJeuxIA.app/GameWeb/index.html'
echo "OK : IPA native créée. Installation physique et renouvellement AltStore non testés."
