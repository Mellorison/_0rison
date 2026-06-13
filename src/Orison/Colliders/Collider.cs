using System;
using System.Collections.Generic;

namespace Orison {
    /// <summary>
    /// Base class for all colliders. Provides collision detection and layer support.
    /// </summary>
    public abstract class Collider {
        readonly HashSet<int> tags = new HashSet<int>();

        public Entity Entity { get; internal set; }

        public int X;
        public int Y;

        public int Width;
        public int Height;

        /// <summary>
        /// The collision layer this collider belongs to. Colliders only collide with entities in the same layer by default.
        /// </summary>
        public int CollisionLayer = 0;

        /// <summary>
        /// Bitmask of layers this collider can collide with.
        /// </summary>
        public int CollisionMask = -1; // Collide with all layers by default

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

        /// <summary>
        /// Checks if this collider can collide with another collider based on collision layers.
        /// </summary>
        /// <param name="other">The other collider to check.</param>
        /// <returns>True if the colliders can interact.</returns>
        public bool CanCollideWith(Collider other) {
            if (other == null) return false;
            return (CollisionMask & (1 << other.CollisionLayer)) != 0 && 
                   (other.CollisionMask & (1 << CollisionLayer)) != 0;
        }

        /// <summary>
        /// Performs a raycast from a start point to an end point.
        /// </summary>
        /// <param name="startX">Starting X position.</param>
        /// <param name="startY">Starting Y position.</param>
        /// <param name="endX">Ending X position.</param>
        /// <param name="endY">Ending Y position.</param>
        /// <param name="tags">Tags to filter colliders by.</param>
        /// <returns>The first collider hit, or null if none.</returns>
        public static Collider Raycast(float startX, float startY, float endX, float endY, params int[] tags) {
            // This is a simplified raycast implementation
            // In a full implementation, you would check line intersection with all colliders
            if (Entity == null || Entity.Scene == null) return null;
            
            Collider closest = null;
            float closestDist = float.MaxValue;
            
            foreach (var entity in Entity.Scene.Entities) {
                foreach (var collider in entity.Colliders) {
                    if (tags.Length > 0) {
                        bool hasTag = false;
                        foreach (var tag in tags) {
                            if (collider.HasTag(tag)) {
                                hasTag = true;
                                break;
                            }
                        }
                        if (!hasTag) continue;
                    }
                    
                    // Simple line-rectangle intersection check
                    if (LineIntersectsRect(startX, startY, endX, endY, 
                                         collider.Left, collider.Top, collider.Right, collider.Bottom)) {
                        float dist = Vector2.Distance(new Vector2(startX, startY), new Vector2(collider.Left + collider.Width / 2, collider.Top + collider.Height / 2));
                        if (dist < closestDist) {
                            closestDist = dist;
                            closest = collider;
                        }
                    }
                }
            }
            
            return closest;
        }

        private static bool LineIntersectsRect(float x1, float y1, float x2, float y2, 
                                               float rx, float ry, float rw, float rh) {
            // Check if line intersects any of the rectangle's edges
            return LineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
                   LineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
                   LineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
                   LineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry) ||
                   (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh); // Start point inside
        }

        private static bool LineIntersectsLine(float x1, float y1, float x2, float y2,
                                               float x3, float y3, float x4, float y4) {
            float denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
            if (denom == 0) return false;
            
            float ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
            float ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
            
            return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
        }

        public virtual void Render(Color color = null) {
        }
    }
}
