# 🌍 GeoMarket Pulse

A geopolitical risk dashboard that links real-time news events to global financial market movements.

![Dashboard](https://img.shields.io/badge/status-prototype-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![Vite](https://img.shields.io/badge/Vite-5-646cff)

## Features

- **5 Geopolitical Regions** — Middle East, East Asia, Europe, North America, Africa
- **Live Price Charts** — Index tracking with volume bars and event markers
- **News Intelligence Feed** — Sentiment-tagged headlines with impact scores
- **Geopolitical Risk Score** — Algorithm-generated 1–10 rating per region
- **AI Impact Analysis** — Market/sector/macro breakdown for each news event
- **Commodity & Forex Strip** — Related asset tracking per region
- **System Architecture View** — Technical blueprint for production scaling

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/geomarket-pulse.git
cd geomarket-pulse

# Install dependencies
npm install

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

## Deploy to GitHub Pages

1. Install the GitHub Pages plugin:
   ```bash
   npm install -D gh-pages
   ```

2. Add to `package.json` scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```

3. Add `base` to `vite.config.js`:
   ```js
   base: '/geomarket-pulse/',
   ```

4. Build and deploy:
   ```bash
   npm run build
   npm run deploy
   ```

Your site will be live at `https://YOUR_USERNAME.github.io/geomarket-pulse/`

## Deploy to Vercel (Alternative)

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → Select your repo
3. It auto-detects Vite — click Deploy
4. Live in ~30 seconds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Charts | Recharts |
| Utilities | Lodash |

## Roadmap — Connecting Real Data

This prototype uses simulated data. To go live:

| Data Source | API | Purpose |
|------------|-----|---------|
| Market Data | [yfinance](https://pypi.org/project/yfinance/) or [Alpha Vantage](https://www.alphavantage.co/) | Real-time prices |
| News Feed | [NewsAPI](https://newsapi.org/) or Google News RSS | Geopolitical headlines |
| Sentiment | Claude / Gemini API | Impact analysis |
| Forex | [Exchange Rates API](https://exchangeratesapi.io/) | Currency pairs |

You'll need a lightweight backend (Node.js API routes or Python FastAPI) to proxy these APIs and avoid exposing keys in the frontend.

## License

MIT
