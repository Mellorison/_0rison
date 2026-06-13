import { Scene } from './Scene';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { PhysicsWorld } from '../physics/PhysicsWorld';

/**
 * Main game class that manages the game loop, scenes, and rendering.
 */
export class Game {
  private scenes: Scene[] = [];
  private currentScene: Scene | null = null;
  private renderer: ThreeRenderer | null = null;
  private running: boolean = false;
  private lastTime: number = 0;

  /**
   * Creates a new game instance.
   * @param canvas The canvas element to render to.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new ThreeRenderer(canvas);
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
  get Renderer(): ThreeRenderer | null {
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
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  /**
   * Updates the game state.
   * @param deltaTime Time since last update in seconds.
   */
  update(deltaTime: number): void {
    // Step physics
    PhysicsWorld.Instance.step(deltaTime);

    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
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
