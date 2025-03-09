# ground-codes

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
</p>

## Overview

The `ground-codes` package is the core implementation of the Ground Codes coordinate-based addressing system. This package provides the fundamental encoding and decoding functionality that powers the entire Ground Codes ecosystem.

Ground Codes is a coordinate-based addressing system that allows you to pinpoint any location in the world using just a region name and two words (e.g., "Yongsan-Happiness-Smile"). It leverages geographic coordinate systems (GCS) to provide a user-friendly alternative to traditional latitude and longitude coordinates.

> [!WARNING]
> ground-codes is an ongoing project and has not yet reached completion.

## Installation

```bash
npm install ground-codes
# or
yarn add ground-codes
# or
pnpm add ground-codes
```

## Usage

### Encoding Coordinates

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

### Decoding Ground Codes

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

## Key Features

- **Simple and Memorable**: Just three words to identify any location precisely
- **Global Coverage**: Works anywhere in the world with a unique address
- **Open Source**: MIT licensed and fully transparent implementation
- **Multilingual Support**: Currently available in Korean and English, with plans to expand to 60 languages
- **Variable Precision**: Offers three levels of precision (3m, 30cm, and 3cm) to suit different use cases

## API Reference

### `encode(target, options?)`

Encodes geographic coordinates into a Ground Codes address.

**Parameters:**

- `target`: `{ lat: number, lng: number }` - The target coordinates to encode
- `options` (optional):
  - `center`: `{ lat: number, lng: number }` - Custom center point (if not provided, closest region is used)
  - `regionLevel`: `number` - Region level (1 = code format, 2+ = name format)
  - `precisionMeters`: `number` - Precision in meters (default: 3)
  - `language`: `SupportedLanguage` - Output language (default: 'en')

**Returns:** `Promise<string>` - The encoded Ground Codes address

### `decode({ encoded, center })`

Decodes a Ground Codes address back to geographic coordinates.

**Parameters:**

- `encoded`: `string` - The encoded part of the Ground Codes address
- `center`: `{ lat: number, lng: number }` - The center point coordinates

**Returns:** `{ lat: number, lng: number }` - The decoded geographic coordinates

### `findClosestRegion(target, options?)`

Finds the closest region to the given coordinates.

**Parameters:**

- `target`: `{ lat: number, lng: number }` - The target coordinates
- `options` (optional):
  - `regionLevel`: `number` - Region level to search for
  - `language`: `SupportedLanguage` - Language for region names

**Returns:** `Promise<{ name: string, code: string, lat: number, lng: number }>` - The closest region

## Precision Levels

Ground Codes offers different precision levels through simple syntax changes:

- **Yongsan-Happiness-Smile** (3m precision) - Standard precision, ideal for general location finding
- **Yongsan#Happiness#Smile** (30cm precision) - Higher precision for detailed navigation
- **Yongsan+Consideration+Happiness+Smile** (3cm precision) - Highest precision for exact positioning

## Technical Details

Ground Codes uses a custom GIS algorithm called "Grok Spiral" that determines coordinates by moving in a clockwise spiral from a central point. This implementation leverages the "Gauss Circle Problem" formula to achieve O(sqrt N) efficiency in coordinate generation. The spiral pattern maintains a circular shape regardless of distance from the center point, resulting in excellent coordinate indexing efficiency.

## Integration with Other Packages

This package works seamlessly with other Ground Codes ecosystem packages:

- [`@repo/geoint`](../geoint/README.md): Provides the geographical information database
- [`@repo/codebook`](../codebook/README.md): Manages the word codebooks used in the encoding system

## License

MIT License
