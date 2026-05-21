# 🌐 Ground.codes Web App

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
  <br />
  <br />
</p>

## 📖 Overview

Ground.codes web application is an interactive map service utilizing the Google Maps API, providing users with features to explore and manage location information. The app is built on the Next.js framework and deployed via Cloudflare Pages.

## ✨ Features

- **🗺️ Google Maps Integration**

  - 🌓 Custom dark/light theme support
  - 📍 POI (Point of Interest) markers and place details display
  - 📱 User location tracking and display
  - 🌕 Moon and Mars basemap display using USGS Astrogeology WMS layers
  - 🎮 Map controls (zoom, rotation, type change, etc.)
  - 🔍 Place search functionality

- **📏 Grid System**

  - 🧩 Grid display on the map
  - 🌐 Body-aware grid sizing for Earth, Moon, and Mars
  - 👆 Grid cell click event handling
  - 👁️ Grid visibility management

- **🌐 Multilingual Support**

  - 🇬🇧 English (default), 🇰🇷 Korean, 🇨🇳 Chinese, 🇯🇵 Japanese
  - 🍪 Cookie-based language settings without URL locale prefixes
  - 🏷️ Multilingual display of place types

- **☁️ Weather Information**
  - 🌤️ Weather information display for selected locations
  - 📊 Weather detail modal

## 🛠️ Tech Stack

- **🔄 Framework**: Next.js 15.5.18
- **📝 Language**: TypeScript
- **🧩 UI Library**: React 19
- **🎨 Styling**: Tailwind CSS 4
- **🗺️ Map API**: Google Maps API (@react-google-maps/api)
- **🌐 Internationalization**: next-intl
- **☁️ Deployment**: Cloudflare Pages

## 🔄 Recent Changes

### 📂 Structure Improvements

- Split Google Map component into smaller, more manageable files
  - Structured into main component, hooks, context, etc.
- Refactored grid system into multiple files to improve maintainability
- Split map context into smaller files for better manageability

### 🚀 Feature Improvements

- ✅ Fixed issue where the first click on Google Maps POI markers was not detected
- ➕ Added Place Details feature to display place information when POI is clicked
- 🌓 Improved theme to fix visibility issues of buildings in dark theme
- 🌐 Implemented multilingual display of place types
- 🌕 Added Earth/Moon/Mars map switching with direct URL support
  - 🗺️ Added Moon/Mars default planetary basemaps
  - 🔎 Added Ground Code and region-name search through the API
  - 🔗 Added copy/share actions for selected Ground Codes
  - 🧭 Added a no-key fallback surface so local/dev builds do not show Google Maps error modals

### 🪐 Planetary Map Mode

The web map supports three bodies through the `body` query parameter. Earth,
Moon, and Mars open in their 3D globe views by default:

- Earth 3D: `/`
- Moon 3D: `/?body=moon`
- Mars 3D: `/?body=mars`
- Earth 2D map: `/?map=roadmap`
- Moon 2D map: `/?body=moon&view=2d`
- Mars 2D map: `/?body=mars&view=2d`

Optional `lat`, `lng`, and `zoom` query parameters can be used with any
planetary body, for example
`/?body=mars&lat=18.65280&lng=-133.80250&zoom=5`.

Moon and Mars basemaps are loaded from official USGS Astrogeology WMS services:

- Moon default basemap: `KaguyaTC_Ortho`
- Mars default basemap: `MDIM21_color` with a low-alpha grayscale `THEMIS`
  detail overlay in 3D mode

Google Places search, POI details, weather, and user geolocation controls are
Earth-only. Ground code encoding and the 3m grid remain available on Moon and
Mars, with grid degree spacing adjusted for each body's radius. Ground code
region prefixes and word payloads are available in English, Korean, Chinese,
Japanese, Spanish, French, German, and Portuguese.

Share URLs use encoded Ground Codes as the canonical address:

- Earth: `/서울-안방`
- Moon: `/moon/Mare%20Tranquillitatis-...`
- Mars: `/mars/Olympus%20Mons-...`

Query-string URLs remain useful for development and deep map state, but the app
share action emits the canonical code-only URL.

Moon and Mars also include an experimental Cesium 3D globe mode. Without Cesium
ion configuration it falls back to a 3D ellipsoid with the current USGS imagery.
For real Moon/Mars terrain tiles, configure a Cesium ion token and the relevant
Moon/Mars asset IDs in the environment.

Planetary map changes must be verified on the deployed production URL with
actual screenshots or rendered-image inspection for Earth, Moon, and Mars as
applicable. Network success, canvas creation, and type checks are not enough by
themselves. Default planetary views should prefer high-resolution imagery and
natural colors close to each body's real appearance; infrared, elevation, or
relief layers should only be used in a way that does not dominate the expected
planet color.

### 🌩️ Deployment and Internationalization

- 🔗 Changed settings to prevent locale prefixes (/en/, /ko/) from appearing in URLs
- ⚙️ Added configuration for Cloudflare Pages deployment (wrangler.toml)
- 🔧 Modified next.config.ts to improve compatibility with Cloudflare Pages deployment

## 🔑 Environment Setup

The project requires the following environment variables to be set in a `.env.local` file:

```
# Required
NEXT_PUBLIC_GROUND_CODES_API_URL=https://api.ground.codes
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID=
NEXT_PUBLIC_CESIUM_ION_TOKEN=
NEXT_PUBLIC_CESIUM_MOON_ASSET_ID=
NEXT_PUBLIC_CESIUM_MARS_ASSET_ID=
GOOGLE_MAPS_NODEJS_API_KEY=
OPENWEATHER_API_KEY=
```

The map still supports Ground Code search when Google Maps credentials are not
configured. Weather and air-quality widgets are optional; if their server-side
keys are missing, the widget is hidden instead of surfacing a user-facing API
error.

## 🔗 Share URL Rules

- Earth links are code-only: `https://ground.codes/Seoul-word-word`
- Moon links use an explicit prefix: `https://ground.codes/moon/Mare Tranquillitatis-word-word`
- Mars links use an explicit prefix: `https://ground.codes/mars/Olympus Mons-word-word`

The web client keeps user-facing URLs decoded where possible so Korean,
Japanese, Chinese, and ASCII-normalized English region labels remain readable.

## 🧪 Browser QA

Use the lightweight smoke suite for regular checks:

```bash
pnpm --filter web test:e2e:smoke
```

Use the full suite only when touching shared map behavior:

```bash
pnpm --filter web test:e2e:full
```

Use visual QA when you need desktop, compact mobile, mobile, tablet, and API
docs screenshots. The `Visual QA` GitHub workflow uploads the screenshots from
`apps/web/test-results` as an artifact.

### 🔐 How to obtain API keys:

- **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** (Required):

  - 📝 Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
  - ✅ Enable the Maps JavaScript API, Places API, and Geocoding API
  - 🔑 Create an API key with appropriate restrictions
  - 📚 More info: [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/javascript/get-api-key)

- **NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID** (Optional):

  - 🎨 Create a custom map style in the [Google Cloud Console Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps)
  - 🆔 Use the generated Map ID for this variable

- **NEXT_PUBLIC_CESIUM_ION_TOKEN** (Optional):

  - 🌕 Enables Cesium ion Moon/Mars 3D Tiles in experimental planetary 3D mode
  - 🔑 Create a token in [Cesium ion](https://ion.cesium.com/tokens)

- **NEXT_PUBLIC_CESIUM_MOON_ASSET_ID / NEXT_PUBLIC_CESIUM_MARS_ASSET_ID** (Optional):

  - 🪐 Add Cesium Moon or Cesium Mars from the Cesium ion Asset Depot to your assets
  - 🆔 Use the corresponding asset IDs with the Cesium ion token

- **GOOGLE_MAPS_NODEJS_API_KEY** (Optional):

  - 🖥️ Similar to the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, but with server-side restrictions
  - 🔧 Used for server-side Google Maps API calls

- **OPENWEATHER_API_KEY** (Optional):
  - 📝 Register at [OpenWeather](https://openweathermap.org/api)
  - 🔑 Generate an API key from your account dashboard
  - ☁️ Used for weather information features

## 💻 Development Setup

```bash
# Install dependencies
pnpm install

# Run development server (using Turbopack)
pnpm dev

# Type checking
pnpm check-types

# Build
pnpm build

# Run production server
pnpm start
```

## 🚀 Deployment

```bash
# Build for Cloudflare Pages
pnpm pages:build

# Local preview
pnpm preview

# Production deployment
pnpm deploy
```

## 📁 Project Structure

```
apps/web/
├── app/                  # Next.js app directory
├── components/           # React components
│   ├── google-map/       # Google Map related components
│   │   ├── context/      # Map context
│   │   ├── hooks/        # Map related hooks
│   │   └── utils/        # Utility functions
├── hooks/                # Common hooks
├── i18n/                 # Internationalization configuration
├── lib/                  # Utilities and helper functions
│   ├── grid-system/      # Grid system implementation
├── messages/             # Multilingual message files
├── public/               # Static files
└── wrangler.toml         # Cloudflare deployment configuration
```
