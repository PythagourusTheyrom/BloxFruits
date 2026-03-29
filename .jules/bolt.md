## 2026-03-29 - [Go Fast Float to Int Casting Optimization]
**Learning:** `math.Floor` incurs overhead in Go during high-frequency calculations (e.g. 60 TPS game loops with many entities) because it requires function calls and internal handling for edge cases, when simple `int()` casting logic is extremely fast (measured at 2x the speed of `math.Floor`).
**Action:** Always prefer direct integer casting strategies for spatial chunk mapping instead of `math.Floor()` when calculating positional grids in high-performance hot paths within the Go backend.
