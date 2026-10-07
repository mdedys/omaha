#!/usr/bin/env bash
# Read-only check that this run's server is up, owned by us, from this checkout, and serving the app.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

failed=0
check() {
  if eval "$2" >/dev/null 2>&1; then echo "ok    $1"; else echo "FAIL  $1"; failed=1; fi
}

PID="$(server_pid)"
PORT="$(server_port)"
echo "run '$RUN_ID'  pid=${PID:-none}  port=${PORT:-none}  checkout=$REPO_ROOT"

check "state recorded by launch.sh" '[ -n "$PID" ] && [ -n "$PORT" ]'
check "server process alive" 'pid_alive "$PID"'
check "port $PORT is listened on by pid $PID" 'lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t | grep -qx "$PID"'
check "server runs from this checkout" '[ "$(pid_cwd "$PID")" = "$REPO_ROOT" ]'
check "GET / serves the app shell" 'curl -fsS "http://127.0.0.1:$PORT/" | grep -q "<div id=\"root\">"'
check "GET /src/main.tsx compiles" 'curl -fsS "http://127.0.0.1:$PORT/src/main.tsx" | grep -q createRoot'
check "playwright Chromium installed" '(cd "$REPO_ROOT" && node -e "process.exit(require(\"fs\").existsSync(require(\"playwright\").chromium.executablePath())?0:1)")'

exit $failed
