#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not inside a git repository."
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
echo "== Repo check =="
echo "Branch: ${branch}"

echo
echo "== Fetch =="
git fetch --all --prune

echo
echo "== Status =="
git status -sb

echo
echo "== Upstream =="
if ! upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"; then
  echo "❌ This branch has no upstream configured."
  echo "Suggestion: git branch --set-upstream-to origin/${branch} ${branch}"
  exit 1
fi

echo "Upstream: ${upstream}"

ahead="$(git rev-list --count "${upstream}..HEAD")"
behind="$(git rev-list --count "HEAD..${upstream}")"

echo
echo "== Pending commits =="
echo "Ahead (local not pushed): ${ahead}"
echo "Behind (remote not pulled): ${behind}"

echo
echo "== Untracked files =="
git ls-files --others --exclude-standard || true

echo
echo "== Result =="
if [[ "${ahead}" == "0" && "${behind}" == "0" ]]; then
  echo "✅ Synced with remote by commits."
else
  echo "⚠️ Not fully synced. Review pending commits above."
  exit 2
fi
