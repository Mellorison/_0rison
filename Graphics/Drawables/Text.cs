using SFML.Graphics;

namespace _0rison {
    public class Text : Graphic {
        readonly string str;
        readonly int size;

        public Text(string str, int size) {
            this.str = str ?? "";
            this.size = size;
            Dynamic = true;
            Batchable = false;
        }

        protected override void UpdateDrawable() {
            base.UpdateDrawable();

            // Minimal stub: do not require font assets.
            // We still set a reasonable width/height so layout doesn't crash.
            Width = str.Length * (size / 2);
            Height = size;

            SFMLDrawable = null;
            SFMLVertices.Clear();

            var c = new Color(Color);
            c.A *= Alpha;

            // Render as a simple colored quad placeholder.
            SFMLVertices.Append(0, 0, c, 0, 0);
            SFMLVertices.Append(Width, 0, c, 0, 0);
            SFMLVertices.Append(Width, Height, c, 0, 0);
            SFMLVertices.Append(0, Height, c, 0, 0);
        }
    }
}
