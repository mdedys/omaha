# Determinism across browsers

Which JavaScript maths can give a different result on another browser, device or browser version, and the rules that keep a rep's result identical everywhere. Researched on 2026-10-07 from ECMA-262, the current source of V8, SpiderMonkey and JavaScriptCore, and a probe run in four engines on one Mac.

Labels: _(inference)_ marks a conclusion drawn here rather than stated by a source or measured.

## Summary

- **Basic arithmetic is identical everywhere.** ECMA-262 defines `+ - * / %`, `Math.sqrt`, the rounding functions, `min`, `max`, `abs` and `fround` as exact IEEE 754 double arithmetic, rounded to nearest. In the probe, every one of them gave the same bits in all four engines, including `a * b + c` on an arm64 CPU that has a fused multiply-add instruction.
- **Transcendental functions are not.** The spec leaves 23 Math functions to the engine: `sin`, `cos`, `tan`, `atan2`, `hypot`, `exp`, `log`, `pow` and the rest. `**` uses the same loosely specified operation as `Math.pow`. In the probe, all 22 of them other than `random` differed between engines on some inputs, by 1 to 4 ulp. `pow` differed only with integer exponents.
- **Results also change with the OS and the browser version.** Safari's engine calls the OS maths library for every transcendental function. Firefox does too for `pow`, and for `sin`, `cos` and `tan` on Windows only. Chrome does for `pow` and `tanh`. V8 replaced most of its Math functions in May 2026: Chromium 153 and Node 24 disagree on `Math.sin` for 3% of inputs.
- **A 1-ulp difference doesn't stay 1 ulp.** A defender steered with `atan2`, `cos` and `sin` for 60 ticks ended at a different separation in up to 22% of reps, by up to 2.8 thousandths of a yard. Steered with vectors normalized by `Math.sqrt`, the same chase matched bit for bit in every engine.
- **The rules:** only exactly specified maths in the engine, directions as vectors rather than angles, fixed ticks with no clocks or randomness, a fixed order for every loop and sort, and a golden test that runs in Chromium, Firefox and WebKit.

## What ECMA-262 guarantees

**Exact.** The Number type is IEEE 754-2019 binary64. Every conversion from an exact mathematical result to a Number rounds to nearest, ties to even ([6.1.6.1](https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type)). Addition, subtraction, multiplication, division and `%` are defined as the exact result, rounded once ([Number::add](https://tc39.es/ecma262/#sec-numeric-types-number-add), [Number::remainder](https://tc39.es/ecma262/#sec-numeric-types-number-remainder)). `Math.sqrt` returns "𝔽(the square root of ℝ(n))", the exact root rounded once ([Math.sqrt](https://tc39.es/ecma262/#sec-math.sqrt)). `abs`, `floor`, `ceil`, `round`, `trunc`, `sign`, `min`, `max`, `fround`, `imul` and `clz32` are exact too, as are `Math.PI` and the bitwise operators.

**Approximated.** The Math object's note:

> The behaviour of the functions acos, acosh, asin, asinh, atan, atanh, atan2, cbrt, cos, cosh, exp, expm1, hypot, log, log1p, log2, log10, pow, random, sin, sinh, tan, and tanh is not precisely specified here except to require specific results for certain argument values that represent boundary cases of interest. ([ECMA-262](https://tc39.es/ecma262/#sec-function-properties-of-the-math-object))

The note recommends fdlibm but doesn't require it. Each of these functions returns "an implementation-approximated Number value". So does `**`, through [Number::exponentiate](https://tc39.es/ecma262/#sec-numeric-types-number-exponentiate).

**Two more gaps that matter for an engine:**

- **Parsing long decimals.** A decimal with 20 or fewer significant digits converts to the same Number everywhere. Past 20 digits, the engine may round the 20th digit either way ([RoundMVResult](https://tc39.es/ecma262/#sec-roundmvresult)). Numbers that JavaScript itself printed never have more than 17.
- **Sorting.** "The sort order is implementation-defined if sortCompare is not a consistent comparator" ([SortIndexedProperties](https://tc39.es/ecma262/#sec-sortindexedproperties)). A consistent comparator returns the same number for the same pair, never NaN, and is transitive.

## What each engine does today

| Functions | V8 (Chrome, Edge, Node) | SpiderMonkey (Firefox) | JavaScriptCore (Safari, every iOS browser) |
|---|---|---|---|
| `sin`, `cos`, `tan` | Bundled LLVM libm since May 2026 | fdlibm; the OS library on Windows | OS library |
| `asin`, `acos`, `atan`, `atan2`, `exp`, `expm1`, `log`s, `cbrt` | Bundled LLVM libm since May 2026 | fdlibm | OS library |
| `tanh` | OS library since March 2026 | fdlibm | OS library |
| `pow`, `**` | OS library | Plain multiplication for integer exponents up to 4; otherwise the OS library, or fdlibm on Android 9 and older | Repeated squaring for integer exponents up to 1000; otherwise the OS library |
| `hypot` | Its own scaled sum | fdlibm for two arguments; its own scaled sum for three or four | OS library |
| `sinh`, `cosh`, `asinh`, `acosh`, `atanh` | Its own fdlibm port | fdlibm | OS library |

- **V8.** Most functions call LLVM's libm ([`ieee754.cc`](https://github.com/v8/v8/blob/8787f0842a158b0be8de8b4ae9b1d2f89a40d8ab/src/base/ieee754.cc#L229)). The May 2026 change measured LLVM's `sin` and `cos` as correctly rounded on every input in its benchmark. Before it, Chrome builds used a copy of glibc's `sin`, which the same benchmark measured as up to 1,063 ulp off ([commit](https://github.com/v8/v8/commit/7c1d2c3724000b4895ef95f75670ca0b6f3ebe4d), [follow-up](https://github.com/v8/v8/commit/8787f0842a158b0be8de8b4ae9b1d2f89a40d8ab)). `tanh` became `std::tanh` in March 2026 ([commit](https://github.com/v8/v8/commit/c1486295ae5bcb0f8fb078b7cf921802ccd75eaf)), and `pow` calls `std::pow` by default ([`ieee754.cc`](https://github.com/v8/v8/blob/716d3e3363c5bdb26e6de68327f6a1c559b8bf19/src/numbers/ieee754.cc#L47), [commit](https://github.com/v8/v8/commit/716d3e3363c5bdb26e6de68327f6a1c559b8bf19)). `hypot` is V8's own code ([`math.tq`](https://github.com/v8/v8/blob/069679548af1b590041a8b63d9a6a324722ed3fc/src/builtins/math.tq#L398)).
- **SpiderMonkey.**
  - fdlibm for `sin`, `cos` and `tan` is a pref, defaulting to false on Windows and true elsewhere ([`StaticPrefList.yaml`](https://github.com/mozilla-firefox/firefox/blob/5140cf9e212f335dec56c790291c0495d3993996/modules/libpref/init/StaticPrefList.yaml#L10380)). Mozilla's Nimbus remote experiments can set it ([`FeatureManifest.yaml`](https://github.com/mozilla-firefox/firefox/blob/9666e42288be41a2aead4608d294496ddb989223/toolkit/components/nimbus/FeatureManifest.yaml#L4281)).
  - A 2023 Bugzilla comment saying Firefox avoids fdlibm for these because "it's too slow" ([bug 1823880](https://bugzilla.mozilla.org/show_bug.cgi?id=1823880)) is out of date.
  - `pow` falls back to fdlibm on Android 9 and older because that `pow` is "1-ULP off" for some inputs ([`Math.cpp`](https://github.com/mozilla-firefox/firefox/blob/3de0327af77ad8b10036e4147d91e3f2020b3731/js/src/builtin/Math.cpp#L66)). Integer exponents up to 4 use plain multiplication, such as `x * x * x` ([`Math.cpp`](https://github.com/mozilla-firefox/firefox/blob/3de0327af77ad8b10036e4147d91e3f2020b3731/js/src/builtin/Math.cpp#L437)).
- **JavaScriptCore.** Every transcendental function is `std::` from the platform's C library ([`MathCommon.h`](https://github.com/WebKit/WebKit/blob/566279d48d565d6de872cf4d624c759879c7ab74/Source/JavaScriptCore/runtime/MathCommon.h#L246)), and so is two-argument `hypot` ([`MathObject.cpp`](https://github.com/WebKit/WebKit/blob/857bd4334690edda28e6f535e2f828dbc5064c4d/Source/JavaScriptCore/runtime/MathObject.cpp#L215)). `pow` with an integer exponent up to 1000 uses repeated squaring ([`MathCommon.cpp`](https://github.com/WebKit/WebKit/blob/566279d48d565d6de872cf4d624c759879c7ab74/Source/JavaScriptCore/runtime/MathCommon.cpp#L437)).
- **iOS.** Apple requires every app that browses the web to "use the appropriate WebKit framework and WebKit JavaScript", except under an EU or Japan entitlement ([guideline 2.5.6](https://developer.apple.com/app-store/review/guidelines/#2.5.6)). Chrome and Firefox on an iPhone run JavaScriptCore.

## The probe

The same seeded inputs went through each operation in Node and in Playwright 1.63's three browsers on one Mac (macOS 26.6, Apple silicon). The inputs were built from integers with `+`, `*` and `/` only, and they matched bit for bit in all four engines. Each operation ran 20,000 times. The table counts results that differ from Chromium 153, with the largest gap in ulp.

| Operation | Node 24 (V8 13.6) | Firefox 155 | WebKit 26.6 |
|---|---|---|---|
| `+ - * / %`, `a * b + c`, `Math.sqrt`, `Math.sqrt(dx * dx + dy * dy)`, `floor`, `round`, `fround`, `min`, `Number(String(x))`, `toFixed(3)` | same | same | same |
| `Math.sin` | 627 (1 ulp) | 621 (1) | 728 (1) |
| `Math.cos` | 625 (1) | 600 (1) | 845 (1) |
| `Math.tan` | 680 (1) | 721 (1) | 8,344 (2) |
| `Math.atan2` | 3,617 (1) | 3,628 (1) | 13 (1) |
| `Math.hypot(dx, dy)` | same | 7,470 (2) | 7,602 (2) |
| `Math.exp` | 1,903 (1) | 1,908 (1) | 28 (1) |
| `Math.log` | 376 (1) | 372 (1) | same |
| `Math.tanh` | 567 (2) | 566 (2) | same |
| `Math.pow(x, 3)` | same | 5,252 (1) | 5,252 (1) |
| `Math.pow(x, 7)` | same | same | 13,118 (4) |
| `Math.pow(x, 2)`, `Math.pow(x, y)` and `x ** y` with non-integer `y`, `x ** 0.5` | same | same | same |

- **The other 13 approximated functions** (`asin`, `acos`, `atan`, `expm1`, `log1p`, `log2`, `log10`, `cbrt`, `sinh`, `cosh`, `asinh`, `acosh`, `atanh`) differed from Chromium on 1 to 4,774 of 20,000 inputs.
- **Firefox and WebKit disagree with each other** on `sin`, `cos` and `tan` for 4–41% of inputs, so on a Mac they aren't using the same library.
- **`pow` with a non-integer exponent agreed** only because all four engines called macOS's own `pow` on this machine _(inference, from the source above)_. On Android 9, Firefox would have used a different one.
- **Sorting with a boolean comparator.** `[...].sort((a, b) => a > b)` returns `true` or `false`, never a negative number. V8 left a shuffled list of 40 numbers in its original order. Firefox and WebKit sorted it.
- **Not tested:** Windows, Linux, Android, iOS, or x86 CPUs. The cross-OS differences above come from the engines' source, not from measurement.

**Does 1 ulp matter?** A receiver ran a straight line for 3 seconds at 20 ticks per second, chased by a defender. Each of 10,000 reps had a seeded random start and speed. The table counts reps whose final separation differs from Chromium's.

| Steering | Node 24 | Firefox 155 | WebKit 26.6 |
|---|---|---|---|
| Heading from `Math.atan2`, step from `Math.cos` and `Math.sin` | 2,215 reps, up to 0.0028 yd | 2,193 reps, up to 0.0028 yd | 329 reps, up to 0.00000003 yd |
| Direction from `(ex / d, ey / d)` with `d = Math.sqrt(ex * ex + ey * ey)` | 0 | 0 | 0 |

- **No rep changed band.** None moved across 1 or 3 yards (covered, contested, open). A band flips only when a separation lands within the gap of an edge.
- **The gap grows.** A 1-ulp difference is about 10⁻¹⁵ yd at these distances. After 60 ticks it reached 3 × 10⁻³ yd, twelve orders of magnitude larger.
- **Where it bites** _(inference)_. Scoring may play out millions of designs per puzzle. Any rule that picks between two close values, such as the nearest defender or who reaches the ball first, turns a tiny gap into a different outcome.

## Rules that keep a rep identical everywhere

These are the answer to the ticket. They are inputs to the engine's spec, not code.

1. **Only exactly specified maths in the engine.**
   - Allowed: `+ - * / %`, comparisons, `Math.sqrt`, `abs`, `floor`, `ceil`, `round`, `trunc`, `sign`, `min`, `max`, `fround`, `imul`, `clz32`, bitwise operators, and `Math.PI`.
   - Banned: the 23 approximated Math functions and `**`. Write `x * x`, not `x ** 2` or `Math.pow(x, 2)`. The probe found `Math.pow(x, 2)` identical everywhere, but the spec doesn't promise it.
2. **Directions are vectors, not angles.**
   - Normalize with `Math.sqrt`. Compare squared distances when you don't need the distance itself.
   - Test angles with dot and cross products against constants. With `lane` a unit vector, "within 30° of the throwing lane" is `dot(lane, v) >= COS_30 * length(v)`.
   - Write constants as literals. `const COS_30 = Math.cos(Math.PI / 6)` runs an approximated function when the module loads. Rapier's deterministic JavaScript build gives the same warning for values that set up a simulation ([Rapier](https://rapier.rs/docs/user_guides/javascript/determinism)).
   - If an angle can't be avoided, use a polynomial written in JavaScript, which needs only exact operations.
3. **The engine is a pure function of the puzzle and the design.**
   - It steps on a fixed tick.
   - No `Math.random`, `Date`, `performance.now`, frame timing, `Intl` or locale formatting, and no rep number.
   - The front end interpolates between ticks and may use any maths to draw, as long as nothing it computes flows back into the engine.
4. **A fixed order for every loop and sort.**
   - Players are processed in roster order.
   - Comparators return a negative, zero or positive number, never a boolean, and break ties explicitly, for example by receiver letter.
5. **Puzzle numbers stay short.** Integers, or decimals well under 20 significant digits, parse to the same double everywhere. Anything JavaScript wrote as JSON already qualifies.
6. **Doubles are fine.**
   - With rule 1, every comparison such as `separation < 3` is decided the same way everywhere, even when the separation lands within 10⁻¹² of 3.
   - Fixed-point integers aren't needed for determinism. The simulation model may still pick them to make values readable, for example exactly 3.000 yards.
7. **Prove it in every engine.**
   - A golden test runs fixed designs through the engine, hashes every tick's state, and checks the hash in Node and in Playwright's Chromium, Firefox and WebKit. Playwright is already a dev dependency.
   - Once rule 1 keeps the OS library out of the engine, one OS is enough to run it on _(inference)_.
   - oxlint can ban the functions: `no-restricted-properties` with `{ "object": "Math", "property": "atan2" }` was checked with oxlint 1.87. oxlint has no `no-restricted-syntax` rule, so it can't ban `**`. The golden test and review catch that.

**Not a risk.** CPU architecture and fused multiply-add: the spec rounds every operation separately, and `a * b + c` matched on an arm64 CPU that has the instruction.

## Inputs for the open tickets

These are inputs, not decisions. Each ticket decides its own question.

- **[Simulation model](https://github.com/mdedys/omaha/issues/9)**
  - Rules 1–3 and 6: vectors for every heading and pursuit, a fixed tick, and plain doubles.
  - Whether to use fixed-point is a readability choice, not a determinism one.
- **[Defensive call model](https://github.com/mdedys/omaha/issues/11), [Protection and the pass rush](https://github.com/mdedys/omaha/issues/12), [QB reads and the throw](https://github.com/mdedys/omaha/issues/13), [Catch, interception and yards after catch](https://github.com/mdedys/omaha/issues/14)**
  - Leverage, lanes, cones and "closer to the QB than the blocker" become dot products, cross products and squared distances.
  - Every tie between two players needs an explicit tiebreak (rule 4).
- **[Puzzle format](https://github.com/mdedys/omaha/issues/18):** rule 5. Store integers or short decimals.
- **[Scoring and beating the pros](https://github.com/mdedys/omaha/issues/7):** if the pros' score or the best design is solved offline in Node, these rules keep it equal to what the player's browser computes. Without them, Node 24 and Chromium 153 already disagree on `Math.sin`.
- **[Engine contract with the front end](https://github.com/mdedys/omaha/issues/17):** if the engine returns every tick it simulated and the front end only draws from them, display maths can't change a result.
- **Where the engine code lives and how it's tested (still fog on the map):** rule 7 needs a test setup that runs in Node and in Playwright's three browsers.
