package main

import (
	"encoding/json"
	"sync"
)

// Inventory manages a player's items, providing O(1) lookups via a map while preserving the insertion order of items in a slice.
type Inventory struct {
	Items []string
	Map   map[string]struct{}
	mu    sync.RWMutex
}

// NewInventory creates a new initialized Inventory with optional starting items.
func NewInventory(items ...string) *Inventory {
	inv := &Inventory{
		Items: make([]string, 0, len(items)),
		Map:   make(map[string]struct{}, len(items)),
	}
	for _, item := range items {
		inv.Add(item)
	}
	return inv
}

// Add appends an item to the inventory if it doesn't already exist.
func (inv *Inventory) Add(item string) {
	inv.mu.Lock()
	defer inv.mu.Unlock()
	if inv.Map == nil {
		inv.Map = make(map[string]struct{})
	}
	if _, exists := inv.Map[item]; !exists {
		inv.Items = append(inv.Items, item)
		inv.Map[item] = struct{}{}
	}
}

// Has returns true if the inventory contains the item.
func (inv *Inventory) Has(item string) bool {
	if inv == nil {
		return false
	}
	inv.mu.RLock()
	defer inv.mu.RUnlock()
	if inv.Map == nil {
		return false
	}
	_, exists := inv.Map[item]
	return exists
}

// MarshalJSON serializes the inventory as a JSON array of strings.
func (inv *Inventory) MarshalJSON() ([]byte, error) {
	if inv == nil {
		return json.Marshal([]string{})
	}
	inv.mu.RLock()
	defer inv.mu.RUnlock()
	// Return the ordered slice. If nil, return empty slice.
	if inv.Items == nil {
		return json.Marshal([]string{})
	}
	return json.Marshal(inv.Items)
}

// UnmarshalJSON deserializes a JSON array of strings into the inventory.
func (inv *Inventory) UnmarshalJSON(data []byte) error {
	var items []string
	if err := json.Unmarshal(data, &items); err != nil {
		return err
	}

	inv.mu.Lock()
	defer inv.mu.Unlock()
	inv.Items = items
	inv.Map = make(map[string]struct{}, len(items))
	for _, item := range items {
		inv.Map[item] = struct{}{}
	}
	return nil
}
