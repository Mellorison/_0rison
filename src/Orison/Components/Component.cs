namespace Orison {
    /// <summary>
    /// Base class for all components that can be attached to entities.
    /// Provides lifecycle hooks for initialization, updates, rendering, and cleanup.
    /// </summary>
    public abstract class Component {
        public Entity Entity { get; internal set; }

        public bool Visible = true;

        public bool RenderAfterEntity;

        /// <summary>
        /// Whether this component is currently enabled and will receive updates.
        /// </summary>
        public bool Enabled = true;

        /// <summary>
        /// Called immediately when the component is created, before being added to an entity.
        /// Use this for initialization that doesn't depend on the entity.
        /// </summary>
        public virtual void Awake() { }

        /// <summary>
        /// Called when the component is added to an entity.
        /// </summary>
        public virtual void Added() { }

        /// <summary>
        /// Called when the component is removed from an entity.
        /// </summary>
        public virtual void Removed() { }

        /// <summary>
        /// Called when the component is enabled.
        /// </summary>
        public virtual void OnEnabled() { }

        /// <summary>
        /// Called when the component is disabled.
        /// </summary>
        public virtual void OnDisabled() { }

        /// <summary>
        /// Called when the entity's scene changes.
        /// </summary>
        public virtual void OnSceneChanged() { }

        /// <summary>
        /// Called before the entity's first update.
        /// </summary>
        public virtual void Start() { }

        /// <summary>
        /// Called every frame for updating component logic.
        /// </summary>
        public virtual void Update() { }

        /// <summary>
        /// Called before the entity's Update.
        /// </summary>
        public virtual void UpdateFirst() { }

        /// <summary>
        /// Called after the entity's Update.
        /// </summary>
        public virtual void UpdateLast() { }

        /// <summary>
        /// Called for rendering the component.
        /// </summary>
        public virtual void Render() { }

        /// <summary>
        /// Called when the component is about to be destroyed.
        /// Use this for cleanup and releasing resources.
        /// </summary>
        public virtual void OnDestroy() { }
    }
}
