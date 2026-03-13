## 2024-03-11 - [Optimize Math.Pow]
**Learning:** `math.Pow(x, 2)` incurs significant CPU overhead compared to direct multiplication (`x*x`). Because spatial checks and ability logic occur up to 20 times per second for every mob across all entities (potentially O(N*M)), this resulted in AI updates taking over 23 million nanoseconds (23ms) which frequently violated the 50ms tick budget when under load.
**Action:** Always replace `math.Pow(..., 2)` with `(x * x)` in hot paths for spatial loops in Go.
## 2026-03-12 - [Go Spatial Math Optimization]
**Learning:** `math.Pow(x, 2)` incurs massive overhead in Go during high-frequency tick calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal type handling for edge cases. Profiling showed it took over 60% of CPU time in `BenchmarkMobUpdate`.
**Action:** Always prefer direct multiplication (e.g., `dx*dx`) over `math.Pow(..., 2)` when calculating spatial distances or squared magnitudes in high-performance hot paths within the Go backend.

## 2026-03-13 - Removed unnecessary mutex locks and replaced distance function with squared values in spatial search loop
**Learning:** Found unnecessary locking in an inner spatial search loop mapping player coordinates. This block iterates Mobs O(N) over nearby Players O(M) inside a loop! Also found that many usages of calculating the distance with a square root calculation (`math.Sqrt()`) were repeatedly calculated per coordinate when comparing against distance radiuses (like checking ranges or abilities) rather than comparing a pre-calculated static squared radius once.
**Action:** When performing heavily nested loops, make sure to consider eliminating inline operations like variable assignments and expensive functions (especially square root calculations) inside inner loops where only squared-value comparisons are needed. Also check that outer resources such as read-only grids do not repeatedly wrap inner queries in expensive mutually exclusive locks.

## 2026-03-13 - Corrected understanding of locks in spatial search loop
**Learning:** Found that removing a lock in a spatial search loop can be dangerous if the loop also mutates shared state (like player or mob health). Even if the map being iterated is read-only, mutating state of the elements inside that map may not be thread-safe.
**Action:** When considering lock removal for performance, double check that the inner loop does not mutate state that could be accessed by other goroutines.
