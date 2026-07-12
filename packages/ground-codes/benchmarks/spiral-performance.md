# Spiral Performance

Measured with `tsx scripts/benchmark-spiral.ts` on 2026-05-08.

The compatibility fixture in `test/fixtures/spiral-10000.json` was generated from the original implementation before optimization and contains 10,000 `getCoordinates(n)` outputs plus the corresponding `getNFromCoordinates(x, y)` outputs.

| Implementation                                     |                  getCoordinates 1..10000 | getNFromCoordinates first 10000 generated coordinates |
| -------------------------------------------------- | ---------------------------------------: | ----------------------------------------------------: |
| Original                                           | avg 21.73ms, best 21.19ms, worst 22.76ms |                 avg 5.84ms, best 5.14ms, worst 8.13ms |
| Cached lattice counts and shells                   |    avg 2.30ms, best 1.82ms, worst 3.18ms |                 avg 1.23ms, best 1.03ms, worst 1.44ms |
| Cached counts plus integer-angle factorized shells |    avg 3.06ms, best 2.26ms, worst 4.17ms |                 avg 1.11ms, best 0.95ms, worst 1.51ms |

Cold-call exploration with `CASES=10000 MAX_N=100000000 tsx scripts/explore-spiral-math.ts`:

| Candidate                                  |   n -> xy |  xy -> n |
| ------------------------------------------ | --------: | -------: |
| Original atan2 + full x scan               | 1461.73ms | 252.81ms |
| Integer angle + full x scan                | 1510.96ms | 261.77ms |
| Integer angle + factorized symmetric shell | 1421.15ms | 181.83ms |

The integer-angle factorized shell candidate preserves the baseline outputs and improves cold `xy -> n` by avoiding `atan2` and scanning only non-duplicate symmetric representatives for `x^2 + y^2 = m`.

Issue [hmmhmmhm/spiral-position-problem#1](https://github.com/hmmhmmhm/spiral-position-problem/issues/1) suggested a Stern-Brocot / convex-hull strategy for counting lattice points in a circle. In local checks, the suggested count matched the original implementation for `m = 0..100000` and random `m <= 100000000`. It was slower for small `m`, but faster once `m` was large enough. The production implementation now uses a hybrid: first-quadrant counting below `m = 1000000000`, and convex-hull counting at or above that threshold.

| Count method      |     Random m range | 10000 counts |
| ----------------- | -----------------: | -----------: |
| Original sqrt sum | 10000000..20000000 |      87.27ms |
| Convex hull count | 10000000..20000000 |      81.73ms |
| Original sqrt sum | 20000000..40000000 |     120.13ms |
| Convex hull count | 20000000..40000000 |     102.49ms |
| Original sqrt sum | 50000000..80000000 |     190.55ms |
| Convex hull count | 50000000..80000000 |     142.73ms |

Additional candidates checked and rejected:

- Narrow bracket search around `floor(n / pi)`: reduced binary search count calls, but the extra bracket validation made total runtime slower than the original `sqrt(n)` bracket.
- Local correction from `floor(n / pi)`: matched outputs, but averaged about 26 count calls for random `n <= 100000000`, worse than the binary search average of about 14 calls.
- Integer walk count with decreasing `y`: matched outputs, but was slower than repeated `Math.sqrt` in JavaScript for this range.

The current implementation also reuses the last below-threshold count from binary search as `s(m - 1)`, avoiding one extra lattice count after the search.

Further research pass with `CASES=10000 MAX_M=100000000 tsx scripts/explore-lattice-count-research.ts` found a simpler count formula that beat both the original sqrt-sum and convex-hull candidate in JavaScript:

| Count method                                                             | Random m <= 100000000, 10000 counts |
| ------------------------------------------------------------------------ | ----------------------------------: |
| Original x = 0..r sqrt sum                                               |                            157.75ms |
| First-quadrant formula `4 * (sum_{x=1..r} floor(sqrt(m - x*x)) + r) + 1` |                             71.69ms |
| First-octant formula                                                     |                             91.55ms |
| Convex-hull count                                                        |                            140.91ms |

For shell point generation:

| Shell method                                          | Random m <= 100000000, 10000 shells |
| ----------------------------------------------------- | ----------------------------------: |
| Full x scan                                           |                            181.97ms |
| Symmetric representative scan                         |                            119.82ms |
| Sum-of-two-squares filter + symmetric representatives |                             36.72ms |

The implementation now uses the first-quadrant count formula for normal-sized counts and symmetric shell generation without a factorization filter on known-representable shells.

Large-count follow-up:

| Count method           |            Random m range | Cases |      Time |
| ---------------------- | ------------------------: | ----: | --------: |
| First-quadrant formula |     100000000..1000000000 |  2000 |   52.63ms |
| Convex-hull count      |     100000000..1000000000 |  2000 |   72.72ms |
| First-quadrant formula |   1000000000..10000000000 |  2000 |  861.12ms |
| Convex-hull count      |   1000000000..10000000000 |  2000 |  173.06ms |
| First-quadrant formula | 10000000000..100000000000 |  1000 | 1330.38ms |
| Convex-hull count      | 10000000000..100000000000 |  1000 |  191.35ms |

Further paper-derived candidates:

| Candidate                                           |                                   Range | Cases | Result                                     |
| --------------------------------------------------- | --------------------------------------: | ----: | ------------------------------------------ |
| Convex-hull flat stack plus no-division slope check |                   random m <= 100000000 |  5000 | 72.69ms vs 74.74ms for tuple convex-hull   |
| Convex-hull flat stack plus no-division slope check |                 1000000000..10000000000 |  2000 | 160.38ms vs 178.75ms for tuple convex-hull |
| Convex-hull flat stack plus no-division slope check |               10000000000..100000000000 |  1000 | 170.93ms vs 189.27ms for tuple convex-hull |
| Gaussian integer shell generation                   |            representable m <= 100000000 |  5000 | 28.00ms vs 71.64ms for symmetric scan      |
| Gaussian integer shell generation                   | representable m 1000000000..10000000000 |  2000 | 380.06ms vs 150.77ms for symmetric scan    |

The flat convex-hull variant is used for large counts. Gaussian integer shell generation matched the scan output, but it only won on smaller representable shells and slowed broad `xy -> n` stress cases because trial factorization runs for every coordinate, so it remains an experiment only.

Second paper-derived pass:

| Candidate                                                      |                                        Range |  Cases | Result                                            |
| -------------------------------------------------------------- | -------------------------------------------: | -----: | ------------------------------------------------- |
| Convex-hull threshold `0.75 * cbrt(m)` with squared slope test |                      1000000000..10000000000 |   2000 | 165.08ms vs 167.37ms for current flat convex-hull |
| Convex-hull threshold `0.75 * cbrt(m)` with squared slope test |                    10000000000..100000000000 |   1000 | 190.84ms vs 182.61ms for current flat convex-hull |
| Convex-hull threshold `0.75 * cbrt(m)` with squared slope test |                  100000000000..1000000000000 |    500 | 201.38ms vs 211.76ms for current flat convex-hull |
| Convex-hull threshold `1.25 * cbrt(m)` with squared slope test |                    10000000000..100000000000 |   1000 | 208.47ms, slower                                  |
| Convex-hull threshold `1.5 * cbrt(m)` with squared slope test  |                  100000000000..1000000000000 |    500 | 227.10ms, slower                                  |
| Gaussian shell with small-`m` gate                             | 1000000000..10000000000 representable shells |   2000 | 153.32ms vs 154.16ms for symmetric scan           |
| Area/Bessel-style leading approximation `round(pi*m)`          | exact check up to 100000 plus random samples | 101000 | around 99000 mismatches                           |

The tuned convex-hull thresholds were mixed by range, so the current `cbrt(m) + 1` flat implementation remains the production choice. The squared slope test is exact in the tested ranges, but it did not produce a stable speedup over the existing no-division form. The area/Bessel-style leading approximation is useful only as a heuristic bracket, not as an exact count, because it fails the original-output identity requirement.

Katai / Barvinok / fractional-sum pass:

| Candidate                                     |                                        Range |  Cases | Result                                                             |
| --------------------------------------------- | -------------------------------------------: | -----: | ------------------------------------------------------------------ |
| Fractional-part identity `sqrt - frac(sqrt)`  |                          random m <= 1000000 |   1000 | exact, 12.72ms vs 0.79ms for first-quadrant                        |
| Katai-style boundary walk with decreasing `y` |                          random m <= 1000000 |   1000 | exact, 2.83ms vs 0.79ms                                            |
| Katai-style boundary walk with decreasing `y` |                        100000000..1000000000 |   2000 | exact, 192.28ms vs 52.84ms                                         |
| Katai-style boundary walk with decreasing `y` |                      1000000000..10000000000 |   1000 | exact, 458.64ms vs 432.66ms first-quadrant and 80.19ms convex-hull |
| Boundary-corrected area approximation         | exact check up to 100000 plus random samples | varies | roughly all samples mismatched                                     |
| Barvinok-style 64-gon area approximation      | exact check up to 100000 plus random samples | varies | roughly all samples mismatched                                     |

The Katai/fractional-part family gave exact rewrites of the same count, but not a faster JavaScript implementation. Barvinok/LattE-style polygon counting is exact for polytopes, not disks; polygon area replacement fails the identity requirement, and exact polygon decomposition would still need a disk-boundary correction comparable to the current circle-specific count.

Additional formula experiments:

- Manual loop unrolling for the first-quadrant count was only marginally faster in isolation and not worth the readability cost.
- Pair-walking `y` downward instead of calling `Math.sqrt` was much slower in JavaScript.
- Prime-list factorization made the sum-of-two-squares filter much faster in isolation, but `getNFromCoordinates(x, y)` always asks about a point already on `x^2 + y^2 = m`, so that path now skips the filter and scans symmetric representatives directly.
- Direct rank counting without building a shell array matched outputs, but was not faster than the current array scan in JavaScript.
- Replacing per-representative `Set` de-duplication with explicit 1/4/8-way symmetry cases improved shell generation while preserving output order after sorting.
- Table-assisted `m` search reduced lattice-count calls, but table lookup and bracketing overhead made it slower than binary search for `n <= 100000000`.
- Newton-style correction from `floor(n / pi)` matched outputs but averaged more work and ran slower than binary search.
- The prime-list filter avoided per-call array slicing in an earlier version, but production no longer needs it for known-representable shell paths.
- Jacobi's two-square theorem gives `S(m) = 1 + 4 * sum chi4(d) * floor(m / d)` and matched outputs, but the grouped divisor summatory version was slower than the sqrt and convex-hull paths in JavaScript.
- Cornacchia/Gaussian-integer shell generation matched outputs and can beat scanning for small representable `m`, but it is not a general production win without a faster factorization path or a tighter usage gate.
- Huxley/Voronoi/Bessel-style analytic approximations improve error terms or asymptotic estimates, not exact finite counting in this JS implementation; the tested leading-area approximation produced tens of thousands of mismatches and was rejected.
- Katai/fractional-part and boundary-walk transforms preserve exactness but were slower than the current `Math.sqrt`-based first-quadrant formula. Barvinok-style polygon approximation was rejected because it counts a different shape unless an additional exact disk-boundary correction is added.

Lookup/index experiments:

- Block indexes for `n <= 100000000` reduced count calls, but were slower overall than binary search in JavaScript.
- A full exact `m -> count` table is fast after loading, but covering `n <= 100000000` requires roughly 31.8 million `m` entries, about 127MB as `Uint32Array`, plus generation time. This is only attractive as an optional serialized data artifact for a known max range.
- A representable-shell cumulative index was tested with `tsx scripts/explore-spiral-index.ts`. It stores only shell radii `m` that have at least one representation plus cumulative point counts.

| Index range                                     |  Build time |  Shells |              Typed array bytes | Indexed n -> xy | Current n -> xy | Indexed xy -> n | Current xy -> n |
| ----------------------------------------------- | ----------: | ------: | -----------------------------: | --------------: | --------------: | --------------: | --------------: |
| `MAX_N=1000000`, no shell cache, 10000 cases    |    232.26ms |   72338 |                         578704 |          4.79ms |          9.67ms |          3.66ms |          3.38ms |
| `MAX_N=10000000`, no shell cache, 50000 cases   |   7035.23ms |  658320 |                        5266560 |         75.15ms |         30.11ms |         43.68ms |         23.31ms |
| `MAX_N=10000000`, shell cache, 50000 cases      |   9560.12ms |  658320 | 5266560 plus Map/shell objects |        276.92ms |         28.62ms |         84.74ms |         31.26ms |
| `MAX_N=100000000`, no shell cache, 100000 cases | 198768.70ms | 6083988 |                       48671904 |        101.23ms |        103.83ms |         82.68ms |         60.87ms |

This makes query complexity closer to predecessor search over representable shells, but JavaScript build time and lookup overhead erase the benefit for the current implementation. It is still a plausible optional serialized artifact if a known max range is reused across many process starts, especially with a lower-overhead predecessor structure such as Elias-Fano rather than raw binary search plus Map-based shell handling.

Native/WASM experiments were removed from the repo. The implementation direction is JS-only unless a separate future package is explicitly approved.

BigInt support:

- `getCoordinates(n)` and `getNFromCoordinates(x, y)` now accept either all `number` inputs or all `bigint` inputs.
- Number inputs keep the existing number return types and optimized path.
- BigInt inputs return BigInt coordinates or indexes and avoid unsafe integer precision loss.
- BigInt support is exact but intentionally conservative. It uses BigInt integer square roots and a BigInt version of the convex-hull count for large `m`, so very large `n -> xy` calls can still be much slower than the number path.
- `CASES=10000 MAX_N=1000000 tsx scripts/check-spiral-bigint.ts` matched number-compatible BigInt roundtrips and completed the random portion in 6.764s.
- A larger coordinate such as `10000000n,10000000n` roundtripped correctly in local testing, but the reverse `getCoordinates(n)` portion took minutes, so large-BigInt use should be treated as correctness support rather than high-throughput acceleration.
- BigInt count now uses the same convex-hull strategy as the number path for `m >= 1000000000`, which makes 16-digit `n -> xy` practical but does not make arbitrary 20-digit `n` fast.

Cache policy:

- Spiral caches are disabled by default.
- Enable them explicitly with `setSpiralCacheEnabled(true)`, inspect with `isSpiralCacheEnabled()`, and clear with `clearSpiralCache()`.
- Disabling the cache also clears existing cached number and BigInt counts/shells.
- Tests and comparison scripts run with cache disabled unless `SPIRAL_CACHE=1` is set.

| Cache mode                    |                  getCoordinates 1..10000 | getNFromCoordinates first 10000 generated coordinates |
| ----------------------------- | ---------------------------------------: | ----------------------------------------------------: |
| Disabled by default           | avg 18.21ms, best 17.99ms, worst 18.49ms |                 avg 3.59ms, best 2.53ms, worst 6.75ms |
| Enabled with `SPIRAL_CACHE=1` |    avg 2.54ms, best 1.84ms, worst 3.04ms |                 avg 1.18ms, best 0.88ms, worst 1.61ms |

Scale benchmark notes:

- `SPIRAL_CACHE=0 CASES=1000 MAX_DIGITS=20 tsx scripts/benchmark-spiral-scale.ts` measures number-safe `n` values up to 15 digits.
- Exact BigInt `n -> xy` for 16-20 digit `n` is skipped by default because it uses the conservative BigInt count path and is not practical for routine benchmarking. Set `RUN_SLOW_BIGINT=1` to force it.
- Number coordinate inputs automatically route to the BigInt path when `x * x + y * y` is not a safe integer. This preserves correctness, but large coordinate `xy -> n` can be slow; scale benchmarks skip 8+ digit coordinates by default unless `RUN_SLOW_BIGINT=1` is set.

| Input                                                                  | Cache |    Average |
| ---------------------------------------------------------------------- | ----- | ---------: |
| `n -> xy`, 10 digit `n`                                                | off   |   890.01us |
| `n -> xy`, 11 digit `n`                                                | off   |    2.246ms |
| `n -> xy`, 12 digit `n`                                                | off   |    6.103ms |
| `n -> xy`, 13 digit `n`                                                | off   |   15.296ms |
| `n -> xy`, 14 digit `n`                                                | off   |   37.577ms |
| `n -> xy`, 15 digit `n`                                                | off   |  103.853ms |
| `n -> xy`, 16 digit `n`, BigInt convex-hull                            | off   |  122.372ms |
| `n -> xy`, 17 digit `n`, BigInt convex-hull                            | off   | 6134.535ms |
| `n -> xy`, 17 digit `n`, BigInt convex-hull plus approximate root seed | off   | 3138.776ms |

The BigInt root helper now uses a `Number` square-root/cube-root estimate with BigInt correction for values up to `10^30`, preserving exactness while avoiding many BigInt division iterations. This roughly halves the tested 17-digit `n -> xy` time, but 17+ digit exact queries remain expensive.

BigInt `xy -> n` direct rank:

- With cache disabled, BigInt shell rank now counts angle-preceding symmetric points directly instead of building a shell array and coordinate Map.
- This reduces allocation and helps some large-coordinate calls, but 8-digit coordinate performance still varies widely because `countBigIntLatticePoints(m - 1)` remains the dominant cost.
- In a small `RUN_SLOW_BIGINT=1` sample, 8-digit `xy -> n` averaged 906.221ms with median 89.600ms and a worst case of 4252.445ms.
- A number-based convex-hull traversal for BigInt counts was also tested. It preserved fixture correctness but did not improve the 8-digit `xy -> n` worst case, so it was not kept in production.
- BigInt shell rank now uses Pollard-Rho factorization, Cornacchia prime representations, and Gaussian integer multiplication for `m >= 1000000000000`, avoiding the `0..sqrt(m/2)` representative scan. In a 50-case 8-digit coordinate sample, `xy -> n` averaged 72.056ms with p95 102.588ms and max 103.565ms.
- BigInt counts now use the plain number convex-hull path only when `m <= Number.MAX_SAFE_INTEGER`. For larger `m` with `sqrt(m) <= 20000000000`, the count uses a number-guided convex-hull traversal but keeps BigInt point-in-circle checks and BigInt square-root correction, preserving exactness without relying on unsafe floating-point `m`.
- BigInt `n -> xy` now adds a bounded interpolation refinement before the exact binary search and uses a per-call count memo. This reduces repeated count work inside one query while keeping the public spiral cache disabled by default.
- The number-guided path now derives each `y` from a `Number` square-root estimate and corrects it with BigInt boundary checks, avoiding a full BigInt integer square-root call for every sampled `x`.
- The BigInt number-guided convex-hull path now lowers its direct-sum threshold to roughly `cbrt(m) / 128`, and the direct range reuses incrementally updated `x^2`. This preserves exact outputs against the previous exact threshold path in sampled 8-10 digit coordinate comparisons.
- The number-guided convex-hull point-in-circle check now uses a guarded `Number` estimate first and falls back to exact BigInt arithmetic near the boundary. The guard is conservative for the active `sqrt(m) <= 20000000000` range, and known large-coordinate fixtures plus baseline comparisons preserve exact outputs.
- After threshold and guarded point-check tuning, a 20-case coordinate-only scale run measured 8-digit `xy -> n` avg 84.686ms, p95 150.820ms; 9-digit avg 248.512ms, p95 335.102ms; and 10-digit avg 1721.346ms, p95 2228.180ms. The preceding 10-digit run was avg 3781.035ms, p95 5067.718ms.
- A 4-case representative 10-digit coordinate sample improved from avg 4456.917ms, max 6991.255ms to avg 1644.490ms, max 2196.526ms with the guarded point check and divisor 128. A 15-17 digit `n -> xy` spot check remained in the same range: 15-digit avg 24.808ms, 16-digit avg 33.221ms, 17-digit avg 69.285ms.
- The convex-hull slope comparison now uses the same style of guarded `Number` estimate before falling back to exact BigInt multiplication. With this additional guard, the same 20-case coordinate-only scale run measured 8-digit `xy -> n` avg 75.712ms, p95 113.769ms; 9-digit avg 186.211ms, p95 245.143ms; and 10-digit avg 1191.415ms, p95 2168.863ms.
- The 4-case representative 10-digit coordinate sample improved again from avg 1644.490ms, max 2196.526ms to avg 1298.149ms, max 2172.643ms. Large known-output fixtures were expanded to cover four 10-digit coordinates.
- Repeated BigInt conversions in the convex-hull advance loop were removed by hoisting `BigInt(slopeX)` and the per-slope area correction outside the inner loop. The direct-sum `x^2` recurrence also now increments a BigInt step value instead of converting `2*x+1` on every iteration.
- After these loop-level reductions, the same deterministic 8-10 digit coordinate sample kept the same output hash and measured 8-digit `xy -> n` avg 115.841ms, p95 260.800ms; 9-digit avg 157.084ms, p95 333.160ms; and 10-digit avg 1111.626ms, p95 2017.811ms in one run. A later run measured 10-digit avg 940.498ms, p95 1344.833ms, showing the usual runtime variance but a lower average than the prior slope-guard-only path.
- Additional candidates were tried and rejected: lowering the guarded point epsilon to `65536` and the slope tolerance factor to `128` caused large outliers; a direct threshold divisor of `256` worsened 10-digit p95; and an exponential/binary multi-step slope advance was exact on known outputs but slower than the simple guarded sequential loop.
- The advance loop now also keeps `currentY` as a BigInt alongside the numeric value, avoiding `BigInt(nextY)` allocation on every successful step. The slope fallback comparison reuses `x^2`, `slopeX^2`, and `slopeY^2` BigInt values instead of multiplying them twice.
- With the BigInt `currentY` update, the deterministic 8-10 digit coordinate sample kept the same output hash and measured 8-digit `xy -> n` avg 72.797ms, p95 124.706ms; 9-digit avg 94.664ms, p95 122.607ms; and 10-digit avg 657.914ms, p95 1332.947ms in the first run. Reusing squared values in the fallback stayed in the same range.
- The exact number-guided BigInt count path now applies up to `sqrt(m) <= 200000000000`, with a dynamic point-check tolerance only above the old `sqrt(m) <= 20000000000` range. This lets 11-digit coordinates avoid the fully BigInt convex-hull path while keeping the faster fixed tolerance for 10-digit coordinates.
- The dynamic point-check tolerance uses a smaller ULP factor for this large-coordinate range. A reproduced 11-digit coordinate sample `(-64791796609, 57777086992)` preserved the previous exact result `23675572189899908565477` and improved from 16132.755ms to 5403.990ms in the fastest verification run. Four 11-digit samples were cross-checked against a more conservative factor-16 run; one representative 11-digit fixture remains in the default test suite.
- Conditional direct-threshold and slope-tolerance experiments were tried but not kept because their improvements were inconsistent and sometimes worsened 10-digit samples.
- BigInt `n -> xy` now switches to a local exact shell scan when interpolation has narrowed the shell search range to at most 4096 `m` values. The scan starts from the known `count(low - 1)` and adds shell sizes from Pollard-Rho/Cornacchia/Gaussian factorization until the target `n` is reached, avoiding additional expensive full disk counts.
- A secant refinement runs after the first interpolation when the range is still too wide for shell scanning. It uses the cached exact counts at the current low/high bounds to make additional monotonic narrowing steps before falling back to binary search.
- With shell scanning plus secant refinement, the 20-case 17-digit `n -> xy` benchmark improved from avg 2124.397ms, median 2081.434ms, p95 2322.166ms to avg 68.498ms, median 60.546ms, p95 144.525ms.
- Safe number `n -> xy` inputs at `n >= 100000000000000` now use the same optimized BigInt search internally and then convert the final coordinates back to `number`. This keeps the public return type unchanged while avoiding the slower number-only binary search path for 15-16 digit inputs.
- After the safe-number hybrid routing, a 20-case `n -> xy` scale run measured 15-digit avg 24.238ms, p95 35.475ms and 16-digit avg 38.594ms, p95 172.079ms. The 17-digit BigInt path stayed around avg 69.738ms, p95 148.143ms in that run.
- Number `n -> xy` routing now uses the BigInt optimized path for any integer number value at `n >= 100000000000000`, including JS numbers above `Number.MAX_SAFE_INTEGER`. This preserves the result for the integer value represented by JavaScript and prevents unsafe 16-digit inputs from falling back to the slower number-only path.
- The local exact shell scan threshold was lowered from 4096 to 1024 shell radii. The wider threshold helped many samples, but a reproduced 16-digit case spent too much time factoring empty/intermediate shells. With the lower threshold, the reproduced sample `n = 1000887296662216` dropped from about 168.9ms to the 50-75ms range depending on run.
- After the unsafe-number routing and shell-scan threshold tuning, `RUN_SLOW_BIGINT=1 CASES=20 MAX_DIGITS=17 SPIRAL_CACHE=0 tsx scripts/benchmark-spiral-scale.ts` measured 15-digit `n -> xy` avg 24.541ms, p95 34.958ms; 16-digit avg 33.862ms, p95 73.981ms; and 17-digit avg 72.228ms, p95 153.022ms. The same run measured 10-digit coordinate `xy -> n` avg 4338.496ms, p95 5785.421ms.

The optimized implementation preserves the original first 10,000 input-output pairs. Verify with:

```bash
tsx --test test/*.test.ts
```
