# 3D Assets

This folder contains 3D models (GLTF/GLB or FBX format) for the game.

## Supported Formats
- **GLTF/GLB** (.gltf, .glb) - Recommended for web
- **FBX** (.fbx) - Also supported

## Current Models

### Character
- **File:** `characterMedium.fbx` (Kenney Assets)
- **Status:** Loaded and ready
- **Animations:** Includes built-in animations (will play first available)

### Environment Objects
- **Status:** Using procedural fallbacks (basic shapes)
- **Optional:** Add the following for realistic models:
  - `hut.glb` or `hut.fbx` - Small hut/building
  - `building.glb` or `building.fbx` - Larger building
  - `acacia_tree.glb` or `acacia_tree.fbx` - Acacia tree
  - `baobab_tree.glb` or `baobab_tree.fbx` - Baobab tree
  - `palm_tree.glb` or `palm_tree.fbx` - Palm tree

## Where to Get Models

### Free Sources
- **Sketchfab:** https://sketchfab.com (filter by "Downloadable" and "GLB/GLTF")
- **Mixamo:** https://www.mixamo.com (animated characters)
- **Poly Haven:** https://polyhaven.com (environment assets)
- **Kenney Assets:** https://kenney.nl/assets (stylized 3D models)

### Recommended for Realistic Graphics
- **ArtStation Marketplace:** https://www.artstation.com/marketplace
- **Unity Asset Store:** https://assetstore.unity.com (convert to GLTF)
- **Unreal Marketplace:** https://www.unrealengine.com/marketplace (convert to GLTF)

## Model Requirements

- **Format:** GLTF (.gltf + .bin) or GLB (.glb)
- **Scale:** Adjust to fit the planet (radius ~30 units)
- **Materials:** PBR materials (roughness, metallic, normal maps supported)
- **Animations:** For characters, use skeletal animation with named clips
- **Poly Count:** Keep reasonable for web performance (under 50k polygons per model)

## Conversion Tools

If you have models in other formats (FBX, OBJ, etc.), convert them using:
- **Blender:** File > Export > glTF 2.0
- **Online converters:** https://gltf-transform.donmccurdy.com/

## Fallback Behavior

If a model file is missing, the game will automatically fall back to procedural geometry (basic shapes). This ensures the game remains playable even without custom assets.
