namespace Orison {
    /// <summary>
    /// Collider shapes for 3D collision detection.
    /// </summary>
    public enum ColliderShape {
        Box,
        Sphere,
        Capsule,
        Cylinder,
        Mesh
    }

    /// <summary>
    /// 3D collider component for collision detection.
    /// </summary>
    public class Collider3D : Component {
        private ColliderShape shape;
        private Vector3 size;
        private float radius;
        private float height;
        private Transform3D transform;
        private float friction;
        private float restitution;
        private bool isSensor;
        private RigidBody3D rigidBody;

        /// <summary>
        /// The shape of the collider.
        /// </summary>
        public ColliderShape Shape {
            get => shape;
            set => shape = value;
        }

        /// <summary>
        /// The size of the collider (for box colliders).
        /// </summary>
        public Vector3 Size {
            get => size;
            set => size = value;
        }

        /// <summary>
        /// The radius of the collider (for sphere/capsule colliders).
        /// </summary>
        public float Radius {
            get => radius;
            set => radius = value;
        }

        /// <summary>
        /// The height of the collider (for capsule/cylinder colliders).
        /// </summary>
        public float Height {
            get => height;
            set => height = value;
        }

        /// <summary>
        /// The friction coefficient.
        /// </summary>
        public float Friction {
            get => friction;
            set => friction = value;
        }

        /// <summary>
        /// The restitution (bounciness).
        /// </summary>
        public float Restitution {
            get => restitution;
            set => restitution = value;
        }

        /// <summary>
        /// Whether this collider is a sensor (trigger).
        /// </summary>
        public bool IsSensor {
            get => isSensor;
            set => isSensor = value;
        }

        public Collider3D() {
            shape = ColliderShape.Box;
            size = new Vector3(1, 1, 1);
            radius = 0.5f;
            height = 1f;
            friction = 0.5f;
            restitution = 0f;
            isSensor = false;
        }

        public Collider3D(ColliderShape shape) {
            this.shape = shape;
            size = new Vector3(1, 1, 1);
            radius = 0.5f;
            height = 1f;
            friction = 0.5f;
            restitution = 0f;
            isSensor = false;
        }

        public Collider3D(ColliderShape shape, Vector3 size) {
            this.shape = shape;
            this.size = size;
            radius = 0.5f;
            height = 1f;
            friction = 0.5f;
            restitution = 0f;
            isSensor = false;
        }

        public override void Added() {
            transform = Entity.GetComponent<Transform3D>();
            if (transform == null) {
                transform = Entity.AddComponent(new Transform3D());
            }

            rigidBody = Entity.GetComponent<RigidBody3D>();
        }

        /// <summary>
        /// Set the collider shape.
        /// </summary>
        public void SetShape(ColliderShape shape) {
            this.shape = shape;
        }

        /// <summary>
        /// Set the size (for box colliders).
        /// </summary>
        public void SetSize(Vector3 size) {
            this.size = size;
        }

        /// <summary>
        /// Set the radius (for sphere/capsule colliders).
        /// </summary>
        public void SetRadius(float radius) {
            this.radius = radius;
        }

        /// <summary>
        /// Set the height (for capsule/cylinder colliders).
        /// </summary>
        public void SetHeight(float height) {
            this.height = height;
        }

        /// <summary>
        /// Set the friction.
        /// </summary>
        public void SetFriction(float friction) {
            this.friction = friction;
        }

        /// <summary>
        /// Set the restitution (bounciness).
        /// </summary>
        public void SetRestitution(float restitution) {
            this.restitution = restitution;
        }

        /// <summary>
        /// Set whether this collider is a sensor (trigger).
        /// </summary>
        public void SetSensor(bool isSensor) {
            this.isSensor = isSensor;
        }
    }
}
