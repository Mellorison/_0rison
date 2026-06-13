namespace Orison {
    /// <summary>
    /// Light types for 3D lighting.
    /// </summary>
    public enum LightType {
        Ambient,
        Directional,
        Point,
        Spot,
        Hemisphere
    }

    /// <summary>
    /// 3D light component for illuminating the scene.
    /// </summary>
    public class Light3D : Component {
        private LightType type;
        private float intensity;
        private float range;
        private float spotAngle;
        private Transform3D transform;
        private bool castShadows;

        /// <summary>
        /// The type of light.
        /// </summary>
        public LightType Type {
            get => type;
            set => type = value;
        }

        /// <summary>
        /// The intensity of the light.
        /// </summary>
        public float Intensity {
            get => intensity;
            set => intensity = value;
        }

        /// <summary>
        /// The range of the light (for point/spot lights).
        /// </summary>
        public float Range {
            get => range;
            set => range = value;
        }

        /// <summary>
        /// The spot angle in degrees (for spot lights).
        /// </summary>
        public float SpotAngle {
            get => spotAngle;
            set => spotAngle = value;
        }

        /// <summary>
        /// Whether this light casts shadows.
        /// </summary>
        public bool CastShadows {
            get => castShadows;
            set => castShadows = value;
        }

        public Light3D() {
            type = LightType.Directional;
            intensity = 1f;
            range = 10f;
            spotAngle = 45f;
            castShadows = false;
        }

        public Light3D(LightType type, float intensity = 1f) {
            this.type = type;
            this.intensity = intensity;
            this.range = 10f;
            this.spotAngle = 45f;
            this.castShadows = false;
        }

        public override void Added() {
            transform = Entity.GetComponent<Transform3D>();
            if (transform == null) {
                transform = Entity.AddComponent(new Transform3D());
            }
        }

        /// <summary>
        /// Set the light intensity.
        /// </summary>
        public void SetIntensity(float intensity) {
            this.intensity = intensity;
        }

        /// <summary>
        /// Set the light range.
        /// </summary>
        public void SetRange(float range) {
            this.range = range;
        }

        /// <summary>
        /// Set the spot angle.
        /// </summary>
        public void SetSpotAngle(float angle) {
            this.spotAngle = angle;
        }
    }
}
