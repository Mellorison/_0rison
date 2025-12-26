namespace _0rison {
    // Minimal stub to satisfy Atlas.CreateSpritemap<T>()
    public class Spritemap<T> : Image {
        public int CellWidth { get; }
        public int CellHeight { get; }

        public Spritemap(AtlasTexture atlasTexture, int width, int height) : base(atlasTexture) {
            CellWidth = width;
            CellHeight = height;
        }
    }
}
