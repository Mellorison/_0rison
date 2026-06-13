using Orison;

namespace HelloWorld;

class Program
{
    static void Main(string[] args)
    {
        // Initialize the game
        var game = new Game(800, 600, "Orison - Hello World");

        // Add a simple scene
        game.AddScene(new MainScene());

        // Start the game
        game.Start();
    }
}

class MainScene : Scene
{
    private float time = 0;

    public override void Begin()
    {
        base.Begin();

        // Add a simple entity
        var entity = new Entity("HelloEntity");
        entity.Position = new Vector2(400, 300);
        Add(entity);
    }

    public override void Update()
    {
        base.Update();

        time += 0.01f;

        // Move the entity in a circle
        if (Entities.Count > 0)
        {
            var entity = Entities[0];
            entity.X = 400 + (float)Math.Cos(time) * 100;
            entity.Y = 300 + (float)Math.Sin(time) * 100;
        }
    }

    public override void Render()
    {
        base.Render();

        // Draw some text
        Draw.Text("Hello, Orison!", 350, 50, Color.White);
        Draw.Text("Press ESC to exit", 350, 550, Color.Gray);
    }
}
