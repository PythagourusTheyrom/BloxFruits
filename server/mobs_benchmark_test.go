package main

import (
	"testing"
)

func BenchmarkMobManagerUpdate(b *testing.B) {
	hub := newHub()
	hub.MobManager = NewMobManager(hub)

	hub.players["player1"] = &Player{
		ID:     "player1",
		X:      0,
		Y:      0,
		Z:      0,
		Health: 100,
	}

	hub.MobManager.SpawnMob("mob1", "Ice Admiral", 2, 2)

	// Start hub background goroutine to drain broadcast
	go func() {
		for range hub.broadcast {
		}
	}()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		hub.MobManager.Mobs["mob1"].AbilityCD = 0 // Force cast
		hub.MobManager.Update(0.05)
	}
}
