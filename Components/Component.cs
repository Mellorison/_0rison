namespace _0rison {
    public abstract class Component {
        public Entity Entity { get; internal set; }

        public bool Visible = true;

        public bool RenderAfterEntity;

        public virtual void Added() { }

        public virtual void Removed() { }

        public virtual void Update() { }

        public virtual void UpdateFirst() { }

        public virtual void UpdateLast() { }

        public virtual void Render() { }
    }
}
