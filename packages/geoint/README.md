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

### Running Scripts

The package includes a script selector that allows you to run various data processing scripts:

```bash
# Run the script selector
pnpm run dev
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

To build the package:

```bash
pnpm run build
```

## License

MIT License. This package is part of the ground.codes project.
