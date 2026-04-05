## 2024-03-11 - [Optimize Math.Pow]
**Learning:** `math.Pow(x, 2)` incurs significant CPU overhead compared to direct multiplication (`x*x`). Because spatial checks and ability logic occur up to 20 times per second for every mob across all entities (potentially O(N*M)), this resulted in AI updates taking over 23 million nanoseconds (23ms) which frequently violated the 50ms tick budget when under load.
**Action:** Always replace `math.Pow(..., 2)` with `(x * x)` in hot paths for spatial loops in Go.
## 2026-03-12 - [Go Spatial Math Optimization]
**Learning:** `math.Pow(x, 2)` incurs massive overhead in Go during high-frequency tick calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal type handling for edge cases. Profiling showed it took over 60% of CPU time in `BenchmarkMobUpdate`.
**Action:** Always prefer direct multiplication (e.g., `dx*dx`) over `math.Pow(..., 2)` when calculating spatial distances or squared magnitudes in high-performance hot paths within the Go backend.

## YYYY-MM-DD - Inventory Array Traversal Optimization
**Optimization:** Replaced the O(N) `hasItem` array traversal with an O(1) map-based `Inventory` type.
**Learning:** For game items and large scale item usage, linear traversals like `for i, item := range inventory { if item == query { return true } }` scale poorly as inventory size increases. Converting simple slices into structs that encapsulate both a slice (for insertion-ordered serialization) and a map (for O(1) query lookups via read/write mutexes) yields massive lookup performance consistency under heavy load without breaking frontend assumptions of JSON.

## 2026-04-05 - Optimize Spatial Grid Map Clearance
**Learning:** The spatial partitioning grid map was re-allocated on every tick, causing significant GC pressure.
**Action:** Persist the map on the struct and use Go 1.21's `clear(map)` built-in instead of iterating to clear inner slices. This avoids O(N) iteration overhead over ever-growing historical keys while preserving map capacity and significantly reducing GC pressure.
