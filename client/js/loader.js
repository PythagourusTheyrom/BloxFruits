import { SpeedR as THREE } from './SpeedR.js';

export class SimpleOBJLoader {
    constructor(manager) {
        this.manager = manager;
    }

    load(url, onLoad, onProgress, onError) {
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(res.statusText);
                return res.text();
            })
            .then(text => {
                const mesh = this.parse(text);
                if (onLoad) onLoad(mesh);
            })
            .catch(err => {
                if (onError) onError(err);
                console.error("OBJLoader Error:", err);
            });
    }

    parse(text) {
        const positions = [];
        const normals = [];
        const uvs = [];

        const builtPositions = [];
        const builtNormals = [];
        const builtUvs = [];

        const lines = text.split('\n');

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('#') || line === '') continue;

            const parts = line.split(/\s+/);
            const type = parts[0];

            if (type === 'v') {
                positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            } else if (type === 'vn') {
                normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            } else if (type === 'vt') {
                uvs.push(parseFloat(parts[1]), parseFloat(parts[2]));
            } else if (type === 'f') {
                for (let i = 1; i < parts.length - 2; i++) {
                    // Triangulate fan
                    this.parseFaceVertex(parts[1], positions, normals, uvs, builtPositions, builtNormals, builtUvs);
                    this.parseFaceVertex(parts[i + 1], positions, normals, uvs, builtPositions, builtNormals, builtUvs);
                    this.parseFaceVertex(parts[i + 2], positions, normals, uvs, builtPositions, builtNormals, builtUvs);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(builtPositions), 3));

        if (builtNormals.length > 0) {
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(builtNormals), 3));
        } else {
            // Computes flat normals if missing
            // Skip for now
            // Default Up
            const count = builtPositions.length / 3;
            const defNorms = new Float32Array(count * 3).fill(0);
            for (let i = 0; i < count * 3; i += 3) defNorms[i + 1] = 1;
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(defNorms, 3));
        }

        if (builtUvs.length > 0) {
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(builtUvs), 2));
        }

        return geometry;
    }

    parseFaceVertex(str, pos, norm, uv, outPos, outNorm, outUv) {
        const bits = str.split('/');
        // Position
        const pIdx = (parseInt(bits[0]) - 1) * 3;
        outPos.push(pos[pIdx], pos[pIdx + 1], pos[pIdx + 2]);

        // UV
        if (bits[1] && bits[1] !== "") {
            const uIdx = (parseInt(bits[1]) - 1) * 2;
            outUv.push(uv[uIdx], uv[uIdx + 1]);
        } else {
            outUv.push(0, 0);
        }

        // Normal
        if (bits[2] && bits[2] !== "") {
            const nIdx = (parseInt(bits[2]) - 1) * 3;
            outNorm.push(norm[nIdx], norm[nIdx + 1], norm[nIdx + 2]);
        } else {
            // Placeholder normal? handled later if empty
        }
    }
}
