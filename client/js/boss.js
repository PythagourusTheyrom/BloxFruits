import { ModelFactory } from './models.js';

export class BossSystem {
    constructor(scene) {
        this.scene = scene;
        this.bosses = [];
    }

    spawnBoss(type, x, z) {
        let mesh;
        let hp = 1000;
        let name = "Boss";

        if (type === "Gorilla King") {
            mesh = ModelFactory.createGorilla();
            hp = 500;
            name = "Gorilla King";
        } else if (type === "Ice Admiral") {
            mesh = ModelFactory.createAdmiral();
            hp = 2000;
            name = "Ice Admiral";
        } else {
            return;
        }

        mesh.position.set(x, 0, z); // Models handle Y offset internally mostly, but ensure ground
        if (mesh.position.y < 0.1) mesh.position.y = 0; // Integrity check

        mesh.userData = {
            type: "boss",
            name: name,
            hp: hp,
            maxHp: hp
        };

        this.scene.add(mesh);
        this.bosses.push(mesh);

        this.createHealthBar(mesh, name, hp);

        console.log(`Spawned Boss: ${name} at ${x}, ${z}`);
    }

    createHealthBar(mesh, name, hp) {
        // Simple HTML-like billboard or canvas sprite
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = "#333";
        ctx.fillRect(0, 20, 256, 24);

        // HP Fill
        ctx.fillStyle = "#f00";
        ctx.fillRect(2, 22, 252, 20);

        // Text
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${name} [${hp}/${hp}]`, 128, 18);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMat);

        sprite.position.set(0, 3.5, 0); // Above head
        sprite.scale.set(4, 1, 1);

        mesh.add(sprite);
        sprite.raycast = () => { }; // Disable raycasting to prevent crash
        mesh.userData.hpBar = sprite; // Save ref to update later
    }
}
