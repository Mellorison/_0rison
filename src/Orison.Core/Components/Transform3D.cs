namespace Orison {
    /// <summary>
    /// 3D transform component for positioning, rotating, and scaling entities in 3D space.
    /// </summary>
    public class Transform3D : Component {
        private Vector3 position;
        private Vector3 rotation; // Euler angles in radians
        private Vector3 scale;

        /// <summary>
        /// The position in 3D space.
        /// </summary>
        public Vector3 Position {
            get => position;
            set => position = value;
        }

        /// <summary>
        /// The rotation as Euler angles (radians).
        /// </summary>
        public Vector3 Rotation {
            get => rotation;
            set => rotation = value;
        }

        /// <summary>
        /// The scale.
        /// </summary>
        public Vector3 Scale {
            get => scale;
            set => scale = value;
        }

        public Transform3D() {
            position = Vector3.Zero;
            rotation = Vector3.Zero;
            scale = Vector3.One;
        }

        public Transform3D(Vector3 position) {
            this.position = position;
            this.rotation = Vector3.Zero;
            this.scale = Vector3.One;
        }

        public Transform3D(Vector3 position, Vector3 rotation) {
            this.position = position;
            this.rotation = rotation;
            this.scale = Vector3.One;
        }

        public Transform3D(Vector3 position, Vector3 rotation, Vector3 scale) {
            this.position = position;
            this.rotation = rotation;
            this.scale = scale;
        }

        /// <summary>
        /// Set the position.
        /// </summary>
        public void SetPosition(float x, float y, float z) {
            position = new Vector3(x, y, z);
        }

        /// <summary>
        /// Set the rotation (in radians).
        /// </summary>
        public void SetRotation(float x, float y, float z) {
            rotation = new Vector3(x, y, z);
        }

        /// <summary>
        /// Set the scale.
        /// </summary>
        public void SetScale(float x, float y, float z) {
            scale = new Vector3(x, y, z);
        }

        /// <summary>
        /// Translate the position.
        /// </summary>
        public void Translate(float x, float y, float z) {
            position += new Vector3(x, y, z);
        }

        /// <summary>
        /// Translate by a vector.
        /// </summary>
        public void Translate(Vector3 delta) {
            position += delta;
        }

        /// <summary>
        /// Rotate the object.
        /// </summary>
        public void Rotate(float x, float y, float z) {
            rotation += new Vector3(x, y, z);
        }

        /// <summary>
        /// Rotate by a vector.
        /// </summary>
        public void Rotate(Vector3 delta) {
            rotation += delta;
        }

        /// <summary>
        /// Scale the object.
        /// </summary>
        public void ScaleBy(float x, float y, float z) {
            scale *= new Vector3(x, y, z);
        }

        /// <summary>
        /// Scale by a vector.
        /// </summary>
        public void ScaleBy(Vector3 factor) {
            scale *= factor;
        }

        /// <summary>
        /// Get the forward direction vector.
        /// </summary>
        public Vector3 Forward() {
            // Simple forward calculation based on Y rotation
            float cosY = (float)Math.Cos(rotation.Y);
            float sinY = (float)Math.Sin(rotation.Y);
            return new Vector3(-sinY, 0, -cosY);
        }

        /// <summary>
        /// Get the right direction vector.
        /// </summary>
        public Vector3 Right() {
            // Simple right calculation based on Y rotation
            float cosY = (float)Math.Cos(rotation.Y);
            float sinY = (float)Math.Sin(rotation.Y);
            return new Vector3(cosY, 0, -sinY);
        }

        /// <summary>
        /// Get the up direction vector.
        /// </summary>
        public Vector3 Up() {
            return Vector3.Up;
        }
    }
}
