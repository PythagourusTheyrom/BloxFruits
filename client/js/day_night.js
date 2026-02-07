export class DayNightCycle {
    constructor(scene) {
        this.scene = scene;
        this.time = 12; // Start at noon 12:00
        this.dayDuration = 120; // Seconds for full 24h cycle (2 minutes)
        this.sunSpeed = (24 / this.dayDuration);

        // Find Lights
        this.dirLight = null;
        this.ambLight = null;

        this.scene.traverse(obj => {
            if (obj instanceof THREE.DirectionalLight) this.dirLight = obj;
            if (obj instanceof THREE.AmbientLight) this.ambLight = obj;
        });

        // Create Sun Visual
        if (this.dirLight) {
            const sunGeo = new THREE.SphereGeometry(2, 16, 16);
            const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
            this.scene.add(this.sunMesh);
        }

        // Colors
        this.colors = {
            dawn: new THREE.Color(0xffaa00),     // Orange
            noon: new THREE.Color(0xffffff),     // White
            dusk: new THREE.Color(0xff5500),     // Red-Orange
            night: new THREE.Color(0x111133),    // Dark Blue
            skyDawn: new THREE.Color(0xffcc88),
            skyNoon: new THREE.Color(0x87CEEB),  // Sky Blue
            skyDusk: new THREE.Color(0xcc8866),
            skyNight: new THREE.Color(0x000011)
        };
    }

    update(deltaTime) {
        this.time += this.sunSpeed * deltaTime;
        if (this.time >= 24) this.time = 0;

        // Calculate Sun Position (Simple arc)
        // 6:00 is sunrise (X = -low, Y = 0)
        // 12:00 is noon (X = 0, Y = high)
        // 18:00 is sunset (X = high, Y = 0)
        // Night is under the world

        const angle = ((this.time - 6) / 24) * Math.PI * 2; // -6 to shift cycle so 6am is 0 rad
        // Actually simpler: 
        // Noon (12) -> should be top. 
        // Map 0..24 to 0..2PI
        // 12 -> PI/2 (Top)

        const r = 50; // Distance
        const theta = ((this.time - 6) / 24) * Math.PI * 2;

        // X goes East-West, Y goes Up-Down
        const sunX = Math.cos(theta) * r; // Rise east? Let's just orbit Z/Y plane
        const sunY = Math.sin(theta) * r;
        const sunZ = Math.sin(theta * 0.5) * 20; // Slight Z wobble

        if (this.dirLight) {
            this.dirLight.position.set(sunX, sunY, sunZ);
            this.dirLight.updateMatrixWorld(); // Helper for visuals
        }

        if (this.sunMesh) {
            this.sunMesh.position.set(sunX, sunY, sunZ);
        }

        // Color Interpolation
        this.updateLighting();
        this.updateSky();
    }

    updateLighting() {
        if (!this.dirLight || !this.ambLight) return;

        let sunColor, ambColor, sunIntensity, ambIntensity;

        if (this.time >= 5 && this.time < 7) {
            // Dawn
            const t = (this.time - 5) / 2;
            sunColor = this.colors.night.clone().lerp(this.colors.dawn, t);
            ambColor = this.colors.night.clone().lerp(this.colors.dawn, t);
            sunIntensity = 0.5 * t;
            ambIntensity = 0.2 + (0.3 * t);
        } else if (this.time >= 7 && this.time < 11) {
            // Dawn to Noon
            const t = (this.time - 7) / 4;
            sunColor = this.colors.dawn.clone().lerp(this.colors.noon, t);
            ambColor = this.colors.dawn.clone().lerp(this.colors.noon, t);
            sunIntensity = 0.5 + (0.5 * t);
            ambIntensity = 0.5 + (0.3 * t); // Up to 0.8
        } else if (this.time >= 11 && this.time < 14) {
            // Noon
            sunColor = this.colors.noon;
            ambColor = this.colors.noon;
            sunIntensity = 1.0;
            ambIntensity = 0.8;
        } else if (this.time >= 14 && this.time < 18) {
            // Noon to Dusk
            const t = (this.time - 14) / 4;
            sunColor = this.colors.noon.clone().lerp(this.colors.dusk, t);
            ambColor = this.colors.noon.clone().lerp(this.colors.dusk, t);
            sunIntensity = 1.0 - (0.3 * t);
            ambIntensity = 0.8 - (0.3 * t);
        } else if (this.time >= 18 && this.time < 20) {
            // Dusk to Night
            const t = (this.time - 18) / 2;
            sunColor = this.colors.dusk.clone().lerp(this.colors.night, t);
            ambColor = this.colors.dusk.clone().lerp(this.colors.night, t);
            sunIntensity = 0.7 * (1 - t);
            ambIntensity = 0.5 * (1 - t) + 0.2; // down to 0.2
        } else {
            // Night
            sunColor = this.colors.night;
            ambColor = new THREE.Color(0x222244); // Ambient night is slightly bluish
            sunIntensity = 0.0; // No sun light
            ambIntensity = 0.3; // Moonlight feel
        }

        this.dirLight.color.copy(sunColor);
        this.dirLight.intensity = sunIntensity;

        this.ambLight.color.copy(ambColor);
        this.ambLight.intensity = ambIntensity;
    }

    updateSky() {
        let skyColor;
        if (this.time >= 5 && this.time < 7) {
            skyColor = this.colors.skyNight.clone().lerp(this.colors.skyDawn, (this.time - 5) / 2);
        } else if (this.time >= 7 && this.time < 12) {
            skyColor = this.colors.skyDawn.clone().lerp(this.colors.skyNoon, (this.time - 7) / 5);
        } else if (this.time >= 12 && this.time < 17) {
            skyColor = this.colors.skyNoon.clone().lerp(this.colors.skyDusk, (this.time - 12) / 5);
        } else if (this.time >= 17 && this.time < 20) {
            skyColor = this.colors.skyDusk.clone().lerp(this.colors.skyNight, (this.time - 17) / 3);
        } else {
            skyColor = this.colors.skyNight;
        }

        this.scene.background.copy(skyColor);
        if (this.scene.fog) this.scene.fog.color.copy(skyColor);
    }
}
