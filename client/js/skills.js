export class SkillSystem {
    constructor(scene, playerMesh) {
        this.scene = scene;
        this.playerMesh = playerMesh;
        this.projectiles = [];
    }

    castSkill(key) {
        console.log("Casting Skill: " + key);

        const origin = this.playerMesh.position.clone();
        origin.y += 1;

        let color = 0xffffff;
        let size = 1;

        switch (key.toLowerCase()) {
            case 'z': // Basic Blast
                color = 0xff0000;
                this.createProjectile(origin, color, 1);
                break;
            case 'x': // Ice Spikes
                color = 0x00ffff;
                this.createGroundSpikes(origin, color);
                break;
            case 'c': // Bomb
                color = 0x333333;
                this.createProjectile(origin, color, 3); // Big slow bomb
                break;
            case 'v': // Heal / Buff
                this.createAura(origin, 0x00ff00);
                break;
            case 'f': // Flight / Dash (handled by script.js movement, but visual here)
                this.createTrail(origin);
                break;
        }
    }

    createProjectile(origin, color, scale) {
        const geo = new THREE.SphereGeometry(0.5 * scale);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(origin);

        // Direction
        const forward = new THREE.Vector3(0, 0, -1);
        // If player has rotation, apply it. script.js movement doesn't rotate mesh Y yet perfectly.
        // assuming standard forward is -Z

        mesh.userData = { velocity: new THREE.Vector3(0, 0, -40), life: 2.0 };
        this.scene.add(mesh);
        this.projectiles.push(mesh);
    }

    createGroundSpikes(origin, color) {
        for (let i = 1; i < 5; i++) {
            setTimeout(() => {
                const geo = new THREE.ConeGeometry(1, 3, 8);
                const mat = new THREE.MeshLambertMaterial({ color: color });
                const spike = new THREE.Mesh(geo, mat);
                spike.position.set(origin.x, 1.5, origin.z - (i * 3));
                this.scene.add(spike);

                // Remove later
                setTimeout(() => this.scene.remove(spike), 1000);
            }, i * 100);
        }
    }

    createAura(origin, color) {
        const geo = new THREE.RingGeometry(1, 1.2, 32);
        const mat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(origin);
        mesh.position.y = 0.5; // Floor

        this.scene.add(mesh);

        // Animate up
        let frame = 0;
        const interval = setInterval(() => {
            mesh.position.y += 0.1;
            mesh.material.opacity -= 0.05;
            if (frame++ > 20) {
                clearInterval(interval);
                this.scene.remove(mesh);
            }
        }, 50);
    }

    createTrail(origin) {
        // Use SpeedR Ghost FX
        if (window.SpeedR && window.SpeedR.FX) {
            window.SpeedR.FX.createGhost(this.scene, this.playerMesh, 0.5);
        } else {
            console.warn("SpeedR FX not found");
        }
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.position.addScaledVector(p.userData.velocity, deltaTime);
            p.userData.life -= deltaTime;

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.projectiles.splice(i, 1);
            }
        }
    }
}
