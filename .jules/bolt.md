## 2024-03-11 - [Optimize Math.Pow]
**Learning:** `math.Pow(x, 2)` incurs significant CPU overhead compared to direct multiplication (`x*x`). Because spatial checks and ability logic occur up to 20 times per second for every mob across all entities (potentially O(N*M)), this resulted in AI updates taking over 23 million nanoseconds (23ms) which frequently violated the 50ms tick budget when under load.
**Action:** Always replace `math.Pow(..., 2)` with `(x * x)` in hot paths for spatial loops in Go.
## 2026-03-12 - [Go Spatial Math Optimization]
**Learning:** `math.Pow(x, 2)` incurs massive overhead in Go during high-frequency tick calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal type handling for edge cases. Profiling showed it took over 60% of CPU time in `BenchmarkMobUpdate`.
**Action:** Always prefer direct multiplication (e.g., `dx*dx`) over `math.Pow(..., 2)` when calculating spatial distances or squared magnitudes in high-performance hot paths within the Go backend.
