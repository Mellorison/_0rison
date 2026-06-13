import { Component } from '../core/Component';
import { Transform3D } from './Transform3D';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Animation state for tracking playback.
 */
interface AnimationState {
  name: string;
  speed: number;
  loop: boolean;
  weight: number;
  time: number;
}

/**
 * Model renderer component for loading and rendering GLB/GLTF models.
 */
export class ModelRenderer extends Component {
  private mesh: THREE.Group | null = null;
  private transform: Transform3D | null = null;
  private url: string;
  private loaded: boolean = false;
  private onLoadCallback: ((model: THREE.Group) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private animations: THREE.AnimationClip[] = [];
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAnimation: AnimationState | null = null;
  private crossFadeTo: AnimationState | null = null;
  private crossFadeDuration: number = 0;
  private crossFadeTimer: number = 0;

  constructor(url: string) {
    super();
    this.url = url;
  }

  /**
   * Gets the loaded model.
   */
  get Model(): THREE.Group | null {
    return this.mesh;
  }

  /**
   * Whether the model has been loaded.
   */
  get Loaded(): boolean {
    return this.loaded;
  }

  /**
   * Sets a callback for when the model loads.
   */
  onLoad(callback: (model: THREE.Group) => void): void {
    this.onLoadCallback = callback;
  }

  /**
   * Sets a callback for when loading fails.
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  override added(): void {
    this.transform = this.Entity?.getComponent(Transform3D) || null;
    this.loadModel();
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    
    loader.load(
      this.url,
      (gltf) => {
        this.mesh = gltf.scene;
        this.animations = gltf.animations || [];
        this.loaded = true;
        
        // Create animation mixer
        if (this.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.mesh);
          
          // Create actions for all animations
          for (const clip of this.animations) {
            const action = this.mixer.clipAction(clip);
            this.actions.set(clip.name, action);
          }
        }
        
        // Enable shadows
        this.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add to transform's Three.js object
        if (this.transform) {
          this.transform.ThreeObject.add(this.mesh);
        }

        if (this.onLoadCallback) {
          this.onLoadCallback(this.mesh);
        }

        console.log(`Model loaded: ${this.url} with ${this.animations.length} animations`);
      },
      (progress) => {
        // Loading progress
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading model: ${percent.toFixed(2)}%`);
      },
      (error) => {
        console.error(`Error loading model: ${this.url}`, error);
        
        if (this.onErrorCallback) {
          this.onErrorCallback(error as Error);
        }
      }
    );
  }

  override update(deltaTime: number): void {
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
      
      // Handle cross-fade
      if (this.crossFadeTo && this.currentAnimation) {
        this.crossFadeTimer += deltaTime;
        
        const progress = Math.min(1, this.crossFadeTimer / this.crossFadeDuration);
        
        const fromAction = this.actions.get(this.currentAnimation.name);
        const toAction = this.actions.get(this.crossFadeTo.name);
        
        if (fromAction && toAction) {
          fromAction.weight = 1 - progress;
          toAction.weight = progress;
        }
        
        if (progress >= 1) {
          if (fromAction) fromAction.stop();
          this.currentAnimation = this.crossFadeTo;
          this.crossFadeTo = null;
          this.crossFadeTimer = 0;
        }
      }
    }
  }

  override render(): void {
    // Rendering is handled by the Three.js renderer
  }

  override removed(): void {
    if (this.mesh && this.transform) {
      this.transform.ThreeObject.remove(this.mesh);
      this.mesh = null;
    }
  }

  override onDestroy(): void {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.mesh = null;
    }
  }

  /**
   * Plays an animation on the model.
   * @param name The name of the animation to play.
   * @param loop Whether to loop the animation.
   * @param speed The playback speed.
   */
  playAnimation(name: string, loop: boolean = true, speed: number = 1): void {
    const action = this.actions.get(name);
    if (!action) {
      console.warn(`Animation not found: ${name}`);
      return;
    }

    // Stop current animation
    if (this.currentAnimation) {
      const currentAction = this.actions.get(this.currentAnimation.name);
      if (currentAction) {
        currentAction.stop();
      }
    }

    // Play new animation
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, 1);
    action.timeScale = speed;
    action.play();

    this.currentAnimation = {
      name,
      speed,
      loop,
      weight: 1,
      time: 0,
    };
  }

  /**
   * Cross-fades to another animation.
   * @param name The name of the animation to cross-fade to.
   * @param duration The duration of the cross-fade in seconds.
   * @param loop Whether to loop the animation.
   * @param speed The playback speed.
   */
  crossFade(name: string, duration: number = 0.2, loop: boolean = true, speed: number = 1): void {
    const action = this.actions.get(name);
    if (!action) {
      console.warn(`Animation not found: ${name}`);
      return;
    }

    if (!this.currentAnimation) {
      this.playAnimation(name, loop, speed);
      return;
    }

    // Setup cross-fade
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, 1);
    action.timeScale = speed;
    action.weight = 0;
    action.play();

    this.crossFadeTo = {
      name,
      speed,
      loop,
      weight: 0,
      time: 0,
    };
    this.crossFadeDuration = duration;
    this.crossFadeTimer = 0;
  }

  /**
   * Gets all animations from the model.
   */
  getAnimations(): THREE.AnimationClip[] {
    return this.animations;
  }

  /**
   * Gets animation names.
   */
  getAnimationNames(): string[] {
    return this.animations.map(a => a.name);
  }

  /**
   * Checks if an animation exists.
   */
  hasAnimation(name: string): boolean {
    return this.actions.has(name);
  }

  /**
   * Stops all animations.
   */
  stopAllAnimations(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.currentAnimation = null;
    this.crossFadeTo = null;
  }
}
