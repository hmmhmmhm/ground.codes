# ground.codes

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
</p>

## What is Ground Codes?

Ground Codes is a coordinate-based addressing system that allows you to pinpoint any location in the world using just a region name and two words (e.g., "Yongsan-Happiness-Smile"). It leverages geographic coordinate systems (GCS) to provide a user-friendly alternative to traditional latitude and longitude coordinates.

## Key Features

- **Simple and Memorable**: Just three words to identify any location precisely
- **Global Coverage**: Works anywhere in the world with a unique address
- **Open Source**: MIT licensed and fully transparent implementation
- **Multilingual Support**: Currently available in Korean and English, with plans to expand to 60 languages
- **Variable Precision**: Offers three levels of precision (3m, 30cm, and 3cm) to suit different use cases

## Comparison with Similar Services

| Service          | Format                  | License            | Precision                                                               | Global Usage                                                                     | Multilingual Support                        |
| ---------------- | ----------------------- | ------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| Ground Codes     | Yongsan-Happiness-Smile | MIT License (Free) | 1. 3 meters (standard)<br>2. 30 centimeters (#)<br>3. 3 centimeters (+) | Yes                                                                              | Korean, English (expanding to 60 languages) |
| Google Plus Code | HX2F+J8                 | No License (Free)  | 3.5 meters                                                              | Limited (requires 4 additional characters for global use, e.g., **8Q94HX2F+J8**) | English only                                |
| What 3 Words     | ///teacher.awaken.days  | Proprietary (Paid) | 3 meters                                                                | Yes                                                                              | 60 languages                                |

## Advantages Over Existing Services

### Compared to Google Plus Codes:

- Ground Codes assigns globally unique addresses, while Plus Codes can be duplicated across different countries
- The region name prefix provides immediate geographic context

### Compared to What 3 Words:

- Open source and free under MIT license, unlike What 3 Words' proprietary commercial model
- The region name prefix gives immediate geographic context, while What 3 Words requires an app to determine approximate location

## Variable Precision Format

Ground Codes offers different precision levels through simple syntax changes:

- **Yongsan-Happiness-Smile** (3m precision) - Ideal for AI drone delivery destinations
- **Yongsan#Happiness#Smile** (30cm precision) - Suitable for autonomous vehicle navigation
- **Yongsan+Consideration+Happiness+Smile** (3cm precision) - Perfect for AI humanoid robot applications

## Integration and Access

Ground Codes is available through both web URLs and API access:

- **Web URL**: `ground.codes/Yongsan-Happiness-Smile` → Shows the location on a map
- **API**: `api.ground.codes/Yongsan-Happiness-Smile` → Returns latitude/longitude coordinates in JSON format

API usage is limited to 600 requests per minute per IP. For higher volume needs, paid API options or open-source modules are available.

## Technical Details

- English word set: 6,000 words (AI-generated dataset)
- Korean word set: 5,630 words (AI-generated dataset)
- Region names: 210,000 unique global locations with populations of 500+ (GeoNames data, commercially usable)
- Special solutions:
  - **Region 1**: Optimized for airports/logistics with country codes and airport codes (e.g., NYC-491AD, SSN-TA14C)
  - **Region 0**: Security solution (military/commercial) with custom central points and FPE encryption

## How Ground Codes Works

Ground Codes uses a custom GIS algorithm called "Grok Spiral" that determines coordinates by moving in a clockwise spiral from a central point. This implementation leverages the "Gauss Circle Problem" formula to achieve O(sqrt N) efficiency in coordinate generation. The spiral pattern maintains a circular shape regardless of distance from the center point, resulting in excellent coordinate indexing efficiency.

### Packages

- [`@repo/geoint`](./packages/geoint/README.md): a package for processing and providing curated geographical information about global regions with populations of 500 or more people

## License

MIT License
