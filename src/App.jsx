import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as Recharts from "recharts";
import _ from "lodash";
import GlobeGL from "react-globe.gl";

const { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar, Cell, CartesianGrid, ComposedChart, Scatter } = Recharts;

/* ═══════════════════════════════════════════════════════════════════════════
   DATA ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

const REGIONS = {
  "Middle East": {
    color: "#E8963E", lat: 24, lng: 45,
    keywords: ["sanctions", "OPEC", "conflict", "Iran", "oil supply", "Houthi", "Red Sea"],
    markets: [
      { name: "Tadawul", ticker: "^TASI", country: "Saudi Arabia", base: 11800 },
      { name: "ADX", ticker: "^ADX", country: "UAE", base: 9200 },
      { name: "QSE", ticker: "^QSI", country: "Qatar", base: 10400 },
      { name: "Boursa Kuwait", ticker: "^BKP", country: "Kuwait", base: 7600 },
    ],
    commodities: [
      { name: "Brent Crude", unit: "$/bbl", base: 78.42 },
      { name: "Natural Gas", unit: "$/MMBtu", base: 3.21 },
      { name: "USD/SAR", unit: "", base: 3.7503 },
    ],
    countries: [
      { name: "Saudi Arabia", lat: 24.7, lng: 46.7 },
      { name: "Iran", lat: 32.4, lng: 53.7 },
      { name: "UAE", lat: 24.0, lng: 54.0 },
      { name: "Iraq", lat: 33.2, lng: 44.4 },
      { name: "Qatar", lat: 25.3, lng: 51.2 },
      { name: "Yemen", lat: 15.6, lng: 48.5 },
      { name: "Kuwait", lat: 29.3, lng: 47.5 },
      { name: "Oman", lat: 21.5, lng: 55.9 },
    ],
    mapBounds: { minLat: 12, maxLat: 38, minLng: 34, maxLng: 62 },
  },
  "East Asia": {
    color: "#D94F5C", lat: 35, lng: 115,
    keywords: ["Taiwan", "trade war", "tariffs", "South China Sea", "TSMC", "chips"],
    markets: [
      { name: "Nikkei 225", ticker: "^N225", country: "Japan", base: 38500 },
      { name: "Hang Seng", ticker: "^HSI", country: "Hong Kong", base: 17200 },
      { name: "Shanghai Comp.", ticker: "^SSEC", country: "China", base: 3050 },
      { name: "KOSPI", ticker: "^KS11", country: "South Korea", base: 2580 },
      { name: "TAIEX", ticker: "^TWII", country: "Taiwan", base: 20100 },
    ],
    commodities: [
      { name: "Copper", unit: "$/lb", base: 4.12 },
      { name: "Rare Earth (Nd)", unit: "$/kg", base: 72.8 },
      { name: "USD/CNY", unit: "", base: 7.2431 },
    ],
    countries: [
      { name: "China", lat: 35.9, lng: 104.2 },
      { name: "Japan", lat: 36.2, lng: 138.3 },
      { name: "South Korea", lat: 35.9, lng: 127.8 },
      { name: "Taiwan", lat: 23.7, lng: 120.9 },
      { name: "Hong Kong", lat: 22.3, lng: 114.2 },
      { name: "North Korea", lat: 40.0, lng: 127.0 },
    ],
    mapBounds: { minLat: 18, maxLat: 46, minLng: 98, maxLng: 148 },
  },
  Europe: {
    color: "#4A8FE7", lat: 50, lng: 10,
    keywords: ["NATO", "energy crisis", "election", "ECB", "Russia", "defense"],
    markets: [
      { name: "STOXX 600", ticker: "^STOXX", country: "EU", base: 480 },
      { name: "DAX", ticker: "^GDAXI", country: "Germany", base: 18200 },
      { name: "FTSE 100", ticker: "^FTSE", country: "UK", base: 8100 },
      { name: "CAC 40", ticker: "^FCHI", country: "France", base: 7600 },
      { name: "FTSE MIB", ticker: "^FTSEMIB", country: "Italy", base: 33800 },
    ],
    commodities: [
      { name: "TTF Gas", unit: "€/MWh", base: 34.5 },
      { name: "Wheat", unit: "$/bu", base: 612 },
      { name: "EUR/USD", unit: "", base: 1.0842 },
    ],
    countries: [
      { name: "Germany", lat: 51.2, lng: 10.5 },
      { name: "France", lat: 46.2, lng: 2.2 },
      { name: "UK", lat: 55.4, lng: -3.4 },
      { name: "Italy", lat: 41.9, lng: 12.6 },
      { name: "Spain", lat: 40.5, lng: -3.7 },
      { name: "Poland", lat: 51.9, lng: 19.1 },
      { name: "Netherlands", lat: 52.1, lng: 5.3 },
      { name: "Ukraine", lat: 48.4, lng: 31.2 },
    ],
    mapBounds: { minLat: 35, maxLat: 62, minLng: -12, maxLng: 40 },
  },
  "North America": {
    color: "#5BAE6A", lat: 40, lng: -100,
    keywords: ["Fed", "debt ceiling", "election", "trade policy", "AI", "tariffs"],
    markets: [
      { name: "S&P 500", ticker: "^GSPC", country: "United States", base: 5200 },
      { name: "Nasdaq", ticker: "^IXIC", country: "United States", base: 16400 },
      { name: "Dow Jones", ticker: "^DJI", country: "United States", base: 38900 },
      { name: "TSX", ticker: "^GSPTSE", country: "Canada", base: 21800 },
      { name: "IPC Mexico", ticker: "^MXX", country: "Mexico", base: 55200 },
    ],
    commodities: [
      { name: "Gold", unit: "$/oz", base: 2341.5 },
      { name: "WTI Crude", unit: "$/bbl", base: 74.3 },
      { name: "DXY", unit: "index", base: 104.32 },
    ],
    countries: [
      { name: "United States", lat: 39.8, lng: -98.6 },
      { name: "Canada", lat: 56.1, lng: -106.3 },
      { name: "Mexico", lat: 23.6, lng: -102.6 },
    ],
    mapBounds: { minLat: 14, maxLat: 65, minLng: -140, maxLng: -52 },
  },
  Africa: {
    color: "#9B6DD7", lat: -5, lng: 25,
    keywords: ["coup", "mining", "election", "infrastructure", "cobalt", "uranium"],
    markets: [
      { name: "JSE Top 40", ticker: "^JTOPI", country: "South Africa", base: 72000 },
      { name: "NGX ASI", ticker: "^NGSE", country: "Nigeria", base: 97400 },
      { name: "NSE 20", ticker: "^NSE20", country: "Kenya", base: 1780 },
      { name: "EGX 30", ticker: "^EGX30", country: "Egypt", base: 28500 },
    ],
    commodities: [
      { name: "Gold", unit: "$/oz", base: 2341.5 },
      { name: "Platinum", unit: "$/oz", base: 987.6 },
      { name: "USD/ZAR", unit: "", base: 18.62 },
    ],
    countries: [
      { name: "South Africa", lat: -30.6, lng: 22.9 },
      { name: "Nigeria", lat: 9.1, lng: 8.7 },
      { name: "Kenya", lat: -0.02, lng: 37.9 },
      { name: "Egypt", lat: 26.8, lng: 30.8 },
      { name: "Ethiopia", lat: 9.1, lng: 40.5 },
      { name: "DRC", lat: -4.0, lng: 21.8 },
      { name: "Niger", lat: 17.6, lng: 8.1 },
      { name: "Sudan", lat: 12.9, lng: 30.2 },
    ],
    mapBounds: { minLat: -36, maxLat: 24, minLng: -18, maxLng: 52 },
  },
  "South America": {
    color: "#14B8A6", lat: -15, lng: -55,
    keywords: ["Lula", "Amazon", "lithium", "commodities", "Mercosur", "elections"],
    markets: [
      { name: "Bovespa", ticker: "^BVSP", country: "Brazil", base: 128000 },
      { name: "Merval", ticker: "^MERV", country: "Argentina", base: 1420000 },
      { name: "IPSA", ticker: "^IPSA", country: "Chile", base: 6200 },
      { name: "COLCAP", ticker: "^COLCAP", country: "Colombia", base: 1280 },
    ],
    commodities: [
      { name: "Soybeans", unit: "¢/bu", base: 1142 },
      { name: "Iron Ore", unit: "$/t", base: 118 },
      { name: "USD/BRL", unit: "", base: 4.97 },
    ],
    countries: [
      { name: "Brazil", lat: -14.2, lng: -51.9 },
      { name: "Argentina", lat: -38.4, lng: -63.6 },
      { name: "Chile", lat: -35.7, lng: -71.5 },
      { name: "Colombia", lat: 4.6, lng: -74.1 },
      { name: "Peru", lat: -9.2, lng: -75.0 },
      { name: "Venezuela", lat: 6.4, lng: -66.6 },
    ],
    mapBounds: { minLat: -56, maxLat: 14, minLng: -82, maxLng: -34 },
  },
  "South Asia": {
    color: "#F472B6", lat: 22, lng: 78,
    keywords: ["Modi", "Kashmir", "monsoon", "IT outsourcing", "rupee", "election"],
    markets: [
      { name: "Nifty 50", ticker: "^NSEI", country: "India", base: 22500 },
      { name: "Sensex", ticker: "^BSESN", country: "India", base: 74200 },
      { name: "KSE 100", ticker: "^KSE100", country: "Pakistan", base: 72300 },
      { name: "CSE ASI", ticker: "^CSE", country: "Sri Lanka", base: 11200 },
    ],
    commodities: [
      { name: "Cotton", unit: "¢/lb", base: 82.4 },
      { name: "Rice", unit: "$/cwt", base: 17.2 },
      { name: "USD/INR", unit: "", base: 83.12 },
    ],
    countries: [
      { name: "India", lat: 20.6, lng: 79.0 },
      { name: "Pakistan", lat: 30.4, lng: 69.3 },
      { name: "Bangladesh", lat: 23.7, lng: 90.4 },
      { name: "Sri Lanka", lat: 7.9, lng: 80.8 },
    ],
    mapBounds: { minLat: 4, maxLat: 38, minLng: 60, maxLng: 96 },
  },
};

const NEWS_DB = {
  "Middle East": [
    { headline: "OPEC+ signals deeper production cuts amid geopolitical tensions", sentiment: -0.7, impact: 8, category: "energy", country: "Saudi Arabia" },
    { headline: "US imposes new sanctions on Iranian oil exports", sentiment: -0.8, impact: 9, category: "sanctions", country: "Iran" },
    { headline: "Saudi Arabia announces $100B diversification fund", sentiment: 0.6, impact: 6, category: "investment", country: "Saudi Arabia" },
    { headline: "Red Sea shipping disruptions escalate insurance costs 300%", sentiment: -0.9, impact: 9, category: "trade", country: "Yemen" },
    { headline: "Gulf states agree to regional de-escalation framework", sentiment: 0.5, impact: 5, category: "diplomacy", country: "UAE" },
    { headline: "Iran nuclear talks stall as deadline approaches", sentiment: -0.6, impact: 7, category: "nuclear", country: "Iran" },
    { headline: "UAE-Israel trade corridor hits record $3.2B volumes", sentiment: 0.4, impact: 4, category: "trade", country: "UAE" },
    { headline: "Houthi missile strikes force Suez Canal rerouting", sentiment: -0.85, impact: 9, category: "conflict", country: "Yemen" },
    { headline: "Iraq parliament approves new oil revenue sharing law", sentiment: 0.3, impact: 4, category: "policy", country: "Iraq" },
    { headline: "Qatar invests $5B in Asian LNG infrastructure expansion", sentiment: 0.5, impact: 5, category: "energy", country: "Qatar" },
    { headline: "Kuwait sovereign wealth fund increases European exposure", sentiment: 0.3, impact: 3, category: "investment", country: "Kuwait" },
    { headline: "Oman-Iran gas pipeline deal signed after 10-year delay", sentiment: 0.4, impact: 5, category: "energy", country: "Oman" },
  ],
  "East Asia": [
    { headline: "China announces retaliatory tariffs on US tech imports", sentiment: -0.8, impact: 9, category: "trade", country: "China" },
    { headline: "Taiwan semiconductor exports surge to all-time high", sentiment: 0.7, impact: 7, category: "tech", country: "Taiwan" },
    { headline: "South China Sea military drills heighten regional tensions", sentiment: -0.9, impact: 8, category: "military", country: "China" },
    { headline: "Japan-Korea trade normalization talks resume in Tokyo", sentiment: 0.4, impact: 5, category: "diplomacy", country: "Japan" },
    { headline: "Beijing restricts rare earth exports to Western nations", sentiment: -0.7, impact: 8, category: "trade", country: "China" },
    { headline: "North Korea missile test triggers emergency UN session", sentiment: -0.8, impact: 7, category: "military", country: "North Korea" },
    { headline: "China property sector defaults ripple through bond markets", sentiment: -0.6, impact: 8, category: "financial", country: "China" },
    { headline: "TSMC begins construction on Japan fab plant", sentiment: 0.6, impact: 6, category: "tech", country: "Taiwan" },
    { headline: "Bank of Japan signals end to negative interest rate policy", sentiment: 0.3, impact: 7, category: "monetary", country: "Japan" },
    { headline: "South Korea chipmakers report record AI chip demand", sentiment: 0.8, impact: 7, category: "tech", country: "South Korea" },
    { headline: "Hong Kong reopens stock connect with expanded access", sentiment: 0.4, impact: 5, category: "financial", country: "Hong Kong" },
    { headline: "Chinese EV exports to Europe face 45% tariff threat", sentiment: -0.5, impact: 6, category: "trade", country: "China" },
  ],
  Europe: [
    { headline: "ECB holds rates steady amid stagflation concerns", sentiment: -0.3, impact: 6, category: "monetary", country: "Germany" },
    { headline: "EU imposes new energy sanctions package on Russia", sentiment: -0.6, impact: 7, category: "sanctions", country: "Netherlands" },
    { headline: "France pension reform protests disrupt economic output", sentiment: -0.5, impact: 5, category: "social", country: "France" },
    { headline: "Germany approves massive defense spending increase", sentiment: 0.3, impact: 6, category: "defense", country: "Germany" },
    { headline: "UK-EU post-Brexit trade deal reaches new milestone", sentiment: 0.5, impact: 5, category: "trade", country: "UK" },
    { headline: "European natural gas reserves hit critical 35% threshold", sentiment: -0.7, impact: 8, category: "energy", country: "Netherlands" },
    { headline: "NATO expands Eastern European military deployments", sentiment: -0.4, impact: 6, category: "military", country: "Poland" },
    { headline: "Italy political crisis triggers bond spread widening", sentiment: -0.6, impact: 7, category: "political", country: "Italy" },
    { headline: "Eurozone PMI contracts for sixth consecutive month", sentiment: -0.5, impact: 6, category: "economic", country: "Germany" },
    { headline: "Spain renewable energy capacity surpasses coal for first time", sentiment: 0.5, impact: 4, category: "energy", country: "Spain" },
    { headline: "Ukraine receives new EU military aid package worth €5B", sentiment: -0.3, impact: 5, category: "military", country: "Ukraine" },
    { headline: "Poland deploys additional troops to Belarus border", sentiment: -0.5, impact: 5, category: "military", country: "Poland" },
  ],
  "North America": [
    { headline: "Federal Reserve signals pause in rate hike cycle", sentiment: 0.6, impact: 8, category: "monetary", country: "United States" },
    { headline: "US-China trade negotiations collapse over tech transfer", sentiment: -0.7, impact: 9, category: "trade", country: "United States" },
    { headline: "Debt ceiling standoff enters final week before X-date", sentiment: -0.8, impact: 9, category: "fiscal", country: "United States" },
    { headline: "Mexico nearshoring boom drives $40B cross-border FDI", sentiment: 0.5, impact: 5, category: "investment", country: "Mexico" },
    { headline: "Canada announces critical minerals export controls", sentiment: 0.3, impact: 4, category: "trade", country: "Canada" },
    { headline: "US election polling shows dead heat, VIX spikes to 28", sentiment: -0.4, impact: 7, category: "political", country: "United States" },
    { headline: "Silicon Valley AI investments hit $120B annually", sentiment: 0.6, impact: 6, category: "tech", country: "United States" },
    { headline: "US CPI surprises to the upside at 3.8% YoY", sentiment: -0.5, impact: 8, category: "economic", country: "United States" },
    { headline: "USMCA trade review triggers auto sector uncertainty", sentiment: -0.4, impact: 5, category: "trade", country: "Mexico" },
    { headline: "US Treasury 10Y yield breaks 5% barrier", sentiment: -0.6, impact: 8, category: "monetary", country: "United States" },
    { headline: "Canada housing crisis sparks emergency immigration review", sentiment: -0.4, impact: 5, category: "policy", country: "Canada" },
    { headline: "Mexican peso strengthens on carry trade attractiveness", sentiment: 0.3, impact: 4, category: "monetary", country: "Mexico" },
  ],
  Africa: [
    { headline: "Niger coup disrupts uranium supply chain to Europe", sentiment: -0.7, impact: 7, category: "political", country: "Niger" },
    { headline: "South Africa mining strikes halt platinum production", sentiment: -0.6, impact: 6, category: "labor", country: "South Africa" },
    { headline: "Kenya digital infrastructure deal attracts $2B investment", sentiment: 0.5, impact: 4, category: "tech", country: "Kenya" },
    { headline: "Ethiopia-Eritrea border tensions flare up again", sentiment: -0.5, impact: 5, category: "conflict", country: "Ethiopia" },
    { headline: "Nigeria oil theft reaches record levels, output falls 30%", sentiment: -0.6, impact: 7, category: "energy", country: "Nigeria" },
    { headline: "DRC cobalt mining regulations tighten global supply", sentiment: -0.4, impact: 6, category: "mining", country: "DRC" },
    { headline: "Egypt secures $8B IMF expansion amid Suez revenue drop", sentiment: 0.3, impact: 5, category: "financial", country: "Egypt" },
    { headline: "South Africa load shedding enters Stage 6 emergency", sentiment: -0.7, impact: 6, category: "energy", country: "South Africa" },
    { headline: "Sudan conflict displaces 2M, disrupts Nile commerce", sentiment: -0.8, impact: 5, category: "conflict", country: "Sudan" },
    { headline: "Ghana debt restructuring deal reached with bondholders", sentiment: 0.4, impact: 4, category: "financial", country: "South Africa" },
  ],
  "South America": [
    { headline: "Brazil central bank cuts rates 50bp as inflation eases", sentiment: 0.6, impact: 7, category: "monetary", country: "Brazil" },
    { headline: "Argentina currency crisis deepens, peso falls another 15%", sentiment: -0.8, impact: 7, category: "financial", country: "Argentina" },
    { headline: "Chile lithium nationalization plan spooks mining investors", sentiment: -0.7, impact: 8, category: "policy", country: "Chile" },
    { headline: "Mercosur-EU trade deal finally ratified after 25 years", sentiment: 0.6, impact: 6, category: "trade", country: "Brazil" },
    { headline: "Peru political instability triggers capital flight wave", sentiment: -0.6, impact: 6, category: "political", country: "Peru" },
    { headline: "Brazilian soy exports to China hit quarterly record", sentiment: 0.5, impact: 5, category: "trade", country: "Brazil" },
    { headline: "Venezuela oil sanctions partially lifted by US Treasury", sentiment: 0.3, impact: 5, category: "sanctions", country: "Venezuela" },
    { headline: "Copper prices surge on Chilean mine strike escalation", sentiment: -0.5, impact: 7, category: "mining", country: "Chile" },
    { headline: "Colombia signs historic peace deal expansion with ELN", sentiment: 0.4, impact: 4, category: "political", country: "Colombia" },
    { headline: "Argentina Milei reforms trigger massive peso revaluation", sentiment: 0.4, impact: 7, category: "policy", country: "Argentina" },
  ],
  "South Asia": [
    { headline: "India GDP growth accelerates to 7.8% in Q3", sentiment: 0.7, impact: 7, category: "economic", country: "India" },
    { headline: "Pakistan-IMF bailout talks reach critical impasse", sentiment: -0.7, impact: 6, category: "financial", country: "Pakistan" },
    { headline: "Bangladesh garment worker protests disrupt $45B exports", sentiment: -0.6, impact: 6, category: "labor", country: "Bangladesh" },
    { headline: "India announces $10B semiconductor incentive expansion", sentiment: 0.6, impact: 6, category: "tech", country: "India" },
    { headline: "Sri Lanka debt restructuring unlocks fresh IMF tranche", sentiment: 0.5, impact: 4, category: "financial", country: "Sri Lanka" },
    { headline: "Kashmir tensions resurface after cross-border incident", sentiment: -0.7, impact: 7, category: "conflict", country: "Pakistan" },
    { headline: "Indian rupee hits record low against strengthening dollar", sentiment: -0.4, impact: 5, category: "monetary", country: "India" },
    { headline: "Adani Group announces $20B green energy pivot", sentiment: 0.4, impact: 5, category: "energy", country: "India" },
    { headline: "Pakistan elects new PM amid constitutional crisis", sentiment: -0.5, impact: 6, category: "political", country: "Pakistan" },
    { headline: "India UPI payments cross 12 billion monthly transactions", sentiment: 0.6, impact: 4, category: "tech", country: "India" },
  ],
};


/* ═══ GENERATORS ═══ */

function genMarketData(base, hours = 24) {
  const data = []; let p = base; const vol = 0.007; const now = Date.now();
  for (let i = hours * 4; i >= 0; i--) {
    const ts = now - i * 9e5;
    const r = ((Math.sin(base + i * 0.7) + 1) / 2) * 0.6 + Math.random() * 0.4;
    const shock = r > 0.97 ? (Math.random() - 0.5) * 4 : 0;
    const chg = (r - 0.48) * vol * p + shock * vol * p;
    const open = p;
    p += chg;
    const close = p;
    const high = Math.max(open, close) + Math.abs(chg) * (0.3 + Math.random() * 0.7);
    const low = Math.min(open, close) - Math.abs(chg) * (0.3 + Math.random() * 0.7);
    data.push({ time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ts, price: +(close.toFixed(2)), open: +(open.toFixed(2)), high: +(high.toFixed(2)), low: +(low.toFixed(2)), close: +(close.toFixed(2)), vol: +(Math.abs(chg / p * 1e4).toFixed(2)), chg: +(chg.toFixed(2)) });
  }
  return data;
}

function genHistorical(base, days = 90) {
  let p = base * 0.95;
  return Array.from({ length: days + 1 }, (_, i) => {
    const open = p;
    p += (Math.random() - 0.47) * 0.012 * p;
    const close = p;
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    return { date: new Date(Date.now() - (days - i) * 864e5).toLocaleDateString([], { month: "short", day: "numeric" }), price: +(close.toFixed(2)), open: +(open.toFixed(2)), high: +(high.toFixed(2)), low: +(low.toFixed(2)), close: +(close.toFixed(2)) };
  });
}

function genNews(region) {
  const t = NEWS_DB[region] || []; const now = Date.now();
  return t.map((n, i) => ({ ...n, id: `${region}-${i}`, ts: now - Math.random() * 864e5, source: ["Reuters", "Bloomberg", "FT", "AP", "BBC", "WSJ", "Al Jazeera", "SCMP", "Nikkei"][i % 9], region })).sort((a, b) => b.ts - a.ts);
}

function riskScore(news) {
  if (!news.length) return 0;
  const neg = news.filter(n => n.sentiment < -0.3).length;
  const ai = news.reduce((s, n) => s + n.impact, 0) / news.length;
  const sa = Math.abs(news.reduce((s, n) => s + n.sentiment, 0) / news.length);
  return Math.min(10, +((neg / news.length * 4 + ai / 10 * 3 + sa * 3).toFixed(1)));
}

function calcRSI(data, period = 14) {
  const rsi = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) { rsi.push({ ...data[i], rsi: 50 }); continue; }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j].open;
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period || 0.001;
    const rs = avgGain / avgLoss;
    rsi.push({ ...data[i], rsi: +(100 - 100 / (1 + rs)).toFixed(1) });
  }
  return rsi;
}

function calcMACD(data) {
  const ema = (arr, p) => {
    const k = 2 / (p + 1); let e = arr[0];
    return arr.map((v, i) => { e = i === 0 ? v : v * k + e * (1 - k); return +e.toFixed(4); });
  };
  const closes = data.map(d => d.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signal = ema(macdLine, 9);
  return data.map((d, i) => ({ ...d, macd: +(macdLine[i].toFixed(2)), signal: +(signal[i].toFixed(2)), histogram: +((macdLine[i] - signal[i]).toFixed(2)) }));
}

function genOrderBook(price) {
  const bids = []; const asks = [];
  for (let i = 1; i <= 8; i++) {
    const spread = price * 0.0002 * i + Math.random() * price * 0.0001;
    bids.push({ price: +(price - spread).toFixed(2), size: +(100 + Math.random() * 900).toFixed(0), total: 0 });
    asks.push({ price: +(price + spread).toFixed(2), size: +(100 + Math.random() * 900).toFixed(0), total: 0 });
  }
  let bTotal = 0, aTotal = 0;
  bids.forEach(b => { bTotal += +b.size; b.total = bTotal; });
  asks.forEach(a => { aTotal += +a.size; a.total = aTotal; });
  return { bids, asks, maxTotal: Math.max(bTotal, aTotal) };
}

/* ═══ THEME ═══ */

const themes = {
  dark: { bg: "#0f1118", sf: "#161821", sf2: "#1c1e2b", bd: "rgba(255,255,255,0.07)", t1: "#e8e6e3", t2: "#9d9b97", t3: "#6b6966", t4: "#45433f", accent: "#c9a55a", red: "#d4605a", green: "#5a9e6f", yellow: "#c4993c", purple: "#8b7ec8", chartBg: "#12141d" },
  light: { bg: "#f4f1ec", sf: "#ffffff", sf2: "#f9f7f3", bd: "rgba(0,0,0,0.08)", t1: "#1a1816", t2: "#4a4744", t3: "#7a7774", t4: "#aaa7a3", accent: "#9a7b2e", red: "#c4403a", green: "#3a7e4f", yellow: "#a47e2c", purple: "#6b5eb0", chartBg: "#fafaf8" },
};

const FONT = "'Libre Franklin', 'Georgia', serif";
const MONO = "'IBM Plex Mono', 'Menlo', monospace";

/* ═══ COMPONENTS ═══ */

function CommodityStrip({ region, T }) {
  return (
    <div style={{ display: "flex", gap: 3, overflow: "auto" }}>
      {REGIONS[region].commodities.map(c => {
        const chg = ((Math.sin(c.base * 0.1) + 1) / 2 * 4 - 1.5).toFixed(2);
        const up = parseFloat(chg) >= 0;
        return (
          <div key={c.name} style={{ flex: 1, minWidth: 105, padding: "6px 10px", background: T.sf, borderRadius: 5, border: `1px solid ${T.bd}` }}>
            <div style={{ fontSize: 9, color: T.t4, fontWeight: 600, letterSpacing: 0.5 }}>{c.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, fontFamily: MONO }}>{c.base.toLocaleString()}</span>
              {c.unit && <span style={{ fontSize: 9, color: T.t4 }}>{c.unit}</span>}
              <span style={{ fontSize: 10, fontWeight: 600, color: up ? T.green : T.red, fontFamily: MONO, marginLeft: "auto" }}>{up ? "+" : ""}{chg}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarketsStrip({ region, activeMarket, onSelect, T }) {
  return (
    <div style={{ display: "flex", gap: 3, overflow: "auto" }}>
      {REGIONS[region].markets.map(m => {
        const chg = ((Math.sin(m.base * 0.01) + 1) / 2 * 3 - 1).toFixed(2);
        const up = parseFloat(chg) >= 0;
        const isA = activeMarket === m.ticker;
        return (
          <div key={m.ticker} onClick={() => onSelect(m.ticker)} style={{ flex: "0 0 auto", minWidth: 115, padding: "6px 10px", background: isA ? `${REGIONS[region].color}10` : T.sf, border: `1.5px solid ${isA ? REGIONS[region].color + "50" : T.bd}`, borderRadius: 5, cursor: "pointer", transition: "all .15s" }}>
            <div style={{ fontSize: 9, color: T.t4, fontWeight: 600 }}>{m.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isA ? T.t1 : T.t2, fontFamily: MONO }}>{m.base.toLocaleString()}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: up ? T.green : T.red, fontFamily: MONO }}>{up ? "+" : ""}{chg}%</span>
            </div>
            <div style={{ fontSize: 9, color: T.t4 }}>{m.country}</div>
          </div>
        );
      })}
    </div>
  );
}

function RiskGauge({ score, T, size = "md" }) {
  const pct = score / 10; const hue = 120 - pct * 120; const c = `hsl(${hue},55%,48%)`;
  const lbl = score <= 3 ? "LOW" : score <= 6 ? "MODERATE" : score <= 8 ? "HIGH" : "CRITICAL";
  const w = size === "sm" ? 72 : 110; const h = size === "sm" ? 40 : 56;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: w, height: h, margin: "0 auto" }}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          <path d={`M ${w*.1} ${h*.9} A ${w*.4} ${w*.4} 0 0 1 ${w*.9} ${h*.9}`} fill="none" stroke={T.bd} strokeWidth={size==="sm"?4:6} strokeLinecap="round" />
          <path d={`M ${w*.1} ${h*.9} A ${w*.4} ${w*.4} 0 0 1 ${w*.9} ${h*.9}`} fill="none" stroke={c} strokeWidth={size==="sm"?4:6} strokeLinecap="round" strokeDasharray={`${pct*w*1.26} ${w*1.26}`} style={{transition:"all 0.8s"}} />
        </svg>
        <div style={{position:"absolute",bottom:0,width:"100%",textAlign:"center"}}><span style={{fontSize:size==="sm"?15:20,fontWeight:700,color:c,fontFamily:MONO}}>{score.toFixed(1)}</span></div>
      </div>
      <div style={{marginTop:2,fontSize:8,fontWeight:700,letterSpacing:1.5,color:c}}>{lbl}</div>
    </div>
  );
}

/* Candlestick renderer for Recharts */
function CandlestickBar(props) {
  const { x, y, width, height, payload, T } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? T.green : T.red;
  const yScale = props.yScale || ((v) => y);
  // Use the y axis scale from recharts
  const yH = props.yAxisMap?.[0];
  if (!yH) {
    // Fallback: simple rendering
    const barW = Math.max(width * 0.6, 3);
    return (
      <g>
        <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={color} strokeWidth={1} />
        <rect x={x + (width - barW) / 2} y={y + height * 0.2} width={barW} height={height * 0.6} fill={isUp ? color : color} stroke={color} strokeWidth={0.5} rx={1} />
      </g>
    );
  }
  return null;
}

function OrderBookWidget({ price, T }) {
  const book = useMemo(() => genOrderBook(price), [price]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, fontSize: 10, fontFamily: MONO }}>
      {/* Bids */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 8px", color: T.t4, fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>
          <span>SIZE</span><span>BID</span>
        </div>
        {book.bids.map((b, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px", position: "relative" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(b.total / book.maxTotal) * 100}%`, background: `${T.green}12` }} />
            <span style={{ color: T.t2, zIndex: 1 }}>{b.size}</span>
            <span style={{ color: T.green, fontWeight: 600, zIndex: 1 }}>{b.price.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {/* Asks */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 8px", color: T.t4, fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>
          <span>ASK</span><span>SIZE</span>
        </div>
        {book.asks.map((a, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(a.total / book.maxTotal) * 100}%`, background: `${T.red}12` }} />
            <span style={{ color: T.red, fontWeight: 600, zIndex: 1 }}>{a.price.toLocaleString()}</span>
            <span style={{ color: T.t2, zIndex: 1 }}>{a.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiChartView({ region, T }) {
  const cfg = REGIONS[region];
  const charts = useMemo(() => cfg.markets.slice(0, 4).map(m => ({
    ...m, data: genMarketData(m.base, 12),
  })), [cfg.markets]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {charts.map(m => {
        const last = m.data[m.data.length - 1];
        const first = m.data[0];
        const chg = last.price - first.price;
        const pct = (chg / first.price * 100);
        const up = chg >= 0;
        return (
          <div key={m.ticker} style={{ background: T.sf, borderRadius: 6, border: `1px solid ${T.bd}`, padding: "8px 10px", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.t1 }}>{m.name}</span>
                <span style={{ fontSize: 9, color: T.t4, marginLeft: 4 }}>{m.country}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: up ? T.green : T.red, fontFamily: MONO }}>{up ? "+" : ""}{pct.toFixed(2)}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO, color: T.t1 }}>{last.price.toLocaleString()}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, color: up ? T.green : T.red }}>{up ? "+" : ""}{chg.toFixed(2)}</span>
            </div>
            <div style={{ height: 55 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m.data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs><linearGradient id={`mc${m.ticker}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={up ? T.green : T.red} stopOpacity={.15} /><stop offset="100%" stopColor={up ? T.green : T.red} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="price" stroke={up ? T.green : T.red} strokeWidth={1.5} fill={`url(#mc${m.ticker})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CountryHeatmap({ region, news, selectedCountry, onSelectCountry, T }) {
  const cfg = REGIONS[region];
  const cd = useMemo(() => cfg.countries.map(c => {
    const cn = news.filter(n => n.country === c.name);
    return { name: c.name, count: cn.length, neg: cn.filter(n => n.sentiment < -0.3).length, pos: cn.filter(n => n.sentiment > 0.3).length, avgImp: cn.length ? cn.reduce((s, n) => s + n.impact, 0) / cn.length : 0, avgSent: cn.length ? cn.reduce((s, n) => s + n.sentiment, 0) / cn.length : 0 };
  }).sort((a, b) => b.count - a.count), [cfg.countries, news]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 5 }}>
      {cd.map(c => {
        const isA = selectedCountry === c.name;
        const col = c.avgSent < -0.2 ? T.red : c.avgSent > 0.2 ? T.green : T.yellow;
        return (
          <div key={c.name} onClick={() => onSelectCountry(isA ? null : c.name)} style={{ padding: "8px 10px", borderRadius: 5, cursor: "pointer", background: isA ? `${col}10` : T.sf, border: `1.5px solid ${isA ? col : T.bd}`, transition: "all .15s", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: `${Math.min(1, c.count / 4) * 100}%`, height: 2, background: col, opacity: .5 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.t1 }}>{c.name}</span>
              {c.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: MONO }}>{c.count}</span>}
            </div>
            {c.count > 0 ? (
              <div style={{ display: "flex", gap: 6, fontSize: 9, fontFamily: MONO }}>
                {c.neg > 0 && <span style={{ color: T.red }}>▼{c.neg}</span>}
                {c.pos > 0 && <span style={{ color: T.green }}>▲{c.pos}</span>}
                <span style={{ color: T.t4, marginLeft: "auto" }}>{c.avgImp.toFixed(1)}</span>
              </div>
            ) : <span style={{ fontSize: 9, color: T.t4 }}>—</span>}
          </div>
        );
      })}
    </div>
  );
}

function NewsCard({ item, isActive, onClick, T }) {
  const bc = item.sentiment < -0.3 ? T.red : item.sentiment > 0.3 ? T.green : T.yellow;
  return (
    <div onClick={onClick} style={{ padding: "7px 12px", cursor: "pointer", background: isActive ? `${bc}08` : "transparent", borderLeft: `3px solid ${isActive ? bc : "transparent"}`, transition: "all .12s", borderBottom: `1px solid ${T.bd}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 5, marginBottom: 1 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 8, color: T.t4, fontWeight: 600 }}>{item.source}</span>
          {item.category && <span style={{ fontSize: 7, color: T.t3, background: `${T.t4}12`, padding: "1px 4px", borderRadius: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8 }}>{item.category}</span>}
          {item.country && <span style={{ fontSize: 8, color: T.t4 }}>· {item.country}</span>}
        </div>
        <span style={{ fontSize: 8, color: T.t4, fontFamily: MONO }}>{new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <p style={{ fontSize: 11, lineHeight: 1.4, color: isActive ? T.t1 : T.t2, margin: "2px 0 4px", fontWeight: 500, fontFamily: FONT }}>{item.headline}</p>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: bc }}>{item.sentiment > .2 ? "POS" : item.sentiment < -.2 ? "NEG" : "NEU"}</span>
        <span style={{ fontSize: 8, color: T.t4, fontFamily: MONO }}>Impact {item.impact}/10</span>
      </div>
    </div>
  );
}

function ImpactPanel({ item, region, T }) {
  if (!item) return <div style={{ padding: 16, textAlign: "center", color: T.t4, fontSize: 11 }}>Select a headline for analysis</div>;
  const lines = { "Middle East": ["Oil supply risk drives futures higher.", "Shipping/logistics reprices. Defense accelerates.", "Gold/USD safe-haven flow."], "East Asia": ["Chip supply disruption lifts prices.", "Manufacturing contracts. Nearshoring gains.", "JPY/Treasuries strengthen."], Europe: ["Energy squeezes industrials.", "ECB stagflation dilemma. Spreads widen.", "Defense spending up. Banks reassess."], "North America": ["VIX spikes. Defensives outperform.", "USD direction event-dependent.", "Fed may front-load cuts."], Africa: ["Commodity constraints hit EU.", "Sovereign spreads widen.", "PGMs attract spec flows."], "South America": ["FX volatility hits revenues.", "Capital flight risk.", "Lithium/copper uncertainty."], "South Asia": ["IT resilience. Infra drives materials.", "CB intervenes on currency.", "Trade disrupted."] }[region] || ["—","—","—"];
  return (
    <div style={{ padding: "10px 14px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.purple, marginBottom: 6 }}>IMPACT ANALYSIS</div>
      <div style={{ fontSize: 11, color: T.t1, padding: "6px 10px", background: `${T.purple}08`, borderRadius: 4, border: `1px solid ${T.purple}18`, marginBottom: 8, lineHeight: 1.4, fontFamily: FONT }}>
        <strong>{item.headline}</strong>{item.country && <span style={{ color: T.t3 }}> — {item.country}</span>}
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: T.purple, fontWeight: 700, fontFamily: MONO, minWidth: 40 }}>{["MARKET","SECTOR","MACRO"][i]}</span>
          <span style={{ fontSize: 10, color: T.t3, fontFamily: FONT }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function Globe({ regions, activeRegion, onSelect, onHover, scores, allNews, flyRef }) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const hovRef = useRef(null); // track current hover to avoid redundant flyTo

  const aliases = useMemo(() => ({
    "united arab emirates": "UAE", "united kingdom": "UK",
    "united states of america": "United States", "dem. rep. congo": "DRC",
    "democratic republic of the congo": "DRC", "congo, the democratic republic of the": "DRC",
    "korea, republic of": "South Korea", "korea, democratic people's republic of": "North Korea",
  }), []);

  const countryToRegion = useMemo(() => {
    const map = {};
    Object.entries(regions).forEach(([rn, rd]) => {
      rd.countries.forEach(c => {
        map[c.name.toLowerCase()] = rn;
        Object.entries(aliases).forEach(([full, short]) => {
          if (short === c.name) map[full] = rn;
        });
      });
    });
    return map;
  }, [regions, aliases]);

  // Responsive sizing — fill entire container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setDims({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then(r => r.json()).then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    if (globeRef.current && countries.features.length) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.3;
      globeRef.current.controls().enableDamping = true;
      globeRef.current.controls().dampingFactor = 0.15;
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });
    }
  }, [countries.features.length]);

  // Fly to region — slow, smooth animation to avoid overshooting
  const flyToRegion = useCallback((regionName) => {
    if (!globeRef.current) return;
    if (regionName && regions[regionName]) {
      hovRef.current = regionName;
      globeRef.current.controls().autoRotate = false;
      const { lat, lng } = regions[regionName];
      globeRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 1400);
    } else {
      hovRef.current = null;
      globeRef.current.controls().autoRotate = true;
      globeRef.current.pointOfView({ altitude: 2.2 }, 1200);
    }
  }, [regions]);

  // Expose flyToRegion to parent via ref
  useEffect(() => {
    if (flyRef) flyRef.current = flyToRegion;
  }, [flyRef, flyToRegion]);

  const getRegion = useCallback((feat) => {
    const name = (feat.properties?.NAME || feat.properties?.ADMIN || "").toLowerCase();
    if (countryToRegion[name]) return countryToRegion[name];
    for (const [k, v] of Object.entries(countryToRegion)) {
      if (name.length > 3 && k.length > 3 && (name.includes(k) || k.includes(name))) return v;
    }
    return null;
  }, [countryToRegion]);

  // Region markers with scores + top headline for on-globe labels
  const regionMarkers = useMemo(() => {
    return Object.entries(regions).map(([name, data]) => {
      const score = scores?.[name] || 0;
      const topNews = (allNews || []).filter(n => n.region === name).slice(0, 1)[0];
      return { lat: data.lat, lng: data.lng, name, color: data.color, score, topNews };
    });
  }, [regions, scores, allNews]);

  const makeEl = useCallback((d) => {
    const el = document.createElement("div");
    el.style.cssText = "pointer-events:auto;cursor:pointer;text-align:center;transform:translate(-50%,-100%)";
    const scoreLbl = d.score <= 3 ? "LOW" : d.score <= 6 ? "MOD" : d.score <= 8 ? "HIGH" : "CRIT";
    const scoreHue = 120 - (d.score / 10) * 120;
    const scoreCol = `hsl(${scoreHue},55%,48%)`;
    const hl = d.topNews ? d.topNews.headline : "";
    const hlTrunc = hl.length > 50 ? hl.slice(0, 47) + "..." : hl;
    const sentCol = d.topNews ? (d.topNews.sentiment < -0.3 ? "#d4605a" : d.topNews.sentiment > 0.3 ? "#5a9e6f" : "#c4993c") : "#666";
    el.innerHTML = `<div style="background:rgba(15,17,24,0.85);border:1px solid ${d.color}50;border-radius:6px;padding:4px 8px;min-width:100px;max-width:180px;backdrop-filter:blur(6px)">
      <div style="font-size:10px;font-weight:800;color:${d.color};letter-spacing:0.5px">${d.name}</div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
        <span style="font-size:14px;font-weight:800;color:${scoreCol};font-family:monospace">${d.score.toFixed(1)}</span>
        <span style="font-size:7px;font-weight:700;color:${scoreCol};letter-spacing:1px">${scoreLbl}</span>
      </div>
      ${hlTrunc ? `<div style="font-size:8px;color:#9d9b97;margin-top:3px;line-height:1.3;border-top:1px solid rgba(255,255,255,0.06);padding-top:3px"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${sentCol};margin-right:3px;vertical-align:middle"></span>${hlTrunc}</div>` : ""}
    </div>`;
    el.onclick = () => onSelect(d.name);
    el.onmouseenter = () => {
      if (hovRef.current !== d.name) {
        if (onHover) onHover(d.name);
        flyToRegion(d.name);
      }
    };
    el.onmouseleave = () => {
      if (onHover) onHover(null);
      flyToRegion(null);
    };
    return el;
  }, [onSelect, onHover, flyToRegion]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <GlobeGL
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="#0f1118"
        atmosphereColor="#c9a55a"
        atmosphereAltitude={0.15}
        polygonsData={countries.features}
        polygonCapColor={feat => {
          const r = getRegion(feat);
          if (!r) return "rgba(80,80,100,0.12)";
          return r === activeRegion ? regions[r].color + "cc" : regions[r].color + "55";
        }}
        polygonSideColor={() => "rgba(0,0,0,0.08)"}
        polygonStrokeColor={() => "rgba(255,255,255,0.06)"}
        polygonAltitude={feat => { const r = getRegion(feat); return r === activeRegion ? 0.02 : 0.005; }}
        polygonLabel={feat => {
          const r = getRegion(feat);
          const name = feat.properties?.NAME || "";
          return `<div style="background:rgba(15,17,24,0.9);border:1px solid rgba(255,255,255,0.1);padding:4px 8px;border-radius:4px;font-size:11px;color:#e8e6e3;font-family:sans-serif"><b>${name}</b>${r ? `<br/><span style="color:${regions[r]?.color}">${r}</span>` : ""}</div>`;
        }}
        onPolygonClick={feat => {
          const r = getRegion(feat);
          if (r) onSelect(r);
        }}
        onPolygonHover={feat => {
          const r = feat ? getRegion(feat) : null;
          if (r && onHover) onHover(r);
        }}
        polygonsTransitionDuration={300}
        htmlElementsData={regionMarkers}
        htmlLat={d => d.lat}
        htmlLng={d => d.lng}
        htmlAltitude={0.06}
        htmlElement={makeEl}
      />
    </div>
  );
}

/* ═══ MAIN APP ═══ */

export default function App() {
  const [region, setRegion] = useState("Middle East");
  const [view, setView] = useState("globe");
  const [mktData, setMktData] = useState([]);
  const [histData, setHistData] = useState([]);
  const [news, setNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [selNews, setSelNews] = useState(null);
  const [scores, setScores] = useState({});
  const [timeRange, setTimeRange] = useState("24h");
  const [search, setSearch] = useState("");
  const [watchlist, setWatchlist] = useState(["Middle East", "East Asia", "North America"]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const [nFilter, setNFilter] = useState("all");
  const [showNewsOnChart, setShowNewsOnChart] = useState(true);
  const [activeMarket, setActiveMarket] = useState(null);
  const [selCountry, setSelCountry] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [chartType, setChartType] = useState("candle");
  const [showIndicators, setShowIndicators] = useState(true);
  const [dashTab, setDashTab] = useState("chart"); // chart | multi | book
  const [hovRegion, setHovRegion] = useState(null);
  const globeFlyRef = useRef(null); // holds Globe's flyToRegion fn

  const T = themes[theme];

  const loadData = useCallback(() => {
    setLoading(true); setSelNews(null); setSelCountry(null);
    setTimeout(() => {
      const cfg = REGIONS[region]; const am = activeMarket ? cfg.markets.find(m => m.ticker === activeMarket) : cfg.markets[0];
      setMktData(genMarketData(am?.base || cfg.markets[0].base));
      setHistData(genHistorical(am?.base || cfg.markets[0].base));
      setNews(genNews(region));
      const sc = {}; const an = [];
      Object.keys(REGIONS).forEach(r => { const n = genNews(r); sc[r] = riskScore(n); an.push(...n); });
      setScores(sc); setAllNews(an.sort((a, b) => b.ts - a.ts)); setLoading(false);
    }, 200);
  }, [region, activeMarket]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (!activeMarket && REGIONS[region]) setActiveMarket(REGIONS[region].markets[0].ticker); }, [region]);
  useEffect(() => { const iv = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000); return () => clearInterval(iv); }, []);

  const cfg = REGIONS[region];
  const am = cfg.markets.find(m => m.ticker === activeMarket) || cfg.markets[0];
  const risk = scores[region] || 0;
  const latest = mktData[mktData.length - 1]?.price || 0;
  const open = mktData[0]?.price || 0;
  const dayChg = latest - open; const dayPct = open ? (dayChg / open) * 100 : 0; const isUp = dayChg >= 0;
  const isW = watchlist.includes(region);

  const filteredNews = useMemo(() => {
    let items = selCountry ? news.filter(n => n.country === selCountry) : news;
    if (nFilter !== "all") items = items.filter(n => n.category === nFilter);
    if (search && view === "dashboard") { const q = search.toLowerCase(); items = items.filter(n => n.headline.toLowerCase().includes(q) || (n.country || "").toLowerCase().includes(q)); }
    return items;
  }, [news, nFilter, search, view, selCountry]);

  const cats = useMemo(() => ["all", ...new Set(news.map(n => n.category).filter(Boolean))], [news]);
  const rawChartData = timeRange === "24h" ? mktData : timeRange === "7d" ? histData.slice(-8) : timeRange === "30d" ? histData.slice(-31) : histData;
  const chartKey = timeRange === "24h" ? "time" : "date";

  const newsOnChart = useMemo(() => {
    if (!showNewsOnChart || !mktData.length) return [];
    return news.filter(n => n.impact >= 5).map(n => {
      let closest = mktData[0], minDiff = Infinity;
      mktData.forEach(d => { const diff = Math.abs(d.ts - n.ts); if (diff < minDiff) { minDiff = diff; closest = d; } });
      if (minDiff > 864e5) return null;
      return { ...n, chartTime: closest.time, chartPrice: closest.price };
    }).filter(Boolean);
  }, [showNewsOnChart, mktData, news]);

  const chartData = useMemo(() => {
    const base = rawChartData;
    // Add RSI + MACD
    const withRSI = calcRSI(base);
    const withMACD = calcMACD(withRSI);
    // Merge news markers
    if (!showNewsOnChart || !newsOnChart.length) return withMACD;
    const nm = {}; newsOnChart.forEach(n => { nm[n.chartTime] = n; });
    return withMACD.map(d => {
      const ev = nm[d.time || d.date];
      return ev ? { ...d, newsMarker: d.price, newsSent: ev.sentiment, newsImp: ev.impact, newsHL: ev.headline, newsCountry: ev.country } : d;
    });
  }, [rawChartData, showNewsOnChart, newsOnChart]);

  const globalSearch = useMemo(() => {
    if (!search || view !== "globe") return [];
    const q = search.toLowerCase();
    return allNews.filter(n => n.headline.toLowerCase().includes(q) || n.region.toLowerCase().includes(q)).slice(0, 15);
  }, [search, allNews, view]);

  const btn = (active, color) => ({ background: active ? `${color || T.t1}10` : "transparent", border: `1.5px solid ${active ? (color || T.t1) + "35" : T.bd}`, color: active ? (color || T.t1) : T.t3, padding: "4px 11px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FONT, transition: "all .12s" });
  const smBtn = (active) => ({ background: active ? `${T.t1}10` : "transparent", border: `1px solid ${active ? T.bd : "transparent"}`, color: active ? T.t1 : T.t4, padding: "2px 8px", borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 600, fontFamily: MONO });

  return (
    <div style={{ fontFamily: FONT, background: T.bg, color: T.t1, minHeight: "100vh", transition: "background .3s" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.t4}40;border-radius:4px}@keyframes fu{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu .2s ease both}input::placeholder{color:${T.t4}}`}</style>

      {/* HEADER */}
      <header style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.bd}`, background: T.sf }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -.5 }}>GeoMarket</span>
          <span style={{ fontSize: 15, fontWeight: 400, color: T.accent }}>Pulse</span>
          <span style={{ fontSize: 9, color: T.t4, fontFamily: MONO, marginLeft: 4 }}>{clock}</span>
        </div>
        <div style={{ position: "relative", flex: "0 1 220px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", padding: "5px 10px 5px 22px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 4, color: T.t1, fontSize: 11, fontFamily: FONT, outline: "none" }} />
          <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: T.t4 }}>⌕</span>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {["globe","dashboard","watchlist","learn"].map(v => <button key={v} onClick={() => setView(v)} style={btn(view === v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
        </div>
      </header>

      {/* GLOBE */}
      {view === "globe" && (
        <div className="fu" style={{ position: "relative", height: "calc(100vh - 48px)", overflow: "hidden", display: "flex" }}>
          {/* Globe area */}
          <div style={{ flex: 1, position: "relative" }}>
            <Globe regions={REGIONS} activeRegion={region} onSelect={r => { setRegion(r); setActiveMarket(REGIONS[r].markets[0].ticker); setView("dashboard"); }} onHover={r => { setHovRegion(r || region); if (globeFlyRef.current) globeFlyRef.current(r || region); }} scores={scores} allNews={allNews} flyRef={globeFlyRef} />
            {/* Floating dropdown for region selection */}
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
              <select value={hovRegion || region} onChange={e => { const r = e.target.value; setHovRegion(r); if (globeFlyRef.current) globeFlyRef.current(r); }} style={{ padding: "6px 28px 6px 10px", background: "rgba(15,17,24,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: REGIONS[hovRegion || region]?.color || "#e8e6e3", fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b6966'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                {Object.keys(REGIONS).map(r => <option key={r} value={r} style={{ background: "#0f1118", color: REGIONS[r].color }}>{r}</option>)}
              </select>
              <button onClick={() => { setRegion(hovRegion || region); setActiveMarket(REGIONS[hovRegion || region].markets[0].ticker); setView("dashboard"); }} style={{ marginLeft: 6, padding: "6px 12px", background: (REGIONS[hovRegion || region]?.color || "#E8963E") + "22", border: `1px solid ${(REGIONS[hovRegion || region]?.color || "#E8963E")}44`, borderRadius: 6, color: REGIONS[hovRegion || region]?.color || "#E8963E", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Open Dashboard →</button>
            </div>
          </div>
          {/* Always-visible news sidebar */}
          <div style={{ width: 320, height: "100%", background: "rgba(15,17,24,0.95)", backdropFilter: "blur(12px)", borderLeft: `1px solid ${REGIONS[hovRegion || region]?.color || "#E8963E"}30`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {(() => {
              const sr = hovRegion || region;
              const hc = REGIONS[sr];
              if (!hc) return null;
              const hn = allNews.filter(n => n.region === sr);
              const hr = scores[sr] || 0;
              const neg = hn.filter(n => n.sentiment < -0.2).length;
              const pos = hn.filter(n => n.sentiment > 0.2).length;
              const neu = hn.length - neg - pos;
              return <>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: hc.color }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: hc.color }}>{sr}</span>
                    <span style={{ marginLeft: "auto", fontSize: 16, fontWeight: 800, fontFamily: MONO, color: hr > 6 ? "#d4605a" : hr > 3 ? "#c4993c" : "#5a9e6f" }}>{hr.toFixed(1)}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: hr > 6 ? "#d4605a" : hr > 3 ? "#c4993c" : "#5a9e6f" }}>{hr <= 3 ? "LOW" : hr <= 6 ? "MOD" : hr <= 8 ? "HIGH" : "CRIT"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 9, fontFamily: MONO }}>
                    <span style={{ color: "#d4605a" }}>NEG {neg}</span>
                    <span style={{ color: "#c4993c" }}>NEU {neu}</span>
                    <span style={{ color: "#5a9e6f" }}>POS {pos}</span>
                  </div>
                  <div style={{ display: "flex", gap: 2, height: 3, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
                    {hn.length > 0 && <><div style={{ width: `${neg/hn.length*100}%`, background: "#d4605a" }} /><div style={{ width: `${neu/hn.length*100}%`, background: "#c4993c" }} /><div style={{ width: `${pos/hn.length*100}%`, background: "#5a9e6f" }} /></>}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {hc.markets.map(m => <span key={m.ticker} style={{ fontSize: 8, color: "#6b6966", background: "rgba(255,255,255,0.04)", padding: "2px 5px", borderRadius: 3, fontFamily: MONO }}>{m.name}</span>)}
                  </div>
                </div>
                <div style={{ padding: "6px 10px", fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: "#6b6966", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>HEADLINES ({hn.length})</div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {hn.map(it => {
                    const sc = it.sentiment < -0.3 ? "#d4605a" : it.sentiment > 0.3 ? "#5a9e6f" : "#c4993c";
                    return (
                      <div key={it.id} onClick={() => { setRegion(sr); setActiveMarket(REGIONS[sr].markets[0].ticker); setView("dashboard"); }} style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", borderLeft: `3px solid ${sc}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 5, marginBottom: 2 }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 8, color: "#6b6966", fontWeight: 600 }}>{it.source}</span>
                            {it.category && <span style={{ fontSize: 7, color: "#6b6966", background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8 }}>{it.category}</span>}
                            {it.country && <span style={{ fontSize: 8, color: "#45433f" }}>· {it.country}</span>}
                          </div>
                          <span style={{ fontSize: 8, color: "#45433f", fontFamily: MONO }}>{new Date(it.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p style={{ fontSize: 11, lineHeight: 1.4, color: "#9d9b97", margin: "2px 0 4px", fontWeight: 500 }}>{it.headline}</p>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: sc }}>{it.sentiment > .2 ? "POS" : it.sentiment < -.2 ? "NEG" : "NEU"}</span>
                          <span style={{ fontSize: 8, color: "#45433f", fontFamily: MONO }}>Impact {it.impact}/10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>;
            })()}
          </div>
        </div>
      )}

      {/* WATCHLIST */}
      {view === "watchlist" && (
        <div className="fu" style={{ maxWidth: 780, margin: "0 auto", padding: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: T.t4, marginBottom: 12 }}>WATCHLIST</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {watchlist.map(n => { const c = REGIONS[n]; if (!c) return null; const r = scores[n] || 0; const md = genMarketData(c.markets[0].base, 6); return (
              <div key={n} onClick={() => { setRegion(n); setActiveMarket(c.markets[0].ticker); setView("dashboard"); }} style={{ background: T.sf, borderRadius: 6, padding: 12, border: `1.5px solid ${T.bd}`, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div><div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} /><span style={{ fontSize: 13, fontWeight: 700 }}>{n}</span></div><div style={{ fontSize: 8, color: T.t4, marginTop: 1 }}>{c.markets.map(m => m.name).join(" · ")}</div></div>
                  <RiskGauge score={r} T={T} size="sm" />
                </div>
                <div style={{ height: 38 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={md} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}><Area type="monotone" dataKey="price" stroke={c.color} strokeWidth={1.5} fill={`${c.color}12`} dot={false} /></AreaChart></ResponsiveContainer></div>
              </div>
            ); })}
          </div>
        </div>
      )}

      {/* LEARN */}
      {view === "learn" && (
        <div className="fu" style={{ maxWidth: 860, margin: "0 auto", padding: "24px 24px 48px", overflowY: "auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: T.t4, marginBottom: 4 }}>GEOMARKET PULSE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.t1 }}>Trading Fundamentals</div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>A visual guide to reading charts, indicators, and market structure</div>
          </div>
          <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.6, fontFamily: FONT }}>
            <div style={{ background: `${T.accent}08`, border: `1px solid ${T.accent}18`, borderRadius: 6, padding: "10px 12px", marginBottom: 20, fontSize: 10, color: T.accent }}>
              <strong>Disclaimer:</strong> This is educational content only, not financial advice. Technical analysis describes probabilities, not certainties. Markets can and do behave contrary to any pattern. Always manage risk.
            </div>

            {/* 1. Candlesticks */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>1. What is a Candlestick?</div>
              <p style={{ margin: "0 0 10px" }}>Each candlestick shows four data points for a time period: <strong>Open</strong> (starting price), <strong>High</strong> (peak), <strong>Low</strong> (trough), and <strong>Close</strong> (ending price).</p>
              <svg viewBox="0 0 540 270" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Bullish candle */}
                <line x1="110" y1="25" x2="110" y2="235" stroke={T.green} strokeWidth="2.5" />
                <rect x="82" y="70" width="56" height="120" fill={T.green} rx="3" opacity="0.9" />
                <line x1="142" y1="25" x2="175" y2="25" stroke={T.t4} strokeWidth="0.8" strokeDasharray="3 2" />
                <text x="180" y="29" style={{ fontSize: 10, fill: T.t1, fontFamily: MONO, fontWeight: 700 }}>HIGH</text>
                <text x="210" y="29" style={{ fontSize: 9, fill: T.t3, fontFamily: FONT }}>— Highest price reached</text>
                <line x1="142" y1="70" x2="175" y2="55" stroke={T.t4} strokeWidth="0.8" strokeDasharray="3 2" />
                <text x="180" y="58" style={{ fontSize: 10, fill: T.green, fontFamily: MONO, fontWeight: 700 }}>CLOSE</text>
                <text x="218" y="58" style={{ fontSize: 9, fill: T.t3, fontFamily: FONT }}>— Price went UP</text>
                <line x1="78" y1="190" x2="45" y2="190" stroke={T.t4} strokeWidth="0.8" strokeDasharray="3 2" />
                <text x="10" y="194" style={{ fontSize: 10, fill: T.t2, fontFamily: MONO, fontWeight: 700 }}>OPEN</text>
                <line x1="142" y1="235" x2="175" y2="235" stroke={T.t4} strokeWidth="0.8" strokeDasharray="3 2" />
                <text x="180" y="239" style={{ fontSize: 10, fill: T.t1, fontFamily: MONO, fontWeight: 700 }}>LOW</text>
                <text x="204" y="239" style={{ fontSize: 9, fill: T.t3, fontFamily: FONT }}>— Lowest price reached</text>
                <text x="63" y="48" style={{ fontSize: 8, fill: T.t4, fontFamily: MONO }}>Upper</text>
                <text x="65" y="57" style={{ fontSize: 8, fill: T.t4, fontFamily: MONO }}>Wick</text>
                <text x="65" y="220" style={{ fontSize: 8, fill: T.t4, fontFamily: MONO }}>Lower</text>
                <text x="65" y="229" style={{ fontSize: 8, fill: T.t4, fontFamily: MONO }}>Wick</text>
                <text x="92" y="135" style={{ fontSize: 11, fill: "#fff", fontWeight: 700, fontFamily: MONO }}>BODY</text>
                <text x="55" y="258" style={{ fontSize: 11, fill: T.green, fontWeight: 700 }}>BULLISH (Green)</text>
                <text x="172" y="258" style={{ fontSize: 10, fill: T.t3 }}>— Closed higher than open</text>
                {/* Bearish candle */}
                <line x1="400" y1="25" x2="400" y2="235" stroke={T.red} strokeWidth="2.5" />
                <rect x="372" y="70" width="56" height="120" fill={T.red} rx="3" opacity="0.9" />
                <text x="435" y="78" style={{ fontSize: 10, fill: T.red, fontFamily: MONO, fontWeight: 700 }}>OPEN (top)</text>
                <text x="435" y="196" style={{ fontSize: 10, fill: T.red, fontFamily: MONO, fontWeight: 700 }}>CLOSE (bottom)</text>
                <text x="375" y="135" style={{ fontSize: 11, fill: "#fff", fontWeight: 700, fontFamily: MONO }}>BODY</text>
                <text x="340" y="258" style={{ fontSize: 11, fill: T.red, fontWeight: 700 }}>BEARISH (Red)</text>
                <text x="437" y="258" style={{ fontSize: 10, fill: T.t3 }}>— Closed lower</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>The <strong>body</strong> = open-to-close range. The <strong>wicks</strong> = full range. A long upper wick means sellers pushed price back down. A long lower wick means buyers stepped in. Small body + long wicks = indecision.</p>
            </div>

            {/* 2. Candle Patterns */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>2. Key Candle Patterns</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[
                  { name: "Doji", desc: "Indecision — neither side won", color: T.yellow, render: (T) => <><line x1="50" y1="15" x2="50" y2="85" stroke={T.t2} strokeWidth="2.5" /><rect x="38" y="47" width="24" height="5" fill={T.t2} rx="1" /></> },
                  { name: "Hammer", desc: "Buyers fought back after dip", color: T.green, render: (T) => <><line x1="50" y1="20" x2="50" y2="85" stroke={T.green} strokeWidth="2.5" /><rect x="36" y="20" width="28" height="22" fill={T.green} rx="2" /></> },
                  { name: "Shooting Star", desc: "Sellers rejected the high", color: T.red, render: (T) => <><line x1="50" y1="15" x2="50" y2="85" stroke={T.red} strokeWidth="2.5" /><rect x="36" y="63" width="28" height="22" fill={T.red} rx="2" /></> },
                ].map(p => (
                  <div key={p.name} style={{ background: `${T.bg}`, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
                    <svg viewBox="0 0 100 100" style={{ width: 60, height: 60 }}>{p.render(T)}</svg>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginTop: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: p.color, marginTop: 2 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[
                  { name: "Bullish Engulfing", desc: "Green completely covers red — reversal signal", color: T.green, render: (T) => <><rect x="25" y="35" width="18" height="35" fill={T.red} rx="2" /><line x1="34" y1="28" x2="34" y2="78" stroke={T.red} strokeWidth="1.5" /><rect x="52" y="22" width="26" height="56" fill={T.green} rx="2" /><line x1="65" y1="15" x2="65" y2="85" stroke={T.green} strokeWidth="1.5" /></> },
                  { name: "Bearish Engulfing", desc: "Red completely covers green — reversal signal", color: T.red, render: (T) => <><rect x="25" y="35" width="18" height="35" fill={T.green} rx="2" /><line x1="34" y1="28" x2="34" y2="78" stroke={T.green} strokeWidth="1.5" /><rect x="52" y="22" width="26" height="56" fill={T.red} rx="2" /><line x1="65" y1="15" x2="65" y2="85" stroke={T.red} strokeWidth="1.5" /></> },
                ].map(p => (
                  <div key={p.name} style={{ background: `${T.bg}`, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
                    <svg viewBox="0 0 100 100" style={{ width: 60, height: 60 }}>{p.render(T)}</svg>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginTop: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: p.color, marginTop: 2 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>Patterns suggest possible moves but require context. A hammer after a downtrend may signal reversal — but the next candle needs to confirm. One candle alone is never enough.</p>
            </div>

            {/* 3. Moving Averages — FIXED: proper candlestick chart with MA overlay */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>3. Moving Averages (MA)</div>
              <p style={{ margin: "0 0 10px" }}>A moving average smooths price data to reveal the trend. A <strong>fast MA</strong> (e.g. 20-period, gold line) reacts quickly. A <strong>slow MA</strong> (e.g. 50-period, red dashed) shows the bigger picture. When they cross, momentum may be shifting.</p>
              <svg viewBox="0 0 540 220" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Proper candlesticks with OHLC data */}
                {[
                  {o:150,h:155,l:138,c:142},{o:142,h:148,l:135,c:145},{o:145,h:152,l:140,c:138},
                  {o:138,h:145,l:130,c:143},{o:143,h:150,l:137,c:135},{o:135,h:142,l:128,c:140},
                  {o:140,h:155,l:138,c:152},{o:152,h:160,l:148,c:148},{o:148,h:156,l:142,c:155},
                  {o:155,h:165,l:150,c:162},{o:162,h:168,l:155,c:158},{o:158,h:162,l:148,c:150},
                  {o:150,h:158,l:145,c:156},{o:156,h:168,l:152,c:165},{o:165,h:172,l:158,c:160},
                  {o:160,h:170,l:155,c:168},{o:168,h:178,l:164,c:175},{o:175,h:182,l:170,c:172},
                  {o:172,h:180,l:168,c:178},{o:178,h:188,l:175,c:185},{o:185,h:192,l:180,c:182},
                  {o:182,h:190,l:178,c:188},{o:188,h:195,l:184,c:192},{o:192,h:198,l:186,c:195},
                ].map((c, i) => {
                  const x = 25 + i * 21;
                  const bull = c.c >= c.o;
                  const bodyTop = 210 - Math.max(c.o, c.c);
                  const bodyH = Math.max(Math.abs(c.c - c.o), 2);
                  return <g key={i}>
                    <line x1={x} y1={210 - c.h} x2={x} y2={210 - c.l} stroke={bull ? T.green : T.red} strokeWidth="1.2" />
                    <rect x={x - 5} y={bodyTop} width={10} height={bodyH} fill={bull ? T.green : T.red} rx={1} opacity={0.7} />
                  </g>;
                })}
                {/* Fast MA (20) — gold line following price closely */}
                <polyline points="25,66 46,62 67,70 88,64 109,72 130,67 151,56 172,60 193,53 214,46 235,50 256,58 277,52 298,43 319,48 340,40 361,33 382,36 403,30 424,23 445,26 466,20 487,16 508,13" fill="none" stroke={T.accent} strokeWidth="2" />
                {/* Slow MA (50) — red dashed, smoother */}
                <polyline points="25,68 46,66 67,65 88,63 109,62 130,60 151,58 172,56 193,54 214,52 235,50 256,48 277,46 298,44 340,40 361,38 382,36 403,34 424,32 445,30 466,28 487,26 508,24" fill="none" stroke={T.red} strokeWidth="2" strokeDasharray="6 3" />
                {/* Crossover circle — where fast crosses above slow */}
                <circle cx="130" cy="63" r="10" fill="none" stroke={T.yellow} strokeWidth="2" />
                <line x1="144" y1="63" x2="180" y2="76" stroke={T.yellow} strokeWidth="1" strokeDasharray="3 2" />
                <text x="183" y="80" style={{ fontSize: 9, fill: T.yellow, fontWeight: 700 }}>Golden Cross — bullish signal</text>
                {/* Legend */}
                <line x1="25" y1="10" x2="45" y2="10" stroke={T.accent} strokeWidth="2" />
                <text x="49" y="13" style={{ fontSize: 9, fill: T.t2 }}>Fast MA (20)</text>
                <line x1="140" y1="10" x2="160" y2="10" stroke={T.red} strokeWidth="2" strokeDasharray="4 2" />
                <text x="164" y="13" style={{ fontSize: 9, fill: T.t2 }}>Slow MA (50)</text>
                {/* Price above MA annotation */}
                <text x="380" y="10" style={{ fontSize: 8, fill: T.green, fontWeight: 600 }}>Price above both MAs = Uptrend</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>When the fast MA crosses above the slow MA, it's called a <strong>Golden Cross</strong> (bullish). The reverse is a <strong>Death Cross</strong> (bearish). Crossovers lag — best used to confirm direction, not to time entries.</p>
            </div>

            {/* 4. Support & Resistance */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>4. Support, Resistance & Breakouts</div>
              <svg viewBox="0 0 540 210" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                <line x1="25" y1="50" x2="510" y2="50" stroke={T.red} strokeWidth="1.5" strokeDasharray="6 3" />
                <rect x="25" y="40" width="82" height="16" rx="3" fill={`${T.red}15`} /><text x="30" y="52" style={{ fontSize: 9, fill: T.red, fontWeight: 700 }}>RESISTANCE</text>
                <line x1="25" y1="150" x2="510" y2="150" stroke={T.green} strokeWidth="1.5" strokeDasharray="6 3" />
                <rect x="25" y="140" width="66" height="16" rx="3" fill={`${T.green}15`} /><text x="30" y="152" style={{ fontSize: 9, fill: T.green, fontWeight: 700 }}>SUPPORT</text>
                {/* Price bouncing between levels */}
                <polyline points="40,100 65,60 80,55 95,58 120,95 145,140 160,145 175,142 200,100 225,60 240,55 255,58 280,95 305,140 320,145 335,142 365,65 385,55 405,50 425,42 445,35 465,30" fill="none" stroke={T.t1} strokeWidth="1.5" />
                <text x="78" y="46" style={{ fontSize: 9, fill: T.red }}>Rejected</text>
                <text x="145" y="166" style={{ fontSize: 9, fill: T.green }}>Bounced</text>
                <text x="235" y="46" style={{ fontSize: 9, fill: T.red }}>Rejected</text>
                <text x="305" y="166" style={{ fontSize: 9, fill: T.green }}>Bounced</text>
                {/* Breakout zone */}
                <rect x="395" y="28" width="80" height="26" rx="4" fill={`${T.yellow}12`} stroke={T.yellow} strokeWidth="1" strokeDasharray="3 2" />
                <text x="405" y="40" style={{ fontSize: 9, fill: T.yellow, fontWeight: 700 }}>BREAKOUT</text>
                <text x="405" y="50" style={{ fontSize: 8, fill: T.yellow }}>Above resistance</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>Price bounces between support and resistance until one breaks. <strong>False breakouts</strong> are common — always wait for confirmation (e.g. a close above/below the level with volume).</p>
            </div>

            {/* 5. FVG */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>5. Fair Value Gap (FVG)</div>
              <svg viewBox="0 0 540 220" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Candle 1 */}
                <line x1="120" y1="140" x2="120" y2="195" stroke={T.green} strokeWidth="2.5" />
                <rect x="106" y="140" width="28" height="38" fill={T.green} rx="2" />
                <text x="120" y="210" textAnchor="middle" style={{ fontSize: 9, fill: T.t3, fontWeight: 600 }}>Candle 1</text>
                {/* Candle 2 — big move */}
                <line x1="200" y1="38" x2="200" y2="135" stroke={T.green} strokeWidth="2.5" />
                <rect x="186" y="38" width="28" height="75" fill={T.green} rx="2" />
                <text x="200" y="210" textAnchor="middle" style={{ fontSize: 9, fill: T.t3, fontWeight: 600 }}>Candle 2</text>
                <text x="200" y="28" textAnchor="middle" style={{ fontSize: 9, fill: T.green, fontWeight: 700 }}>Big move!</text>
                {/* Candle 3 */}
                <line x1="280" y1="28" x2="280" y2="85" stroke={T.green} strokeWidth="2.5" />
                <rect x="266" y="28" width="28" height="38" fill={T.green} rx="2" />
                <text x="280" y="210" textAnchor="middle" style={{ fontSize: 9, fill: T.t3, fontWeight: 600 }}>Candle 3</text>
                {/* FVG zone */}
                <rect x="135" y="85" width="145" height="55" fill={`${T.purple}12`} stroke={T.purple} strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
                <text x="207" y="108" textAnchor="middle" style={{ fontSize: 11, fill: T.purple, fontWeight: 700 }}>FAIR VALUE GAP</text>
                <text x="207" y="122" textAnchor="middle" style={{ fontSize: 8, fill: T.t3 }}>Gap between candle 1 high &amp; candle 3 low</text>
                {/* Arrow showing price return */}
                <path d="M 330,50 C 380,50 390,90 360,110" fill="none" stroke={T.yellow} strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="398" y="75" style={{ fontSize: 9, fill: T.yellow, fontWeight: 600 }}>Price may return</text>
                <text x="398" y="88" style={{ fontSize: 9, fill: T.yellow }}>to fill this gap</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>FVGs form during aggressive moves where one side dominated. Price often revisits these zones — but in strong trends, they may never fill.</p>
            </div>

            {/* 6. RSI */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>6. RSI (Relative Strength Index)</div>
              <svg viewBox="0 0 540 180" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Overbought/Oversold zones */}
                <rect x="25" y="12" width="490" height="28" fill={`${T.red}08`} rx="2" />
                <rect x="25" y="130" width="490" height="35" fill={`${T.green}08`} rx="2" />
                <text x="35" y="28" style={{ fontSize: 9, fill: T.red, fontWeight: 700 }}>OVERBOUGHT (above 70)</text>
                <text x="35" y="152" style={{ fontSize: 9, fill: T.green, fontWeight: 700 }}>OVERSOLD (below 30)</text>
                {/* Reference lines */}
                <line x1="25" y1="40" x2="515" y2="40" stroke={T.red} strokeWidth="0.7" strokeDasharray="4 2" />
                <line x1="25" y1="130" x2="515" y2="130" stroke={T.green} strokeWidth="0.7" strokeDasharray="4 2" />
                <text x="518" y="43" style={{ fontSize: 8, fill: T.red, fontFamily: MONO }}>70</text>
                <text x="518" y="133" style={{ fontSize: 8, fill: T.green, fontFamily: MONO }}>30</text>
                <text x="518" y="88" style={{ fontSize: 8, fill: T.t4, fontFamily: MONO }}>50</text>
                <line x1="25" y1="85" x2="515" y2="85" stroke={T.t4} strokeWidth="0.3" strokeDasharray="2 3" />
                {/* RSI line */}
                <polyline points="35,85 65,75 95,60 125,38 155,28 185,35 215,58 245,78 275,95 305,115 335,138 365,142 395,125 425,100 455,75 485,58" fill="none" stroke={T.purple} strokeWidth="2.5" />
                {/* Annotations */}
                <circle cx="155" cy="28" r="6" fill="none" stroke={T.red} strokeWidth="2" />
                <text x="165" y="22" style={{ fontSize: 8, fill: T.red, fontWeight: 700 }}>Overbought — may reverse down</text>
                <circle cx="365" cy="142" r="6" fill="none" stroke={T.green} strokeWidth="2" />
                <text x="375" y="160" style={{ fontSize: 8, fill: T.green, fontWeight: 700 }}>Oversold — may bounce up</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>RSI shows momentum speed, NOT price direction. In strong trends it can stay overbought/oversold for weeks. Most useful in ranging/sideways markets. Always combine with other analysis.</p>
            </div>

            {/* 7. MACD */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>7. MACD (Moving Average Convergence Divergence)</div>
              <svg viewBox="0 0 540 180" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                <line x1="25" y1="90" x2="515" y2="90" stroke={T.t4} strokeWidth="0.5" />
                <text x="518" y="93" style={{ fontSize: 8, fill: T.t4, fontFamily: MONO }}>0</text>
                {/* Histogram */}
                {[5,8,12,16,12,7,3,-2,-7,-12,-16,-12,-7,-3,2,7,13,18,14,9].map((v, i) => (
                  <rect key={i} x={32 + i * 24} y={v > 0 ? 90 - v * 3 : 90} width={18} height={Math.abs(v) * 3} fill={v >= 0 ? `${T.green}45` : `${T.red}45`} rx={2} />
                ))}
                {/* MACD line */}
                <polyline points="41,58 65,50 89,42 113,35 137,42 161,52 185,62 209,75 233,95 257,105 281,112 305,102 329,88 353,75 377,65 401,50 425,38 449,30 473,40 497,50" fill="none" stroke={T.accent} strokeWidth="2" />
                {/* Signal line */}
                <polyline points="41,62 65,56 89,50 113,45 137,46 161,52 185,58 209,68 233,82 257,95 281,105 305,100 329,92 353,82 377,72 401,58 425,45 449,38 473,42 497,48" fill="none" stroke={T.red} strokeWidth="1.5" strokeDasharray="4 2" />
                {/* Crossover annotations */}
                <circle cx="185" cy="60" r="8" fill="none" stroke={T.yellow} strokeWidth="2" />
                <text x="196" y="54" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>Bearish cross</text>
                <circle cx="353" cy="78" r="8" fill="none" stroke={T.yellow} strokeWidth="2" />
                <text x="364" y="72" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>Bullish cross</text>
                {/* Legend */}
                <line x1="32" y1="168" x2="52" y2="168" stroke={T.accent} strokeWidth="2" />
                <text x="56" y="171" style={{ fontSize: 8, fill: T.t2 }}>MACD line</text>
                <line x1="135" y1="168" x2="155" y2="168" stroke={T.red} strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="159" y="171" style={{ fontSize: 8, fill: T.t2 }}>Signal line</text>
                <rect x="240" y="163" width="12" height="10" fill={`${T.green}45`} rx="1" />
                <text x="256" y="171" style={{ fontSize: 8, fill: T.t3 }}>Histogram = gap between lines (momentum)</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>MACD crossovers indicate momentum shifts. Growing histogram = strengthening trend. Shrinking = fading. Crossovers are lagging — they confirm what happened, not predict what's next.</p>
            </div>

            {/* 8. Volume Analysis — NEW */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>8. Volume Analysis</div>
              <p style={{ margin: "0 0 10px" }}>Volume shows <strong>how many shares/contracts</strong> were traded. High volume confirms moves; low volume suggests weakness. A breakout on heavy volume is more trustworthy than one on thin volume.</p>
              <svg viewBox="0 0 540 220" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Price line */}
                <polyline points="30,120 55,115 80,110 105,108 130,112 155,105 180,98 205,100 230,95 255,88 280,82 305,78 330,75 355,72 380,68 405,62 430,58 455,52 480,48 505,42" fill="none" stroke={T.t1} strokeWidth="1.5" />
                <text x="510" y="40" style={{ fontSize: 8, fill: T.t3, fontFamily: MONO }}>Price</text>
                {/* Volume bars */}
                {[25,30,20,35,28,40,55,32,45,70,85,60,42,38,50,90,65,48,55,80].map((v, i) => {
                  const x = 30 + i * 25;
                  const up = i === 0 || [120,115,110,108,112,105,98,100,95,88,82,78,75,72,68,62,58,52,48,42][i] < [120,115,110,108,112,105,98,100,95,88,82,78,75,72,68,62,58,52,48,42][i-1];
                  return <rect key={i} x={x - 8} y={200 - v} width={16} height={v} fill={up ? `${T.green}50` : `${T.red}50`} rx={1} />;
                })}
                {/* Annotations */}
                <line x1="255" y1="110" x2="255" y2="145" stroke={T.yellow} strokeWidth="1" strokeDasharray="3 2" />
                <text x="220" y="160" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>High volume = strong conviction</text>
                <line x1="405" y1="100" x2="405" y2="125" stroke={T.yellow} strokeWidth="1" strokeDasharray="3 2" />
                <text x="370" y="140" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>Climax volume on breakout</text>
                <text x="30" y="215" style={{ fontSize: 8, fill: T.t4 }}>VOLUME</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>Rising price + rising volume = healthy trend. Rising price + falling volume = trend may be exhausting. Volume spikes often mark tops or bottoms.</p>
            </div>

            {/* 9. Bollinger Bands — NEW */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>9. Bollinger Bands</div>
              <p style={{ margin: "0 0 10px" }}>Bollinger Bands plot a <strong>moving average</strong> with upper and lower bands at 2 standard deviations. Bands widen in volatile markets and narrow ("squeeze") before big moves.</p>
              <svg viewBox="0 0 540 200" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Band fill */}
                <path d="M 30,55 55,58 80,60 105,65 130,75 155,78 180,72 205,62 230,55 255,50 280,42 305,38 330,45 355,55 380,62 405,58 430,50 455,42 480,35 505,30 505,140 480,150 455,155 430,158 405,160 380,162 355,158 330,152 305,145 280,140 255,142 230,148 205,155 180,160 155,158 130,152 105,148 80,142 55,138 30,130 Z" fill={`${T.accent}08`} />
                {/* Upper band */}
                <polyline points="30,55 55,58 80,60 105,65 130,75 155,78 180,72 205,62 230,55 255,50 280,42 305,38 330,45 355,55 380,62 405,58 430,50 455,42 480,35 505,30" fill="none" stroke={T.accent} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                {/* Lower band */}
                <polyline points="30,130 55,138 80,142 105,148 130,152 155,158 180,160 205,155 230,148 255,142 280,140 305,145 330,152 355,158 380,162 405,160 430,158 455,155 480,150 505,140" fill="none" stroke={T.accent} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                {/* Middle band (SMA) */}
                <polyline points="30,92 55,98 80,101 105,106 130,114 155,118 180,116 205,108 230,102 255,96 280,91 305,91 330,98 355,106 380,112 405,109 430,104 455,98 480,92 505,85" fill="none" stroke={T.accent} strokeWidth="1.5" />
                {/* Price */}
                <polyline points="30,88 55,95 80,110 105,120 130,125 155,130 180,115 205,98 230,90 255,85 280,78 305,82 330,95 355,110 380,125 405,118 430,100 455,88 480,80 505,72" fill="none" stroke={T.t1} strokeWidth="2" />
                {/* Squeeze annotation */}
                <rect x="240" y="165" width="80" height="22" rx="4" fill={`${T.yellow}12`} stroke={T.yellow} strokeWidth="1" strokeDasharray="3 2" />
                <text x="250" y="178" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>SQUEEZE</text>
                <line x1="280" y1="165" x2="280" y2="148" stroke={T.yellow} strokeWidth="1" strokeDasharray="3 2" />
                {/* Touch upper band */}
                <circle cx="155" cy="130" r="6" fill="none" stroke={T.red} strokeWidth="1.5" />
                <text x="100" y="145" style={{ fontSize: 8, fill: T.red }}>Touching lower band</text>
                {/* Legend */}
                <line x1="30" y1="195" x2="50" y2="195" stroke={T.t1} strokeWidth="2" />
                <text x="54" y="198" style={{ fontSize: 8, fill: T.t2 }}>Price</text>
                <line x1="100" y1="195" x2="120" y2="195" stroke={T.accent} strokeWidth="1.5" />
                <text x="124" y="198" style={{ fontSize: 8, fill: T.t2 }}>SMA (20)</text>
                <line x1="195" y1="195" x2="215" y2="195" stroke={T.accent} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                <text x="219" y="198" style={{ fontSize: 8, fill: T.t2 }}>Upper/Lower bands (2σ)</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>Price touching the upper band doesn't automatically mean "sell" — in strong trends, price can "walk the band" for extended periods. A <strong>squeeze</strong> (narrow bands) often precedes a big move in either direction.</p>
            </div>

            {/* 10. Trendlines & Channels — NEW */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>10. Trendlines & Channels</div>
              <p style={{ margin: "0 0 10px" }}>Connect swing lows in an uptrend (or swing highs in a downtrend) to draw a trendline. Two parallel trendlines form a <strong>channel</strong>.</p>
              <svg viewBox="0 0 540 200" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Uptrend channel fill */}
                <path d="M 30,155 180,100 330,55 480,15 480,85 330,125 180,165 30,190 Z" fill={`${T.green}06`} />
                {/* Lower trendline (support) */}
                <line x1="30" y1="170" x2="510" y2="55" stroke={T.green} strokeWidth="1.5" strokeDasharray="6 3" />
                {/* Upper trendline (resistance) */}
                <line x1="30" y1="120" x2="510" y2="5" stroke={T.green} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.5" />
                {/* Price zigzag within channel */}
                <polyline points="30,165 60,130 90,155 120,118 155,145 185,102 220,130 255,90 290,118 325,78 360,105 395,65 430,92 465,52 500,28" fill="none" stroke={T.t1} strokeWidth="1.8" />
                {/* Touch points on lower trendline */}
                {[[30,165],[90,155],[155,145],[220,130],[290,118]].map(([x,y], i) => <circle key={i} cx={x} cy={y} r="4" fill={T.green} opacity="0.7" />)}
                {/* Annotations */}
                <text x="380" y="100" style={{ fontSize: 9, fill: T.green, fontWeight: 600 }}>Support trendline</text>
                <text x="380" y="50" style={{ fontSize: 9, fill: T.green, fontWeight: 600, opacity: 0.6 }}>Channel top</text>
                <text x="30" y="195" style={{ fontSize: 8, fill: T.t3 }}>Each bounce off the trendline confirms its validity. More touches = stronger line.</text>
              </svg>
            </div>

            {/* 11. Head & Shoulders — NEW */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>11. Head & Shoulders (Reversal Pattern)</div>
              <p style={{ margin: "0 0 10px" }}>One of the most reliable reversal patterns. It forms after an uptrend with three peaks — the middle peak (head) is the highest. A break below the <strong>neckline</strong> confirms the reversal.</p>
              <svg viewBox="0 0 540 210" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 8, padding: 4 }}>
                {/* Price forming H&S */}
                <polyline points="30,160 60,145 90,120 110,85 125,60 140,85 160,110 185,120 210,100 235,65 260,30 285,65 310,100 335,120 360,110 380,80 395,65 410,82 430,115 460,140 490,155 510,170" fill="none" stroke={T.t1} strokeWidth="2" />
                {/* Neckline */}
                <line x1="60" y1="120" x2="460" y2="120" stroke={T.yellow} strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="465" y="118" style={{ fontSize: 9, fill: T.yellow, fontWeight: 700 }}>Neckline</text>
                {/* Labels */}
                <text x="125" y="52" textAnchor="middle" style={{ fontSize: 9, fill: T.t2, fontWeight: 700 }}>Left Shoulder</text>
                <text x="260" y="22" textAnchor="middle" style={{ fontSize: 10, fill: T.red, fontWeight: 700 }}>HEAD</text>
                <text x="395" y="57" textAnchor="middle" style={{ fontSize: 9, fill: T.t2, fontWeight: 700 }}>Right Shoulder</text>
                {/* Breakdown arrow */}
                <line x1="460" y1="125" x2="490" y2="155" stroke={T.red} strokeWidth="2" />
                <polygon points="490,155 483,148 493,148" fill={T.red} />
                <text x="430" y="175" style={{ fontSize: 9, fill: T.red, fontWeight: 700 }}>Breakdown</text>
                <text x="430" y="187" style={{ fontSize: 8, fill: T.t3 }}>confirms reversal</text>
              </svg>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>The pattern is only confirmed when price breaks below the neckline. Measure the distance from head to neckline — that's the approximate target for the drop.</p>
            </div>

            {/* 12. Double Top & Double Bottom — NEW */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8, borderBottom: `1px solid ${T.bd}`, paddingBottom: 4 }}>12. Double Top & Double Bottom</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                {/* Double Top */}
                <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.red, marginBottom: 4, textAlign: "center" }}>Double Top (Bearish)</div>
                  <svg viewBox="0 0 240 130" style={{ width: "100%" }}>
                    <polyline points="10,100 35,80 55,55 70,30 85,55 105,75 125,55 140,30 155,55 175,80 200,95 230,110" fill="none" stroke={T.t1} strokeWidth="2" />
                    <line x1="10" y1="30" x2="230" y2="30" stroke={T.red} strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
                    <line x1="10" y1="75" x2="230" y2="75" stroke={T.yellow} strokeWidth="1" strokeDasharray="4 2" />
                    <text x="5" y="72" style={{ fontSize: 7, fill: T.yellow }}>Neckline</text>
                    <text x="70" y="24" textAnchor="middle" style={{ fontSize: 8, fill: T.red, fontWeight: 700 }}>Top 1</text>
                    <text x="140" y="24" textAnchor="middle" style={{ fontSize: 8, fill: T.red, fontWeight: 700 }}>Top 2</text>
                    <text x="190" y="124" style={{ fontSize: 8, fill: T.red }}>Sell signal</text>
                  </svg>
                </div>
                {/* Double Bottom */}
                <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.green, marginBottom: 4, textAlign: "center" }}>Double Bottom (Bullish)</div>
                  <svg viewBox="0 0 240 130" style={{ width: "100%" }}>
                    <polyline points="10,30 35,50 55,75 70,100 85,75 105,55 125,75 140,100 155,75 175,50 200,35 230,20" fill="none" stroke={T.t1} strokeWidth="2" />
                    <line x1="10" y1="100" x2="230" y2="100" stroke={T.green} strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
                    <line x1="10" y1="55" x2="230" y2="55" stroke={T.yellow} strokeWidth="1" strokeDasharray="4 2" />
                    <text x="5" y="52" style={{ fontSize: 7, fill: T.yellow }}>Neckline</text>
                    <text x="70" y="115" textAnchor="middle" style={{ fontSize: 8, fill: T.green, fontWeight: 700 }}>Bottom 1</text>
                    <text x="140" y="115" textAnchor="middle" style={{ fontSize: 8, fill: T.green, fontWeight: 700 }}>Bottom 2</text>
                    <text x="190" y="16" style={{ fontSize: 8, fill: T.green }}>Buy signal</text>
                  </svg>
                </div>
              </div>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>When price tests the same level twice and fails to break through, it often reverses. The pattern is confirmed when price breaks through the neckline (the interim high/low between the two peaks/troughs).</p>
            </div>

            {/* Closing box */}
            <div style={{ background: `${T.purple}08`, border: `1px solid ${T.purple}18`, borderRadius: 6, padding: "14px 16px", fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: T.purple, marginBottom: 6 }}>Why patterns fail — and why that's normal</div>
              <p style={{ margin: "0 0 6px", color: T.t2 }}>Every pattern visible on your chart is also visible to algorithms, institutions, and millions of other traders. Sometimes they trade with the pattern. Sometimes they deliberately trade against it — large players may push price through support to trigger stop-losses, then reverse.</p>
              <p style={{ margin: "0 0 6px", color: T.t2 }}>Unexpected events — a central bank surprise, a geopolitical shock, an earnings miss — can override any technical setup instantly. The market doesn't know or care about your lines.</p>
              <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>The best approach: treat every pattern as a probability, not a certainty. Use multiple confirming signals. Define your risk before acting. Accept that being wrong is part of the process — the goal is good process, not perfect prediction.</p>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <>
          {/* Region tabs */}
          <div style={{ padding: "5px 16px", display: "flex", gap: 3, borderBottom: `1px solid ${T.bd}`, overflowX: "auto", alignItems: "center", background: T.sf }}>
            <button onClick={() => setView("globe")} style={{ ...btn(false), marginRight: 2 }}>←</button>
            {Object.keys(REGIONS).map(r => <button key={r} onClick={() => { setRegion(r); setActiveMarket(REGIONS[r].markets[0].ticker); setSelCountry(null); }} style={btn(region === r, REGIONS[r].color)}>{r}</button>)}
            <button onClick={() => setWatchlist(w => w.includes(region) ? w.filter(x => x !== region) : [...w, region])} style={{ marginLeft: "auto", background: "none", border: "none", color: isW ? T.accent : T.t4, cursor: "pointer", fontSize: 16 }}>{isW ? "★" : "☆"}</button>
          </div>
          {/* Markets + Commodities */}
          <div style={{ padding: "5px 16px", background: T.sf, borderBottom: `1px solid ${T.bd}` }}><MarketsStrip region={region} activeMarket={activeMarket} onSelect={t => setActiveMarket(t)} T={T} /></div>
          <div style={{ padding: "4px 16px 6px" }}><CommodityStrip region={region} T={T} /></div>

          <div className="fu" style={{ display: "grid", gridTemplateColumns: "1fr 310px", minHeight: "calc(100vh - 180px)" }}>
            {/* LEFT */}
            <div style={{ borderRight: `1px solid ${T.bd}`, overflowY: "auto" }}>
              {/* Price header */}
              <div style={{ padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 9, color: T.t3, letterSpacing: 1, marginBottom: 1 }}>{am.ticker} · {am.name} · {am.country}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO }}>{latest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: MONO, color: isUp ? T.green : T.red }}>{isUp ? "+" : ""}{dayChg.toFixed(2)} ({isUp ? "+" : ""}{dayPct.toFixed(2)}%)</span>
                  </div>
                </div>
                <RiskGauge score={risk} T={T} />
              </div>
              {/* Chart controls */}
              <div style={{ padding: "0 16px 4px", display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                {["24h","7d","30d","90d"].map(t => <button key={t} onClick={() => setTimeRange(t)} style={smBtn(timeRange === t)}>{t}</button>)}
                <div style={{ width: 1, height: 12, background: T.bd, margin: "0 2px" }} />
                {/* Chart type */}
                {[{id:"candle",label:"Candle"},{id:"line",label:"Line"}].map(ct => <button key={ct.id} onClick={() => setChartType(ct.id)} style={smBtn(chartType === ct.id)}>{ct.label}</button>)}
                <div style={{ width: 1, height: 12, background: T.bd, margin: "0 2px" }} />
                {/* View toggles */}
                {[{id:"chart",label:"Chart"},{id:"multi",label:"4-Grid"},{id:"book",label:"Book"}].map(dt => <button key={dt.id} onClick={() => setDashTab(dt.id)} style={smBtn(dashTab === dt.id)}>{dt.label}</button>)}
                <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <span style={{ fontSize: 9, color: showNewsOnChart ? T.accent : T.t4, fontWeight: 600 }}>News</span>
                  <div onClick={() => setShowNewsOnChart(!showNewsOnChart)} style={{ width: 28, height: 14, borderRadius: 7, background: showNewsOnChart ? `${T.accent}60` : T.bd, position: "relative", cursor: "pointer" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: showNewsOnChart ? T.accent : T.t4, position: "absolute", top: 2, left: showNewsOnChart ? 16 : 2, transition: "all .15s" }} />
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <span style={{ fontSize: 9, color: showIndicators ? T.accent : T.t4, fontWeight: 600 }}>RSI/MACD</span>
                  <div onClick={() => setShowIndicators(!showIndicators)} style={{ width: 28, height: 14, borderRadius: 7, background: showIndicators ? `${T.accent}60` : T.bd, position: "relative", cursor: "pointer" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: showIndicators ? T.accent : T.t4, position: "absolute", top: 2, left: showIndicators ? 16 : 2, transition: "all .15s" }} />
                  </div>
                </label>
              </div>

              {/* MAIN CHART AREA */}
              {dashTab === "chart" && <>
                <div style={{ height: 200, padding: "0 6px 0 0" }}>
                  {!loading && <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 14, bottom: 5, left: 10 }}>
                      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.color} stopOpacity={.12} /><stop offset="100%" stopColor={cfg.color} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.bd} />
                      <XAxis dataKey={chartKey} tick={{ fontSize: 8, fill: T.t4 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 7)} />
                      <YAxis domain={["auto","auto"]} tick={{ fontSize: 8, fill: T.t4 }} tickLine={false} axisLine={false} width={48} tickFormatter={v => v.toLocaleString()} />
                      <Tooltip content={({active, payload, label}) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 5, padding: "8px 10px", fontSize: 10, fontFamily: MONO, maxWidth: 260, boxShadow: "0 4px 16px rgba(0,0,0,.15)" }}>
                            <div style={{ color: T.t3, marginBottom: 2 }}>{label}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 10px", fontSize: 9 }}>
                              <span style={{color:T.t4}}>O: <span style={{color:T.t1}}>{d?.open?.toLocaleString()}</span></span>
                              <span style={{color:T.t4}}>H: <span style={{color:T.green}}>{d?.high?.toLocaleString()}</span></span>
                              <span style={{color:T.t4}}>C: <span style={{color:T.t1}}>{d?.close?.toLocaleString()}</span></span>
                              <span style={{color:T.t4}}>L: <span style={{color:T.red}}>{d?.low?.toLocaleString()}</span></span>
                            </div>
                            {d?.newsHL && <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${T.bd}`, fontFamily: FONT }}>
                              <div style={{ color: d.newsSent < -0.3 ? T.red : T.green, fontWeight: 700, fontSize: 9 }}>Impact {d.newsImp}/10 · {d.newsCountry}</div>
                              <div style={{ color: T.t2, lineHeight: 1.3, fontSize: 10, marginTop: 2 }}>{d.newsHL}</div>
                            </div>}
                          </div>
                        );
                      }} />
                      {/* Candlestick or Line */}
                      {chartType === "candle" ? (
                        <Bar dataKey="close" barSize={Math.max(3, Math.min(8, 400 / chartData.length))} shape={(props) => {
                          const { x, y, width, height, payload } = props;
                          if (!payload) return null;
                          const up = payload.close >= payload.open;
                          const col = up ? T.green : T.red;
                          const yAxis = props.background; // approximate
                          // Calculate positions from the y-axis
                          const chartH = 190; // approximate
                          const yDomain = [Math.min(...chartData.map(d=>d.low)), Math.max(...chartData.map(d=>d.high))];
                          const range = yDomain[1] - yDomain[0] || 1;
                          const scaleY = (v) => 8 + (1 - (v - yDomain[0]) / range) * (chartH - 16);
                          const bW = Math.max(2, Math.min(7, 380 / chartData.length));
                          const oY = scaleY(payload.open);
                          const cY = scaleY(payload.close);
                          const hY = scaleY(payload.high);
                          const lY = scaleY(payload.low);
                          const bodyTop = Math.min(oY, cY);
                          const bodyH = Math.max(1, Math.abs(oY - cY));
                          return (
                            <g>
                              <line x1={x + width/2} y1={hY} x2={x + width/2} y2={lY} stroke={col} strokeWidth={1} />
                              <rect x={x + (width - bW)/2} y={bodyTop} width={bW} height={bodyH} fill={col} stroke={col} strokeWidth={1} rx={0.5} />
                            </g>
                          );
                        }} />
                      ) : (
                        <Area type="monotone" dataKey="price" stroke={cfg.color} strokeWidth={1.5} fill="url(#pg)" dot={false} />
                      )}
                      {/* News dots */}
                      {showNewsOnChart && <Scatter dataKey="newsMarker" shape={(props) => {
                        if (props.newsMarker == null) return null;
                        const col = props.newsSent < -0.3 ? T.red : props.newsSent > 0.3 ? T.green : T.yellow;
                        const r = props.newsImp >= 8 ? 8 : 6;
                        return (
                          <g>
                            <line x1={props.cx} y1={8} x2={props.cx} y2={props.cy - r - 2} stroke={col} strokeWidth={1} strokeDasharray="3 2" opacity={.4} />
                            <circle cx={props.cx} cy={props.cy} r={r + 3} fill={col} opacity={.1} />
                            <circle cx={props.cx} cy={props.cy} r={r} fill={col} stroke={T.sf} strokeWidth={2} />
                            <text x={props.cx} y={props.cy + 3} textAnchor="middle" style={{ fontSize: 7, fill: "#fff", fontWeight: 800 }}>{props.newsImp}</text>
                          </g>
                        );
                      }} />}
                    </ComposedChart>
                  </ResponsiveContainer>}
                </div>
                {/* RSI */}
                {showIndicators && (() => {
                  const lastRSI = chartData[chartData.length - 1]?.rsi || 50;
                  const rsiZone = lastRSI > 70 ? "OVERBOUGHT" : lastRSI < 30 ? "OVERSOLD" : "NEUTRAL";
                  const rsiColor = lastRSI > 70 ? T.red : lastRSI < 30 ? T.green : T.t3;
                  // Find RSI crossovers
                  const rsiSignals = chartData.map((d, i) => {
                    if (i === 0) return d;
                    const prev = chartData[i - 1];
                    let rsiSignal = null;
                    if (prev.rsi <= 30 && d.rsi > 30) rsiSignal = "BULLISH";
                    if (prev.rsi >= 70 && d.rsi < 70) rsiSignal = "BEARISH";
                    return { ...d, rsiSignal };
                  });
                  return (
                    <div style={{ position: "relative" }}>
                      <div style={{ height: 65, padding: "0 6px 0 0" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={rsiSignals} margin={{ top: 4, right: 14, bottom: 2, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.bd} />
                            <XAxis dataKey={chartKey} hide />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 7, fill: T.t4 }} tickLine={false} axisLine={false} width={48} ticks={[30, 50, 70]} />
                            <ReferenceLine y={70} stroke={T.red} strokeDasharray="3 3" strokeWidth={.5} label={{ value: "70", position: "right", fontSize: 7, fill: T.red }} />
                            <ReferenceLine y={30} stroke={T.green} strokeDasharray="3 3" strokeWidth={.5} label={{ value: "30", position: "right", fontSize: 7, fill: T.green }} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              const sig = d?.rsiSignal;
                              return (
                                <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 5, padding: "6px 8px", fontSize: 9, fontFamily: MONO, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
                                  <div style={{ color: T.t1, fontWeight: 700 }}>RSI: {d?.rsi}</div>
                                  <div style={{ color: d?.rsi > 70 ? T.red : d?.rsi < 30 ? T.green : T.t3, fontSize: 8 }}>
                                    {d?.rsi > 70 ? "⚠ Overbought — price may reverse down" : d?.rsi < 30 ? "⚠ Oversold — price may bounce up" : "Neutral zone"}
                                  </div>
                                  {sig && <div style={{ marginTop: 3, paddingTop: 3, borderTop: `1px solid ${T.bd}`, color: sig === "BULLISH" ? T.green : T.red, fontWeight: 700, fontSize: 9 }}>
                                    {sig === "BULLISH" ? "▲ Bullish crossover — RSI exiting oversold" : "▼ Bearish crossover — RSI exiting overbought"}
                                  </div>}
                                </div>
                              );
                            }} />
                            <Area type="monotone" dataKey="rsi" stroke={T.purple} strokeWidth={1.2} fill={`${T.purple}08`} dot={false} />
                            {/* Crossover signals */}
                            <Scatter dataKey="rsi" shape={(props) => {
                              const d = props.payload;
                              if (!d?.rsiSignal) return null;
                              const col = d.rsiSignal === "BULLISH" ? T.green : T.red;
                              return (
                                <g>
                                  <circle cx={props.cx} cy={props.cy} r={5} fill={col} stroke={T.sf} strokeWidth={1.5} />
                                  <text x={props.cx} y={props.cy + 3} textAnchor="middle" style={{ fontSize: 7, fill: "#fff", fontWeight: 800 }}>{d.rsiSignal === "BULLISH" ? "▲" : "▼"}</text>
                                </g>
                              );
                            }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px", marginTop: -1 }}>
                        <span style={{ fontSize: 8, color: T.t4 }}>RSI (14)</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: rsiColor, fontFamily: MONO }}>{lastRSI.toFixed(1)} · {rsiZone}</span>
                      </div>
                    </div>
                  );
                })()}
                {/* MACD */}
                {showIndicators && (() => {
                  const last = chartData[chartData.length - 1];
                  const prev = chartData[chartData.length - 2];
                  const macdTrend = last?.histogram > 0 ? (last.histogram > (prev?.histogram || 0) ? "BULLISH MOMENTUM ▲" : "BULLISH FADING") : (last?.histogram < (prev?.histogram || 0) ? "BEARISH MOMENTUM ▼" : "BEARISH FADING");
                  const macdColor = last?.histogram >= 0 ? T.green : T.red;
                  // Find MACD crossovers
                  const macdSignals = chartData.map((d, i) => {
                    if (i === 0) return d;
                    const p = chartData[i - 1];
                    let macdCross = null;
                    if (p.macd <= p.signal && d.macd > d.signal) macdCross = "BULLISH";
                    if (p.macd >= p.signal && d.macd < d.signal) macdCross = "BEARISH";
                    return { ...d, macdCross };
                  });
                  return (
                    <div style={{ position: "relative" }}>
                      <div style={{ height: 65, padding: "0 6px 0 0" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={macdSignals} margin={{ top: 4, right: 14, bottom: 2, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.bd} />
                            <XAxis dataKey={chartKey} hide />
                            <YAxis tick={{ fontSize: 7, fill: T.t4 }} tickLine={false} axisLine={false} width={48} />
                            <ReferenceLine y={0} stroke={T.t4} strokeWidth={.5} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              const cross = d?.macdCross;
                              return (
                                <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 5, padding: "6px 8px", fontSize: 9, fontFamily: MONO, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 8px" }}>
                                    <span style={{ color: T.t4 }}>MACD: <span style={{ color: T.accent }}>{d?.macd}</span></span>
                                    <span style={{ color: T.t4 }}>Signal: <span style={{ color: T.red }}>{d?.signal}</span></span>
                                  </div>
                                  <div style={{ color: d?.histogram >= 0 ? T.green : T.red, fontSize: 8, marginTop: 2 }}>
                                    Histogram: {d?.histogram > 0 ? "+" : ""}{d?.histogram} — {d?.histogram >= 0 ? "Bullish pressure" : "Bearish pressure"}
                                  </div>
                                  {cross && <div style={{ marginTop: 3, paddingTop: 3, borderTop: `1px solid ${T.bd}`, color: cross === "BULLISH" ? T.green : T.red, fontWeight: 700, fontSize: 9 }}>
                                    {cross === "BULLISH" ? "▲ Bullish crossover — MACD crossed above signal line" : "▼ Bearish crossover — MACD crossed below signal line"}
                                  </div>}
                                </div>
                              );
                            }} />
                            <Bar dataKey="histogram" radius={[1, 1, 0, 0]}>{macdSignals.map((d, i) => <Cell key={i} fill={d.histogram >= 0 ? `${T.green}60` : `${T.red}60`} />)}</Bar>
                            <Area type="monotone" dataKey="macd" stroke={T.accent} strokeWidth={1} fill="none" dot={false} />
                            <Area type="monotone" dataKey="signal" stroke={T.red} strokeWidth={1} fill="none" dot={false} strokeDasharray="3 2" />
                            {/* Crossover signals */}
                            <Scatter dataKey="macd" shape={(props) => {
                              const d = props.payload;
                              if (!d?.macdCross) return null;
                              const col = d.macdCross === "BULLISH" ? T.green : T.red;
                              return (
                                <g>
                                  <circle cx={props.cx} cy={props.cy} r={6} fill={col} stroke={T.sf} strokeWidth={1.5} />
                                  <text x={props.cx} y={props.cy + 3} textAnchor="middle" style={{ fontSize: 6, fill: "#fff", fontWeight: 800 }}>{d.macdCross === "BULLISH" ? "▲" : "▼"}</text>
                                </g>
                              );
                            }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px", marginTop: -1 }}>
                        <span style={{ fontSize: 8, color: T.t4 }}>MACD (12,26,9)</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: macdColor, fontFamily: MONO }}>{macdTrend}</span>
                      </div>
                    </div>
                  );
                })()}
                {/* Volume */}
                {timeRange === "24h" && <div style={{ height: 35, padding: "0 6px 0 0" }}>
                  {!loading && <ResponsiveContainer width="100%" height="100%"><BarChart data={mktData} margin={{ top: 0, right: 14, bottom: 0, left: 10 }}><XAxis dataKey="time" hide /><YAxis hide /><Bar dataKey="vol" radius={[1,1,0,0]}>{mktData.map((e,i) => <Cell key={i} fill={e.chg >= 0 ? `${T.green}25` : `${T.red}25`} />)}</Bar></BarChart></ResponsiveContainer>}
                </div>}
              </>}

              {/* MULTI CHART */}
              {dashTab === "multi" && <div style={{ padding: "10px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.t4, marginBottom: 8 }}>REGIONAL MARKETS</div>
                <MultiChartView region={region} T={T} />
              </div>}

              {/* ORDER BOOK */}
              {dashTab === "book" && <div style={{ padding: "10px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.t4, marginBottom: 4 }}>ORDER BOOK · {am.name}</div>
                <div style={{ textAlign: "center", padding: "6px 0", fontSize: 16, fontWeight: 800, fontFamily: MONO, color: T.t1 }}>{latest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <OrderBookWidget price={latest} T={T} />
              </div>}

              {/* News events legend */}
              {dashTab === "chart" && showNewsOnChart && newsOnChart.length > 0 && (
                <div style={{ borderTop: `1px solid ${T.bd}`, padding: "6px 14px" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: T.t4, marginBottom: 4 }}>EVENTS ON CHART</div>
                  {newsOnChart.map((n, i) => { const col = n.sentiment < -0.3 ? T.red : n.sentiment > 0.3 ? T.green : T.yellow; return (
                    <div key={i} onClick={() => setSelNews(n)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 5px", borderLeft: `3px solid ${col}`, marginBottom: 1, cursor: "pointer", borderRadius: 2, background: selNews?.id === n.id ? `${col}08` : "transparent" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: col, fontFamily: MONO, minWidth: 16 }}>{n.impact}</span>
                      <span style={{ fontSize: 8, color: T.t4, fontFamily: MONO, minWidth: 40 }}>{n.chartTime}</span>
                      <span style={{ fontSize: 10, color: T.t2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.headline}</span>
                    </div>
                  ); })}
                </div>
              )}

              {/* Country intel */}
              <div style={{ borderTop: `1px solid ${T.bd}`, padding: "8px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: T.t4 }}>COUNTRY INTELLIGENCE</span>
                  {selCountry && <button onClick={() => setSelCountry(null)} style={{ background: T.bg, border: `1px solid ${T.bd}`, color: T.t3, padding: "2px 6px", borderRadius: 3, cursor: "pointer", fontSize: 8 }}>Clear: {selCountry}</button>}
                </div>
                <CountryHeatmap region={region} news={news} selectedCountry={selCountry} onSelectCountry={setSelCountry} T={T} />
              </div>
              <div style={{ borderTop: `1px solid ${T.bd}` }}><ImpactPanel item={selNews} region={region} T={T} /></div>
            </div>

            {/* RIGHT: NEWS */}
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", background: T.sf }}>
              <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.t4 }}>{selCountry || "FEED"}</span>
                  <span style={{ fontSize: 8, color: T.t4, fontFamily: MONO }}>{filteredNews.length}/{news.length}</span>
                </div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {cats.map(c => <button key={c} onClick={() => setNFilter(c)} style={{ ...smBtn(nFilter === c), fontSize: 8, padding: "1px 5px", textTransform: "capitalize" }}>{c}</button>)}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredNews.map(it => <NewsCard key={it.id} item={it} isActive={selNews?.id === it.id} onClick={() => setSelNews(it)} T={T} />)}
                {!filteredNews.length && <div style={{ padding: 14, textAlign: "center", color: T.t4, fontSize: 11 }}>No headlines</div>}
              </div>
              <div style={{ padding: "5px 10px", borderTop: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", gap: 2, height: 4, borderRadius: 2, overflow: "hidden" }}>
                  {(() => { const ng = news.filter(n => n.sentiment < -.2).length; const nu = news.filter(n => n.sentiment >= -.2 && n.sentiment <= .2).length; const ps = news.filter(n => n.sentiment > .2).length; const t = news.length || 1; return <><div style={{ width: `${ng/t*100}%`, background: T.red }} /><div style={{ width: `${nu/t*100}%`, background: T.yellow }} /><div style={{ width: `${ps/t*100}%`, background: T.green }} /></>; })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}