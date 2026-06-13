# Orison

Orison is a 2D graphics simulation programming framework developed with .NET. It's primarily meant for low-level computer graphics research.

## Current Version
- Version 0.2.0 (Modernization in progress)

## Basic Features
- Quick Set Up
- 6 Collider Types
- Handy Utility Functions
- Scene, Entity, Component-Based System
- Texture Atlas Support
- And MORE! :D

## Set Up (Visual Studio)
- New Console Application
- Add Project "Orison.csproj" to Solution
- Add Reference to "Orison" in your Project
- Add `using Orison;` to your Program.cs
- Create a new program: `var program = new Program();`
- Start the program: `program.Start();`
- Run your brand new Orison program!

## Set Up (.NET CLI)
```bash
dotnet add reference path/to/Orison.csproj
```

## Project Structure
```
/
├── src/
│   └── Orison/
│       ├── Core/
│       ├── Components/
│       ├── Colliders/
│       ├── Graphics/
│       └── Utility/
├── samples/
│   └── orison-web/
├── tests/
│   └── Orison.Tests/
├── docs/
├── assets/
│   ├── logos/
│   ├── sprites/
│   ├── fonts/
│   └── native/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── CHANGELOG.md
```

## Dependencies

| Dependency | Purpose | Required For |
|---|---|---|
| SFML.NET | Graphics, audio, input, windowing | Desktop runtime |
| CSFML | Native SFML bindings | Desktop runtime |
| WebGL | Browser rendering | Web demo |

## Supported Platforms
- Windows x86/x64
- macOS
- Linux
- Browser (WebGL demo)

## Contribute
- Submit a pull request (see [CONTRIBUTING.md](CONTRIBUTING.md))
- File an Issue
- Post on the forum

## Help
- Created and maintained by Daniel Tumelo (mellorison@gmail.com)
- Orison Forum: https://discord.gg/S3F5HcP, http://danieltumelo.yabuntu.net or right here on GitHub: https://github.com/Mellorison/_0rison/issues
- Documentation: See [docs/](docs/) folder

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# orison-web (Stellate Web Demo)
This repo also includes a zero-install browser build of a Stellate MVP demo under `orison-web/`.

## Run
- Open `orison-web/index.html` directly in a browser.

If the browser blocks local file access for any assets, serve the folder with a local static server.

## Controls
- Move: WASD / Arrow Keys
- Jump: Space
- Interact (Cartesian-Twist switch): E
- Pause: Esc

## 3D Protagonist Overlay (WebGL)
The demo renders a procedural 3D “Afronaut” protagonist in a WebGL overlay canvas on top of the 2D game.

## Export the protagonist as `.glb`
While the demo is running, press `G` to download `stellate_protagonist.glb`.

## Free asset pipeline (CC0)
To improve visuals with free/open assets (Quaternius / Poly Haven) and convert them to `.glb` for the demo:
- See `orison-web/ASSETS.md`

