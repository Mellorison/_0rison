import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import * as THREE from 'three';

/**
 * Mesh renderer component for rendering 3D meshes.
 */
export class MeshRenderer extends Component {
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.Material | null = null;
  private transform: Transform3D | null = null;

  /**
   * Creates a mesh renderer with a box geometry.
   * @param width Width of the box.
   * @param height Height of the box.
   * @param depth Depth of the box.
   * @param color Color of the mesh.
   */
  static createBox(width: number = 1, height: number = 1, depth: number = 1, color: number = 0xffffff): MeshRenderer {
    const renderer = new MeshRenderer();
    renderer.geometry = new THREE.BoxGeometry(width, height, depth);
    renderer.material = new THREE.MeshToonMaterial({ color });
    return renderer;
  }

  /**
   * Creates a mesh renderer with a sphere geometry.
   * @param radius Radius of the sphere.
   * @param color Color of the mesh.
   */
  static createSphere(radius: number = 1, color: number = 0xffffff): MeshRenderer {
    const renderer = new MeshRenderer();
    renderer.geometry = new THREE.SphereGeometry(radius, 16, 16);
    renderer.material = new THREE.MeshToonMaterial({ color });
    return renderer;
  }

  /**
   * Creates a mesh renderer with a plane geometry.
   * @param width Width of the plane.
   * @param height Height of the plane.
   * @param color Color of the mesh.
   */
  static createPlane(width: number = 1, height: number = 1, color: number = 0xffffff): MeshRenderer {
    const renderer = new MeshRenderer();
    renderer.geometry = new THREE.PlaneGeometry(width, height);
    renderer.material = new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide });
    return renderer;
  }

  /**
   * Creates a mesh renderer with a torus geometry.
   * @param radius Radius of the torus.
   * @param tube Radius of the tube.
   * @param color Color of the mesh.
   */
  static createTorus(radius: number = 1, tube: number = 0.4, color: number = 0xffffff): MeshRenderer {
    const renderer = new MeshRenderer();
    renderer.geometry = new THREE.TorusGeometry(radius, tube, 12, 24);
    renderer.material = new THREE.MeshToonMaterial({ color });
    return renderer;
  }

  /**
   * Creates a mesh renderer with a custom geometry and material.
   */
  static createCustom(geometry: THREE.BufferGeometry, material: THREE.Material): MeshRenderer {
    const renderer = new MeshRenderer();
    renderer.geometry = geometry;
    renderer.material = material;
    return renderer;
  }

  /**
   * Gets the Three.js mesh.
   */
  get Mesh(): THREE.Mesh | null {
    return this.mesh;
  }

  /**
   * Sets the geometry.
   */
  setGeometry(geometry: THREE.BufferGeometry): void {
    this.geometry = geometry;
    if (this.mesh) {
      this.mesh.geometry = geometry;
    }
  }

  /**
   * Sets the material.
   */
  setMaterial(material: THREE.Material): void {
    this.material = material;
    if (this.mesh) {
      this.mesh.material = material;
    }
  }

  override added(): void {
    // Get transform component
    this.transform = this.Entity?.getComponent(Transform3D) || null;

    // Create mesh if geometry and material are set
    if (this.geometry && this.material) {
      this.createMesh();
    }
  }

  private createMesh(): void {
    if (!this.geometry || !this.material) return;

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add to transform's Three.js object
    if (this.transform) {
      this.transform.ThreeObject.add(this.mesh);
    }
  }

  override update(deltaTime: number): void {
    // Mesh updates are handled by the transform component
  }

  override render(): void {
    // Rendering is handled by the Three.js renderer
  }

  override removed(): void {
    if (this.mesh) {
      if (this.transform) {
        this.transform.ThreeObject.remove(this.mesh);
      }
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }

  override onDestroy(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      if (Array.isArray(this.material)) {
        this.material.forEach(m => m.dispose());
      } else {
        this.material.dispose();
      }
      this.material = null;
    }
  }
}
