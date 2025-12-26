# _0rison Documentation

## Overview
`0rison` is a 2D graphics / game development framework built with C# and SFML.Net.

- Solution: `0rison.sln`
- Project: `0rison.csproj`
- Output: Class Library (`0rison.dll`)
- Target framework: `.NET Framework 4.5`
- Platform: `x86`
- Root namespace: `_0rison`

The framework provides a **Scene → Entity → Component** architecture, along with rendering primitives, collision shapes, utility helpers (including tweening), and an SFML-based game loop.

## Dependencies

### Managed
- `sfmlnet-graphics-2.dll`
- `sfmlnet-window-2.dll`
- `sfmlnet-system-2.dll`
- `sfmlnet-audio-2.dll`

These are referenced from the `Lib/` folder in the project.

### Native runtime libraries
The project includes native dependencies that are copied to the output directory:

- `csfml-audio-2.dll`
- `csfml-graphics-2.dll`
- `csfml-window-2.dll`
- `csfml-system-2.dll`
- `csfml-network-2.dll`
- `openal32.dll`
- `libsndfile-1.dll`

There is also `libosx/` with `.dylib` variants (macOS support).

## Project structure

- `Core/`
  - Core runtime types and orchestration (`Game`, `Scene`, `Entity`, `Input`, etc.).
- `Graphics/`
  - Rendering primitives and asset helpers (`Atlas`, `Anim`, `Color`, etc.).
  - `Graphics/Drawables/` contains drawable types (e.g. `Graphic`, `Gradient`, etc.).
- `Colliders/`
  - Collider implementations (e.g. box/polygon/etc.).
- `Components/`
  - Reusable behaviors attached to entities (component-based system).
- `Utility/`
  - Helper utilities (coroutines, debugging, sprite batch, random, geometry, etc.).
  - Includes subfolders like `Glide/` (tweening) and `MonoGame/` (math types).

## Core architecture and conventions

### Game
`_0rison.Game` is the top-level runtime controller:

- Owns the SFML `RenderWindow` and `View`.
- Runs the main loop via `Start()`.
- Maintains timing state (delta time, target framerate, fixed vs variable timestep).
- Maintains and updates the scene stack.

#### `Start(Scene firstScene)`
Convenience overload:

- Sets `FirstScene`.
- Calls `Start()`.

#### `Start()`
Starts the game loop.

Key behaviors visible in `Core/Game.cs`:

- If the window is not yet set, it calls `SetWindow(Width, Height, WindowFullscreen)`.
- Sets `Active = true`, runs initialization (`Init()`), updates scenes once (`UpdateScenes()`), and starts a `Stopwatch` (`gameTime`).
- While `Window.IsOpen`:
  - Dispatches window events (`Window.DispatchEvents()`).
  - Calculates `frameTime = 1000f / TargetFramerate`.
  - Sets `skipTime = frameTime * 2` (caps extreme delta accumulation).
  - Handles debug mouse cursor visibility.
  - Optional screenshot capture via `ScreenshotButton`.
  - Optional quit handling:
    - `QuitButton` (defaults to Escape).
    - `Alt+F4`.
  - When `AlwaysUpdate` is false and the window is unfocused, it will skip updating.
  - Mouse locking logic:
    - `LockMouse` clamps cursor to window bounds.
    - `LockMouseCenter` forces cursor to window center and calculates deltas.
  - Time accounting:
    - Updates `deltaTime` from the stopwatch.
    - Computes `RealDeltaTime`.
    - Updates averaged framerate.

##### Fixed timestep (`FixedFramerate == true`)
- Sets `DeltaTime` to either `1` (if `MeasureTimeInFrames`) or `1f / TargetFramerate`.
- Runs updates in a loop while `deltaTime >= frameTime + sleepTime`.
- If not paused (`Paused == false`), calls:
  - `Update()`
  - `OnUpdate()` callback
- After each update, subtracts `frameTime + sleepTime` and resets `sleepTime` to `0`.

##### Variable timestep (`FixedFramerate == false`)
- Sets `DeltaTime = deltaTime * 0.001f` (seconds).
- If not paused, calls:
  - `Update()`
  - `OnUpdate()` callback

#### `Sleep(int milliseconds)`
Sets an internal `sleepTime` used by the fixed-timestep update loop.

- This effectively delays the next update cycle by increasing the `frameTime + sleepTime` threshold.
- The code comments indicate this is intended for fixed framerate mode.

### Scene
`_0rison.Scene` manages entities and scene-level behavior:

- Keeps entity collections and internal queues for add/remove/reorder/layer changes.
- Supports pausing via groups.
- Owns a scene-level `Tweener`.
- Defines many lifecycle callbacks (`OnBegin`, `OnUpdate`, `OnRender`, etc.).
- Contains camera configuration (angle/zoom/bounds/follow target).

### Entity
`_0rison.Entity` is the core game object:

- Has positional fields (`X`, `Y`) and an `InstanceId` assigned by the containing scene.
- Provides composition through lists:
  - `Graphics`
  - `Components`
  - `Colliders`
  - `Surfaces`
- Provides entity-level callbacks (`OnAdded`, `OnUpdate`, `OnRender`, etc.).
- Owns an entity-level `Tweener`.

## Typical usage (from README)
The README describes using `0rison` by referencing it from another project:

- Create a new Console App.
- Add the `0rison.csproj` to your solution.
- Add a reference to `0rison`.
- In your app, `using 0rison;` (conceptually), then instantiate your program and call `Start()`.

## Notes / potential repo hygiene
In the current workspace view, some folders (notably `Components/` and `Colliders/`) show fewer files than what `0rison.csproj` references. If you see build errors like “file not found” for those referenced paths, verify that all source files are present in the working tree.
