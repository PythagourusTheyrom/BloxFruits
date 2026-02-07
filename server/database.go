package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"os"

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
		if password == "#########" {
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
		Inventory: []string{"melee"},
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
