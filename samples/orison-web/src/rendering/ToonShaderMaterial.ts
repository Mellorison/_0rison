import * as THREE from 'three';

/**
 * Custom toon shader material for cel-shaded rendering.
 * Provides Studio Ghibli-style soft cel shading with configurable color bands.
 */
export class ToonShaderMaterial extends THREE.ShaderMaterial {
  constructor(options: {
    color?: THREE.Color;
    ambientColor?: THREE.Color;
    lightColor?: THREE.Color;
    shadowColor?: THREE.Color;
    specularColor?: THREE.Color;
    bands?: number;
    ambientIntensity?: number;
    diffuseIntensity?: number;
    specularIntensity?: number;
    shininess?: number;
  } = {}) {
    const {
      color = new THREE.Color(0xffffff),
      ambientColor = new THREE.Color(0x404040),
      lightColor = new THREE.Color(0xffffff),
      shadowColor = new THREE.Color(0x1a1a2e),
      specularColor = new THREE.Color(0xffffff),
      bands = 4,
      ambientIntensity = 0.4,
      diffuseIntensity = 0.8,
      specularIntensity = 0.5,
      shininess = 32.0
    } = options;

    super({
      uniforms: {
        uColor: { value: color },
        uAmbientColor: { value: ambientColor },
        uLightColor: { value: lightColor },
        uShadowColor: { value: shadowColor },
        uSpecularColor: { value: specularColor },
        uBands: { value: bands },
        uAmbientIntensity: { value: ambientIntensity },
        uDiffuseIntensity: { value: diffuseIntensity },
        uSpecularIntensity: { value: specularIntensity },
        uShininess: { value: shininess },
        uLightPosition: { value: new THREE.Vector3(50, 100, 50) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uAmbientColor;
        uniform vec3 uLightColor;
        uniform vec3 uShadowColor;
        uniform vec3 uSpecularColor;
        uniform float uBands;
        uniform float uAmbientIntensity;
        uniform float uDiffuseIntensity;
        uniform float uSpecularIntensity;
        uniform float uShininess;
        uniform vec3 uLightPosition;

        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        void main() {
          // Ambient
          vec3 ambient = uAmbientColor * uAmbientIntensity;

          // Diffuse with cel-shading bands
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(uLightPosition);
          float diff = max(dot(normal, lightDir), 0.0);
          
          // Quantize diffuse into bands
          float bandStep = 1.0 / uBands;
          float quantizedDiff = floor(diff / bandStep) * bandStep;
          vec3 diffuse = uLightColor * uDiffuseIntensity * quantizedDiff;

          // Specular with cel-shading
          vec3 viewDir = normalize(vViewPosition);
          vec3 reflectDir = reflect(-lightDir, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
          
          // Quantize specular
          float quantizedSpec = step(0.5, spec);
          vec3 specular = uSpecularColor * uSpecularIntensity * quantizedSpec;

          // Shadow tint for darker bands
          vec3 shadowTint = mix(uShadowColor, vec3(1.0), quantizedDiff);
          
          // Combine
          vec3 finalColor = (ambient + diffuse + specular) * uColor * shadowTint;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }

  /**
   * Updates the light position.
   */
  setLightPosition(position: THREE.Vector3): void {
    this.uniforms.uLightPosition.value.copy(position);
  }

  /**
   * Updates the base color.
   */
  setColor(color: THREE.Color): void {
    this.uniforms.uColor.value.copy(color);
  }

  /**
   * Updates the number of color bands.
   */
  setBands(bands: number): void {
    this.uniforms.uBands.value = bands;
  }
}
