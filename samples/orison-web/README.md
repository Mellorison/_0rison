# Orison Web

A 2D/3D game engine for the browser, built with TypeScript and Three.js.

## Features

- **Entity-Component System**: Modular architecture with entities and components
- **3D Rendering**: Three.js-based WebGL rendering
- **2D/3D Hybrid**: Canvas overlay for HUD and UI elements over 3D scenes
- **Transform System**: Full 3D transforms with position, rotation, and scale
- **Camera System**: Perspective and orthographic cameras with follow and shake effects
- **Lighting**: Ambient, directional, point, spot, and hemisphere lights
- **Model Loading**: GLB/GLTF model support
- **World-to-Screen Projection**: Convert 3D world positions to 2D screen coordinates

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start a local development server at `http://localhost:5173`.

### Build

```bash
npm run build
```

This will create a production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
orison-web/
├── src/
│   ├── core/
│   │   ├── Component.ts      # Base component class
│   │   ├── Entity.ts         # Entity class
│   │   ├── Scene.ts          # Scene class
│   │   └── Game.ts           # Main game class
│   ├── components/
│   │   ├── Transform3D.ts    # 3D transform component
│   │   ├── MeshRenderer.ts   # Mesh rendering component
│   │   ├── ModelRenderer.ts  # GLB model rendering
│   │   ├── Camera3D.ts       # 3D camera component
│   │   ├── Light.ts          # Light component
│   │   └── CanvasLayer.ts    # 2D canvas overlay
│   ├── rendering/
│   │   └── ThreeRenderer.ts  # Three.js renderer bridge
│   └── main.ts               # Entry point
├── public/
│   └── assets/               # Game assets
├── index.html                # HTML entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Usage Example

```typescript
import { Game } from './core/Game';
import { Scene } from './core/Scene';
import { Entity } from './core/Entity';
import { Transform3D } from './components/Transform3D';
import { MeshRenderer } from './components/MeshRenderer';
import { Camera3D } from './components/Camera3D';
import { Light, LightType } from './components/Light';

// Create game
const canvas = document.querySelector('#game') as HTMLCanvasElement;
const game = new Game(canvas);

// Create scene
const scene = new Scene('Main');

// Add camera
const camera = new Entity('Camera');
const cameraTransform = camera.addComponent(new Transform3D());
cameraTransform.setPosition(0, 5, 10);
camera.addComponent(new Camera3D({ fov: 60 }));
scene.addEntity(camera);

// Add light
const light = new Entity('Sun');
const lightTransform = light.addComponent(new Transform3D());
lightTransform.setPosition(5, 10, 5);
light.addComponent(new Light({ type: LightType.Directional, intensity: 1.5 }));
scene.addEntity(light);

// Add player
const player = new Entity('Player');
const playerTransform = player.addComponent(new Transform3D());
playerTransform.setPosition(0, 0.5, 0);
player.addComponent(MeshRenderer.createBox(1, 1, 1, 0x00ff00));
scene.addEntity(player);

// Start game
game.setScene(scene);
game.start();
```

## Components

### Transform3D

Manages position, rotation, and scale in 3D space.

```typescript
const transform = entity.addComponent(new Transform3D());
transform.setPosition(x, y, z);
transform.setRotation(x, y, z);
transform.setScale(x, y, z);
```

### MeshRenderer

Renders 3D meshes (boxes, spheres, planes).

```typescript
entity.addComponent(MeshRenderer.createBox(1, 1, 1, 0xffffff));
entity.addComponent(MeshRenderer.createSphere(1, 0xffffff));
entity.addComponent(MeshRenderer.createPlane(1, 1, 0xffffff));
```

### ModelRenderer

Loads and renders GLB/GLTF models.

```typescript
entity.addComponent(new ModelRenderer('/models/player.glb'));
```

### Camera3D

3D camera with follow and shake effects.

```typescript
const camera = entity.addComponent(new Camera3D({ fov: 60 }));
camera.follow(targetTransform);
camera.shake(10, 0.5);
```

### Light

Various light types for illumination.

```typescript
entity.addComponent(new Light({ type: LightType.Directional, intensity: 1.5 }));
entity.addComponent(new Light({ type: LightType.Point, intensity: 1 }));
entity.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
```

### CanvasLayer

2D canvas overlay for HUD and UI.

```typescript
const canvasLayer = entity.addComponent(new CanvasLayer(960, 540));
canvasLayer.drawText('Hello', 10, 10);
canvasLayer.drawRect(10, 10, 100, 50);
canvasLayer.drawHealthBar(10, 10, 100, 10, 80, 100);
```

## Roadmap

- [ ] 3D physics (Rapier)
- [ ] Model animation support
- [ ] Input action mapping system
- [ ] Audio system
- [ ] Particle system
- [ ] Post-processing effects
- [ ] Network multiplayer

## License

MIT
