package main

import (
	"testing"
)

func TestGenerateSecureToken(t *testing.T) {
	tokens := make(map[string]bool)
	numTokens := 1000

	for i := 0; i < numTokens; i++ {
		token := generateSecureToken()

		// Check length (16 bytes = 32 hex chars)
		if len(token) != 32 {
			t.Errorf("Expected token length 32, got %d", len(token))
		}

		// Check uniqueness
		if tokens[token] {
			t.Errorf("Duplicate token generated: %s", token)
		}
		tokens[token] = true
	}
}
