package main

import (
	"fmt"
	"testing"
)

func BenchmarkMobUpdate(b *testing.B) {
	hub := newHub()
	hub.MobManager = NewMobManager(hub)

	// Spawn 1000 players
	for i := 0; i < 1000; i++ {
		id := fmt.Sprintf("player_%d", i)
		hub.players[id] = &Player{
			ID:     id,
			X:      float64(i % 100),
			Z:      float64(i / 100),
			Weapon: "None",
		}
	}

	// Spawn 1000 mobs
	for i := 0; i < 1000; i++ {
		id := fmt.Sprintf("mob_%d", i)
		hub.MobManager.SpawnMob(id, "Gorilla", float64(i%100), float64(i/100))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		hub.MobManager.Update(0.05)
	}
}
