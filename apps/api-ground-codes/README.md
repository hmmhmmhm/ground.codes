# 🚀 API Ground.codes

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground.codes Logo">
  <br />
  <br />
  📚 Docs: <a href="https://api.ground.codes">api.ground.codes</a>
</p>

API Ground.codes is a RESTful API service built with Elysia.js and Bun that provides geolocation encoding and decoding functionality. It converts geographic coordinates into human-readable, memorable codes and vice versa, making location sharing easier and more intuitive.

## ✨ Features

- 🔄 **Encode Coordinates**: Convert latitude and longitude to memorable ground codes
- 🔍 **Decode Ground Codes**: Convert ground codes back to geographic coordinates
- 🌎 **Region Information**: Get information about specific regions
- 🌐 **Multilingual Support**: Support for multiple languages (English, Korean, Chinese, Japanese, Spanish, French, German, Portuguese, Indonesian, Thai)
- 🌕 **Planetary Bodies**: Encode Earth, Moon, and Mars coordinates with body-specific labels
- 🎯 **Customizable Precision**: Adjust the precision of encoded locations
- 📝 **Swagger Documentation**: Interactive API documentation
- ⚡ **High-Performance Geospatial Queries**: Utilizes optimized spatial indexing for fast location searches

## 🚀 Performance Optimization

API Ground.codes leverages the `@ground-codes/geoint` package's advanced optimization techniques for high-performance geospatial operations:

### 💾 LevelDB and Spatial Indexing

- 🔍 **Fast Region Lookup**: Uses LevelDB for efficient key-value storage of region data
- 🗺️ **Spatial Indexing**: Implements KDBush and GeoKDBush for lightning-fast nearest-neighbor searches
- 📊 **Optimized Data Structure**: Pre-built spatial indexes stored in binary format for minimal memory footprint
- ⚡ **Sub-millisecond Response Times**: Delivers extremely fast responses for location-based queries

### 🔧 Implementation in API Endpoints

The API uses these optimization techniques in several key endpoints:

- `/v1/region/around`: Finds regions near specified coordinates using GeoKDBush spatial indexing
- `/v1/region/info`: Retrieves region information using LevelDB's fast key-value lookups
- `/v1/encode`: Utilizes the optimized region search to find the nearest region for encoding coordinates
- `/v1/decode`: Uses efficient region data retrieval when decoding ground codes
- `/v1/search`: Resolves encoded Ground Codes, `lat,lng` coordinate pairs, and region names/codes

The API uses the shared `ground-codes` package for encode/decode behavior and
loads `@ground-codes/geoint` embedded databases for region lookup endpoints.
The current dataset includes `region-3` sparse coverage labels for oceans,
polar regions, deserts, and remote interiors. With the default `regionLevel: 2`
fallback path, 0.25 degree global validation found no sampled point more than
200 km from its selected encoding center.

Moon and Mars are supported with `body: "moon"` and `body: "mars"`. These
requests use USGS/IAU Gazetteer planetary feature names and body-specific meter
conversion while keeping Earth as the default for backward compatibility. Mars
uses official feature names first, then falls back to readable Robbins crater
labels such as `Abalos Crater 1` when official names are sparse.
Korean, Chinese, Japanese, Spanish, French, German, Portuguese, Indonesian, Thai, Vietnamese, Hindi, and Arabic planetary labels are supported with
`language: "korean"`, `language: "chinese"`, `language: "japanese"`,
`language: "spanish"`, `language: "french"`, `language: "german"`, and
`language: "portuguese"`, `language: "indonesian"`, `language: "thai"`,
`language: "vietnamese"`, `language: "hindi"`, `language: "arabic"`, and
`language: "russian"`;
proper names are generally preserved while terrain descriptors are localized.
For example, `Olympus Mons` becomes `올림푸스 산` in Korean, `奥林帕斯山` in
Chinese, `オリンポス山` in Japanese, `Monte Olimpo` in Spanish, and
`Mont Olympe` in French, `Olympusberg` in German, `Monte Olimpo` in
Portuguese, `Gunung Olympus` in Indonesian, `ภูเขาโอลิมปัส` in Thai,
`Núi Olympus` in Vietnamese, `ओलिम्पस पर्वत` in Hindi, and `جبل أوليمبوس`
in Arabic.

This implementation enables the API to handle high volumes of geospatial queries with minimal latency, making it suitable for production applications with strict performance requirements.

## 🏁 Getting Started

### 📋 Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime)

### 📥 Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
bun install
```

### 🏃‍♂️ Running the API

#### 🛠️ Development Mode

```bash
bun run dev
```

This starts the server in development mode with hot reloading.

#### 🚀 Production Mode

```bash
bun run start
```

### 🚄 Railway Deployment

This service is part of a pnpm monorepo. The preferred Railway setup is to keep
the service root directory at the repository root and use the root
`railway.json` commands:

```bash
pnpm --filter api-ground-codes build
pnpm --filter api-ground-codes start
```

The API depends on `ground-codes`, `@ground-codes/geoint`, and `@repo/codebook`
through workspace links. Keep Railway pointed at the repository root so the
large generated geoint datasets are installed once from the checkout instead of
being downloaded repeatedly as Git package tarballs.

If Railway must be configured with `apps/api-ground-codes` as the root directory,
only this app directory is available during install. In that legacy standalone
mode the API runtime packages can be pinned to a repository tag, but this is no
longer the preferred deployment path for the full address-gap dataset. Bump that
tag whenever the deployed API needs new local changes from `ground-codes`,
`@ground-codes/geoint`, or `@repo/codebook`, then run:

```bash
pnpm runtime:update-pins railway-api-runtime-YYYYMMDD-short-name
pnpm runtime:check-pins
pnpm scripts:test
pnpm data:audit-labels
pnpm data:report-labels
pnpm production:smoke
```

`pnpm runtime:check-pins` is also part of CI so the standalone Railway package
set does not silently drift back to stale npm artifacts. `pnpm
runtime:update-pins` rewrites all three package pins together so Railway cannot
end up with a mixed runtime.

### 🛰️ Production Monitoring

The `Production Smoke` workflow runs every 30 minutes and after the web deploy
workflow completes. It checks the Railway API, the Cloudflare Pages web app, and
API route metrics. It records per-check response times for `/readyz`,
`/v1/encode`, `/v1/search`, `/metrics`, `robots.txt`, and `sitemap.xml`, and
writes the timing table to the GitHub run summary. Add a `MOSHI_WEBHOOK_TOKEN`
repository secret to send a webhook alert when the smoke workflow fails.

## 🔌 API Endpoints

### 🧩 Core Endpoints

- `POST /v1/encode`: Encode geographic coordinates to a ground code
- `POST /v1/decode`: Decode a ground code to geographic coordinates
- `POST /v1/search`: Search by encoded ground code, coordinate pair, or region name. Optional `biasLat` and `biasLng` rank ambiguous region names near the current map center.
- `POST /v1/region/around`: Get regions around specific coordinates
- `POST /v1/region/info`: Get information about a specific region

### 🔧 Utility Endpoints

- `GET /healthz`: Health check endpoint
- `GET /readyz`: Readiness endpoint for deploy/load-balancer checks
- `GET /metrics`: Lightweight JSON operational counters
- `GET /swagger`: Swagger UI for API documentation
- `GET /`: Redirects to Swagger documentation

## 📝 Usage Examples

### 🔄 Encode Coordinates

```bash
curl -X POST http://localhost:3000/v1/encode \
  -H "Content-Type: application/json" \
  -d '{"lat": 37.422, "lng": 127.024, "regionLevel": 2, "language": "english"}'
```

Response:

```
"Seoul-Happy-Tiger"
```

### 🔍 Decode Ground Code

```bash
curl -X POST http://localhost:3000/v1/decode \
  -H "Content-Type: application/json" \
  -d '{"code": "Seoul-Happy-Tiger", "regionLevel": 2, "language": "english"}'
```

Response:

```json
{
  "lat": 37.422,
  "lng": 127.024
}
```

### 🌕 Encode Moon or Mars Coordinates

```bash
curl -X POST http://localhost:3000/v1/encode \
  -H "Content-Type: application/json" \
  -d '{"lat": 8.35, "lng": 30.84, "body": "moon", "regionLevel": 2}'
```

Response:

```
"Mare Tranquillitatis-..."
```

Japanese, French, German, Portuguese, Indonesian, and Thai labels are also available:

```bash
curl -X POST http://localhost:3000/v1/encode \
  -H "Content-Type: application/json" \
  -d '{"lat": 18.6528, "lng": 226.1975, "body": "mars", "regionLevel": 2, "language": "japanese"}'
```

Response:

```
"オリンポス山-..."
```

```bash
curl -X POST http://localhost:3000/v1/encode \
  -H "Content-Type: application/json" \
  -d '{"lat": 8.35, "lng": 30.84, "body": "moon", "regionLevel": 2, "language": "french"}'
```

Response:

```
"Mer Tranquillite-..."
```

```bash
curl -X POST http://localhost:3000/v1/decode \
  -H "Content-Type: application/json" \
  -d '{"code": "Mare Tranquillitatis-...", "body": "moon", "regionLevel": 2}'
```

Mars sparse fallback labels use official nearby anchors with crater numbering:

```
"Bohar Crater 2-..."
```

### 🔎 Search Region Names Near the Current Map

```bash
curl -X POST http://localhost:3000/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Springfield", "regionLevel": 2, "language": "english", "maxResults": 3, "biasLat": 42.1, "biasLng": -72.6}'
```

Response:

```json
{
  "query": "Springfield",
  "results": [
    {
      "type": "region",
      "label": "West Springfield",
      "lat": 42.10704,
      "lng": -72.62037,
      "code": "4955089",
      "body": "earth",
      "regionLevel": 2
    }
  ]
}
```

## ⚙️ Configuration

The API supports various configuration options:

- 🏙️ **Region Level**: Choose between city names (level 2) or airport codes (level 1)
- 🌐 **Language**: Select from supported languages (English, Korean, Chinese, Japanese, Spanish, French, German, Portuguese, Indonesian, Thai)
- 📏 **Precision**: Adjust the precision of encoded locations in meters
- 🪐 **Body**: Select `earth`, `moon`, or `mars` for coordinate conversion and labels
- 🔐 **CORS**: Set `CORS_ALLOWED_ORIGINS` as a comma-separated production allowlist
- 🛡️ **Rate Limit**: Set `API_RATE_LIMIT_PER_MINUTE`; use `0` only to disable it intentionally

Search responses include short-lived shared-cache headers so production edges can
cache common lookups without caching mutable operational checks.

## 📚 Documentation

Interactive API documentation is available at the `/swagger` endpoint when the server is running.

## 📄 License

This project is part of the Ground.codes ecosystem.
