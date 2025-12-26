# Stellate Asset Pipeline (Free / CC0)

This project supports a local, `file://`-friendly workflow:
- Place downloaded source assets into `orison-web/assets/src/`
- Convert to `.glb` into `orison-web/assets/glb/`
- Load the `.glb` at runtime using the **Load GLB for 3D View** button in `index.html`

## Recommended sources (start here)

### Environments (CC0)
- Quaternius: Modular Sci-Fi MegaKit (Standard)
  - https://opengameart.org/content/modular-sci-fi-megakit
- Quaternius: LowPoly Modular Sci-Fi Environments
  - https://opengameart.org/content/lowpoly-modular-sci-fi-environments

### Lighting / Textures (CC0)
- Poly Haven (HDRIs + PBR textures)
  - https://polyhaven.com/

## Folder layout

- `orison-web/assets/src/`:
  - Put downloaded zips (or extracted FBX/OBJ/BLEND) here.

- `orison-web/assets/glb/`:
  - Output folder for converted `.glb` files.

- `orison-web/assets/notes/`:
  - Keep license notes / attribution files.

## Convert assets to GLB (portable tools)

This repo includes a PowerShell conversion script:
- `orison-web/tools/convert_assets.ps1`

It expects you to provide conversion binaries in:
- `orison-web/tools/bin/assimp.exe` (Assimp command-line)
- `orison-web/tools/bin/gltfpack.exe` (optional optimization)

Then run (from repo root):
- `powershell -ExecutionPolicy Bypass -File .\orison-web\tools\convert_assets.ps1`

### What it does
- Converts FBX/OBJ/DAE/BLEND (via assimp) into `.glb`
- Optionally optimizes output with `gltfpack`

## Using a converted GLB in the demo

1. Open `orison-web/index.html`
2. Click **Load GLB for 3D View**
3. Select a `.glb` from `orison-web/assets/glb/`
4. Trigger the 5-second 3D view in-game (press `E` near the twist switch)

## Notes / limitations
- Current demo GLB loader renders the **first mesh primitive** and uses vertex colors if present.
- For very large meshes requiring 32-bit indices, the demo may reject them (WebGL1 limitation).
