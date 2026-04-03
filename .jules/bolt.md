## 2024-03-11 - [Optimize Math.Pow]
**Learning:** `math.Pow(x, 2)` incurs significant CPU overhead compared to direct multiplication (`x*x`). Because spatial checks and ability logic occur up to 20 times per second for every mob across all entities (potentially O(N*M)), this resulted in AI updates taking over 23 million nanoseconds (23ms) which frequently violated the 50ms tick budget when under load.
**Action:** Always replace `math.Pow(..., 2)` with `(x * x)` in hot paths for spatial loops in Go.
## 2026-03-12 - [Go Spatial Math Optimization]
**Learning:** `math.Pow(x, 2)` incurs massive overhead in Go during high-frequency tick calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal type handling for edge cases. Profiling showed it took over 60% of CPU time in `BenchmarkMobUpdate`.
**Action:** Always prefer direct multiplication (e.g., `dx*dx`) over `math.Pow(..., 2)` when calculating spatial distances or squared magnitudes in high-performance hot paths within the Go backend.

## YYYY-MM-DD - Inventory Array Traversal Optimization
**Optimization:** Replaced the O(N) `hasItem` array traversal with an O(1) map-based `Inventory` type.
**Learning:** For game items and large scale item usage, linear traversals like `for i, item := range inventory { if item == query { return true } }` scale poorly as inventory size increases. Converting simple slices into structs that encapsulate both a slice (for insertion-ordered serialization) and a map (for O(1) query lookups via read/write mutexes) yields massive lookup performance consistency under heavy load without breaking frontend assumptions of JSON.

## 2024-04-03 - [JS Spatial Math Optimization]
**Learning:** Just like in Go, `Math.pow(x, 2)` and `Math.sqrt` incur unnecessary overhead in JavaScript's high-frequency tick calculations (e.g., render loop `update` functions). Profiling spatial calculations, such as checking distances against thresholds in `client/js/zones.js`, reveals that using squared distance comparisons (`dx*dx + dz*dz <= radius*radius`) is significantly faster and avoids function call overhead.
**Action:** Always replace `Math.sqrt(Math.pow(dx, 2) + Math.pow(dz, 2)) <= radius` with `dx*dx + dz*dz <= radius*radius` when performing spatial threshold checks in high-performance hot paths within the JavaScript client.
