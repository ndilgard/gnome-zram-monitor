# ZRAM Monitor

A tiny GNOME Shell extension that shows live zram usage and compression ratio
in the top panel.

Reads `/sys/block/zram0/mm_stat` every 3 seconds and displays memory used by
zram (in MiB) and the current compression ratio, e.g. `zram: 189MiB (4.57x)`.

## Requirements

- GNOME Shell 51 (tested)
- zram configured as `zram0` (the default on most distros, including Arch's
  `zram-generator` setup)

## Install (manual, for development)

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/zram-monitor@nate.local
cp zram-monitor@nate.local/* ~/.local/share/gnome-shell/extensions/zram-monitor@nate.local/
gnome-extensions enable zram-monitor@nate.local
```

Then log out/in (or `Alt+F2` → `r` → Enter on X11) to reload GNOME Shell.

## Porting to a new GNOME version

GNOME Shell extension APIs change across major releases. If `shell-version`
in `metadata.json` doesn't include your version, start there — check the
[GNOME Shell extension porting guide](https://gjs.guide/extensions/upgrading/)
for what changed since 51.
