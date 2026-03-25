package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strings"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB

func initDB() {
	LoadAdmins() // Load persistent admins
	var err error
	db, err = sql.Open("sqlite3", "./bloxfruits.db")
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
	log.Println("Database initialized.")
}

func ResetDB() {
	if db == nil {
		return
	}
	_, err := db.Exec("DROP TABLE IF EXISTS users")
	if err != nil {
		log.Fatal("Failed to drop users table:", err)
	}
	log.Println("Database Reset: Users table dropped.")

	// Re-create
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
	log.Println("Database Re-initialized.")
}

func RegisterUser(username, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	role := "user"
	if username == "Owner" {
		ownerPassword := os.Getenv("OWNER_PASSWORD")
		if ownerPassword == "" {
			return errors.New("OWNER_PASSWORD environment variable is not set")
		}
		if password == ownerPassword {
			role = "owner"
		} else {
			return errors.New("invalid password for Owner account")
		}
	} else if isPersistentAdmin(username) {
		role = "admin"
	}

	// Create default player data
	defaultData := Player{
		ID:        username,
		Role:      role,
		X:         0,
		Y:         3.5,
		Z:         0,
		Health:    100,
		MaxHealth: 100,
		Team:      "neutral",
		Money:     5000,
		Inventory: NewInventory("melee"),
		Luck:      1.0,
	}
	jsonData, _ := json.Marshal(defaultData)

	_, err = db.Exec("INSERT INTO users (username, password_hash, data) VALUES (?, ?, ?)", username, string(hash), string(jsonData))
	return err
}

func AuthenticateUser(username, password string) (*Player, error) {
	var hash string
	var data string

	row := db.QueryRow("SELECT password_hash, data FROM users WHERE username = ?", username)
	err := row.Scan(&hash, &data)
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	var player Player
	if err := json.Unmarshal([]byte(data), &player); err != nil {
		return nil, err
	}

	// Ensure ID matches username just in case
	player.ID = username
	return &player, nil
}

func SaveUser(player *Player) error {
	data, err := json.Marshal(player)
	if err != nil {
		return err
	}
	_, err = db.Exec("UPDATE users SET data = ? WHERE username = ?", string(data), player.ID)
	return err
}

func SaveUsersBatch(playerData map[string]string) error {
	if len(playerData) == 0 {
		return nil
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	chunkSize := 499 // max variables limit in sqlite is 999
	var sb strings.Builder
	sb.Grow(1000)
	args := make([]interface{}, 0, chunkSize*2)

	count := 0
	totalCount := 0
	for username, data := range playerData {
		if count == 0 {
			sb.Reset()
			args = args[:0]
			sb.WriteString("WITH new_data(username, data) AS (VALUES ")
		}

		if count > 0 {
			sb.WriteString(", (?, ?)")
		} else {
			sb.WriteString("(?, ?)")
		}
		args = append(args, username, data)

		count++
		totalCount++

		if count == chunkSize || totalCount == len(playerData) {
			sb.WriteString(" ON CONFLICT(username) DO UPDATE SET data=excluded.data")
			_, err = tx.Exec(sb.String(), args...)
			if err != nil {
				tx.Rollback()
				return err
			}
			count = 0
		}
	}

	return tx.Commit()
}

func LoadUser(username string) (*Player, error) {
	var data string
	row := db.QueryRow("SELECT data FROM users WHERE username = ?", username)
	err := row.Scan(&data)
	if err != nil {
		return nil, err
	}

	var player Player
	if err := json.Unmarshal([]byte(data), &player); err != nil {
		return nil, err
	}
	player.ID = username
	return &player, nil
}

// Persistent Admin Logic
var persistentAdmins []string

func LoadAdmins() {
	file, err := os.ReadFile("admins.json")
	if err != nil {
		if os.IsNotExist(err) {
			persistentAdmins = []string{}
			return
		}
		log.Println("Error loading admins:", err)
		return
	}
	json.Unmarshal(file, &persistentAdmins)
}

func SaveAdmins() {
	data, _ := json.Marshal(persistentAdmins)
	os.WriteFile("admins.json", data, 0644)
}

func isPersistentAdmin(username string) bool {
	for _, u := range persistentAdmins {
		if u == username {
			return true
		}
	}
	return false
}

func AddPersistentAdmin(username string) {
	if !isPersistentAdmin(username) {
		persistentAdmins = append(persistentAdmins, username)
		SaveAdmins()
	}
}
