import { SpeedR as THREE } from './SpeedR.js';

export class WeatherSystem {
    constructor(scene, playerMesh) {
        this.scene = scene;
        this.playerMesh = playerMesh;

        this.currentWeather = 'Clear'; // Clear, Rain
        this.timer = 0;

        // Rain System
        this.rainCount = 2000;
        this.rainGeo = new THREE.BufferGeometry();
        this.rainPos = [];
        this.rainVel = [];

        for (let i = 0; i < this.rainCount; i++) {
            this.rainPos.push(
                Math.random() * 400 - 200,
                Math.random() * 100 + 20,
                Math.random() * 400 - 200
            );
            this.rainVel.push(-0.5 - Math.random()); // Fall speed
        }

        this.rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(this.rainPos, 3));
        this.rainMat = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });

        this.rainSystem = new THREE.Points(this.rainGeo, this.rainMat);
        this.rainSystem.visible = false;
        this.scene.add(this.rainSystem);
    }

    setWeather(type) {
        console.log("Weather changing to: " + type);
        this.currentWeather = type;

        if (type === 'Rain') {
            this.scene.fog.color.setHex(0x555555);
            this.scene.background.setHex(0x555555);
            this.scene.fog.density = 0.02; // Thicker fog
            this.rainSystem.visible = true;
        } else {
            // Clear
            this.scene.fog.color.setHex(0x87CEEB);
            this.scene.background.setHex(0x87CEEB);
            this.scene.fog.density = 0.01; // Light fog
            this.rainSystem.visible = false;
        }
    }

    update(deltaTime) {
        // Timer to change weather
        this.timer += deltaTime;
        if (this.timer > 60) { // Every 60 seconds try change
            this.timer = 0;
            if (Math.random() > 0.5) {
                this.setWeather(this.currentWeather === 'Clear' ? 'Rain' : 'Clear');
            }
        }

        if (this.currentWeather === 'Rain') {
            const positions = this.rainGeo.attributes.position.array;

            // Move rain with player
            // But wrap around local area

            for (let i = 0; i < this.rainCount; i++) {
                // Y - Fall
                positions[i * 3 + 1] += this.rainVel[i];

                // Reset if below ground
                if (positions[i * 3 + 1] < -5) {
                    positions[i * 3 + 1] = 50 + Math.random() * 20;
                    positions[i * 3] = this.playerMesh.position.x + (Math.random() * 100 - 50);
                    positions[i * 3 + 2] = this.playerMesh.position.z + (Math.random() * 100 - 50);
                }
            }
            this.rainGeo.attributes.position.needsUpdate = true;
        }
    }
}
