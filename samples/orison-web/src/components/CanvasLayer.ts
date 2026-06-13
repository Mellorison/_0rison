import { Component } from '../core/Component';

/**
 * Canvas layer component for rendering 2D UI over 3D scenes.
 * This creates a 2D canvas overlay for HUD elements, text, and other UI.
 */
export class CanvasLayer extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  public width: number;
  public height: number;
  private visible: boolean = true;

  constructor(width: number = 960, height: number = 540) {
    super();
    this.width = width;
    this.height = height;
  }

  /**
   * Gets the 2D canvas.
   */
  get Canvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Gets the 2D rendering context.
   */
  get Context(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Whether the canvas layer is visible.
   */
  get Visible(): boolean {
    return this.visible;
  }

  set Visible(value: boolean) {
    this.visible = value;
    if (this.canvas) {
      this.canvas.style.display = value ? 'block' : 'none';
    }
  }

  override added(): void {
    // Delay canvas creation to ensure DOM is ready
    setTimeout(() => this.createCanvas(), 0);
  }

  private createCanvas(): void {
    // Check if already created
    if (this.canvas) return;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none'; // Let clicks pass through to 3D canvas
    this.canvas.style.display = this.visible ? 'block' : 'none';

    // Get 2D context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Failed to get 2D context for canvas');
      return;
    }

    console.log('CanvasLayer created successfully:', this.width, 'x', this.height);

    // Add to the game container
    const gameCanvas = document.querySelector('#game') as HTMLCanvasElement;
    if (gameCanvas && gameCanvas.parentElement) {
      gameCanvas.parentElement.style.position = 'relative';
      gameCanvas.parentElement.appendChild(this.canvas);
      console.log('Canvas appended to game container');
    } else {
      console.error('Game canvas or parent not found, retrying...');
      // Retry after a delay
      setTimeout(() => {
        const retryCanvas = document.querySelector('#game') as HTMLCanvasElement;
        if (retryCanvas && retryCanvas.parentElement) {
          retryCanvas.parentElement.style.position = 'relative';
          retryCanvas.parentElement.appendChild(this.canvas!);
          console.log('Canvas appended to game container on retry');
        }
      }, 100);
    }
  }

  override update(deltaTime: number): void {
    // Clear canvas each frame
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Draws text on the canvas.
   * @param text The text to draw.
   * @param x X position.
   * @param y Y position.
   * @param options Optional styling options.
   */
  drawText(text: string, x: number, y: number, options: {
    color?: string;
    font?: string;
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
  } = {}): void {
    if (!this.ctx) return;

    const {
      color = '#ffffff',
      font = 'Arial',
      fontSize = 16,
      align = 'left'
    } = options;

    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px ${font}`;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Draws a rectangle on the canvas.
   * @param x X position.
   * @param y Y position.
   * @param width Width of the rectangle.
   * @param height Height of the rectangle.
   * @param options Optional styling options.
   */
  drawRect(x: number, y: number, width: number, height: number, options: {
    color?: string;
    filled?: boolean;
    lineWidth?: number;
  } = {}): void {
    if (!this.ctx) return;

    const {
      color = '#ffffff',
      filled = true,
      lineWidth = 1
    } = options;

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = lineWidth;

    if (filled) {
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * Draws a circle on the canvas.
   * @param x X position (center).
   * @param y Y position (center).
   * @param radius Radius of the circle.
   * @param options Optional styling options.
   */
  drawCircle(x: number, y: number, radius: number, options: {
    color?: string;
    filled?: boolean;
    lineWidth?: number;
  } = {}): void {
    if (!this.ctx) return;

    const {
      color = '#ffffff',
      filled = true,
      lineWidth = 1
    } = options;

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * Draws a line on the canvas.
   * @param x1 Start X position.
   * @param y1 Start Y position.
   * @param x2 End X position.
   * @param y2 End Y position.
   * @param options Optional styling options.
   */
  drawLine(x1: number, y1: number, x2: number, y2: number, options: {
    color?: string;
    lineWidth?: number;
  } = {}): void {
    if (!this.ctx) return;

    const {
      color = '#ffffff',
      lineWidth = 1
    } = options;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * Draws a health bar.
   * @param x X position.
   * @param y Y position.
   * @param width Width of the bar.
   * @param height Height of the bar.
   * @param current Current health value.
   * @param max Maximum health value.
   * @param options Optional styling options.
   */
  drawHealthBar(x: number, y: number, width: number, height: number, current: number, max: number, options: {
    backgroundColor?: string;
    foregroundColor?: string;
    borderColor?: string;
  } = {}): void {
    if (!this.ctx) return;

    const {
      backgroundColor = '#333333',
      foregroundColor = '#00ff00',
      borderColor = '#ffffff'
    } = options;

    const percent = Math.max(0, Math.min(1, current / max));
    const fillWidth = width * percent;

    // Draw background
    this.drawRect(x, y, width, height, { color: backgroundColor, filled: true });

    // Draw fill
    this.drawRect(x, y, fillWidth, height, { color: foregroundColor, filled: true });

    // Draw border
    this.drawRect(x, y, width, height, { color: borderColor, filled: false, lineWidth: 2 });
  }

  override removed(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }

  override onDestroy(): void {
    // Canvas is cleaned up in removed()
  }
}
