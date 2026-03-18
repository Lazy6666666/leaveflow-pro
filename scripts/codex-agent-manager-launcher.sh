#!/usr/bin/env bash
set -euo pipefail

# Ensure core MSYS2 utilities are on PATH even in minimal login shells.
export PATH="/usr/bin:/bin:${PATH:-}"

# Make Windows-installed Node + npm global bin available inside MSYS2 tmux.
# This lets agent-manager spawn Codex even when MSYS2 doesn't import Windows PATH.
win_home="${USERPROFILE:-}"
if [ -n "$win_home" ] && command -v cygpath >/dev/null 2>&1; then
  home_u="$(cygpath -u "$win_home")"
else
  # Fallback for environments where USERPROFILE/cygpath aren't available.
  home_u="/c/Users/NeilEdwardBaja"
fi

export HOME="${home_u}"
export PATH="${home_u}/scoop/apps/nodejs-lts/current:${home_u}/AppData/Roaming/npm:${PATH}"

exec "${home_u}/AppData/Roaming/npm/codex" "$@"
