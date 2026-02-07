import { ModelFactory } from './models.js';

export class NPCSystem {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
    }

    setInteractionSystem(system) {
        this.interactionSystem = system;
        // Register existing
        for (const npc of this.npcs) {
            this.registerNPC(npc);
        }
    }

    registerNPC(mesh) {
        if (!this.interactionSystem) return;

        this.interactionSystem.register(mesh, () => {
            alert("Hello! I am " + mesh.userData.name + ". Would you like a quest?");
        }, "Talk to " + mesh.userData.name);
    }

    spawnNPC(name, x, z) {
        // Use Humanoid Model
        const mesh = ModelFactory.createHumanoid(0xffd700); // Gold shirt
        mesh.position.set(x, 0, z); // Factory handles Y offset


        mesh.userData = {
            type: "npc",
            name: name
        };

        this.scene.add(mesh);
        this.npcs.push(mesh);

        this.registerNPC(mesh);

        console.log(`Spawned NPC: ${name} at ${x}, ${z}`);
    }
}
