using SFML.Graphics;

namespace _0rison {
    public class Texture {
        public SFML.Graphics.Texture SFMLTexture { get; }

        public Rectangle Region { get; private set; }

        public bool Smooth {
            get => SFMLTexture.Smooth;
            set => SFMLTexture.Smooth = value;
        }

        public int Width => (int)SFMLTexture.Size.X;
        public int Height => (int)SFMLTexture.Size.Y;

        public Texture(string source) {
            SFMLTexture = new SFML.Graphics.Texture(source);
            Region = new Rectangle(0, 0, Width, Height);
        }

        internal Texture(SFML.Graphics.Texture texture) {
            SFMLTexture = texture;
            Region = new Rectangle(0, 0, Width, Height);
        }
    }
}
