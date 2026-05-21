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

Ground Codes supports Earth by default and can also encode Moon and Mars
coordinates by passing `body: "moon"` or `body: "mars"`. Existing calls without
`body` continue to use Earth and preserve the previous output format.

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
    body: "earth", // earth (default), moon, or mars
  },
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
  { regionLevel: 2 }, // Use region name (default)
);

// Then decode the encoded part
const coordinates = decode({
  encoded: "Happiness-Smile", // The encoded part after region name
  center: { lat: region.lat, lng: region.lng },
});

// Result: { lat: 37.5326, lng: 127.0246 } (approximate)
console.log(coordinates);
```

### 🌕 Moon and Mars Coordinates

Moon and Mars use the same encoding API with a body-specific distance model and
USGS/IAU planetary nomenclature labels:

```typescript
const lunarCode = await encode(
  { lat: 8.35, lng: 30.84 },
  { body: "moon", regionLevel: 2 },
);
// "Mare Tranquillitatis-..."

const marsCode = await encode(
  { lat: 18.6528, lng: -133.8025 },
  { body: "mars", regionLevel: 2 },
);
// "Olympus Mons-..."
```

The internal coordinate convention is latitude `[-90, 90]` and east-positive
longitude `[-180, 180]`. The Moon and Mars datasets are generated from the
USGS/IAU Gazetteer of Planetary Nomenclature KML center-point downloads.

## ✨ Key Features

- 🔤 **Simple and Memorable**: Just three words to identify any location precisely
- 🌎 **Global Coverage**: Works anywhere in the world with a unique address
- 📖 **Open Source**: MIT licensed and fully transparent implementation
- 🌐 **Multilingual Support**: Currently available in English, Korean, Chinese, Japanese, Spanish, and French word sets and region labels
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
  - `body`: `"earth" | "moon" | "mars"` - Celestial body (default: `"earth"`)

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
  - `body`: `"earth" | "moon" | "mars"` - Celestial body (default: `"earth"`)

**Returns:** `Promise<{ name: string, code: string, lat: number, lng: number }>` - The closest region

### 🔍 `findRegionsByQuery(codeOrName, options?)`

Finds exact and partial region-name/code matches for search suggestions.

**Parameters:**

- `codeOrName`: `string` - Region name or code to search
- `options` (optional):
  - `regionLevel`: `number` - Region level to search for
  - `language`: `SupportedLanguage` - Language for region names
  - `body`: `"earth" | "moon" | "mars"` - Celestial body (default: `"earth"`)
  - `maxResults`: `number` - Maximum results to return
  - `biasLat`, `biasLng`: `number` - Optional map-center coordinates used to rank ambiguous matches nearby

```typescript
await findRegionsByQuery("Springfield", {
  regionLevel: 2,
  body: "earth",
  biasLat: 42.1,
  biasLng: -72.6,
  maxResults: 1,
});
// [{ name: "West Springfield", ... }]
```

### 🪐 Celestial Body Model

The spherical coordinate diff model uses meters per latitude degree:

| body  | meters per degree | label dataset                                             |
| ----- | ----------------: | --------------------------------------------------------- |
| earth |            111000 | GeoNames, airport/country codes, sparse region-3 fallback |
| moon  |            ~30323 | USGS/IAU Moon nomenclature center points                  |
| mars  |            ~59158 | USGS/IAU Mars nomenclature plus Robbins crater fallback   |

Earth intentionally keeps the historical `111000` meters-per-degree
approximation so existing encoded strings remain stable. Moon currently uses
`regionLevel: 2` official feature names. Mars uses official
`regionLevel: 2` names first, then falls back to `regionLevel: 3` crater labels
derived from the USGS Astrogeology Robbins V1 Crater Database when official
names are sparse. English, Korean, Chinese, Japanese, Spanish, and French
planetary prefixes are available.

Mars crater fallback names are intentionally human-readable. The raw Robbins
crater ID is stored in `code` as `MCR-xx-yyyyyy`, while the visible name is based
on the nearest official Mars feature anchor:

```typescript
await encode({ lat: 64.3, lng: -86.4 }, { body: "mars" });
// "Bohar Crater 2-..."

await encode({ lat: 64.3, lng: -86.4 }, { body: "mars", language: "korean" });
// "Bohar 크레이터 2-..."

await encode({ lat: 64.3, lng: -86.4 }, { body: "mars", language: "chinese" });
// "Bohar撞击坑2-..."

await encode({ lat: 64.3, lng: -86.4 }, { body: "mars", language: "japanese" });
// "ボハルクレーター 2-..."

await encode({ lat: 64.3, lng: -86.4 }, { body: "mars", language: "spanish" });
// "Crater Bohar 2-..."

await encode({ lat: 64.3, lng: -86.4 }, { body: "mars", language: "french" });
// "Cratere Bohar 2-..."
```

Japanese, Spanish, and French are supported for both region prefix labels and
the coordinate word-set payload. Spanish and French URL labels are ASCII-only,
so shared URLs remain readable while accent-insensitive search still works.

Current Mars 0.25 degree sampling with official names plus crater fallback:

|  metric | distance |
| ------: | -------: |
| average |  59.2 km |
|     p95 | 156.1 km |
|     p99 | 216.9 km |
|     max | 368.6 km |

### 🌐 Global Region Fallback Coverage

The default `regionLevel: 2` lookup now uses a sparse-coverage fallback path for
areas where city data is too far away. If the nearest city is more than 100 km
from the target, Ground Codes compares `region-1` and `region-3` candidates and
uses whichever center is closer.

- `region-1` provides compact airport or administrative codes.
- `region-2` provides GeoNames city labels and remains the normal default near populated places.
- `region-3` fills sparse ocean, polar, desert, and interior gaps with marine labels, Antarctic names, polar/desert grids, and nearby-name labels.

When `region-1` is selected only as a fallback from a `regionLevel: 2` request,
the region code is used as the prefix but the coordinate payload still uses the
word set. Explicit `regionLevel: 1` requests continue to use base32 payloads.

Examples:

```typescript
await encode({ lat: 67.25, lng: -105.25 }, { regionLevel: 2 });
// "CGR3-Gauge-Deliver-Camp" style word-set payload

await encode({ lat: 67.25, lng: -105.25 }, { regionLevel: 1 });
// "CGR3-..." base32 payload
```

Current 0.25 degree global sampling with `regionLevel: 2` fallback enabled:

|  metric | distance |
| ------: | -------: |
| average |  63.9 km |
|     p95 | 118.6 km |
|     p99 | 137.6 km |
|     max | 199.7 km |

The current dataset has no sampled point above 200 km from its selected center
in the 0.25 degree global grid used for validation.

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

### Current Scale Benchmarks

Benchmarks below were measured with cache disabled:

```bash
CASES=10 MAX_DIGITS=21 RUN_SLOW_BIGINT=1 SPIRAL_CACHE=0 SEED=424242 \
  pnpm --filter ground-codes exec tsx scripts/benchmark-spiral-scale.ts
```

`n -> xy`:

| n digits |        avg |     median |         p95 |
| -------: | ---------: | ---------: | ----------: |
|        1 |    26.29us |    10.12us |    174.92us |
|        2 |    10.45us |     9.46us |     19.50us |
|        3 |    20.05us |    20.17us |     31.87us |
|        4 |    21.07us |    19.37us |     44.92us |
|        5 |    17.19us |    17.04us |     28.83us |
|        6 |    19.12us |    19.08us |     34.83us |
|        7 |    39.41us |    41.21us |     58.04us |
|        8 |   117.04us |   136.79us |    167.17us |
|        9 |   453.66us |   479.04us |    710.87us |
|       10 |    1.683ms |    1.232ms |     4.267ms |
|       11 |    2.769ms |    3.116ms |     3.379ms |
|       12 |    6.577ms |    6.807ms |     8.149ms |
|       13 |   16.444ms |   18.653ms |    20.740ms |
|       14 |   40.237ms |   41.738ms |    51.001ms |
|       15 |   17.799ms |   13.889ms |    49.210ms |
|       16 |   17.446ms |   19.914ms |    27.461ms |
|       17 |   45.449ms |   44.509ms |    58.040ms |
|       18 |  194.446ms |  198.617ms |   284.583ms |
|       19 |  316.517ms |  333.190ms |   407.028ms |
|       20 | 1444.556ms |  981.099ms |  3511.057ms |
|       21 | 3765.861ms | 2970.587ms | 14544.587ms |

`xy -> n`:

| coordinate digits |        avg |     median |        p95 |
| ----------------: | ---------: | ---------: | ---------: |
|                 1 |   164.21us |     5.38us |    1.435ms |
|                 2 |    14.61us |    11.42us |    32.83us |
|                 3 |    26.65us |    17.71us |    72.83us |
|                 4 |    49.30us |    40.04us |    99.83us |
|                 5 |   213.17us |   205.63us |   293.17us |
|                 6 |    1.466ms |    1.546ms |    1.918ms |
|                 7 |   12.243ms |   12.488ms |   17.032ms |
|                 8 |   52.343ms |   48.880ms |   77.558ms |
|                 9 |  130.253ms |  142.473ms |  168.166ms |
|                10 |  681.954ms |  782.683ms |  908.628ms |
|                11 | 3188.709ms | 3449.567ms | 4466.203ms |

For a single Earth-wide center at about 3mm precision, expected maximum values
are around 10 coordinate digits and 21 index digits. Higher precision or larger
single-center coverage can move more work into the slower BigInt path.
The lower digit rows are included to show the fast number-path behavior for
typical small or regional inputs.

## 🔗 Integration with Other Packages

This package works seamlessly with other Ground Codes ecosystem packages:

- 🗺️ [`@repo/geoint`](../geoint/README.md): Provides the geographical information database
- 📖 [`@repo/codebook`](../codebook/README.md): Manages the word codebooks used in the encoding system

## 📜 License

MIT License
