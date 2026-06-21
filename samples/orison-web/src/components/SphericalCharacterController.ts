import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import { InputActionManager } from '../input/InputAction';
import { SphericalWorld } from '../world/SphericalWorld';
import * as THREE from 'three';

/**
 * Spherical character controller for walking on a small planet.
 * Handles surface-aligned movement with gravity toward planet center.
 */
export class SphericalCharacterController extends Component {
  private transform: Transform3D | null = null;
  private inputManager: InputActionManager;
  private world: SphericalWorld;
  private camera: THREE.PerspectiveCamera;

  // Movement parameters
  private moveSpeed: number = 6.0;
  private rotationSpeed: number = 8.0;
  private gravity: number = 15.0;
  private jumpForce: number = 6.0;

  // State
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = true;
  private surfaceNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private currentLat: number = 0;
  private currentLon: number = 0;

  // Input actions
  private readonly MOVE_FORWARD = 'MoveForward';
  private readonly MOVE_BACKWARD = 'MoveBackward';
  private readonly MOVE_LEFT = 'MoveLeft';
  private readonly MOVE_RIGHT = 'MoveRight';
  private readonly JUMP = 'Jump';
  private readonly SPRINT = 'Sprint';

  constructor(inputManager: InputActionManager, world: SphericalWorld, camera: THREE.PerspectiveCamera) {
    super();
    this.inputManager = inputManager;
    this.world = world;
    this.camera = camera;
  }

  /**
   * Sets up input actions.
   */
  setupInputs(): void {
    this.inputManager.createAction(this.MOVE_FORWARD).addKey('KeyW').addKey('ArrowUp');
    this.inputManager.createAction(this.MOVE_BACKWARD).addKey('KeyS').addKey('ArrowDown');
    this.inputManager.createAction(this.MOVE_LEFT).addKey('KeyA').addKey('ArrowLeft');
    this.inputManager.createAction(this.MOVE_RIGHT).addKey('KeyD').addKey('ArrowRight');
    this.inputManager.createAction(this.JUMP).addKey('Space');
    this.inputManager.createAction(this.SPRINT).addKey('ShiftLeft').addKey('ShiftRight');
  }

  override added(): void {
    this.transform = this.Entity?.getComponent(Transform3D) || null;
    this.setupInputs();

    // Place player on surface at starting location
    if (this.transform) {
      const startPos = this.world.latLonToPosition(0, 0, 1.0); // 1 unit above surface
      this.transform.setPosition(startPos.x, startPos.y, startPos.z);
    }
  }

  override update(deltaTime: number): void {
    if (!this.transform) return;

    // Get current surface normal (gravity direction)
    this.surfaceNormal = this.world.getSurfaceNormal(this.transform.Position);

    // Check if grounded
    const height = this.world.getSurfaceHeight(this.transform.Position);
    this.isGrounded = height <= 0.5;

    // Apply gravity toward planet center
    const gravityDir = this.surfaceNormal.clone().negate();
    this.velocity.add(gravityDir.multiplyScalar(this.gravity * deltaTime));

    // Get input
    const moveForward = this.inputManager.getAction(this.MOVE_FORWARD)?.Pressed || false;
    const moveBackward = this.inputManager.getAction(this.MOVE_BACKWARD)?.Pressed || false;
    const moveLeft = this.inputManager.getAction(this.MOVE_LEFT)?.Pressed || false;
    const moveRight = this.inputManager.getAction(this.MOVE_RIGHT)?.Pressed || false;
    const jump = this.inputManager.getAction(this.JUMP)?.Pressed || false;
    const sprint = this.inputManager.getAction(this.SPRINT)?.Pressed || false;

    // Calculate movement relative to surface
    const moveDirection = this.calculateMoveDirection(moveForward, moveBackward, moveLeft, moveRight);

    // Apply sprint
    let currentSpeed = this.moveSpeed;
    if (sprint) currentSpeed *= 1.6;

    // Apply movement velocity (tangential to surface)
    if (moveDirection.length() > 0.1) {
      moveDirection.normalize();
      const moveVelocity = moveDirection.multiplyScalar(currentSpeed);

      // Smoothly blend with existing velocity
      this.velocity.lerp(moveVelocity, 5 * deltaTime);
    } else {
      // Decelerate
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), 5 * deltaTime);
    }

    // Jump
    if (jump && this.isGrounded) {
      const jumpDir = this.surfaceNormal.clone().multiplyScalar(this.jumpForce);
      this.velocity.add(jumpDir);
    }

    // Update position
    const currentPos = this.transform.Position.clone();
    const newPos = currentPos.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Snap to surface and orient
    this.transform.setPosition(newPos.x, newPos.y, newPos.z);
    this.orientToSurface();

    // Update lat/lon for reference
    const latLon = this.world.positionToLatLon(this.transform.Position);
    this.currentLat = latLon.lat;
    this.currentLon = latLon.lon;

    // Update camera to follow
    this.updateCamera();
  }

  /**
   * Calculates movement direction relative to camera and surface.
   */
  private calculateMoveDirection(
    forward: boolean, backward: boolean, left: boolean, right: boolean
  ): THREE.Vector3 {
    const moveDir = new THREE.Vector3();

    // Get camera forward direction projected onto surface
    const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    // Project onto tangent plane (perpendicular to surface normal)
    camForward.sub(this.surfaceNormal.clone().multiplyScalar(camForward.dot(this.surfaceNormal))).normalize();

    // Right vector
    const camRight = new THREE.Vector3().crossVectors(this.surfaceNormal, camForward).normalize();

    if (forward) moveDir.add(camForward);
    if (backward) moveDir.sub(camForward);
    if (right) moveDir.add(camRight);
    if (left) moveDir.sub(camRight);

    return moveDir;
  }

  /**
   * Orients the character to align with surface normal.
   */
  private orientToSurface(): void {
    if (!this.transform) return;

    const up = new THREE.Vector3(0, 1, 0);
    const targetNormal = this.surfaceNormal;

    // Create rotation that aligns character's up with surface normal
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, targetNormal);

    // Smoothly interpolate rotation
    const currentQuat = new THREE.Quaternion().setFromEuler(this.transform.Rotation);
    currentQuat.slerp(quaternion, 0.15);

    const euler = new THREE.Euler().setFromQuaternion(currentQuat);
    this.transform.setRotation(euler.x, euler.y, euler.z);
  }

  /**
   * Updates camera to orbit around player while maintaining orientation.
   */
  private updateCamera(): void {
    if (!this.transform) return;

    const playerPos = this.transform.Position;
    const camOffset = new THREE.Vector3(0, 8, 15);

    // Transform offset to surface-aligned space
    const surfaceNormal = this.world.getSurfaceNormal(playerPos);
    const up = new THREE.Vector3(0, 1, 0);
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(up, surfaceNormal);

    camOffset.applyQuaternion(alignQuat);
    const targetPos = playerPos.clone().add(camOffset);

    // Smooth camera movement
    this.camera.position.lerp(targetPos, 0.05);

    // Look at player from surface-normal perspective
    const lookTarget = playerPos.clone().add(surfaceNormal.multiplyScalar(2));
    this.camera.lookAt(lookTarget);
  }

  /**
   * Gets whether the character is currently grounded.
   */
  get IsGrounded(): boolean {
    return this.isGrounded;
  }

  /**
   * Gets current latitude.
   */
  get Latitude(): number {
    return this.currentLat;
  }

  /**
   * Gets current longitude.
   */
  get Longitude(): number {
    return this.currentLon;
  }
}
