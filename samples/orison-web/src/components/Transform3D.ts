import { Component } from '../core/Component';
import * as THREE from 'three';

/**
 * 3D transform component for positioning, rotating, and scaling entities in 3D space.
 */
export class Transform3D extends Component {
  private position: THREE.Vector3;
  private rotation: THREE.Euler;
  private scale: THREE.Vector3;
  private threeObject: THREE.Object3D;

  constructor() {
    super();
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.scale = new THREE.Vector3(1, 1, 1);
    this.threeObject = new THREE.Object3D();
  }

  /**
   * Gets the position.
   */
  get Position(): THREE.Vector3 {
    return this.position;
  }

  /**
   * Gets the rotation.
   */
  get Rotation(): THREE.Euler {
    return this.rotation;
  }

  /**
   * Gets the scale.
   */
  get Scale(): THREE.Vector3 {
    return this.scale;
  }

  /**
   * Gets the Three.js Object3D.
   */
  get ThreeObject(): THREE.Object3D {
    return this.threeObject;
  }

  /**
   * Sets the position.
   */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.threeObject.position.set(x, y, z);
  }

  /**
   * Sets the rotation (in radians).
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation.set(x, y, z);
    this.threeObject.rotation.set(x, y, z);
  }

  /**
   * Sets the scale.
   */
  setScale(x: number, y: number, z: number): void {
    this.scale.set(x, y, z);
    this.threeObject.scale.set(x, y, z);
  }

  /**
   * Translates the position.
   */
  translate(x: number, y: number, z: number): void {
    this.position.add(new THREE.Vector3(x, y, z));
    this.threeObject.position.add(new THREE.Vector3(x, y, z));
  }

  /**
   * Rotates the object.
   */
  rotate(x: number, y: number, z: number): void {
    this.rotation.x += x;
    this.rotation.y += y;
    this.rotation.z += z;
    this.threeObject.rotation.x += x;
    this.threeObject.rotation.y += y;
    this.threeObject.rotation.z += z;
  }

  /**
   * Scales the object.
   */
  scaleBy(x: number, y: number, z: number): void {
    this.scale.multiply(new THREE.Vector3(x, y, z));
    this.threeObject.scale.multiply(new THREE.Vector3(x, y, z));
  }

  /**
   * Looks at a target position.
   */
  lookAt(target: THREE.Vector3): void {
    this.threeObject.lookAt(target);
  }

  override update(deltaTime: number): void {
    // Sync Three.js object with transform values
    this.threeObject.position.copy(this.position);
    this.threeObject.rotation.copy(this.rotation);
    this.threeObject.scale.copy(this.scale);
  }
}
