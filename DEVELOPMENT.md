# AuraOS Development

## Prerequisites

### All platforms

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) stable — install with `make deps-rust`
- npm

Verify tools:

```bash
make doctor
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install pkg-config libdbus-1-dev libwebkit2gtk-4.1-dev \
  build-essential libssl-dev libgtk-3-dev libayatana-appindicator3-dev \
  librsvg2-dev libx11-dev libxi-dev libxtst-dev
```

Optional for global cursor tracking (Mochi follow-cursor):

```bash
# Enable device_query in Cargo.toml, then:
sudo apt install libx11-dev
```

### macOS

```bash
xcode-select --install
```

### Windows

- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## Quick start

```bash
make deps-rust  # first time only, if cargo is missing
make install
make doctor
make dev
```

This opens two windows:

1. **Settings** — pick your companion (Mochi, Pixel, Sakura, Nova, Ember)
2. **Overlay** — transparent desktop companion with VRM 3D avatar (or emoji fallback)

## VRM models

Free CC0 models are bundled for all launch characters. To re-download:

```bash
make models
```

See [characters/MODELS.md](characters/MODELS.md) for sources and how to swap models.

## Project structure

```
aura/
├── characters/              # Character packs (definition.json + manifest)
│   ├── manifest.json
│   ├── mochi/
│   ├── pixel/
│   ├── sakura/
│   ├── nova/
│   └── ember/
├── src/
│   ├── character/
│   │   ├── engine/          # Animation, physics, input, spawner
│   │   ├── renderer/        # Three.js SceneManager + placeholder meshes
│   │   ├── components/      # Overlay UI, widgets, speech bubbles
│   │   ├── hooks/           # Bootstrap + Tauri invoke
│   │   └── store/           # Zustand character state
│   ├── settings/            # Character picker app
│   └── types/               # Shared TypeScript types
└── src-tauri/
    └── src/
        ├── character/       # Manifest loader
        ├── window/          # Window geometry (stub on Linux)
        ├── system/          # CPU/memory stats
        └── db/              # SQLite settings
```

## Phase 1 features implemented

| Feature | Status |
|---------|--------|
| Tauri 2 + React + TypeScript scaffold | Done |
| Transparent overlay window | Done |
| Launch lineup (5 characters) | Done |
| Character definition schema | Done |
| Placeholder / VRM 3D renderer | Done |
| Animation state machine | Done |
| Physics (anchor, walk, follow cursor stub) | Done |
| 3-level click interactions | Done |
| Spawnable objects (sticky note, etc.) | Done |
| Widget stubs (notes, clipboard, journal…) | Done |
| SQLite settings persistence | Done |
| Character picker settings UI | Done |
| Window geometry API | Stub (Linux X11/Wayland next) |
| VRM model loading | Done — `make models` or drop `.vrm` in `characters/{id}/` |

## Adding or replacing a VRM model

1. Run `make models` to download CC0 defaults, or place your own `model.vrm` in `characters/{id}/`
2. Restart the app (`make dev`)
3. Browse more free models at [opensourceavatars.com](https://opensourceavatars.com)

## Tauri commands

| Command | Description |
|---------|-------------|
| `get_character_manifest` | Load launch lineup + definitions |
| `get_app_settings` | Read SQLite settings |
| `set_app_settings` | Persist settings |
| `get_cursor_position` | OS cursor (stub until X11 wired) |
| `setup_overlay_window` | Fullscreen transparent overlay |
| `set_overlay_clickthrough` | Toggle click-through |
| `get_system_stats` | CPU / memory |

## Interaction guide

| Input | Result |
|-------|--------|
| Single click character | Reaction animation + speech bubble |
| Double click character | Open widget stub (notes, clipboard, etc.) |
| Long press character | Special ability + spawn object |

## Next steps (Phase 1 continuation)

1. Wire `device_query` for cursor tracking on Linux
2. X11/Wayland window list for window-border anchoring
3. VRM loader for Mochi model
4. Feed treat UI in settings
5. Marketplace `.aura-char` pack installer
