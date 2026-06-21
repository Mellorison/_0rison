import { Scene } from './Scene';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { EnhancedRenderer } from '../rendering/EnhancedRenderer';
import { PhysicsWorld } from '../physics/PhysicsWorld';

/**
 * Main game class that manages the game loop, scenes, and rendering.
 */
export class Game {
  private scenes: Scene[] = [];
  private currentScene: Scene | null = null;
  private renderer: ThreeRenderer | EnhancedRenderer | null = null;
  private running: boolean = false;
  private lastTime: number = 0;
  private usePhysics: boolean = true;
  private frameCount: number = 0;
  private frameTimeAccumulator: number = 0;
  private lastFpsLog: number = 0;

  /**
   * Creates a new game instance.
   * @param canvas The canvas element to render to.
   * @param useEnhancedRenderer Whether to use the enhanced cel-shaded renderer.
   */
  constructor(canvas: HTMLCanvasElement, useEnhancedRenderer: boolean = false) {
    this.renderer = useEnhancedRenderer 
      ? new EnhancedRenderer(canvas) 
      : new ThreeRenderer(canvas);
  }

  /**
   * Gets the current scene.
   */
  get CurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * Gets the renderer.
   */
  get Renderer(): ThreeRenderer | EnhancedRenderer | null {
    return this.renderer;
  }

  /**
   * Sets the current scene.
   * @param scene The scene to set as current.
   */
  setScene(scene: Scene): void {
    if (this.currentScene) {
      this.currentScene.end();
    }
    this.currentScene = scene;
    this.currentScene.begin();
  }

  /**
   * Pushes a scene onto the scene stack.
   * @param scene The scene to push.
   */
  pushScene(scene: Scene): void {
    this.scenes.push(scene);
    this.setScene(scene);
  }

  /**
   * Pops the current scene from the stack.
   */
  popScene(): void {
    if (this.scenes.length > 0) {
      this.scenes.pop();
      if (this.scenes.length > 0) {
        this.setScene(this.scenes[this.scenes.length - 1]);
      } else {
        this.currentScene = null;
      }
    }
  }

  /**
   * Starts the game loop.
   */
  async start(): Promise<void> {
    if (this.running) return;
    
    // Initialize physics world
    await PhysicsWorld.Instance.initialize();
    
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsLog = this.lastTime;
    this.gameLoop();
  }

  /**
   * Stops the game loop.
   */
  stop(): void {
    this.running = false;
  }

  /**
   * The main game loop.
   */
  private gameLoop = (): void => {
    if (!this.running) return;

    const currentTime = performance.now();
    const frameTimeMs = currentTime - this.lastTime;
    const deltaTime = frameTimeMs / 1000; // Convert to seconds
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    // Frame time tracking
    this.frameCount++;
    this.frameTimeAccumulator += frameTimeMs;
    if (currentTime - this.lastFpsLog > 2000) {
      const avgFrameTime = this.frameTimeAccumulator / this.frameCount;
      const fps = this.frameCount / ((currentTime - this.lastFpsLog) / 1000);
      console.log(`[Perf] Avg frame time: ${avgFrameTime.toFixed(1)}ms (${fps.toFixed(0)} FPS)`);
      this.frameCount = 0;
      this.frameTimeAccumulator = 0;
      this.lastFpsLog = currentTime;
    }

    requestAnimationFrame(this.gameLoop);
  };

  /**
   * Updates the game state.
   * @param deltaTime Time since last update in seconds.
   */
  update(deltaTime: number): void {
    // Step physics only if enabled
    if (this.usePhysics) {
      PhysicsWorld.Instance.step(deltaTime);
    }

    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Sets whether to use physics.
   */
  setUsePhysics(enabled: boolean): void {
    this.usePhysics = enabled;
  }

  /**
   * Renders the game.
   */
  render(): void {
    if (this.renderer && this.currentScene) {
      this.renderer.render(this.currentScene);
    }
  }

  /**
   * Resizes the renderer to match the canvas size.
   */
  resize(): void {
    if (this.renderer) {
      this.renderer.resize();
    }
  }
}
