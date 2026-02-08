console.log("Script.js loading...");
import './globals.js?v=2';
import { SpeedR } from './SpeedR.js?v=2';
import { Physics } from './physics.js?v=2';
import { Combat } from './combat.js?v=2';
import { FruitSystem } from './fruits.js?v=2';
import { NPCSystem } from './npc.js?v=2';
import { ModelFactory } from './models.js?v=2';
import { HitSystem } from './hit_system.js?v=2';
import { BossSystem } from './boss.js?v=2';
import { InteractionSystem } from './interaction.js?v=2';
import { BoatSystem } from './boats.js?v=2';
import { SkillSystem } from './skills.js?v=2';
import { WeaponFactory } from './weapons.js?v=2';
import { CharacterController } from './controller.js?v=2';
import { CameraControl } from './camera.js?v=2';
import { CameraControl } from './camera.js?v=2';
import { InventorySystem, QuestTracker } from './ui.js?v=2';

import { GhostEffect, FloatingText, SpecialEffects } from './effects.js?v=2';
import { DayNightCycle } from './day_night.js?v=2';
import { ZoneSystem } from './zones.js?v=2';
import { WorldManager } from './world.js?v=2';
import { ParticleSystem } from './particles.js?v=2';

function log(msg) {
    const d = document.getElementById('debug-console');
    if (d) d.innerHTML += msg + "<br>";
    console.log(msg);
}
window.onerror = function (msg, url, line) {
    const d = document.getElementById('debug-console');
    if (d) d.style.display = 'block';
    log("ERROR: " + msg + " at " + line);
    log("ERROR: " + msg + " at " + line);
};

// --- OFFLINE MODE DETECTION ---
const isOfflineMode = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost-demo');
if (isOfflineMode) {
    console.log("%c OFFLINE / DEMO MODE ACTIVE ", "background: #222; color: #bada55; font-size: 20px");
    document.getElementById('auth-msg').innerText = "Demo Mode: Multiplayer Unavailable";
}


// Game State
let gameState = {
    myID: null,
    room: null, // New field for Lobby
    players: {},
    isPlaying: false,
    player: {
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100
    }
};

// WebSocket
let socket;

// Systems
let physics;
let combat;
let fruitSystem;
let npcSystem;

// Three.js Global Variables
let scene, camera, renderer;
let myPlayerMesh, oceanMesh;
let keys = {};
let characterController;
let cameraControl;

// Auth State
let authMode = 'login'; // 'login' or 'register'

window.switchAuth = function (mode) {
    authMode = mode;

    // Update Tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${mode}`);
    if (activeTab) activeTab.classList.add('active');

    // Update Button Text
    const btn = document.getElementById('auth-btn');
    if (btn) btn.innerHTML = mode === 'login' ? 'LOGIN TO PLAY' : 'REGISTER & PLAY';

    // Clear Messages
    const msg = document.getElementById('auth-msg');
    if (msg) msg.innerText = "";
}

function updateUI() {
    const p = gameState.player;
    const hpBar = document.getElementById('hp-bar');
    if (hpBar) hpBar.style.width = (p.health / p.maxHealth * 100) + "%";
    const hpText = document.getElementById('hp-text');
    if (hpText) hpText.innerText = `Health ${p.health}/${p.maxHealth}`;

    // Energy
    const enBar = document.getElementById('energy-bar');
    if (enBar) enBar.style.width = (p.energy / p.maxEnergy * 100) + "%";
    const enText = document.getElementById('energy-text');
    if (enText) enText.innerText = `Energy ${Math.floor(p.energy)}/${p.maxEnergy}`;

    const mText = document.getElementById('money-display'); // Fixed ID
    if (mText) mText.innerText = "$ " + p.money;

    // Level usually not in this function in original but let's keep it safe
    // document.getElementById('course-display').innerText = "Level " + p.level;
    // Wait, original had course-display, but HTML has .level-text
    const lvlText = document.querySelector('.level-text');
    if (lvlText) lvlText.innerText = "Lv. " + p.level;

    const bDisplay = document.getElementById('bounty-display');
    if (bDisplay) bDisplay.innerText = "Bounty: " + (p.bounty || 0);
}

window.handleAuth = async function () {
    console.log("handleAuth clicked");
    const username = document.getElementById('username-input').value.trim();
    const password = document.getElementById('password-input').value.trim();
    const msg = document.getElementById('auth-msg');
    const spinner = document.getElementById('loading-spinner');

    if (!username || !password) {
        msg.innerText = "Please enter username and password.";
        return;
    }

    msg.innerText = "";
    if (spinner) spinner.classList.remove('hidden');

    try {
        if (isOfflineMode) {
            // MOCK AUTH
            setTimeout(() => {
                const mockToken = "mock_token_" + Math.random();
                showDashboard(mockToken, username || "Guest_Demo");
            }, 500);
            return;
        }

        const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.innerText = data.error || "Error occurred";
            msg.style.color = '#ff3333';
            if (spinner) spinner.classList.add('hidden');
            return;
        }

        if (authMode === 'register') {
            msg.style.color = 'lime';
            msg.innerText = "Registered! Logging in...";

            // Auto Login
            const loginRes = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const loginData = await loginRes.json();

            if (!loginRes.ok) {
                msg.style.color = '#ff3333';
                msg.innerText = loginData.error;
                if (spinner) spinner.classList.add('hidden');
                return;
            }
            showDashboard(loginData.token, loginData.username);
        } else {
            showDashboard(data.token, data.username);
        }
    } catch (e) {
        if (isOfflineMode) {
            // Fallback if fetch fails in what we thought was online but is actually offline
            showDashboard("mock_token", username || "Guest");
            return;
        }
        msg.innerText = "Network Error";
        msg.style.color = '#ff3333';
        console.error(e);
        if (spinner) spinner.classList.add('hidden');
    }
};

window.handleGuestAuth = async function () {
    console.log("Guest Login Clicked");
    const msg = document.getElementById('auth-msg');
    const spinner = document.getElementById('loading-spinner');

    msg.innerText = "Creating Guest Account...";
    msg.style.color = '#00c6ff';
    if (spinner) spinner.classList.remove('hidden');

    try {
        if (isOfflineMode) {
            setTimeout(() => {
                showDashboard("guest_token", "Guest_" + Math.floor(Math.random() * 1000));
            }, 500);
            return;
        }

        const res = await fetch('/api/guest', { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
            msg.innerText = data.error || "Guest Login Failed";
            msg.style.color = '#ff3333';
            return;
        }

        showDashboard(data.token, data.username);
    } catch (e) {
        if (isOfflineMode) {
            showDashboard("guest_token", "Guest_Offline");
            return;
        }
        msg.innerText = "Network Error";
        msg.style.color = '#ff3333';
        console.error(e);
    } finally {
        if (spinner) spinner.classList.add('hidden');
    }
}

let currentToken = null;
let currentUsername = null;

function showDashboard(token, username) {
    currentToken = token;
    currentUsername = username;

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('dash-username').innerText = username;
}

window.createLobby = function () {
    const roomID = "private_" + Math.random().toString(36).substr(2, 6);
    startSession(currentToken, currentUsername, roomID);
}

window.showJoinLobby = function () {
    document.getElementById('join-modal').classList.remove('hidden');
}

window.closeModal = function () {
    document.getElementById('join-modal').classList.add('hidden');
}

window.confirmJoinLobby = function () {
    const id = document.getElementById('lobby-id-input').value.trim();
    if (id) {
        startSession(currentToken, currentUsername, id);
        closeModal();
    }
}

window.joinLobby = function (id) {
    startSession(currentToken, currentUsername, id);
}

function startSession(token, username, room) {
    console.log("Starting Session... Hiding Login/Dashboard");
    gameState.room = room;

    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const teamScreen = document.getElementById('team-selection');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboardScreen) dashboardScreen.classList.add('hidden');

    if (teamScreen) {
        teamScreen.style.display = 'flex'; // Ensure visible
        teamScreen.classList.remove('hidden');
    }

    init(token, room);
}

// Shop Functions
window.openShop = function () {
    document.getElementById('shop-ui').classList.remove('hidden');
}

window.closeShop = function () {
    document.getElementById('shop-ui').classList.add('hidden');
}

window.buyItem = function (item) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'buy_weapon',
            item: item
        }));
        // Visual feedback?
        alert("Purchasing " + item + "...");
    }
}

window.buyFruit = function () {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'roll_fruit'
        }));
        alert("Rolling Random Fruit...");
    }
}

// Quest Functions
window.acceptQuest = function () {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'accept_quest', item: 'gorilla_quest' }));
        closeDialog();
    }
}

window.closeDialog = function () {
    document.getElementById('dialog-ui').classList.add('hidden');
}

// Debug: Simulate Kill
window.addEventListener('keydown', (e) => {
    if (e.key === 'k') {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'kill_mob', item: 'Gorilla' }));
            console.log("Simulated Mob Kill");
        }
    }
});



// Admin Logic
window.toggleAdminPanel = function () {
    if (gameState.role !== 'admin' && gameState.role !== 'owner') {
        return; // Security Check
    }
    const p = document.getElementById('admin-panel');
    p.classList.toggle('hidden');
}

window.adminAction = function (action) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const target = document.getElementById('admin-target').value.trim();
    if (!target) {
        alert("Enter Target ID");
        return;
    }

    let itemValue = "";
    if (action === 'grant_item') {
        itemValue = document.getElementById('admin-item').value.trim();
        if (!itemValue) {
            alert("Enter Item Name");
            return;
        }
    }

    socket.send(JSON.stringify({
        type: 'admin_action',
        item: action,
        weapon: target,        // Target ID
        team: itemValue        // Extra value (Item Name)
    }));

    console.log(`Admin Action: ${action} -> ${target} (${itemValue})`);
}

// Chat Logic
document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = e.target;
        const msg = input.value.trim();
        if (msg) {
            socket.send(JSON.stringify({ type: 'chat', item: msg })); // Using 'item' for message content
            input.value = '';
            // Unfocus to return control to game? Or keep focus?
            // Users usually want to keep chatting or click away.
            input.blur();
        }
    }
});

// Initialization
function init(token, roomID) {
    try {
        setupScene();
        setupWebSocket(token, roomID);

        // Init Systems
        physics = new Physics(scene);
        fruitSystem = new FruitSystem(scene);
        // ... (rest of init function remains mostly same, need to be careful with context) ...
        npcSystem = new NPCSystem(scene);
        const hitSystem = new HitSystem(scene);
        const bossSystem = new BossSystem(scene);

        // Interaction System
        window.interactionSystem = new InteractionSystem(scene, camera, myPlayerMesh);
        npcSystem.setInteractionSystem(window.interactionSystem);

        // New Systems
        const boatSystem = new BoatSystem(scene, myPlayerMesh);
        const skillSystem = new SkillSystem(scene, myPlayerMesh);

        // Character Controller Init
        characterController = new CharacterController(myPlayerMesh, renderer.domElement, physics);

        // Camera Control Init
        cameraControl = new CameraControl(camera, myPlayerMesh, renderer.domElement);

        const weatherSystem = new WeatherSystem(scene, myPlayerMesh);
        const ghostEffect = new GhostEffect(scene);
        const dayNightCycle = new DayNightCycle(scene);
        const zoneSystem = new ZoneSystem(scene);
        const worldManager = new WorldManager(scene, physics);
        const particleSystem = new ParticleSystem(scene);
        scene.particleSystem = particleSystem;

        window.boatSystem = boatSystem; // Global access for loop
        window.skillSystem = skillSystem;
        window.weatherSystem = weatherSystem;
        window.ghostEffect = ghostEffect;
        window.dayNightCycle = dayNightCycle;

        window.questTracker = new QuestTracker();

        // Initial Item test
        window.inventorySystem.addItem("Combat");

        // Initial Quest test
        window.questTracker.setQuest("New Adventure", "Defeat 5 Bandits", 0, 5);

        // Register Zones
        window.zoneSystem = zoneSystem; // Global access

        // Start Island (Safe)
        zoneSystem.addZone("Start Island", 0, 0, 45, '#ffff00', true);

        zoneSystem.addZone("Jungle Island", -50, -50, 60, '#228B22', false); // Not safe
        zoneSystem.addZone("Snow Island", 50, 50, 60, '#a5f2f3', false);

        // Generate World
        worldManager.generateWorld();

        // Spawn some boats
        boatSystem.spawnBoat(15, 10);
        boatSystem.spawnBoat(-15, 10);

        // Listen for hits
        window.addEventListener('playerHit', (e) => {
            hitSystem.showDamage(e.detail.pos, e.detail.amt);
        });

        // Test Spawn Fruits
        fruitSystem.spawnFruit("Fire", 5, 5);
        fruitSystem.spawnFruit("Ice", -5, 5);

        // Test Spawn NPC
        const questGiver = npcSystem.spawnNPC("Quest Giver", 0, 8);

        if (questGiver && window.interactionSystem) {
            window.interactionSystem.register(questGiver, () => {
                document.getElementById('dialog-ui').classList.remove('hidden');
            }, "Talk to Quest Giver");
        }

        // Weapon Dealer
        const dealer = npcSystem.spawnNPC("Weapon Dealer", 10, 10);
        // Register Interaction
        if (window.interactionSystem && dealer) {
            window.interactionSystem.register(dealer, () => {
                openShop();
            }, "Open Shop");
        }

        // Spawn Bosses
        bossSystem.spawnBoss("Gorilla King", -50, -50);
        bossSystem.spawnBoss("Ice Admiral", 50, 50);

        animate();
        setupEventListeners();
    } catch (e) {
        alert("Game Error: " + e.message);
        console.error(e);
    }
}

function setupWebSocket(token, roomID) {
    if (isOfflineMode) {
        console.log("Setting up MOCK WebSocket");

        // MOCK SOCKET SIMULATION
        socket = {
            readyState: 1, // OPEN
            send: function (msgStr) {
                const msg = JSON.parse(msgStr);
                console.log("[MOCK WS] Sent:", msg);

                if (msg.type === 'join_team') {
                    // Ack Join
                    setTimeout(() => {
                        this.onmessage({
                            data: JSON.stringify({
                                type: 'init',
                                id: gameState.myID || "Player_1",
                                role: 'user'
                            })
                        });

                        // Send initial state with just me
                        const p = {};
                        p[gameState.myID || "Player_1"] = {
                            x: 0, y: 5, z: 0,
                            team: msg.team,
                            health: 100,
                            maxHealth: 100,
                            weapon: 'Combat'
                        };
                        this.onmessage({
                            data: JSON.stringify({
                                type: 'state',
                                players: p
                            })
                        });

                    }, 100);
                } else if (msg.type === 'chat') {
                    // Echo chat
                    setTimeout(() => {
                        this.onmessage({
                            data: JSON.stringify({
                                type: 'chat',
                                id: gameState.myID || "Player_1",
                                role: 'user',
                                item: msg.item
                            })
                        });
                    }, 50);
                }
            },
            onopen: function () { },
            onmessage: function () { }
        };

        // Trigger onopen manually
        setTimeout(() => {
            if (socket.onopen) socket.onopen();
            // Send Init
            if (socket.onmessage) socket.onmessage({
                data: JSON.stringify({
                    type: 'init',
                    id: "Player_" + Math.floor(Math.random() * 1000),
                    role: 'user'
                })
            });
        }, 100);

        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // Append room to query string
    socket = new WebSocket(`${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}&room=${encodeURIComponent(roomID)}`);

    socket.onopen = () => {
        console.log("Connected to server: " + roomID);
    };

    if (window.originalOnMessage) {
        socket.onmessage = window.originalOnMessage;
    }
};

// Change socket.onmessage assignment to safely handle mock
const originalOnMessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === 'init') {
        gameState.myID = msg.id;
        gameState.role = msg.role; // Store Role

        // Show Admin Button if authorized
        if (gameState.role === 'admin' || gameState.role === 'owner') {
            document.getElementById('admin-toggle-btn').classList.remove('hidden');
        } else {
            document.getElementById('admin-toggle-btn').classList.add('hidden');
        }

        if (gameState.role === 'owner') {
            const oc = document.getElementById('owner-controls');
            if (oc) oc.classList.remove('hidden');
        }

    } else if (msg.type === 'state') {
        // ... existing code ...
        updateWorldState(msg.players);
    } else if (msg.type === 'event') {
        const banner = document.getElementById('event-banner');
        if (msg.name === "None") {
            banner.classList.add('hidden');
        } else {
            banner.innerText = "Event: " + msg.name;
            banner.classList.remove('hidden');
        }
    } else if (msg.type === 'quest_update') {
        // Update Quest HUD
        gameState.player.activeQuest = msg.activeQuest;
        gameState.player.money = msg.money; // Sync money reward
        // Also sync EXP if we had it in gameState

        updateQuestUI();

        if (!msg.activeQuest) {
            // Quest Completed or None
            document.getElementById('quest-hud').classList.add('hidden');
            // Check if it was a completion (money went up significantly)
            // For now just hide it.
            if (msg.money > (gameState.player.money || 0)) {
                alert("Quest Completed! Reward Received.");
            }
        } else {
            document.getElementById('quest-hud').classList.remove('hidden');
        }
        document.getElementById('quest-hud').classList.remove('hidden');
    } else if (msg.type === 'mob_update') {
        updateMobs(msg.mobs);
    } else if (msg.type === 'chat') {
        const chatBox = document.getElementById('chat-messages');
        if (chatBox) {
            const line = document.createElement('div');
            line.style.marginBottom = "2px";
            // Colorize name?
            const senderColor = msg.role === 'owner' ? 'gold' : (msg.role === 'admin' ? 'red' : 'cyan');
            line.innerHTML = `<span style="color:${senderColor}; font-weight:bold;">${msg.id}:</span> ${msg.item}`;
            chatBox.appendChild(line);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Chat Bubble
        if (gameState.players[msg.id] && SpeedR.FX && SpeedR.FX.createFloatingText) {
            const pParams = gameState.players[msg.id];
            SpeedR.FX.createFloatingText(scene, msg.item, new THREE.Vector3(pParams.x, pParams.y, pParams.z), "#ffffff");
        }
    }
};

// Assign the listener
if (socket && !isOfflineMode) {
    socket.onmessage = originalOnMessage;
} else if (isOfflineMode && socket) {
    socket.onmessage = originalOnMessage;
}
// If socket is initialized later (which it is), we need a helper to attach it.
// The init() function calls setupWebSocket().
// We will modify setupWebSocket to attach this listener if not offline.
// But wait, setupWebSocket sets up a NEW socket instance.
// The originalOnMessage needs to be attached to THAT instance.

// Let's attach it to window so setupWebSocket can use it
window.originalOnMessage = originalOnMessage;

// We need to modify setupWebSocket again to use this



function updateMobs(mobsData) {
    if (!gameState.mobs) gameState.mobs = {};

    // Update / Create
    for (const id in mobsData) {
        const mData = mobsData[id];

        if (!gameState.mobs[id]) {
            // Create Mob Mesh
            let mesh;
            if (mData.type === "Gorilla") {
                mesh = ModelFactory.createGorilla();
            } else if (mData.type === "Ice Admiral") {
                mesh = ModelFactory.createIceAdmiral();
            } else {
                mesh = ModelFactory.createHumanoid(0xff0000); // Default enemy
            }
            mesh.position.set(mData.x, mData.y, mData.z);
            scene.add(mesh);

            // Click Handler for Attack
            mesh.userData = { type: "mob", id: id };

            gameState.mobs[id] = { mesh: mesh, data: mData };
        } else {
            // Update
            const m = gameState.mobs[id];

            // Check for Damage (Health Decrease)
            if (mData.health < m.data.health) {
                const dmg = m.data.health - mData.health;
                if (SpeedR.FX && SpeedR.FX.createFloatingText) {
                    SpeedR.FX.createFloatingText(scene, "-" + dmg, new THREE.Vector3(mData.x, mData.y, mData.z), "#ff3333");
                }
            }

            m.data = mData; // Update ref
            m.mesh.position.lerp(new THREE.Vector3(mData.x, mData.y, mData.z), 0.1);
        }
    }

    // Remove Dead
    for (const id in gameState.mobs) {
        if (!mobsData[id]) {
            scene.remove(gameState.mobs[id].mesh);
            delete gameState.mobs[id];
        }
    }
}

function updateWorldState(serverPlayers) {
    // Remove disconnected players first
    for (const id in gameState.players) {
        if (!serverPlayers[id] && id !== gameState.myID) { // Don't remove our own player
            scene.remove(gameState.players[id].mesh);
            delete gameState.players[id];
        }
    }

    // Update/Create players
    for (const id in serverPlayers) {
        if (id === gameState.myID) {
            // Update local stats if needed (health etc)
            if (combat && serverPlayers[id].health < gameState.player.health) {
                // Took damage logic
            }
            // Update our own player's Haki state
            if (myPlayerMesh.userData.arms) {
                const armColor = serverPlayers[id].hakiActive ? 0x111111 : 0xffccaa; // Black or Skin
                myPlayerMesh.userData.arms.forEach(part => {
                    if (part.material) part.material.color.setHex(armColor);
                });
            }
            continue;
        }
        const pData = serverPlayers[id];

        if (!gameState.players[id]) {
            // New Player - USE MODEL FACTORY
            const color = pData.team === 'marine' ? 0x0072ff : 0xff004c;
            const mesh = ModelFactory.createHumanoid(color);

            // Name Tag
            const nameTag = createNameTag(id);
            nameTag.position.y = 2.5; // Above head
            mesh.add(nameTag);

            // Set UserData for Raycasting
            mesh.userData = { type: "player", id: id };

            scene.add(mesh);

            gameState.players[id] = { mesh: mesh, data: pData };
        } else {
            // Update Existing
            const p = gameState.players[id];
            // Lerp Position
            p.mesh.position.lerp(new THREE.Vector3(pData.x, pData.y, pData.z), 0.1); // Use pData.y directly

            // Sync Rotation
            // (If we had it in pData)

            // Sync Weapon
            if (pData.weapon && p.lastWeapon !== pData.weapon) {
                p.lastWeapon = pData.weapon;
                // Update local tracker if it's us (though updateWorldState usually handles *other* players)
                // Actually, this loop iterates over `gameState.players`.
                // If `id === gameState.id`, it's us.
                if (id === gameState.id) {
                    gameState.player.weapon = pData.weapon;
                    gameState.equippedItem = pData.weapon;
                }

                // Visuals
                if (p.weaponMesh) p.mesh.remove(p.weaponMesh);
                // Use global WeaponFactory
                const wMesh = WeaponFactory.createWeapon(pData.weapon);
                if (wMesh) {
                    p.weaponMesh = wMesh;
                    p.mesh.add(wMesh);
                }
            }
        }
    }

    // Remove disconnected
    for (const id in gameState.players) {
        if (!serverPlayers[id]) {
            scene.remove(gameState.players[id].mesh);
            delete gameState.players[id];
        }
    }

    updatePlayerList(serverPlayers);
}

function updatePlayerList(players) {
    const list = document.getElementById('player-list-content');
    if (!list) return;

    list.innerHTML = "";

    // Sort by Bounty? Or just list
    const sortedIds = Object.keys(players).sort((a, b) => (players[b].bounty || 0) - (players[a].bounty || 0));

    sortedIds.forEach(id => {
        const p = players[id];
        const row = document.createElement('div');
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.fontSize = "12px";
        row.style.marginBottom = "2px";

        const nameColor = p.team === 'marine' ? '#0072ff' : (p.team === 'pirate' ? '#ff004c' : 'white');

        const nameSpan = document.createElement('span');
        nameSpan.innerText = id;
        nameSpan.style.color = nameColor;
        nameSpan.style.fontWeight = "bold";

        const bountySpan = document.createElement('span');
        bountySpan.innerText = "$" + (p.bounty || 0); // Or Level?
        bountySpan.style.color = "#ffff00";

        row.appendChild(nameSpan);
        row.appendChild(bountySpan);
        list.appendChild(row);
    });
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Setup Systems
    physics = new Physics(scene);
    physics = new Physics(scene);
    // gameState.floatingText replaced by SpeedR.FX
    window.effects = new SpecialEffects(scene);
    window.effects = new SpecialEffects(scene);

    // Create Player
    const playerColor = 0x00ff00; // Default or Team Color
    const team = 'marine'; // Default
    if (team === 'marine') playerColor = 0x0072ff;
    // ... we don't know team yet, wait for spawn.
    // Actually we do select team before init.
    // For now create placeholder or wait.

    // Create Ocean
    const oceanGeo = new THREE.PlaneGeometry(1000, 1000);
    const oceanMat = new THREE.MeshPhongMaterial({ color: 0x006994, transparent: true, opacity: 0.8 });
    oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    scene.add(oceanMesh);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Note: We handle water level manually in physics.js default, but adding it allows raycast fallback
    // physics.addGround(oceanMesh); 
    // ACTUALLY: Let's NOT add ocean as ground, because we want to float AT water level, not stand ON it.
    // Physics.js handles waterLevel float logic.

    // Island
    const islandGeometry = new THREE.CylinderGeometry(15, 15, 2, 8);
    const islandMaterial = new THREE.MeshLambertMaterial({ color: 0xc2b280 });
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.y = 1;
    island.receiveShadow = true;
    scene.add(island);

    // My Player - USE MODEL FACTORY
    myPlayerMesh = ModelFactory.createHumanoid(0xaaaaaa); // Neutral grey initially
    myPlayerMesh.position.y = 2.2; // Stand on grass
    myPlayerMesh.castShadow = true;

    // Name Tag (My ID might be null initially)
    // We will update it when we get ID or just show "You"
    // But better to wait or update later.

    scene.add(myPlayerMesh);

    // Initialize Combat after mesh creation
    combat = new Combat(myPlayerMesh, socket);

    function selectTeam(team) {
        gameState.isPlaying = true;
        document.getElementById('team-selection').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');

        // Update Visuals - Recreate Mesh with correct color
        const color = team === 'marine' ? 0x0072ff : 0xff004c;

        // Remove old
        scene.remove(myPlayerMesh);

        // Create new
        myPlayerMesh = ModelFactory.createHumanoid(color);

        // Name Tag
        if (gameState.myID) {
            const nt = createNameTag(gameState.myID);
            nt.position.y = 2.5;
            myPlayerMesh.add(nt);
        }

        scene.add(myPlayerMesh);

        // Re-attach combat (IMPORTANT: Combat holds reference to old mesh)
        combat = new Combat(myPlayerMesh, socket);

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'join_team',
                team: team
            }));
        }
    }
    window.selectTeam = selectTeam;

    function updatePlayer(deltaTime) {
        if (!gameState.isPlaying) return;

        // Use new Character Controller
        if (characterController) {
            characterController.update(deltaTime, camera);
        }

        // Abilities (Keep existing trigger logic)
        if (keys['z'] || keys['Z']) this.triggerAbility("Z");
        if (keys['x'] || keys['X']) this.triggerAbility("X");
        if (keys['v'] || keys['V']) this.triggerAbility("V");

        // Camera Follow
        if (cameraControl) {
            cameraControl.update(deltaTime);
        } else {
            // Fallback (shouldn't happen if initialized)
            camera.position.x = myPlayerMesh.position.x;
            camera.position.z = myPlayerMesh.position.z + 10;
            camera.lookAt(myPlayerMesh.position);
        }

        // Network Sync
        if (socket && socket.readyState === WebSocket.OPEN) {
            const now = Date.now();
            if (now - (gameState.lastMove || 0) > 50) {
                // Check if actually moved? 
                // Controller updates mesh directly so we just read it
                socket.send(JSON.stringify({
                    type: 'move',
                    x: myPlayerMesh.position.x,
                    y: myPlayerMesh.position.y,
                    z: myPlayerMesh.position.z,
                    ry: myPlayerMesh.rotation.y
                }));
                gameState.lastMove = now;
            }
        }
    }

}
gameState.lastMove = now;

// Remove the misplaced `if (intersects.length > 0)` block from here
// It seems to be part of a different function or was incorrectly placed.
// The instruction implies it should be outside `updatePlayer` or in a different context.
// For now, I'll assume it was a remnant and the user wants to restore the collision/camera logic.
// If it was meant to be inside updatePlayer, the instruction would have placed it differently.

// The following block was originally after the closing brace of updatePlayer.
// I will keep it in its original relative position, outside updatePlayer.
if (intersects.length > 0) {
    // Find the root object with userData
    let obj = intersects[0].object;
    while (obj.parent && (!obj.userData || !obj.userData.id)) {
        obj = obj.parent;
    }

    if (obj.userData) {
        const dist = myPlayerMesh.position.distanceTo(obj.position);
        if (dist < 8) { // Melee Range
            if (obj.userData.type === "mob") {
                socket.send(JSON.stringify({
                    type: 'mob_hit',
                    item: obj.userData.id
                }));
                // Visual Feedback
                window.hitSystem = window.hitSystem || new HitSystem(scene);
                window.hitSystem.showDamage(obj.position.clone().add(new THREE.Vector3(0, 2, 0)), 10);
            } else if (obj.userData.type === "player") {
                socket.send(JSON.stringify({
                    type: 'player_hit',
                    item: obj.userData.id
                }));
                // Visual Feedback
                window.hitSystem = window.hitSystem || new HitSystem(scene);
                window.hitSystem.showDamage(obj.position.clone().add(new THREE.Vector3(0, 2, 0)), 10);
            }
        }
    }
}


// Skill keys
window.addEventListener('keydown', (e) => {
    if (['z', 'x', 'c', 'v', 'f'].includes(e.key.toLowerCase())) {
        if (skillSystem) skillSystem.castSkill(e.key);
    }

    // Interaction System handled in interaction.js (E)
    // Boat System handled in boats.js (F)

    // Weapon Keys
    if (e.key === '1') combat.setWeapon('melee');
    if (e.key === '2') combat.setWeapon('katana');
    if (e.key === '3') combat.setWeapon('cutlass');
    if (e.key === '4') combat.setWeapon('pipe');
    if (e.key === '5') combat.setWeapon('bazooka');
});


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    updatePlayer(deltaTime);

    if (window.zoneSystem && myPlayerMesh) {
        window.zoneSystem.update(myPlayerMesh.position);
    }

    if (window.particleSystem) {
        window.particleSystem.update(deltaTime);
    }

    // Physics Update (Gravity etc)
    // Only apply physics if NOT driving a boat
    const isDriving = window.boatSystem && window.boatSystem.drivingBoat;

    if (gameState.isPlaying && physics && myPlayerMesh && !isDriving) {
        const input = { jump: keys[' '] }; // Spacebar
        const canWalkOnWater = gameState.equippedItem === "Ice Fruit";
        // Light Flight (Feature 3) or Rocket Flight (Feature 27)
        const isFlying = (gameState.equippedItem === "Light Fruit" || gameState.equippedItem === "Rocket Fruit") && keys[' ']; // Hold space
        const canDoubleJump = gameState.equippedItem === "Falcon Fruit";
        const lowGravity = gameState.equippedItem === "Gravity Fruit";
        const superJump = gameState.equippedItem === "Spring Fruit";

        if (input.jump && physics.isGrounded) {
            // Jump Particles
            if (window.particleSystem) {
                window.particleSystem.emit(myPlayerMesh.position, 'jump');
            }
        }

        physics.update(myPlayerMesh, deltaTime, input, canWalkOnWater, isFlying, canDoubleJump, lowGravity, superJump);

        // Quake Screen Shake (Feature 21)
        if (gameState.equippedItem === "Quake Fruit" && (keys['z'] || keys['Z'])) {
            // Shake effect when ability key held/pressed
            // Or maybe just passive low rumble? 
            // Logic: Random offset to camera
            camera.position.x += (Math.random() - 0.5) * 0.5;
            camera.position.y += (Math.random() - 0.5) * 0.5;
        }

        // Oxygen System
        const waterLevel = 1.8; // Slightly below surface
        if (myPlayerMesh.position.y < waterLevel) {
            // Underwater
            gameState.player.oxygen = Math.max(0, (gameState.player.oxygen || 100) - 10 * deltaTime);
            if (gameState.player.oxygen <= 0) {
                // Drown Damage
                // gameState.player.health -= 5 * deltaTime; 
                // Implement damage logic later
            }
        } else {
            // Surface
            gameState.player.oxygen = Math.min(100, (gameState.player.oxygen || 100) + 20 * deltaTime);
        }

        // Update UI
        const oxyBar = document.getElementById('oxygen-bar-fill');
        if (oxyBar) {
            oxyBar.style.width = (gameState.player.oxygen || 100) + '%';
        }

    }

    if (window.dayNightCycle) window.dayNightCycle.update(deltaTime);
    // Update Floating Text
    if (window.floatingText) window.floatingText.update(deltaTime);
    if (window.effects) window.effects.update(deltaTime);

    if (window.interactionSystem) window.interactionSystem.update();
    if (window.boatSystem) window.boatSystem.update(deltaTime);
    if (window.boatSystem) window.boatSystem.update(deltaTime);
    if (window.skillSystem) window.skillSystem.update(deltaTime);
    if (window.weatherSystem) window.weatherSystem.update(deltaTime);
    if (window.ghostEffect) window.ghostEffect.update(deltaTime);
    if (window.fruitSystem) window.fruitSystem.update(deltaTime, gameState.mobs); // Projectiles with collision

    renderer.render(scene, camera);
}

function updateUI() {
    // Update Money
    const moneyEl = document.getElementById('money-display'); // Need to add this ID to HTML
    if (moneyEl) moneyEl.innerText = "$ " + (gameState.player.money || 0);

    // Update Hotbar (Simple list for now)
    const hotbar = document.getElementById('hotbar-container'); // Need to add to HTML
    if (hotbar) {
        hotbar.innerHTML = ''; // Clear
        (gameState.player.inventory || []).forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.innerText = item.charAt(0).toUpperCase(); // First letter icon
            slot.title = item;
            slot.onclick = () => {
                // Equip Request
                socket.send(JSON.stringify({ type: 'set_weapon', weapon: item }));
            };
            hotbar.appendChild(slot);
        });
    }

    function updateQuestUI() {
        const q = gameState.player.activeQuest;
        if (q) {
            document.getElementById('quest-title').innerText = q.name;
            document.getElementById('quest-progress').innerText = `${q.current}/${q.targetCount} ${q.target}s`;
        }
    }
}

// window.onload = init; // Now handled by Login Button via startGame()