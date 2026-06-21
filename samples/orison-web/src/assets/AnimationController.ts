import * as THREE from 'three';

/**
 * Animation controller for 3D models with skeletal animation.
 * Handles playback of animations like idle, walk, run.
 */
export class AnimationController {
  private mixer: THREE.AnimationMixer;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private fadeDuration: number = 0.2;

  constructor(modelData: { scene: THREE.Group; animations: THREE.AnimationClip[] }) {
    this.mixer = new THREE.AnimationMixer(modelData.scene);

    // Extract all animations and map them by name
    if (modelData.animations && modelData.animations.length > 0) {
      for (const clip of modelData.animations) {
        const action = this.mixer.clipAction(clip);
        this.animations.set(clip.name.toLowerCase(), action);
      }
    }
  }

  /**
   * Play an animation by name.
   * @param name Animation name (e.g., 'idle', 'walk', 'run')
   * @param loop Whether to loop the animation (default: true)
   */
  play(name: string, loop: boolean = true): void {
    const action = this.animations.get(name.toLowerCase());
    if (!action) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.reset();

    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(this.fadeDuration);
      action.fadeIn(this.fadeDuration);
    }

    action.play();
    this.currentAction = action;
  }

  /**
   * Update the animation mixer.
   * @param deltaTime Time since last frame in seconds
   */
  update(deltaTime: number): void {
    this.mixer.update(deltaTime);
  }

  /**
   * Check if an animation exists.
   */
  hasAnimation(name: string): boolean {
    return this.animations.has(name.toLowerCase());
  }

  /**
   * Get available animation names.
   */
  getAnimationNames(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * Get the currently playing animation name.
   */
  getCurrentAnimation(): string | null {
    return this.currentAction ? this.currentAction.getClip().name.toLowerCase() : null;
  }

  /**
   * Add an animation clip to the controller.
   * @param clip Animation clip to add
   * @param name Optional custom name (uses clip.name if not provided)
   */
  addAnimation(clip: THREE.AnimationClip, name?: string): void {
    const animName = (name || clip.name).toLowerCase();
    const action = this.mixer.clipAction(clip);
    this.animations.set(animName, action);
  }

  /**
   * Add multiple animation clips at once.
   */
  addAnimations(clips: THREE.AnimationClip[]): void {
    for (const clip of clips) {
      this.addAnimation(clip);
    }
  }

  /**
   * Stop all animations.
   */
  stop(): void {
    this.mixer.stopAllAction();
    this.currentAction = null;
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.mixer.stopAllAction();
    this.animations.clear();
  }
}
