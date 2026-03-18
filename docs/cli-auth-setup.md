# AI CLI Tools - Windows Auth Consolidated Checklist

## Goal

Use one shared authentication setup so AI CLI tools in WSL reuse the same auth files from Windows. This removes the need to log in separately inside WSL.

## Master Checklist

- [x] Windows auth directories are the source of truth
- [x] WSL config paths are linked to the matching Windows directories
- [x] Installed AI CLIs in WSL can reuse the same shared auth state
- [x] No separate WSL re-login is required after authenticating in Windows

## Linked Paths Checklist

| Status | WSL Path | Windows Path |
|--------|----------|--------------|
| [x] | `~/.gemini` | `C:\Users\NeilEdwardBaja\.gemini` |
| [x] | `~/.qwen-code` | `C:\Users\NeilEdwardBaja\.qwen` |
| [x] | `~/.codex` | `C:\Users\NeilEdwardBaja\.codex` |
| [x] | `~/.claude` | `C:\Users\NeilEdwardBaja\AppData\Roaming\Claude` |
| [x] | `~/.kiro` | `C:\Users\NeilEdwardBaja\.kiro` |

## Installed Tools Checklist

| Status | Tool | Version | Command |
|--------|------|---------|---------|
| [x] | Kiro CLI | `1.27.2` | `kiro-cli` |
| [x] | Qwen Code CLI | `0.12.3` | `qwen` |
| [x] | Gemini CLI | `0.33.1` | `gemini` |
| [x] | OpenAI Codex CLI | `0.114.0` | `codex` |
| [x] | Claude Code CLI | `2.1.76` | `claude` |

## Daily Use Checklist

1. [ ] Authenticate the required CLI on Windows.
2. [ ] Open WSL with `wsl -d Ubuntu`.
3. [ ] Run the same CLI in WSL.
4. [ ] Confirm the session works without another login prompt.

## WSL Commands

```bash
wsl -d Ubuntu

kiro-cli
qwen
gemini
codex
claude
```

## Recovery Checklist

Use this only if the WSL links need to be recreated.

1. [ ] Remove existing WSL config directories.
2. [ ] Recreate each symlink to the matching Windows auth directory.
3. [ ] Reload shell configuration if PATH changes were added.

```bash
rm -rf ~/.gemini ~/.qwen-code ~/.codex ~/.claude ~/.kiro

ln -s /mnt/c/Users/NeilEdwardBaja/.gemini ~/.gemini
ln -s /mnt/c/Users/NeilEdwardBaja/.qwen ~/.qwen-code
ln -s /mnt/c/Users/NeilEdwardBaja/.codex ~/.codex
ln -s /mnt/c/Users/NeilEdwardBaja/AppData/Roaming/Claude ~/.claude
ln -s /mnt/c/Users/NeilEdwardBaja/.kiro ~/.kiro

echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

## Operating Notes

- Windows is mounted in WSL at `/mnt/c/`.
- Auth files remain readable and writable from both environments.
- Keep Windows available while using the linked CLIs from WSL.
- History, sessions, and settings are shared because the config paths point to the same files.
