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

func TestRegisterUser_DatabaseError(t *testing.T) {
	initDB()
	defer ResetDB()

	// Create a user successfully
	err := RegisterUser("DuplicateUser", "password123")
	if err != nil {
		t.Fatalf("expected successful registration, got error: %v", err)
	}

	// Attempt to register the same user again to trigger a database error
	err = RegisterUser("DuplicateUser", "newpassword")
	if err == nil {
		t.Fatalf("expected a database error due to UNIQUE constraint violation, got nil")
	}
}
