import * as THREE from 'three';
import { Entity } from '../core/Entity';
import { Transform3D } from '../components/Transform3D';
import { MeshRenderer } from '../components/MeshRenderer';
import { LODSystem, createBuildingLOD } from './LODSystem';

/**
 * Zambian-themed environment generator.
 * Creates villages, streets, and landscapes inspired by Zambia.
 */
export class ZambianEnvironment {
  private scene: THREE.Scene;
  private lodSystem: LODSystem;
  private entities: Entity[] = [];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.lodSystem = new LODSystem(camera);
  }

  /**
   * Generates a complete Zambian village environment.
   */
  generateVillage(): void {
    // Create village ground
    this.createVillageGround();

    // Create traditional huts
    this.createHut(new THREE.Vector3(0, 0, 0));
    this.createHut(new THREE.Vector3(8, 0, 5));
    this.createHut(new THREE.Vector3(-8, 0, 5));
    this.createHut(new THREE.Vector3(5, 0, -8));
    this.createHut(new THREE.Vector3(-5, 0, -8));

    // Create communal area
    this.createCommunalArea(new THREE.Vector3(0, 0, 15));

    // Create pathways
    this.createPathways();

    // Create vegetation
    this.createVegetation();

    // Create baobab trees (iconic African trees) - reduced count
    this.createBaobabTree(new THREE.Vector3(20, 0, 20));
    this.createBaobabTree(new THREE.Vector3(-20, 0, 20));
  }

  /**
   * Creates village ground with African savanna coloring.
   */
  private createVillageGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    
    // Add some terrain variation
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
      positions.setZ(i, z);
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshToonMaterial({
      color: 0xc2b280, // Savanna sand color
      side: THREE.DoubleSide
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    (ground as any).userData = { isEnvironment: true };
    this.scene.add(ground);
  }

  /**
   * Creates a traditional Zambian hut with LOD support.
   */
  private createHut(position: THREE.Vector3): void {
    const hutGroup = new THREE.Group();
    (hutGroup as any).userData = { isEnvironment: true };
    hutGroup.position.copy(position);

    // High detail hut (position is relative to parent group)
    const highDetailHut = this.createHutMesh(true);
    
    // Medium detail hut (simplified)
    const mediumDetailHut = this.createHutMesh(false);
    
    // Register with LOD system
    const lodLevels = createBuildingLOD(
      highDetailHut,
      mediumDetailHut,
      null, // No low detail for now
      30,
      60
    );
    
    this.lodSystem.registerLOD(hutGroup, lodLevels);
    this.scene.add(hutGroup);
  }

  /**
   * Creates a hut mesh with specified detail level.
   */
  private createHutMesh(highDetail: boolean): THREE.Group {
    const hutGroup = new THREE.Group();
    const segments = highDetail ? 16 : 8;

    // Hut base (cylindrical walls)
    const wallGeometry = new THREE.CylinderGeometry(3, 3, 2.5, segments);
    const wallMaterial = new THREE.MeshToonMaterial({
      color: 0x8b4513, // Brown clay
    });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 1.25;
    walls.castShadow = true;
    walls.receiveShadow = true;
    hutGroup.add(walls);

    // Conical thatched roof
    const roofGeometry = new THREE.ConeGeometry(4, 2, segments);
    const roofMaterial = new THREE.MeshToonMaterial({
      color: 0xd2691e, // Thatch color
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.5;
    roof.castShadow = true;
    hutGroup.add(roof);

    // Doorway (only in high detail)
    if (highDetail) {
      const doorGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
      const doorMaterial = new THREE.MeshToonMaterial({
        color: 0x4a3728,
      });
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(0, 0.75, 2.9);
      hutGroup.add(door);
    }

    return hutGroup;
  }

  /**
   * Creates a communal gathering area.
   */
  private createCommunalArea(position: THREE.Vector3): void {
    const areaGroup = new THREE.Group();
    (areaGroup as any).userData = { isEnvironment: true };
    areaGroup.position.copy(position);

    // Fire pit
    const pitGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16);
    const pitMaterial = new THREE.MeshToonMaterial({
      color: 0x3d2817,
    });
    const pit = new THREE.Mesh(pitGeometry, pitMaterial);
    pit.position.y = 0.15;
    areaGroup.add(pit);

    // Seating stones
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const stoneGeometry = new THREE.DodecahedronGeometry(0.4);
      const stoneMaterial = new THREE.MeshToonMaterial({
        color: 0x808080,
      });
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(
        Math.cos(angle) * 2.5,
        0.3,
        Math.sin(angle) * 2.5
      );
      stone.castShadow = true;
      areaGroup.add(stone);
    }

    this.scene.add(areaGroup);
  }

  /**
   * Creates dirt pathways between structures.
   */
  private createPathways(): void {
    const pathMaterial = new THREE.MeshToonMaterial({
      color: 0x8b7355,
    });

    // Main path through village
    const pathGeometry = new THREE.PlaneGeometry(3, 50);
    const mainPath = new THREE.Mesh(pathGeometry, pathMaterial);
    mainPath.rotation.x = -Math.PI / 2;
    mainPath.position.set(0, 0.05, 0);
    (mainPath as any).userData = { isEnvironment: true };
    this.scene.add(mainPath);

    // Cross path
    const crossPathGeometry = new THREE.PlaneGeometry(50, 3);
    const crossPath = new THREE.Mesh(crossPathGeometry, pathMaterial);
    crossPath.rotation.x = -Math.PI / 2;
    crossPath.position.set(0, 0.05, 0);
    (crossPath as any).userData = { isEnvironment: true };
    this.scene.add(crossPath);
  }

  /**
   * Creates African vegetation (acacia trees, grass).
   */
  private createVegetation(): void {
    // Create grass patches (reduced count)
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      
      // Avoid placing on paths
      if (Math.abs(x) < 2 || Math.abs(z) < 2) continue;

      this.createGrassPatch(new THREE.Vector3(x, 0, z));
    }

    // Create acacia trees (reduced count)
    const acaciaPositions = [
      new THREE.Vector3(15, 0, 10),
      new THREE.Vector3(-15, 0, 10),
    ];

    for (const pos of acaciaPositions) {
      this.createAcaciaTree(pos);
    }
  }

  /**
   * Creates a grass patch.
   */
  private createGrassPatch(position: THREE.Vector3): void {
    const grassGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
    const grassMaterial = new THREE.MeshToonMaterial({
      color: 0x90ee90,
    });

    for (let i = 0; i < 5; i++) {
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.set(
        position.x + (Math.random() - 0.5) * 1,
        0.25,
        position.z + (Math.random() - 0.5) * 1
      );
      grass.rotation.x = (Math.random() - 0.5) * 0.2;
      grass.rotation.z = (Math.random() - 0.5) * 0.2;
      (grass as any).userData = { isEnvironment: true };
      this.scene.add(grass);
    }
  }

  /**
   * Creates an acacia tree (flat-topped African tree).
   */
  private createAcaciaTree(position: THREE.Vector3): void {
    const treeGroup = new THREE.Group();
    (treeGroup as any).userData = { isEnvironment: true };
    treeGroup.position.copy(position);

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const trunkMaterial = new THREE.MeshToonMaterial({
      color: 0x8b4513,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Flat canopy (acacia style)
    const canopyGeometry = new THREE.CylinderGeometry(3, 3, 1, 16);
    const canopyMaterial = new THREE.MeshToonMaterial({
      color: 0x228b22,
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 4.5;
    canopy.castShadow = true;
    treeGroup.add(canopy);

    this.scene.add(treeGroup);
  }

  /**
   * Creates a baobab tree (iconic African tree).
   */
  private createBaobabTree(position: THREE.Vector3): void {
    const treeGroup = new THREE.Group();
    (treeGroup as any).userData = { isEnvironment: true };
    treeGroup.position.copy(position);

    // Thick trunk (baobabs have massive trunks)
    const trunkGeometry = new THREE.CylinderGeometry(2, 3, 8, 12);
    const trunkMaterial = new THREE.MeshToonMaterial({
      color: 0x8b7355,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 4;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Sparse branches at top
    for (let i = 0; i < 5; i++) {
      const branchGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 6);
      const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
      branch.position.set(
        (Math.random() - 0.5) * 2,
        8,
        (Math.random() - 0.5) * 2
      );
      branch.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.5
      );
      branch.castShadow = true;
      treeGroup.add(branch);
    }

    // Small canopy
    const canopyGeometry = new THREE.SphereGeometry(2.5, 8, 8);
    const canopyMaterial = new THREE.MeshToonMaterial({
      color: 0x2e8b57,
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 9;
    canopy.castShadow = true;
    treeGroup.add(canopy);

    this.scene.add(treeGroup);
  }

  /**
   * Updates the LOD system.
   */
  update(): void {
    this.lodSystem.update();
  }

  /**
   * Cleans up all created entities.
   */
  dispose(): void {
    for (const entity of this.entities) {
      entity.removedFromScene();
    }
    this.entities = [];
    this.lodSystem.clear();
  }
}
