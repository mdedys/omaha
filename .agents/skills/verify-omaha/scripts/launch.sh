#!/usr/bin/env bash
# Starts a Vite dev server for this checkout on a free port and waits until it serves the app.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

if pid_alive "$(server_pid)"; then
  echo "Run '$RUN_ID' already has a server (pid $(server_pid), port $(server_port)). Run cleanup.sh or pick another VERIFY_RUN_ID." >&2
  exit 1
fi

if [ ! -x "$REPO_ROOT/node_modules/.bin/vite" ]; then
  (cd "$REPO_ROOT" && pnpm install --frozen-lockfile)
fi

mkdir -p "$STATE_DIR" "$EVIDENCE_DIR"
PORT="$(node -e 'const s=require("net").createServer().listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"

cd "$REPO_ROOT"
nohup node_modules/.bin/vite --host 127.0.0.1 --port "$PORT" --strictPort \
  >"$STATE_DIR/vite.log" 2>&1 &
echo $! >"$STATE_DIR/pid"
echo "$PORT" >"$STATE_DIR/port"

URL="http://127.0.0.1:$PORT/"
for _ in $(seq 1 60); do
  if curl -fsS "$URL" 2>/dev/null | grep -q '<div id="root">'; then
    echo "$URL" >"$STATE_DIR/url"
    echo "READY $URL (pid $(server_pid), run '$RUN_ID')"
    echo "evidence: $EVIDENCE_DIR"
    exit 0
  fi
  if ! pid_alive "$(server_pid)"; then break; fi
  sleep 0.5
done

echo "Server did not become ready. Log:" >&2
cat "$STATE_DIR/vite.log" >&2
exit 1
