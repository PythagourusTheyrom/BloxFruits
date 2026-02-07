import { SpeedR as THREE } from './SpeedR.js';
import { SimpleOBJLoader } from './loader.js?v=2';

export const ModelFactory = {
    loader: new SimpleOBJLoader(),

    loadModel: function (url, color, scale = 1) {
        const container = new THREE.Object3D();
        this.loader.load(url, (geo) => {
            const mat = new THREE.MeshPhongMaterial({ color: color });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(scale, scale, scale);
            container.add(mesh);
        });
        return container;
    },

    createHumanoid: function (color, extraType = null) {
        const group = new THREE.Group();

        // Material
        const mat = new THREE.MeshPhongMaterial({ color: color });
        const skinMat = new THREE.MeshPhongMaterial({ color: 0xffccaa }); // Skin tone

        // Torso - Use CapsuleGeometry
        // Radius 0.5, Length 1.0 (Total height approx 2.0)
        const torsoGeo = new THREE.CapsuleGeometry(0.5, 1.0, 4, 8);
        const torso = new THREE.Mesh(torsoGeo, mat);
        torso.position.y = 0.75;
        group.add(torso);

        // Head
        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 2.0; // Top of torso (0.75 + 1.0 + cap?)
        // Capsule Center 0.75. 
        // Height = Length 1.0 + Radius 0.5 * 2 = 2.0 total height.
        // If center is 0.75, Top is 0.75 + 1.0 = 1.75.
        // Head radius 0.4. Center at 1.75 + 0.4 = 2.15?
        // Let's eyeball it.
        head.position.y = 2.2;
        group.add(head);

        // Arms
        const armGeo = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);

        const lArm = new THREE.Mesh(armGeo, skinMat);
        lArm.position.set(-0.8, 1.0, 0); // Shoulder height
        group.add(lArm);

        const rArm = new THREE.Mesh(armGeo, skinMat);
        rArm.position.set(0.8, 1.0, 0);
        group.add(rArm);

        // Legs
        const legGeo = new THREE.CapsuleGeometry(0.25, 0.9, 4, 8);

        const lLeg = new THREE.Mesh(legGeo, mat);
        lLeg.position.set(-0.3, 0.0, 0);
        group.add(lLeg);

        const rLeg = new THREE.Mesh(legGeo, mat);
        rLeg.position.set(0.3, 0.0, 0);
        group.add(rLeg);

        // Store references for Haki
        group.userData.arms = [lArm, rArm];

        // Accessories based on Type
        if (extraType === 'Marine') {
            // Cap
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.5), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
            cap.position.y = 2.45;
            cap.position.z = 0.05;
            group.add(cap);
            const bill = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.2), new THREE.MeshLambertMaterial({ color: 0x111111 }));
            bill.position.set(0, 2.35, 0.35);
            group.add(bill);

            // Cape?
            const cape = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.05), new THREE.MeshLambertMaterial({ color: 0xffffff }));
            cape.position.set(0, 1.4, -0.3);
            cape.rotation.x = 0.2;
            group.add(cape);

        } else if (extraType === 'Pirate') {
            // Bandana? Eye patch?
            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.15, 16), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
            band.position.y = 2.3;
            group.add(band);
        }

        // Cast Shadow
        group.traverse(obj => {
            if (obj.isMesh) obj.castShadow = true;
        });

        return group;
    },

    createFruit: function (type) {
        const group = new THREE.Group();

        let color = 0xaaaaaa;
        let stemColor = 0x4B3621;
        let secondaryColor = null;

        // Define Fruit Colors
        const fruitColors = {
            'Rocket': 0x666666,
            'Spin': 0x87CEEB,
            'Chop': 0x00008B,
            'Spring': 0xFF69B4,
            'Bomb': 0x333333,
            'Spike': 0x808080,
            'Flame': 0xFF4500,
            'Falcon': 0xD2691E,
            'Ice': 0x87CEFA,
            'Sand': 0xF4A460,
            'Dark': 0x2F4F4F,
            'Light': 0xFFFFE0,
            'Magma': 0x8B0000,
            'Rubber': 0x9370DB,
            'Love': 0xFF1493,
            'Buddha': 0xFFD700,
            'Spider': 0xFFFFFF,
            'Phoenix': 0x00BFFF,
            'Portal': 0x4B0082,
            'Rumble': 0x00CED1,
            'Paw': 0xFFC0CB,
            'Gravity': 0x9400D3,
            'Dough': 0xF5DEB3,
            'Shadow': 0x191970,
            'Venom': 0x800080,
            'Control': 0xFFB6C1,
            'Spirit': 0xE0FFFF,
            'Dragon': 0xDC143C,
            'Leopard': 0xD2691E,
            'Kitsune': 0xFF4500,
            'T-Rex': 0x556B2F,
            'Mammoth': 0x8B4513,
            'Gas': 0x00FF7F // Green gas
        };

        if (fruitColors[type]) color = fruitColors[type];

        // Unique Shapes logic
        let base;

        // --- Common / Uncommon ---
        if (type === 'Rocket') {
            // Missile shape
            const body = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
            const cone = new THREE.ConeGeometry(0.2, 0.3, 16);
            const mat = new THREE.MeshPhongMaterial({ color: color, emissive: 0x111111 });

            base = new THREE.Mesh(body, mat);
            const top = new THREE.Mesh(cone, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
            top.position.y = 0.45;
            base.add(top);

            // Fins
            const finGeo = new THREE.BoxGeometry(0.1, 0.2, 0.6);
            const fin1 = new THREE.Mesh(finGeo, mat);
            fin1.position.y = -0.2;
            base.add(fin1);
            const fin2 = new THREE.Mesh(finGeo, mat);
            fin2.position.y = -0.2;
            fin2.rotation.y = Math.PI / 2;
            base.add(fin2);

        } else if (type === 'Spin') {
            // Sphere with propeller on top
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: color });
            base = new THREE.Mesh(geo, mat);

            const propBlade = new THREE.BoxGeometry(0.8, 0.05, 0.1);
            const prop = new THREE.Mesh(propBlade, new THREE.MeshPhongMaterial({ color: 0xeeeeee }));
            prop.position.y = 0.4;
            base.add(prop);
            const prop2 = prop.clone();
            prop2.rotation.y = Math.PI / 2;
            base.add(prop2);

        } else if (type === 'Chop') {
            // Sliced Sphere
            base = new THREE.Group();
            const mat = new THREE.MeshPhongMaterial({ color: color });

            const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), mat);
            base.add(bottom);

            const top = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), mat);
            top.position.set(0.1, 0.32, 0); // Offset slightly
            top.rotation.z = 0.2;
            base.add(top);

        } else if (type === 'Spring') {
            // Stack of Torus rings
            base = new THREE.Group();
            const mat = new THREE.MeshPhongMaterial({ color: color });

            for (let i = 0; i < 4; i++) {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), mat);
                ring.rotation.x = Math.PI / 2;
                ring.position.y = i * 0.15 - 0.2;
                base.add(ring);
            }

        } else if (type === 'Bomb') {
            // Sphere with large fuse
            const geo = new THREE.SphereGeometry(0.4, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x222222, emissive: 0x111111 });
            base = new THREE.Mesh(geo, mat);

            // Fuse tip is glowing
            stemColor = 0x8B4513; // Brown fuse

        } else if (type === 'Spike') {
            // Sphere with cones
            const geo = new THREE.SphereGeometry(0.3, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: color });
            base = new THREE.Mesh(geo, mat);

            // Add spikes
            const spikeGeo = new THREE.ConeGeometry(0.08, 0.3, 8);
            const spikeMat = new THREE.MeshPhongMaterial({ color: 0x555555 });

            for (let i = 0; i < 8; i++) {
                const s = new THREE.Mesh(spikeGeo, spikeMat);
                s.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.3);
                s.lookAt(0, 0, 0); // Inverted look at? center is 0. 
                // SpeedR lookAt looks from pos to target.
                // We want spike tip pointing OUT. Base at surface.
                // Cone default is upright Y.
                // If we lookAt 0,0,0, the top (Y) points to 0. So base is out. That's inverted spike.
                // We want base at 0.3, pointing away.
                // So s position is correct. We want s.up to be normal?
                // Simpler: Just random rotation
                s.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
                base.add(s);
            }

        } else if (type === 'Flame') {
            // Red/Orange sphere with particles
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: color, emissive: 0xff0000, opacity: 0.9, transparent: true });
            base = new THREE.Mesh(geo, mat);

            // Add simple flame particles (static mesh for now)
            for (let i = 0; i < 5; i++) {
                const f = new THREE.Mesh(new THREE.TetrahedronGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
                f.position.set((Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5);
                f.rotation.set(Math.random(), Math.random(), Math.random());
                base.add(f);
            }

        } else if (type === 'Falcon') {
            // Sphere with Wings
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: color });
            base = new THREE.Mesh(geo, mat);

            const wingGeo = new THREE.BoxGeometry(0.1, 0.4, 0.6);
            const wing1 = new THREE.Mesh(wingGeo, new THREE.MeshPhongMaterial({ color: 0x8B4513 }));
            wing1.position.set(-0.35, 0, 0);
            wing1.rotation.z = 0.5;
            base.add(wing1);

            const wing2 = new THREE.Mesh(wingGeo, new THREE.MeshPhongMaterial({ color: 0x8B4513 }));
            wing2.position.set(0.35, 0, 0);
            wing2.rotation.z = -0.5;
            base.add(wing2);

        } else if (type === 'Ice') {
            // Octahedron/Icosahedron mix
            const geo = new THREE.IcosahedronGeometry(0.35, 0);
            const mat = new THREE.MeshPhongMaterial({ color: color, emissive: 0x000044, transparent: true, opacity: 0.8 });
            base = new THREE.Mesh(geo, mat);

            // Spikes
            const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
            shard.position.y = 0.3;
            base.add(shard);

        } else if (type === 'Sand') {
            // Dusty sphere
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshLambertMaterial({ color: color });
            base = new THREE.Mesh(geo, mat);

            // "Sand" particles around it
            for (let i = 0; i < 10; i++) {
                const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xD2B48C }));
                p.position.setRandom().subScalar(0.5).normalize().multiplyScalar(0.4);
                base.add(p);
            }

            // --- Rare / Legendary ---
        } else if (type === 'Dark') {
            // Dark Hole
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x000000, emissive: 0x110011 });
            base = new THREE.Mesh(geo, mat);

            // Dark Aura
            const aura = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0x330033, transparent: true, opacity: 0.3, side: 1 })); // BackSide? 1=Front, 2=Back, 0=Double? SpeedR defaults.
            // SpeedR BasicMaterial doesn't support side yet, assume Double or Front.
            base.add(aura);

            // Spiral particles?
            for (let i = 0; i < 8; i++) {
                const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x4B0082 }));
                const angle = (i / 8) * Math.PI * 2;
                p.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
                base.add(p);
            }

        } else if (type === 'Revive') {
            // Skull-like? White Sphere with hollow eyes?
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0xffffff });
            base = new THREE.Mesh(geo, mat);

            // Eyes
            const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

            const e1 = new THREE.Mesh(eyeGeo, eyeMat);
            e1.position.set(-0.15, 0.1, 0.3);
            base.add(e1);

            const e2 = new THREE.Mesh(eyeGeo, eyeMat);
            e2.position.set(0.15, 0.1, 0.3);
            base.add(e2);

        } else if (type === 'Diamond') {
            // Crystal Shape
            const geo = new THREE.OctahedronGeometry(0.4, 0);
            const mat = new THREE.MeshPhongMaterial({ color: 0x00ffff, shininess: 100, opacity: 0.9, transparent: true });
            base = new THREE.Mesh(geo, mat);

        } else if (type === 'Light') {
            // Bright Star/Sphere
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa }); // Self-illuminated
            base = new THREE.Mesh(geo, mat);

            // Rays
            for (let i = 0; i < 6; i++) {
                const ray = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.05), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 }));
                ray.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                base.add(ray);
            }

        } else if (type === 'Love') {
            // Heart Shape (Approximate with 2 spheres + cone?)
            // Or just Pink Sphere with particles
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0xFF69B4, emissive: 0xCC1493 });
            base = new THREE.Mesh(geo, mat);

            // Heart Particles
            for (let i = 0; i < 5; i++) {
                const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
                h.position.setRandom().subScalar(0.5).multiplyScalar(0.8);
                base.add(h);
            }

        } else if (type === 'Magma') {
            // Dripping Lava
            const geo = new THREE.DodecahedronGeometry(0.35);
            const mat = new THREE.MeshPhongMaterial({ color: 0x8B0000, emissive: 0xFF4500 });
            base = new THREE.Mesh(geo, mat);

            // Drips
            for (let i = 0; i < 5; i++) {
                const d = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
                d.position.set((Math.random() - 0.5) * 0.5, -0.2 - Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
                base.add(d);
            }

        } else if (type === 'Portal') {
            // Rings
            base = new THREE.Group();
            const mat = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
            const center = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), mat);
            base.add(center);

            const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            r1.rotation.x = Math.PI / 2;
            base.add(r1);

            const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            r2.rotation.x = Math.PI / 2;
            r2.rotation.y = 0.5;
            base.add(r2);

        } else if (type === 'Quake') {
            // Cracked Sphere
            const geo = new THREE.SphereGeometry(0.4, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x4682B4 }); // Steel blue
            base = new THREE.Mesh(geo, mat);

            // Current Texture logic isn't advanced, so just add "Cracks" (lines)
            for (let i = 0; i < 3; i++) {
                const crack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                crack.rotation.set(Math.random(), Math.random(), Math.random());
                base.add(crack);
            }

        } else if (type === 'Buddha') {
            // Golden Statue / Sphere
            const geo = new THREE.SphereGeometry(0.45, 24, 24);
            const mat = new THREE.MeshPhongMaterial({ color: 0xFFD700, emissive: 0xDAA520, shininess: 100 });
            base = new THREE.Mesh(geo, mat);

            // Halo
            const halo = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
            halo.rotation.x = Math.PI / 2;
            base.add(halo);

            // --- Legendary / Mythical Group 3 ---
        } else if (type === 'Barrier') {
            // Transparent Green Cube
            const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const mat = new THREE.MeshPhongMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6, emissive: 0x002200 });
            base = new THREE.Mesh(geo, mat);

            // Inner Core
            const core = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xccffcc }));
            base.add(core);

        } else if (type === 'Spider') {
            // White Sphere with web patterns
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0xffffff });
            base = new THREE.Mesh(geo, mat);

            // Web lines (Use thin cylinders)
            for (let i = 0; i < 8; i++) {
                const web = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8), new THREE.MeshBasicMaterial({ color: 0xcccccc }));
                web.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                base.add(web);
            }

        } else if (type === 'Phoenix') {
            // Blue/Yellow Flame Bird
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x00BFFF, emissive: 0x0000ff });
            base = new THREE.Mesh(geo, mat);

            // Wings
            const wingGeo = new THREE.BoxGeometry(0.1, 0.4, 0.6);
            const wing1 = new THREE.Mesh(wingGeo, new THREE.MeshPhongMaterial({ color: 0xFFD700 }));
            wing1.position.set(-0.35, 0, 0);
            wing1.rotation.z = 0.5;
            base.add(wing1);

            const wing2 = new THREE.Mesh(wingGeo, new THREE.MeshPhongMaterial({ color: 0xFFD700 }));
            wing2.position.set(0.35, 0, 0);
            wing2.rotation.z = -0.5;
            base.add(wing2);

            // Halo/Flame particles
            for (let i = 0; i < 5; i++) {
                const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
                f.position.set((Math.random() - 0.5) * 0.6, 0.3, (Math.random() - 0.5) * 0.6);
                base.add(f);
            }

        } else if (type === 'Rumble') {
            // Blue Sphere with Lightning
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x00CED1, emissive: 0x008B8B });
            base = new THREE.Mesh(geo, mat);

            // Lightning bolts (ZigZag cylinders or just chaotic cylinders)
            for (let i = 0; i < 4; i++) {
                const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
                bolt.position.setRandom().subScalar(0.5).normalize().multiplyScalar(0.4);
                bolt.lookAt(0, 0, 0);
                bolt.rotation.z += (Math.random() - 0.5); // Messy look
                base.add(bolt);
            }

        } else if (type === 'Paw') {
            // Paw Print Shape
            const geo = new THREE.SphereGeometry(0.3, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0xFFC0CB }); // Pink
            base = new THREE.Mesh(geo, mat);

            // 3 Small toes
            for (let i = 0; i < 3; i++) {
                const toe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat);
                const angle = (i / 3) * Math.PI - Math.PI / 2 + 0.5;
                toe.position.set(Math.cos(angle) * 0.25, 0.25, Math.sin(angle) * 0.25);
                base.add(toe);
            }

        } else if (type === 'Gravity') {
            // Purple Sphere with Rocks
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x9400D3, emissive: 0x4B0082 });
            base = new THREE.Mesh(geo, mat);

            // Orbiting Rocks
            for (let i = 0; i < 5; i++) {
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08), new THREE.MeshLambertMaterial({ color: 0x555555 }));
                const angle = (i / 5) * Math.PI * 2;
                rock.position.set(Math.cos(angle) * 0.5, (Math.random() - 0.5) * 0.4, Math.sin(angle) * 0.5);
                base.add(rock);
            }

        } else if (type === 'Shadow') {
            // Dark mess
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x191970, emissive: 0x000000 });
            base = new THREE.Mesh(geo, mat);

            // Bats/Particles
            for (let i = 0; i < 6; i++) {
                const p = new THREE.Mesh(new THREE.TetrahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                p.position.setRandom().subScalar(0.5).multiplyScalar(0.8);
                base.add(p);
            }

        } else if (type === 'Control') {
            // Pink Room Grid?
            const geo = new THREE.IcosahedronGeometry(0.35, 1);
            const mat = new THREE.MeshBasicMaterial({ color: 0xFFB6C1, wireframe: true, transparent: true, opacity: 0.5 });
            base = new THREE.Mesh(geo, mat);

            // Solid center
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshPhongMaterial({ color: 0xFF69B4 }));
            base.add(core);

        } else if (type === 'Dough') {

            // Torus Shape for Dough
            const geo = new THREE.TorusGeometry(0.3, 0.15, 16, 32);
            const mat = new THREE.MeshPhongMaterial({ color: color, emissive: 0x222222 });
            base = new THREE.Mesh(geo, mat);
            base.rotation.x = Math.PI / 2;
        } else if (type === 'Rubber') {
            // Purple Sphere
            const geo = new THREE.SphereGeometry(0.4, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x9370DB });
            base = new THREE.Mesh(geo, mat);
            // Patterns
            for (let i = 0; i < 6; i++) {
                const p = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 4, 8), new THREE.MeshBasicMaterial({ color: 0x4B0082 }));
                p.position.setRandom().subScalar(0.5).normalize().multiplyScalar(0.4);
                p.lookAt(0, 0, 0);
                base.add(p);
            }
        } else if (type === 'Venom') {
            // Purple Liquid/Spikes
            const geo = new THREE.IcosahedronGeometry(0.4, 0);
            const mat = new THREE.MeshPhongMaterial({ color: 0x800080, emissive: 0x440044 });
            base = new THREE.Mesh(geo, mat);
            // Bubbles
            for (let i = 0; i < 5; i++) {
                const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x9932CC }));
                b.position.setRandom().subScalar(0.5).normalize().multiplyScalar(0.4);
                base.add(b);
            }
            // --- Mythical Group 4 ---
        } else if (type === 'Spirit') {
            // Red/Blue Split
            base = new THREE.Group();
            const m1 = new THREE.MeshPhongMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
            const m2 = new THREE.MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });

            const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI), m1);
            const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16, Math.PI, Math.PI), m2);

            base.add(s1);
            base.add(s2);

            // Spirits around it
            const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff8888 }));
            p1.position.set(-0.4, 0.2, 0);
            base.add(p1);

            const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x8888ff }));
            p2.position.set(0.4, -0.2, 0);
            base.add(p2);

        } else if (type === 'Dragon') {
            // Scaly Ball with Wings/Horns
            const geo = new THREE.DodecahedronGeometry(0.4);
            const mat = new THREE.MeshPhongMaterial({ color: 0xDC143C, wireframe: false }); // Crimson
            base = new THREE.Mesh(geo, mat);

            // Wings
            const wingGeo = new THREE.BoxGeometry(0.05, 0.4, 0.6);
            const w1 = new THREE.Mesh(wingGeo, mat);
            w1.position.set(-0.4, 0.2, 0);
            w1.rotation.z = 0.5;
            base.add(w1);

            const w2 = new THREE.Mesh(wingGeo, mat);
            w2.position.set(0.4, 0.2, 0);
            w2.rotation.z = -0.5;
            base.add(w2);

        } else if (type === 'Leopard') {
            // Spotted Sphere
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshLambertMaterial({ color: 0xD2691E }); // Chocolate
            base = new THREE.Mesh(geo, mat);

            // Spots
            for (let i = 0; i < 8; i++) {
                const spot = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                spot.position.setRandom().subScalar(0.5).normalize().multiplyScalar(0.36);
                spot.lookAt(0, 0, 0);
                base.add(spot);
            }

        } else if (type === 'Kitsune') {
            // 3 Tails (mini) + Fox ears
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0x8B0000 });
            base = new THREE.Mesh(geo, mat);

            // Ears
            const earGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
            const e1 = new THREE.Mesh(earGeo, mat);
            e1.position.set(-0.15, 0.3, 0);
            e1.rotation.z = 0.3;
            base.add(e1);

            const e2 = new THREE.Mesh(earGeo, mat);
            e2.position.set(0.15, 0.3, 0);
            e2.rotation.z = -0.3;
            base.add(e2);

            // Blue Fire particles
            for (let i = 0; i < 5; i++) {
                const f = new THREE.Mesh(new THREE.TetrahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
                f.position.setRandom().subScalar(0.5).normalize().multiplyScalar(0.45);
                base.add(f);
            }

        } else if (type === 'T-Rex') {
            // Green Scaly Oval
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            geo.scale(1, 1.2, 1);
            const mat = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // Olive Green
            base = new THREE.Mesh(geo, mat);

            // Tail
            const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), mat);
            tail.position.set(0, -0.3, -0.3);
            tail.rotation.x = -1;
            base.add(tail);

        } else if (type === 'Mammoth') {
            // Brown furry shape + Tusks
            const geo = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            base = new THREE.Mesh(geo, mat);

            // Tusks
            const tuskGeo = new THREE.TorusGeometry(0.15, 0.03, 4, 8, Math.PI);
            const tuskMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });

            const t1 = new THREE.Mesh(tuskGeo, tuskMat);
            t1.position.set(-0.2, 0, 0.2);
            t1.rotation.set(0, -0.5, -0.5);
            base.add(t1);

            const t2 = new THREE.Mesh(tuskGeo, tuskMat);
            t2.position.set(0.2, 0, 0.2);
            t2.rotation.set(0, 0.5, 0.5);
            base.add(t2);

        } else if (type === 'Gas') {
            // Green gas cloud
            base = new THREE.Group();

            for (let i = 0; i < 6; i++) {
                const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00FF7F, transparent: true, opacity: 0.5 })); // SpringGreen
                c.position.setRandom().subScalar(0.5).multiplyScalar(0.5);
                base.add(c);
            }

            // Already handled
        } else {
            // Default Dodecahedron
            const baseGeo = new THREE.DodecahedronGeometry(0.4);
            const baseMat = new THREE.MeshPhongMaterial({ color: color, emissive: 0x111111 });
            base = new THREE.Mesh(baseGeo, baseMat);
        }

        group.add(base);

        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3);
        const stemMat = new THREE.MeshLambertMaterial({ color: stemColor });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.4;
        group.add(stem);


        return group;
    },

    createGorilla: function () {
        const group = new THREE.Group();
        group.scale.set(1.5, 1.5, 1.5);

        const furColor = 0x5C4033;

        // Use Capsules for Gorilla too?
        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.5), new THREE.MeshLambertMaterial({ color: furColor }));
        body.position.y = 1.2;
        group.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: furColor }));
        head.position.y = 1.8;
        group.add(head);

        // Long Arms
        const armGeo = new THREE.BoxGeometry(0.25, 1.2, 0.25);
        const armMat = new THREE.MeshLambertMaterial({ color: furColor });

        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.6, 1.2, 0);
        leftArm.rotation.z = 0.2;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.6, 1.2, 0);
        rightArm.rotation.z = -0.2;
        group.add(rightArm);

        return group;
    },

    createIceAdmiral: function () {
        const group = new THREE.Group();
        group.scale.set(2.0, 2.0, 2.0);

        const suitColor = 0xeeeeee;
        const iceColor = 0x00ffff;

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0xffccaa }));
        head.position.y = 1.75;
        group.add(head);

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), new THREE.MeshLambertMaterial({ color: suitColor }));
        body.position.y = 1.15;
        group.add(body);

        // Shoulders
        const shoulderGeo = new THREE.BoxGeometry(0.3, 0.1, 0.4);
        const shoulderMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });

        const leftSh = new THREE.Mesh(shoulderGeo, shoulderMat);
        leftSh.position.set(-0.45, 1.5, 0);
        group.add(leftSh);

        const rightSh = new THREE.Mesh(shoulderGeo, shoulderMat);
        rightSh.position.set(0.45, 1.5, 0);
        group.add(rightSh);

        // Arms (Ice)
        const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const armMat = new THREE.MeshPhongMaterial({
            color: iceColor,
            transparent: true,
            opacity: 0.8,
            emissive: 0x0044ff
        });

        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.4, 1.15, 0);
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.4, 1.15, 0);
        group.add(rightArm);

        return group;
    },


    createWeapon: function (type) {
        const group = new THREE.Group();

        if (type === 'Cutlass') {
            // Curved Blade
            const bladeGeo = new THREE.BoxGeometry(0.1, 0.8, 0.05);
            // Bend it? No simple bend modifier. Just rotate segments?
            // Simple straight proxy for now.
            const blade = new THREE.Mesh(bladeGeo, new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 100 }));
            blade.position.y = 0.5;
            group.add(blade);

            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
            group.add(handle);

            const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.1), new THREE.MeshLambertMaterial({ color: 0xFFD700 }));
            guard.position.y = 0.15;
            group.add(guard);

        } else if (type === 'Katana') {
            // Long thin blade
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.02), new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 }));
            blade.position.y = 0.7;
            group.add(blade);

            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), new THREE.MeshLambertMaterial({ color: 0x000000 }));
            group.add(handle);

            // Tsuba (Guard)
            const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02), new THREE.MeshLambertMaterial({ color: 0xB8860B }));
            guard.position.y = 0.15;
            group.add(guard);

        } else if (type === 'Yoru') {
            // Large Black Blade (Cross)
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.05), new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 50 }));
            blade.position.y = 1.0;
            group.add(blade);

            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), new THREE.MeshLambertMaterial({ color: 0x000000 }));
            handle.position.y = -0.1;
            group.add(handle);

            const guard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xD4AF37 }));
            guard.position.y = 0.2;
            group.add(guard);

            // Green gems
            const gem = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            gem.position.set(0, 0.2, 0.05);
            group.add(gem);
        }

        return group;
    },

    createNPC: function (type) {
        if (type === 'Marine') {
            return this.createHumanoid(0xeeeeee, 'Marine');
        } else if (type === 'Pirate') {
            return this.createHumanoid(0xaa0000, 'Pirate');
        } else if (type === 'GorillaKing') {
            return this.createGorilla();
        }
        return this.createHumanoid(0x888888);
    },

    createGorilla: function () {
        const group = new THREE.Group();

        // Fur Material
        const furMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

        // Torso (Large, hunched)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), furMat);
        torso.position.y = 2.0;
        torso.rotation.x = 0.2; // Hunch forward
        group.add(torso);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), furMat);
        head.position.set(0, 2.9, 0.3);
        group.add(head);

        // Face
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), skinMat);
        face.position.set(0, 2.8, 0.61);
        group.add(face);

        // Arms (Long and thick)
        const armGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);

        const leftArm = new THREE.Mesh(armGeo, furMat);
        leftArm.position.set(-1.0, 2.0, 0);
        leftArm.rotation.z = 0.2;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, furMat);
        rightArm.position.set(1.0, 2.0, 0);
        rightArm.rotation.z = -0.2;
        group.add(rightArm);

        // Huge Hands/Fists
        const fistGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const lFist = new THREE.Mesh(fistGeo, skinMat);
        lFist.position.set(0, -1.1, 0);
        leftArm.add(lFist);

        const rFist = new THREE.Mesh(fistGeo, skinMat);
        rFist.position.set(0, -1.1, 0);
        rightArm.add(rFist);

        // Legs (Short)
        const legGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);

        const leftLeg = new THREE.Mesh(legGeo, furMat);
        leftLeg.position.set(-0.4, 0.6, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, furMat);
        rightLeg.position.set(0.4, 0.6, 0);
        group.add(rightLeg);

        // Crown for King
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
        crown.position.set(0, 3.3, 0.3);
        crown.rotation.x = -0.2;
        group.add(crown);

        return group;
    },

    createProceduralTree: function (x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Trunk
        const height = 2.0 + Math.random() * 1.5;
        const radius = 0.3 + Math.random() * 0.2;
        const trunkGeo = new THREE.CylinderGeometry(radius * 0.7, radius, height, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3a22 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = height / 2 + 1.0; // Offset base
        trunk.castShadow = true;
        group.add(trunk);

        // Foliage Clusters
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const clusterCount = 3 + Math.floor(Math.random() * 3); // 3 to 5 clusters

        for (let i = 0; i < clusterCount; i++) {
            const size = 0.8 + Math.random() * 0.6;
            const geo = new THREE.IcosahedronGeometry(size, 0);
            const mesh = new THREE.Mesh(geo, leafMat);

            // Random position around top of trunk
            const yOffset = height + 1.0 + Math.random() * 1.0;
            const xOffset = (Math.random() - 0.5) * 1.5;
            const zOffset = (Math.random() - 0.5) * 1.5;

            mesh.position.set(xOffset, yOffset, zOffset);
            mesh.castShadow = true;
            group.add(mesh);
        }

        return group;
    },

    createTree: function (type = "normal") {
        return this.createProceduralTree(0, 0);
    }
};
