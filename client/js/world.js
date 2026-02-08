import { ModelFactory } from "./models.js?v=2";
export class WorldManager {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
    }

    generateWorld() {
        // Jungle Island
        this.createIsland(-50, -50, 0x228B22, "Jungle");
        // Snow Island
        this.createIsland(50, 50, 0xffffff, "Snow");
    }

    createIsland(x, z, color, type) {
        // Base
        const islandGeo = new THREE.CylinderGeometry(20, 20, 2, 16);
        const islandMat = new THREE.MeshLambertMaterial({ color: 0xc2b280 }); // Sand base
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set(x, 1, z);
        island.receiveShadow = true;
        this.scene.add(island);
        if (this.physics) this.physics.addGround(island); // Register Base

        // Top
        const grassGeo = new THREE.CylinderGeometry(20, 20, 0.5, 16);
        const grassMat = new THREE.MeshLambertMaterial({ color: color });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.position.set(x, 2.1, z);
        grass.receiveShadow = true;
        this.scene.add(grass);
        if (this.physics) this.physics.addGround(grass); // Register Top

        // Props
        if (type === "Jungle") {
            // Trees
            for (let i = 0; i < 12; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 15; // Within 15 units radius
                const tx = x + Math.cos(angle) * radius;
                const tz = z + Math.sin(angle) * radius;

                const tree = ModelFactory.createProceduralTree(tx, tz);
                this.scene.add(tree);

                // Track for Fruit Spawner
                if (!this.treePositions) this.treePositions = [];
                this.treePositions.push({ x: tx, z: tz });

                // Add collision if desired, or simplified trunk collision?
                // For now, visual only to avoid physics complexity overhead unless requested.
            }
        } else if (type === "Snow") {
            // Ice Spikes
            for (let i = 0; i < 8; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(1, 4), new THREE.MeshLambertMaterial({ color: 0xa5f2f3 }));
                spike.position.set(x + (Math.random() * 20 - 10), 2.2 + 2, z + (Math.random() * 20 - 10));
                this.scene.add(spike);
            }
        }
    }
}
