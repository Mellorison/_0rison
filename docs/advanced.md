# Advanced Topics

This guide covers advanced features and techniques for building games with Orison.

## Collision Layers

Collision layers allow you to control which objects can collide with each other.

```csharp
// Define collision layers
const int PLAYER_LAYER = 0;
const int ENEMY_LAYER = 1;
const int WALL_LAYER = 2;

// Set up a player collider
playerCollider.CollisionLayer = PLAYER_LAYER;
playerCollider.CollisionMask = (1 << WALL_LAYER) | (1 << ENEMY_LAYER);

// Set up an enemy collider
enemyCollider.CollisionLayer = ENEMY_LAYER;
enemyCollider.CollisionMask = (1 << PLAYER_LAYER) | (1 << WALL_LAYER);

// Check if two colliders can interact
if (playerCollider.CanCollideWith(enemyCollider))
{
    // Handle collision
}
```

## Raycasting

Raycasting allows you to detect objects along a line.

```csharp
// Perform a raycast
var hit = Collider.Raycast(startX, startY, endX, endY, tag);

if (hit != null)
{
    // Something was hit
    var hitEntity = hit.Entity;
}
```

## Camera System

The camera component provides smooth following, zooming, and shake effects.

```csharp
var camera = new Camera();
cameraEntity.AddComponent(camera);

// Follow an entity
camera.Follow(playerEntity, new Vector2(0, -50));

// Adjust follow speed
camera.FollowSpeed = 0.05f;

// Zoom the camera
camera.Zoom = 1.5f;

// Shake the camera
camera.Shake(10f, 0.3f);

// Snap to a position
camera.SnapTo(100, 100);
```

## Input Actions

Input actions provide a flexible way to map multiple inputs to a single action.

```csharp
var inputManager = new InputActionManager();

// Create actions
var jump = inputManager.CreateAction("Jump");
jump.AddKey(Key.Space);
jump.AddKey(Key.W);
jump.AddGamepadButton(GamepadButton.A);

var move = inputManager.CreateAction("Move");
move.AddGamepadAxis(0);

// Update and check inputs
inputManager.Update();

if (jump.Pressed)
{
    // Jump
}

if (move.Held)
{
    // Move with analog value
    player.X += move.Value * speed;
}
```

## Render Layers

Control the order in which graphics are rendered.

```csharp
// Set render layer on graphics
backgroundGraphic.RenderLayer = 0;
playerGraphic.RenderLayer = 10;
uiGraphic.RenderLayer = 100;
```

## Component Lifecycle

Components have a full lifecycle you can hook into.

```csharp
class MyComponent : Component
{
    public override void Awake()
    {
        // Called when component is created
    }
    
    public override void Added()
    {
        // Called when added to entity
    }
    
    public override void Start()
    {
        // Called before first update
    }
    
    public override void Update()
    {
        // Called every frame
    }
    
    public override void OnEnabled()
    {
        // Called when enabled
    }
    
    public override void OnDisabled()
    {
        // Called when disabled
    }
    
    public override void OnDestroy()
    {
        // Cleanup resources
    }
}
```

## Asset Management

Use the AssetManager for efficient asset loading and caching.

```csharp
// Set the assets path
AssetManager.Instance.AssetsPath = "assets";

// Load assets (cached automatically)
var texture = AssetManager.Instance.LoadTexture("player.png");
var sound = AssetManager.Instance.LoadSound("jump.wav");
var font = AssetManager.Instance.LoadFont("font.ttf");

// Check cache status
Console.WriteLine($"Cached textures: {AssetManager.Instance.CachedTextureCount}");

// Unload assets when no longer needed
AssetManager.Instance.UnloadTexture("player.png");

// Clear all cached assets
AssetManager.Instance.ClearCache();
```

## Debugging

### Debug Overlay

Add a debug overlay to see performance metrics.

```csharp
var debug = new DebugOverlay();
debug.ShowFps = true;
debug.ShowMemory = true;
debug.ShowEntityCount = true;
debug.TextColor = Color.White;
debug.Offset = new Vector2(10, 10);

uiEntity.AddComponent(debug);
```

### Crash Logging

Enable crash logging to collect error data from players.

```csharp
game.LogExceptionsToFile = true;
```

Crash logs will be saved as `crash_[timestamp].txt` in the game folder.

## Tweens

Use the built-in tweening system for smooth animations.

```csharp
// Tween position
entity.X = 0;
entity.Tweener.Tween(entity, "X", 100, 1.0f, Ease.ElasticOut);

// Tween with delay
entity.Tweener.Tween(entity, "Y", 50, 0.5f, Ease.QuadOut)
    .Delay(0.5f);

// Tween multiple properties
entity.Tweener.Tween(entity, new { X = 100, Y = 50 }, 1.0f, Ease.QuadOut);

// Chain tweens
entity.Tweener.Tween(entity, "ScaleX", 2.0f, 0.5f, Ease.QuadOut)
    .Then(entity, "ScaleX", 1.0f, 0.5f, Ease.QuadOut);
```

## Coroutines

Use coroutines for time-based operations.

```csharp
class MyEntity : Entity
{
    public override void Begin()
    {
        base.Begin();
        
        // Start a coroutine
        Game.Coroutine.Run(MyCoroutine());
    }
    
    IEnumerator MyCoroutine()
    {
        // Wait for 1 second
        yield return Game.Coroutine.WaitFor(1.0f);
        
        // Do something
        X = 100;
        
        // Wait for a condition
        yield return Game.Coroutine.WaitUntil(() => Input.Keyboard.Pressed(Key.Space));
        
        // Do something else
        Y = 200;
    }
}
```

## Scene Management

Use the scene stack for menus and transitions.

```csharp
// Push a new scene (pauses current)
game.AddScene(new PauseMenu());

// Switch to a new scene (replaces all)
game.SwitchScene(new LevelScene());

// Pop the current scene
Scene.Current.RemoveSelf();
```

## Data Persistence

Save and load game data.

```csharp
// Save data
game.SaveData.Save("highscore", 1000);
game.SaveData.Save("unlocked_levels", new int[] { 1, 2, 3 });

// Load data
int highscore = game.SaveData.Load<int>("highscore", 0);
int[] levels = game.SaveData.Load<int[]>("unlocked_levels", new int[0]);

// Config data (externally editable)
game.ConfigData.Save("volume", 0.5f);
float volume = game.ConfigData.Load<float>("volume", 1.0f);
```

## Performance Tips

1. **Use object pooling** for frequently created/destroyed entities
2. **Batch draw calls** by using similar graphics
3. **Limit collision checks** by using collision layers
4. **Cache assets** using AssetManager
5. **Use culling** to skip off-screen entities
6. **Profile with DebugOverlay** to identify bottlenecks

## Building for Release

1. Update version in `Orison.csproj`
2. Build in Release configuration
3. Test thoroughly
4. Tag release: `git tag v1.0.0`
5. Push tag: `git push origin v1.0.0`
6. GitHub Actions will create the release and NuGet package
