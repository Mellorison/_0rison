namespace Orison {
    /// <summary>
    /// Camera configuration options.
    /// </summary>
    public enum CameraType {
        Perspective,
        Orthographic
    }

    /// <summary>
    /// 3D camera component for controlling the view.
    /// </summary>
    public class Camera3D : Component {
        private CameraType type;
        private float fov;
        private float near;
        private float far;
        private float zoom;
        private Transform3D transform;
        private Transform3D target;
        private float followSpeed;
        private bool isMainCamera;

        /// <summary>
        /// The type of camera.
        /// </summary>
        public CameraType Type {
            get => type;
            set => type = value;
        }

        /// <summary>
        /// Field of view in degrees (for perspective cameras).
        /// </summary>
        public float FOV {
            get => fov;
            set => fov = value;
        }

        /// <summary>
        /// Near clipping plane.
        /// </summary>
        public float Near {
            get => near;
            set => near = value;
        }

        /// <summary>
        /// Far clipping plane.
        /// </summary>
        public float Far {
            get => far;
            set => far = value;
        }

        /// <summary>
        /// Zoom level (for orthographic cameras).
        /// </summary>
        public float Zoom {
            get => zoom;
            set => zoom = value;
        }

        /// <summary>
        /// Whether this is the main camera.
        /// </summary>
        public bool IsMainCamera {
            get => isMainCamera;
            set => isMainCamera = value;
        }

        /// <summary>
        /// The transform this camera is following.
        /// </summary>
        public Transform3D Target {
            get => target;
            set => target = value;
        }

        /// <summary>
        /// How quickly the camera follows the target (0-1).
        /// </summary>
        public float FollowSpeed {
            get => followSpeed;
            set => followSpeed = Math.Clamp(value, 0, 1);
        }

        public Camera3D() {
            type = CameraType.Perspective;
            fov = 60f;
            near = 0.1f;
            far = 1000f;
            zoom = 1f;
            followSpeed = 0.1f;
            isMainCamera = false;
        }

        public Camera3D(CameraType type, float fov = 60f, float near = 0.1f, float far = 1000f) {
            this.type = type;
            this.fov = fov;
            this.near = near;
            this.far = far;
            this.zoom = 1f;
            followSpeed = 0.1f;
            isMainCamera = false;
        }

        public override void Added() {
            transform = Entity.GetComponent<Transform3D>();
            if (transform == null) {
                transform = Entity.AddComponent(new Transform3D());
            }
        }

        public override void Update() {
            if (target != null && transform != null) {
                // Smooth follow
                Vector3 targetPos = target.Position;
                Vector3 currentPos = transform.Position;
                Vector3 newPos = Vector3.Lerp(currentPos, targetPos, followSpeed);
                transform.Position = newPos;
            }
        }

        /// <summary>
        /// Make the camera follow a transform.
        /// </summary>
        public void Follow(Transform3D target, float speed = 0.1f) {
            this.target = target;
            this.followSpeed = speed;
        }

        /// <summary>
        /// Stop following the current target.
        /// </summary>
        public void StopFollowing() {
            target = null;
        }

        /// <summary>
        /// Set the camera position instantly.
        /// </summary>
        public void SnapTo(Vector3 position) {
            if (transform != null) {
                transform.Position = position;
            }
        }

        /// <summary>
        /// Look at a point in world space.
        /// </summary>
        public void LookAt(Vector3 target) {
            if (transform != null) {
                Vector3 direction = (target - transform.Position).Normalized();
                // Simple Y-rotation calculation
                transform.Rotation = new Vector3(0, (float)Math.Atan2(direction.X, direction.Z), 0);
            }
        }
    }
}
