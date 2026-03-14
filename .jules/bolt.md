## 2024-03-11 - [Optimize Math.Pow]
**Learning:** `math.Pow(x, 2)` incurs significant CPU overhead compared to direct multiplication (`x*x`). Because spatial checks and ability logic occur up to 20 times per second for every mob across all entities (potentially O(N*M)), this resulted in AI updates taking over 23 million nanoseconds (23ms) which frequently violated the 50ms tick budget when under load.
**Action:** Always replace `math.Pow(..., 2)` with `(x * x)` in hot paths for spatial loops in Go.
## 2026-03-12 - [Go Spatial Math Optimization]
**Learning:** `math.Pow(x, 2)` incurs massive overhead in Go during high-frequency tick calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal type handling for edge cases. Profiling showed it took over 60% of CPU time in `BenchmarkMobUpdate`.
**Action:** Always prefer direct multiplication (e.g., `dx*dx`) over `math.Pow(..., 2)` when calculating spatial distances or squared magnitudes in high-performance hot paths within the Go backend.

## 2024-03-14 - [THREE.js Vector3 Object Allocation in Hot Loops]
**Learning:** `new THREE.Vector3()` instantiation within hot paths, such as `requestAnimationFrame` or WebSockets updates (`updateMobs`, `updateWorldState`), causes significant garbage collection overhead and potential frame drops in JavaScript due to many new object allocations per tick for lerping mesh positions.
**Action:** Always prefer caching and reusing a globally scoped `_reusableVec = new THREE.Vector3()` and using `_reusableVec.set(x, y, z)` during rapid looping updates like `.lerp` in THREE.js to avoid GC pressure.
