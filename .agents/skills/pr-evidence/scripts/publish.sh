#!/usr/bin/env bash
# Publishes a folder of evidence files as a commit on an evidence branch that
# shares no history with main, and prints a SHA-pinned raw URL for each file.
# Usage: publish.sh <dir> [branch]   (branch defaults to pr-evidence/<current branch>)
set -euo pipefail

DIR="${1:?usage: publish.sh <dir> [branch]}"
DIR="$(cd "$DIR" && pwd)"
HEAD_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BRANCH="${2:-pr-evidence/$HEAD_BRANCH}"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

if [ -z "$(find "$DIR" -type f -print -quit)" ]; then
  echo "$DIR holds no files." >&2
  exit 1
fi

# Parent the commit on the branch's current tip so URLs pinned to earlier
# captures stay reachable and are never garbage-collected.
PARENT=""
if git fetch --quiet origin "refs/heads/$BRANCH" 2>/dev/null; then
  PARENT="$(git rev-parse FETCH_HEAD)"
fi

INDEX="$(mktemp)"
trap 'rm -f "$INDEX"' EXIT
rm -f "$INDEX"
(cd "$DIR" && find . -type f ! -name '.*' | sed 's|^\./||' | sort) |
  while read -r f; do
    blob="$(git hash-object -w "$DIR/$f")"
    GIT_INDEX_FILE="$INDEX" git update-index --add --cacheinfo 100644 "$blob" "$f"
  done
TREE="$(GIT_INDEX_FILE="$INDEX" git write-tree)"
MESSAGE="Evidence for $HEAD_BRANCH at $(git rev-parse --short HEAD)"
COMMIT="$(git commit-tree "$TREE" ${PARENT:+-p "$PARENT"} -m "$MESSAGE")"

git push --quiet origin "$COMMIT:refs/heads/$BRANCH"
echo "Published $BRANCH at $COMMIT" >&2

git ls-tree -r --name-only "$TREE" | while read -r f; do
  echo "https://raw.githubusercontent.com/$REPO/$COMMIT/$f"
done
