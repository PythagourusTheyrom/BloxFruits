package main

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"os"
	"testing"
)

func BenchmarkSaveData(b *testing.B) {
	// Setup: Initialize DB in a temporary file
	tmpDB, err := os.CreateTemp("", "test_bloxfruits.db")
	if err != nil {
		b.Fatal(err)
	}
	tmpDBName := tmpDB.Name()
	tmpDB.Close()
	defer os.Remove(tmpDBName)

	initTestDB(tmpDBName)
	defer db.Close()

	h := newHub()
	numPlayers := 100
	for i := 0; i < numPlayers; i++ {
		username := fmt.Sprintf("user%d", i)
		p := &Player{
			ID:     username,
			Money:  1000,
			Health: 100,
		}
		h.players[username] = p
		// Insert into DB first so UPDATE works
		RegisterUser(username, "password")
	}

	log.SetOutput(io.Discard) // Mute logs

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		h.saveData()
	}
}

func initTestDB(path string) {
	var err error
	db, err = sql.Open("sqlite3", path)
	if err != nil {
		log.Fatal(err)
	}

	createTableSQL := `CREATE TABLE IF NOT EXISTS users (
		"id" INTEGER PRIMARY KEY AUTOINCREMENT,
		"username" TEXT UNIQUE,
		"password_hash" TEXT,
		"data" TEXT
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}
