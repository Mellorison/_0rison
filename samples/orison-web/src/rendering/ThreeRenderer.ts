import * as THREE from 'three';
import { Scene } from '../core/Scene';
import { Transform3D } from '../components/Transform3D';
import { Camera3D } from '../components/Camera3D';
import { ParticleSystem } from '../components/ParticleSystem';

/**
 * Three.js renderer bridge for Orison Web.
 * Handles WebGL rendering using Three.js.
 */
export class ThreeRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private orisonCamera: Camera3D | null = null;
  private clock: THREE.Clock;

  /**
   * Creates a new Three.js renderer.
   * @param canvas The canvas element to render to.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Create Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false, // FEZ style often uses crisp edges
      alpha: true,
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(1); // Lower pixel ratio for retro look
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Add enhanced fog for quantum realm atmosphere
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

    // Create camera
    const aspect = canvas.width / canvas.height;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Add basic lighting
    this.addDefaultLighting();

    // Add grid helper
    this.addGridHelper();
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
   * Adds default lighting to the scene.
   */
  private addDefaultLighting(): void {
    // Ambient light - slightly warmer for FEZ feel
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffcc, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Configure shadows
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(directionalLight);

    // Hemispheric light for better outdoor look
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x111122, 0.4);
    this.scene.add(hemiLight);
  }

  /**
   * Adds a grid helper to the scene.
   */
  private addGridHelper(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
  }

  /**
   * Renders the scene.
   * @param orisonScene The Orison scene to render.
   */
  render(orisonScene: Scene): void {
    // Update Three.js scene from Orison scene
    this.syncScene(orisonScene);

    // Sync camera from scene's camera entity
    this.syncCamera(orisonScene);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Syncs the camera from the Orison scene.
   * @param orisonScene The Orison scene to sync.
   */
  private syncCamera(orisonScene: Scene): void {
    // Find the camera entity in the scene
    for (const entity of orisonScene.Entities) {
      const camera3D = entity.getComponent(Camera3D);
      if (camera3D) {
        const transform = entity.getComponent(Transform3D);
        if (transform) {
          // Directly sync from transform to renderer camera
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
    // Keep track of which Three.js objects should be in the scene
    const objectsToAdd: THREE.Object3D[] = [];

    // Collect all Three.js objects from entities
    for (const entity of orisonScene.Entities) {
      // Get transform (container for meshes, lights, etc.)
      const transform = entity.getComponent(Transform3D);
      if (transform && transform.ThreeObject) {
        objectsToAdd.push(transform.ThreeObject);
      }

      // Get particle systems (they have their own ThreeObject)
      const components = entity.getComponents();
      for (const comp of components) {
        if (comp instanceof ParticleSystem && comp.ThreeObject) {
          objectsToAdd.push(comp.ThreeObject);
        }
      }
    }

    // Remove objects that are no longer needed (but keep default scene elements)
    const toRemove: THREE.Object3D[] = [];
    for (const child of this.scene.children) {
      if (child instanceof THREE.GridHelper || child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight) {
        continue; // Keep default scene elements
      }
      if (!objectsToAdd.includes(child)) {
        toRemove.push(child);
      }
    }
    for (const obj of toRemove) {
      this.scene.remove(obj);
    }

    // Add new objects
    for (const obj of objectsToAdd) {
      if (!this.scene.children.includes(obj)) {
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
