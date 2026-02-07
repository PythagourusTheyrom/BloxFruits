export class BoatSystem {
    constructor(scene, playerMesh) {
        this.scene = scene;
        this.playerMesh = playerMesh;
        this.boats = [];
        this.drivingBoat = null;

        // Input for ship control
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // Interact to drive
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f') { // F to Drive/Exit
                if (this.drivingBoat) {
                    this.exitBoat();
                } else {
                    this.tryEnterBoat();
                }
            }
        });
    }

    spawnBoat(x, z) {
        const group = new THREE.Group();

        // Hull
        const hullGeo = new THREE.BoxGeometry(4, 1, 8);
        const hullMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // SaddleBrown
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 0.5;
        group.add(hull);

        // Mast
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), new THREE.MeshLambertMaterial({ color: 0xDEB887 }));
        mast.position.y = 3;
        group.add(mast);

        // Sail
        const sail = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        sail.position.y = 4;
        sail.position.z = 0.5;
        group.add(sail);

        group.position.set(x, 0, z);

        // Physics data
        group.userData = {
            velocity: 0,
            turnSpeed: 0
        };

        this.scene.add(group);
        this.boats.push(group);
        console.log("Boat spawned at " + x + ", " + z);
    }

    tryEnterBoat() {
        // Find closest boat
        for (const boat of this.boats) {
            if (this.playerMesh.position.distanceTo(boat.position) < 6) {
                this.drivingBoat = boat;
                // Attach player visually (simplified)
                this.playerMesh.visible = false; // Hide player, assume they are "in" the boat
                // Or attach relative
                console.log("Driving Boat!");
                break;
            }
        }
    }

    exitBoat() {
        if (!this.drivingBoat) return;

        // Restore player
        this.playerMesh.visible = true;
        this.playerMesh.position.copy(this.drivingBoat.position);
        this.playerMesh.position.y = 2.2; // Reset height
        this.playerMesh.position.z += 5; // Hop off back

        this.drivingBoat = null;
        console.log("Exited Boat");
    }

    update(deltaTime) {
        // Cooldown for entry/exit to prevent flickering
        if (this.cooldown > 0) this.cooldown -= deltaTime;

        if (this.drivingBoat) {
            const boat = this.drivingBoat;

            // Boat Controls
            // Rotation
            if (this.keys['a'] || this.keys['A']) boat.rotation.y += 1.5 * deltaTime;
            if (this.keys['d'] || this.keys['D']) boat.rotation.y -= 1.5 * deltaTime;

            // Velocity
            let targetVel = 0;
            if (this.keys['w'] || this.keys['W']) targetVel = 15;
            else if (this.keys['s'] || this.keys['S']) targetVel = -5;

            // Lerp velocity
            boat.userData.velocity += (targetVel - boat.userData.velocity) * 2 * deltaTime;

            // Move
            boat.translateZ(boat.userData.velocity * deltaTime);

            // Sync Player to Boat
            // We need to update player position so camera follows and network syncs
            // Offset player slightly behind mast or at helm
            const offset = new THREE.Vector3(0, 2.0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), boat.rotation.y);
            this.playerMesh.position.copy(boat.position).add(offset);

            // Disable Player Physics while driving (Gravity handled by boat logic)
            // But we need to ensure Boat stays on water
            // Boat Height Logic (Wave effect?)
            const time = Date.now() * 0.001;
            const waveY = Math.sin(time + boat.position.x * 0.1) * 0.2;
            boat.position.y = 0.5 + waveY;
        }
    }
}
