---
name: main
description: Reserved main agent (Codex via MSYS2 launcher wrapper)
working_directory: ${REPO_ROOT}
launcher: ${REPO_ROOT}/scripts/codex-agent-manager-launcher.sh
launcher_args:
  - --no-alt-screen
  - --full-auto
---

# MAIN AGENT

This file exists to override the default `launcher: codex` behavior so the agent can start
reliably inside MSYS2 tmux sessions on Windows (PATH + Node bridging).

