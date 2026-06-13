using System;
using System.Collections.Generic;

namespace Orison {
    /// <summary>
    /// Class used for a game object. The bread and butter of your game. Entities are added to Scenes which are controlled by the Game.
    /// </summary>
    public class Entity {
        #region Public Fields

        /// <summary>
        /// The X position of the Entity.
        /// </summary>
        public float X;

        /// <summary>
        /// The Y position of the Entity.
        /// </summary>
        public float Y;

        /// <summary>
        /// How long the Entity has been active.
        /// </summary>
        public float Timer;

        /// <summary>
        /// Determines if the Entity will render.
        /// </summary>
        public bool Visible = true;

        /// <summary>
        /// Determines if the Entity will collide with other entities. The entity can still check for
        /// collisions, but will not register as a collision with other entities.
        /// </summary>
        public bool Collidable = true;

        /// <summary>
        /// Deteremines if the Entity's update functions will run automatically from the Scene.
        /// </summary>
        public bool AutoUpdate = true;

        /// <summary>
        /// Determines if the Entity's render functions will run automatically from the Scene.
        /// </summary>
        public bool AutoRender = true;

        #endregion

        #region Public Properties

        /// <summary>
        /// The Scene the Entity is currently in.
        /// </summary>
        public Scene Scene {
            get;
            internal set;
        }

        /// <summary>
        /// The Game the Entity is currently in.
        /// </summary>
        public Game Game {
            get {
                if (Scene != null) return Scene.Game;
                return null;
            }
        }

        /// <summary>
        /// The Input instance for the Game.
        /// </summary>
        public Input Input {
            get {
                if (Game != null) return Game.Input;
                return null;
            }
        }

        /// <summary>
        /// The list of Components attached to the Entity.
        /// </summary>
        public List<Component> Components {
            get;
            private set;
        }

        /// <summary>
        /// The list of Colliders attached to the Entity.
        /// </summary>
        public List<Collider> Colliders {
            get;
            private set;
        }

        /// <summary>
        /// The list of Graphics attached to the Entity.
        /// </summary>
        public List<Graphic> Graphics {
            get;
            private set;
        }

        /// <summary>
        /// The Position of the Entity as a Vector2.
        /// </summary>
        public Vector2 Position {
            get { return new Vector2(X, Y); }
            set {
                X = value.X;
                Y = value.Y;
            }
        }

        #endregion

        #region Constructors

        /// <summary>
        /// Create a new Entity.
        /// </summary>
        public Entity() {
            Components = new List<Component>();
            Colliders = new List<Collider>();
            Graphics = new List<Graphic>();
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Set the position of the Entity.
        /// </summary>
        /// <param name="x">The X position.</param>
        /// <param name="y">The Y position.</param>
        public void SetPosition(float x, float y) {
            X = x;
            Y = y;
        }

        /// <summary>
        /// Add a Component to the Entity.
        /// </summary>
        /// <param name="component">The Component to add.</param>
        public T AddComponent<T>(T component) where T : Component {
            component.Entity = this;
            Components.Add(component);
            component.Added();
            return component;
        }

        /// <summary>
        /// Remove a Component from the Entity.
        /// </summary>
        /// <param name="component">The Component to remove.</param>
        public void RemoveComponent(Component component) {
            if (Components.Contains(component)) {
                component.Removed();
                component.OnDestroy();
                Components.Remove(component);
            }
        }

        /// <summary>
        /// Get a Component of type T from the Entity.
        /// </summary>
        public T GetComponent<T>() where T : Component {
            foreach (var component in Components) {
                if (component is T) return (T)component;
            }
            return null;
        }

        /// <summary>
        /// Add a Graphic to the Entity.
        /// </summary>
        /// <param name="graphic">The Graphic to add.</param>
        public T AddGraphic<T>(T graphic) where T : Graphic {
            graphic.Entity = this;
            Graphics.Add(graphic);
            return graphic;
        }

        /// <summary>
        /// Remove a Graphic from the Entity.
        /// </summary>
        /// <param name="graphic">The Graphic to remove.</param>
        public void RemoveGraphic(Graphic graphic) {
            if (Graphics.Contains(graphic)) {
                Graphics.Remove(graphic);
            }
        }

        /// <summary>
        /// Add a Collider to the Entity.
        /// </summary>
        /// <param name="collider">The Collider to add.</param>
        public T AddCollider<T>(T collider) where T : Collider {
            collider.Entity = this;
            Colliders.Add(collider);
            return collider;
        }

        /// <summary>
        /// Remove a Collider from the Entity.
        /// </summary>
        /// <param name="collider">The Collider to remove.</param>
        public void RemoveCollider(Collider collider) {
            if (Colliders.Contains(collider)) {
                Colliders.Remove(collider);
            }
        }

        /// <summary>
        /// Check if the Entity is colliding with any other Entity with specific tags.
        /// </summary>
        /// <param name="x">The X position to check.</param>
        /// <param name="y">The Y position to check.</param>
        /// <param name="tags">The tags to check for.</param>
        /// <returns>The first Entity collided with, or null.</returns>
        public Entity Collide(float x, float y, params int[] tags) {
            if (Scene == null) return null;
            foreach (var entity in Scene.Entities) {
                if (entity == this) continue;
                if (!entity.Collidable) continue;
                if (entity.CollideCheck(x, y, this, tags)) return entity;
            }
            return null;
        }

        /// <summary>
        /// Check if the Entity is overlapping with any other Entity with specific tags.
        /// </summary>
        /// <param name="x">The X position to check.</param>
        /// <param name="y">The Y position to check.</param>
        /// <param name="tags">The tags to check for.</param>
        /// <returns>The first Entity overlapped with, or null.</returns>
        public Entity Overlap(float x, float y, params int[] tags) {
            if (Scene == null) return null;
            foreach (var entity in Scene.Entities) {
                if (entity == this) continue;
                if (!entity.Collidable) continue;
                if (entity.OverlapCheck(x, y, this, tags)) return entity;
            }
            return null;
        }

        /// <summary>
        /// Remove this Entity from the Scene.
        /// </summary>
        public void RemoveSelf() {
            if (Scene != null) {
                Scene.Remove(this);
            }
        }

        #endregion

        #region Internal Methods

        internal bool CollideCheck(float x, float y, Entity entity, params int[] tags) {
            foreach (var collider in Colliders) {
                if (collider.CheckTags(tags)) {
                    foreach (var otherCollider in entity.Colliders) {
                        if (collider.CollideCheck(x, y, otherCollider)) return true;
                    }
                }
            }
            return false;
        }

        internal bool OverlapCheck(float x, float y, Entity entity, params int[] tags) {
            foreach (var collider in Colliders) {
                if (collider.CheckTags(tags)) {
                    foreach (var otherCollider in entity.Colliders) {
                        if (collider.OverlapCheck(x, y, otherCollider)) return true;
                    }
                }
            }
            return false;
        }

        internal void Added() {
            foreach (var component in Components) {
                component.Added();
            }
        }

        internal void Removed() {
            foreach (var component in Components) {
                component.Removed();
                component.OnDestroy();
            }
        }

        internal void Update() {
            Timer += Game.DeltaTime;
            foreach (var component in Components) {
                if (component.Enabled) {
                    component.Update();
                }
            }
        }

        internal void UpdateFirst() {
            foreach (var component in Components) {
                if (component.Enabled) {
                    component.UpdateFirst();
                }
            }
        }

        internal void UpdateLast() {
            foreach (var component in Components) {
                if (component.Enabled) {
                    component.UpdateLast();
                }
            }
        }

        internal void Render() {
            foreach (var component in Components) {
                if (component.Enabled && component.Visible) {
                    component.Render();
                }
            }
        }

        #endregion
    }
}
