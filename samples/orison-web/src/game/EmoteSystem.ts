import * as THREE from 'three';

/**
 * 3D Emoji emote system for player expression.
 */
export class EmoteSystem {
  private scene: THREE.Scene;
  private activeEmotes: Map<string, EmoteInstance> = new Map();
  private emoteUI: HTMLDivElement | null = null;
  private onEmote: ((emoji: string) => void) | null = null;

  constructor(scene: THREE.Scene, onEmote?: (emoji: string) => void) {
    this.scene = scene;
    this.onEmote = onEmote || null;
    this.createUI();
  }

  private createUI(): void {
    this.emoteUI = document.createElement('div');
    this.emoteUI.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 8px;
      z-index: 100;
    `;

    const emojis = ['😊', '😂', '❤️', '👋', '💩', '✨', '🎉', '😢'];
    for (const emoji of emojis) {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.style.cssText = `
        font-size: 24px;
        padding: 8px 12px;
        border: none;
        border-radius: 50%;
        background: rgba(255,255,255,0.9);
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      btn.addEventListener('click', () => this.playEmote(emoji));
      btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.15)'; });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
      this.emoteUI.appendChild(btn);
    }

    document.body.appendChild(this.emoteUI);
  }

  /**
   * Plays an emote at a position.
   */
  playEmote(emoji: string, position?: THREE.Vector3): void {
    if (this.onEmote) {
      this.onEmote(emoji);
    }

    // Create 3D emoji text
    if (position) {
      this.create3DEmote(emoji, position);
    }
  }

  private create3DEmote(emoji: string, position: THREE.Vector3): void {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(1.5, 1.5);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 3;
    mesh.lookAt(this.scene.position); // Face camera direction
    this.scene.add(mesh);

    // Animate and remove
    const startTime = performance.now();
    const duration = 2000;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(mesh);
        material.dispose();
        geometry.dispose();
        texture.dispose();
        return;
      }

      mesh.position.y += 0.02;
      mesh.material.opacity = 1 - progress;
      material.opacity = 1 - progress;
      mesh.scale.setScalar(1 + progress * 0.3);
      mesh.lookAt(this.scene.position);

      requestAnimationFrame(animate);
    };

    animate();
  }

  hideUI(): void {
    if (this.emoteUI) {
      this.emoteUI.style.display = 'none';
    }
  }

  showUI(): void {
    if (this.emoteUI) {
      this.emoteUI.style.display = 'flex';
    }
  }

  dispose(): void {
    this.emoteUI?.remove();
    this.activeEmotes.clear();
  }
}

interface EmoteInstance {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
}
