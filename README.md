# 🌍 ground.codes

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
  <br />
  <br />
  🌐 Ground Code Web Demo: <a href="https://ground.codes">ground.codes</a><br />
  🌀 How Grok Spiral works: <a href="https://grok-spiral.ground.codes">grok-spiral.ground.codes</a><br />
  📚 API Documentation: <a href="https://api.ground.codes">api.ground.codes</a>
</p>

## 🔍 What is Ground Codes?

Ground Codes is a coordinate-based addressing system that allows you to pinpoint any location in the world using just a region name and two words (e.g., "Yongsan-Happiness-Smile"). It leverages geographic coordinate systems (GCS) to provide a user-friendly alternative to traditional latitude and longitude coordinates.

And Ground Codes is a **multi-planetary addressing system** 🪐 that provides a universal coordinate-based solution across celestial bodies. It currently supports Earth, the Moon, and Mars.

> [!WARNING]
> ⚠️ ground.codes is an ongoing project and has not yet reached completion.

## 📦 Packages & Apps

- 📍 [`ground-codes`](./packages/ground-codes/README.md): the core implementation package that provides the fundamental encoding and decoding functionality for the Ground Codes coordinate-based addressing system
- 🗺️ [`@repo/geoint`](./packages/geoint/README.md): a package for processing and providing curated geographical information about global regions with populations of 500 or more people
- 📖 [`@repo/codebook`](./packages/codebook/README.md): a package for managing the word codebooks used in the coordinate encoding system
- 🌀 [`apps/grok-spiral`](./apps/grok-spiral/README.md): an interactive visualization app demonstrating the Grok Spiral coordinate generation system that powers Ground Codes' geospatial indexing
- 🖥️ [`apps/web`](./apps/web/README.md): the main web application featuring an interactive Google Maps interface with POI details, grid system, and multilingual support for the Ground Codes system
- 🚀 [`apps/api-ground-codes`](./apps/api-ground-codes/README.md): the API server providing endpoints for Ground Codes encoding/decoding services with OpenAPI/Swagger documentation

## ✨ Key Features

- 🧠 **Simple and Memorable**: Just three words to identify any location precisely
- 🌎 **Global Coverage**: Works anywhere in the world with a unique address
- 🔓 **Open Source**: MIT licensed and fully transparent implementation
- 🌐 **Multilingual Support**: 180 language sets include codebooks, localized UI copy, and Earth, Moon, and Mars region labels. All 180 pass the automated structural, regression, and minimum-score gates; native-speaker review remains ongoing maintenance.
- 🎯 **Variable Precision**: Offers three levels of precision (3m, 30cm, and 3cm) to suit different use cases

## 📊 Comparison with Similar Services

| Service                 | Format                  | License               | Precision                                   | Global Usage                                                                        | Multilingual Support                                                   |
| ----------------------- | ----------------------- | --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 🌍 **Ground Codes**     | Yongsan-Happiness-Smile | ✅ MIT License (Free) | 1. 3 meters (standard)<br>2. 30cm<br>3. 3cm | ✅ Yes                                                                              | 🌐 180 automated-stable language sets; native-speaker review continues |
| 🔍 **Google Plus Code** | HX2F+J8                 | ⚠️ No License (Free)  | 3.5 meters                                  | ⚠️ Limited (requires 4 additional characters for global use, e.g., **8Q94HX2F+J8**) | 🇬🇧 English only                                                        |
| 🔤 **What 3 Words**     | ///teacher.awaken.days  | 💰 Proprietary (Paid) | 3 meters                                    | ✅ Yes                                                                              | 🌐 60 languages                                                        |

## 💪 Advantages Over Existing Services

### 🔄 Compared to Google Plus Codes:

- 🆔 Ground Codes assigns globally unique addresses, while Plus Codes can be duplicated across different countries
- 🧭 The region name prefix provides immediate geographic context

### 🔄 Compared to What 3 Words:

- 🆓 Open source and free under MIT license, unlike What 3 Words' proprietary commercial model
- 🧭 The region name prefix gives immediate geographic context, while What 3 Words requires an app to determine approximate location

## 📏 Variable Precision Format

Ground Codes offers different precision levels through simple syntax changes:

- 📍 **Yongsan-Happiness-Smile** (3m precision) - Ideal for AI drone delivery destinations
- 🔍 **Yongsan#Happiness#Smile** (30cm precision) - Suitable for autonomous vehicle navigation
- 🔬 **Yongsan+Consideration+Happiness+Smile** (3cm precision) - Perfect for AI humanoid robot applications

## 🔌 Integration and Access

Ground Codes is available through both web URLs and API access:

- 🌐 **Web URL**: `ground.codes/Yongsan-Happiness-Smile` → Shows the location on a map
- 🚀 **API**: `api.ground.codes/Yongsan-Happiness-Smile` → Returns latitude/longitude coordinates in JSON format

API usage is limited to 600 requests per minute per IP. For higher volume needs, paid API options or open-source modules are available.

## 🔧 Technical Details

- 🇬🇧 English word set: 6,000 words (AI-generated dataset)
- 🇰🇷 Korean word set: 5,630 words (AI-generated dataset)
- 🇨🇳 Chinese word set: 5,140 words (AI-generated dataset)
- 🇯🇵 Japanese word set: 5,000 words (frequency-guided hiragana dataset)
- 🌐 Language coverage: 180 codebooks and localized UI/region-label sets are available for Earth, Moon, and Mars datasets
- 🌎 Region names: 210,000 unique global locations with populations of 500+ (GeoNames data, commercially usable)
- 🔐 Special solutions:
  - **Region 1**: ✈️ Optimized for airports/logistics with country codes and airport codes (e.g., NYC-491AD, SSN-TA14C)
  - **Region 0**: 🛡️ Security solution (military/commercial) with custom central points and FPE encryption

## ⚙️ How Ground Codes Works

Ground Codes uses a custom GIS algorithm called "Grok Spiral" 🌀 that determines coordinates by moving in a clockwise spiral from a central point. This implementation leverages the "Gauss Circle Problem" formula to achieve O(sqrt N) efficiency in coordinate generation. The spiral pattern maintains a circular shape regardless of distance from the center point, resulting in excellent coordinate indexing efficiency.

## 🛟 Operations

- [Production service objectives](./docs/operations/service-objectives.md)
- [Production incident runbook](./docs/operations/incident-runbook.md)

## 🧰 Local Development

Region data is published as a verified immutable release. Materialize the
active release explicitly before running tests or builds that consume
`packages/geoint/region-dist` or `packages/geoint/region-db`:

```bash
git clone https://github.com/hmmhmmhm/ground.codes.git
cd ground.codes
pnpm install --frozen-lockfile
REGION_DATA_BASE_URL=https://region-data.ground.codes pnpm region-data:sync
pnpm scripts:test
pnpm build
```

The synchronizer verifies the committed release pointer, manifest, size, and
SHA-256 of every downloaded file. Dataset generators never download inputs
implicitly; run them only in a working tree where both managed data groups
have already been materialized explicitly.

## 📄 License

MIT License
