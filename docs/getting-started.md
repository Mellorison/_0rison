# Getting Started with Orison

Orison is a 2D game engine built on SFML.Net for .NET 8. This guide will help you get up and running quickly.

## Installation

### Via NuGet
```bash
dotnet add package Orison
```

### From Source
1. Clone the repository
2. Build the project: `dotnet build src/Orison/Orison.csproj`
3. Reference the project in your game

## Your First Game

Create a new console application targeting .NET 8:

```bash
dotnet new console -n MyGame
cd MyGame
dotnet add package Orison
```

Replace `Program.cs` with:

```csharp
using Orison;

namespace MyGame;

class Program
{
    static void Main(string[] args)
    {
        var game = new Game(800, 600, "My First Game");
        game.AddScene(new MainScene());
        game.Start();
    }
}

class MainScene : Scene
{
    public override void Begin()
    {
        base.Begin();
        
        // Create a simple entity
        var player = new Entity("Player");
        player.Position = new Vector2(400, 300);
        player.SetGraphic(new Image("player.png"));
        player.SetHitbox(32, 32);
        Add(player);
    }
    
    public override void Update()
    {
        base.Update();
        
        // Move player with arrow keys
        var player = GetEntity<Player>();
        if (player != null)
        {
            if (Input.Keyboard.Down(Key.Left)) player.X -= 5;
            if (Input.Keyboard.Down(Key.Right)) player.X += 5;
            if (Input.Keyboard.Down(Key.Up)) player.Y -= 5;
            if (Input.Keyboard.Down(Key.Down)) player.Y += 5;
        }
    }
}
```

## Core Concepts

### Game
The `Game` class is the main entry point. It manages the window, input, and scene stack.

### Scene
Scenes contain entities and manage the game state. You can push/pop scenes to create menus, levels, etc.

### Entity
Entities are the basic game objects. They have position, graphics, colliders, and components.

### Component
Components add functionality to entities. Examples include cameras, physics, AI, etc.

### Graphic
Graphics handle rendering. Orison supports images, sprites, text, and more.

### Collider
Colliders handle collision detection. BoxCollider is the most common type.

## Project Structure

A typical Orison project structure:

```
MyGame/
├── assets/
│   ├── images/
│   ├── sounds/
│   └── fonts/
├── src/
│   ├── Entities/
│   ├── Scenes/
│   └── Components/
└── Program.cs
```

## Next Steps

- Explore the [samples](../samples/) for more examples
- Read the [API documentation](api.md)
- Check out the [advanced topics](advanced.md)
