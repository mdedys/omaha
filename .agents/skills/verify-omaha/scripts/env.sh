# Sourced by the other scripts. Resolves the checkout, run ID and directories.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
RUN_ID="${VERIFY_RUN_ID:-local}"
RUN_DIR="${TMPDIR:-/tmp}"
RUN_DIR="${RUN_DIR%/}/omaha-verify/$RUN_ID"
STATE_DIR="$RUN_DIR/state"
EVIDENCE_DIR="${VERIFY_EVIDENCE_DIR:-$RUN_DIR/evidence}"

server_pid() { cat "$STATE_DIR/pid" 2>/dev/null; }
server_port() { cat "$STATE_DIR/port" 2>/dev/null; }
pid_alive() { [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }
pid_cwd() { lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'; }
