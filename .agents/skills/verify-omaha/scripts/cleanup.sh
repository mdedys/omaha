#!/usr/bin/env bash
# Stops the server this run started, keeps its log as evidence, and removes the run's scratch state.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

PID="$(server_pid)"
if pid_alive "$PID"; then
  if [ "$(pid_cwd "$PID")" = "$REPO_ROOT" ] && ps -o command= -p "$PID" | grep -q vite; then
    kill "$PID"
    for _ in $(seq 1 20); do pid_alive "$PID" || break; sleep 0.25; done
    pid_alive "$PID" && kill -9 "$PID"
    echo "stopped vite pid $PID"
  else
    echo "pid $PID is not this run's vite server; leaving it alone" >&2
  fi
fi

if [ -f "$STATE_DIR/vite.log" ]; then
  mkdir -p "$EVIDENCE_DIR"
  cp "$STATE_DIR/vite.log" "$EVIDENCE_DIR/vite-$RUN_ID.log"
fi
rm -rf "$STATE_DIR"
rmdir "$RUN_DIR" 2>/dev/null
echo "evidence kept at $EVIDENCE_DIR"
