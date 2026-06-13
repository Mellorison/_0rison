# API Documentation

This document provides an overview of the main Orison API classes and their key methods.

## Core Classes

### Game
The main game class that manages the game loop, window, and scenes.

**Key Properties:**
- `Width`, `Height` - Internal resolution
- `WindowWidth`, `WindowHeight` - Window size
- `Framerate` - Current FPS
- `DeltaTime` - Time since last update
- `CameraX`, `CameraY` - Camera position
- `CameraZoom` - Camera zoom level

**Key Methods:**
- `Start()` - Start the game loop
- `Start(Scene firstScene)` - Start with a specific scene
- `AddScene(Scene scene)` - Push a scene onto the stack
- `SwitchScene(Scene scene)` - Replace all scenes
- `Close()` - Close the game window

### Scene
Base class for game scenes containing entities.

**Key Methods:**
- `Begin()` - Called when scene starts
- `End()` - Called when scene ends
- `Update()` - Called every frame
- `Render()` - Called for rendering
- `Add(Entity entity)` - Add an entity to the scene
- `Remove(Entity entity)` - Remove an entity from the scene

### Entity
Base class for game objects.

**Key Properties:**
- `X`, `Y` - Position
- `Position` - Vector2 position
- `Width`, `Height` - Dimensions
- `Visible` - Whether to render
- `Collidable` - Whether to collide
- `Layer` - Render order
- `Order` - Update order

**Key Methods:**
- `AddGraphic(Graphic g)` - Add a graphic
- `SetHitbox(int width, int height)` - Set a box collider
- `Collide(float x, float y, params int[] tags)` - Check for collision
- `Overlap(float x, float y, params int[] tags)` - Check for overlap
- `RemoveSelf()` - Remove this entity from the scene

## Graphics

### Graphic
Base class for all renderable objects.

**Key Properties:**
- `X`, `Y` - Position
- `ScaleX`, `ScaleY` - Scale
- `Angle` - Rotation
- `OriginX`, `OriginY` - Origin point
- `Color` - Tint color
- `Alpha` - Transparency
- `ScrollX`, `ScrollY` - Parallax scroll factors

**Key Methods:**
- `CenterOrigin()` - Center the origin
- `Render(float x, float y)` - Render at offset position

### Image
A static image graphic.

```csharp
var image = new Image("path/to/image.png");
```

### Spritemap
A sprite from a spritesheet.

```csharp
var sprite = new Spritemap("spritesheet.png", 32, 32);
sprite.Add("idle", new int[] { 0, 1, 2, 3 });
sprite.Play("idle", true);
```

### Text
Text rendering.

```csharp
var text = new Text("Hello World", "font.ttf", 24);
text.Color = Color.White;
```

## Components

### Component
Base class for components that can be attached to entities.

**Lifecycle Methods:**
- `Awake()` - Called when component is created
- `Added()` - Called when added to entity
- `Removed()` - Called when removed from entity
- `Start()` - Called before first update
- `Update()` - Called every frame
- `Render()` - Called for rendering
- `OnDestroy()` - Called when component is destroyed

### Camera
Camera component for following entities and controlling the view.

```csharp
var camera = new Camera();
entity.AddComponent(camera);
camera.Follow(playerEntity);
camera.Shake(5f, 0.5f);
```

### DebugOverlay
Displays FPS, memory usage, and entity count.

```csharp
var debug = new DebugOverlay();
entity.AddComponent(debug);
```

## Colliders

### Collider
Base class for collision detection.

**Key Properties:**
- `CollisionLayer` - The layer this collider belongs to
- `CollisionMask` - Bitmask of layers to collide with

**Key Methods:**
- `CanCollideWith(Collider other)` - Check if can collide
- `Raycast(float startX, float startY, float endX, float endY, params int[] tags)` - Perform raycast

### BoxCollider
Rectangle collider.

```csharp
entity.SetHitbox(32, 32);
```

## Input

### Input
Global input manager.

**Keyboard:**
```csharp
Input.Keyboard.Pressed(Key.Space)
Input.Keyboard.Down(Key.Space)
Input.Keyboard.Released(Key.Space)
```

**Mouse:**
```csharp
Input.Mouse.X
Input.Mouse.Y
Input.Mouse.Pressed(MouseButton.Left)
Input.Mouse.Down(MouseButton.Left)
```

**Gamepad:**
```csharp
Input.Gamepad.Pressed(0, GamepadButton.A)
Input.Gamepad.Axis(0, GamepadAxis.LeftStickX)
```

### InputAction
Mapped input action for customizable controls.

```csharp
var jump = new InputAction("Jump");
jump.AddKey(Key.Space);
jump.AddGamepadButton(GamepadButton.A);
```

## Utility

### AssetManager
Centralized asset loading and caching.

```csharp
var texture = AssetManager.Instance.LoadTexture("image.png");
var sound = AssetManager.Instance.LoadSound("sound.wav");
var font = AssetManager.Instance.LoadFont("font.ttf");
```

### Vector2
2D vector math utility.

```csharp
var v1 = new Vector2(10, 20);
var v2 = new Vector2(5, 5);
var sum = v1 + v2;
var distance = Vector2.Distance(v1, v2);
var normalized = v1.Normalized();
```

## Math Functions

### Util
Static utility methods.

```csharp
Util.Clamp(value, min, max)
Util.Lerp(a, b, t)
Util.Round(value)
Util.Ceil(value)
```

### Rand
Random number generation.

```csharp
Rand.Float()
Rand.Int(min, max)
Rand.Choice(item1, item2, item3)
```
