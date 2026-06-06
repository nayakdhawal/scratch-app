# Scratch — Antinote-inspired Tauri + React

A fast, focused multi-pad scratchpad with inline math and Pomodoro timers.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+T` | New pad |
| `Cmd+W` | Close current pad |
| `Cmd+[` / `Cmd+]` | Switch pads |
| `Cmd+ArrowLeft/Right` | Switch pads |
| `Cmd+1..9` | Jump to pad by number |

## Scratchpad syntax

| Type | Result |
|---|---|
| `500 + 200` | Shows `= 700` inline |
| `20% of 500` | Shows `= 100` |
| `1200 * 3.5 =` | Shows `= 4200` |
| `timer 25` | ▶ button → 25 min countdown |
| `timer pomo` | Full Pomodoro (25m work / 5m break) |
| `timer 1:30` | 1 min 30 sec countdown |
| `# Heading` | Draws a subtle section divider |

## Project structure

```
src/
  App.tsx               — Root layout + global keyboard shortcuts
  usePads.ts            — Multi-pad state (create, close, switch, persist)
  useTimer.ts           — Timer/Pomodoro hook
  mathParser.ts         — Per-line math + timer detection
  assets/
    icon.svg            — Master icon (nib mark)
  components/
    PadTabs.tsx         — Tab bar with close + dot indicators
    Scratchpad.tsx      — Textarea + overlay
    LineOverlay.tsx     — Math results + timer buttons per line
    TimerWidget.tsx     — Floating countdown with ring progress
    StatusBar.tsx       — Bottom bar
src-tauri/
  icons/                — Generated PNGs + ICO for bundling
  tauri.conf.json       — Window + bundle config
  src/main.rs           — Rust entry point
```

## Getting started

```bash
npm install

# UI dev (no Rust compile)
npm run dev

# Full desktop app
npm run tauri dev

# Build .dmg / .exe
npm run tauri build
```

## macOS icon (.icns)

On a Mac, run once to generate the native icon:
```bash
cd src-tauri/icons
mkdir -p Scratch.iconset
sips -z 16 16   icon.png --out Scratch.iconset/icon_16x16.png
sips -z 32 32   icon.png --out Scratch.iconset/icon_16x16@2x.png
sips -z 128 128 icon.png --out Scratch.iconset/icon_128x128.png
sips -z 256 256 icon.png --out Scratch.iconset/icon_128x128@2x.png
sips -z 512 512 icon.png --out Scratch.iconset/icon_512x512.png
iconutil -c icns Scratch.iconset
mv Scratch.iconset.icns icon.icns
```

## Next steps

- **Global hotkey** — `tauri-plugin-global-shortcut` to summon with Option+Space
- **Export** — Obsidian / Bear / plain .txt via Tauri `fs` + URL schemes
- **Upgrade storage** — `tauri-plugin-store` for native OS app data path
