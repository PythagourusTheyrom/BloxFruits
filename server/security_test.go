package main

import (
	"testing"
)

func TestGenerateSecureToken(t *testing.T) {
	tokens := make(map[string]bool)
	numTokens := 1000

	for i := 0; i < numTokens; i++ {
		token, err := generateSecureToken()
		if err != nil {
			t.Fatalf("Failed to generate secure token: %v", err)
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
