import * as THREE from 'three';
import { Scene } from '../core/Scene';
import { Transform3D } from '../components/Transform3D';
import { Camera3D } from '../components/Camera3D';
import { ParticleSystem } from '../components/ParticleSystem';
import { ToonShaderMaterial } from './ToonShaderMaterial';

/**
 * Enhanced Three.js renderer with cel-shaded rendering, post-processing, and optimization.
 * Matches Messenger's visual quality with Studio Ghibli-style soft cel shading.
 */
export class EnhancedRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private orisonCamera: Camera3D | null = null;
  private clock: THREE.Clock;
  private toonShader: ToonShaderMaterial;

  /**
   * Creates a new enhanced renderer.
   * @param canvas The canvas element to render to.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Create Three.js renderer with Messenger-like settings
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Create Three.js scene
    this.scene = new THREE.Scene();

    // Messenger-style soft sky gradient using a large inverted sphere
    this.createSkyDome();

    // Atmospheric fog - very light haze
    this.scene.fog = new THREE.FogExp2(0xd4e8f5, 0.004);

    // Create camera - wider FOV for the small planet perspective
    const aspect = canvas.width / canvas.height;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500);
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 0, 0);

    // Initialize toon shader
    this.toonShader = new ToonShaderMaterial({
      color: new THREE.Color(0xffffff),
      bands: 4,
      ambientIntensity: 0.3,
      diffuseIntensity: 0.9
    });

    // Add enhanced lighting
    this.addEnhancedLighting();
  }

  /**
   * Gets the Three.js scene.
   */
  get ThreeScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Gets the Three.js camera.
   */
  get ThreeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Gets the Three.js renderer.
   */
  get ThreeRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Gets the toon shader material.
   */
  get ToonShader(): ToonShaderMaterial {
    return this.toonShader;
  }

  /**
   * Creates a soft gradient sky dome.
   */
  private createSkyDome(): void {
    const skyGeo = new THREE.SphereGeometry(250, 16, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87CEEB) },
        bottomColor: { value: new THREE.Color(0xe8f4f8) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    (sky as any).userData = { isEnvironment: true };
    this.scene.add(sky);
  }

  /**
   * Adds enhanced lighting for cel-shaded rendering.
   */
  private addEnhancedLighting(): void {
    // Bright ambient for PBR
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Strong main sun with shadows
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.0);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Cool fill from opposite side
    const fillLight = new THREE.DirectionalLight(0xc8d8e8, 0.5);
    fillLight.position.set(-30, 20, -20);
    this.scene.add(fillLight);

    // Rim light for character edge definition
    const rimLight = new THREE.DirectionalLight(0xffe4b5, 0.8);
    rimLight.position.set(-20, 10, 40);
    this.scene.add(rimLight);

    // Hemisphere for natural sky/ground bounce
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x5a4a3a, 0.5);
    this.scene.add(hemiLight);
  }

  /**
   * Renders the scene.
   * @param orisonScene The Orison scene to render.
   */
  render(orisonScene: Scene): void {
    // Update Three.js scene from Orison scene
    this.syncScene(orisonScene);

    // Note: Camera is managed by ExplorationScene, not synced from entities
    // Sync camera from scene's camera entity
    // this.syncCamera(orisonScene);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Syncs the camera from the Orison scene.
   * @param orisonScene The Orison scene to sync.
   */
  private syncCamera(orisonScene: Scene): void {
    for (const entity of orisonScene.Entities) {
      const camera3D = entity.getComponent(Camera3D);
      if (camera3D) {
        const transform = entity.getComponent(Transform3D);
        if (transform) {
          this.camera.position.set(transform.Position.x, transform.Position.y, transform.Position.z);
          this.camera.rotation.set(transform.Rotation.x, transform.Rotation.y, transform.Rotation.z);
          break;
        }
      }
    }
  }

  /**
   * Syncs the Orison scene with the Three.js scene.
   * @param orisonScene The Orison scene to sync.
   */
  private syncScene(orisonScene: Scene): void {
    const objectsToAdd: THREE.Object3D[] = [];

    for (const entity of orisonScene.Entities) {
      const transform = entity.getComponent(Transform3D);
      if (transform && transform.ThreeObject) {
        objectsToAdd.push(transform.ThreeObject);
      }

      const components = entity.getComponents();
      for (const comp of components) {
        if (comp instanceof ParticleSystem && comp.ThreeObject) {
          objectsToAdd.push(comp.ThreeObject);
        }
      }
    }

    // Use Set for O(1) lookups instead of O(N) array.includes
    const objectsToAddSet = new Set(objectsToAdd);
    const sceneChildrenSet = new Set(this.scene.children);

    const toRemove: THREE.Object3D[] = [];
    for (const child of this.scene.children) {
      if (child instanceof THREE.AmbientLight ||
          child instanceof THREE.DirectionalLight ||
          child instanceof THREE.HemisphereLight) {
        continue; // Keep lights
      }
      // Skip environment objects not managed by entities
      if ((child as any).userData?.isEnvironment) {
        continue;
      }
      if (!objectsToAddSet.has(child)) {
        toRemove.push(child);
      }
    }
    for (const obj of toRemove) {
      this.scene.remove(obj);
    }

    for (const obj of objectsToAdd) {
      if (!sceneChildrenSet.has(obj)) {
        this.scene.add(obj);
      }
    }
  }

  /**
   * Resizes the renderer to match the canvas size.
   */
  resize(): void {
    const width = this.canvas.clientWidth || this.canvas.width;
    const height = this.canvas.clientHeight || this.canvas.height;
    
    if (width > 0 && height > 0) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Disposes of renderer resources.
   */
  dispose(): void {
    this.renderer.dispose();
  }
}
