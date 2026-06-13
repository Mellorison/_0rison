namespace Orison {
    /// <summary>
    /// Rigid body types for physics simulation.
    /// </summary>
    public enum RigidBodyType {
        Static,
        Dynamic,
        Kinematic
    }

    /// <summary>
    /// 3D rigid body component for physics simulation.
    /// </summary>
    public class RigidBody3D : Component {
        private RigidBodyType type;
        private float mass;
        private float linearDamping;
        private float angularDamping;
        private Transform3D transform;
        private Vector3 linearVelocity;
        private Vector3 angularVelocity;

        /// <summary>
        /// The type of rigid body.
        /// </summary>
        public RigidBodyType Type {
            get => type;
            set => type = value;
        }

        /// <summary>
        /// The mass of the rigid body.
        /// </summary>
        public float Mass {
            get => mass;
            set => mass = value;
        }

        /// <summary>
        /// Linear damping (air resistance).
        /// </summary>
        public float LinearDamping {
            get => linearDamping;
            set => linearDamping = value;
        }

        /// <summary>
        /// Angular damping (rotational air resistance).
        /// </summary>
        public float AngularDamping {
            get => angularDamping;
            set => angularDamping = value;
        }

        /// <summary>
        /// Current linear velocity.
        /// </summary>
        public Vector3 LinearVelocity {
            get => linearVelocity;
            set => linearVelocity = value;
        }

        /// <summary>
        /// Current angular velocity.
        /// </summary>
        public Vector3 AngularVelocity {
            get => angularVelocity;
            set => angularVelocity = value;
        }

        public RigidBody3D() {
            type = RigidBodyType.Dynamic;
            mass = 1f;
            linearDamping = 0.01f;
            angularDamping = 0.01f;
            linearVelocity = Vector3.Zero;
            angularVelocity = Vector3.Zero;
        }

        public RigidBody3D(RigidBodyType type, float mass = 1f) {
            this.type = type;
            this.mass = mass;
            this.linearDamping = 0.01f;
            this.angularDamping = 0.01f;
            linearVelocity = Vector3.Zero;
            angularVelocity = Vector3.Zero;
        }

        public override void Added() {
            transform = Entity.GetComponent<Transform3D>();
            if (transform == null) {
                transform = Entity.AddComponent(new Transform3D());
            }
        }

        public override void Update() {
            // Physics simulation would be handled by the physics engine
            // This is a placeholder for the physics integration
        }

        /// <summary>
        /// Apply a force to the rigid body.
        /// </summary>
        public void ApplyForce(Vector3 force) {
            // Physics engine integration
        }

        /// <summary>
        /// Apply an impulse to the rigid body.
        /// </summary>
        public void ApplyImpulse(Vector3 impulse) {
            // Physics engine integration
        }

        /// <summary>
        /// Apply torque to the rigid body.
        /// </summary>
        public void ApplyTorque(Vector3 torque) {
            // Physics engine integration
        }

        /// <summary>
        /// Set the linear velocity.
        /// </summary>
        public void SetLinearVelocity(Vector3 velocity) {
            linearVelocity = velocity;
        }

        /// <summary>
        /// Set the angular velocity.
        /// </summary>
        public void SetAngularVelocity(Vector3 velocity) {
            angularVelocity = velocity;
        }
    }
}
