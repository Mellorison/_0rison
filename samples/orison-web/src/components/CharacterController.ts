import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import { InputActionManager } from '../input/InputAction';
import * as THREE from 'three';

/**
 * Third-person character controller for exploration gameplay.
 * Supports smooth movement, camera-relative controls, and mobile touch input.
 */
export class CharacterController extends Component {
  private transform: Transform3D | null = null;
  private inputManager: InputActionManager;
  private camera: THREE.PerspectiveCamera | null = null;
  
  // Movement parameters
  private moveSpeed: number = 5.0;
  private rotationSpeed: number = 10.0;
  private jumpForce: number = 8.0;
  private gravity: number = 20.0;
  
  // State
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = true;
  private verticalVelocity: number = 0;
  
  // Input actions
  private moveForwardAction: string = 'MoveForward';
  private moveBackwardAction: string = 'MoveBackward';
  private moveLeftAction: string = 'MoveLeft';
  private moveRightAction: string = 'MoveRight';
  private jumpAction: string = 'Jump';
  private sprintAction: string = 'Sprint';
  
  // Touch controls for mobile
  private touchJoystickActive: boolean = false;
  private touchJoystickCenter: THREE.Vector2 = new THREE.Vector2();
  private touchJoystickCurrent: THREE.Vector2 = new THREE.Vector2();
  private touchJumpButton: boolean = false;

  constructor(inputManager: InputActionManager, camera: THREE.PerspectiveCamera) {
    super();
    this.inputManager = inputManager;
    this.camera = camera;
  }

  /**
   * Sets up input actions for the character controller.
   */
  setupInputs(): void {
    const moveForward = this.inputManager.createAction(this.moveForwardAction);
    moveForward.addKey('KeyW').addKey('ArrowUp');
    
    const moveBackward = this.inputManager.createAction(this.moveBackwardAction);
    moveBackward.addKey('KeyS').addKey('ArrowDown');
    
    const moveLeft = this.inputManager.createAction(this.moveLeftAction);
    moveLeft.addKey('KeyA').addKey('ArrowLeft');
    
    const moveRight = this.inputManager.createAction(this.moveRightAction);
    moveRight.addKey('KeyD').addKey('ArrowRight');
    
    const jump = this.inputManager.createAction(this.jumpAction);
    jump.addKey('Space');
    
    const sprint = this.inputManager.createAction(this.sprintAction);
    sprint.addKey('ShiftLeft').addKey('ShiftRight');
  }

  override added(): void {
    this.transform = this.Entity?.getComponent(Transform3D) || null;
    this.setupInputs();
    this.setupTouchControls();
  }

  /**
   * Sets up mobile touch controls.
   */
  private setupTouchControls(): void {
    // Virtual joystick for movement
    document.addEventListener('touchstart', (e) => {
      for (const touch of e.touches) {
        if (touch.clientX < window.innerWidth / 2) {
          // Left side - movement joystick
          this.touchJoystickActive = true;
          this.touchJoystickCenter.set(touch.clientX, touch.clientY);
          this.touchJoystickCurrent.set(touch.clientX, touch.clientY);
        } else {
          // Right side - jump button
          this.touchJumpButton = true;
        }
      }
    });

    document.addEventListener('touchmove', (e) => {
      for (const touch of e.touches) {
        if (touch.clientX < window.innerWidth / 2 && this.touchJoystickActive) {
          this.touchJoystickCurrent.set(touch.clientX, touch.clientY);
        }
      }
    });

    document.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.touchJoystickActive = false;
        this.touchJumpButton = false;
      }
    });
  }

  override update(deltaTime: number): void {
    if (!this.transform) return;

    // Get input
    const moveForward = this.inputManager.getAction(this.moveForwardAction)?.Pressed || false;
    const moveBackward = this.inputManager.getAction(this.moveBackwardAction)?.Pressed || false;
    const moveLeft = this.inputManager.getAction(this.moveLeftAction)?.Pressed || false;
    const moveRight = this.inputManager.getAction(this.moveRightAction)?.Pressed || false;
    const jump = this.inputManager.getAction(this.jumpAction)?.Pressed || false;
    const sprint = this.inputManager.getAction(this.sprintAction)?.Pressed || false;

    // Calculate movement direction relative to camera
    const moveDirection = new THREE.Vector3();
    
    if (this.camera) {
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));

      if (moveForward) moveDirection.add(cameraDirection);
      if (moveBackward) moveDirection.sub(cameraDirection);
      if (moveRight) moveDirection.add(cameraRight);
      if (moveLeft) moveDirection.sub(cameraRight);
    }

    // Add touch joystick input
    if (this.touchJoystickActive) {
      const joystickDelta = new THREE.Vector2(
        this.touchJoystickCurrent.x - this.touchJoystickCenter.x,
        this.touchJoystickCurrent.y - this.touchJoystickCenter.y
      );
      const joystickDistance = joystickDelta.length();
      const maxJoystickDistance = 50;
      
      if (joystickDistance > 5) {
        const normalizedDelta = joystickDelta.normalize();
        if (this.camera) {
          const cameraDirection = new THREE.Vector3();
          this.camera.getWorldDirection(cameraDirection);
          cameraDirection.y = 0;
          cameraDirection.normalize();

          const cameraRight = new THREE.Vector3();
          cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));

          moveDirection.addScaledVector(cameraDirection, -normalizedDelta.y);
          moveDirection.addScaledVector(cameraRight, normalizedDelta.x);
        }
      }
    }

    moveDirection.normalize();

    // Apply sprint
    let currentSpeed = this.moveSpeed;
    if (sprint) {
      currentSpeed *= 1.8;
    }

    // Apply horizontal movement
    this.velocity.x = moveDirection.x * currentSpeed;
    this.velocity.z = moveDirection.z * currentSpeed;

    // Handle jumping
    if (jump && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }
    
    if (this.touchJumpButton && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }

    // Apply gravity
    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * deltaTime;
    }

    this.velocity.y = this.verticalVelocity;

    // Update position
    const newPosition = this.transform.Position.clone();
    newPosition.x += this.velocity.x * deltaTime;
    newPosition.y += this.velocity.y * deltaTime;
    newPosition.z += this.velocity.z * deltaTime;

    // Ground check
    if (newPosition.y < 0) {
      newPosition.y = 0;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    this.transform.setPosition(newPosition.x, newPosition.y, newPosition.z);

    // Rotate character to face movement direction
    if (moveDirection.length() > 0.1) {
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      const currentRotation = this.transform.Rotation.y;
      
      // Smooth rotation
      let rotationDiff = targetRotation - currentRotation;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      const newRotation = currentRotation + rotationDiff * this.rotationSpeed * deltaTime;
      this.transform.setRotation(
        this.transform.Rotation.x,
        newRotation,
        this.transform.Rotation.z
      );
    }
  }

  /**
   * Gets whether the character is currently grounded.
   */
  get IsGrounded(): boolean {
    return this.isGrounded;
  }

  /**
   * Gets the current velocity of the character.
   */
  get Velocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  /**
   * Sets the movement speed.
   */
  setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  /**
   * Sets the jump force.
   */
  setJumpForce(force: number): void {
    this.jumpForce = force;
  }
}
