using SFML.Graphics;
using SFML.System;

namespace _0rison {
    public class Image : Graphic {
        public Rectangle ClippingRegion;

        public Image(string source) {
            SetTexture(new Texture(source));
            AtlasRegion = new Rectangle(0, 0, 0, 0);
            ClippingRegion = new Rectangle(0, 0, Texture.Width, Texture.Height);
            Batchable = true;
        }

        public Image(Texture texture) {
            SetTexture(texture);
            AtlasRegion = new Rectangle(0, 0, 0, 0);
            ClippingRegion = new Rectangle(0, 0, texture.Width, texture.Height);
            Batchable = true;
        }

        public Image(AtlasTexture atlasTexture) {
            SetTexture(atlasTexture);
            ClippingRegion = new Rectangle(0, 0, atlasTexture.Width, atlasTexture.Height);
            Batchable = true;
        }

        public VertexArray GetVertices() {
            return SFMLVertices;
        }

        protected override void UpdateDrawable() {
            base.UpdateDrawable();

            if (Texture == null) return;

            int clipX = ClippingRegion.X;
            int clipY = ClippingRegion.Y;
            int clipW = ClippingRegion.Width;
            int clipH = ClippingRegion.Height;

            Width = clipW;
            Height = clipH;

            float u0 = TextureLeft + clipX;
            float v0 = TextureTop + clipY;
            float u1 = u0 + clipW;
            float v1 = v0 + clipH;

            var c = new Color(Color);
            c.A *= Alpha;

            SFMLVertices.Clear();
            SFMLVertices.Append(new Vertex(new Vector2f(0, 0), c.SFMLColor, new Vector2f(u0, v0)));
            SFMLVertices.Append(new Vertex(new Vector2f(clipW, 0), c.SFMLColor, new Vector2f(u1, v0)));
            SFMLVertices.Append(new Vertex(new Vector2f(clipW, clipH), c.SFMLColor, new Vector2f(u1, v1)));
            SFMLVertices.Append(new Vertex(new Vector2f(0, clipH), c.SFMLColor, new Vector2f(u0, v1)));
        }
    }
}
