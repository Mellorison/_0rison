import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import * as THREE from 'three';

/**
 * Camera configuration options.
 */
export interface Camera3DOptions {
  fov?: number;
  near?: number;
  far?: number;
  orthographic?: boolean;
  zoom?: number;
}

/**
 * 3D camera component for controlling the view.
 */
export class Camera3D extends Component {
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private transform: Transform3D | null = null;
  private target: Transform3D | null = null;
  private followSpeed: number = 0.1;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(options: Camera3DOptions = {}) {
    super();
    
    const fov = options.fov ?? 60;
    const near = options.near ?? 0.1;
    const far = options.far ?? 1000;
    const zoom = options.zoom ?? 1;

    if (options.orthographic) {
      // Create orthographic camera
      const aspect = window.innerWidth / window.innerHeight;
      const frustumSize = 10;
      this.camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        near,
        far
      );
      this.camera.zoom = zoom;
    } else {
      // Create perspective camera
      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    }

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Gets the Three.js camera.
   */
  get Camera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.camera;
  }

  /**
   * Gets the follow speed.
   */
  get FollowSpeed(): number {
    return this.followSpeed;
  }

  set FollowSpeed(value: number) {
    this.followSpeed = Math.max(0, Math.min(1, value));
  }

  /**
   * Makes the camera follow a transform.
   * @param target The transform to follow.
   * @param offset Optional offset from the target.
   */
  follow(target: Transform3D, offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    this.target = target;
  }

  /**
   * Stops following the current target.
   */
  stopFollowing(): void {
    this.target = null;
  }

  /**
   * Shakes the camera.
   * @param intensity The intensity of the shake.
   * @param duration The duration in seconds.
   */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  /**
   * Sets the camera position instantly.
   */
  snapTo(position: THREE.Vector3): void {
    this.camera.position.copy(position);
  }

  /**
   * Sets the camera to look at a point.
   */
  lookAt(target: THREE.Vector3): void {
    this.camera.lookAt(target);
  }

  override added(): void {
    this.transform = this.Entity?.getComponent(Transform3D) || null;
  }

  override update(deltaTime: number): void {
    // Update camera from transform if available
    if (this.transform) {
      this.camera.position.copy(this.transform.Position);
      this.camera.rotation.copy(this.transform.Rotation);
    }

    // Follow target
    if (this.target) {
      const targetPos = this.target.Position.clone();
      const currentPos = this.camera.position.clone();
      const newPos = currentPos.lerp(targetPos, this.followSpeed);
      this.camera.position.copy(newPos);
    }

    // Handle shake
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += deltaTime;
      
      if (this.shakeTimer >= this.shakeDuration) {
        this.shakeIntensity = 0;
        this.shakeOffset.set(0, 0, 0);
      } else {
        const progress = this.shakeTimer / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - progress);
        
        this.shakeOffset.set(
          Math.sin(this.shakeTimer * 50) * currentIntensity,
          Math.cos(this.shakeTimer * 50) * currentIntensity,
          Math.sin(this.shakeTimer * 30) * currentIntensity
        );
        
        this.camera.position.add(this.shakeOffset);
      }
    }
  }

  /**
   * Resizes the camera aspect ratio.
   * @param width The new width.
   * @param height The new height.
   */
  resize(width: number, height: number): void {
    const aspect = width / height;
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
    } else {
      const frustumSize = 10;
      this.camera.left = frustumSize * aspect / -2;
      this.camera.right = frustumSize * aspect / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = frustumSize / -2;
    }
    
    this.camera.updateProjectionMatrix();
  }

  /**
   * Converts a world position to screen coordinates.
   * @param worldPosition The world position to convert.
   * @param canvasWidth The canvas width.
   * @param canvasHeight The canvas height.
   * @returns Screen coordinates {x, y} or null if behind camera.
   */
  worldToScreen(worldPosition: THREE.Vector3, canvasWidth: number, canvasHeight: number): { x: number; y: number } | null {
    const vector = worldPosition.clone();
    vector.project(this.camera);

    // Check if the point is behind the camera
    if (vector.z > 1) {
      return null;
    }

    const x = (vector.x * 0.5 + 0.5) * canvasWidth;
    const y = (-(vector.y * 0.5) + 0.5) * canvasHeight;

    return { x, y };
  }

  /**
   * Converts screen coordinates to a world position on a plane.
   * @param screenX Screen X coordinate.
   * @param screenY Screen Y coordinate.
   * @param planeY The Y position of the plane.
   * @param canvasWidth The canvas width.
   * @param canvasHeight The canvas height.
   * @returns World position or null if ray doesn't intersect plane.
   */
  screenToWorld(screenX: number, screenY: number, planeY: number, canvasWidth: number, canvasHeight: number): THREE.Vector3 | null {
    const vector = new THREE.Vector3();
    vector.set(
      (screenX / canvasWidth) * 2 - 1,
      -(screenY / canvasHeight) * 2 + 1,
      0.5
    );

    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = (planeY - this.camera.position.y) / dir.y;

    if (distance < 0) {
      return null;
    }

    return this.camera.position.clone().add(dir.multiplyScalar(distance));
  }
}
