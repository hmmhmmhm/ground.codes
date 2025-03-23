# GEOINT Package

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
</p>

The Geoint package is a data processing toolkit designed for the ground.codes project. It processes and provides curated geographical information about global regions with populations of 500 or more people. The package includes scripts for data extraction, processing, and multilingual translation of region names.

## Region System

The GEOINT package for ground.codes implements a hierarchical Region system with two levels:

### Region Level 1 (Short Code)

Region Level 1 uses airport codes and country codes, consisting of 2-4 character short codes:

- **2-character codes**: ISO 3166-1 alpha-2 country codes (243 codes)
- **3-character codes**: IATA Airport Codes (7,783 codes)
- **4-character codes**: ICAO Airport Codes (21,483 codes)

Total Region Level 1 codes: 29,509

### Region Level 2 (GeoNames)

Region Level 2 uses city names from the GeoNames World Cities database:

- Total GeoNames entries: 215,659
- Unique cities in English: 173,528
- Unique cities in Korean: 167,814

## Features

- Processes global geographical data from GeoNames
- Filters regions by population (minimum 500 people)
- Provides standardized JSON output with region names, coordinates, population data, and country codes
- Supports multilingual region name translations
- Includes data processing scripts for maintaining and updating datasets

## Data Structure

The package processes and outputs data in the following structure:

```json
{
  "name": "CityName",
  "code": "GeonameId",
  "lat": 42.53176,
  "long": 1.56654,
  "population": 1418,
  "countryCode": "AD"
}
```

## Directory Structure

- `/src`: Source code for data processing scripts
- `/region-dataset`: Raw data files and intermediate processing files
- `/region-dist`: Final processed JSON files ready for use
- `/region-db`: Optimized database files using LevelDB and KDBush spatial indexing

## Location Optimization

The GEOINT package implements high-performance location search and retrieval using a combination of technologies:

### LevelDB for Fast Data Storage

- Uses LevelDB (via the `level` package) to create embedded key-value databases for each region dataset
- Provides extremely fast data retrieval by region code or name
- Stores region data in an optimized format for quick access
- Each region dataset has its own LevelDB instance in the `/region-db` directory

### KDBush and GeoKDBush for Spatial Indexing

- Implements KDBush spatial indexing for efficient geographic point storage
- Uses GeoKDBush for lightning-fast nearest-neighbor searches
- Enables rapid retrieval of regions around specific coordinates
- Optimized for both memory usage and query performance
- Spatial indexes are stored as binary files with `.index` extension

### Implementation Details

The optimization process works as follows:

1. During build time, region data is processed and stored in both LevelDB and KDBush indexes
2. Region data is indexed by both ID and name/code for flexible querying
3. At runtime, the `load()` function initializes the databases and indexes
4. The `around()` function uses GeoKDBush to find regions near specified coordinates
5. The `info()` function retrieves detailed information about specific regions

This approach provides significant performance benefits:
- Sub-millisecond response times for location queries
- Efficient memory usage through binary spatial indexes
- Scalable to handle large datasets with minimal performance impact

## Output Files

- `region-1.json`: Contains region data with 4 or fewer digits (including airport codes)
- `region-2.json`: Contains city data from GeoNames cities500 dataset
- `region-2-[language].json`: Contains translated city names for specific languages

## Usage

### Installation

```bash
# Install dependencies
pnpm install
```

### Programmatic Usage

```typescript
import { load, around, info } from "@ground-codes/geoint";

// Load the region databases (done once at startup)
await load(["region-1", "region-2"]);

// Find regions around a specific point
const nearbyRegions = await around({
  regionName: "region-2",
  lat: 37.5665,
  lng: 126.9780,
  maxResults: 5,
  maxDistance: 10000 // meters
});

// Get information about a specific region
const regionInfo = await info({
  regionName: "region-2",
  name: "Seoul"
});
```

### Running Scripts

The package includes a script selector that allows you to run various data processing scripts:

```bash
# Run the script selector
pnpm run dataset-build
```

### Available Scripts

1. **Region 1 Build**

   - Builds a dataset with regions having 4 or fewer digits
   - Updates region-dist file with current airport codes (ICAO and IATA)

2. **Region 2 Build**

   - Processes the cities500.txt file from GeoNames
   - Filters cities with populations of 500 or more
   - Creates a standardized JSON output with city information

3. **Region 2 Create Pre-Translation**

   - Prepares files for translation of region names
   - Creates batch files in the pre-translation folder

4. **Region 2 Create Translation**

   - Uses generative AI (OpenAI) to translate region names from English to target languages
   - Requires an OpenAI API key (set in environment variables)

5. **Region 2 Build Translation**
   - Updates the build for language-specific regional name translations
   - Allows selection of specific languages to process

## Data Sources

The primary data source is the GeoNames cities500.txt file, which can be downloaded from:
https://download.geonames.org/export/dump/cities500.zip

Additional data sources used in this package include:

- **ISO 3166-1 Alpha-2 Code JSON**
  (MIT License) https://gist.github.com/ssskip/5a94bfcd2835bf1dea52

- **ISO 3166-1 Alpha-2 Centroids JSON**
  (MIT License) https://github.com/gavinr/world-countries-centroids/blob/master/dist/countries.csv

- **IATA & ICAO Airport Code JSON**
  (MIT License) https://github.com/mwgg/Airports

## Translation Process

The translation process consists of three steps:

1. Create pre-translation files (region-2-create-pre-translation)
2. Generate translations using AI (region-2-create-translation)
3. Build the final translated JSON files (region-2-build-translation)

## Environment Variables

For translation functionality, you need to set up an OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
```

## Development

To build the dataset:

```bash
pnpm run build
```

## License

MIT License. This package is part of the ground.codes project.
