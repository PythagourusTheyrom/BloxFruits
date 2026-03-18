package main

import (
	"testing"
	"time"
)

func TestMobManager_Update_DeadMob(t *testing.T) {
	hub := newHub()
	mm := NewMobManager(hub)

	mm.SpawnMob("mob1", "Gorilla", 10.0, 10.0)
	mob := mm.Mobs["mob1"]
	mob.State = StateDead
	mob.X = 15.0
	mob.Z = 15.0

	mm.Update(1.0)

	if mob.X != 15.0 || mob.Z != 15.0 || mob.State != StateDead {
		t.Errorf("Dead mob should not change state or position: %+v", mob)
	}
}

func TestMobManager_Update_ReturnToSpawn(t *testing.T) {
	hub := newHub()
	mm := NewMobManager(hub)

	mm.SpawnMob("mob1", "Gorilla", 0.0, 0.0)
	mob := mm.Mobs["mob1"]
	// Move mob away from spawn
	mob.X = 10.0
	mob.Z = 10.0
	mob.State = StateIdle

	mm.Update(1.0) // 1 second elapsed

	if mob.State != StateIdle {
		t.Errorf("Mob returning to spawn should remain idle, got: %s", mob.State)
	}

	distToSpawn := distance(mob.X, mob.Z, mob.spawnX, mob.spawnZ)
	expectedDist := distance(10.0, 10.0, 0.0, 0.0)

	// Since it moved, distance to spawn should be less than original 14.14
	if distToSpawn >= expectedDist {
		t.Errorf("Mob did not move towards spawn: distToSpawn=%f, expected < %f", distToSpawn, expectedDist)
	}
}

func TestMobManager_Update_ChasePlayer(t *testing.T) {
	hub := newHub()
	mm := NewMobManager(hub)

	// Safe zone logic: players in safe zone are ignored.
	// isSafeZone is distance < 45.0 from (0,0). So place player and mob far away, e.g. (100, 100).
	mm.SpawnMob("mob1", "Gorilla", 100.0, 100.0)
	mob := mm.Mobs["mob1"]

	hub.players["player1"] = &Player{
		ID: "player1",
		X:  105.0, // distance 5.0 (within 15.0 detection radius)
		Z:  100.0,
	}

	mm.Update(1.0)

	if mob.State != StateChase {
		t.Errorf("Mob should chase nearby player, got: %s", mob.State)
	}
	if mob.TargetID != "player1" {
		t.Errorf("Mob should target player1, got: %s", mob.TargetID)
	}
	if mob.X <= 100.0 {
		t.Errorf("Mob should move towards player, new X=%f", mob.X)
	}
}

func TestMobManager_Update_AttackState(t *testing.T) {
	hub := newHub()
	mm := NewMobManager(hub)

	mm.SpawnMob("mob1", "Gorilla", 100.0, 100.0)
	mob := mm.Mobs["mob1"]

	hub.players["player1"] = &Player{
		ID:     "player1",
		X:      101.0, // distance 1.0 (<= 1.5 attack radius)
		Z:      100.0,
		Health: 100,
	}

	mm.Update(1.0)

	if mob.State != StateAttack {
		t.Errorf("Mob should attack when very close, got: %s", mob.State)
	}
}

func TestMobManager_Update_SafeZone(t *testing.T) {
	hub := newHub()
	mm := NewMobManager(hub)

	mm.SpawnMob("mob1", "Gorilla", 10.0, 10.0) // inside safe zone
	mob := mm.Mobs["mob1"]

	hub.players["player1"] = &Player{
		ID: "player1",
		X:  12.0, // distance 2.0 (inside detection radius)
		Z:  10.0,
	}

	mm.Update(1.0)

	if mob.State != StateIdle {
		t.Errorf("Mob should ignore player in safe zone, got: %s", mob.State)
	}
	if mob.TargetID != "" {
		t.Errorf("Mob should not target player in safe zone, got: %s", mob.TargetID)
	}
}

func TestMobManager_Update_StunWakeup(t *testing.T) {
	hub := newHub()
	mm := NewMobManager(hub)

	mm.SpawnMob("mob1", "Gorilla", 100.0, 100.0)
	mob := mm.Mobs["mob1"]

	mob.State = StateCharmed
	// Stun ended 1 ms ago
	mob.StunEnd = time.Now().UnixMilli() - 1

	mm.Update(1.0)

	if mob.State != StateIdle {
		t.Errorf("Mob should wake up from charm/stun when timer expires, got: %s", mob.State)
	}
}
