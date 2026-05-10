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

### 🪐 Planetary Map Mode

The web map supports three bodies through the `body` query parameter:

- Earth: `/`
- Moon: `/?body=moon`
- Mars: `/?body=mars`

Optional `lat`, `lng`, and `zoom` query parameters can be used with any
planetary body, for example
`/?body=mars&lat=18.65280&lng=-133.80250&zoom=5`.

Moon and Mars basemaps are loaded from official USGS Astrogeology WMS services:

- Moon default basemap: `LROC_WAC`
- Mars default basemap: `MDIM21_color`

Google Places search, POI details, weather, and user geolocation controls are
Earth-only. Ground code encoding and the 3m grid remain available on Moon and
Mars, with grid degree spacing adjusted for each body's radius. Ground code
region prefixes and word payloads are available in English, Korean, Chinese,
and Japanese.

### 🌩️ Deployment and Internationalization

- 🔗 Changed settings to prevent locale prefixes (/en/, /ko/) from appearing in URLs
- ⚙️ Added configuration for Cloudflare Pages deployment (wrangler.toml)
- 🔧 Modified next.config.ts to improve compatibility with Cloudflare Pages deployment

## 🔑 Environment Setup

The project requires the following environment variables to be set in a `.env.local` file:

```
# Required
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID=
GOOGLE_MAPS_NODEJS_API_KEY=
OPENWEATHER_API_KEY=
```

### 🔐 How to obtain API keys:

- **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** (Required):

  - 📝 Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
  - ✅ Enable the Maps JavaScript API, Places API, and Geocoding API
  - 🔑 Create an API key with appropriate restrictions
  - 📚 More info: [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/javascript/get-api-key)

- **NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID** (Optional):

  - 🎨 Create a custom map style in the [Google Cloud Console Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps)
  - 🆔 Use the generated Map ID for this variable

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
