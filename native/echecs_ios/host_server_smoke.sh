#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
mkdir -p dist/diagnostic
python3 - <<'PY'
from pathlib import Path
original=Path("native/echecs_ios/EchecsJeuxIA.swift").read_text()
start=original.index("private final class OfflineGameServer")
end=original.index("private final class GamesViewController")
server=original[start:end].replace("private final class OfflineGameServer", "final class OfflineGameServer", 1)
Path("dist/diagnostic/OfflineGameServer.swift").write_text("import Foundation\nimport Network\n"+server)
PY
xcrun swiftc -O -framework Network dist/diagnostic/OfflineGameServer.swift native/echecs_ios/host_server_smoke.swift -o dist/diagnostic/host-smoke
dist/diagnostic/host-smoke "$ROOT/dist/Echecs-Jeux-IA-iPhone/Payload/EchecsJeuxIA.app/GameWeb"
