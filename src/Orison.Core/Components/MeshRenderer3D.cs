namespace Orison {
    /// <summary>
    /// 3D mesh renderer component for rendering 3D meshes.
    /// </summary>
    public class MeshRenderer3D : Component {
        private string meshPath;
        private string materialPath;
        private Transform3D transform;
        private bool visible;

        /// <summary>
        /// The path to the mesh file.
        /// </summary>
        public string MeshPath {
            get => meshPath;
            set => meshPath = value;
        }

        /// <summary>
        /// The path to the material file.
        /// </summary>
        public string MaterialPath {
            get => materialPath;
            set => materialPath = value;
        }

        /// <summary>
        /// Whether the mesh is visible.
        /// </summary>
        public bool Visible {
            get => visible;
            set => visible = value;
        }

        public MeshRenderer3D() {
            meshPath = string.Empty;
            materialPath = string.Empty;
            visible = true;
        }

        public MeshRenderer3D(string meshPath) {
            this.meshPath = meshPath;
            this.materialPath = string.Empty;
            visible = true;
        }

        public MeshRenderer3D(string meshPath, string materialPath) {
            this.meshPath = meshPath;
            this.materialPath = materialPath;
            visible = true;
        }

        public override void Added() {
            transform = Entity.GetComponent<Transform3D>();
            if (transform == null) {
                transform = Entity.AddComponent(new Transform3D());
            }
        }

        /// <summary>
        /// Set the mesh path.
        /// </summary>
        public void SetMesh(string path) {
            meshPath = path;
        }

        /// <summary>
        /// Set the material path.
        /// </summary>
        public void SetMaterial(string path) {
            materialPath = path;
        }
    }
}
