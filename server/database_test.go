package main

import (
	"os"
	"testing"
)

func TestRegisterUser_OwnerRole(t *testing.T) {
	// Initialize a temporary database for testing
	initDB()
	defer ResetDB()

	// Clean up environment variables after tests
	defer os.Unsetenv("OWNER_PASSWORD")

	tests := []struct {
		name          string
		envPassword   string
		registerUser  string
		registerPass  string
		expectErr     bool
		expectedRole  string
	}{
		{
			name:          "Owner creation fails if OWNER_PASSWORD is not set",
			envPassword:   "",
			registerUser:  "Owner",
			registerPass:  "testpass",
			expectErr:     true,
			expectedRole:  "",
		},
		{
			name:          "Owner creation fails with mismatched password",
			envPassword:   "correcthorse",
			registerUser:  "Owner",
			registerPass:  "wrongpass",
			expectErr:     true,
			expectedRole:  "",
		},
		{
			name:          "Owner creation succeeds with matching password",
			envPassword:   "correcthorse",
			registerUser:  "Owner",
			registerPass:  "correcthorse",
			expectErr:     false,
			expectedRole:  "owner",
		},
		{
			name:          "Regular user creation succeeds regardless of OWNER_PASSWORD",
			envPassword:   "secret",
			registerUser:  "RegularUser",
			registerPass:  "testpass",
			expectErr:     false,
			expectedRole:  "user",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ResetDB() // Reset DB before each test case

			if tc.envPassword != "" {
				os.Setenv("OWNER_PASSWORD", tc.envPassword)
			} else {
				os.Unsetenv("OWNER_PASSWORD")
			}

			err := RegisterUser(tc.registerUser, tc.registerPass)

			if (err != nil) != tc.expectErr {
				t.Fatalf("expected error: %v, got: %v", tc.expectErr, err)
			}

			if !tc.expectErr {
				player, err := LoadUser(tc.registerUser)
				if err != nil {
					t.Fatalf("failed to load user: %v", err)
				}
				if player.Role != tc.expectedRole {
					t.Errorf("expected role %s, got %s", tc.expectedRole, player.Role)
				}
			}
		})
	}
}

func TestSaveUser(t *testing.T) {
	// Initialize a temporary database for testing
	initDB()
	defer ResetDB()

	// 1. Setup: Register a dummy user
	testUser := "SaveTestUser"
	testPass := "password123"
	err := RegisterUser(testUser, testPass)
	if err != nil {
		t.Fatalf("failed to register user: %v", err)
	}

	// 2. Load the initial user
	player, err := LoadUser(testUser)
	if err != nil {
		t.Fatalf("failed to load user: %v", err)
	}

	// 3. Modify the user's data
	newHealth := 50
	newX := 15.5
	player.Health = newHealth
	player.X = newX

	// 4. Save the modified user
	err = SaveUser(player)
	if err != nil {
		t.Fatalf("failed to save user: %v", err)
	}

	// 5. Verify the changes were saved
	updatedPlayer, err := LoadUser(testUser)
	if err != nil {
		t.Fatalf("failed to load updated user: %v", err)
	}

	if updatedPlayer.Health != newHealth {
		t.Errorf("expected health %d, got %d", newHealth, updatedPlayer.Health)
	}

	if updatedPlayer.X != newX {
		t.Errorf("expected X coordinate %f, got %f", newX, updatedPlayer.X)
	}
}
