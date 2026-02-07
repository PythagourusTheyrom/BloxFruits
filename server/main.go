package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"math/rand"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

// Game State Types
type Player struct {
	ID        string  `json:"id"`
	RoomID    string  `json:"-"` // Internal use
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Z         float64 `json:"z"`
	Health    int     `json:"health"`
	MaxHealth int     `json:"maxHealth"`
	Energy    int     `json:"energy"`
	MaxEnergy int     `json:"maxEnergy"` // Added for completeness if needed logic

	// Gameplay Stats
	Team         string   `json:"team"`   // "marine" or "pirate"
	Weapon       string   `json:"weapon"` // "katana", etc
	Level        int      `json:"level"`
	Exp          int      `json:"exp"`
	Money        int      `json:"money"`
	Bounty       int      `json:"bounty"`
	Inventory    []string `json:"inventory"`
	CurrentFruit string   `json:"currentFruit"`
	Luck         float64  `json:"luck"`
	ActiveQuest  *Quest   `json:"activeQuest"`
	LastAttack   int64    `json:"-"`

	MsgChan      chan []byte `json:"-"`
	items        []string    // Private inventory mirror? Or unused? Keeping to avoid breaks if used.
	EquippedItem string      `json:"equipped"` // Redundant with Weapon but used in struct?
	Role         string      `json:"role"`
	HakiActive   bool        `json:"hakiActive"`
}

type Quest struct {
	Name        string `json:"name"`        // "Defeat Gorillas"
	Target      string `json:"target"`      // "Gorilla"
	TargetCount int    `json:"targetCount"` // 5
	Current     int    `json:"current"`     // 0
	RewardExp   int    `json:"rewardExp"`
	RewardMoney int    `json:"rewardMoney"`
}

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	clients      map[*websocket.Conn]string // Conn -> PlayerID
	players      map[string]*Player
	register     chan *websocket.Conn
	unregister   chan *websocket.Conn
	broadcast    chan []byte
	mutex        sync.Mutex
	CurrentEvent string
	tokens       map[string]string // Token -> Username
	MobManager   *MobManager
}

// clientsUnsafe searches for a connection by playerID.
// Caller MUST hold h.mutex.
func (h *Hub) clientsUnsafe(playerID string) (*websocket.Conn, bool) {
	for conn, id := range h.clients {
		if id == playerID {
			return conn, true
		}
	}
	return nil, false
}

func newHub() *Hub {
	return &Hub{
		clients:      make(map[*websocket.Conn]string),
		players:      make(map[string]*Player),
		register:     make(chan *websocket.Conn),
		unregister:   make(chan *websocket.Conn),
		broadcast:    make(chan []byte),
		CurrentEvent: "None",
		tokens:       make(map[string]string),
	}
}

func (h *Hub) run() {
	// ~1200 TPS (High tick rate for smooth movement?)
	// Actually 1200 TPS is overkill. Let's do 60 TPS -> 16ms
	// The original code had 833us which is wild. Let's fix it to 16ms (60hz)
	gameTicker := time.NewTicker(16 * time.Millisecond)

	incomeTicker := time.NewTicker(5 * time.Second)    // Passive income
	saveTicker := time.NewTicker(10 * time.Second)     // Persistence
	eventTicker := time.NewTicker(60 * time.Second)    // Change event every minute
	mobTicker := time.NewTicker(50 * time.Millisecond) // 20 TPS for AI

	defer gameTicker.Stop()
	defer incomeTicker.Stop()
	defer saveTicker.Stop()
	defer eventTicker.Stop()
	defer mobTicker.Stop()

	defer mobTicker.Stop()

	// MOB MANAGER INIT
	h.MobManager = NewMobManager(h)
	// Spawn Gorillas
	for i := 0; i < 5; i++ {
		h.MobManager.SpawnMob(generateID(), "Gorilla", -50+float64(i*5), -50)
	}

	for {
		select {
		case conn := <-h.register:
			// ... (keep existing register logic) ...
			h.mutex.Lock()
			username := ""
			roomID := "public_1"

			if uVal := conn.Locals("username"); uVal != nil {
				if uname, ok := uVal.(string); ok {
					username = uname
				}
			}
			if rVal := conn.Locals("room"); rVal != nil {
				if rId, ok := rVal.(string); ok {
					roomID = rId
				}
			}

			if username == "" {
				// Should not happen if auth middleware works, but safety net
				h.mutex.Unlock()
				conn.Close()
				continue
			}

			h.clients[conn] = username

			// Load player from DB if not in memory
			if _, ok := h.players[username]; !ok {
				p, err := LoadUser(username)
				if err != nil {
					// Fallback to new player if error (shouldn't happen if registered)
					log.Printf("Error loading user %s: %v", username, err)
					h.players[username] = &Player{
						ID:     username,
						RoomID: roomID,
						X:      0, Y: 3.5, Z: 0,
						Health: 100, MaxHealth: 100,
						Team:  "neutral",
						Money: 5000, Inventory: []string{"melee"}, Luck: 1.0,
					}
				} else {
					p.RoomID = roomID // Update room
					h.players[username] = p
				}
			} else {
				// Already in memory (maybe reconnected), just update room
				h.players[username].RoomID = roomID
			}

			h.mutex.Unlock()
			log.Printf("Player connected: %s", username)

			// Send valid ID back to client
			initMsg := map[string]interface{}{
				"type":      "init",
				"id":        username,
				"money":     h.players[username].Money, // Send initial stats
				"inventory": h.players[username].Inventory,
				"role":      h.players[username].Role,
			}
			jsonMsg, _ := json.Marshal(initMsg)
			conn.WriteMessage(websocket.TextMessage, jsonMsg)

		case conn := <-h.unregister:
			h.mutex.Lock()
			if id, ok := h.clients[conn]; ok {
				delete(h.clients, conn)
				delete(h.players, id) // Ideally persist before deleting, but we save regularly
				log.Printf("Player disconnected: %s", id)
			}
			h.mutex.Unlock()

		case msg := <-h.broadcast:
			h.mutex.Lock()
			for conn := range h.clients {
				// Simple broadcast to all.
				// In production, might want non-blocking or targeted.
				// For now, this ensures things like Chat and Events work.
				// Ignore errors for now or log them?
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					log.Printf("Broadcast error: %v", err)
					conn.Close()
					delete(h.clients, conn)
					delete(h.players, h.clients[conn])
				}
			}
			h.mutex.Unlock()

		case <-incomeTicker.C:
			h.mutex.Lock()
			amount := 50
			if h.CurrentEvent == "Gold Rush" {
				amount = 100
			}
			for _, p := range h.players {
				p.Money += amount
			}
			h.mutex.Unlock()

		case <-eventTicker.C:
			h.mutex.Lock()
			r := time.Now().UnixNano() % 100
			if r < 33 {
				h.CurrentEvent = "None"
			} else if r < 66 {
				h.CurrentEvent = "Gold Rush" // 2x Money
			} else {
				h.CurrentEvent = "Double Luck" // 2x Luck
			}
			eventMsg := map[string]interface{}{
				"type": "event",
				"name": h.CurrentEvent,
			}
			msg, _ := json.Marshal(eventMsg)
			h.mutex.Unlock()

			// Broadcast event
			for conn := range h.clients {
				conn.WriteMessage(websocket.TextMessage, msg)
			}

		case <-saveTicker.C:
			go h.saveData()

		case <-mobTicker.C:
			h.MobManager.Update(0.05) // 50ms = 0.05s

			// Phoenix Regen (Feature 16)
			// Check every tick? Or slower? 50ms is too fast for massive regen.
			// Let's do it every 20 ticks -> 1 sec roughly, or just check time.
			// Or just small amount per tick.
			// 100 HP max. 1 HP per second?
			// 50ms ticks. 1/20 chance.
			h.mutex.Lock()
			if time.Now().UnixNano()%20 == 0 { // Simple throttle
				for _, p := range h.players {
					if p.Weapon == "Phoenix Fruit" && p.Health < p.MaxHealth {
						p.Health += 5
						if p.Health > p.MaxHealth {
							p.Health = p.MaxHealth
						}
					}
				}
			}
			h.mutex.Unlock()

			// Broadcast Mob State
			h.MobManager.mutex.Lock()
			mobData := make(map[string]*Mob)
			for k, v := range h.MobManager.Mobs {
				if v.State != StateDead {
					mobData[k] = v
				}
			}
			h.MobManager.mutex.Unlock()

			mobMsg, _ := json.Marshal(map[string]interface{}{
				"type": "mob_update",
				"mobs": mobData,
			})

			h.mutex.Lock()
			for conn := range h.clients {
				conn.WriteMessage(websocket.TextMessage, mobMsg)
			}
			h.mutex.Unlock()

		case <-gameTicker.C:
			// Broadcast Game State PER ROOM
			h.mutex.Lock()
			// ... (keep existing game broadcast logic) ...
			// 1. Group players by room
			roomStates := make(map[string]map[string]*Player)
			for id, p := range h.players {
				if _, ok := roomStates[p.RoomID]; !ok {
					roomStates[p.RoomID] = make(map[string]*Player)
				}
				roomStates[p.RoomID][id] = p
			}

			// 2. Send to clients based on their room
			for conn, pid := range h.clients {
				player, ok := h.players[pid]
				if !ok {
					continue
				}

				// Get state for this player's room
				roomState := roomStates[player.RoomID]

				stateMsg, _ := json.Marshal(map[string]interface{}{
					"type":    "state",
					"players": roomState,
				})

				if err := conn.WriteMessage(websocket.TextMessage, stateMsg); err != nil {
					log.Println("Write error:", err)
					conn.Close()
					delete(h.clients, conn)
				}
			}
			h.mutex.Unlock()
		}
	}
}

func (h *Hub) saveData() {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	for _, p := range h.players {
		if err := SaveUser(p); err != nil {
			log.Printf("Error saving user %s: %v", p.ID, err)
		}
	}
	// log.Println("All users saved to DB")
}

// Input message from client
type InputMessage struct {
	Type   string  `json:"type"`
	ID     string  `json:"id"`
	X      float64 `json:"x,omitempty"`
	Z      float64 `json:"z,omitempty"`
	Team   string  `json:"team,omitempty"`
	Weapon string  `json:"weapon,omitempty"`
	Item   string  `json:"item,omitempty"` // For buying/equipping
}

func main() {
	reset := flag.Bool("reset", false, "Reset the database")
	port := flag.String("port", "3000", "Port to listen on")
	flag.Parse()

	initDB()

	if *reset {
		ResetDB()
	}

	app := fiber.New()
	app.Use(cors.New()) // Enable CORS

	hub := newHub()
	go hub.run()

	// Serve Static Files (Frontend)
	app.Static("/", "../client")

	// WebSocket Endpoint
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			token := c.Query("token")
			room := c.Query("room")

			// Verify Token
			hub.mutex.Lock()
			username, ok := hub.tokens[token]
			hub.mutex.Unlock()

			if !ok {
				return fiber.ErrUnauthorized
			}

			if room == "" {
				room = "public_1"
			}
			c.Locals("username", username)
			c.Locals("room", room)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		hub.register <- c
		defer func() {
			hub.unregister <- c
			c.Close()
		}()

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				break
			}

			var input InputMessage
			if err := json.Unmarshal(msg, &input); err != nil {
				continue
			}

			// Handle Input
			hub.mutex.Lock()
			playerID := hub.clients[c]
			if player, ok := hub.players[playerID]; ok {
				switch input.Type {
				// ... existing cases ...
				case "move":
					player.X = input.X
					player.Z = input.Z
				case "join_team":
					player.Team = input.Team
				case "set_weapon":
					// Verify ownership
					if hasItem(player.Inventory, input.Weapon) || input.Weapon == "melee" {
						player.Weapon = input.Weapon
					}
				case "roll_fruit":
					if player.Money >= 1000 {
						player.Money -= 1000

						// Calculate Luck
						playerLuck := player.Luck
						if hub.CurrentEvent == "Double Luck" {
							playerLuck *= 2.0
						}

						fruit := rollRandomFruit(playerLuck)
						player.Inventory = append(player.Inventory, fruit)

						// Send Update
						updateMsg, _ := json.Marshal(map[string]interface{}{
							"type":      "update_stats",
							"money":     player.Money,
							"inventory": player.Inventory,
							"new_item":  fruit,
						})
						c.WriteMessage(websocket.TextMessage, updateMsg)
					}
				case "buy_weapon":
					price := getWeaponPrice(input.Item)
					if price > 0 && player.Money >= price {
						if !hasItem(player.Inventory, input.Item) {
							player.Money -= price
							player.Inventory = append(player.Inventory, input.Item)

							// Send Update
							updateMsg, _ := json.Marshal(map[string]interface{}{
								"type":      "update_stats",
								"money":     player.Money,
								"inventory": player.Inventory,
								"new_item":  input.Item,
							})
							c.WriteMessage(websocket.TextMessage, updateMsg)
						}
					}
				case "accept_quest":
					// Simple Hardcoded Quest for now
					if input.Item == "gorilla_quest" {
						player.ActiveQuest = &Quest{
							Name:        "Defeat Gorillas",
							Target:      "Gorilla",
							TargetCount: 5,
							Current:     0,
							RewardExp:   500,
							RewardMoney: 200,
						}
						// Send Update
						c.WriteMessage(websocket.TextMessage, createQuestUpdateMsg(player))
					}
				case "mob_hit":
					// Click Attack (Weapon)
					// Check Cooldown
					now := time.Now().UnixMilli()
					cooldown := getWeaponCooldown(player.Weapon)
					if now-player.LastAttack < cooldown {
						continue // Too fast
					}
					player.LastAttack = now

					mobID := input.Item
					damage := getWeaponDamage(player.Weapon)

					// Range Validation
					hub.MobManager.mutex.Lock()
					if mob, ok := hub.MobManager.Mobs[mobID]; ok {
						dist := math.Sqrt(math.Pow(mob.X-player.X, 2) + math.Pow(mob.Z-player.Z, 2))
						// Weapon Range
						maxRange := 15.0 // Melee/Sword
						if player.Weapon == "bazooka" || player.Weapon == "slingshot" {
							maxRange = 80.0
						}

						if dist > maxRange {
							hub.MobManager.mutex.Unlock()
							continue // Out of range
						}
					} else {
						hub.MobManager.mutex.Unlock()
						continue
					}
					hub.MobManager.mutex.Unlock() // Unlock before processing damage which might lock again?

					handleMobDamage(hub, player, mobID, damage, c)

				case "player_hit":
					// PvP Logic
					now := time.Now().UnixMilli()
					cooldown := getWeaponCooldown(player.Weapon)
					if now-player.LastAttack < cooldown {
						continue
					}
					player.LastAttack = now

					victimID := input.Item
					damage := getWeaponDamage(player.Weapon)

					// Range Check
					hub.mutex.Lock()
					victim, ok := hub.players[victimID]
					if ok {
						dist := math.Sqrt(math.Pow(victim.X-player.X, 2) + math.Pow(victim.Z-player.Z, 2))
						maxRange := 15.0
						if player.Weapon == "bazooka" || player.Weapon == "slingshot" {
							maxRange = 80.0
						}
						if dist > maxRange {
							hub.mutex.Unlock()
							continue
						}
					}
					hub.mutex.Unlock()

					if ok {
						handlePlayerDamage(hub, player, victimID, damage, c)
					}

				case "ability_hit":
					// Fruit Ability Hit
					// Input: Item = MobID
					// We need ability name... reusing Weapon field? Or separate?
					// Let's assume input.Item is MobID, input.Weapon is AbilityName (Reuse field for ease)

					mobID := input.Item
					ability := input.Weapon

					// Range Check Loop for Ability
					// Sanity Check: Max 100 distance for any ability for now
					hub.MobManager.mutex.Lock()
					if mob, ok := hub.MobManager.Mobs[mobID]; ok {
						dist := math.Sqrt(math.Pow(mob.X-player.X, 2) + math.Pow(mob.Z-player.Z, 2))
						hub.MobManager.mutex.Unlock()
						// Max Range needed.
						if dist > 150.0 { // Generous range for now
							continue
						}
					} else {
						hub.MobManager.mutex.Unlock()
						continue // Mob not found
					}

					// Haki Logic

					// Haki Logic
					damageMultiplier := 1.0
					if player.HakiActive {
						damageMultiplier = 1.2
					}

					// Check Cooldown
					now := time.Now().UnixMilli()
					cooldown := getWeaponCooldown(ability)
					if now-player.LastAttack < cooldown {
						continue // Too fast
					}
					player.LastAttack = now

					damage := 0
					switch ability {
					case "melee":
						damage = getWeaponDamage(player.Weapon)
					case "Fireball":
						damage = 40
					case "FlamePillar":
						damage = 60
					case "IceShards":
						damage = 25
					case "IceSurge":
						damage = 50
					case "LoveBeam":
						damage = 30
						// Apply Charm State Logic?
						// We need to access MobManager and set state.
						// handleMobDamage can handle it if we pass ability name?
						// Currently handleMobDamage only takes damage.
						// We can modify handleMobDamage OR do it here if we lock MobManager.
						// Let's do it here for specific effect:
						hub.MobManager.mutex.Lock()
						if mob, ok := hub.MobManager.Mobs[mobID]; ok {
							mob.State = StateCharmed
							mob.StunEnd = now + 5000 // 5s Charm
						}
						hub.MobManager.mutex.Unlock()
					case "MagmaRain":
						damage = 70
					case "LightSpeed":
						damage = 80
					case "Transform":
						damage = 100
					case "DragonBreath":
						damage = 60
					case "Tornado":
						damage = 30
					}

					if damage > 0 {
						damage = int(float64(damage) * damageMultiplier) // Apply Haki buff
						handleMobDamage(hub, player, mobID, damage, c)

					}

				case "admin_action":
					if player.Role != "admin" && player.Role != "owner" {
						continue // Unauthorized
					}

					action := input.Item   // "kick", "ban", "grant", "teleport"
					target := input.Weapon // Target Player ID or Item Name
					// For grant, we might need more fields.
					// Let's assume input.Item is Action ("kick", "grant_item")
					// Weapon = TargetID
					// Team = Extra Value (e.g. Item Name for grant)

					switch action {
					case "kick":
						targetID := target
						// Find connection
						var targetConn *websocket.Conn
						for c, pid := range hub.clients {
							if pid == targetID {
								targetConn = c
								break
							}
						}
						if targetConn != nil {
							targetConn.WriteMessage(websocket.TextMessage, []byte(`{"type":"kicked","reason":"Admin Kicked"}`))
							targetConn.Close()
							// Hub unregister will handle cleanup
						}
					case "grant_item":
						targetID := target
						itemName := input.Team // Reusing Team field for Item Name
						if targetPlayer, ok := hub.players[targetID]; ok {
							targetPlayer.Inventory = append(targetPlayer.Inventory, itemName)
							// Notify Target
							// We need to find their conn to send update, or just wait for next sync?
							// Send stats update immediately
							for c, pid := range hub.clients {
								if pid == targetID {
									updateMsg, _ := json.Marshal(map[string]interface{}{
										"type":      "update_stats",
										"money":     targetPlayer.Money,
										"inventory": targetPlayer.Inventory,
										"new_item":  itemName,
									})
									c.WriteMessage(websocket.TextMessage, updateMsg)
									break
								}
							}
						}
					case "teleport":
						// Teleport self to target
						targetID := target
						if targetPlayer, ok := hub.players[targetID]; ok {
							player.X = targetPlayer.X
							player.Y = targetPlayer.Y
							player.Z = targetPlayer.Z
							// Position will update on next tick broadcast
						}
					case "use_haki_conqueror":
						// Range Check
						hakiRange := 20.0
						stunDuration := 5.0 // Seconds

						// Broadcast Visuals
						broadcastMsg := map[string]interface{}{
							"type": "event",
							"name": "ConquerorHaki",
							"id":   player.ID,
						}
						jsonMsg, _ := json.Marshal(broadcastMsg)
						hub.broadcast <- jsonMsg

						// Stun Mobs
						hub.MobManager.mutex.Lock()
						now := time.Now().UnixMilli()
						pX, pZ := player.X, player.Z
						for _, mob := range hub.MobManager.Mobs {
							dist := math.Sqrt(math.Pow(mob.X-pX, 2) + math.Pow(mob.Z-pZ, 2))
							if dist <= hakiRange {
								mob.State = StateStunned
								mob.StunEnd = now + int64(stunDuration*1000)
							}
						}
						hub.MobManager.mutex.Unlock()

					case "chat":
						msgContent := input.Item
						chatMsg := map[string]interface{}{
							"type": "chat",
							"id":   player.ID,
							"item": msgContent,
							"role": player.Role,
						}
						jsonMsg, _ := json.Marshal(chatMsg)
						hub.broadcast <- jsonMsg

					case "make_admin":
						if player.Role != "owner" {
							continue // Only Owner can make admins
						}
						targetID := target // Use TargetID as Username (Assuming ID=Username in this system)
						// Add to persistent storage
						AddPersistentAdmin(targetID)

						// Update runtime if online
						if targetPlayer, ok := hub.players[targetID]; ok {
							targetPlayer.Role = "admin"
							// Notify target?
							// Send new init msg or just text
							// We need to resend init to update client role if we want them to see admin panel immediately
							// or just tell them "You are now admin"
							if c, ok := hub.clientsUnsafe(targetID); ok {
								c.WriteMessage(websocket.TextMessage, []byte(`{"type":"notification","msg":"You are now an Admin!"}`))
								// Re-send init to update client role awareness
								initMsg := map[string]interface{}{
									"type":      "init",
									"id":        targetID,
									"money":     targetPlayer.Money,
									"inventory": targetPlayer.Inventory,
									"role":      targetPlayer.Role,
								}
								jsonMsg, _ := json.Marshal(initMsg)
								c.WriteMessage(websocket.TextMessage, jsonMsg)

							}
						}
					}
				}
			}
			hub.mutex.Unlock()
		}
	}))

	// Auth Endpoints
	app.Post("/api/register", func(c *fiber.Ctx) error {
		type RegisterRequest struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		var req RegisterRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}
		if req.Username == "" || req.Password == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Missing fields"})
		}

		if err := RegisterUser(req.Username, req.Password); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not register user"})
		}

		return c.JSON(fiber.Map{"status": "success"})
	})

	app.Post("/api/guest", func(c *fiber.Ctx) error {
		// Generate Guest ID
		guestID := fmt.Sprintf("Guest_%d", time.Now().UnixNano()%10000)

		// Create Guest User (No password needed for now, or use dummy)
		// We can reuse RegisterUser but we need to bypass password check for login?
		// Actually, let's just create a user entry directly in DB or memory.
		// Detailed logic:
		// 1. Create Player struct
		// 2. Save to DB/Memory
		// 3. Return Token (which is just username for now in this simple auth)

		// Create Player in Hub
		hub.mutex.Lock()
		if _, ok := hub.players[guestID]; !ok {
			p := &Player{
				ID:     guestID,
				RoomID: "public_1",
				X:      0, Y: 3.5, Z: 0,
				Health: 100, MaxHealth: 100,
				Team:      "neutral",
				Money:     1000, // Starter money
				Inventory: []string{"melee"},
				Luck:      1.0,
				Role:      "guest",
			}
			// Save to DB so it persists for this session at least
			if err := SaveUser(p); err != nil {
				hub.mutex.Unlock()
				return c.Status(500).JSON(fiber.Map{"error": "Could not create guest"})
			}
			hub.players[guestID] = p
		}

		// Generate Token (Simple UUID or just ID for this demo)
		token := guestID // In real app, use JWT. Here we use ID as token key in hub.tokens
		hub.tokens[token] = guestID
		hub.mutex.Unlock()

		return c.JSON(fiber.Map{
			"status":   "success",
			"token":    token,
			"username": guestID,
		})
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		type LoginRequest struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		user, err := AuthenticateUser(req.Username, req.Password)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
		}

		// Generate simple token
		token := generateID() // Reuse simple ID gen for token
		hub.mutex.Lock()
		hub.tokens[token] = user.ID
		// Pre-load player data into hub so it's ready for WS connection?
		// Actually WS connection logic creates new player or checks existing?
		// We should load data here or let WS handle it?
		// Best: Let WS handle it by checking DB if not in memory.
		// But AuthenticationUser returns *Player. We can cache it.
		// But wait, WS `register` creates new player?
		// We need to change `register` logic to NOT create new player if one exists in DB.
		// So we pass the loaded user to the hub via a temp map? Or just reload in WS.
		// Reloading in WS is safer.
		hub.mutex.Unlock()

		return c.JSON(fiber.Map{"token": token, "username": user.ID})
	})

	app.Post("/api/guest", func(c *fiber.Ctx) error {
		rand.Seed(time.Now().UnixNano())
		id := rand.Intn(90000) + 10000
		username := fmt.Sprintf("Guest_%d", id)
		password := "guest_pass"

		RegisterUser(username, password) // Ignore error, likely new

		user, err := AuthenticateUser(username, password)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Guest login failed"})
		}

		token := generateID()
		hub.mutex.Lock()
		hub.tokens[token] = user.ID
		hub.mutex.Unlock()

		return c.JSON(fiber.Map{"token": token, "username": user.ID})
	})

	log.Fatal(app.Listen(":" + *port))
}

func hasItem(inv []string, item string) bool {
	for _, i := range inv {
		if i == item {
			return true
		}
	}
	return false
}

func rollRandomFruit(_ float64) string {
	// r := float64(time.Now().UnixNano() % 100) // Unused now

	// Base Chances:
	// Dragon (Legendary): 10% (0-9)
	// Flame (Rare): 30% (10-39)
	// Spin (Common): 60% (40-99)

	// With Luck, we effectively increase the "hit window" for rare/legendary
	// OR we assume 'r' checks from 0 upwards and we scale the thresholds.

	// Simplified Roll Logic: Just uniform random for now to test roster
	// In production, use weighted table.
	// 28 Fruits
	fruits := []string{
		"Rocket Fruit", "Spin Fruit", "Chop Fruit", "Spring Fruit", "Bomb Fruit", "Smoke Fruit", "Spike Fruit", "Flame Fruit",
		"Falcon Fruit", "Ice Fruit", "Sand Fruit", "Dark Fruit", "Diamond Fruit", "Light Fruit", "Love Fruit", "Rubber Fruit",
		"Barrier Fruit", "Magma Fruit", "Quake Fruit", "Buddha Fruit", "String Fruit", "Phoenix Fruit", "Rumble Fruit", "Paw Fruit",
		"Gravity Fruit", "Dough Fruit", "Shadow Fruit", "Venom Fruit", "Control Fruit", "Dragon Fruit", "Leopard Fruit",
	}

	idx := int(time.Now().UnixNano()) % len(fruits)
	return fruits[idx]
}

/*
	legendaryThreshold := 10.0 * luck
	rareThreshold := (10.0 + 30.0) * luck

	if r < legendaryThreshold {
		return "Dragon Fruit"
	} else if r < rareThreshold {
		return "Flame Fruit"
	}
	return "Spin Fruit"
}
*/

func getWeaponPrice(item string) int {
	switch item {
	case "katana":
		return 1000
	case "cutlass":
		return 2500
	case "pipe":
		return 5000
	case "bazooka":
		return 10000
	}
	return 0
}

func createQuestUpdateMsg(p *Player) []byte {
	msg := map[string]interface{}{
		"type":        "quest_update",
		"activeQuest": p.ActiveQuest,
		"money":       p.Money,
		"exp":         p.Exp,
	}
	b, _ := json.Marshal(msg)
	return b
}

func generateID() string {
	return time.Now().Format("150405.000000") // Simple ID
}

func getWeaponDamage(w string) int {
	switch w {
	case "melee":
		return 10
	case "katana":
		return 20
	case "cutlass":
		return 30
	case "pipe":
		return 45
	case "bazooka":
		return 80
	}
	return 10
}

func getWeaponCooldown(w string) int64 {
	switch w {
	case "Fireball":
		return 1000
	case "FlamePillar":
		return 3000
	case "IceShards":
		return 800
	case "IceSurge":
		return 4000
	case "LightSpeed":
		return 1500
	case "Transform":
		return 5000 // Buddha
	case "LoveBeam":
		return 3000
	case "MagmaRain":
		return 3500
	case "Barrier":
		return 5000 // Wall CD
	case "DragonBreath":
		return 2000
	case "Tornado":
		return 1500
	case "melee":
		return 500 // ms
	case "katana":
		return 600
	case "cutlass":
		return 700
	case "pipe":
		return 1000
	case "bazooka":
		return 2000
	}
	return 500
}

// Safe Zone Logic
func isSafeZone(x, z float64) bool {
	// Spawn (Start Island) - Radius 45
	if distance(x, z, 0, 0) < 45.0 {
		return true
	}
	// Add other safe zones here if needed
	// Jungle Island (-50, -50), Radius 60 - Currently PvP Zone
	// Snow Island (50, 50), Radius 60 - Currently PvP Zone
	return false
}

// Helper to apply damage and handle rewards
func handleMobDamage(hub *Hub, player *Player, mobID string, damage int, c *websocket.Conn) {
	hub.MobManager.mutex.Lock()
	if mob, ok := hub.MobManager.Mobs[mobID]; ok {
		mob.Health -= damage
		if mob.Health <= 0 {
			mob.State = StateDead
			mob.Health = 0

			// Rewards
			player.Exp += mob.ExpReward

			bountyReward := 100
			if mob.IsBoss {
				bountyReward = 5000
			}
			player.Bounty += bountyReward

			// Notify Bounty Gain
			if c != nil {
				c.WriteMessage(websocket.TextMessage, []byte(`{"type":"notification","msg":"Bounty Increased!"}`))
			}

			// Quest Progress
			if player.ActiveQuest != nil && player.ActiveQuest.Target == mob.Type {
				player.ActiveQuest.Current++
				if player.ActiveQuest.Current >= player.ActiveQuest.TargetCount {
					// Complete
					player.Money += player.ActiveQuest.RewardMoney
					player.Exp += player.ActiveQuest.RewardExp
					player.ActiveQuest = nil

					// Simple "Quest Complete" bonus msg?
					if c != nil {
						c.WriteMessage(websocket.TextMessage, []byte(`{"type":"notification","msg":"Quest Completed!"}`))
					}
				}
				c.WriteMessage(websocket.TextMessage, createQuestUpdateMsg(player))
			}

			// Respawn
			go func(mid, mtype string, sx, sz float64) {
				time.Sleep(5 * time.Second)
				hub.MobManager.SpawnMob(mid, mtype, sx, sz)
			}(mob.ID, mob.Type, mob.spawnX, mob.spawnZ)
		}
	}
	hub.MobManager.mutex.Unlock()
}

func handlePlayerDamage(hub *Hub, attacker *Player, victimID string, damage int, c *websocket.Conn) {
	hub.mutex.Lock()
	victim, ok := hub.players[victimID]
	if !ok {
		hub.mutex.Unlock()
		return
	}

	// Safe Zone Check
	if isSafeZone(victim.X, victim.Z) || isSafeZone(attacker.X, attacker.Z) {
		hub.mutex.Unlock()
		// No PvP in Safe Zone
		if c != nil {
			c.WriteMessage(websocket.TextMessage, []byte(`{"type":"notification","msg":"PvP Disabled in Safe Zone!"}`))
		}
		return
	}

	// Team Check (No Friendly Fire, except Neutral?)
	if victim.Team == attacker.Team && victim.Team != "neutral" {
		hub.mutex.Unlock()
		return
	}

	// Level/Bounty Difference Protection? (Optional, skipping for now to keep simple)

	victim.Health -= damage
	if victim.Health <= 0 {
		victim.Health = 0

		// Kill Rewards Logic
		reward := 2500

		// If Attacker is Marine
		if attacker.Team == "marine" {
			// Killing Pirate gives Honor
			if victim.Team == "pirate" {
				attacker.Bounty += reward
			} else {
				// Killing other marines/civilians might reduce honor? For now just add.
				attacker.Bounty += reward
			}
		} else {
			// Pirate
			attacker.Bounty += reward
		}
		attacker.Money += 1000

		// Victim Bounty Loss
		loss := 1000
		if victim.Bounty > 0 {
			if victim.Bounty < loss {
				loss = victim.Bounty
			}
			victim.Bounty -= loss
		}

		// Notify Victim (Need to find conn)
		// We are holding hub.mutex, so we can check clients
		// But iterating clients inside handlePlayerDamage might be slow if many players.
		// For now, it's fine.
		// We will broadcast kill msg anyway.

	}
	hub.mutex.Unlock()

	if victim.Health == 0 {
		// Respawn Logic (Teleport to spawn)
		hub.mutex.Lock()
		victim.Health = victim.MaxHealth
		victim.X = 0
		victim.Y = 3.5
		victim.Z = 0
		hub.mutex.Unlock()

		// Broadcast Kill Msg
		killMsg := map[string]interface{}{
			"type": "chat",
			"id":   "SERVER",
			"item": attacker.ID + " killed " + victim.ID,
			"role": "system",
		}
		b, _ := json.Marshal(killMsg)
		hub.broadcast <- b
	}
}
