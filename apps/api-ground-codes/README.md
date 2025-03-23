# API Ground.codes

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground.codes Logo">
  <br />
  Docs: <a href="https://api.ground.codes">api.ground.codes</a>
</p>

API Ground.codes is a RESTful API service built with Elysia.js and Bun that provides geolocation encoding and decoding functionality. It converts geographic coordinates into human-readable, memorable codes and vice versa, making location sharing easier and more intuitive.

## Features

- **Encode Coordinates**: Convert latitude and longitude to memorable ground codes
- **Decode Ground Codes**: Convert ground codes back to geographic coordinates
- **Region Information**: Get information about specific regions
- **Multilingual Support**: Support for multiple languages (English, Korean, Chinese)
- **Customizable Precision**: Adjust the precision of encoded locations
- **Swagger Documentation**: Interactive API documentation
- **High-Performance Geospatial Queries**: Utilizes optimized spatial indexing for fast location searches

## Performance Optimization

API Ground.codes leverages the `@ground-codes/geoint` package's advanced optimization techniques for high-performance geospatial operations:

### LevelDB and Spatial Indexing

- **Fast Region Lookup**: Uses LevelDB for efficient key-value storage of region data
- **Spatial Indexing**: Implements KDBush and GeoKDBush for lightning-fast nearest-neighbor searches
- **Optimized Data Structure**: Pre-built spatial indexes stored in binary format for minimal memory footprint
- **Sub-millisecond Response Times**: Delivers extremely fast responses for location-based queries

### Implementation in API Endpoints

The API uses these optimization techniques in several key endpoints:

- `/v1/region/around`: Finds regions near specified coordinates using GeoKDBush spatial indexing
- `/v1/region/info`: Retrieves region information using LevelDB's fast key-value lookups
- `/encode`: Utilizes the optimized region search to find the nearest region for encoding coordinates
- `/decode`: Uses efficient region data retrieval when decoding ground codes

This implementation enables the API to handle high volumes of geospatial queries with minimal latency, making it suitable for production applications with strict performance requirements.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
bun install
```

### Running the API

#### Development Mode

```bash
bun run dev
```

This starts the server in development mode with hot reloading.

#### Production Mode

```bash
bun run start
```

## API Endpoints

### Core Endpoints

- `POST /encode`: Encode geographic coordinates to a ground code
- `POST /decode`: Decode a ground code to geographic coordinates
- `GET /v1/region/around`: Get regions around specific coordinates
- `GET /v1/region/info`: Get information about a specific region

### Utility Endpoints

- `GET /healthz`: Health check endpoint
- `GET /swagger`: Swagger UI for API documentation
- `GET /`: Redirects to Swagger documentation

## Usage Examples

### Encode Coordinates

```bash
curl -X POST http://localhost:3000/encode \
  -H "Content-Type: application/json" \
  -d '{"lat": 37.422, "lng": 127.024, "regionLevel": 2, "language": "english"}'
```

Response:

```
"Seoul-Happy-Tiger"
```

### Decode Ground Code

```bash
curl -X POST http://localhost:3000/decode \
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

## Configuration

The API supports various configuration options:

- **Region Level**: Choose between city names (level 2) or airport codes (level 1)
- **Language**: Select from supported languages (English, Korean, Chinese)
- **Precision**: Adjust the precision of encoded locations in meters

## Documentation

Interactive API documentation is available at the `/swagger` endpoint when the server is running.

## License

This project is part of the Ground.codes ecosystem.
