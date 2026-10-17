#!/usr/bin/env bash
# FOLDERS: none used here (no scratch path). LEAD_SCRATCH only matters to tools/mk.py and board/*. Needs `gh` logged in.
# watch_deploy.sh <owner/repo> <sha> <workflow name> [health url]: read-only; waits for that workflow's run on <sha>.
repo=$1; sha=$2; wf=$3; url=$4
for i in $(seq 1 120); do
  read -r id st co < <(gh api "repos/$repo/actions/runs?head_sha=$sha&per_page=20" --jq ".workflow_runs[] | select(.name==\"$wf\") | \"\(.id) \(.status) \(.conclusion)\"" 2>/dev/null | head -1)
  if [ "$st" = "completed" ]; then echo "$wf run $id $co"; break; fi
  sleep 30
done
[ -z "$st" ] && echo "no $wf run seen"
gh api "repos/$repo/actions/runs/$id/jobs" --jq '.jobs[] | "\(.name) | \(.conclusion)"' 2>/dev/null
[ -z "$url" ] || echo "health $(curl -s -o /dev/null -w '%{http_code}' "$url")"
