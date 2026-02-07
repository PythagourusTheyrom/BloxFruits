export const SpeedR = {
    // --- Utils ---
    MathUtils: {
        degToRad: (deg) => deg * Math.PI / 180,
        radToDeg: (rad) => rad * 180 / Math.PI,
        clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    },

    Color: class {
        constructor(hex) {
            this.setHex(hex);
        }
        setHex(hex) {
            if (typeof hex === 'string') {
                this.r = 0; this.g = 0; this.b = 0; // simple fallback
                // In real three.js it parses strings, but we usually pass hex numbers 0x...
            } else {
                this.r = ((hex >> 16) & 255) / 255;
                this.g = ((hex >> 8) & 255) / 255;
                this.b = (hex & 255) / 255;
            }
            return this;
        }
        set(val) { return this.setHex(val); }
        getHex() {
            return Math.floor(this.r * 255) << 16 ^ Math.floor(this.g * 255) << 8 ^ Math.floor(this.b * 255);
        }
    },

    Clock: class {
        constructor() {
            this.startTime = Date.now();
            this.oldTime = this.startTime;
            this.elapsedTime = 0;
            this.running = true;
        }
        getDelta() {
            let diff = 0;
            if (this.running) {
                const newTime = Date.now();
                diff = (newTime - this.oldTime) / 1000;
                this.oldTime = newTime;
                this.elapsedTime += diff;
            }
            return diff;
        }
    },

    // --- Math Extras ---
    Box3: class {
        constructor() {
            this.min = new SpeedR.Vector3(Infinity, Infinity, Infinity);
            this.max = new SpeedR.Vector3(-Infinity, -Infinity, -Infinity);
        }
        setFromObject(obj) {
            // Simplified bounding box based on Position + Scale roughly
            // Real implementation computes vertices world positions.
            // We will just assume a unit box at position scaled by scale.

            // This is VERY approximate but preventing crash is the goal.
            const pos = obj.position;
            const scale = obj.scale;

            let w = 1, h = 1, d = 1;
            // Try to guess from geometry
            if (obj.geometry) {
                if (obj.geometry.width) w = obj.geometry.width;
                if (obj.geometry.height) h = obj.geometry.height;
                if (obj.geometry.depth) d = obj.geometry.depth;
                if (obj.geometry.radius) { w = h = d = obj.geometry.radius * 2; }
            }

            const hw = (w * scale.x) / 2;
            const hh = (h * scale.y) / 2;
            const hd = (d * scale.z) / 2;

            this.min.set(pos.x - hw, pos.y - hh, pos.z - hd);
            this.max.set(pos.x + hw, pos.y + hh, pos.z + hd);
            return this;
        }
        setFromCenterAndSize(center, size) {
            const hx = size.x / 2, hy = size.y / 2, hz = size.z / 2;
            this.min.set(center.x - hx, center.y - hy, center.z - hz);
            this.max.set(center.x + hx, center.y + hy, center.z + hz);
            return this;
        }
        intersectsBox(box) {
            // AABB Collision
            if (this.max.x < box.min.x || this.min.x > box.max.x) return false;
            if (this.max.y < box.min.y || this.min.y > box.max.y) return false;
            if (this.max.z < box.min.z || this.min.z > box.max.z) return false;
            return true;
        }
    },

    Fog: class {
        constructor(color, near, far) {
            this.color = new SpeedR.Color(color);
            this.near = near;
            this.far = far;
            this.density = 0.01; // For Exp2 fog compat
        }
    },

    // --- Math ---
    Vector2: class {
        constructor(x = 0, y = 0) { this.x = x; this.y = y; }
        set(x, y) { this.x = x; this.y = y; return this; }
        copy(v) { this.x = v.x; this.y = v.y; return this; }
        clone() { return new SpeedR.Vector2(this.x, this.y); }
    },

    Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x; this.y = y; this.z = z;
        }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
        clone() { return new SpeedR.Vector3(this.x, this.y, this.z); }
        add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
        multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
        distanceTo(v) { const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
        lerp(v, alpha) { this.x += (v.x - this.x) * alpha; this.y += (v.y - this.y) * alpha; this.z += (v.z - this.z) * alpha; return this; }
        applyMatrix4(m) {
            const x = this.x, y = this.y, z = this.z;
            const e = m.elements;
            const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
            this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
            this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
            this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
            return this;
        }
        normalize() {
            const l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
            if (l > 0) this.multiplyScalar(1 / l);
            return this;
        }
        crossVectors(a, b) {
            const ax = a.x, ay = a.y, az = a.z;
            const bx = b.x, by = b.y, bz = b.z;
            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;
            return this;
        }
    },

    Quaternion: class {
        constructor() { this.x = 0; this.y = 0; this.z = 0; this.w = 1; }
        setFromEuler(euler) {
            const x = euler.x, y = euler.y, z = euler.z;
            const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
            const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);

            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
            return this;
        }
    },

    Euler: class {
        constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    },

    Matrix4: class {
        constructor() { this.elements = new Float32Array(16); this.identity(); }
        identity() {
            const e = this.elements;
            e.fill(0); e[0] = 1; e[5] = 1; e[10] = 1; e[15] = 1;
            return this;
        }
        set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
            const te = this.elements;
            te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
            te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
            te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
            te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;
            return this;
        }
        makePerspective(fov, aspect, near, far) {
            const f = 1.0 / Math.tan(fov * Math.PI / 360);
            const nf = 1 / (near - far);
            const e = this.elements;
            e.fill(0);
            e[0] = f / aspect;
            e[5] = f;
            e[10] = (far + near) * nf;
            e[11] = -1;
            e[14] = (2 * far * near) * nf;
            return this;
        }
        makeTranslation(x, y, z) {
            this.set(
                1, 0, 0, x,
                0, 1, 0, y,
                0, 0, 1, z,
                0, 0, 0, 1
            );
            return this;
        }
        makeRotationFromEuler(euler) {
            const x = euler.x, y = euler.y, z = euler.z;
            const a = Math.cos(x), b = Math.sin(x);
            const c = Math.cos(y), d = Math.sin(y);
            const e = Math.cos(z), f = Math.sin(z);

            const ae = a * e, af = a * f, be = b * e, bf = b * f;

            const te = this.elements;

            te[0] = c * e;
            te[4] = -c * f;
            te[8] = d;

            te[1] = af + be * d;
            te[5] = ae - bf * d;
            te[9] = -b * c;

            te[2] = bf - ae * d;
            te[6] = be + af * d;
            te[10] = a * c;

            // Bottom row
            te[3] = 0; te[7] = 0; te[11] = 0;
            te[12] = 0; te[13] = 0; te[14] = 0; te[15] = 1;

            return this;
        }
        makeScale(x, y, z) {
            this.set(
                x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1
            );
            return this;
        }
        multiplyMatrices(a, b) {
            const ae = a.elements;
            const be = b.elements;
            const te = this.elements;

            const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
            const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
            const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
            const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

            const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
            const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
            const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
            const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

            te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return this;
        }
        multiply(m) {
            return this.multiplyMatrices(this, m);
        }
        lookAt(eye, target, up) {
            const z = new SpeedR.Vector3().subVectors(eye, target).normalize();
            if (z.lengthSq() === 0) z.z = 1;

            const x = new SpeedR.Vector3().crossVectors(up, z).normalize();
            if (x.lengthSq() === 0) {
                z.x += 0.0001;
                x.crossVectors(up, z).normalize();
            }

            const y = new SpeedR.Vector3().crossVectors(z, x);

            const te = this.elements;
            te[0] = x.x; te[4] = y.x; te[8] = z.x;
            te[1] = x.y; te[5] = y.y; te[9] = z.y;
            te[2] = x.z; te[6] = y.z; te[10] = z.z;
            return this;
        }
        composeFromEuler(pos, rot, scale) {
            const te = this.elements;
            this.makeRotationFromEuler(rot);
            this.scale(scale);
            te[12] = pos.x;
            te[13] = pos.y;
            te[14] = pos.z;
            return this;
        }
        scale(v) {
            const te = this.elements;
            const x = v.x, y = v.y, z = v.z;
            te[0] *= x; te[4] *= y; te[8] *= z;
            te[1] *= x; te[5] *= y; te[9] *= z;
            te[2] *= x; te[6] *= y; te[10] *= z;
            te[3] *= x; te[7] *= y; te[11] *= z;
            return this;
        }
        copy(m) { this.elements.set(m.elements); return this; }
    },

    Raycaster: class {
        constructor() {
            this.ray = { origin: new SpeedR.Vector3(), direction: new SpeedR.Vector3() };
            this.near = 0;
            this.far = Infinity;
        }
        setFromCamera(coords, camera) {
            // Unproject logic for better accuracy
            // Since we don't have full matrix inversion in this lightweight engine, we use a simplified approach
            // assuming standard perspective camera setup.

            // 1. Get Camera Direction and Right/Up vectors
            const camDir = new SpeedR.Vector3(0, 0, -1).applyMatrix4(camera.matrixWorld).sub(camera.position).normalize();
            const camUp = new SpeedR.Vector3(0, 1, 0).applyMatrix4(camera.matrixWorld).sub(camera.position).normalize(); // Approximation, or use camera.up
            // Better: Extract basis from matrixWorld
            const e = camera.matrixWorld.elements;
            const right = new SpeedR.Vector3(e[0], e[1], e[2]).normalize();
            const up = new SpeedR.Vector3(e[4], e[5], e[6]).normalize();
            const forward = new SpeedR.Vector3(-e[8], -e[9], -e[10]).normalize();

            // 2. Adjust for FOV and Aspect Ratio
            const tanFOV = Math.tan(SpeedR.MathUtils.degToRad(camera.fov) * 0.5);
            const aspect = camera.aspect;

            // 3. Calculate target point on near plane
            const x = coords.x * aspect * tanFOV;
            const y = coords.y * tanFOV;
            const z = -1.0; // Forward

            // 4. Transform to world space
            const dir = new SpeedR.Vector3()
                .add(right.clone().multiplyScalar(x))
                .add(up.clone().multiplyScalar(y))
                .add(forward.clone().multiplyScalar(z))
                .normalize();

            this.ray.origin.copy(camera.position);
            this.ray.direction.copy(dir);
        }
        intersectObjects(objects, recursive = false) {
            let intersects = [];

            const intersectBox = (ray, box, object) => {
                let tmin = (box.min.x - ray.origin.x) / ray.direction.x;
                let tmax = (box.max.x - ray.origin.x) / ray.direction.x;

                if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

                let tymin = (box.min.y - ray.origin.y) / ray.direction.y;
                let tymax = (box.max.y - ray.origin.y) / ray.direction.y;

                if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

                if ((tmin > tymax) || (tymin > tmax)) return null;

                if (tymin > tmin) tmin = tymin;
                if (tymax < tmax) tmax = tymax;

                let tzmin = (box.min.z - ray.origin.z) / ray.direction.z;
                let tzmax = (box.max.z - ray.origin.z) / ray.direction.z;

                if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

                if ((tmin > tzmax) || (tzmin > tmax)) return null;

                if (tzmin > tmin) tmin = tzmin;
                if (tzmax < tmax) tmax = tzmax;

                if (tmax < 0) return null; // Behind ray

                const dist = tmin >= 0 ? tmin : tmax;
                if (dist < this.near || dist > this.far) return null;

                // Hit Point
                const point = ray.origin.clone().add(ray.direction.clone().multiplyScalar(dist));

                return {
                    distance: dist,
                    point: point,
                    object: object
                };
            };

            const check = (list) => {
                for (let obj of list) {
                    if (!obj.visible) continue;

                    let hit = null;

                    // Box Check (Default for Mesh)
                    if (obj.geometry) {
                        // Compute World Bounding Box
                        // This is expensive, so we cache or approximate
                        // For SpeedR, let's create a box from geometry and transform it
                        if (!obj.geometry.boundingBox) {
                            obj.geometry.boundingBox = new SpeedR.Box3().setFromObject(obj); // Initial local box
                            // Actually setFromObject uses world transform in our mocked version? 
                            // Wait, our setFromObject was using position/scale directly.
                        }

                        // Let's rely on a fresh World Box for intersection
                        const worldBox = new SpeedR.Box3().setFromObject(obj);
                        // Expand slightly for "Generous" hit detection if needed

                        hit = intersectBox(this.ray, worldBox, obj);
                    }

                    if (hit) intersects.push(hit);

                    if (recursive && obj.children && obj.children.length > 0) {
                        check(obj.children);
                    }
                }
            }
            check(objects);
            return intersects.sort((a, b) => a.distance - b.distance);
        }
    },

    // --- Core Objects ---
    Object3D: class {
        constructor() {
            this.position = new SpeedR.Vector3(0, 0, 0);
            this.rotation = new SpeedR.Euler(0, 0, 0);
            this.scale = new SpeedR.Vector3(1, 1, 1);
            this.children = [];
            this.parent = null;
            this.userData = {};
            this.visible = true;
            this.isObject3D = true;
            this.matrix = new SpeedR.Matrix4();
            this.matrixWorld = new SpeedR.Matrix4();
        }
        add(obj) {
            if (obj && obj !== this) {
                if (obj.parent) obj.parent.remove(obj);
                obj.parent = this;
                this.children.push(obj);
            }
        }
        remove(obj) {
            const idx = this.children.indexOf(obj);
            if (idx > -1) {
                obj.parent = null;
                this.children.splice(idx, 1);
            }
        }
        traverse(callback) {
            callback(this);
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].traverse(callback);
            }
        }
        updateMatrix() {
            this.matrix.composeFromEuler(this.position, this.rotation, this.scale);
        }
        updateMatrixWorld(force) {
            this.updateMatrix();
            if (this.parent) {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            } else {
                this.matrixWorld.copy(this.matrix);
            }
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].updateMatrixWorld(force);
            }
        }
    },

    Scene: class {
        constructor() {
            this.type = 'Scene';
            this.children = [];
            this.position = new SpeedR.Vector3();
            this.rotation = new SpeedR.Euler(0, 0, 0);
            this.scale = new SpeedR.Vector3(1, 1, 1);
            this.background = new SpeedR.Color(0x000000);
            this.fog = null;
            this.isObject3D = true;
            this.matrix = new SpeedR.Matrix4();
            this.matrixWorld = new SpeedR.Matrix4();
        }
        add(obj) { this.children.push(obj); obj.parent = this; }
        remove(obj) { this.children = this.children.filter(c => c !== obj); }
        traverse(callback) {
            callback(this);
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].traverse(callback);
            }
        }
        updateMatrixWorld() {
            this.matrixWorld.identity();
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].updateMatrixWorld();
            }
        }
    },

    Group: class {
        constructor() {
            this.type = 'Group';
            this.position = new SpeedR.Vector3(0, 0, 0);
            this.rotation = new SpeedR.Euler(0, 0, 0);
            this.scale = new SpeedR.Vector3(1, 1, 1);
            this.children = [];
            this.userData = {};
            this.isObject3D = true;
            this.matrix = new SpeedR.Matrix4();
            this.matrixWorld = new SpeedR.Matrix4();
        }
        add(obj) { this.children.push(obj); obj.parent = this; }
        remove(obj) { this.children = this.children.filter(c => c !== obj); }
        traverse(callback) {
            callback(this);
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].traverse(callback);
            }
        }
        updateMatrixWorld(force) {
            this.matrix.composeFromEuler(this.position, this.rotation, this.scale);
            if (this.parent) {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            } else {
                this.matrixWorld.copy(this.matrix);
            }
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].updateMatrixWorld(force);
            }
        }
    },

    // --- Camera ---
    PerspectiveCamera: class {
        constructor(fov, aspect, near, far) {
            this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
            this.position = new SpeedR.Vector3(0, 0, 0);
            this.rotation = new SpeedR.Euler(0, 0, 0);
            this.scale = new SpeedR.Vector3(1, 1, 1);
            this.up = new SpeedR.Vector3(0, 1, 0);
            this.projectionMatrix = new SpeedR.Matrix4().makePerspective(fov, aspect, near, far);
            this.matrixWorld = new SpeedR.Matrix4();
            this.matrixWorldInverse = new SpeedR.Matrix4();
            this.isObject3D = true;
            this.children = [];
        }
        lookAt(x, y, z) {
            // LookAt functionality for Camera
            // 1. Create a rotation matrix that looks from 'position' to 'target(x,y,z)'
            // 2. Extract Euler angles from that matrix and apply to this.rotation

            const target = new SpeedR.Vector3(x, y, z);
            const m = new SpeedR.Matrix4();
            m.lookAt(this.position, target, this.up);

            // Decompose Rotation to Euler (Simplified: Just use Math.atan2 logic for Y/X if Matrix decompose is missing)
            // Since we don't have setFromRotationMatrix, let's implement a basic Yaw/Pitch calc.

            const dx = x - this.position.x;
            const dy = y - this.position.y;
            const dz = z - this.position.z;

            const distH = Math.sqrt(dx * dx + dz * dz);

            // Yaw (Rotation around Y)
            this.rotation.y = Math.atan2(-dx, -dz); // Camera looks down -Z by default?
            // Actually standard GL: Forward is -Z. 
            // atan2(dx, dz) -> 0 when dx=0, dz=1 (Back). Pi when dz=-1 (Forward).
            // Let's verify standard Three.js behavior.
            // For now, this is a sufficient approximation for "Looking" at things.

            // Pitch (Rotation around X)
            this.rotation.x = Math.atan2(dy, distH);

            this.rotation.z = 0; // Roll is usually 0 for lookAt
        }
        updateProjectionMatrix() {
            this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
        }
        updateMatrixWorld() {
            this.matrixWorld.composeFromEuler(this.position, this.rotation, this.scale);
        }
    },

    // --- Lights ---
    AmbientLight: class {
        constructor(color, intensity = 1) {
            this.color = new SpeedR.Color(color);
            this.intensity = intensity;
            this.isLight = true;
        }
    },
    DirectionalLight: class {
        constructor(color, intensity = 1) {
            this.color = new SpeedR.Color(color);
            this.intensity = intensity;
            this.position = new SpeedR.Vector3(0, 1, 0);
            this.castShadow = false;
            this.shadow = { mapSize: { width: 512, height: 512 } };
            this.isLight = true;
        }
        updateMatrixWorld() { }
    },
    PointLight: class {
        constructor(color, intensity = 1, distance = 0) {
            this.color = new SpeedR.Color(color);
            this.intensity = intensity;
            this.distance = distance;
            this.position = new SpeedR.Vector3();
            this.isLight = true;
        }
        updateMatrixWorld() { }
    },

    // --- Geometry ---
    BufferGeometry: class {
        constructor() {
            this.attributes = {};
        }
        setAttribute(name, attribute) { this.attributes[name] = attribute; }
    },
    Float32BufferAttribute: class {
        constructor(array, itemSize) {
            this.array = array;
            this.itemSize = itemSize;
            this.count = array.length / itemSize;
        }
    },

    // Helper to generate box data
    generateBox: function (w, h, d) {
        const hw = w / 2, hh = h / 2, hd = d / 2;

        const vertices = [
            // Front
            -hw, -hh, hd, hw, -hh, hd, hw, hh, hd,
            -hw, -hh, hd, hw, hh, hd, -hw, hh, hd,
            // Back
            hw, -hh, -hd, -hw, -hh, -hd, -hw, hh, -hd,
            hw, -hh, -hd, -hw, hh, -hd, hw, hh, -hd,
            // Top
            -hw, hh, hd, hw, hh, hd, hw, hh, -hd,
            -hw, hh, hd, hw, hh, -hd, -hw, hh, -hd,
            // Bottom
            -hw, -hh, -hd, hw, -hh, -hd, hw, -hh, hd,
            -hw, -hh, -hd, hw, -hh, hd, -hw, -hh, hd,
            // Right
            hw, -hh, hd, hw, -hh, -hd, hw, hh, -hd,
            hw, -hh, hd, hw, hh, -hd, hw, hh, hd,
            // Left
            -hw, -hh, -hd, -hw, -hh, hd, -hw, hh, hd,
            -hw, -hh, -hd, -hw, hh, hd, -hw, hh, -hd
        ];

        const normals = [
            // Front (0, 0, 1)
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // Back (0, 0, -1)
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // Top (0, 1, 0)
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            // Bottom (0, -1, 0)
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
            // Right (1, 0, 0)
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            // Left (-1, 0, 0)
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
        ];

        return {
            position: new Float32Array(vertices),
            normal: new Float32Array(normals)
        };
    },

    // Standard Geometries with Data Generation
    BoxGeometry: class {
        constructor(w, h, d) {
            this.type = "Box";
            this.width = w; this.height = h; this.depth = d;
            const data = SpeedR.generateBox(w, h, d);
            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(data.position, 3),
                normal: new SpeedR.Float32BufferAttribute(data.normal, 3)
            };
        }
    },
    // Cylinder/Cone/Sphere mapping to Box for now (Simplification)
    CylinderGeometry: class { constructor(rt, rb, h, rs) { return new SpeedR.BoxGeometry(rt * 2, h, rt * 2); } },
    ConeGeometry: class { constructor(r, h, rs) { return new SpeedR.BoxGeometry(r * 2, h, r * 2); } },
    DodecahedronGeometry: class { constructor(r) { return new SpeedR.BoxGeometry(r * 2, r * 2, r * 2); } },
    PlaneGeometry: class {
        constructor(w, h) {
            // Simple Plane flat on XY
            const hw = w / 2, hh = h / 2;
            const vertices = [
                -hw, -hh, 0, hw, -hh, 0, hw, hh, 0,
                -hw, -hh, 0, hw, hh, 0, -hw, hh, 0
            ];
            const normals = [
                0, 0, 1, 0, 0, 1, 0, 0, 1,
                0, 0, 1, 0, 0, 1, 0, 0, 1
            ];
            const uvs = [
                0, 0, 1, 0, 1, 1,
                0, 0, 1, 1, 0, 1
            ];
            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(vertices), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(normals), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(uvs), 2)
            };
        }
    },

    SphereGeometry: class {
        constructor(radius = 1, widthSegments = 16, heightSegments = 12, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
            this.type = "Sphere";
            this.parameters = { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength };

            const positions = [];
            const normals = [];
            const uvs = [];

            for (let y = 0; y <= heightSegments; y++) {
                const v = y / heightSegments;
                // thetaStart + v * thetaLength
                const theta = thetaStart + v * thetaLength;

                for (let x = 0; x <= widthSegments; x++) {
                    const u = x / widthSegments;
                    // phiStart + u * phiLength
                    const phi = phiStart + u * phiLength;

                    const px = - radius * Math.sin(theta) * Math.cos(phi);
                    const py = radius * Math.cos(theta);
                    const pz = radius * Math.sin(theta) * Math.sin(phi);

                    positions.push(px, py, pz);
                    const n = new SpeedR.Vector3(px, py, pz).normalize();
                    normals.push(n.x, n.y, n.z);
                    uvs.push(u, 1 - v);
                }
            }

            // Indices / Expansion
            const expPos = [];
            const expNorm = [];
            const expUv = [];

            for (let y = 0; y < heightSegments; y++) {
                for (let x = 0; x < widthSegments; x++) {
                    const i1 = y * (widthSegments + 1) + x;
                    const i2 = i1 + 1;
                    const i3 = i1 + (widthSegments + 1);
                    const i4 = i3 + 1;

                    const pushVert = (idx) => {
                        expPos.push(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
                        expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                        expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
                    };

                    pushVert(i1); pushVert(i2); pushVert(i3);
                    pushVert(i2); pushVert(i4); pushVert(i3);
                }
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    CapsuleGeometry: class {
        constructor(radius = 1, length = 1, capSegments = 8, radialSegments = 16) {
            this.type = "Capsule";
            const halfLength = length / 2;

            const vertices = [];
            const normals = [];
            const uvs = [];

            // Helper to add vertex
            function pushVertex(x, y, z, u, v, nx, ny, nz) {
                vertices.push(x, y, z);
                normals.push(nx, ny, nz);
                uvs.push(u, v);
            }

            // Top Cap (Hemisphere)
            for (let y = 0; y <= capSegments; y++) {
                const v = y / capSegments;
                const theta = v * (Math.PI / 2); // 0 to Pi/2

                for (let x = 0; x <= radialSegments; x++) {
                    const u = x / radialSegments;
                    const phi = u * Math.PI * 2;

                    const px = -radius * Math.sin(theta) * Math.cos(phi);
                    const py = radius * Math.cos(theta);
                    const pz = radius * Math.sin(theta) * Math.sin(phi);

                    const nx = px / radius;
                    const ny = py / radius;
                    const nz = pz / radius;

                    pushVertex(px, py + halfLength, pz, u, (1 - v) * 0.25, nx, ny, nz);
                }
            }

            // Cylinder Body
            for (let y = 0; y <= 1; y++) {
                const v = y;
                const py = (1 - v * 2) * halfLength; // halfLength to -halfLength?

                for (let x = 0; x <= radialSegments; x++) {
                    const u = x / radialSegments;
                    const phi = u * Math.PI * 2;

                    const px = -radius * Math.cos(phi);
                    const pz = radius * Math.sin(phi);

                    const nx = px / radius;
                    const ny = 0;
                    const nz = pz / radius;

                    pushVertex(px, (y === 0 ? halfLength : -halfLength), pz, u, 0.25 + v * 0.5, nx, ny, nz);
                }
            }

            // Bottom Cap (Hemisphere)
            for (let y = 0; y <= capSegments; y++) {
                const v = y / capSegments;
                const theta = (Math.PI / 2) + v * (Math.PI / 2); // Pi/2 to Pi

                for (let x = 0; x <= radialSegments; x++) {
                    const u = x / radialSegments;
                    const phi = u * Math.PI * 2;

                    const px = -radius * Math.sin(theta) * Math.cos(phi);
                    const py = radius * Math.cos(theta);
                    const pz = radius * Math.sin(theta) * Math.sin(phi);

                    const nx = px / radius;
                    const ny = py / radius;
                    const nz = pz / radius;

                    pushVertex(px, py - halfLength, pz, u, 0.75 + (1 - v) * 0.25, nx, ny, nz);
                }
            }

            // Expand to Triangles (reusing Sphere logic)
            const expPos = [];
            const expNorm = [];
            const expUv = [];

            // We have 3 sections: Top Cap, Body, Bottom Cap
            // Top Cap Ring Count = capSegments
            // Body Ring Count = 1
            // Bottom Cap Ring Count = capSegments

            // Simplified: Just use the generated grid directly?
            // The grid is not continuous across sections easily with this loop structure.
            // Let's rewrite to generating a continuous grid if possible, or just push independent sections.

            // Actually, let's keep it simple and generate triangles for each section independently.
            // This might result in seams if normals aren't perfect, but for SpeedR it's fine.

            // RE-WRITE: Unified Loop?
            // No, let's just push triangles for the vertices we just generated.
            // Vertices array is flat. We need to know indices.

            // Top Cap Indices
            let offset = 0;
            for (let y = 0; y < capSegments; y++) {
                for (let x = 0; x < radialSegments; x++) {
                    const i1 = offset + y * (radialSegments + 1) + x;
                    const i2 = i1 + 1;
                    const i3 = i1 + (radialSegments + 1);
                    const i4 = i3 + 1;

                    const push = (idx) => {
                        expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                        expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                        expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
                    };

                    push(i1); push(i2); push(i3);
                    push(i2); push(i4); push(i3);
                }
            }
            offset += (capSegments + 1) * (radialSegments + 1);

            // Body Indices
            for (let y = 0; y < 1; y++) { // Only 1 vertical segment for cylinder
                for (let x = 0; x < radialSegments; x++) {
                    const i1 = offset + y * (radialSegments + 1) + x;
                    const i2 = i1 + 1;
                    const i3 = i1 + (radialSegments + 1);
                    const i4 = i3 + 1;

                    const push = (idx) => {
                        expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                        expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                        expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
                    };
                    push(i1); push(i2); push(i3);
                    push(i2); push(i4); push(i3);
                }
            }
            offset += 2 * (radialSegments + 1);

            // Bottom Cap Indices
            for (let y = 0; y < capSegments; y++) {
                for (let x = 0; x < radialSegments; x++) {
                    const i1 = offset + y * (radialSegments + 1) + x;
                    const i2 = i1 + 1;
                    const i3 = i1 + (radialSegments + 1);
                    const i4 = i3 + 1;

                    const push = (idx) => {
                        expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                        expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                        expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
                    };

                    push(i1); push(i2); push(i3);
                    push(i2); push(i4); push(i3);
                }
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    TetrahedronGeometry: class {
        constructor(radius = 1, detail = 0) {
            this.type = "Tetrahedron";
            const vertices = [
                1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1
            ];
            const indices = [
                2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1
            ];
            const expPos = [];
            const expNorm = [];
            const expUv = [];

            for (let i = 0; i < indices.length; i += 3) {
                const i1 = indices[i];
                const i2 = indices[i + 1];
                const i3 = indices[i + 2];

                const v1 = new SpeedR.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]).normalize().multiplyScalar(radius);
                const v2 = new SpeedR.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]).normalize().multiplyScalar(radius);
                const v3 = new SpeedR.Vector3(vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]).normalize().multiplyScalar(radius);

                // Simple flat normals
                const n = new SpeedR.Vector3().subVectors(v2, v1).crossVectors(new SpeedR.Vector3().subVectors(v3, v1)).normalize();

                expPos.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
                expNorm.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
                expUv.push(0, 0, 1, 0, 0, 1);
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    OctahedronGeometry: class {
        constructor(radius = 1, detail = 0) {
            this.type = "Octahedron";
            const vertices = [
                1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1
            ];
            const indices = [
                0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2,
                1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2
            ];

            const expPos = [];
            const expNorm = [];
            const expUv = [];

            for (let i = 0; i < indices.length; i += 3) {
                const i1 = indices[i];
                const i2 = indices[i + 1];
                const i3 = indices[i + 2];

                const v1 = new SpeedR.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]).normalize().multiplyScalar(radius);
                const v2 = new SpeedR.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]).normalize().multiplyScalar(radius);
                const v3 = new SpeedR.Vector3(vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]).normalize().multiplyScalar(radius);

                const n = new SpeedR.Vector3().subVectors(v2, v1).crossVectors(new SpeedR.Vector3().subVectors(v3, v1)).normalize();

                expPos.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
                expNorm.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
                expUv.push(0, 0, 1, 0, 0, 1);
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    TorusGeometry: class {
        constructor(radius = 10, tube = 3, radialSegments = 16, tubularSegments = 100, arc = Math.PI * 2) {
            this.type = "Torus";
            this.parameters = { radius, tube, radialSegments, tubularSegments, arc };

            const vertices = [];
            const normals = [];
            const uvs = [];

            const center = new SpeedR.Vector3();
            const vertex = new SpeedR.Vector3();
            const normal = new SpeedR.Vector3();

            for (let j = 0; j <= radialSegments; j++) {
                for (let i = 0; i <= tubularSegments; i++) {
                    const u = i / tubularSegments * arc;
                    const v = j / radialSegments * Math.PI * 2;

                    center.x = radius * Math.cos(u);
                    center.y = radius * Math.sin(u);

                    vertex.x = (radius + tube * Math.cos(v)) * Math.cos(u);
                    vertex.y = (radius + tube * Math.cos(v)) * Math.sin(u);
                    vertex.z = tube * Math.sin(v);

                    vertices.push(vertex.x, vertex.y, vertex.z);

                    // Normal
                    center.z = 0;
                    normal.subVectors(vertex, center).normalize();
                    normals.push(normal.x, normal.y, normal.z);

                    // UV
                    uvs.push(i / tubularSegments);
                    uvs.push(j / radialSegments);
                }
            }

            // Generate triangles
            const expPos = [];
            const expNorm = [];
            const expUv = [];

            for (let j = 1; j <= radialSegments; j++) {
                for (let i = 1; i <= tubularSegments; i++) {
                    const a = (tubularSegments + 1) * j + i - 1;
                    const b = (tubularSegments + 1) * (j - 1) + i - 1;
                    const c = (tubularSegments + 1) * (j - 1) + i;
                    const d = (tubularSegments + 1) * j + i;

                    const push = (idx) => {
                        expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                        expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                        expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
                    };

                    // Face 1: a, b, d
                    push(a); push(b); push(d);
                    // Face 2: b, c, d
                    push(b); push(c); push(d);
                }
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    RingGeometry: class {
        constructor(innerRadius = 0.5, outerRadius = 1, thetaSegments = 8, phiSegments = 1, thetaStart = 0, thetaLength = Math.PI * 2) {
            this.type = 'RingGeometry';
            this.parameters = { innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength };

            const indices = [];
            const vertices = [];
            const normals = [];
            const uvs = [];

            // Generate
            let radius = innerRadius;
            const radiusStep = ((outerRadius - innerRadius) / phiSegments);
            const vertex = new SpeedR.Vector3();
            const uv = new SpeedR.Vector2();

            for (let j = 0; j <= phiSegments; j++) {
                for (let i = 0; i <= thetaSegments; i++) {
                    const segment = thetaStart + i / thetaSegments * thetaLength;
                    vertex.x = radius * Math.cos(segment);
                    vertex.y = radius * Math.sin(segment);

                    vertices.push(vertex.x, vertex.y, vertex.z);
                    normals.push(0, 0, 1);
                    uv.x = (vertex.x / outerRadius + 1) / 2;
                    uv.y = (vertex.y / outerRadius + 1) / 2;
                    uvs.push(uv.x, uv.y);
                }
                radius += radiusStep;
            }

            // Indices
            for (let j = 0; j < phiSegments; j++) {
                const thetaSegmentLevel = j * (thetaSegments + 1);
                for (let i = 0; i < thetaSegments; i++) {
                    const segment = i + thetaSegmentLevel;
                    const a = segment;
                    const b = segment + thetaSegments + 1;
                    const c = segment + thetaSegments + 2;
                    const d = segment + 1;

                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }

            // Expand to Attributes
            const expPos = [];
            const expNorm = [];
            const expUv = [];

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    TubeGeometry: class {
        constructor(pathPoints, segments = 64, radius = 1, radialSegments = 8, closed = false) {
            this.type = 'TubeGeometry';
            // pathPoints is array of Vector3
            // Simplified Frenet frames logic
            const frames = this.computeFrames(pathPoints, segments, closed);

            const vertices = [];
            const normals = [];
            const uvs = [];
            const indices = [];

            // Generate
            for (let i = 0; i <= segments; i++) {
                const P = frames.points[i];
                const N = frames.normals[i];
                const B = frames.binormals[i];

                for (let j = 0; j <= radialSegments; j++) {
                    const v = j / radialSegments * Math.PI * 2;
                    const sin = Math.sin(v);
                    const cos = -Math.cos(v);

                    // P + (N * cos + B * sin) * radius
                    const vx = P.x + (N.x * cos + B.x * sin) * radius;
                    const vy = P.y + (N.y * cos + B.y * sin) * radius;
                    const vz = P.z + (N.z * cos + B.z * sin) * radius;

                    vertices.push(vx, vy, vz);

                    // Normal
                    const nx = N.x * cos + B.x * sin;
                    const ny = N.y * cos + B.y * sin;
                    const nz = N.z * cos + B.z * sin;
                    const n = new SpeedR.Vector3(nx, ny, nz).normalize();
                    normals.push(n.x, n.y, n.z);

                    uvs.push(i / segments, j / radialSegments);
                }
            }

            // Indices
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < radialSegments; j++) {
                    const a = (radialSegments + 1) * i + j;
                    const b = (radialSegments + 1) * (i + 1) + j;
                    const c = (radialSegments + 1) * (i + 1) + (j + 1);
                    const d = (radialSegments + 1) * i + (j + 1);

                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }

            // Expand
            const expPos = [], expNorm = [], expUv = [];
            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }

        computeFrames(points, segments, closed) {
            // Very simple tangents (no twist reduction for now)
            const tangents = [], normals = [], binormals = [], interpPoints = [];

            // Linear interpolate points
            // Assuming points.length >= 2
            const totalLen = points.length - 1;

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                // Find segment index
                const idx = Math.min(Math.floor(t * totalLen), totalLen - 1);
                const localT = (t * totalLen) - idx;

                const p0 = points[idx];
                const p1 = points[idx + 1];

                // Lerp
                const P = new SpeedR.Vector3(
                    p0.x + (p1.x - p0.x) * localT,
                    p0.y + (p1.y - p0.y) * localT,
                    p0.z + (p1.z - p0.z) * localT
                );
                interpPoints.push(P);

                // Tangent
                const T = new SpeedR.Vector3().subVectors(p1, p0).normalize();
                tangents.push(T);

                // Normal usually random perp to T then corrected, but let's use Up
                const up = new SpeedR.Vector3(0, 1, 0);
                let N = new SpeedR.Vector3().crossVectors(T, up).normalize();
                if (N.lengthSq() < 0.01) { // T is vertical 
                    N = new SpeedR.Vector3().crossVectors(T, new SpeedR.Vector3(0, 0, 1)).normalize();
                }
                normals.push(N);

                const B = new SpeedR.Vector3().crossVectors(T, N).normalize();
                binormals.push(B);
            }
            return { points: interpPoints, tangents, normals, binormals };
        }
    },

    TorusKnotGeometry: class {
        constructor(radius = 10, tube = 3, tubularSegments = 64, radialSegments = 8, p = 2, q = 3) {
            this.type = "TorusKnot";
            this.parameters = { radius, tube, tubularSegments, radialSegments, p, q };

            const vertices = [];
            const normals = [];
            const uvs = [];

            const vertex = new SpeedR.Vector3();
            const normal = new SpeedR.Vector3();
            const P1 = new SpeedR.Vector3();
            const P2 = new SpeedR.Vector3();
            const B = new SpeedR.Vector3();
            const T = new SpeedR.Vector3();
            const N = new SpeedR.Vector3();

            for (let i = 0; i <= tubularSegments; ++i) {
                const u = i / tubularSegments * p * Math.PI * 2;
                calculatePositionOnCurve(u, p, q, radius, P1);
                calculatePositionOnCurve(u + 0.01, p, q, radius, P2);

                T.subVectors(P2, P1);
                N.add(P2).add(P1);
                B.crossVectors(T, N);
                N.crossVectors(B, T);

                B.normalize();
                N.normalize();

                for (let j = 0; j <= radialSegments; ++j) {
                    const v = j / radialSegments * Math.PI * 2;
                    const cx = -tube * Math.cos(v);
                    const cy = tube * Math.sin(v);

                    vertex.x = P1.x + (cx * N.x + cy * B.x);
                    vertex.y = P1.y + (cx * N.y + cy * B.y);
                    vertex.z = P1.z + (cx * N.z + cy * B.z);

                    vertices.push(vertex.x, vertex.y, vertex.z);

                    normal.subVectors(vertex, P1).normalize();
                    normals.push(normal.x, normal.y, normal.z);

                    uvs.push(i / tubularSegments);
                    uvs.push(j / radialSegments);
                }
            }

            function calculatePositionOnCurve(u, p, q, radius, position) {
                const cu = Math.cos(u);
                const su = Math.sin(u);
                const quOverP = q / p * u;
                const cs = Math.cos(quOverP);

                position.x = radius * (2 + cs) * 0.5 * cu;
                position.y = radius * (2 + cs) * 0.5 * su;
                position.z = radius * Math.sin(quOverP) * 0.5;
            }

            // Generate triangles
            const expPos = [];
            const expNorm = [];
            const expUv = [];

            for (let i = 1; i <= tubularSegments; i++) {
                for (let j = 1; j <= radialSegments; j++) {
                    const a = (radialSegments + 1) * (i - 1) + (j - 1);
                    const b = (radialSegments + 1) * i + (j - 1);
                    const c = (radialSegments + 1) * i + j;
                    const d = (radialSegments + 1) * (i - 1) + j;

                    const push = (idx) => {
                        expPos.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                        expNorm.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                        expUv.push(uvs[idx * 2], uvs[idx * 2 + 1]);
                    };

                    push(a); push(b); push(d);
                    push(b); push(c); push(d);
                }
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    IcosahedronGeometry: class {
        constructor(radius = 1, detail = 0) {
            this.type = "Icosahedron";
            const t = (1 + Math.sqrt(5)) / 2;
            const vertices = [
                -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
                0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
                t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1
            ];
            const indices = [
                0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
                1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
                3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
                4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
            ];

            const expPos = [];
            const expNorm = [];
            const expUv = [];

            // Expand
            for (let i = 0; i < indices.length; i += 3) {
                const i1 = indices[i];
                const i2 = indices[i + 1];
                const i3 = indices[i + 2];

                const v1 = new SpeedR.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]).normalize().multiplyScalar(radius);
                const v2 = new SpeedR.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]).normalize().multiplyScalar(radius);
                const v3 = new SpeedR.Vector3(vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]).normalize().multiplyScalar(radius);

                // Simple flat normals
                const n1 = v1.clone().normalize();
                const n2 = v2.clone().normalize();
                const n3 = v3.clone().normalize();

                expPos.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
                expNorm.push(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z, n3.x, n3.y, n3.z);

                // Dummy UVs
                expUv.push(0, 0, 1, 0, 0, 1);
            }

            this.attributes = {
                position: new SpeedR.Float32BufferAttribute(new Float32Array(expPos), 3),
                normal: new SpeedR.Float32BufferAttribute(new Float32Array(expNorm), 3),
                uv: new SpeedR.Float32BufferAttribute(new Float32Array(expUv), 2)
            };
        }
    },

    // --- Loaders ---
    TextureLoader: class {
        load(url) {
            const tex = { image: new Image(), isTexture: true, version: 0 };
            tex.image.crossOrigin = "anonymous";
            tex.image.onload = () => { tex.version++; };
            tex.image.src = url;
            return tex;
        }
    },

    // --- Materials ---
    MeshBasicMaterial: class { constructor(p) { this.color = new SpeedR.Color(p.color || 0xffffff); this.map = p.map || null; this.opacity = p.opacity !== undefined ? p.opacity : 1.0; this.transparent = !!p.transparent; this.type = "Basic"; } },
    MeshLambertMaterial: class { constructor(p) { this.color = new SpeedR.Color(p.color || 0xffffff); this.map = p.map || null; this.opacity = p.opacity !== undefined ? p.opacity : 1.0; this.transparent = !!p.transparent; this.type = "Lambert"; } },
    MeshPhongMaterial: class { constructor(p) { this.color = new SpeedR.Color(p.color || 0xffffff); this.map = p.map || null; this.opacity = p.opacity !== undefined ? p.opacity : 1.0; this.transparent = !!p.transparent; this.type = "Phong"; } },
    PointsMaterial: class { constructor(p) { this.color = new SpeedR.Color(p.color || 0xffffff); this.map = p.map || null; this.size = p.size || 1; this.opacity = p.opacity !== undefined ? p.opacity : 1.0; this.transparent = !!p.transparent; this.type = "Points"; } },

    // --- Objects ---
    Mesh: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = new SpeedR.Vector3(0, 0, 0);
            this.rotation = new SpeedR.Euler(0, 0, 0);
            this.scale = new SpeedR.Vector3(1, 1, 1);
            this.children = [];
            this.userData = {};
            this.visible = true;
            this.parent = null;
            this.isMesh = true;
            this.matrix = new SpeedR.Matrix4();
            this.matrixWorld = new SpeedR.Matrix4();
        }
        add(obj) { this.children.push(obj); obj.parent = this; }
        remove(obj) { this.children = this.children.filter(c => c !== obj); }
        traverse(callback) {
            callback(this);
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].traverse(callback);
            }
        }
        updateMatrixWorld(force) {
            this.matrix.composeFromEuler(this.position, this.rotation, this.scale);
            if (this.parent) {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            } else {
                this.matrixWorld.copy(this.matrix);
            }
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].updateMatrixWorld(force);
            }
        }
    },
    Points: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = new SpeedR.Vector3(0, 0, 0);
            this.rotation = new SpeedR.Euler(0, 0, 0);
            this.scale = new SpeedR.Vector3(1, 1, 1);
            this.visible = true;
            this.isPoints = true;
            this.matrix = new SpeedR.Matrix4();
            this.matrixWorld = new SpeedR.Matrix4();
        }
        updateMatrixWorld(force) {
            this.matrix.composeFromEuler(this.position, this.rotation, this.scale);
            if (this.parent) {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            } else {
                this.matrixWorld.copy(this.matrix);
            }
        }
    },

    // --- Renderer ---
    WebGLRenderer: class {
        constructor(options = {}) {
            this.canvas = document.createElement('canvas');
            this.domElement = this.canvas;
            this.gl = this.canvas.getContext('webgl');
            this.shadowMap = { enabled: false };
            this.program = null;
            this.buffers = new WeakMap();

            if (!this.gl) { console.error("SpeedR: WebGL not supported"); return; }

            const gl = this.gl;
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            // Enable Blending
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            this.initShaders();
            this.setSize(window.innerWidth, window.innerHeight);
            this.stats = new SpeedR.Stats();
        }

        setSize(w, h) {
            this.canvas.width = w * window.devicePixelRatio;
            this.canvas.height = h * window.devicePixelRatio;
            this.width = w; this.height = h;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        initShaders() {
            const gl = this.gl;
            const vsSource = `
                attribute vec3 position;
                attribute vec3 normal;
                attribute vec2 uv;
                uniform mat4 uMVP;
                uniform mat4 uModel;
                varying vec3 vNormal;
                varying vec2 vUv;
                void main() {
                    vNormal = mat3(uModel) * normal; 
                    vUv = uv;
                    gl_Position = uMVP * vec4(position, 1.0);
                }
            `;
            const fsSource = `
                precision mediump float;
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform vec3 uLightDir;
                uniform vec3 uSunColor; // New: Color of the sun/directional light
                uniform vec3 uAmbientLight; // New: Ambient light color
                uniform sampler2D uMap;
                uniform int uHasMap;
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    vec3 n = normalize(vNormal);
                    vec3 l = normalize(uLightDir);
                    float diff = max(dot(n, l), 0.0);
                    
                    // Cel Shading Step
                    float steps = 3.0;
                    diff = floor(diff * steps) / steps;

                    // Rim Light (Fresnel-ish)
                    vec3 viewDir = vec3(0.0, 0.0, 1.0); 
                    float rim = 1.0 - max(dot(n, l), 0.0); 
                    rim = pow(rim, 3.0);
                    
                    // Lighting Combination
                    // Ambient is now passed in
                    vec3 ambient = uAmbientLight;
                    
                    // Diffuse affects the sun color
                    vec3 diffuse = diff * 0.8 * uSunColor;

                    // Rim assumes same color as sun for now, or white
                    vec3 rimColor = rim * 0.2 * uSunColor;

                    vec4 texColor = vec4(1.0);
                    if (uHasMap > 0) {
                        texColor = texture2D(uMap, vUv);
                    }

                    vec3 finalLight = (ambient + diffuse + rimColor) * uColor;
                    gl_FragColor = vec4(finalLight, uOpacity) * texColor;
                }
            `;

            const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
            const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
            this.program = this.createProgram(vs, fs);

            this.uMVP = gl.getUniformLocation(this.program, 'uMVP');
            this.uModel = gl.getUniformLocation(this.program, 'uModel');
            this.uColor = gl.getUniformLocation(this.program, 'uColor');
            this.uOpacity = gl.getUniformLocation(this.program, 'uOpacity');
            this.uLightDir = gl.getUniformLocation(this.program, 'uLightDir');
            this.uSunColor = gl.getUniformLocation(this.program, 'uSunColor'); // New
            this.uAmbientLight = gl.getUniformLocation(this.program, 'uAmbientLight'); // New
            this.uMap = gl.getUniformLocation(this.program, 'uMap');
            this.uHasMap = gl.getUniformLocation(this.program, 'uHasMap');

            this.aPosition = gl.getAttribLocation(this.program, 'position');
            this.aNormal = gl.getAttribLocation(this.program, 'normal');
            this.aUv = gl.getAttribLocation(this.program, 'uv');

            this.textureCache = new WeakMap();
            // Default 1x1 white texture
            this.defaultTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        }

        compileShader(type, source) {
            const gl = this.gl;
            const s = gl.createShader(type);
            gl.shaderSource(s, source);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        }

        createProgram(vs, fs) {
            const gl = this.gl;
            const p = gl.createProgram();
            gl.attachShader(p, vs);
            gl.attachShader(p, fs);
            gl.linkProgram(p);
            if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(p));
                return null;
            }
            return p;
        }

        initGeometry(geo) {
            const cached = this.buffers.get(geo);
            if (cached && cached.version === (geo.version || 0)) return cached;

            const gl = this.gl;
            let posBuffer, normBuffer, uvBuffer;

            if (cached) {
                // Reuse buffers (Update logic)
                // Ideally we should use gl.bufferSubData but for simplicity we recreate if needed or rebind
                posBuffer = cached.pos;
                normBuffer = cached.norm;
                uvBuffer = cached.uv;
                // Re-upload
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, geo.attributes.position.array, gl.STATIC_DRAW); // Should be DYNAMIC_DRAW if updating often?

                gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, geo.attributes.normal.array, geo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);

                if (geo.attributes.uv && uvBuffer) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, geo.attributes.uv.array, geo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
                }

                cached.version = geo.version || 0;
                return cached;
            }

            gl = this.gl;
            posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, geo.attributes.position.array, geo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);

            normBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, geo.attributes.normal.array, geo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);


            uvBuffer = null;
            if (geo.attributes.uv) {
                uvBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, geo.attributes.uv.array, gl.STATIC_DRAW);
            }

            const data = { pos: posBuffer, norm: normBuffer, uv: uvBuffer, count: geo.attributes.position.count, version: geo.version || 0 };
            this.buffers.set(geo, data);
            return data;
        }

        updateTexture(gl, texture) {
            if (!this.textureCache.has(texture)) {
                const t = gl.createTexture();
                this.textureCache.set(texture, t);
                gl.bindTexture(gl.TEXTURE_2D, t);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                texture.version = texture.version || 0;
                texture.glVersion = texture.version;
            } else {
                const t = this.textureCache.get(texture);
                gl.bindTexture(gl.TEXTURE_2D, t);
                if (texture.version !== texture.glVersion && texture.image.complete) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
                    texture.glVersion = texture.version;
                }
            }
        }

        render(scene, camera) {
            const gl = this.gl;
            if (!gl || !this.program) return;

            const bg = scene.background || { r: 0, g: 0, b: 0 };
            gl.clearColor(bg.r, bg.g, bg.b, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(this.program);

            camera.updateMatrixWorld();
            scene.updateMatrixWorld();

            const camPos = camera.position;
            const camRot = camera.rotation;

            const viewM = new SpeedR.Matrix4().identity();
            viewM.makeRotationFromEuler(new SpeedR.Euler(-camRot.x, -camRot.y, -camRot.z));
            viewM.multiply(new SpeedR.Matrix4().makeTranslation(-camPos.x, -camPos.y, -camPos.z));

            const vp = new SpeedR.Matrix4().multiplyMatrices(camera.projectionMatrix, viewM);

            // --- Extact Lights from Scene ---
            // Simple approach: find first/last Directional and Ambient
            let dirLight = { position: new SpeedR.Vector3(0.5, 1.0, 0.8), color: { r: 1, g: 1, b: 1 }, intensity: 1 };
            let ambLight = { color: { r: 0.4, g: 0.4, b: 0.4 }, intensity: 1 };

            scene.traverse(obj => {
                if (obj.isLight) {
                    if (obj instanceof SpeedR.DirectionalLight) {
                        dirLight = obj;
                    } else if (obj instanceof SpeedR.AmbientLight) {
                        ambLight = obj;
                    }
                }
            });

            // Set Global Uniforms
            if (dirLight.position) {
                const lDir = new SpeedR.Vector3().copy(dirLight.position).normalize();
                gl.uniform3f(this.uLightDir, lDir.x, lDir.y, lDir.z);
                gl.uniform3f(this.uSunColor, dirLight.color.r * dirLight.intensity, dirLight.color.g * dirLight.intensity, dirLight.color.b * dirLight.intensity);
            }

            gl.uniform3f(this.uAmbientLight, ambLight.color.r * ambLight.intensity, ambLight.color.g * ambLight.intensity, ambLight.color.b * ambLight.intensity);

            const renderObj = (obj) => {
                if (!obj.visible) return;

                if (obj.geometry && obj.material && obj.isMesh) {
                    const buffers = this.initGeometry(obj.geometry);

                    const mvp = new SpeedR.Matrix4().multiplyMatrices(vp, obj.matrixWorld);

                    gl.uniformMatrix4fv(this.uMVP, false, mvp.elements);
                    gl.uniformMatrix4fv(this.uModel, false, obj.matrixWorld.elements);

                    const c = obj.material.color;
                    gl.uniform3f(this.uColor, c.r, c.g, c.b);
                    gl.uniform1f(this.uOpacity, obj.material.opacity);

                    if (obj.material.transparent) gl.depthMask(false);

                    // Texture Binding
                    if (obj.material.map && obj.material.map.image.complete) {
                        gl.activeTexture(gl.TEXTURE0);
                        this.updateTexture(gl, obj.material.map);
                        gl.uniform1i(this.uMap, 0);
                        gl.uniform1i(this.uHasMap, 1);
                    } else {
                        gl.uniform1i(this.uHasMap, 0);
                    }

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
                    gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.aPosition);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.norm);
                    gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.aNormal);

                    if (buffers.uv) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
                        gl.vertexAttribPointer(this.aUv, 2, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(this.aUv);
                    } else {
                        gl.disableVertexAttribArray(this.aUv);
                    }

                    gl.drawArrays(gl.TRIANGLES, 0, buffers.count);

                    gl.depthMask(true);
                }

                for (let child of obj.children) renderObj(child);
            };

            renderObj(scene);
            if (this.stats) this.stats.update();
        }
    },

    Stats: class {
        constructor() {
            this.container = document.createElement('div');
            this.container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000;background:#000;color:#0f0;font-family:monospace;font-size:12px;padding:5px;pointer-events:none;';
            document.body.appendChild(this.container);
            this.beginTime = (performance || Date).now();
            this.prevTime = this.beginTime;
            this.frames = 0;
            this.fps = 0;
        }
        update() {
            this.frames++;
            const time = (performance || Date).now();
            if (time >= this.prevTime + 1000) {
                this.fps = (this.frames * 1000) / (time - this.prevTime);
                this.prevTime = time;
                this.frames = 0;
                this.container.textContent = `FPS: ${Math.round(this.fps)} | SpeedR Engine`;
            }
            this.beginTime = time;
        }
    },
    // --- FX ---
    FX: {
        createGhost: function (scene, mesh, duration = 0.5) {
            if (!mesh.geometry || !mesh.material) return;

            // Clone Mesh
            const ghostMat = new SpeedR.MeshBasicMaterial({
                color: mesh.material.color.getHex(),
                opacity: 0.6,
                transparent: true
            });

            const ghost = new SpeedR.Mesh(mesh.geometry, ghostMat);
            ghost.position.copy(mesh.position);
            ghost.rotation.copy(mesh.rotation);
            ghost.scale.copy(mesh.scale);

            scene.add(ghost);

            // Animate Fade Out
            const start = Date.now();
            const animate = () => {
                const now = Date.now();
                const progress = (now - start) / (duration * 1000);

                if (progress >= 1) {
                    scene.remove(ghost);
                } else {
                    ghost.material.opacity = 0.6 * (1 - progress);
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        },

        createFloatingText: function (scene, text, position, color = '#ffffff') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128; // Power of 2

            ctx.font = 'Bold 60px Arial'; // Large font for quality
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 128, 64);

            const tex = { image: canvas, isTexture: true, version: 1 };
            // Manually setup texture object as SpeedR.TextureLoader does

            const mat = new SpeedR.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 1.0,
                color: 0xffffff
            });

            // Billboard Plane (Always face camera? SpeedR doesn't auto-billboard yet)
            // Just flat plane for now, maybe rotate to camera later if passed
            const geo = new SpeedR.PlaneGeometry(2, 1);
            const mesh = new SpeedR.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.y += 2.0; // Start above head

            // Look at camera helper?
            // For now just fixed rotation or assume top-downish view
            mesh.rotation.x = -Math.PI / 4; // Tilt back slightly

            scene.add(mesh);

            // Animate
            const start = Date.now();
            const duration = 1.0;
            const animate = () => {
                const now = Date.now();
                const progress = (now - start) / (duration * 1000);

                if (progress >= 1) {
                    scene.remove(mesh);
                } else {
                    mesh.position.y += 0.05; // Float up
                    mesh.material.opacity = 1.0 - progress;

                    // Simple Billboard attempt (if scene.camera available?)
                    // mesh.lookAt(camera.position.x, camera.position.y, camera.position.z);

                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    }
}; // End of SpeedR


// SubHelpers for Vector3
SpeedR.Vector3.prototype.lengthSq = function () { return this.x * this.x + this.y * this.y + this.z * this.z; };
SpeedR.Vector3.prototype.subVectors = function (a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; };
SpeedR.Vector3.prototype.crossVectors = function (a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
};
SpeedR.Vector3.prototype.applyMatrix4 = function (m) {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return this;
};

console.log("SpeedR.js v1.2: Ghost FX Loaded");

SpeedR.ParticleSystem = class extends SpeedR.Points {
    constructor(options = {}) {
        const maxParticles = options.maxParticles || 1000;
        const geo = new SpeedR.BufferGeometry();

        const positions = new Float32Array(maxParticles * 3);
        const normals = new Float32Array(maxParticles * 3); // Needed for shader attribute present

        geo.setAttribute('position', new SpeedR.Float32BufferAttribute(positions, 3));
        geo.setAttribute('normal', new SpeedR.Float32BufferAttribute(normals, 3)); // Dummy normals
        geo.dynamic = true;


        const mat = new SpeedR.PointsMaterial({
            color: options.color || 0xffffff,
            size: options.size || 0.5,
            transparent: true,
            opacity: options.opacity || 1.0,
            map: options.map || null
        });

        super(geo, mat);

        this.maxParticles = maxParticles;
        this.particleCount = 0;
        this.particles = [];
        this.geo = geo;
    }

    spawn(pos, vel, life) {
        if (this.particleCount >= this.maxParticles) return;

        this.particles.push({
            pos: pos.clone(),
            vel: vel.clone(),
            life: life,
            maxLife: life
        });
        this.particleCount++;
    }

    update(dt) {
        const positions = this.geo.attributes.position.array;
        let pCount = 0;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.pos.add(p.vel.clone().multiplyScalar(dt));

            positions[pCount * 3] = p.pos.x;
            positions[pCount * 3 + 1] = p.pos.y;
            positions[pCount * 3 + 2] = p.pos.z;

            pCount++;
        }

        this.particleCount = pCount;

        // Zero out rest
        for (let i = pCount; i < this.maxParticles; i++) {
            positions[i * 3] = 0; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = 0;
        }

        this.geo.version = (this.geo.version || 0) + 1;
    }
};
