import * as THREE from 'three';

/**
 * Multiplayer manager for real-time player synchronization.
 * Uses WebSocket for networking and handles player state synchronization.
 */
export class MultiplayerManager {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private playerId: string;
  private players: Map<string, RemotePlayer> = new Map();
  private localPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  private localPlayerRotation: number = 0;
  private updateInterval: number = 50; // 20 updates per second
  private lastUpdateTime: number = 0;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(serverUrl: string = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
    this.playerId = this.generatePlayerId();
  }

  /**
   * Connects to the multiplayer server.
   */
  connect(): void {
    if (this.connecting || this.connected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.connecting = true;
    this.reconnectAttempts++;

    try {
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to multiplayer server');
        this.connected = true;
        this.connecting = false;
        this.reconnectAttempts = 0;
        this.sendJoin();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connecting = false;
      };

      this.ws.onclose = () => {
        console.log('Disconnected from multiplayer server');
        this.connected = false;
        this.connecting = false;
        // Attempt reconnection after 5 seconds if under max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.connect(), 5000);
        } else {
          console.log('Max reconnection attempts reached, giving up');
        }
      };
    } catch (error) {
      console.error('Failed to connect to server:', error);
      this.connecting = false;
    }
  }

  /**
   * Disconnects from the multiplayer server.
   */
  disconnect(): void {
    if (this.ws) {
      this.sendLeave();
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Updates the local player state and sends to server.
   * @param position Current position of local player.
   * @param rotation Current rotation (Y-axis) of local player.
   * @param timestamp Current timestamp for interpolation.
   */
  updateLocalPlayer(position: THREE.Vector3, rotation: number, timestamp: number): void {
    this.localPlayerPosition.copy(position);
    this.localPlayerRotation = rotation;

    // Throttle updates to avoid flooding network
    if (timestamp - this.lastUpdateTime > this.updateInterval) {
      this.sendPlayerUpdate();
      this.lastUpdateTime = timestamp;
    }
  }

  /**
   * Updates remote players (interpolation).
   * @param deltaTime Time since last frame.
   */
  updateRemotePlayers(deltaTime: number): void {
    for (const [id, player] of this.players) {
      if (id !== this.playerId) {
        player.update(deltaTime);
      }
    }
  }

  /**
   * Gets all remote players.
   */
  getRemotePlayers(): RemotePlayer[] {
    return Array.from(this.players.values()).filter(p => p.id !== this.playerId);
  }

  /**
   * Gets a specific remote player by ID.
   */
  getRemotePlayer(id: string): RemotePlayer | undefined {
    return this.players.get(id);
  }

  /**
   * Handles incoming messages from the server.
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'join':
          this.handlePlayerJoin(message);
          break;
        case 'leave':
          this.handlePlayerLeave(message);
          break;
        case 'update':
          this.handlePlayerUpdate(message);
          break;
        case 'world':
          this.handleWorldState(message);
          break;
        case 'emoji':
          this.handleEmoji(message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Sends a join message to the server.
   */
  private sendJoin(): void {
    this.sendMessage({
      type: 'join',
      playerId: this.playerId,
      position: { x: 0, y: 0, z: 0 },
      rotation: 0
    });
  }

  /**
   * Sends a leave message to the server.
   */
  private sendLeave(): void {
    this.sendMessage({
      type: 'leave',
      playerId: this.playerId
    });
  }

  /**
   * Sends player update to the server.
   */
  private sendPlayerUpdate(): void {
    this.sendMessage({
      type: 'update',
      playerId: this.playerId,
      position: {
        x: this.localPlayerPosition.x,
        y: this.localPlayerPosition.y,
        z: this.localPlayerPosition.z
      },
      rotation: this.localPlayerRotation
    });
  }

  /**
   * Sends an emoji reaction.
   */
  sendEmoji(emoji: string): void {
    this.sendMessage({
      type: 'emoji',
      playerId: this.playerId,
      emoji: emoji
    });
  }

  /**
   * Sends a message to the server.
   */
  private sendMessage(message: any): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handles a player joining.
   */
  private handlePlayerJoin(message: any): void {
    const player = new RemotePlayer(
      message.playerId,
      new THREE.Vector3(message.position.x, message.position.y, message.position.z),
      message.rotation
    );
    this.players.set(message.playerId, player);
    console.log(`Player ${message.playerId} joined`);
  }

  /**
   * Handles a player leaving.
   */
  private handlePlayerLeave(message: any): void {
    const player = this.players.get(message.playerId);
    if (player) {
      player.dispose();
      this.players.delete(message.playerId);
      console.log(`Player ${message.playerId} left`);
    }
  }

  /**
   * Handles a player update.
   */
  private handlePlayerUpdate(message: any): void {
    const player = this.players.get(message.playerId);
    if (player) {
      player.setTargetPosition(
        new THREE.Vector3(message.position.x, message.position.y, message.position.z)
      );
      player.setTargetRotation(message.rotation);
    }
  }

  /**
   * Handles world state (initial sync).
   */
  private handleWorldState(message: any): void {
    for (const playerData of message.players) {
      if (playerData.id !== this.playerId) {
        const player = new RemotePlayer(
          playerData.id,
          new THREE.Vector3(playerData.position.x, playerData.position.y, playerData.position.z),
          playerData.rotation
        );
        this.players.set(playerData.id, player);
      }
    }
  }

  /**
   * Handles emoji reactions.
   */
  private handleEmoji(message: any): void {
    const player = this.players.get(message.playerId);
    if (player) {
      player.showEmoji(message.emoji);
    }
  }

  /**
   * Generates a unique player ID.
   */
  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Gets whether connected to server.
   */
  get Connected(): boolean {
    return this.connected;
  }

  /**
   * Gets the local player ID.
   */
  get PlayerId(): string {
    return this.playerId;
  }
}

/**
 * Represents a remote player in the multiplayer world.
 */
export class RemotePlayer {
  public id: string;
  private mesh: THREE.Group;
  private currentPosition: THREE.Vector3;
  private targetPosition: THREE.Vector3;
  private currentRotation: number;
  private targetRotation: number;
  private emojiMesh: THREE.Sprite | null = null;
  private emojiTimer: number = 0;

  constructor(id: string, position: THREE.Vector3, rotation: number) {
    this.id = id;
    this.currentPosition = position.clone();
    this.targetPosition = position.clone();
    this.currentRotation = rotation;
    this.targetRotation = rotation;

    // Create player mesh
    this.mesh = this.createPlayerMesh();
    this.mesh.position.copy(position);
    this.mesh.rotation.y = rotation;
  }

  /**
   * Creates the visual representation of a remote player.
   */
  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x4a90d9 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshToonMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.9;
    head.castShadow = true;
    group.add(head);

    // Name tag
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.id, 128, 40);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.y = 2.5;
    sprite.scale.set(2, 0.5, 1);
    group.add(sprite);

    return group;
  }

  /**
   * Sets the target position for interpolation.
   */
  setTargetPosition(position: THREE.Vector3): void {
    this.targetPosition.copy(position);
  }

  /**
   * Sets the target rotation for interpolation.
   */
  setTargetRotation(rotation: number): void {
    this.targetRotation = rotation;
  }

  /**
   * Updates the player (interpolation).
   */
  update(deltaTime: number): void {
    // Interpolate position
    const lerpFactor = 10 * deltaTime;
    this.currentPosition.lerp(this.targetPosition, lerpFactor);
    this.mesh.position.copy(this.currentPosition);

    // Interpolate rotation
    const rotationDiff = this.targetRotation - this.currentRotation;
    this.currentRotation += rotationDiff * lerpFactor;
    this.mesh.rotation.y = this.currentRotation;

    // Update emoji timer
    if (this.emojiMesh) {
      this.emojiTimer -= deltaTime;
      if (this.emojiTimer <= 0) {
        this.mesh.remove(this.emojiMesh);
        this.emojiMesh = null;
      }
    }
  }

  /**
   * Shows an emoji reaction.
   */
  showEmoji(emoji: string): void {
    // Remove existing emoji
    if (this.emojiMesh) {
      this.mesh.remove(this.emojiMesh);
    }

    // Create emoji sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '96px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    this.emojiMesh = new THREE.Sprite(spriteMaterial);
    this.emojiMesh.position.y = 3;
    this.emojiMesh.scale.set(1.5, 1.5, 1);
    this.mesh.add(this.emojiMesh);

    this.emojiTimer = 3; // Show for 3 seconds
  }

  /**
   * Gets the Three.js mesh for rendering.
   */
  get Mesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Disposes of resources.
   */
  dispose(): void {
    if (this.emojiMesh) {
      this.mesh.remove(this.emojiMesh);
    }
  }
}
