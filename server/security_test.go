package main

import (
	"testing"
)

func TestIsValidUsername(t *testing.T) {
	tests := []struct {
		name     string
		username string
		valid    bool
	}{
		{"valid_simple", "user1", true},
		{"valid_underscore", "user_name_123", true},
		{"valid_min_length", "usr", true},
		{"valid_max_length", "a1234567890123456789012345678901", true},
		{"invalid_too_short", "us", false},
		{"invalid_too_long", "a12345678901234567890123456789012", false},
		{"invalid_special_chars", "user!name", false},
		{"invalid_spaces", "user name", false},
		{"invalid_empty", "", false},
		{"invalid_dots", "user.name", false},
		{"invalid_quotes", "user'name", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidUsername(tt.username)
			if result != tt.valid {
				t.Errorf("isValidUsername(%q) = %v, expected %v", tt.username, result, tt.valid)
			}
		})
	}
}

func TestGenerateSecureToken(t *testing.T) {
	tokens := make(map[string]bool)
	numTokens := 1000

	for i := 0; i < numTokens; i++ {
		token, err := generateSecureToken()
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}

		// Check length (32 bytes = 64 hex chars)
		if len(token) != 64 {
			t.Errorf("Expected token length 64, got %d", len(token))
		}

		// Check uniqueness
		if tokens[token] {
			t.Errorf("Duplicate token generated: %s", token)
		}
		tokens[token] = true
	}
}
