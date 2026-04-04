## 2024-03-11 - [Optimize Math.Pow]
**Learning:** `math.Pow(x, 2)` incurs significant CPU overhead compared to direct multiplication (`x*x`). Because spatial checks and ability logic occur up to 20 times per second for every mob across all entities (potentially O(N*M)), this resulted in AI updates taking over 23 million nanoseconds (23ms) which frequently violated the 50ms tick budget when under load.
**Action:** Always replace `math.Pow(..., 2)` with `(x * x)` in hot paths for spatial loops in Go.
## 2026-03-12 - [Go Spatial Math Optimization]
**Learning:** `math.Pow(x, 2)` incurs massive overhead in Go during high-frequency tick calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal type handling for edge cases. Profiling showed it took over 60% of CPU time in `BenchmarkMobUpdate`.
**Action:** Always prefer direct multiplication (e.g., `dx*dx`) over `math.Pow(..., 2)` when calculating spatial distances or squared magnitudes in high-performance hot paths within the Go backend.

## YYYY-MM-DD - Inventory Array Traversal Optimization
**Optimization:** Replaced the O(N) `hasItem` array traversal with an O(1) map-based `Inventory` type.
**Learning:** For game items and large scale item usage, linear traversals like `for i, item := range inventory { if item == query { return true } }` scale poorly as inventory size increases. Converting simple slices into structs that encapsulate both a slice (for insertion-ordered serialization) and a map (for O(1) query lookups via read/write mutexes) yields massive lookup performance consistency under heavy load without breaking frontend assumptions of JSON.

## 2024-04-04 - [Go Spatial Grid Allocation Optimization]
**Learning:** Re-allocating map instances every tick in game update loops causes massive garbage collection overhead. However, retaining map references and zeroing slice elements via iteration (`mm.grid[k] = mm.grid[k][:0]`) can lead to memory leaks when the spatial grid scales because historical map keys are never cleared.
**Action:** Use Go 1.21's `clear(map)` built-in to clear spatial grid maps on every tick instead of re-allocating them. `clear` retains the map and slice capacities and successfully drops dropped allocations entirely for spatial checks, while guaranteeing O(N) map traversal overhead does not accumulate with unbounded historic player keys.
