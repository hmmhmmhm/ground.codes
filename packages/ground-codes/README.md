# 🌍 ground-codes

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
  <br />
  <br />
</p>

## 📍 Overview

The `ground-codes` package is the core implementation of the Ground Codes coordinate-based addressing system. This package provides the fundamental encoding and decoding functionality that powers the entire Ground Codes ecosystem.

Ground Codes is a coordinate-based addressing system that allows you to pinpoint any location in the world using just a region name and two words (e.g., "Yongsan-Happiness-Smile"). It leverages geographic coordinate systems (GCS) to provide a user-friendly alternative to traditional latitude and longitude coordinates.

> [!WARNING]
> ground-codes is an ongoing project and has not yet reached completion.

## 📦 Installation

```bash
npm install ground-codes
# or
yarn add ground-codes
# or
pnpm add ground-codes
```

## 🚀 Usage

### 🔄 Encoding Coordinates

Convert geographic coordinates (latitude/longitude) into a human-readable Ground Codes address:

```typescript
import { encode } from "ground-codes";

// Example: Encode a specific location
const address = await encode(
  { lat: 37.5326, lng: 127.0246 }, // Target coordinates
  {
    regionLevel: 2, // Use region name (default)
    precisionMeters: 3, // 3-meter precision (default)
    language: "English", // English output (default)
  }
);

// Result: "Yongsan-Happiness-Smile" (example)
console.log(address);
```

### 🔍 Decoding Ground Codes

Convert a Ground Codes address back to geographic coordinates:

```typescript
import { decode, findClosestRegion } from "ground-codes";

// First, get the region center point
const region = await findClosestRegion(
  { lat: 37.5326, lng: 127.0246 }, // Approximate location
  { regionLevel: 2 } // Use region name (default)
);

// Then decode the encoded part
const coordinates = decode({
  encoded: "Happiness-Smile", // The encoded part after region name
  center: { lat: region.lat, lng: region.lng },
});

// Result: { lat: 37.5326, lng: 127.0246 } (approximate)
console.log(coordinates);
```

## ✨ Key Features

- 🔤 **Simple and Memorable**: Just three words to identify any location precisely
- 🌎 **Global Coverage**: Works anywhere in the world with a unique address
- 📖 **Open Source**: MIT licensed and fully transparent implementation
- 🌐 **Multilingual Support**: Currently available in Korean and English, with plans to expand to 60 languages
- 📏 **Variable Precision**: Offers three levels of precision (3m, 30cm, and 3cm) to suit different use cases

## 📚 API Reference

### 🔄 `encode(target, options?)`

Encodes geographic coordinates into a Ground Codes address.

**Parameters:**

- `target`: `{ lat: number, lng: number }` - The target coordinates to encode
- `options` (optional):
  - `center`: `{ lat: number, lng: number }` - Custom center point (if not provided, closest region is used)
  - `regionLevel`: `number` - Region level (1 = code format, 2+ = name format)
  - `precisionMeters`: `number` - Precision in meters (default: 3)
  - `language`: `SupportedLanguage` - Output language (default: 'en')

**Returns:** `Promise<string>` - The encoded Ground Codes address

### 🔍 `decode({ encoded, center })`

Decodes a Ground Codes address back to geographic coordinates.

**Parameters:**

- `encoded`: `string` - The encoded part of the Ground Codes address
- `center`: `{ lat: number, lng: number }` - The center point coordinates

**Returns:** `{ lat: number, lng: number }` - The decoded geographic coordinates

### 🔎 `findClosestRegion(target, options?)`

Finds the closest region to the given coordinates.

**Parameters:**

- `target`: `{ lat: number, lng: number }` - The target coordinates
- `options` (optional):
  - `regionLevel`: `number` - Region level to search for
  - `language`: `SupportedLanguage` - Language for region names

**Returns:** `Promise<{ name: string, code: string, lat: number, lng: number }>` - The closest region

### 🌀 Spiral Index APIs

The package also exports the low-level spiral conversion functions used by
`encode` and `decode`.

```typescript
import {
  getCoordinates,
  getNFromCoordinates,
  setSpiralCacheEnabled,
  clearSpiralCache,
} from "ground-codes";

const n = getNFromCoordinates(123, -456);
const point = getCoordinates(n);

setSpiralCacheEnabled(true);
clearSpiralCache();
```

- `getNFromCoordinates(x, y)` converts spiral coordinates to an index.
- `getCoordinates(n)` converts a spiral index back to coordinates.
- `number` inputs are used while the calculation is safe for JavaScript numbers.
- Large coordinate/index inputs can use `bigint` and return exact `bigint` results.
- If number coordinates would overflow safe integer math internally, the function automatically routes to the BigInt path and may return a `bigint` index.
- Spiral caches are disabled by default. Enable them explicitly with `setSpiralCacheEnabled(true)` when repeated calls are expected.
- `encode()` still targets the word-set range. If the calculated index exceeds that range, it throws instead of silently truncating a BigInt result.

## 📏 Precision Levels

Ground Codes offers different precision levels through simple syntax changes:

- 🏙️ **Yongsan-Happiness-Smile** (3m precision) - Standard precision, ideal for general location finding
- 🏢 **Yongsan#Happiness#Smile** (30cm precision) - Higher precision for detailed navigation
- 📍 **Yongsan+Consideration+Happiness+Smile** (3cm precision) - Highest precision for exact positioning

## ⚙️ Technical Details

Ground Codes uses a custom GIS algorithm called "Grok Spiral" that orders
integer coordinate offsets by squared distance from a center point, then by
angle. This preserves a circular expansion pattern around the center.

The implementation in this shared `ground-codes` package includes several
exact optimizations for large ranges:

- convex-hull based lattice-point counting for large circles
- BigInt-safe coordinate/index conversion
- number-guided BigInt lattice counting with exact BigInt boundary correction
- Pollard-Rho, Cornacchia, and Gaussian integer based shell generation
- small `p ≡ 3 (mod 4)` odd-exponent prefiltering for shells with no sum-of-two-squares representation
- per-call local count memoization for BigInt `n -> xy` search
- optional spiral caches, disabled by default

These optimizations preserve the same input/output ordering as the original
Grok Spiral algorithm. They are intended to keep the common Earth-scale range
usable even when precision is increased into BigInt territory.

### Current Large-Range Benchmarks

Benchmarks below were measured with cache disabled:

```bash
CASES=10 MAX_DIGITS=21 RUN_SLOW_BIGINT=1 SPIRAL_CACHE=0 SEED=424242 \
  pnpm --filter ground-codes exec tsx scripts/benchmark-spiral-scale.ts
```

`n -> xy`:

| n digits | avg | median | p95 |
|---:|---:|---:|---:|
| 17 | 45.449ms | 44.509ms | 58.040ms |
| 18 | 194.446ms | 198.617ms | 284.583ms |
| 19 | 316.517ms | 333.190ms | 407.028ms |
| 20 | 1444.556ms | 981.099ms | 3511.057ms |
| 21 | 3765.861ms | 2970.587ms | 14544.587ms |

`xy -> n`:

| coordinate digits | avg | median | p95 |
|---:|---:|---:|---:|
| 8 | 52.343ms | 48.880ms | 77.558ms |
| 9 | 130.253ms | 142.473ms | 168.166ms |
| 10 | 681.954ms | 782.683ms | 908.628ms |
| 11 | 3188.709ms | 3449.567ms | 4466.203ms |

For a single Earth-wide center at about 3mm precision, expected maximum values
are around 10 coordinate digits and 21 index digits. Higher precision or larger
single-center coverage can move more work into the slower BigInt path.

## 🔗 Integration with Other Packages

This package works seamlessly with other Ground Codes ecosystem packages:

- 🗺️ [`@repo/geoint`](../geoint/README.md): Provides the geographical information database
- 📖 [`@repo/codebook`](../codebook/README.md): Manages the word codebooks used in the encoding system

## 📜 License

MIT License
