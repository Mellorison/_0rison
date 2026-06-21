import { NPC } from './NPC';
import { CubeToSpherePlanet } from '../world/CubeToSpherePlanet';
import * as THREE from 'three';

/**
 * Delivery quest system for Messenger-style gameplay.
 */
export class QuestSystem {
  private npcs: NPC[] = [];
  private activeQuest: Quest | null = null;
  private completedQuests: number = 0;
  private world: CubeToSpherePlanet;
  private scene: THREE.Scene;

  // Quest UI
  private questPanel: HTMLDivElement | null = null;
  private notificationPanel: HTMLDivElement | null = null;

  constructor(world: CubeToSpherePlanet, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
    this.createUI();
  }

  /**
   * Creates quest NPCs across the planet.
   */
  createQuestNPCs(): NPC[] {
    const questGivers = [
      { name: ' fisherman', lat: 60, lon: -30, dialog: ["Can you deliver this fish to the plaza?", "The plaza is just around the planet!"] },
      { name: ' worker', lat: 30, lon: 45, dialog: ["I need this package delivered to the village elder.", "Head to the village area!"] },
      { name: ' elder', lat: 0, lon: 0, dialog: ["Please take this letter to the temple monk.", "The temple is on the far side of the planet."] },
      { name: ' monk', lat: -60, lon: -60, dialog: ["Deliver this offering to the beach bar.", "The beach has palm trees!"] },
      { name: ' bartender', lat: 60, lon: -30, dialog: ["Take this drink to the plaza monument!", "The monument is hard to miss."] },
    ];

    // Create non-quest NPCs for atmosphere
    const regularNPCs = [
      { name: ' child', lat: 5, lon: 5, dialog: ["I want to be a mail carrier too!", "Have you seen the big tree?"] },
      { name: ' farmer', lat: -20, lon: 30, dialog: ["The acacia trees are blooming.", "Nice weather for deliveries!"] },
      { name: ' traveler', lat: 45, lon: -45, dialog: ["This planet is so small!", "I've walked all the way around it."] },
    ];

    for (const data of questGivers) {
      const npc = new NPC(data.name, this.world, data.dialog, true);
      npc.placeOnSurface(data.lat, data.lon);
      this.npcs.push(npc);
    }

    for (const data of regularNPCs) {
      const npc = new NPC(data.name, this.world, data.dialog, false);
      npc.placeOnSurface(data.lat, data.lon);
      this.npcs.push(npc);
    }

    // Start first quest
    this.startQuest(0);

    return this.npcs;
  }

  private startQuest(npcIndex: number): void {
    if (npcIndex >= this.npcs.length) return;
    const giver = this.npcs[npcIndex];
    if (!giver.HasQuest) {
      // Find next quest giver
      for (let i = 0; i < this.npcs.length; i++) {
        if (this.npcs[i].HasQuest) {
          this.activeQuest = {
            giver: this.npcs[i],
            target: this.npcs[(i + 1) % this.npcs.length],
            description: `Deliver ${this.getItemName()} to ${this.npcs[(i + 1) % this.npcs.length].NPCName}`,
            completed: false
          };
          this.showQuestNotification(`New Quest: ${this.activeQuest.description}`);
          this.updateQuestPanel();
          return;
        }
      }
      return;
    }

    const targetIndex = (npcIndex + 1) % this.npcs.length;
    this.activeQuest = {
      giver,
      target: this.npcs[targetIndex],
      description: `Deliver ${this.getItemName()} to ${this.npcs[targetIndex].NPCName}`,
      completed: false
    };

    this.showQuestNotification(`New Quest: ${this.activeQuest.description}`);
    this.updateQuestPanel();
  }

  private getItemName(): string {
    const items = ['a letter', 'a package', 'a parcel', 'an envelope', 'a message'];
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Checks if player can interact with any NPC.
   */
  checkInteractions(playerPosition: THREE.Vector3): { npc: NPC; canInteract: boolean } | null {
    for (const npc of this.npcs) {
      if (npc.canInteract(playerPosition)) {
        return { npc, canInteract: true };
      }
    }
    return null;
  }

  /**
   * Interacts with an NPC.
   */
  interact(npc: NPC): string {
    if (this.activeQuest && this.activeQuest.target === npc && !this.activeQuest.completed) {
      // Complete quest
      npc.completeQuest();
      this.activeQuest.completed = true;
      this.completedQuests++;
      this.showQuestNotification(`Quest Complete! Delivered to ${npc.NPCName}`);

      // Find next quest
      const nextGiverIndex = this.npcs.findIndex(n => n.HasQuest);
      if (nextGiverIndex >= 0) {
        setTimeout(() => this.startQuest(nextGiverIndex), 2000);
      } else {
        this.showQuestNotification(`All quests complete! You delivered ${this.completedQuests} items!`);
      }

      this.updateQuestPanel();
      return `Thank you! You delivered the ${this.getItemName()}!`;
    }

    return npc.getDialog();
  }

  get ActiveQuest(): Quest | null {
    return this.activeQuest;
  }

  get CompletedQuests(): number {
    return this.completedQuests;
  }

  get NPCs(): NPC[] {
    return this.npcs;
  }

  /**
   * Updates all NPCs.
   */
  update(deltaTime: number): void {
    for (const npc of this.npcs) {
      npc.updateAnimation(deltaTime);
    }
  }

  private createUI(): void {
    // Quest panel (top left)
    this.questPanel = document.createElement('div');
    this.questPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(255,255,255,0.9);
      padding: 15px 20px;
      border-radius: 12px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #333;
      z-index: 100;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      display: none;
      min-width: 200px;
    `;
    document.body.appendChild(this.questPanel);

    // Notification panel (top center)
    this.notificationPanel = document.createElement('div');
    this.notificationPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(46, 204, 113, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 16px;
      font-weight: bold;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    document.body.appendChild(this.notificationPanel);
  }

  private updateQuestPanel(): void {
    if (!this.questPanel) return;

    if (this.activeQuest && !this.activeQuest.completed) {
      this.questPanel.style.display = 'block';
      this.questPanel.innerHTML = `
        <div style="font-weight: bold; color: #e74c3c; margin-bottom: 5px;">📮 Current Quest</div>
        <div>${this.activeQuest.description}</div>
        <div style="margin-top: 8px; font-size: 12px; color: #888;">Deliveries: ${this.completedQuests}</div>
      `;
    } else {
      this.questPanel.innerHTML = `
        <div style="font-weight: bold; color: #27ae60;">✓ No active quest</div>
        <div style="margin-top: 8px; font-size: 12px; color: #888;">Deliveries: ${this.completedQuests}</div>
      `;
    }
  }

  private showQuestNotification(text: string): void {
    if (!this.notificationPanel) return;
    this.notificationPanel.textContent = text;
    this.notificationPanel.style.opacity = '1';

    setTimeout(() => {
      if (this.notificationPanel) {
        this.notificationPanel.style.opacity = '0';
      }
    }, 3000);
  }

  showInteractionPrompt(npcName: string): void {
    if (!this.questPanel) return;
    this.questPanel.style.display = 'block';
    this.questPanel.innerHTML = `
      <div style="font-weight: bold; color: #3498db;">👋 ${npcName}</div>
      <div style="margin-top: 5px; font-size: 12px; color: #666;">Press E to talk</div>
    `;
  }

  hideInteractionPrompt(): void {
    this.updateQuestPanel();
  }

  dispose(): void {
    this.questPanel?.remove();
    this.notificationPanel?.remove();
    for (const npc of this.npcs) {
      npc.removedFromScene();
    }
    this.npcs = [];
  }
}

export interface Quest {
  giver: NPC;
  target: NPC;
  description: string;
  completed: boolean;
}
