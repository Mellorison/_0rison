using System;
using System.Collections.Generic;

namespace _0rison {
    public abstract class Collider {
        readonly HashSet<int> tags = new HashSet<int>();

        public Entity Entity { get; internal set; }

        public int X;
        public int Y;

        public int Width;
        public int Height;

        public int Left => (Entity != null ? (int)Entity.X : 0) + X;
        public int Top => (Entity != null ? (int)Entity.Y : 0) + Y;
        public int Right => Left + Width;
        public int Bottom => Top + Height;

        public void AddTag(params int[] moreTags) {
            if (moreTags == null) return;
            for (int i = 0; i < moreTags.Length; i++) tags.Add(moreTags[i]);
        }

        public void AddTag(Enum tag) {
            tags.Add(Convert.ToInt32(tag));
        }

        public void AddTag(params Enum[] moreTags) {
            if (moreTags == null) return;
            for (int i = 0; i < moreTags.Length; i++) tags.Add(Convert.ToInt32(moreTags[i]));
        }

        public bool HasTag(int tag) => tags.Contains(tag);

        public virtual void Render(Color color = null) {
        }
    }
}
