#!/usr/bin/env bash
# FOLDERS: none used here (no scratch path). LEAD_SCRATCH only matters to tools/mk.py and board/*. Needs `gh` logged in.
# wait_ci.sh <owner/repo> <sha> [min_runs]: waits (no tokens) until every check run on <sha> has completed,
# then prints one line per run and a last line "CI GREEN" or "CI RED: <names>". Gives up after 90 minutes.
repo=$1; sha=$2; min=${3:-1}
for i in $(seq 1 180); do
  out=$(gh api "repos/$repo/commits/$sha/check-runs?per_page=100" --jq '.check_runs[] | "\(.name) | \(.status) | \(.conclusion)"' 2>/dev/null)
  n=$(printf "%s\n" "$out" | grep -c '|')
  if [ "$n" -ge "$min" ] && ! printf "%s\n" "$out" | grep -qE '\| (queued|in_progress|waiting|pending) \|'; then
    printf "%s\n" "$out"
    red=$(printf "%s\n" "$out" | grep -E '\| (failure|timed_out|cancelled|action_required) *$' | cut -d'|' -f1 | sed 's/ *$//' | paste -sd, -)
    [ -z "$red" ] && echo "CI GREEN" || echo "CI RED: $red"; exit 0
  fi
  sleep 30
done
echo "$out"; echo "CI TIMEOUT"
