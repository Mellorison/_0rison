import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { InputActionManager } from '../input/InputAction';

/**
 * Quantum African Messenger
 * A 2D delivery game set in a futuristic Zambian village
 * in a quantum universe with glowing effects and African aesthetics
 */

interface QuantumDelivery {
  id: number;
  giver: string;
  recipient: string;
  item: string;
  completed: boolean;
}

interface Villager {
  name: string;
  x: number;
  y: number;
  mesh: THREE.Group;
  body: RAPIER.RigidBody;
  dialogue: string[];
  hasQuest: boolean;
  glowColor: number;
}

interface Hut {
  x: number;
  y: number;
  mesh: THREE.Group;
  owner: string;
  quantumRing?: THREE.Mesh;
}

interface QuantumItem {
  x: number;
  y: number;
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  type: 'data_crystal' | 'quantum_package';
  pickedUp: boolean;
  glowTime: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface Collectible {
  x: number;
  y: number;
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  name: string;
  collected: boolean;
}

interface Upgrade {
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  apply: () => void;
}

interface LevelConfig {
  name: string;
  groundColor: number;
  skyColor: number;
  villagers: Array<{ name: string; x: number; dialogue: string[]; hasQuest: boolean; glow: number }>;
  huts: Array<{ owner: string; x: number; color: number }>;
  quests: QuantumDelivery[];
}

export class PlatformerScene {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private input: InputActionManager;
  private world: RAPIER.World | null = null;
  private canvas: HTMLCanvasElement;

  // Player
  private playerBody: RAPIER.RigidBody | null = null;
  private playerMesh: THREE.Group | null = null;
  private playerSpeed: number = 7;
  private jumpForce: number = 14;
  private isGrounded: boolean = false;
  private isMoving: boolean = false;
  private isJumping: boolean = false;
  private facingRight: boolean = true;
  private quantumTrail: THREE.Mesh[] = [];
  private trailTimer: number = 0;
  // Upgrades
  private hasDoubleJump: boolean = false;
  private hasSpeedBoots: boolean = false;
  private hasQuantumVision: boolean = false;
  private jumpCount: number = 0;
  private quantumEnergy: number = 0;

  // World
  private worldWidth: number = 100;
  private groundLevel: number = -2;
  private platforms: Array<{ body: RAPIER.RigidBody; mesh: THREE.Mesh }> = [];

  // Game Objects
  private villagers: Villager[] = [];
  private huts: Hut[] = [];
  private quantumItems: QuantumItem[] = [];
  private decorations: THREE.Object3D[] = [];
  private particles: Particle[] = [];
  private stars: THREE.Mesh[] = [];
  private collectibles: Collectible[] = [];
  private collectiblesFound: number = 0;
  private totalCollectibles: number = 8;

  // Delivery System
  private quests: QuantumDelivery[] = [];
  private currentQuest: QuantumDelivery | null = null;
  private inventory: string[] = [];
  private deliveredCount: number = 0;
  private totalQuests: number = 5;

  // Level System
  private currentLevel: number = 0;
  private maxLevels: number = 3;
  private levelNames: string[] = ['Village of Zambezi', 'Kafue Outpost', 'Luangpa Sanctuary'];
  private levelComplete: boolean = false;

  // Mini-game
  private miniGameActive: boolean = false;
  private miniGameType: 'memory' | 'none' = 'none';
  private memorySequence: number[] = [];
  private playerSequence: number[] = [];
  private memoryPhase: 'show' | 'input' | 'none' = 'none';
  private memoryTimer: number = 0;
  private memoryButtons: THREE.Mesh[] = [];

  // Cutscene
  private cutsceneActive: boolean = false;
  private cutsceneLines: string[] = [];
  private cutsceneIndex: number = 0;
  private cutsceneElement: HTMLElement | null = null;

  // Dialogue
  private dialogueActive: boolean = false;
  private dialogueText: HTMLElement | null = null;
  private dialogueName: HTMLElement | null = null;
  private dialogueIndex: number = 0;
  private currentVillager: Villager | null = null;

  // Camera & Time
  private cameraSmooth: number = 0.08;
  private time: number = 0;

  // UI
  private questLogElement: HTMLElement | null = null;
  private inventoryElement: HTMLElement | null = null;
  private gameOverlay: HTMLElement | null = null;
  private interactPrompt: HTMLElement | null = null;
  private energyElement: HTMLElement | null = null;
  private collectibleElement: HTMLElement | null = null;
  private levelElement: HTMLElement | null = null;

  // Mobile Controls
  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchJump: boolean = false;
  private touchInteract: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0a2e);
    this.scene.fog = new THREE.Fog(0x1a0a2e, 20, 60);

    const aspect = canvas.width / canvas.height;
    const viewSize = 16;
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect, viewSize * aspect, viewSize, -viewSize, 0.1, 1000
    );
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.input = new InputActionManager();
    this.input.setupEventListeners();

    this.setupLighting();
    this.createUI();
    this.setupMobileControls();
  }

  private createUI(): void {
    this.levelElement = document.createElement('div');
    this.levelElement.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);color:#ffff00;font:14px bold Arial;background:rgba(10,0,30,0.7);padding:8px 16px;border-radius:8px;border:1px solid #ffff00;text-shadow:0 0 8px #ffff00;z-index:50;';
    this.levelElement.textContent = this.levelNames[0];
    document.body.appendChild(this.levelElement);

    this.questLogElement = document.createElement('div');
    this.questLogElement.style.cssText = 'position:absolute;top:55px;left:20px;color:#00ffcc;font:16px bold Arial;background:rgba(10,0,30,0.7);padding:10px;border-radius:8px;border:1px solid #00ffcc;text-shadow:0 0 10px #00ffcc;max-width:260px;';
    this.questLogElement.textContent = 'Deliveries: 0/5';
    document.body.appendChild(this.questLogElement);

    this.energyElement = document.createElement('div');
    this.energyElement.style.cssText = 'position:absolute;top:55px;right:20px;color:#00ffff;font:14px Arial;background:rgba(10,0,30,0.7);padding:8px 12px;border-radius:8px;border:1px solid #00ffff;text-shadow:0 0 8px #00ffff;';
    this.energyElement.textContent = 'Energy: 0';
    document.body.appendChild(this.energyElement);

    this.collectibleElement = document.createElement('div');
    this.collectibleElement.style.cssText = 'position:absolute;top:100px;right:20px;color:#ffd700;font:14px Arial;background:rgba(10,0,30,0.7);padding:8px 12px;border-radius:8px;border:1px solid #ffd700;text-shadow:0 0 8px #ffd700;';
    this.collectibleElement.textContent = 'Artifacts: 0/8';
    document.body.appendChild(this.collectibleElement);

    this.inventoryElement = document.createElement('div');
    this.inventoryElement.style.cssText = 'position:absolute;top:145px;right:20px;color:#ff66ff;font:14px Arial;background:rgba(10,0,30,0.7);padding:10px;border-radius:8px;border:1px solid #ff66ff;text-shadow:0 0 8px #ff66ff;max-width:180px;';
    this.inventoryElement.innerHTML = '<div>Inventory:</div><div style="font-size:12px;margin-top:4px;color:#ccc;">Empty</div>';
    document.body.appendChild(this.inventoryElement);

    this.interactPrompt = document.createElement('div');
    this.interactPrompt.style.cssText = 'position:absolute;bottom:140px;left:50%;transform:translateX(-50%);color:#ffff00;font:18px bold Arial;text-shadow:0 0 10px #ffff00;display:none;z-index:50;';
    this.interactPrompt.textContent = 'Press E to Interact';
    document.body.appendChild(this.interactPrompt);

    const dialogueContainer = document.createElement('div');
    dialogueContainer.id = 'dialogue-box';
    dialogueContainer.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);width:85%;max-width:650px;background:rgba(20,0,40,0.92);color:#e0e0ff;padding:18px;border-radius:12px;font-family:Arial;display:none;z-index:100;cursor:pointer;border:2px solid #00ffcc;box-shadow:0 0 20px rgba(0,255,204,0.3);';
    dialogueContainer.onclick = () => this.advanceDialogue();

    this.dialogueName = document.createElement('div');
    this.dialogueName.style.cssText = 'font-size:18px;font-weight:bold;color:#00ffcc;margin-bottom:8px;text-shadow:0 0 8px #00ffcc;';
    dialogueContainer.appendChild(this.dialogueName);

    this.dialogueText = document.createElement('div');
    this.dialogueText.style.cssText = 'font-size:15px;line-height:1.5;';
    dialogueContainer.appendChild(this.dialogueText);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:12px;color:#888;margin-top:10px;text-align:center;';
    hint.textContent = 'Press E or Click to continue';
    dialogueContainer.appendChild(hint);

    document.body.appendChild(dialogueContainer);

    this.gameOverlay = document.createElement('div');
    this.gameOverlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#00ffcc;font:36px bold Arial;text-shadow:0 0 20px #00ffcc;text-align:center;display:none;background:rgba(10,0,30,0.9);padding:30px;border-radius:16px;border:2px solid #00ffcc;z-index:300;';
    document.body.appendChild(this.gameOverlay);

    // Cutscene overlay
    this.cutsceneElement = document.createElement('div');
    this.cutsceneElement.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:#00ffcc;font:22px Arial;display:none;z-index:250;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px;';
    this.cutsceneElement.onclick = () => this.advanceCutscene();
    document.body.appendChild(this.cutsceneElement);
  }

  private setupMobileControls(): void {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:space-between;padding:0 20px;pointer-events:none;';

    const makeBtn = (label: string, down: () => void, up: () => void) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'width:65px;height:65px;border-radius:50%;border:2px solid #00ffcc;background:rgba(0,20,40,0.7);color:#00ffcc;font:28px bold;box-shadow:0 0 10px rgba(0,255,204,0.3);touch-action:none;pointer-events:auto;';
      b.addEventListener('touchstart', (e) => { e.preventDefault(); down(); });
      b.addEventListener('touchend', (e) => { e.preventDefault(); up(); });
      return b;
    };

    const dpad = document.createElement('div');
    dpad.style.cssText = 'display:flex;gap:12px;';
    dpad.appendChild(makeBtn('←', () => this.touchLeft = true, () => this.touchLeft = false));
    dpad.appendChild(makeBtn('→', () => this.touchRight = true, () => this.touchRight = false));

    const acts = document.createElement('div');
    acts.style.cssText = 'display:flex;gap:12px;';
    acts.appendChild(makeBtn('↑', () => this.touchJump = true, () => this.touchJump = false));
    acts.appendChild(makeBtn('E', () => { this.touchInteract = true; setTimeout(() => this.touchInteract = false, 200); }, () => {}));

    container.appendChild(dpad);
    container.appendChild(acts);
    document.body.appendChild(container);
  }

  public async initialize(): Promise<void> {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.createStars();
    this.loadLevel(0);
    this.playOpeningCutscene();
  }

  private setupLighting(): void {
    this.scene.add(new THREE.AmbientLight(0x6644aa, 0.6));
    this.scene.add(new THREE.DirectionalLight(0xffaa44, 0.4));
  }

  private loadLevel(levelIndex: number): void {
    if (!this.world) return;
    this.clearWorld();
    this.currentLevel = levelIndex;
    this.levelComplete = false;
    this.deliveredCount = 0;
    this.currentQuest = null;
    this.inventory = [];

    const configs = this.getLevelConfigs();
    const config = configs[levelIndex];
    if (!config) return;

    this.scene.background = new THREE.Color(config.skyColor);
    if (this.levelElement) this.levelElement.textContent = config.name;

    this.createGround(config.groundColor);
    this.createPlayer();

    for (const h of config.huts) {
      this.createHut(h.x, this.groundLevel, h.owner, h.color);
    }

    for (const v of config.villagers) {
      this.createVillager(v.x, this.groundLevel + 1.2, v.name, v.dialogue, v.hasQuest, v.glow);
    }

    this.quests = config.quests;
    this.setupQuantumItemsForLevel(levelIndex);
    this.setupCollectiblesForLevel(levelIndex);
    this.createBaobabsForLevel(levelIndex);
    this.createQuantumClouds();
    this.createUpgradeMerchant(levelIndex);
    this.createMiniGameShrine(levelIndex);
  }

  private getLevelConfigs(): LevelConfig[] {
    return [
      {
        name: 'Village of Zambezi',
        groundColor: 0x8b6914,
        skyColor: 0x1a0a2e,
        huts: [
          { owner: 'Chileshe', x: -18, color: 0xc4621a },
          { owner: 'Mutale', x: -6, color: 0xd4a574 },
          { owner: 'Nkandu', x: 8, color: 0xb87333 },
          { owner: 'Bwalya', x: 22, color: 0xcd7f32 },
          { owner: 'Mabvuto', x: 38, color: 0xa0522d }
        ],
        villagers: [
          { name: 'Nalube', x: -12, dialogue: ['Welcome to the quantum village of Zambezi!','I am the village quantum keeper.','We need you to deliver quantum data crystals!'], hasQuest: true, glow: 0x00ffcc },
          { name: 'Chileshe', x: -2, dialogue: ['Muli bwanji! I am waiting for a data crystal from Mutale.','The quantum network depends on these deliveries.'], hasQuest: false, glow: 0xff6600 },
          { name: 'Mutale', x: 12, dialogue: ['Baume! I have a quantum package for Nkandu.','Can you deliver it through the quantum realm?'], hasQuest: true, glow: 0xff00ff },
          { name: 'Nkandu', x: 28, dialogue: ['Welcome traveler! Bwalya should have sent me a crystal.','The ancestors whisper through the quantum field...'], hasQuest: false, glow: 0xffff00 },
          { name: 'Bwalya', x: 44, dialogue: ['Greetings quantum messenger! I need to send a crystal to Mabvuto.','The quantum entanglement must be maintained!'], hasQuest: true, glow: 0x00ffff }
        ],
        quests: [
          { id: 1, giver: 'Mutale', recipient: 'Nkandu', item: 'quantum_package', completed: false },
          { id: 2, giver: 'Bwalya', recipient: 'Mabvuto', item: 'data_crystal', completed: false },
          { id: 3, giver: 'Nalube', recipient: 'Chileshe', item: 'data_crystal', completed: false },
          { id: 4, giver: 'Nkandu', recipient: 'Bwalya', item: 'quantum_package', completed: false },
          { id: 5, giver: 'Chileshe', recipient: 'Mutale', item: 'data_crystal', completed: false }
        ]
      },
      {
        name: 'Kafue Outpost',
        groundColor: 0x6b5b3e,
        skyColor: 0x0d1b2a,
        huts: [
          { owner: 'Mapalo', x: -16, color: 0x8b5a2b },
          { owner: 'Namukonda', x: -4, color: 0x9c7c4c },
          { owner: 'Sinyinza', x: 10, color: 0x7a5c3a },
          { owner: 'Kangwa', x: 26, color: 0x6e4c2a },
          { owner: 'Mweetwa', x: 42, color: 0x8c6a3e }
        ],
        villagers: [
          { name: 'Nsofwa', x: -10, dialogue: ['The Kafue Outpost welcomes you!','The quantum river flows strong here.','Deliveries are needed across the outpost!'], hasQuest: true, glow: 0x00ff88 },
          { name: 'Mapalo', x: 0, dialogue: ['I need a quantum crystal from Namukonda.','The outpost runs on quantum energy!'], hasQuest: false, glow: 0xffaa00 },
          { name: 'Namukonda', x: 14, dialogue: ['I have a delivery for Sinyinza!','Can you take it across the quantum bridge?'], hasQuest: true, glow: 0xff44ff },
          { name: 'Sinyinza', x: 32, dialogue: ['Kangwa promised me a data package.','The outpost must stay connected.'], hasQuest: false, glow: 0xffff44 },
          { name: 'Kangwa', x: 48, dialogue: ['Take this crystal to Mweetwa!','The quantum shields need recharging.'], hasQuest: true, glow: 0x44ffff }
        ],
        quests: [
          { id: 6, giver: 'Namukonda', recipient: 'Sinyinza', item: 'quantum_package', completed: false },
          { id: 7, giver: 'Kangwa', recipient: 'Mweetwa', item: 'data_crystal', completed: false },
          { id: 8, giver: 'Nsofwa', recipient: 'Mapalo', item: 'data_crystal', completed: false },
          { id: 9, giver: 'Sinyinza', recipient: 'Kangwa', item: 'quantum_package', completed: false },
          { id: 10, giver: 'Mapalo', recipient: 'Namukonda', item: 'data_crystal', completed: false }
        ]
      },
      {
        name: 'Luangpa Sanctuary',
        groundColor: 0x4a6741,
        skyColor: 0x1a1a3e,
        huts: [
          { owner: 'Chibuye', x: -14, color: 0x5a8c4a },
          { owner: 'Mukuka', x: -2, color: 0x6b9c5b },
          { owner: 'Nkhoma', x: 12, color: 0x4a7c3a },
          { owner: 'Tembo', x: 28, color: 0x5e8a4e },
          { owner: 'Zimba', x: 44, color: 0x6a9a5a }
        ],
        villagers: [
          { name: 'Malama', x: -8, dialogue: ['Welcome to the sacred Luangpa Sanctuary!','This is the final quantum node.','Complete the deliveries to restore balance!'], hasQuest: true, glow: 0x88ff00 },
          { name: 'Chibuye', x: 4, dialogue: ['Mukuka has the ancient quantum artifact.','The sanctuary needs its power.'], hasQuest: false, glow: 0xffcc00 },
          { name: 'Mukuka', x: 18, dialogue: ['I carry the final package for Nkhoma!','Deliver it to complete the network.'], hasQuest: true, glow: 0xff66cc },
          { name: 'Nkhoma', x: 34, dialogue: ['Tembo must receive the last crystal.','The quantum ancestors await...'], hasQuest: false, glow: 0xccff66 },
          { name: 'Tembo', x: 50, dialogue: ['Take this to Zimba! The final delivery!','The quantum universe will be saved!'], hasQuest: true, glow: 0x66ccff }
        ],
        quests: [
          { id: 11, giver: 'Mukuka', recipient: 'Nkhoma', item: 'quantum_package', completed: false },
          { id: 12, giver: 'Tembo', recipient: 'Zimba', item: 'data_crystal', completed: false },
          { id: 13, giver: 'Malama', recipient: 'Chibuye', item: 'data_crystal', completed: false },
          { id: 14, giver: 'Nkhoma', recipient: 'Tembo', item: 'quantum_package', completed: false },
          { id: 15, giver: 'Chibuye', recipient: 'Mukuka', item: 'data_crystal', completed: false }
        ]
      }
    ];
  }

  private setupQuantumItemsForLevel(level: number): void {
    const positions = [
      [{ x: 12, y: this.groundLevel + 3, type: 'quantum_package' as const }, { x: 44, y: this.groundLevel + 3, type: 'data_crystal' as const }],
      [{ x: -8, y: this.groundLevel + 3, type: 'data_crystal' as const }, { x: 30, y: this.groundLevel + 3, type: 'quantum_package' as const }],
      [{ x: 0, y: this.groundLevel + 3, type: 'quantum_package' as const }, { x: 36, y: this.groundLevel + 3, type: 'data_crystal' as const }]
    ];
    for (const p of positions[level] || []) {
      this.createQuantumItem(p.x, p.y, p.type);
    }
  }

  private setupCollectiblesForLevel(level: number): void {
    const positions = [
      [{ x: -30, y: this.groundLevel + 2, name: 'Ancient Ngoma Drum' }, { x: -8, y: this.groundLevel + 2, name: 'Crystal Spear Tip' },
       { x: 18, y: this.groundLevel + 2, name: 'Quantum Mask' }, { x: 50, y: this.groundLevel + 2, name: 'Star Map Tablet' }],
      [{ x: -26, y: this.groundLevel + 2, name: 'River Spirit Stone' }, { x: 6, y: this.groundLevel + 2, name: 'Copper Bangle' },
       { x: 20, y: this.groundLevel + 2, name: 'Thunder Axe' }, { x: 48, y: this.groundLevel + 2, name: 'Moon Calendar' }],
      [{ x: -22, y: this.groundLevel + 2, name: 'Sacred Calabash' }, { x: 8, y: this.groundLevel + 2, name: 'Ancestor Totem' },
       { x: 24, y: this.groundLevel + 2, name: 'Lightning Beads' }, { x: 46, y: this.groundLevel + 2, name: 'Eternal Flame Orb' }]
    ];
    for (const p of positions[level] || []) {
      this.createCollectible(p.x, p.y, p.name);
    }
  }

  private createCollectible(x: number, y: number, name: string): void {
    if (!this.world) return;
    const geom = new THREE.OctahedronGeometry(0.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.4 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, 0.2);
    this.scene.add(mesh);

    const bd = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, 0);
    const body = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.ball(0.3).setSensor(true), body);
    this.collectibles.push({ x, y, mesh, body, name, collected: false });
  }

  private createBaobabsForLevel(level: number): void {
    const xs = level === 0 ? [-30,-24,2,16,48,52] : level === 1 ? [-28,-20,4,18,46,54] : [-26,-18,6,20,44,50];
    for (const x of xs) this.createBaobab(x, this.groundLevel);
  }

  private createQuantumClouds(): void {
    this.createQuantumCloud(-15, 12);
    this.createQuantumCloud(10, 14);
    this.createQuantumCloud(35, 11);
  }

  private createUpgradeMerchant(level: number): void {
    if (!this.world || level > 0) return; // Only in first level
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 })
    );
    body.position.y = 0.35;
    g.add(body);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    head.position.y = 0.9;
    g.add(head);
    g.position.set(32, this.groundLevel + 1.2, 0);
    this.scene.add(g);

    const bd = RAPIER.RigidBodyDesc.fixed().setTranslation(32, this.groundLevel + 1.2, 0);
    const pb = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.3, 0.6, 0.12).setSensor(true), pb);

    const shopVillager: Villager = {
      name: 'Upgrader', x: 32, y: this.groundLevel + 1.2,
      mesh: g, body: pb,
      dialogue: ['Welcome to the Quantum Upgrade Shop!','I sell speed boots (5 energy), double jump (10 energy), and quantum vision (15 energy).','Come back when you have enough energy!'],
      hasQuest: false, glowColor: 0xffd700
    };
    this.villagers.push(shopVillager);
  }

  private createMiniGameShrine(level: number): void {
    if (!this.world) return;
    const x = level === 0 ? -35 : level === 1 ? 40 : -10;
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x6600cc, emissive: 0x6600cc, emissiveIntensity: 0.5 })
    );
    base.position.y = 0.6;
    g.add(base);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3),
      new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.7 })
    );
    orb.position.y = 1.5;
    g.add(orb);
    g.position.set(x, this.groundLevel, 0);
    this.scene.add(g);

    const bd = RAPIER.RigidBodyDesc.fixed().setTranslation(x, this.groundLevel, 0);
    const body = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.6, 0.8, 0.3).setSensor(true), body);

    this.villagers.push({
      name: 'Shrine', x, y: this.groundLevel,
      mesh: g, body,
      dialogue: ['This is the Quantum Memory Shrine!','Interact to test your quantum memory.','Match the crystal sequence to earn energy!'],
      hasQuest: false, glowColor: 0xff00ff
    });
  }

  private createStars(): void {
    for (let i = 0; i < 80; i++) {
      const geom = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const star = new THREE.Mesh(geom, mat);
      star.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 5 - 5
      );
      this.scene.add(star);
      this.stars.push(star);
    }
  }

  private createPlayer(): void {
    if (!this.world) return;

    const g = new THREE.Group();

    // Quantum messenger body - glowing blue uniform
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0044aa, emissiveIntensity: 0.3 })
    );
    body.position.y = 0.35;
    g.add(body);

    // Head with dark skin tone
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    head.position.y = 0.95;
    g.add(head);

    // Glowing eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const le = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    le.position.set(-0.1, 0.95, 0.06);
    g.add(le);
    const re = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    re.position.set(0.1, 0.95, 0.06);
    g.add(re);

    // Quantum backpack - glowing energy pack
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.4, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x4400aa, emissive: 0x6600ff, emissiveIntensity: 0.5 })
    );
    pack.position.set(-0.35, 0.4, 0);
    g.add(pack);

    // Traditional hat with quantum glow
    const hat = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x663300, emissive: 0xff6600, emissiveIntensity: 0.2 })
    );
    hat.position.y = 1.18;
    g.add(hat);

    g.position.set(0, this.groundLevel + 1.2, 0);
    this.scene.add(g);
    this.playerMesh = g;

    const bd = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, this.groundLevel + 1.2, 0)
      .setLinearDamping(0.5)
      .setAngularDamping(1.0);
    this.playerBody = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.6, 0.1).setFriction(0.5), this.playerBody);
  }

  private createGround(groundColor: number): void {
    if (!this.world) return;

    const geom = new THREE.BoxGeometry(this.worldWidth, 2, 1);
    const mat = new THREE.MeshStandardMaterial({ color: groundColor });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(0, this.groundLevel, 0);
    this.scene.add(mesh);

    const bd = RAPIER.RigidBodyDesc.fixed().setTranslation(0, this.groundLevel, 0);
    const body = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(this.worldWidth / 2, 1, 0.5).setFriction(0.8), body);
    this.platforms.push({ body, mesh });

    // Savanna grass layer
    const grass = new THREE.Mesh(
      new THREE.BoxGeometry(this.worldWidth, 0.4, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x6b8c21 })
    );
    grass.position.set(0, this.groundLevel + 1.2, 0);
    this.scene.add(grass);
  }

  private clearWorld(): void {
    if (!this.world) return;

    // Remove all objects from scene and physics
    for (const p of this.platforms) { this.scene.remove(p.mesh); this.world.removeRigidBody(p.body); }
    this.platforms = [];
    for (const v of this.villagers) { this.scene.remove(v.mesh); this.world.removeRigidBody(v.body); }
    this.villagers = [];
    for (const h of this.huts) { this.scene.remove(h.mesh); }
    this.huts = [];
    for (const i of this.quantumItems) { if (!i.pickedUp) { this.scene.remove(i.mesh); this.world.removeRigidBody(i.body); } }
    this.quantumItems = [];
    for (const c of this.collectibles) { if (!c.collected) { this.scene.remove(c.mesh); this.world.removeRigidBody(c.body); } }
    this.collectibles = [];
    for (const d of this.decorations) { this.scene.remove(d); }
    this.decorations = [];
    for (const p of this.particles) { this.scene.remove(p.mesh); }
    this.particles = [];
    for (const t of this.quantumTrail) { this.scene.remove(t); }
    this.quantumTrail = [];

    if (this.playerMesh) { this.scene.remove(this.playerMesh); this.playerMesh = null; }
    if (this.playerBody) { this.world.removeRigidBody(this.playerBody); this.playerBody = null; }
  }

  private createHut(x: number, y: number, owner: string, wallColor: number): void {
    const g = new THREE.Group();

    // Round hut base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2.2, 0.6),
      new THREE.MeshStandardMaterial({ color: wallColor })
    );
    base.position.y = 1.1;
    g.add(base);

    // Conical thatched roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    roof.position.y = 2.5;
    g.add(roof);

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.3, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x4a3000 })
    );
    door.position.set(0, 0.65, 0.32);
    g.add(door);

    // Quantum energy window - glowing
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.6 })
    );
    win.position.set(-1, 1.6, 0.32);
    g.add(win);

    // Quantum ring above hut
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 })
    );
    ring.position.y = 3.2;
    g.add(ring);

    g.position.set(x, y, 0);
    this.scene.add(g);
    this.huts.push({ x, y, mesh: g, owner, quantumRing: ring });
  }

  private createVillager(x: number, y: number, name: string, dialogue: string[], hasQuest: boolean, glowColor: number): void {
    if (!this.world) return;

    const g = new THREE.Group();

    // Traditional chitenge clothing with quantum glow
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.65, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xe63946, emissive: glowColor, emissiveIntensity: 0.15 })
    );
    body.position.y = 0.32;
    g.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.32, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    head.position.y = 0.82;
    g.add(head);

    // Quantum aura circle
    const aura = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.05),
      new THREE.MeshStandardMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.6, transparent: true, opacity: 0.5 })
    );
    aura.position.y = -0.1;
    g.add(aura);

    g.position.set(x, y, 0);
    this.scene.add(g);

    const bd = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, 0);
    const body2 = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.55, 0.12).setSensor(true), body2);

    this.villagers.push({ name, x, y, mesh: g, body: body2, dialogue, hasQuest, glowColor });
  }

  private createBaobab(x: number, y: number): void {
    const g = new THREE.Group();

    // Thick trunk
    const trunk = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x5c4033 })
    );
    trunk.position.y = 1;
    g.add(trunk);

    // Quantum glowing branches
    const colors = [0x00ff00, 0x44ff44, 0x228822];
    for (let i = 0; i < 3; i++) {
      const branch = new THREE.Mesh(
        new THREE.BoxGeometry(1.5 - i * 0.2, 0.5 - i * 0.1, 0.7 - i * 0.1),
        new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: 0.15 })
      );
      branch.position.y = 2 + i * 0.6;
      g.add(branch);
    }

    g.position.set(x, y, -0.6);
    this.scene.add(g);
    this.decorations.push(g);
  }

  private createQuantumCloud(x: number, y: number): void {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x6644ff, transparent: true, opacity: 0.4, emissive: 0x6644ff, emissiveIntensity: 0.3 });

    const positions = [{ x: 0, y: 0, w: 2, h: 0.7 }, { x: 1, y: 0.3, w: 1.5, h: 0.6 }, { x: -0.8, y: 0.15, w: 1.3, h: 0.6 }];
    for (const p of positions) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, 0.4), mat);
      m.position.set(p.x, p.y, 0);
      g.add(m);
    }

    g.position.set(x, y, -3);
    this.scene.add(g);
    this.decorations.push(g);
  }

  private createQuantumItem(x: number, y: number, type: 'data_crystal' | 'quantum_package'): void {
    if (!this.world) return;

    const geom = type === 'data_crystal'
      ? new THREE.OctahedronGeometry(0.25)
      : new THREE.BoxGeometry(0.5, 0.4, 0.3);

    const color = type === 'data_crystal' ? 0x00ffff : 0xff00ff;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, 0.2);
    this.scene.add(mesh);

    const bd = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, 0);
    const body = this.world.createRigidBody(bd);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.15).setSensor(true), body);

    this.quantumItems.push({ x, y, mesh, body, type, pickedUp: false, glowTime: 0 });
  }

  private setupQuests(): void {
    this.quests = [
      { id: 1, giver: 'Mutale', recipient: 'Nkandu', item: 'quantum_package', completed: false },
      { id: 2, giver: 'Bwalya', recipient: 'Mabvuto', item: 'data_crystal', completed: false },
      { id: 3, giver: 'Nalube', recipient: 'Chileshe', item: 'data_crystal', completed: false },
      { id: 4, giver: 'Nkandu', recipient: 'Bwalya', item: 'quantum_package', completed: false },
      { id: 5, giver: 'Chileshe', recipient: 'Mutale', item: 'data_crystal', completed: false }
    ];
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.cutsceneActive) {
      this.input.update();
      if (this.input.InputState.keys['KeyE']) this.advanceCutscene();
      return;
    }
    if (this.world) this.world.step();

    if (this.dialogueActive) {
      this.handleDialogueInput();
    } else {
      this.handleInput();
    }

    this.updateCamera();
    this.checkCollisions();
    this.syncMeshes();
    this.updateUI();
    this.updateQuantumEffects(deltaTime);
  }

  private handleInput(): void {
    if (this.cutsceneActive) return;
    this.input.update();
    if (!this.playerBody) return;

    const velocity = this.playerBody.linvel();
    const ks = this.input.InputState;
    const kL = ks.keys['ArrowLeft'] ? 1 : 0;
    const kR = ks.keys['ArrowRight'] ? 1 : 0;
    const inputX = (kR - kL) || (this.touchRight ? 1 : 0) - (this.touchLeft ? 1 : 0);

    this.isMoving = inputX !== 0;
    velocity.x = inputX * this.playerSpeed;

    if ((ks.keys['Space'] || this.touchJump)) {
      if (this.isGrounded) {
        velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpCount = 1;
        this.touchJump = false;
        this.spawnJumpParticles();
      } else if (this.hasDoubleJump && this.jumpCount < 2) {
        velocity.y = this.jumpForce * 0.8;
        this.jumpCount++;
        this.touchJump = false;
        this.spawnJumpParticles();
      }
    }

    this.playerBody.setLinvel(velocity, true);

    if (this.playerMesh && inputX !== 0) {
      this.facingRight = inputX > 0;
      this.playerMesh.scale.x = this.facingRight ? 1 : -1;
    }

    this.wrapPlayer();
    this.checkProximity();

    if (ks.keys['KeyE'] || this.touchInteract) {
      this.tryInteract();
      this.touchInteract = false;
    }
  }

  private spawnJumpParticles(): void {
    if (!this.playerBody) return;
    const pos = this.playerBody.translation();
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc })
      );
      p.position.set(pos.x + (Math.random() - 0.5) * 0.5, pos.y - 0.5, 0);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, 0),
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  private wrapPlayer(): void {
    if (!this.playerBody) return;
    const pos = this.playerBody.translation();
    const hw = this.worldWidth / 2;
    if (pos.x > hw) this.playerBody.setTranslation({ x: -hw + 1, y: pos.y, z: pos.z }, true);
    else if (pos.x < -hw) this.playerBody.setTranslation({ x: hw - 1, y: pos.y, z: pos.z }, true);
  }

  private checkProximity(): void {
    if (!this.playerBody || !this.interactPrompt) return;
    const pos = this.playerBody.translation();
    let near = false;
    for (const v of this.villagers) {
      if (Math.abs(pos.x - v.x) < 2.5 && Math.abs(pos.y - v.y) < 2.5) { near = true; break; }
    }
    if (!near) {
      for (const h of this.huts) {
        if (Math.abs(pos.x - h.x) < 3 && Math.abs(pos.y - h.y) < 2.5) { near = true; break; }
      }
    }
    this.interactPrompt.style.display = near ? 'block' : 'none';
  }

  private tryInteract(): void {
    if (!this.playerBody) return;
    const pos = this.playerBody.translation();

    for (const v of this.villagers) {
      if (Math.abs(pos.x - v.x) < 2.5 && Math.abs(pos.y - v.y) < 2.5) {
        this.startDialogue(v);
        return;
      }
    }

    for (const item of this.quantumItems) {
      if (item.pickedUp) continue;
      if (Math.abs(pos.x - item.x) < 1.5 && Math.abs(pos.y - item.y) < 1.5) {
        this.pickupItem(item);
        return;
      }
    }

    for (const h of this.huts) {
      if (Math.abs(pos.x - h.x) < 3 && Math.abs(pos.y - h.y) < 2.5) {
        this.tryDeliver(h);
        return;
      }
    }
  }

  private startDialogue(v: Villager): void {
    this.dialogueActive = true;
    this.currentVillager = v;
    this.dialogueIndex = 0;
    const box = document.getElementById('dialogue-box');
    if (box) box.style.display = 'block';
    this.showDialogueText();
  }

  private showDialogueText(): void {
    if (!this.currentVillager || !this.dialogueName || !this.dialogueText) return;
    this.dialogueName.textContent = this.currentVillager.name;
    if (this.dialogueIndex < this.currentVillager.dialogue.length) {
      this.dialogueText.textContent = this.currentVillager.dialogue[this.dialogueIndex];
    } else {
      if (this.currentVillager.hasQuest && !this.currentQuest) {
        this.assignQuest(this.currentVillager.name);
      }
      // Shop purchases after dialogue
      if (this.currentVillager.name === 'Upgrader') {
        this.tryPurchaseUpgrade();
      }
      this.endDialogue();
    }
  }

  private tryPurchaseUpgrade(): void {
    if (!this.hasSpeedBoots && this.quantumEnergy >= 5) {
      this.quantumEnergy -= 5;
      this.hasSpeedBoots = true;
      this.playerSpeed = 10;
      this.showNotification('Speed Boots acquired! Movement speed increased!');
    } else if (!this.hasDoubleJump && this.quantumEnergy >= 10) {
      this.quantumEnergy -= 10;
      this.hasDoubleJump = true;
      this.showNotification('Double Jump acquired! Press Space again in mid-air!');
    } else if (!this.hasQuantumVision && this.quantumEnergy >= 15) {
      this.quantumEnergy -= 15;
      this.hasQuantumVision = true;
      this.showNotification('Quantum Vision acquired! See hidden paths!');
    } else {
      this.showNotification('Not enough energy for upgrades! Collect more artifacts!');
    }
    this.updateUI();
  }

  private handleDialogueInput(): void {
    this.input.update();
    if (this.input.InputState.keys['KeyE']) this.advanceDialogue();
  }

  private advanceDialogue(): void {
    this.dialogueIndex++;
    this.showDialogueText();
  }

  private endDialogue(): void {
    this.dialogueActive = false;
    this.currentVillager = null;
    const box = document.getElementById('dialogue-box');
    if (box) box.style.display = 'none';
  }

  private assignQuest(npcName: string): void {
    const q = this.quests.find(q => q.giver === npcName && !q.completed);
    if (q && !this.currentQuest) {
      this.currentQuest = q;
      this.showNotification(`New Quantum Delivery: Take ${q.item} to ${q.recipient}!`);
    }
  }

  private pickupItem(item: QuantumItem): void {
    item.pickedUp = true;
    this.scene.remove(item.mesh);
    this.inventory.push(item.type);
    this.showNotification(`Acquired ${item.type.replace('_', ' ')}!`);
    this.updateInventoryUI();
  }

  private tryDeliver(hut: Hut): void {
    if (!this.currentQuest) {
      this.showNotification("No active quantum delivery.");
      return;
    }
    if (hut.owner !== this.currentQuest.recipient) {
      this.showNotification(`This is ${hut.owner}'s hut. Deliver to ${this.currentQuest.recipient}!`);
      return;
    }
    const idx = this.inventory.indexOf(this.currentQuest.item);
    if (idx === -1) {
      this.showNotification(`Need ${this.currentQuest.item.replace('_', ' ')}!`);
      return;
    }

    this.inventory.splice(idx, 1);
    this.currentQuest.completed = true;
    this.deliveredCount++;
    this.showNotification(`Quantum delivery complete! ${this.currentQuest.recipient} received ${this.currentQuest.item.replace('_', ' ')}.`);

    // Flash hut ring
    if (hut.quantumRing) {
      const mat = hut.quantumRing.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.0;
    }

    this.currentQuest = null;
    this.updateInventoryUI();

    if (this.deliveredCount >= this.totalQuests) {
      this.showGameComplete();
    }
  }

  private showNotification(text: string): void {
    const n = document.createElement('div');
    n.style.cssText = 'position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);background:rgba(10,0,30,0.85);color:#00ffcc;padding:15px 25px;border-radius:10px;font:18px Arial;border:1px solid #00ffcc;text-shadow:0 0 8px #00ffcc;z-index:200;';
    n.textContent = text;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) document.body.removeChild(n); }, 3000);
  }

  private showGameComplete(): void {
    if (!this.gameOverlay) return;
    this.levelComplete = true;
    if (this.currentLevel < this.maxLevels - 1) {
      this.gameOverlay.style.display = 'block';
      this.gameOverlay.innerHTML = `
        <div>Level ${this.currentLevel + 1} Complete!</div>
        <div style="font-size:20px;margin-top:15px;">Village saved! Next: ${this.levelNames[this.currentLevel + 1]}</div>
        <div style="font-size:16px;margin-top:15px;color:#aaa;">Press E to continue</div>
      `;
      const waitForContinue = () => {
        this.input.update();
        if (this.input.InputState.keys['KeyE']) {
          this.gameOverlay.style.display = 'none';
          this.playLevelTransitionCutscene();
        } else {
          requestAnimationFrame(waitForContinue);
        }
      };
      waitForContinue();
    } else {
      this.gameOverlay.style.display = 'block';
      this.gameOverlay.innerHTML = `
        <div>ALL LEVELS COMPLETE!</div>
        <div style="font-size:22px;margin-top:15px;">You have saved the quantum universe!</div>
        <div style="font-size:16px;margin-top:10px;color:#ff66ff;">Artifacts: ${this.collectiblesFound}/${this.totalCollectibles * 3}</div>
        <div style="font-size:16px;margin-top:10px;color:#00ffff;">Total Energy: ${this.quantumEnergy}</div>
        <div style="font-size:14px;margin-top:15px;color:#aaa;">Refresh page to play again</div>
      `;
    }
  }

  private playOpeningCutscene(): void {
    this.cutsceneLines = [
      'In the year 2147, the quantum veil between worlds grows thin...',
      'The villages of Zambia exist in a superposition of ancient tradition and quantum technology.',
      'You are the Quantum Messenger - keeper of the quantum postal network.',
      'Deliver the data crystals and packages to restore balance to the quantum realm.',
      'Use Arrow Keys to move, Space to jump, E to interact.',
      'Begin your journey in the Village of Zambezi!'
    ];
    this.cutsceneIndex = 0;
    this.cutsceneActive = true;
    if (this.cutsceneElement) {
      this.cutsceneElement.style.display = 'flex';
      this.showCutsceneText();
    }
  }

  private playLevelTransitionCutscene(): void {
    this.cutsceneLines = [
      `The quantum network of ${this.levelNames[this.currentLevel]} has been restored!`,
      'The ancestors smile upon your work.',
      `Prepare to travel to ${this.levelNames[this.currentLevel + 1]}...`,
      'New challenges await in the quantum realm!'
    ];
    this.cutsceneIndex = 0;
    this.cutsceneActive = true;
    if (this.cutsceneElement) {
      this.cutsceneElement.style.display = 'flex';
      this.showCutsceneText();
    }
  }

  private showCutsceneText(): void {
    if (!this.cutsceneElement) return;
    if (this.cutsceneIndex < this.cutsceneLines.length) {
      this.cutsceneElement.innerHTML = `<div style="max-width:700px;line-height:1.6;">${this.cutsceneLines[this.cutsceneIndex]}</div><div style="font-size:14px;color:#888;margin-top:20px;">Click or Press E to continue</div>`;
    } else {
      this.endCutscene();
    }
  }

  private advanceCutscene(): void {
    this.cutsceneIndex++;
    this.showCutsceneText();
  }

  private endCutscene(): void {
    this.cutsceneActive = false;
    if (this.cutsceneElement) this.cutsceneElement.style.display = 'none';
    if (this.levelComplete && this.currentLevel < this.maxLevels - 1) {
      this.loadLevel(this.currentLevel + 1);
    }
  }

  private startMiniGame(): void {
    this.miniGameActive = true;
    this.miniGameType = 'memory';
    this.memoryPhase = 'show';
    this.memorySequence = [];
    this.playerSequence = [];
    for (let i = 0; i < 4; i++) this.memorySequence.push(Math.floor(Math.random() * 4));
    this.showNotification('Quantum Memory Challenge! Watch the sequence...');
    this.memoryTimer = 0;
  }

  private updateInventoryUI(): void {
    if (!this.inventoryElement) return;
    const items = this.inventory.length > 0 ? this.inventory.map(i => `• ${i.replace('_', ' ')}`).join('<br>') : 'Empty';
    this.inventoryElement.innerHTML = `<div>Quantum Inventory:</div><div style="font-size:14px;margin-top:5px;color:#ccc;">${items}</div>`;
  }

  private updateUI(): void {
    if (this.questLogElement) {
      if (this.currentQuest) {
        this.questLogElement.innerHTML = `<div>Deliveries: ${this.deliveredCount}/${this.totalQuests}</div><div style="font-size:13px;margin-top:4px;color:#FFD700;">Deliver ${this.currentQuest.item.replace('_', ' ')} to ${this.currentQuest.recipient}</div>`;
      } else {
        this.questLogElement.textContent = `Deliveries: ${this.deliveredCount}/${this.totalQuests}`;
      }
    }
    if (this.energyElement) this.energyElement.textContent = `Energy: ${this.quantumEnergy}`;
    if (this.collectibleElement) this.collectibleElement.textContent = `Artifacts: ${this.collectiblesFound}/${this.totalCollectibles * this.maxLevels}`;
  }

  private updateQuantumEffects(deltaTime: number): void {
    // Animate quantum items floating
    for (const item of this.quantumItems) {
      if (item.pickedUp) continue;
      item.glowTime += deltaTime * 3;
      item.mesh.position.y = item.y + Math.sin(item.glowTime) * 0.3;
      item.mesh.rotation.y += deltaTime * 2;
      item.mesh.rotation.z = Math.sin(item.glowTime * 0.5) * 0.2;
    }

    // Animate hut quantum rings
    for (const hut of this.huts) {
      if (hut.quantumRing) {
        hut.quantumRing.rotation.z += deltaTime * 0.5;
        hut.quantumRing.position.y = 3.2 + Math.sin(this.time * 2 + hut.x) * 0.15;
        const mat = hut.quantumRing.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity > 0.8) mat.emissiveIntensity -= deltaTime;
      }
    }

    // Animate quantum clouds
    for (let i = this.decorations.length - 3; i < this.decorations.length; i++) {
      if (i >= 0) {
        this.decorations[i].position.x += deltaTime * 0.3;
        if (this.decorations[i].position.x > this.worldWidth / 2) {
          this.decorations[i].position.x = -this.worldWidth / 2;
        }
      }
    }

    // Twinkle stars
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const scale = 0.5 + Math.sin(this.time * 3 + i) * 0.3;
      s.scale.setScalar(scale);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;
      p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      p.velocity.y -= 9.8 * deltaTime;
      const alpha = p.life / p.maxLife;
      p.mesh.scale.setScalar(alpha);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // Quantum trail when moving
    if (this.isMoving && this.playerBody) {
      this.trailTimer += deltaTime;
      if (this.trailTimer > 0.05) {
        this.trailTimer = 0;
        const pos = this.playerBody.translation();
        const trail = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.15, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.6 })
        );
        trail.position.set(pos.x, pos.y - 0.3, 0);
        this.scene.add(trail);
        this.quantumTrail.push(trail);
        if (this.quantumTrail.length > 15) {
          const old = this.quantumTrail.shift();
          if (old) this.scene.remove(old);
        }
      }
    }
    // Fade trail
    for (let i = this.quantumTrail.length - 1; i >= 0; i--) {
      const t = this.quantumTrail[i];
      const mat = t.material as THREE.MeshBasicMaterial;
      mat.opacity -= deltaTime * 2;
      if (mat.opacity <= 0) {
        this.scene.remove(t);
        this.quantumTrail.splice(i, 1);
      }
    }
  }

  private updateCamera(): void {
    if (!this.playerMesh) return;
    const tx = this.playerMesh.position.x;
    const ty = this.playerMesh.position.y + 2;
    this.camera.position.x += (tx - this.camera.position.x) * this.cameraSmooth;
    this.camera.position.y += (ty - this.camera.position.y) * this.cameraSmooth;
  }

  private checkCollisions(): void {
    if (!this.playerBody) return;
    const pos = this.playerBody.translation();
    const wasGrounded = this.isGrounded;
    this.isGrounded = pos.y <= this.groundLevel + 0.3;
    if (!wasGrounded && this.isGrounded) {
      this.isJumping = false;
      this.jumpCount = 0;
    }

    // Auto pickup quantum items
    for (const item of this.quantumItems) {
      if (item.pickedUp) continue;
      if (Math.abs(pos.x - item.x) < 1.2 && Math.abs(pos.y - item.y) < 1.2) {
        this.pickupItem(item);
      }
    }

    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (Math.abs(pos.x - c.x) < 1.0 && Math.abs(pos.y - c.y) < 1.0) {
        c.collected = true;
        this.scene.remove(c.mesh);
        this.quantumEnergy += 2;
        this.collectiblesFound++;
        this.showNotification(`Found ${c.name}! +2 Energy`);
        this.updateUI();
      }
    }

    if (pos.y < -10) {
      this.playerBody.setTranslation({ x: 0, y: this.groundLevel + 5, z: 0 }, true);
      this.playerBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }

  private syncMeshes(): void {
    if (this.playerBody && this.playerMesh) {
      const pos = this.playerBody.translation();
      this.playerMesh.position.set(pos.x, pos.y, pos.z);
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    const aspect = width / height;
    const vs = 16;
    this.camera.left = -vs * aspect;
    this.camera.right = vs * aspect;
    this.camera.top = vs;
    this.camera.bottom = -vs;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.input.removeEventListeners();
    this.renderer.dispose();
    if (this.world) { this.world.free(); this.world = null; }

    const remove = (el: HTMLElement | null) => { if (el && el.parentNode) document.body.removeChild(el); };
    remove(this.questLogElement);
    remove(this.inventoryElement);
    remove(this.gameOverlay);
    remove(this.interactPrompt);
    remove(this.energyElement);
    remove(this.collectibleElement);
    remove(this.levelElement);
    remove(this.cutsceneElement);
    const db = document.getElementById('dialogue-box');
    if (db && db.parentNode) document.body.removeChild(db);
  }
}
