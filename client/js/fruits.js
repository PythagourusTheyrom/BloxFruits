import { ModelFactory } from './models.js';
import { SpeedR } from './SpeedR.js';

export const FruitsData = {
    // Common
    "Rocket Fruit": { color: 0x888888, ability: "Missile" },
    "Spin Fruit": { color: 0xFFFF00, ability: "Tornado" },
    "Chop Fruit": { color: 0x2244aa, ability: "Split" },
    "Spring Fruit": { color: 0xff69b4, ability: "Jump" },
    "Bomb Fruit": { color: 0x333333, ability: "Explosion" },
    "Smoke Fruit": { color: 0xdddddd, ability: "SmokeCloud" },
    "Spike Fruit": { color: 0x555555, ability: "SpikeBall" },
    "Flame Fruit": { color: 0xff4500, ability: "Fireball" },
    "Falcon Fruit": { color: 0x8B4513, ability: "Flight" },
    "Ice Fruit": { color: 0xa5f2f3, ability: "Freeze" },
    "Sand Fruit": { color: 0xd2b48c, ability: "SandTornado" },
    "Dark Fruit": { color: 0x111111, ability: "BlackHole" },
    "Diamond Fruit": { color: 0x00ffff, ability: "Harden" },
    "Light Fruit": { color: 0xffffaa, ability: "LightSpeed" },
    "Love Fruit": { color: 0xff1493, ability: "Charm" },
    "Rubber Fruit": { color: 0xFF4500, ability: "Pistol" },
    "Barrier Fruit": { color: 0x00ff00, ability: "Wall" },
    "Magma Fruit": { color: 0x8b0000, ability: "MagmaFist" },
    "Quake Fruit": { color: 0xffffff, ability: "Tsunami" },
    "Buddha Fruit": { color: 0xffd700, ability: "Transform" },
    "String Fruit": { color: 0xffffff, ability: "Parasite" },
    "Phoenix Fruit": { color: 0x0000ff, ability: "Heal" },
    "Rumble Fruit": { color: 0x00ffff, ability: "Thunder" },
    "Paw Fruit": { color: 0xffb6c1, ability: "Repel" },
    "Gravity Fruit": { color: 0x800080, ability: "Meteor" },
    "Dough Fruit": { color: 0xf5deb3, ability: "Donut" },
    "Shadow Fruit": { color: 0x000000, ability: "Nightmare" },
    "Venom Fruit": { color: 0x800000, ability: "Poison" },
    "Control Fruit": { color: 0x87ceeb, ability: "Room" },
    "Dragon Fruit": { color: 0xFF00FF, ability: "Dragon Breath" },
    "Leopard Fruit": { color: 0xffff00, ability: "Transform" }
};

export class FruitSystem {
    constructor(scene) {
        this.scene = scene;
        this.spawnedFruits = [];
        this.projectiles = [];
    }

    spawnFruit(type, x, z) {
        // Create 3D Model
        const mesh = ModelFactory.createFruit(type);
        if (!mesh) return;

        mesh.position.set(x, 1, z); // Float above ground

        // Add idle animation
        // We can attach update function to userdata or manage list
        this.scene.add(mesh);

        this.spawnedFruits.push({
            mesh: mesh,
            type: type,
            update: (dt) => {
                mesh.rotation.y += dt; // Spin
                mesh.position.y = 1 + Math.sin(Date.now() * 0.002) * 0.2; // Float
            }
        });

        console.log(`Spawned ${type} at ${x}, ${z}`);
    }

    spawnRandomFruit(locations) {
        if (!locations || locations.length === 0) return;

        // 1. Pick Random Location
        const loc = locations[Math.floor(Math.random() * locations.length)];

        // 2. Pick Random Fruit Type
        const keys = Object.keys(FruitsData);
        const type = keys[Math.floor(Math.random() * keys.length)];

        // 3. Spawn (with slight offset)
        const offsetX = (Math.random() - 0.5) * 5;
        const offsetZ = (Math.random() - 0.5) * 5;

        this.spawnFruit(type, loc.x + offsetX, loc.z + offsetZ);
    }

    updateFruits(dt) {
        this.spawnedFruits.forEach(f => {
            if (f.update) f.update(dt);
        });
    }

    useAbility(playerMesh, fruitName, key) {
        console.log(`Using ${fruitName} ability: ${key}`);

        if (fruitName === "Flame Fruit" && key === "Z") {
            this.castFireball(playerMesh);
        } else if (fruitName === "Flame Fruit" && key === "X") {
            this.castFlamePillar(playerMesh);
        } else if (fruitName === "Ice Fruit" && key === "Z") {
            this.castIceShards(playerMesh);
        } else if (fruitName === "Ice Fruit" && key === "X") {
            this.castIceSurge(playerMesh);
        } else if (fruitName === "Light Fruit" && key === "Z") {
            this.castLightSpeed(playerMesh);
        } else if (fruitName === "Buddha Fruit" && key === "Z") {
            this.transformBuddha(playerMesh);
        } else if (fruitName === "Buddha Fruit" && key === "Z") {
            this.transformBuddha(playerMesh);
        } else if (fruitName === "Barrier Fruit" && key === "Z") {
            this.castBarrier(playerMesh);
        } else if (fruitName === "Love Fruit" && key === "Z") {
            this.castLoveBeam(playerMesh);
        } else if (fruitName === "Magma Fruit" && key === "Z") {
            this.castMagmaRain(playerMesh);
        } else if (fruitName === "Control Fruit" && key === "Z") {
            this.castRoom(playerMesh);
        } else if (fruitName === "Spin Fruit" && key === "Z") {
            this.castTornado(playerMesh);
        } else if (fruitName === "Dragon Fruit" && key === "Z") {
            this.castDragonBreath(playerMesh);
        } else if (fruitName === "Leopard Fruit" && key === "Z") {
            this.transformLeopard(playerMesh);
        } else if (fruitName === "Venom Fruit" && key === "Z") {
            this.castPoisonDaggers(playerMesh);
        } else if (fruitName === "Venom Fruit" && key === "X") {
            this.transformVenom(playerMesh);
        } else if (fruitName === "Dough Fruit" && key === "Z") {
            this.castMochiPunch(playerMesh);
        } else if (fruitName === "Dough Fruit" && key === "X") {
            this.transformDonut(playerMesh);
        } else if (fruitName === "Shadow Fruit" && key === "Z") {
            this.castShadowBall(playerMesh);
        } else if (fruitName === "Shadow Fruit" && key === "X") {
            this.castShadowEruption(playerMesh);
        } else if (fruitName === "Soul Fruit" && key === "Z") {
            this.castSoulBeam(playerMesh);
        } else if (fruitName === "Soul Fruit" && key === "X") {
            this.castSoulSnatch(playerMesh);
        } else if (fruitName === "Spirit Fruit" && key === "Z") {
            this.castSpiritBarrage(playerMesh);
        } else if (fruitName === "Spirit Fruit" && key === "X") {
            this.castSpiritWrath(playerMesh);
        } else if (fruitName === "Portal Fruit" && key === "Z") {
            this.castPortalDash(playerMesh);
        } else if (fruitName === "Portal Fruit" && key === "X") {
            this.castBanishment(playerMesh);
        } else if (fruitName === "Blizzard Fruit" && key === "Z") {
            this.castSnowflake(playerMesh);
        } else if (fruitName === "Blizzard Fruit" && key === "X") {
            this.castBlizzardDomain(playerMesh);
        } else if (fruitName === "Sound Fruit" && key === "Z") {
            this.castSoundBlast(playerMesh);
        } else if (fruitName === "Sound Fruit" && key === "X") {
            this.castSymphony(playerMesh);
        } else if (fruitName === "Pain Fruit" && key === "Z") {
            this.castPawShot(playerMesh);
        } else if (fruitName === "Pain Fruit" && key === "X") {
            this.castPainRepel(playerMesh);
        } else if (fruitName === "Mammoth Fruit" && key === "Z") {
            this.transformMammoth(playerMesh);
        } else if (fruitName === "Mammoth Fruit" && key === "X") {
            this.castAncientRoar(playerMesh);
        } else if (fruitName === "T-Rex Fruit" && key === "Z") {
            this.transformTRex(playerMesh);
        } else if (fruitName === "T-Rex Fruit" && key === "X") {
            this.castTailSwipe(playerMesh);
        } else if (fruitName === "Kitsune Fruit" && key === "Z") {
            this.castFoxFire(playerMesh);
        } else if (fruitName === "Kitsune Fruit" && key === "X") {
            this.transformKitsune(playerMesh);
        } else if (fruitName === "Gas Fruit" && key === "Z") {
            this.castGasZone(playerMesh);
        } else if (fruitName === "Gas Fruit" && key === "X") {
            this.castGasBlast(playerMesh);
        } else if (fruitName === "Rocket Fruit" && key === "Z") {
            this.castMissile(playerMesh);
        } else if (fruitName === "Rocket Fruit" && key === "X") {
            this.castRocketCrash(playerMesh);
        } else if (fruitName === "Spin Fruit" && key === "Z") {
            this.castRazorWind(playerMesh);
        } else if (fruitName === "Spin Fruit" && key === "X") {
            this.castTornadoSpin(playerMesh);
        } else if (fruitName === "Chop Fruit" && key === "Z") {
            this.castChopPunch(playerMesh);
        } else if (fruitName === "Chop Fruit" && key === "X") {
            this.castChopFestival(playerMesh);
        } else if (fruitName === "Spring Fruit" && key === "Z") {
            this.castSpringSnipe(playerMesh);
        } else if (fruitName === "Spring Fruit" && key === "X") {
            this.castSpringLeap(playerMesh);
        } else if (fruitName === "Bomb Fruit" && key === "Z") {
            this.castBombShot(playerMesh);
        } else if (fruitName === "Bomb Fruit" && key === "X") {
            this.castSelfDestruct(playerMesh);
        } else if (fruitName === "Smoke Fruit" && key === "Z") {
            this.castSmokeBomber(playerMesh);
        } else if (fruitName === "Smoke Fruit" && key === "X") {
            this.castSmokeTornado(playerMesh);
        } else if (fruitName === "Spike Fruit" && key === "Z") {
            this.castSpikeShot(playerMesh);
        } else if (fruitName === "Spike Fruit" && key === "X") {
            this.castSpikeField(playerMesh);
        } else if (fruitName === "Flame Fruit" && key === "Z") {
            this.castFireBullet(playerMesh);
        } else if (fruitName === "Flame Fruit" && key === "X") {
            this.castFirePillar(playerMesh);
        } else if (fruitName === "Falcon Fruit" && key === "Z") {
            this.castTalonRush(playerMesh);
        } else if (fruitName === "Falcon Fruit" && key === "X") {
            this.transformFalcon(playerMesh);
        } else if (fruitName === "Ice Fruit" && key === "Z") {
            this.castIceSpear(playerMesh);
        } else if (fruitName === "Ice Fruit" && key === "X") {
            this.castIceSurge(playerMesh);
        } else if (fruitName === "Ice Fruit" && key === "V") {
            this.castIceAge(playerMesh);
        } else if (fruitName === "Sand Fruit" && key === "Z") {
            this.castDesertSword(playerMesh);
        } else if (fruitName === "Sand Fruit" && key === "X") {
            this.castSandTornado(playerMesh);
        } else if (fruitName === "Dark Fruit" && key === "Z") {
            this.castBlackHole(playerMesh);
        } else if (fruitName === "Dark Fruit" && key === "X") {
            this.castDarkBomb(playerMesh);
        } else if (fruitName === "Diamond Fruit" && key === "Z") {
            this.castDiamondBody(playerMesh);
        } else if (fruitName === "Diamond Fruit" && key === "X") {
            this.castDiamondBolt(playerMesh);
        } else if (fruitName === "Light Fruit" && key === "Z") {
            this.castLightBeam(playerMesh);
        } else if (fruitName === "Light Fruit" && key === "X") {
            this.castLightFlight(playerMesh);
        } else if (fruitName === "Love Fruit" && key === "Z") {
            this.castMellowShot(playerMesh);
        } else if (fruitName === "Love Fruit" && key === "X") {
            this.castLoveZone(playerMesh);
        } else if (fruitName === "Rubber Fruit" && key === "Z") {
            this.castRubberPistol(playerMesh);
        } else if (fruitName === "Rubber Fruit" && key === "X") {
            this.castGearSecond(playerMesh);
        }
    }

    castFlamePillar(playerMesh) {
        // Rising cylinder of fire
        const geo = new SpeedR.CylinderGeometry(2, 2, 8, 16, 1, true);
        const mat = new SpeedR.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8, side: 2 }); // side 2 = DoubleSide
        const pillar = new SpeedR.Mesh(geo, mat);

        // Position in front of player
        const offset = new SpeedR.Vector3(0, 0, -5).applyQuaternion(playerMesh.quaternion);
        pillar.position.copy(playerMesh.position).add(offset);
        pillar.position.y += 2;

        this.scene.add(pillar);

        // Animate (Rise and fade)
        this.projectiles.push({
            mesh: pillar,
            velocity: new SpeedR.Vector3(0, 2, 0), // Rise up
            life: 1.0,
            update: (dt) => {
                pillar.scale.x += dt * 2;
                pillar.scale.z += dt * 2;
                pillar.material.opacity -= dt;

                // Emit particles if scene has system
                if (this.scene.particleSystem) {
                    this.scene.particleSystem.emit(pillar.position, 2, 0xff4500);
                }
            }
        });
    }

    castFireball(playerMesh) {
        const sphere = new SpeedR.Mesh(
            new SpeedR.SphereGeometry(1, 16, 16),
            new SpeedR.MeshBasicMaterial({ color: 0xff4500 })
        );
        sphere.position.copy(playerMesh.position);
        sphere.position.y += 1.5;

        // Direction
        const dir = new SpeedR.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);

        this.scene.add(sphere);
        this.projectiles.push({
            mesh: sphere,
            velocity: dir.multiplyScalar(30),
            life: 2.0,
            abilityName: "Fireball",
            update: (dt) => {
                if (this.scene.particleSystem) {
                    this.scene.particleSystem.emit(sphere.position, 1, 0xffaa00);
                }
            }
        });
    }

    castTornado(playerMesh) {
        // Create a spinning cylinder
        const geo = new THREE.CylinderGeometry(2, 0.5, 5, 8, 1, true);
        const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, wireframe: true, transparent: true, opacity: 0.5 });
        const tornado = new THREE.Mesh(geo, mat);

        tornado.position.copy(playerMesh.position);
        tornado.position.add(new THREE.Vector3(0, 0, -5).applyQuaternion(playerMesh.quaternion));

        this.scene.add(tornado);

        this.projectiles.push({
            mesh: tornado,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 3.0,
            abilityName: "Tornado",
            update: (dt) => { tornado.rotation.y += 10 * dt; }
        });
    }

    castDragonBreath(playerMesh) {
        // Cone of fire
        const count = 10;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xFF00FF }));
                p.position.copy(playerMesh.position);
                p.position.y += 2;

                const dir = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.2,
                    -1
                ).applyQuaternion(playerMesh.quaternion).normalize();

                this.scene.add(p);
                this.projectiles.push({ mesh: p, velocity: dir.multiplyScalar(20), life: 1.0, abilityName: "DragonBreath" });
            }, i * 50);
        }
    }

    transformLeopard(playerMesh) {
        // Toggle Leopard Form
        if (playerMesh.userData.isLeopard) {
            // Revert
            playerMesh.userData.isLeopard = false;
            playerMesh.scale.set(1, 1, 1);
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);

            // Remove speed boost marker
            playerMesh.userData.speedBonus = 0;

        } else {
            // Transform
            playerMesh.userData.isLeopard = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();

            // Visuals: Yellow + Scale
            playerMesh.scale.set(1.2, 1.2, 1.2);
            playerMesh.material.color.setHex(0xffff00); // Yellow

            // Speed Boost
            playerMesh.userData.speedBonus = 10; // +10 Speed

            // Effect
            const roar = new THREE.Mesh(
                new THREE.RingGeometry(1, 4, 32),
                new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
            );
            roar.rotation.x = -Math.PI / 2;
            roar.position.copy(playerMesh.position);
            this.scene.add(roar);

            // Expand Ring
            this.projectiles.push({
                mesh: roar,
                life: 0.5,
                velocity: new THREE.Vector3(0, 0, 0),
                update: (dt) => {
                    roar.scale.x += dt * 5;
                    roar.scale.y += dt * 5;
                    roar.material.opacity -= dt * 2;
                }
            });
        }
    }

    castPoisonDaggers(playerMesh) {
        // Shoot 3 Poison Projectiles
        for (let i = -1; i <= 1; i++) {
            const dagger = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 2, 4),
                new THREE.MeshBasicMaterial({ color: 0x800080 })
            );
            dagger.rotation.x = -Math.PI / 2;

            // Position
            dagger.position.copy(playerMesh.position);
            dagger.position.y += 1.5;

            // Direction with spread
            const spreadAngle = i * 0.2; // Radians
            const baseDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);
            const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);

            this.scene.add(dagger);
            this.projectiles.push({
                mesh: dagger,
                velocity: dir.multiplyScalar(40),
                life: 1.5,
                abilityName: "PoisonDagger"
            });
        }
    }

    transformVenom(playerMesh) {
        // Toggle Venom Demon Logic
        if (playerMesh.userData.isVenom) {
            // Revert
            playerMesh.userData.isVenom = false;
            playerMesh.scale.set(1, 1, 1);
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);

        } else {
            // Transform
            playerMesh.userData.isVenom = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();

            // Visuals: Purple + Size
            playerMesh.scale.set(1.3, 1.3, 1.3);
            playerMesh.material.color.setHex(0x800080); // Purple

            // Fog/Gas Effect (Simple ring for now)
            const fog = new THREE.Mesh(
                new THREE.TorusGeometry(3, 1, 16, 100),
                new THREE.MeshBasicMaterial({ color: 0x9932CC, transparent: true, opacity: 0.4 })
            );
            fog.rotation.x = Math.PI / 2;
            fog.position.copy(playerMesh.position);
            this.scene.add(fog);

            this.projectiles.push({
                mesh: fog,
                life: 1.0,
                velocity: new THREE.Vector3(0, 1, 0),
                update: (dt) => {
                    fog.scale.x += dt;
                    fog.scale.y += dt;
                    fog.material.opacity -= dt;
                }
            });
        }
    }

    castMochiPunch(playerMesh) {
        // Giant Fist
        const container = new THREE.Group();

        const armGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
        const fistGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xF5DEB3 }); // Wheat/Dough color

        const arm = new THREE.Mesh(armGeo, mat);
        arm.rotation.x = -Math.PI / 2;
        arm.position.z = -2; // Offset

        const fist = new THREE.Mesh(fistGeo, mat);
        fist.position.z = -4;

        container.add(arm);
        container.add(fist);

        // Position at player
        container.position.copy(playerMesh.position);
        container.position.y += 1.5;
        container.quaternion.copy(playerMesh.quaternion);

        this.scene.add(container);

        this.projectiles.push({
            mesh: container,
            velocity: new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(25),
            life: 1.0,
            abilityName: "MochiPunch"
        });
    }

    transformDonut(playerMesh) {
        if (playerMesh.userData.isDonut) {
            // Revert
            playerMesh.userData.isDonut = false;
            playerMesh.visible = true; // Show player
            // Find and remove donut mesh if attached? 
            // Better to just store it in userData
            if (playerMesh.userData.donutMesh) {
                this.scene.remove(playerMesh.userData.donutMesh);
                playerMesh.userData.donutMesh = null;
            }
            playerMesh.userData.speedBonus = 0;

        } else {
            // Transform
            playerMesh.userData.isDonut = true;
            playerMesh.visible = false; // Hide player model

            // Create Donut
            const donut = new THREE.Mesh(
                new THREE.TorusGeometry(1.5, 0.6, 16, 32),
                new THREE.MeshBasicMaterial({ color: 0xF5DEB3, side: THREE.DoubleSide }) // Dough color
            );
            // Spikes (simple cones)
            for (let i = 0; i < 8; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1, 8), new THREE.MeshBasicMaterial({ color: 0x333333 }));
                const angle = (i / 8) * Math.PI * 2;
                spike.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
                spike.rotation.z = angle - Math.PI / 2;
                donut.add(spike);
            }

            donut.position.copy(playerMesh.position);
            donut.position.y = 1.0; // On ground
            donut.rotation.x = -Math.PI / 2; // Flat initially? No, rolling wheel.
            // Actually usually it's a wheel rolling vertically or flat?
            // Let's make it vertical wheel rolling forward.
            donut.rotation.y = playerMesh.rotation.y;

            this.scene.add(donut);
            playerMesh.userData.donutMesh = donut;

            // Speed
            playerMesh.userData.speedBonus = 15; // Fast!

            // Update Donut Position locally?
            // Use update loop to sync donut to player
            this.projectiles.push({
                mesh: donut,
                life: 9999, // Persistent until toggle
                isDonuter: true, // Special flag
                owner: playerMesh,
                update: (dt) => {
                    if (!playerMesh.userData.isDonut) {
                        return; // Should be cleaned up by toggle logic, but just in case
                    }
                    // Sync pos
                    donut.position.copy(playerMesh.position);
                    donut.position.y = 1.5;
                    donut.rotation.y = playerMesh.rotation.y; // Face direction

                    // Spin animation
                    donut.rotation.x += dt * 10;
                }
            });
        }
    }

    castShadowBall(playerMesh) {
        // Black Sphere
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        sphere.position.copy(playerMesh.position);
        sphere.position.y += 1.5;

        // Trail
        const trail = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x4B0082, transparent: true, opacity: 0.3, wireframe: true })
        );
        sphere.add(trail);

        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);

        this.scene.add(sphere);
        this.projectiles.push({ mesh: sphere, velocity: dir.multiplyScalar(25), life: 2.0, abilityName: "ShadowBall" });
    }

    castShadowEruption(playerMesh) {
        // Expanding black cylinder
        const geo = new THREE.CylinderGeometry(1, 1, 1, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8 });
        const eruption = new THREE.Mesh(geo, mat);

        eruption.position.copy(playerMesh.position);
        this.scene.add(eruption);

        // Animate
        this.projectiles.push({
            mesh: eruption,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            abilityName: "ShadowEruption",
            update: (dt) => {
                eruption.scale.x += dt * 10;
                eruption.scale.z += dt * 10;
                eruption.scale.y += dt * 5;
                eruption.material.opacity -= dt;
            }
        });
    }

    castSoulBeam(playerMesh) {
        // Multi-colored Beam (Cyan/Pink)
        const beamGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        beamGeo.translate(0, 2.5, 0); // Pivot at base
        beamGeo.rotateX(-Math.PI / 2); // Point forward

        const mat = new THREE.MeshBasicMaterial({ color: 0x00FFFF }); // Cyan base
        const beam = new THREE.Mesh(beamGeo, mat);

        // Inner core
        const core = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 5, 8),
            new THREE.MeshBasicMaterial({ color: 0xFF69B4 }) // Pink core
        );
        core.geometry.translate(0, 2.5, 0);
        core.geometry.rotateX(-Math.PI / 2);
        beam.add(core);

        beam.position.copy(playerMesh.position);
        beam.position.y += 1.5;
        beam.quaternion.copy(playerMesh.quaternion);

        this.scene.add(beam);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(40);
        this.projectiles.push({ mesh: beam, velocity: velocity, life: 1.5, abilityName: "SoulBeam" });
    }

    castSoulSnatch(playerMesh) {
        // Area Drain Visuals
        const particles = new THREE.Group();
        const count = 10;

        for (let i = 0; i < count; i++) {
            const part = new THREE.Mesh(
                new THREE.SphereGeometry(0.3),
                new THREE.MeshBasicMaterial({ color: 0x00FFFF })
            );
            // Random pos around player
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 2;
            part.position.set(Math.cos(angle) * dist, 1 + Math.random(), Math.sin(angle) * dist);
            particles.add(part);
        }

        particles.position.copy(playerMesh.position);
        this.scene.add(particles);

        this.projectiles.push({
            mesh: particles,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 2.0,
            abilityName: "SoulSnatch",
            update: (dt) => {
                // Move particles to center
                particles.children.forEach(p => {
                    p.position.lerp(new THREE.Vector3(0, 1, 0), dt * 2);
                });
            }
        });
    }

    castSpiritBarrage(playerMesh) {
        // Fire/Ice Barrage
        const count = 6;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const isIce = i % 2 === 0;
                const color = isIce ? 0x00FFFF : 0xFF4500;

                const spirit = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.5),
                    new THREE.MeshBasicMaterial({ color: color })
                );

                // Position with slight randomness
                spirit.position.copy(playerMesh.position);
                spirit.position.y += 2 + (Math.random() - 0.5);
                spirit.position.add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, 0).applyQuaternion(playerMesh.quaternion));

                const dir = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2, // Spread
                    (Math.random() - 0.5) * 0.2,
                    -1
                ).applyQuaternion(playerMesh.quaternion).normalize();

                this.scene.add(spirit);
                this.projectiles.push({
                    mesh: spirit,
                    velocity: dir.multiplyScalar(30),
                    life: 1.5,
                    abilityName: "SpiritBarrage"
                });
            }, i * 150);
        }
    }

    castSpiritWrath(playerMesh) {
        // Dual Explosion
        const iceExplosion = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x00FFFF, transparent: true, opacity: 0.6 })
        );
        const fireExplosion = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF4500, transparent: true, opacity: 0.6 })
        );

        iceExplosion.position.copy(playerMesh.position);
        fireExplosion.position.copy(playerMesh.position);

        this.scene.add(iceExplosion);
        this.scene.add(fireExplosion);

        // Animate
        this.projectiles.push({
            mesh: iceExplosion,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            update: (dt) => {
                iceExplosion.scale.setScalar(iceExplosion.scale.x + dt * 10);
                iceExplosion.rotation.y += dt;
                iceExplosion.material.opacity -= dt;
            }
        });
        this.projectiles.push({
            mesh: fireExplosion,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            update: (dt) => {
                fireExplosion.scale.setScalar(fireExplosion.scale.x + dt * 8); // Slightly different rate
                fireExplosion.rotation.z -= dt;
                fireExplosion.material.opacity -= dt;
            }
        });
    }

    castPortalDash(playerMesh) {
        // Teleport Forward
        // Entry Portal
        const entry = new THREE.Mesh(
            new THREE.RingGeometry(1, 1.5, 32),
            new THREE.MeshBasicMaterial({ color: 0x00FF00, side: THREE.DoubleSide })
        );
        entry.position.copy(playerMesh.position);
        entry.position.y += 1;
        entry.quaternion.copy(playerMesh.quaternion);
        this.scene.add(entry);

        // Calculate destination
        const dist = 15;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);
        const dest = playerMesh.position.clone().add(forward.multiplyScalar(dist));

        // Move Player
        playerMesh.position.copy(dest);

        // Exit Portal
        const exit = new THREE.Mesh(
            new THREE.RingGeometry(1, 1.5, 32),
            new THREE.MeshBasicMaterial({ color: 0x00FF00, side: THREE.DoubleSide })
        );
        exit.position.copy(dest);
        exit.position.y += 1;
        exit.quaternion.copy(playerMesh.quaternion);
        this.scene.add(exit);

        // Animate cleanup
        this.projectiles.push({ mesh: entry, life: 1.0, abilityName: "PortalFX", update: (dt) => { entry.scale.x -= dt; entry.scale.y -= dt; } });
        this.projectiles.push({ mesh: exit, life: 1.0, abilityName: "PortalFX", update: (dt) => { exit.scale.x -= dt; exit.scale.y -= dt; } });
    }

    castBanishment(playerMesh) {
        // Expansion of Void
        // Using a Torus Knot for "complex dimension" look? Or just Torus
        const geo = new THREE.TorusGeometry(3, 1, 16, 100);
        const mat = new THREE.MeshBasicMaterial({ color: 0x003300, wireframe: true, transparent: true, opacity: 0.8 });
        const voidZone = new THREE.Mesh(geo, mat);

        voidZone.rotation.x = Math.PI / 2;
        voidZone.position.copy(playerMesh.position);
        this.scene.add(voidZone);

        this.projectiles.push({
            mesh: voidZone,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 3.0,
            abilityName: "Banishment",
            update: (dt) => {
                voidZone.rotation.z += dt * 5;
                voidZone.scale.addScalar(dt * 0.5);
            }
        });
    }

    castSnowflake(playerMesh) {
        // Hexagonal Star
        const shape = new THREE.Shape();
        const outer = 0.5;
        const inner = 0.2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const r = (i % 2 === 0) ? outer : inner;
            if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        const geo = new THREE.ShapeGeometry(shape);
        const mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        const star = new THREE.Mesh(geo, mat);

        star.position.copy(playerMesh.position);
        star.position.y += 1.5;
        // Face forward?
        star.rotation.x = -Math.PI / 2;

        this.scene.add(star);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);

        this.projectiles.push({
            mesh: star,
            velocity: dir.multiplyScalar(25),
            life: 2.0,
            abilityName: "Snowflake",
            update: (dt) => {
                star.rotation.z += dt * 15; // Spin
            }
        });
    }

    castBlizzardDomain(playerMesh) {
        // Snow dome
        const domain = new THREE.Group();
        const count = 50;

        for (let i = 0; i < count; i++) {
            const flake = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.1),
                new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
            );
            const r = Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const y = Math.random() * 5;
            flake.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            domain.add(flake);
        }

        domain.position.copy(playerMesh.position);
        this.scene.add(domain);

        this.projectiles.push({
            mesh: domain,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 5.0,
            abilityName: "BlizzardDomain",
            update: (dt) => {
                domain.rotation.y += dt; // Spin entire domain
                // Maybe drift individual flakes? 
                // Too complex for Group right now, spinning is enough effect.
            }
        });
    }

    castSoundBlast(playerMesh) {
        // Golden Ring
        const geo = new THREE.TorusGeometry(1, 0.3, 16, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold
        const ring = new THREE.Mesh(geo, mat);

        ring.position.copy(playerMesh.position);
        ring.position.y += 1.5;
        ring.quaternion.copy(playerMesh.quaternion);

        this.scene.add(ring);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);

        this.projectiles.push({
            mesh: ring,
            velocity: dir.multiplyScalar(35),
            life: 2.0,
            abilityName: "SoundBlast",
            update: (dt) => {
                ring.scale.addScalar(dt); // Expand as it travels
            }
        });
    }

    castSymphony(playerMesh) {
        // Musical Pulse
        const disc = new THREE.Mesh(
            new THREE.RingGeometry(2, 2.5, 32),
            new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide, transparent: true })
        );
        disc.rotation.x = -Math.PI / 2;
        disc.position.copy(playerMesh.position);
        disc.position.y = 0.5;
        this.scene.add(disc);

        // Music Notes (Simple Boxes for now)
        const notes = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const note = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), new THREE.MeshBasicMaterial({ color: 0xFFA500 }));
            const a = Math.random() * Math.PI * 2;
            const r = 3;
            note.position.set(Math.cos(a) * r, 2 + Math.random(), Math.sin(a) * r);
            notes.add(note);
        }
        notes.position.copy(playerMesh.position);
        this.scene.add(notes);

        this.projectiles.push({
            mesh: disc,
            life: 2.0,
            velocity: new THREE.Vector3(0, 0, 0),
            update: (dt) => {
                disc.scale.addScalar(dt * 5);
                disc.material.opacity -= dt * 0.5;
            }
        });

        this.projectiles.push({
            mesh: notes,
            life: 2.0,
            velocity: new THREE.Vector3(0, 0, 0),
            update: (dt) => {
                notes.rotation.y += dt * 3;
                notes.children.forEach(n => n.position.y += dt);
            }
        });
    }

    castPawShot(playerMesh) {
        // Paw Print Projectile
        const pawGroup = new THREE.Group();

        // Main Pad
        const main = new THREE.Mesh(
            new THREE.SphereGeometry(1.0, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFFC0CB, transparent: true, opacity: 0.8 }) // Pink
        );
        main.scale.z = 0.2; // Flatten
        pawGroup.add(main);

        // Fingers (3 small circles)
        for (let i = 0; i < 3; i++) {
            const finger = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xFFC0CB, transparent: true, opacity: 0.8 })
            );
            finger.scale.z = 0.2;
            const angle = (i - 1) * 0.8 + (Math.PI / 2); // Top arc
            finger.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0);
            pawGroup.add(finger);
        }

        pawGroup.position.copy(playerMesh.position);
        pawGroup.position.y += 1.5;
        pawGroup.quaternion.copy(playerMesh.quaternion);

        this.scene.add(pawGroup);

        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);
        this.projectiles.push({
            mesh: pawGroup,
            velocity: dir.multiplyScalar(30),
            life: 2.0,
            abilityName: "PawShot"
        });
    }

    castPainRepel(playerMesh) {
        // Transparent Sphere Expansion
        const repel = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3, wireframe: true })
        );
        repel.position.copy(playerMesh.position);
        this.scene.add(repel);

        this.projectiles.push({
            mesh: repel,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 0.5, // Fast push
            abilityName: "PainRepel",
            update: (dt) => {
                repel.scale.addScalar(dt * 20); // Fast expansion
                repel.material.opacity -= dt * 0.6;
            }
        });
    }

    transformMammoth(playerMesh) {
        if (playerMesh.userData.isMammoth) {
            // Revert
            playerMesh.userData.isMammoth = false;
            playerMesh.scale.set(1, 1, 1);
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);

            // Remove speed boost
            playerMesh.userData.speedBonus = 0;

            // Remove Tusks if any (handled via scene remove or just keep simple)
        } else {
            // Transform
            playerMesh.userData.isMammoth = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();

            // Visuals: Brown + Scale
            playerMesh.scale.set(1.5, 1.5, 1.5); // Huge
            playerMesh.material.color.setHex(0x8B4513); // Saddle Brown

            // Speed & Defense
            playerMesh.userData.speedBonus = 5; // Slight boost (Heavy but fast charge)
            // Defense logic handled elsewhere if needed
        }
    }

    castAncientRoar(playerMesh) {
        // Brown Ring shockwave
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1, 2, 32),
            new THREE.MeshBasicMaterial({ color: 0x8B4513, side: THREE.DoubleSide, transparent: true })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(playerMesh.position);
        ring.position.y += 0.5;
        this.scene.add(ring);

        this.projectiles.push({
            mesh: ring,
            life: 0.8,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "AncientRoar",
            update: (dt) => {
                ring.scale.addScalar(dt * 15);
                ring.material.opacity -= dt;
            }
        });
    }

    transformTRex(playerMesh) {
        if (playerMesh.userData.isTRex) {
            // Revert
            playerMesh.userData.isTRex = false;
            playerMesh.scale.set(1, 1, 1);
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);
            // Revert Speed
            playerMesh.userData.speedBonus = 0;
        } else {
            // Transform
            playerMesh.userData.isTRex = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();

            // Visuals: Green + Scale
            playerMesh.scale.set(1.4, 1.4, 1.4);
            playerMesh.material.color.setHex(0x006400); // Dark Green

            // Speed
            playerMesh.userData.speedBonus = 8; // Fast
        }
    }

    castTailSwipe(playerMesh) {
        // Wide Arc
        const arcGeo = new THREE.TorusGeometry(2, 0.2, 8, 16, Math.PI); // Half circle
        const mat = new THREE.MeshBasicMaterial({ color: 0x00FF00, side: THREE.DoubleSide });
        const swipe = new THREE.Mesh(arcGeo, mat);

        swipe.rotation.x = -Math.PI / 2;
        swipe.position.copy(playerMesh.position);
        swipe.position.y += 1.0;
        // Rotate arc to face forward
        swipe.rotation.z = Math.PI; // Adjust based on how Torus arc is drawn

        this.scene.add(swipe);

        // Parent container to rotate? Or just manual rotation
        // Let's use simple logic: Forward projectile that is WIDE

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(10);

        this.projectiles.push({
            mesh: swipe,
            life: 0.5,
            velocity: velocity,
            abilityName: "TailSwipe",
            update: (dt) => {
                swipe.rotation.z += dt * 10; // Spin horizontal
                swipe.scale.addScalar(dt * 2);
            }
        });
    }

    castFoxFire(playerMesh) {
        // Blue Flame Sphere
        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00BFFF }) // Deep Sky Blue
        );
        orb.position.copy(playerMesh.position);
        orb.position.y += 1.5;
        this.scene.add(orb);

        // Trail
        const trail = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x1E90FF, transparent: true }));
            trail.add(p);
        }
        orb.add(trail);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(45); // Very fast

        this.projectiles.push({
            mesh: orb,
            velocity: velocity,
            life: 2.0,
            abilityName: "FoxFire",
            update: (dt) => {
                trail.rotation.z += dt * 10;
            }
        });
    }

    transformKitsune(playerMesh) {
        if (playerMesh.userData.isKitsune) {
            // Revert
            playerMesh.userData.isKitsune = false;
            playerMesh.scale.set(1, 1, 1);
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);
            playerMesh.userData.speedBonus = 0;
            // Remove tails? (Visual only for now)
        } else {
            // Transform
            playerMesh.userData.isKitsune = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();

            // Visuals
            playerMesh.scale.set(1.2, 1.2, 1.2); // Not huge, but distinct
            playerMesh.material.color.setHex(0x00BFFF); // Blue Fox

            // Tails (Simple representation)
            // Ideally we add child meshes, but playerMesh reconstruction often wipes children in naive updates.
            // For now, color and speed change + particle aura (simulated via update) is enough.

            // Speed
            playerMesh.userData.speedBonus = 12; // Extremely fast
        }
    }

    castGasZone(playerMesh) {
        // Toxic Green Cloud
        const cloud = new THREE.Group();
        const count = 30;
        for (let i = 0; i < count; i++) {
            const part = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.5 })
            );
            // Random pos in cylinder
            const r = Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const y = Math.random() * 3;
            part.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            cloud.add(part);
        }

        cloud.position.copy(playerMesh.position);
        this.scene.add(cloud);

        this.projectiles.push({
            mesh: cloud,
            life: 4.0,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "GasZone",
            update: (dt) => {
                cloud.rotation.y += dt;
                cloud.children.forEach(p => {
                    p.position.y += dt * 0.5;
                    p.material.opacity -= dt * 0.1;
                });
            }
        });
    }

    castGasBlast(playerMesh) {
        // Green sphere
        const blast = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x32CD32, transparent: true, opacity: 0.8 }) // Lime Green
        );
        blast.position.copy(playerMesh.position);
        blast.position.y += 1.5;
        this.scene.add(blast);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(25);

        this.projectiles.push({
            mesh: blast,
            velocity: velocity,
            life: 2.0,
            abilityName: "GasBlast"
        });
    }

    castMissile(playerMesh) {
        // Rocket Projectile
        const missile = new THREE.Group();

        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
            new THREE.MeshBasicMaterial({ color: 0x888888 }) // Gray
        );
        body.rotation.x = -Math.PI / 2; // Point forward
        missile.add(body);

        // Nose Cone
        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.5, 8),
            new THREE.MeshBasicMaterial({ color: 0xFF4500 }) // Red/Orange
        );
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = -1.0; // In front? No, local coords
        // Cylinder is centered, so z + 0.75 is one end.
        // Let's debug rotation. Cylinder Y is length. Rotated X makes Y point in Z.
        // So Y+ is Z- in world if aligned?
        // Let's just place nose at "top" before rotation
        nose.rotation.x = 0;
        nose.position.y = 1.0;
        // Then rotate whole thing
        // Actually simpler: Just mesh transforms.

        // Re-do geometry logic cleanly:
        // Cylinder oriented along Y.
        // Nose on Y+.
        // Rotate Group X -90 => Y+ is -Z (Forward).

        missile.add(nose);

        missile.position.copy(playerMesh.position);
        missile.position.y += 1.5;
        missile.quaternion.copy(playerMesh.quaternion);
        missile.rotateX(-Math.PI / 2);

        this.scene.add(missile);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(35);

        this.projectiles.push({
            mesh: missile,
            velocity: velocity,
            life: 2.5,
            abilityName: "Missile"
        });
    }

    castRocketCrash(playerMesh) {
        // Air Dash + Explosion
        // 1. Dash
        const dashDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(20);
        playerMesh.position.add(dashDir); // Instant dash for now vs slide

        // 2. Explosion at dest
        const boom = new THREE.Mesh(
            new THREE.SphereGeometry(2, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFFA500, transparent: true, opacity: 0.8 })
        );
        boom.position.copy(playerMesh.position);
        this.scene.add(boom);

        this.projectiles.push({
            mesh: boom,
            life: 1.0,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "Explosion",
            update: (dt) => {
                boom.scale.addScalar(dt * 10);
                boom.material.opacity -= dt;
            }
        });
    }

    castRazorWind(playerMesh) {
        // Spinning Disc
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 0.1, 16),
            new THREE.MeshBasicMaterial({ color: 0x87CEEB }) // Sky Blue
        );
        disc.position.copy(playerMesh.position);
        disc.position.y += 1.5;
        this.scene.add(disc);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(30);

        this.projectiles.push({
            mesh: disc,
            velocity: velocity,
            life: 2.0,
            abilityName: "RazorWind",
            update: (dt) => {
                disc.rotation.y += dt * 20; // High spin
            }
        });
    }

    castTornadoSpin(playerMesh) {
        // Tornado AOE
        // Cone upside down
        const tornado = new THREE.Group();
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(2, 4, 16, 4, true),
            new THREE.MeshBasicMaterial({ color: 0xC0C0C0, transparent: true, opacity: 0.5, wireframe: true })
        );
        cone.geometry.translate(0, 2, 0); // Base at bottom
        cone.rotation.x = Math.PI; // Flip so wide part is top? Tornado usually wide at top.
        // ConeGeometry(radius, height) -> Point at top (0, h/2). Base at (0, -h/2).
        // Standard "Tornado" is wide top, narrow bottom.
        // So standard cone inverted.

        tornado.add(cone);

        // Particles swirling
        const partCount = 20;
        for (let i = 0; i < partCount; i++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
            p.position.set((Math.random() - 0.5) * 2, Math.random() * 4, (Math.random() - 0.5) * 2);
            tornado.add(p);
        }

        tornado.position.copy(playerMesh.position);
        this.scene.add(tornado);

        this.projectiles.push({
            mesh: tornado,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 3.0,
            abilityName: "TornadoSpin",
            update: (dt) => {
                tornado.rotation.y += dt * 10;
                tornado.scale.x += dt * 0.5;
                tornado.scale.z += dt * 0.5;
                // Move with player? Or stationary? stationary for now.
            }
        });
    }

    castChopPunch(playerMesh) {
        // Rocket Punch / Detached Fist
        // Let's use a Box + small cylinders as fingers
        const fist = new THREE.Group();
        const palm = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: 0xFFDAB9 }) // Peach Puff
        );
        fist.add(palm);
        // Add "Energy" trail
        const trail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.0, 1.0),
            new THREE.MeshBasicMaterial({ color: 0x0000FF, transparent: true, opacity: 0.5 })
        );
        trail.rotation.x = Math.PI / 2;
        trail.position.z = 0.5;
        fist.add(trail);

        fist.position.copy(playerMesh.position);
        fist.position.y += 1.5;
        fist.quaternion.copy(playerMesh.quaternion);

        this.scene.add(fist);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(30);

        this.projectiles.push({
            mesh: fist,
            velocity: velocity,
            life: 2.0,
            abilityName: "ChopPunch"
        });
    }

    castChopFestival(playerMesh) {
        // Body Parts Frenzy
        // Spawn many small blocks around player
        const festival = new THREE.Group();
        const count = 15;

        for (let i = 0; i < count; i++) {
            const part = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.4, 0.4),
                new THREE.MeshBasicMaterial({ color: 0xFFDAB9 })
            );
            // Random orbit
            part.userData = {
                angle: Math.random() * Math.PI * 2,
                height: Math.random() * 3,
                radius: 3 + Math.random() * 2,
                speed: 5 + Math.random() * 5
            };
            festival.add(part);
        }

        festival.position.copy(playerMesh.position);
        this.scene.add(festival);

        this.projectiles.push({
            mesh: festival,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 3.5,
            abilityName: "ChopFestival",
            update: (dt) => {
                festival.children.forEach(p => {
                    p.userData.angle += p.userData.speed * dt;
                    p.position.set(
                        Math.cos(p.userData.angle) * p.userData.radius,
                        p.userData.height,
                        Math.sin(p.userData.angle) * p.userData.radius
                    );
                });
            }
        });
    }

    castSpringSnipe(playerMesh) {
        // Coiled Punch
        const glove = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFF69B4 }) // Hot Pink
        );
        glove.position.copy(playerMesh.position);
        glove.position.y += 1.5;
        this.scene.add(glove);

        // Spring Helix Trail
        const helix = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.1, 8, 20), // Placeholder for helix
            new THREE.MeshBasicMaterial({ color: 0xC0C0C0 })
        );
        // Helix is hard with primitives, standard cylinder 'arm' extension works too.
        // Let's us a scaled cylinder as the 'spring' arm.
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 1.0, 8),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        arm.rotation.x = -Math.PI / 2;
        arm.position.z = 1.0;
        glove.add(arm);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(30);

        this.projectiles.push({
            mesh: glove,
            velocity: velocity,
            life: 2.0,
            abilityName: "SpringSnipe",
            update: (dt) => {
                // Stretch arm?
                arm.scale.y += dt * 10;
                arm.position.z = arm.scale.y * 0.5; // Keep attached roughly
                // Visual glitch possible if not parented correctly, but works for effect.
            }
        });
    }

    castSpringLeap(playerMesh) {
        // Leap Upwards
        // Visualize Spring on ground
        const spring = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.5, 8),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        spring.position.copy(playerMesh.position);
        this.scene.add(spring);

        // Push Player Up
        playerMesh.position.y += 15; // Teleport Jump

        // Fade spring
        this.projectiles.push({
            mesh: spring,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            abilityName: "SpringLeap",
            update: (dt) => {
                spring.scale.y += dt * 5; // Expand spring
                spring.material.opacity -= dt;
            }
        });
    }

    castBombShot(playerMesh) {
        // Black Bomb Projectile
        const bomb = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        bomb.position.copy(playerMesh.position);
        bomb.position.y += 1.5;
        this.scene.add(bomb);

        // Velocity (Arc?)
        // Simple straight shot for this engine version
        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(25);

        this.projectiles.push({
            mesh: bomb,
            velocity: velocity,
            life: 2.0,
            abilityName: "BombShot",
            update: (dt) => {
                // Explode at end of life handled by creating explosion on death?
                // Currently system just removes.
                // We'll add a visual here if life is low?
                // Or standard projectile logic: if hits mob or timer ends.
                // For visual flair:
                if (Math.random() < 0.2) {
                    // Spark trail?
                }
            }
        });
    }

    castSelfDestruct(playerMesh) {
        // Big Boom
        const boom = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF4500, transparent: true, opacity: 0.9 })
        );
        boom.position.copy(playerMesh.position);
        this.scene.add(boom);

        this.projectiles.push({
            mesh: boom,
            life: 1.5,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "SelfDestruct",
            update: (dt) => {
                boom.scale.addScalar(dt * 15);
                boom.material.opacity -= dt * 0.6;
            }
        });
    }

    castSmokeBomber(playerMesh) {
        // Smoke Ball
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xA9A9A9, transparent: true, opacity: 0.8 }) // Dark Gray
        );
        smoke.position.copy(playerMesh.position);
        smoke.position.y += 1.5;
        this.scene.add(smoke);

        // Add particles trailing
        const pGroup = new THREE.Group();
        smoke.add(pGroup);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(20);

        this.projectiles.push({
            mesh: smoke,
            velocity: velocity,
            life: 3.0,
            abilityName: "SmokeBomber",
            update: (dt) => {
                // Pulse size
                smoke.scale.multiplyScalar(1 + dt * 0.5);
                smoke.material.opacity -= dt * 0.2;
            }
        });
    }

    castSmokeTornado(playerMesh) {
        // Smoke Tornado around player
        const tornado = new THREE.Group();
        const particles = 40;

        for (let i = 0; i < particles; i++) {
            const part = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.3),
                new THREE.MeshBasicMaterial({ color: 0x808080, transparent: true, opacity: 0.6 })
            );
            part.userData = {
                angle: Math.random() * Math.PI * 2,
                height: Math.random() * 5,
                radius: 2 + Math.random() * 3,
                speed: 3 + Math.random() * 3
            };
            part.position.set(Math.cos(part.userData.angle) * part.userData.radius, part.userData.height, Math.sin(part.userData.angle) * part.userData.radius);
            tornado.add(part);
        }

        tornado.position.copy(playerMesh.position);
        this.scene.add(tornado);

        this.projectiles.push({
            mesh: tornado,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 4.0,
            abilityName: "SmokeTornado",
            update: (dt) => {
                tornado.children.forEach(p => {
                    p.userData.angle += p.userData.speed * dt;
                    p.userData.height += dt; // rise
                    if (p.userData.height > 6) p.userData.height = 0;

                    p.position.set(
                        Math.cos(p.userData.angle) * p.userData.radius,
                        p.userData.height,
                        Math.sin(p.userData.angle) * p.userData.radius
                    );
                });
            }
        });
    }

    castSpikeShot(playerMesh) {
        // Spike Projectile
        const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 2, 8),
            new THREE.MeshBasicMaterial({ color: 0xF5F5F5 }) // White Smoke
        );
        spike.rotation.x = -Math.PI / 2; // Point forward
        spike.position.copy(playerMesh.position);
        spike.position.y += 1.5;
        this.scene.add(spike);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(30);

        this.projectiles.push({
            mesh: spike,
            velocity: velocity,
            life: 2.0,
            abilityName: "SpikeShot"
        });
    }

    castSpikeField(playerMesh) {
        // Spikes from ground
        const field = new THREE.Group();
        const count = 12;

        for (let i = 0; i < count; i++) {
            const sp = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 3, 8),
                new THREE.MeshBasicMaterial({ color: 0xDCDCDC })
            );
            // Circle around player
            const angle = (i / count) * Math.PI * 2;
            const radius = 4;
            sp.position.set(Math.cos(angle) * radius, -1.5, Math.sin(angle) * radius); // Start below ground
            field.add(sp);
        }

        field.position.copy(playerMesh.position);
        field.position.y = 1; // Ground level adjust
        this.scene.add(field);

        this.projectiles.push({
            mesh: field,
            life: 2.5,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "SpikeField",
            update: (dt) => {
                // Rise up
                field.children.forEach(sp => {
                    if (sp.position.y < 1.5) {
                        sp.position.y += dt * 10;
                    }
                });
            }
        });
    }

    castFireBullet(playerMesh) {
        // Fireball
        const fire = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFF4500 }) // OrangeRed
        );
        fire.position.copy(playerMesh.position);
        fire.position.y += 1.5;
        this.scene.add(fire);

        // Trail
        const trail = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xFFFF00 }));
            p.position.set((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
            trail.add(p);
        }
        fire.add(trail);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(28);

        this.projectiles.push({
            mesh: fire,
            velocity: velocity,
            life: 2.0,
            abilityName: "FireBullet",
            update: (dt) => {
                trail.rotation.z += dt * 10;
            }
        });
    }

    castFirePillar(playerMesh) {
        // Fire Pillar
        const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 6, 16),
            new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.7 })
        );
        pillar.position.copy(playerMesh.position);
        pillar.position.y += 3; // Center Height/2
        this.scene.add(pillar);

        this.projectiles.push({
            mesh: pillar,
            life: 1.5,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "FirePillar",
            update: (dt) => {
                pillar.rotation.y += dt * 5;
                pillar.scale.x = 1 + Math.sin(Date.now() * 0.01) * 0.2; // Pulse
                pillar.scale.z = pillar.scale.x;
            }
        });
    }

    castTalonRush(playerMesh) {
        // Dash Strike
        const dashDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(25);
        // Move player
        playerMesh.position.add(dashDir.clone()); // Teleport dash for impact

        // Visual Hit at end
        const claw = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.2, 2),
            new THREE.MeshBasicMaterial({ color: 0xFFD700 }) // Gold
        );
        claw.position.copy(playerMesh.position);
        claw.position.y += 1;
        // Scratch rotation
        claw.rotation.z = Math.PI / 4;
        this.scene.add(claw);

        this.projectiles.push({
            mesh: claw,
            life: 0.5,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "TalonHit",
            update: (dt) => {
                claw.material.opacity -= dt;
            }
        });
    }

    transformFalcon(playerMesh) {
        if (playerMesh.userData.isFalcon) {
            // Revert
            playerMesh.userData.isFalcon = false;
            // Remove speed
            playerMesh.userData.speedBonus = 0;
            // Clean up wings if stored, otherwise just toggle logic
            // (Visual wings omitted for brevity/complexity, just logic/color)
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);
        } else {
            // Transform
            playerMesh.userData.isFalcon = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();
            playerMesh.material.color.setHex(0xFFD700); // Gold/Orange

            // Speed
            playerMesh.userData.speedBonus = 12; // High Speed (Flight-like)
        }
    }

    castIceSpear(playerMesh) {
        // Ice Spear
        const spear = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 2, 8),
            new THREE.MeshBasicMaterial({ color: 0x00FFFF }) // Cyan
        );
        spear.rotation.x = -Math.PI / 2;
        spear.position.copy(playerMesh.position);
        spear.position.y += 1.5;
        this.scene.add(spear);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(35);

        this.projectiles.push({
            mesh: spear,
            velocity: velocity,
            life: 2.0,
            abilityName: "IceSpear"
        });
    }

    castIceSurge(playerMesh) {
        // Ice Wave along ground
        // Create multiple spikes in a line
        const count = 5;
        const spacing = 3;
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);

        const surgeGroup = new THREE.Group();
        this.scene.add(surgeGroup);

        this.projectiles.push({
            mesh: surgeGroup,
            life: 1.5,
            velocity: new THREE.Vector3(0, 0, 0),
            abilityName: "IceSurge",
            update: (dt, p) => {
                // Spawn one by one?
                // Or just move them?
                // "Surge" usually means spawning in sequence.
                p.timer = (p.timer || 0) + dt;
                p.spawnedCount = p.spawnedCount || 0;

                if (p.timer > 0.1 && p.spawnedCount < count) {
                    p.timer = 0;
                    const i = p.spawnedCount;
                    const spike = new THREE.Mesh(
                        new THREE.ConeGeometry(1, 3, 4),
                        new THREE.MeshBasicMaterial({ color: 0xE0FFFF })
                    );
                    const pos = playerMesh.position.clone().add(dir.clone().multiplyScalar((i + 1) * spacing));
                    spike.position.copy(pos);
                    pivotY(spike); // helper function not avail? just set y
                    spike.position.y = -1; // Rise up
                    surgeGroup.add(spike);
                    p.spawnedCount++;

                    // Animate rise
                    spike.userData = { rising: true };
                }

                surgeGroup.children.forEach(s => {
                    if (s.userData.rising && s.position.y < 0.5) {
                        s.position.y += dt * 15;
                    }
                });
            }
        });

        function pivotY(mesh) { } // Dummy
    }

    castDesertSword(playerMesh) {
        // Sand Slash
        const slash = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.1, 1),
            new THREE.MeshBasicMaterial({ color: 0xD2B48C }) // Tan / Sand
        );
        slash.position.copy(playerMesh.position);
        slash.position.y += 1.5;
        this.scene.add(slash);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(30);

        this.projectiles.push({
            mesh: slash,
            velocity: velocity,
            life: 2.0,
            abilityName: "DesertSword"
        });
    }

    castSandTornado(playerMesh) {
        // Sand Tornado
        const tornado = new THREE.Group();
        const particles = 40;

        for (let i = 0; i < particles; i++) {
            const part = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.3),
                new THREE.MeshBasicMaterial({ color: 0x8B4513, transparent: true, opacity: 0.6 }) // Saddle Brown / darker sand
            );
            part.userData = {
                angle: Math.random() * Math.PI * 2,
                height: Math.random() * 6,
                radius: 1.5 + Math.random() * 3,
                speed: 4 + Math.random() * 4
            };
            part.position.set(Math.cos(part.userData.angle) * part.userData.radius, part.userData.height, Math.sin(part.userData.angle) * part.userData.radius);
            tornado.add(part);
        }

        tornado.position.copy(playerMesh.position);
        this.scene.add(tornado);

        this.projectiles.push({
            mesh: tornado,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 4.0,
            abilityName: "SandTornado",
            update: (dt) => {
                tornado.children.forEach(p => {
                    p.userData.angle += p.userData.speed * dt;
                    p.userData.height += dt * 0.5;
                    p.position.set(
                        Math.cos(p.userData.angle) * p.userData.radius,
                        p.userData.height,
                        Math.sin(p.userData.angle) * p.userData.radius
                    );
                    if (p.userData.height > 8) p.userData.height = 0;
                });
            }
        });
    }

    castBlackHole(playerMesh) {
        // Black Hole Projectile
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        sphere.position.copy(playerMesh.position);
        sphere.position.y += 1.5;
        // Ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.2, 0.1, 16, 100),
            new THREE.MeshBasicMaterial({ color: 0x800080 }) // Purple
        );
        sphere.add(ring);
        this.scene.add(sphere);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(15); // Slow moving

        this.projectiles.push({
            mesh: sphere,
            velocity: velocity,
            life: 3.0,
            abilityName: "BlackHole",
            update: (dt) => {
                sphere.rotation.y += dt * 5;
                ring.rotation.x += dt * 3;
            }
        });
    }

    castDarkBomb(playerMesh) {
        // Dark Explosion
        const bomb = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x191970, transparent: true, opacity: 0.9 }) // Midnight Blue
        );
        bomb.position.copy(playerMesh.position);
        this.scene.add(bomb);

        this.projectiles.push({
            mesh: bomb,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.5,
            abilityName: "DarkBomb",
            update: (dt) => {
                bomb.scale.addScalar(dt * 12);
                bomb.material.opacity -= dt * 0.6;
            }
        });
    }

    castDiamondBody(playerMesh) {
        // Encrust
        if (playerMesh.userData.isDiamond) {
            // Revert
            playerMesh.userData.isDiamond = false;
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);
            playerMesh.userData.defenseBonus = 0;
        } else {
            // Transform
            playerMesh.userData.isDiamond = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();
            playerMesh.material.color.setHex(0xE0FFFF); // Light Cyan
            playerMesh.userData.defenseBonus = 50; // Simple stat track
        }
    }

    castDiamondBolt(playerMesh) {
        // Diamond Projectile
        const bolt = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5, 0),
            new THREE.MeshBasicMaterial({ color: 0x00FFFF })
        );
        bolt.position.copy(playerMesh.position);
        bolt.position.y += 1.5;
        this.scene.add(bolt);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(40);

        this.projectiles.push({
            mesh: bolt,
            velocity: velocity,
            life: 2.0,
            abilityName: "DiamondBolt",
            update: (dt) => {
                bolt.rotation.x += dt * 10;
                bolt.rotation.y += dt * 10;
            }
        });
    }

    castLightBeam(playerMesh) {
        // Laser
        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 40, 8),
            new THREE.MeshBasicMaterial({ color: 0xFFFF00 }) // Yellow
        );
        beam.rotation.x = -Math.PI / 2;
        beam.position.copy(playerMesh.position);
        beam.position.y += 1.5;
        // Offset forward so it starts at player
        beam.translateY(20);

        // Pivot to aim?
        // Simple forward aim relative to player quaternion
        const pivot = new THREE.Group();
        pivot.position.copy(playerMesh.position);
        pivot.position.y += 1.5;
        pivot.quaternion.copy(playerMesh.quaternion);
        pivot.add(beam);
        beam.position.set(0, 0, -20); // Reset local pos in pivot?

        // Simpler: Just spawn a fast long mesh
        this.scene.add(pivot);

        this.projectiles.push({
            mesh: pivot,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 0.3, // Short duration
            abilityName: "LightBeam",
            update: (dt) => {
                pivot.scale.x -= dt;
                pivot.scale.z -= dt;
            }
        });
    }

    castLightFlight(playerMesh) {
        if (playerMesh.userData.isLight) {
            // Revert
            playerMesh.userData.isLight = false;
            playerMesh.userData.speedBonus = 0;
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);
        } else {
            // Transform
            playerMesh.userData.isLight = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();
            playerMesh.material.color.setHex(0xFFFFE0); // Light Yellow
            playerMesh.userData.speedBonus = 20; // Very Fast
        }
    }

    castMellowShot(playerMesh) {
        // Heart Projectile
        const heart = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.3, 8, 16), // Placeholder for heart shape
            new THREE.MeshBasicMaterial({ color: 0xFF69B4 }) // Hot Pink
        );
        heart.position.copy(playerMesh.position);
        heart.position.y += 1.5;
        this.scene.add(heart);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(20);

        this.projectiles.push({
            mesh: heart,
            velocity: velocity,
            life: 3.0,
            abilityName: "MellowShot",
            update: (dt) => {
                // Spin/Wobble
                heart.rotation.z += dt * 3;
            }
        });
    }

    castLoveZone(playerMesh) {
        // Love Zone AOE
        const cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 1, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF69B4, transparent: true, opacity: 0.5 })
        );
        cylinder.position.copy(playerMesh.position);
        this.scene.add(cylinder);

        this.projectiles.push({
            mesh: cylinder,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 2.0,
            abilityName: "LoveZone",
            update: (dt, p) => {
                cylinder.scale.x += dt;
                cylinder.scale.z += dt;
                cylinder.material.opacity -= dt * 0.2;
            }
        });
    }

    castRubberPistol(playerMesh) {
        // Pistol
        const fist = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFFA07A }) // Skin/Peach
        );
        fist.position.copy(playerMesh.position);
        fist.position.y += 1.5;
        this.scene.add(fist);

        // Elastic Arm (Cylinder stretching behind)
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 1, 8),
            new THREE.MeshBasicMaterial({ color: 0xFFA07A })
        );
        arm.rotation.x = -Math.PI / 2;
        arm.position.z = 0.5;
        fist.add(arm);

        const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion).multiplyScalar(35);

        this.projectiles.push({
            mesh: fist,
            velocity: velocity,
            life: 1.5,
            abilityName: "RubberPistol",
            update: (dt) => {
                // Stretch visual
                arm.scale.y += dt * 30;
                arm.position.z = arm.scale.y * 0.5;
            }
        });
    }

    castGearSecond(playerMesh) {
        if (playerMesh.userData.isGear2) {
            // Revert
            playerMesh.userData.isGear2 = false;
            playerMesh.userData.speedBonus = 0;
            if (playerMesh.material) playerMesh.material.color.setHex(playerMesh.userData.originalColor || 0xaaaaaa);
        } else {
            // Transform
            playerMesh.userData.isGear2 = true;
            playerMesh.userData.originalColor = playerMesh.material.color.getHex();
            playerMesh.material.color.setHex(0xFF6347); // Tomato/Reddish
            playerMesh.userData.speedBonus = 18; // Fast

            // Steam effect could be particles in update loop, simulated by player color/speed for now.
        }
    }

    update(deltaTime, mobs) {
        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Special Case: Donut (Attached to player)
            if (p.isDonuter) {
                if (!p.owner.userData.isDonut) {
                    // Transformation ended
                    p.life = 0; // Kill next frame
                }
                if (p.update) p.update(deltaTime);
                continue; // Skip velocity move, it follows player in update()
            }

            p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
            if (p.update) p.update(deltaTime);

            // Collision Detection (Server Logic usually, but client authoritative for now)
            if (mobs && p.abilityName) { // Only check if abilityName is set (damaging)
                for (const id in mobs) {
                    const mob = mobs[id];
                    if (!mob.mesh) continue;

                    const dist = p.mesh.position.distanceTo(mob.mesh.position);
                    if (dist < 2.0) { // Hit!
                        console.log("Ability Hit:", p.abilityName, id);
                        // Send to server
                        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
                            window.socket.send(JSON.stringify({
                                type: 'ability_hit',
                                item: id, // Mob ID
                                weapon: p.abilityName // Ability Name
                            }));
                        }

                        // Visual Impact?
                        // Remove projectile
                        this.scene.remove(p.mesh);
                        this.projectiles.splice(i, 1);
                        break; // One hit per projectile? Or pierce? Let's say one hit for now.
                    }
                }
            }
        }

        this.updateFruits(deltaTime);
    }
}
