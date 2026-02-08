package main

import (
	"encoding/json"
	"math"
	"sync"
	"time"
)

type MobState string

const (
	StateIdle    MobState = "idle"
	StateChase   MobState = "chase"
	StateAttack  MobState = "attack"
	StateDead    MobState = "dead"
	StateCharmed MobState = "charmed"
	StateStunned MobState = "stunned"
)

type Mob struct {
	ID        string   `json:"id"`
	Type      string   `json:"type"` // "Gorilla", "Marine", etc.
	X         float64  `json:"x"`
	Y         float64  `json:"y"`
	Z         float64  `json:"z"`
	Health    int      `json:"health"`
	MaxHealth int      `json:"maxHealth"`
	State     MobState `json:"state"`
	TargetID  string   `json:"-"` // ID of player being chased
	Speed     float64  `json:"-"`
	Damage    int      `json:"-"`
	ExpReward int      `json:"-"`
	IsBoss    bool     `json:"isBoss"`
	Abilities []string `json:"-"`
	AbilityCD int64    `json:"-"` // Time when next ability can be used
	StunEnd   int64    `json:"-"` // Time when stun ends
	PoisonEnd int64    `json:"-"` // Time when poison ends

	spawnX float64
	spawnZ float64
}

type MobManager struct {
	Mobs  map[string]*Mob
	mutex sync.Mutex
	hub   *Hub
}

func NewMobManager(hub *Hub) *MobManager {
	return &MobManager{
		Mobs: make(map[string]*Mob),
		hub:  hub,
	}
}

func (mm *MobManager) SpawnMob(id, mobType string, x, z float64) {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()

	hp := 100
	dmg := 10
	speed := 2.0 // units per second

	switch mobType {
	case "Gorilla":
		hp = 200
		dmg = 15
		speed = 3.0
	case "Gorilla King":
		hp = 1000
		dmg = 50
		speed = 4.0
	case "Ice Admiral":
		hp = 5000
		dmg = 100
		speed = 5.0
	}

	mm.Mobs[id] = &Mob{
		ID:        id,
		Type:      mobType,
		X:         x,
		Y:         2.2, // Ground level approximation
		Z:         z,
		Health:    hp,
		MaxHealth: hp,
		State:     StateIdle,
		Speed:     speed,
		Damage:    dmg,
		ExpReward: hp / 2,
		spawnX:    x,
		spawnZ:    z,
		IsBoss:    mobType == "Gorilla King" || mobType == "Ice Admiral",
	}
}

func (mm *MobManager) Update(deltaTime float64) {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()

	now := time.Now().UnixMilli()

	for _, mob := range mm.Mobs {
		if mob.State == StateDead {
			continue
		}

		// Handle Stun/Charm
		if now < mob.StunEnd {
			mob.State = StateCharmed
			// Still take damage if poisoned
		} else if mob.State == StateCharmed {
			mob.State = StateIdle // Wake up
		}

		// Handle Poison (Venom Fruit)
		if now < mob.PoisonEnd {
			// Take DoT (every ~1s? or every tick?)
			// Every tick is too fast. Let's use random chance again for "tickrate"
			if math.Sin(float64(now)) > 0.8 {
				mob.Health -= 2
			}
		}

		// AI Logic
		// 1. Check for nearby players to chase
		var closestPlayer *Player
		minDist := 15.0 // Detection radius

		mm.hub.mutex.Lock()
		for _, p := range mm.hub.players {
			// Safe Zone Check - Mobs ignore players in safe zones
			if isSafeZone(p.X, p.Z) {
				continue
			}

			dist := distance(mob.X, mob.Z, p.X, p.Z)

			// Magma Aura Passive (Feature 6)
			// Apply tick damage every frame? Too fast.
			// Let's rely on randomness to throttle or add a BurnTimer.
			// Random 5% chance per tick (20 ticks/sec -> 1 hit/sec avg)
			if p.Weapon == "Magma Fruit" && dist < 8.0 {
				if math.Sin(float64(now)) > 0.95 { // Simple random throttle
					mob.Health -= 5
					// Don't kill implicitly here without rewards?
					// Let's just reduce health. If it dies, the next handleMobDamage check will fail?
					// Or just let it be 1 HP for player to finish.
					if mob.Health < 1 {
						mob.Health = 1
					}
				}
			}

			// Shadow Stealth (Feature 10)
			if p.Weapon == "Shadow Fruit" { // Renamed Ghost->Shadow in Roster
				// Detection radius reduced
				if dist > 5.0 {
					continue // Ignore player unless very close
				}
			}

			if dist < minDist {
				minDist = dist
				closestPlayer = p
			}
		}
		mm.hub.mutex.Unlock()

		if closestPlayer != nil {
			// Re-check Safe Zone (in case they just entered)
			if isSafeZone(closestPlayer.X, closestPlayer.Z) {
				mob.State = StateIdle
				mob.TargetID = ""
				continue
			}

			mob.State = StateChase
			mob.TargetID = closestPlayer.ID

			// Move towards player
			dx := closestPlayer.X - mob.X
			dz := closestPlayer.Z - mob.Z
			dist := math.Sqrt(dx*dx + dz*dz)

			if dist > 1.5 { // Keep distance to attack
				dirX := dx / dist
				dirZ := dz / dist

				// Dough Slow Aura (Feature 19)
				currentSpeed := mob.Speed
				if closestPlayer.Weapon == "Dough Fruit" {
					currentSpeed *= 0.5 // 50% Slow
				}

				mob.X += dirX * currentSpeed * deltaTime
				mob.Z += dirZ * currentSpeed * deltaTime

				// Boss Ability: Ice Spikes
				if mob.IsBoss && mob.Type == "Ice Admiral" {
					if now > mob.AbilityCD {
						// Range Check (e.g. 15 units)
						if dist < 15.0 {
							// Cast Ability
							mob.AbilityCD = now + 5000 // 5s Cooldown

							// Deal Damage to Player (Area of Effect)
							// Simple: Just Damage the target logic for now
							// In a real server, we'd spawn a "Projectile" entity.
							// Here we just instant hit for simplicity of prototype.
							mm.hub.mutex.Lock()
							closestPlayer.Health -= 30
							if closestPlayer.Health < 0 {
								closestPlayer.Health = 0
							}
							mm.hub.mutex.Unlock()

							// We should Broadcast this "Cast" to clients for Visuals!
							castMsg, _ := json.Marshal(map[string]interface{}{
								"type":      "mob_cast_ability",
								"mobId":     mob.ID,
								"ability":   "IceSpikes",
								"targetId":  closestPlayer.ID,
								"timestamp": now,
							})

							// Broadcast to all clients (simplified, ideally only room)
							// mm.hub.broadcast <- castMsg // This might lock if channel is full?
							// Better to iterate clients and send, or use a non-blocking send.
							// Since we are inside MobManager mutex, we must accept that sending might be slow?
							// Actually hub.broadcast is a channel read by hub.run loop.
							// BUT: sending to channel while holding mutex is fine IF the receiver doesn't need this mutex to read.
							// Hub.run reads broadcast, then does ... nothing with mutex usually?
							// Hub.run case msg := <-h.broadcast: _ = msg.
							// Wait, the broadcast handler in hub.run does NOTHING currently:
							// case msg := <-h.broadcast: _ = msg
							// This is a bug in Hub.run! It drops the message!

							// We need to fix Hub.run to actually broadcast.
							// For now, let's manually iterate clients here, BUT we need hub.mutex for that.
							// We have mm.mutex locked. Can we lock hub.mutex?
							// Order: Hub.run locks hub.mutex -> Calls MobManager.Update? NO.
							// Hub.run calls MobManager.Update in `case <-mobTicker.C`.
							// Does it hold hub.mutex? NO.
							// So it is SAFE to lock hub.mutex here.

							mm.hub.mutex.Lock()
							for c := range mm.hub.clients {
								c.WriteMessage(1, castMsg) // 1 = TextMessage
							}
							mm.hub.mutex.Unlock()
						}
					}
				}

			} else {
				// Attack Logic (Melee)
				mob.State = StateAttack
				// Simple Melee Damage
				// Only once per second? We need attack timer.
				// Reusing AbilityCD for melee timer for non-bosses? Or separate?
				// Let's keep it simple: If close, player takes minimal damage over time?
				// Or just frame-perfect damage (dangerous).
				// Let's add a random chance to hit per tick (poor man's cooldown)
				if math.Sin(float64(time.Now().UnixMilli())) > 0.9 {
					mm.hub.mutex.Lock()

					// Rubber Immunity (Feature 5)
					damage := mob.Damage
					if closestPlayer.Weapon == "Rubber Fruit" && !mob.IsBoss {
						damage = 0 // Immune to non-bosses
					}

					// Diamond Defense (Feature 12)
					if closestPlayer.Weapon == "Diamond Fruit" {
						damage = damage / 2 // 50% Reduction
					}

					// Rumble Stun Proc (Feature 15)
					if closestPlayer.Weapon == "Rumble Fruit" {
						if math.Sin(float64(now)+1.0) > 0.8 { // Random chance
							mob.State = StateCharmed // Reuse charmed state for stun
							mob.StunEnd = now + 2000 // 2s Stun
						}
					}

					if damage > 0 {
						closestPlayer.Health -= damage
						if closestPlayer.Health < 0 {
							closestPlayer.Health = 0
						}

						// Spike Thorns Reflection (Feature 11)
						if closestPlayer.Weapon == "Spike Fruit" {
							// Mob takes damage back
							mob.Health -= 10
							if mob.Health < 1 {
								mob.Health = 1
							}
						}

						// Venom Poison Application (Feature 18)
						if closestPlayer.Weapon == "Venom Fruit" {
							mob.PoisonEnd = now + 5000
						}

						// String Trap (Feature 20)
						if closestPlayer.Weapon == "String Fruit" {
							if math.Sin(float64(now)) > 0.6 {
								mob.StunEnd = now + 1500
								mob.State = StateCharmed
							}
						}

						// Leopard Boost (Feature 22)
						if closestPlayer.Weapon == "Leopard Fruit" {
							damage = damage / 2 // 50% Defense
						}

						// Dragon Scales (Feature 23)
						if closestPlayer.Weapon == "Dragon Fruit" {
							damage = damage - 5 // Flat reduction
							if damage < 0 {
								damage = 0
							}

							// Fire Thorns
							mob.Health -= 5 // Burn attacker
							if mob.Health < 1 {
								mob.Health = 1
							}
						}

						// Smoke Dodge (Feature 26)
						if closestPlayer.Weapon == "Smoke Fruit" {
							if math.Sin(float64(now)) > 0.0 { // 50% chance to dodge
								damage = 0
							}
						}

						// Chop Sword Immunity (Feature 28)
						// Assume Marines use Swords
						if closestPlayer.Weapon == "Chop Fruit" {
							if damage < 20 {
								damage = 0
							}
						}

						// Bomb Self-Destruct (Feature 25)
						if closestPlayer.Weapon == "Bomb Fruit" {
							// Let's do AOE return damage
							mob.Health -= 20
							if mob.Health < 1 {
								mob.Health = 1
							}
						}

						// Sand Trap (Feature 30)
						if closestPlayer.Weapon == "Sand Fruit" {
							if math.Sin(float64(now)) > 0.5 {
								mob.StunEnd = now + 1000 // 1s Stun
							}
						}
					}
					mm.hub.mutex.Unlock()
				}

				// Paw Knockback (Feature 14) - Passive Repel
				mm.hub.mutex.Lock()
				if closestPlayer.Weapon == "Paw Fruit" {
					dx := mob.X - closestPlayer.X
					dz := mob.Z - closestPlayer.Z
					mag := math.Sqrt(dx*dx + dz*dz)
					if mag > 0 && mag < 4.0 { // Push if too close
						dx /= mag
						dz /= mag
						mob.X += dx * 5.0 // Knockback
						mob.Z += dz * 5.0
					}
				}

				// Dark Black Hole (Feature 29) - Passive Pull
				if closestPlayer.Weapon == "Dark Fruit" {
					dx := mob.X - closestPlayer.X
					dz := mob.Z - closestPlayer.Z
					mag := math.Sqrt(dx*dx + dz*dz)
					if mag > 0 && mag < 10.0 && mag > 2.0 { // Pull if within 10 units but not too close
						dx /= mag
						dz /= mag
						mob.X -= dx * 2.0 * deltaTime // Pull towards player
						mob.Z -= dz * 2.0 * deltaTime
					}
				}
				mm.hub.mutex.Unlock()

			}
		} else {
			// Wander or Return to Spawn
			mob.State = StateIdle
			distToSpawn := distance(mob.X, mob.Z, mob.spawnX, mob.spawnZ)
			if distToSpawn > 1.0 {
				// Return to spawn
				dx := mob.spawnX - mob.X
				dz := mob.spawnZ - mob.Z
				dist := math.Sqrt(dx*dx + dz*dz)

				dirX := dx / dist
				dirZ := dz / dist

				mob.X += dirX * (mob.Speed * 0.5) * deltaTime
				mob.Z += dirZ * (mob.Speed * 0.5) * deltaTime
			}
		}
	}
}

func distance(x1, z1, x2, z2 float64) float64 {
	return math.Sqrt(math.Pow(x2-x1, 2) + math.Pow(z2-z1, 2))

