import * as THREE from 'three';
import { CubeToSpherePlanet } from './CubeToSpherePlanet';
import { AssetManager } from '../assets/AssetManager';

/**
 * Planet environment generator for Messenger-style spherical world.
 * Creates multiple biomes: village, beach, temple, forest, plaza, cemetery.
 */
export class PlanetEnvironment {
  private world: CubeToSpherePlanet;
  private scene: THREE.Scene;
  private objects: THREE.Object3D[] = [];
  private assetManager: AssetManager = AssetManager.getInstance();

  constructor(world: CubeToSpherePlanet) {
    this.world = world;
    this.scene = world.PlanetGroup.parent! as THREE.Scene;
  }

  /**
   * Generates the complete planet environment.
   */
  async generatePlanet(): Promise<void> {
    await this.generateVillage(0, 0);
    await this.generatePlaza(30, 45);
    await this.generateBeach(60, -30);
    await this.generateForest(-45, 60);
    await this.generateTemple(-60, -60);
    await this.generateCemetery(20, 120);
  }

  /**
   * Generates a village biome.
   */
  private async generateVillage(lat: number, lon: number): Promise<void> {
    // Central village area - place huts in a cluster
    for (let i = 0; i < 4; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const offsetLat = lat + Math.cos(angle) * 3;
      const offsetLon = lon + Math.sin(angle) * 3;
      await this.placeHut(offsetLat, offsetLon);
    }

    // Communal fire pit
    this.placeFirePit(lat, lon + 5);

    // Paths connecting huts
    this.placePath(lat, lon, lat, lon + 10);
    this.placePath(lat, lon, lat + 5, lon);

    // Village trees
    this.placeAcaciaTree(lat + 8, lon + 3);
    this.placeAcaciaTree(lat - 5, lon - 4);
  }

  /**
   * Generates a plaza/town center.
   */
  private async generatePlaza(lat: number, lon: number): Promise<void> {
    // Central monument
    const monument = this.createMonument();
    this.world.placeOnSurface(monument, lat, lon, 0);
    this.objects.push(monument);

    // Surrounding buildings
    for (let i = 0; i < 3; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const bLat = lat + Math.cos(angle) * 5;
      const bLon = lon + Math.sin(angle) * 5;
      await this.placeBuilding(bLat, bLon, 0x8b7355);
    }

    // Plaza trees
    await this.placeBaobabTree(lat + 10, lon + 5);
    await this.placeBaobabTree(lat - 8, lon + 8);
  }

  /**
   * Generates a beach biome.
   */
  private async generateBeach(lat: number, lon: number): Promise<void> {
    // Palm trees
    for (let i = 0; i < 2; i++) {
      const bLat = lat + (Math.random() - 0.5) * 8;
      const bLon = lon + (Math.random() - 0.5) * 8;
      await this.placePalmTree(bLat, bLon);
    }

    // Beach huts
    await this.placeHut(lat + 3, lon + 2, 0xe8d4a0);
    await this.placeHut(lat - 2, lon - 3, 0xe8d4a0);

    // Fishing dock posts
    this.placeDock(lat, lon + 8);
  }

  /**
   * Generates a forest biome.
   */
  private async generateForest(lat: number, lon: number): Promise<void> {
    // Dense trees
    for (let i = 0; i < 6; i++) {
      const fLat = lat + (Math.random() - 0.5) * 15;
      const fLon = lon + (Math.random() - 0.5) * 15;
      await this.placeAcaciaTree(fLat, fLon);
    }

    // Clearing with stones
    this.placeStoneCircle(lat, lon);
  }

  /**
   * Generates a temple/mountain shrine.
   */
  private async generateTemple(lat: number, lon: number): Promise<void> {
    // Temple base
    const temple = this.createTemple();
    this.world.placeOnSurface(temple, lat, lon, 0);
    this.objects.push(temple);

    // Torii-style gates along path
    this.placeToriiGate(lat + 5, lon, 0);
    this.placeToriiGate(lat + 10, lon, 0);

    // Stone lanterns
    this.placeLantern(lat + 3, lon + 2);
    this.placeLantern(lat + 3, lon - 2);
  }

  /**
   * Generates a cemetery.
   */
  private async generateCemetery(lat: number, lon: number): Promise<void> {
    // Grave markers
    for (let i = 0; i < 4; i++) {
      const gLat = lat + (Math.random() - 0.5) * 6;
      const gLon = lon + (Math.random() - 0.5) * 6;
      this.placeGraveMarker(gLat, gLon);
    }

    // Central memorial tree
    await this.placeBaobabTree(lat, lon + 5);
  }

  // --- Object creation helpers ---

  private async placeHut(lat: number, lon: number, wallColor: number = 0x8b4513): Promise<void> {
    try {
      const gltf = await this.assetManager.loadGLTF('hut.glb');
      this.world.placeOnSurface(gltf.scene, lat, lon, 0);
      this.objects.push(gltf.scene);
    } catch (error) {
      console.warn('Failed to load hut GLTF, using procedural fallback:', error);
      this.placeProceduralHut(lat, lon, wallColor);
    }
  }

  private placeProceduralHut(lat: number, lon: number, wallColor: number = 0x8b4513): void {
    const hut = new THREE.Group();

    const wallGeo = new THREE.CylinderGeometry(2, 2.2, 2, 8);
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1;
    walls.castShadow = true;
    hut.add(walls);

    const roofGeo = new THREE.ConeGeometry(3, 1.5, 8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd2691e });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.5;
    roof.castShadow = true;
    hut.add(roof);

    const doorGeo = new THREE.PlaneGeometry(0.8, 1.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.8, 2.2);
    hut.add(door);

    this.world.placeOnSurface(hut, lat, lon, 0);
    this.objects.push(hut);
  }

  private async placeBuilding(lat: number, lon: number, color: number): Promise<void> {
    try {
      const gltf = await this.assetManager.loadGLTF('building.glb');
      this.world.placeOnSurface(gltf.scene, lat, lon, 0);
      this.objects.push(gltf.scene);
    } catch (error) {
      console.warn('Failed to load building GLTF, using procedural fallback:', error);
      this.placeProceduralBuilding(lat, lon, color);
    }
  }

  private placeProceduralBuilding(lat: number, lon: number, color: number): void {
    const building = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(3, 4, 3);
    const boxMat = new THREE.MeshStandardMaterial({ color });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 2;
    box.castShadow = true;
    building.add(box);

    const roofGeo = new THREE.ConeGeometry(2.5, 1.5, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    building.add(roof);

    this.world.placeOnSurface(building, lat, lon, 0);
    this.objects.push(building);
  }

  private async placeAcaciaTree(lat: number, lon: number): Promise<void> {
    try {
      const gltf = await this.assetManager.loadGLTF('acacia_tree.glb');
      this.world.placeOnSurface(gltf.scene, lat, lon, 0);
      this.objects.push(gltf.scene);
    } catch (error) {
      console.warn('Failed to load acacia tree GLTF, using procedural fallback:', error);
      this.placeProceduralAcaciaTree(lat, lon);
    }
  }

  private placeProceduralAcaciaTree(lat: number, lon: number): void {
    const tree = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    tree.add(trunk);

    const canopyGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 8);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 3.5;
    canopy.castShadow = true;
    tree.add(canopy);

    this.world.placeOnSurface(tree, lat, lon, 0);
    this.objects.push(tree);
  }

  private async placeBaobabTree(lat: number, lon: number): Promise<void> {
    try {
      const gltf = await this.assetManager.loadGLTF('baobab_tree.glb');
      this.world.placeOnSurface(gltf.scene, lat, lon, 0);
      this.objects.push(gltf.scene);
    } catch (error) {
      console.warn('Failed to load baobab tree GLTF, using procedural fallback:', error);
      this.placeProceduralBaobabTree(lat, lon);
    }
  }

  private placeProceduralBaobabTree(lat: number, lon: number): void {
    const tree = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(1.5, 2.5, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    trunk.castShadow = true;
    tree.add(trunk);

    const canopyGeo = new THREE.SphereGeometry(2, 8, 8);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 7;
    canopy.castShadow = true;
    tree.add(canopy);

    this.world.placeOnSurface(tree, lat, lon, 0);
    this.objects.push(tree);
  }

  private async placePalmTree(lat: number, lon: number): Promise<void> {
    try {
      const gltf = await this.assetManager.loadGLTF('palm_tree.glb');
      this.world.placeOnSurface(gltf.scene, lat, lon, 0);
      this.objects.push(gltf.scene);
    } catch (error) {
      console.warn('Failed to load palm tree GLTF, using procedural fallback:', error);
      this.placeProceduralPalmTree(lat, lon);
    }
  }

  private placeProceduralPalmTree(lat: number, lon: number): void {
    const tree = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.rotation.z = 0.2;
    trunk.castShadow = true;
    tree.add(trunk);

    for (let i = 0; i < 6; i++) {
      const frondGeo = new THREE.ConeGeometry(0.8, 2, 4);
      const frondMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.y = 4.2;
      frond.rotation.z = Math.PI / 3;
      frond.rotation.y = (i / 6) * Math.PI * 2;
      tree.add(frond);
    }

    this.world.placeOnSurface(tree, lat, lon, 0);
    this.objects.push(tree);
  }

  private placeFirePit(lat: number, lon: number): void {
    const pit = new THREE.Group();

    const pitGeo = new THREE.CylinderGeometry(1, 1.2, 0.3, 8);
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const pitMesh = new THREE.Mesh(pitGeo, pitMat);
    pitMesh.position.y = 0.15;
    pit.add(pitMesh);

    // Fire glow
    const fireGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 0.5;
    pit.add(fire);

    // Seating stones
    for (let i = 0; i < 3; i++) {
      const stoneGeo = new THREE.DodecahedronGeometry(0.3);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      const angle = (i / 5) * Math.PI * 2;
      stone.position.set(Math.cos(angle) * 2, 0.2, Math.sin(angle) * 2);
      pit.add(stone);
    }

    this.world.placeOnSurface(pit, lat, lon, 0);
    this.objects.push(pit);
  }

  private placePath(lat1: number, lon1: number, lat2: number, lon2: number): void {
    // Create a path of small stones along the great circle
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;

      const stoneGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      this.world.placeOnSurface(stone, lat, lon, 0.05);
      this.objects.push(stone);
    }
  }

  private placeDock(lat: number, lon: number): void {
    const dock = new THREE.Group();

    for (let i = 0; i < 4; i++) {
      const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(i * 0.8 - 1.2, 0.5, 0);
      dock.add(post);
    }

    // Dock planks
    const plankGeo = new THREE.BoxGeometry(3, 0.1, 0.8);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xa0522d });
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.y = 1.2;
    dock.add(plank);

    this.world.placeOnSurface(dock, lat, lon, 0);
    this.objects.push(dock);
  }

  private placeStoneCircle(lat: number, lon: number): void {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const sLat = lat + Math.cos(angle) * 3;
      const sLon = lon + Math.sin(angle) * 3;

      const stoneGeo = new THREE.CylinderGeometry(0.3, 0.4, 1, 6);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      this.world.placeOnSurface(stone, sLat, sLon, 0);
      this.objects.push(stone);
    }
  }

  private placeToriiGate(lat: number, lon: number, heightOffset: number): void {
    const gate = new THREE.Group();

    // Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 3, 6);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });

    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-1.5, 1.5, 0);
    gate.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(1.5, 1.5, 0);
    gate.add(rightPillar);

    // Top bar
    const barGeo = new THREE.BoxGeometry(4, 0.3, 0.3);
    const bar = new THREE.Mesh(barGeo, pillarMat);
    bar.position.y = 3;
    gate.add(bar);

    // Cross bar
    const crossGeo = new THREE.BoxGeometry(3.5, 0.2, 0.2);
    const crossMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const cross = new THREE.Mesh(crossGeo, crossMat);
    cross.position.y = 2.6;
    gate.add(cross);

    this.world.placeOnSurface(gate, lat, lon, heightOffset);
    this.objects.push(gate);
  }

  private placeLantern(lat: number, lon: number): void {
    const lantern = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    lantern.add(base);

    const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 1;
    lantern.add(light);

    const topGeo = new THREE.ConeGeometry(0.3, 0.4, 4);
    const top = new THREE.Mesh(topGeo, baseMat);
    top.position.y = 1.3;
    lantern.add(top);

    this.world.placeOnSurface(lantern, lat, lon, 0);
    this.objects.push(lantern);
  }

  private placeGraveMarker(lat: number, lon: number): void {
    const grave = new THREE.Group();

    const stoneGeo = new THREE.BoxGeometry(0.6, 0.8, 0.15);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.y = 0.4;
    stone.castShadow = true;
    grave.add(stone);

    const baseGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.05;
    grave.add(base);

    this.world.placeOnSurface(grave, lat, lon, 0);
    this.objects.push(grave);
  }

  private createMonument(): THREE.Group {
    const monument = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(2, 2.5, 1, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.5;
    base.castShadow = true;
    monument.add(base);

    const pillarGeo = new THREE.CylinderGeometry(0.8, 1, 5, 8);
    const pillar = new THREE.Mesh(pillarGeo, baseMat);
    pillar.position.y = 3.5;
    pillar.castShadow = true;
    monument.add(pillar);

    const topGeo = new THREE.SphereGeometry(1, 8, 8);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 6.5;
    monument.add(top);

    return monument;
  }

  private createTemple(): THREE.Group {
    const temple = new THREE.Group();

    // Steps
    for (let i = 0; i < 3; i++) {
      const stepGeo = new THREE.BoxGeometry(6 - i, 0.3, 6 - i);
      const stepMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.y = i * 0.3;
      temple.add(step);
    }

    // Main building
    const buildingGeo = new THREE.BoxGeometry(4, 3, 4);
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.y = 1.8;
    building.castShadow = true;
    temple.add(building);

    // Roof
    const roofGeo = new THREE.ConeGeometry(3.5, 2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    temple.add(roof);

    return temple;
  }

  /**
   * Cleans up all environment objects.
   */
  dispose(): void {
    for (const obj of this.objects) {
      this.scene.remove(obj);
    }
    this.objects = [];
  }
}
