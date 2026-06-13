using System;
using System.Collections.Generic;

namespace Orison {
    /// <summary>
    /// A Scene is a container for Entities. Scenes are managed by the Game class.
    /// </summary>
    public class Scene {
        #region Public Fields

        /// <summary>
        /// The list of Entities in the Scene.
        /// </summary>
        public List<Entity> Entities {
            get;
            private set;
        }

        #endregion

        #region Public Properties

        /// <summary>
        /// The Game the Scene is currently in.
        /// </summary>
        public Game Game {
            get;
            internal set;
        }

        #endregion

        #region Constructors

        /// <summary>
        /// Create a new Scene.
        /// </summary>
        public Scene() {
            Entities = new List<Entity>();
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Add an Entity to the Scene.
        /// </summary>
        /// <param name="entity">The Entity to add.</param>
        public T Add<T>(T entity) where T : Entity {
            entity.Scene = this;
            Entities.Add(entity);
            entity.Added();
            return entity;
        }

        /// <summary>
        /// Remove an Entity from the Scene.
        /// </summary>
        /// <param name="entity">The Entity to remove.</param>
        public void Remove(Entity entity) {
            if (Entities.Contains(entity)) {
                entity.Removed();
                Entities.Remove(entity);
            }
        }

        /// <summary>
        /// Get the first Entity with a specific name.
        /// </summary>
        /// <param name="name">The name to search for.</param>
        /// <returns>The Entity if found, null otherwise.</returns>
        public Entity GetEntity(string name) {
            foreach (var entity in Entities) {
                // Note: Entity doesn't have a Name property in the original,
                // but we could add it or use type checking
                if (entity.GetType().Name == name) return entity;
            }
            return null;
        }

        /// <summary>
        /// Get all Entities of a specific type.
        /// </summary>
        /// <typeparam name="T">The type of Entity to get.</typeparam>
        /// <returns>A list of Entities of the specified type.</returns>
        public List<T> GetEntities<T>() where T : Entity {
            var list = new List<T>();
            foreach (var entity in Entities) {
                if (entity is T) list.Add((T)entity);
            }
            return list;
        }

        #endregion

        #region Virtual Methods

        /// <summary>
        /// Called when the Scene is added to the Game.
        /// </summary>
        public virtual void Begin() {
        }

        /// <summary>
        /// Called when the Scene is removed from the Game.
        /// </summary>
        public virtual void End() {
            foreach (var entity in Entities) {
                entity.Removed();
            }
            Entities.Clear();
        }

        /// <summary>
        /// Called every frame to update the Scene.
        /// </summary>
        public virtual void Update() {
            foreach (var entity in Entities) {
                if (entity.AutoUpdate) {
                    entity.UpdateFirst();
                    entity.Update();
                    entity.UpdateLast();
                }
            }
        }

        /// <summary>
        /// Called every frame to render the Scene.
        /// </summary>
        public virtual void Render() {
            foreach (var entity in Entities) {
                if (entity.AutoRender && entity.Visible) {
                    entity.Render();
                }
            }
        }

        #endregion
    }
}
