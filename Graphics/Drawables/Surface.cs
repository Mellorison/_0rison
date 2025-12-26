using SFML.Graphics;
using SFML.System;

namespace _0rison {
    public class Surface : Graphic {
        readonly RenderTexture renderTexture;
        readonly Sprite sprite;

        public Game Game { get; internal set; }

        public float CameraX;
        public float CameraY;
        public float CameraZoom = 1f;

        public Color FillColor = Color.Black;

        public int TextureWidth => (int)renderTexture.Size.X;
        public int TextureHeight => (int)renderTexture.Size.Y;

        public Surface(int width, int height) {
            renderTexture = new RenderTexture((uint)width, (uint)height);
            sprite = new Sprite(renderTexture.Texture);
            Width = width;
            Height = height;
            Relative = false;

            // A Surface renders its own texture.
            SetTexture(new Texture(renderTexture.Texture));
            Batchable = false;
        }

        public void Fill(Color color) {
            renderTexture.Clear(color.SFMLColor);
        }

        public void Draw(Drawable drawable, RenderStates states) {
            renderTexture.Draw(drawable, states);
        }

        public void Draw(Vertex[] vertices, RenderStates states) {
            renderTexture.Draw(vertices, states);
        }

        public void SaveToFile(string path = null) {
            if (path == null) {
                path = "surface.png";
            }
            var img = renderTexture.Texture.CopyToImage();
            img.SaveToFile(path);
        }

        public void DrawToWindow(Game game) {
            renderTexture.Display();

            // Present the surface to the window with basic scaling handled by SFML view.
            sprite.Position = new Vector2f(0, 0);
            sprite.Scale = new Vector2f(1, 1);
            game.Window.Draw(sprite);
        }

        protected override void UpdateDrawable() {
            // Surface drawable is always its internal sprite/texture.
            NeedsUpdate = false;
        }

        public override void Render(float x = 0, float y = 0) {
            // Ensure texture is up-to-date.
            renderTexture.Display();

            // If we are drawing the surface onto another surface, draw sprite into the current target.
            if (Draw.Target != null && Draw.Target != this) {
                var states = RenderStates.Default;
                states.Transform.Translate(x + X - OriginX, y + Y - OriginY);
                Draw.Drawable(sprite, states);
            }
        }
    }
}
