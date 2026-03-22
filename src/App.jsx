import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as Recharts from "recharts";
import _ from "lodash";

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

function Globe({ regions, activeRegion, onSelect, scores, T }) {
  const [rot, setRot] = useState(0);
  const [hov, setHov] = useState(null);
  useEffect(() => { let f; const a = () => { setRot(r => (r + .12) % 360); f = requestAnimationFrame(a); }; if (!hov) f = requestAnimationFrame(a); return () => cancelAnimationFrame(f); }, [hov]);
  const proj = (lat, lng) => { const l = ((lng + rot) * Math.PI) / 180; const p = (lat * Math.PI) / 180; return { x: 200 + 135 * Math.cos(p) * Math.sin(l), y: 200 - 135 * Math.sin(p), vis: Math.cos(p) * Math.cos(l) > -.15, d: Math.cos(p) * Math.cos(l) }; };
  const grid = useMemo(() => { const L = []; for (let la = -60; la <= 60; la += 30) { const P = []; for (let lo = 0; lo <= 360; lo += 5) { const p = proj(la, lo - rot); if (p.vis) P.push(`${p.x},${p.y}`); else if (P.length > 1) { L.push(P.join(" ")); P.length = 0; } } if (P.length > 1) L.push(P.join(" ")); } for (let lo = -180; lo <= 180; lo += 30) { const P = []; for (let la = -80; la <= 80; la += 5) { const p = proj(la, lo); if (p.vis) P.push(`${p.x},${p.y}`); else if (P.length > 1) { L.push(P.join(" ")); P.length = 0; } } if (P.length > 1) L.push(P.join(" ")); } return L; }, [rot]);
  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 320, margin: "0 auto", display: "block" }}>
      <circle cx="200" cy="200" r="148" fill={T.sf} stroke={T.bd} />
      {grid.map((p, i) => <polyline key={i} points={p} fill="none" stroke={T.bd} strokeWidth=".5" />)}
      {Object.entries(regions).map(([n, c]) => { const p = proj(c.lat, c.lng); if (!p.vis) return null; const risk = scores[n] || 0; const isA = activeRegion === n; const isH = hov === n; const r = 4 + risk * 1.3; return (
        <g key={n} style={{ cursor: "pointer" }} onClick={() => onSelect(n)} onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)}>
          <circle cx={p.x} cy={p.y} r={isH || isA ? r + 2 : r} fill={c.color} opacity={(.35 + p.d * .6) * (isA ? 1 : .55)} stroke={isA ? T.t1 : "none"} strokeWidth={isA ? 1.5 : 0} style={{ transition: "all .2s" }} />
          <text x={p.x} y={p.y - r - 6} textAnchor="middle" style={{ fontSize: isH || isA ? 10 : 8, fill: isA ? c.color : T.t3, fontWeight: 700, fontFamily: FONT }}>{n}</text>
        </g>
      ); })}
    </svg>
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
          {["globe","dashboard","watchlist"].map(v => <button key={v} onClick={() => setView(v)} style={btn(view === v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.bd}`, borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 11, color: T.t2 }}>{theme === "dark" ? "☀" : "●"}</button>
        </div>
      </header>

      {/* GLOBE */}
      {view === "globe" && (
        <div className="fu" style={{ display: "grid", gridTemplateColumns: "1fr 320px", minHeight: "calc(100vh - 48px)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 14 }}>
            <Globe regions={REGIONS} activeRegion={region} onSelect={r => { setRegion(r); setActiveMarket(REGIONS[r].markets[0].ticker); setView("dashboard"); }} scores={scores} T={T} />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: 14, maxWidth: 600 }}>
              {Object.entries(REGIONS).map(([n, c]) => { const r = scores[n] || 0; return (
                <div key={n} onClick={() => { setRegion(n); setActiveMarket(REGIONS[n].markets[0].ticker); setView("dashboard"); }} style={{ padding: "6px 10px", background: T.sf, border: `1.5px solid ${region === n ? c.color + "35" : T.bd}`, borderRadius: 5, cursor: "pointer", minWidth: 105 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: c.color }} /><span style={{ fontSize: 10, fontWeight: 700, color: region === n ? c.color : T.t2 }}>{n}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ fontSize: 8, color: T.t4, fontFamily: MONO }}>{c.markets[0].name}</span><span style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: r > 6 ? T.red : r > 3 ? T.yellow : T.green }}>{r.toFixed(1)}</span></div>
                </div>
              ); })}
            </div>
          </div>
          <div style={{ borderLeft: `1px solid ${T.bd}`, display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", background: T.sf }}>
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.bd}`, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.t4 }}>{search ? `SEARCH: "${search}"` : "GLOBAL FEED"}</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {(search ? globalSearch : allNews.slice(0, 25)).map(it => (
                <div key={it.id} style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer" }} onClick={() => { setRegion(it.region); setActiveMarket(REGIONS[it.region].markets[0].ticker); setView("dashboard"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 9, fontWeight: 700, color: REGIONS[it.region]?.color }}>{it.region} · {it.country}</span><span style={{ fontSize: 8, color: T.t4, fontFamily: MONO }}>{new Date(it.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                  <p style={{ fontSize: 11, color: T.t2, margin: "1px 0", lineHeight: 1.3 }}>{it.headline}</p>
                </div>
              ))}
            </div>
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


              {/* LEARN SECTION */}
              <div style={{ borderTop: `1px solid ${T.bd}`, padding: "12px 16px" }}>
                <details style={{ cursor: "pointer" }}>
                  <summary style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.accent, marginBottom: 8, listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12 }}>📚</span> LEARN: TRADING FUNDAMENTALS
                    <span style={{ fontSize: 8, color: T.t4, fontWeight: 400, marginLeft: "auto" }}>click to expand</span>
                  </summary>
                  <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.6, fontFamily: FONT }}>
                    <div style={{ background: `${T.accent}08`, border: `1px solid ${T.accent}18`, borderRadius: 6, padding: "10px 12px", marginBottom: 14, fontSize: 10, color: T.accent }}>
                      <strong>⚠ Disclaimer:</strong> This is educational content only, not financial advice. Technical analysis describes probabilities, not certainties. Markets can and do behave contrary to any pattern. Always manage risk.
                    </div>

                    {/* 1. CANDLESTICK ANATOMY */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>1. What is a Candlestick?</div>
                      <p style={{ margin: "0 0 8px" }}>Each candlestick shows four data points for a time period: <strong>Open</strong> (starting price), <strong>High</strong> (peak), <strong>Low</strong> (trough), and <strong>Close</strong> (ending price).</p>
                      <svg viewBox="0 0 520 260" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        <line x1="100" y1="30" x2="100" y2="230" stroke={T.green} strokeWidth="2" />
                        <rect x="75" y="70" width="50" height="120" fill={T.green} rx="3" />
                        <line x1="130" y1="30" x2="158" y2="30" stroke={T.t3} strokeWidth="1" strokeDasharray="3 2" />
                        <text x="162" y="34" style={{ fontSize: 10, fill: T.t1, fontFamily: MONO, fontWeight: 700 }}>HIGH — Highest price reached</text>
                        <line x1="130" y1="70" x2="158" y2="60" stroke={T.t3} strokeWidth="1" strokeDasharray="3 2" />
                        <text x="162" y="63" style={{ fontSize: 10, fill: T.green, fontFamily: MONO, fontWeight: 700 }}>CLOSE — Price went UP, so close is on top</text>
                        <line x1="70" y1="190" x2="42" y2="190" stroke={T.t3} strokeWidth="1" strokeDasharray="3 2" />
                        <text x="5" y="188" style={{ fontSize: 10, fill: T.t2, fontFamily: MONO, fontWeight: 700 }}>OPEN</text>
                        <line x1="100" y1="230" x2="158" y2="230" stroke={T.t3} strokeWidth="1" strokeDasharray="3 2" />
                        <text x="162" y="234" style={{ fontSize: 10, fill: T.t1, fontFamily: MONO, fontWeight: 700 }}>LOW — Lowest price reached</text>
                        <text x="54" y="50" style={{ fontSize: 9, fill: T.t4, fontFamily: MONO }}>Upper Wick</text>
                        <text x="54" y="218" style={{ fontSize: 9, fill: T.t4, fontFamily: MONO }}>Lower Wick</text>
                        <text x="81" y="135" style={{ fontSize: 10, fill: "#fff", fontWeight: 700, fontFamily: MONO }}>BODY</text>
                        <text x="60" y="252" style={{ fontSize: 11, fill: T.green, fontWeight: 700 }}>BULLISH (Green) — Closed higher than open</text>
                        <line x1="360" y1="30" x2="360" y2="230" stroke={T.red} strokeWidth="2" />
                        <rect x="335" y="70" width="50" height="120" fill={T.red} rx="3" />
                        <text x="395" y="75" style={{ fontSize: 10, fill: T.red, fontFamily: MONO, fontWeight: 700 }}>OPEN (top)</text>
                        <text x="395" y="195" style={{ fontSize: 10, fill: T.red, fontFamily: MONO, fontWeight: 700 }}>CLOSE (bottom)</text>
                        <text x="320" y="252" style={{ fontSize: 11, fill: T.red, fontWeight: 700 }}>BEARISH (Red) — Closed lower than open</text>
                      </svg>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>The <strong>body</strong> = open-to-close range. The <strong>wicks</strong> = full range. A long upper wick means sellers pushed price back down. A long lower wick means buyers stepped in. Small body + long wicks = indecision.</p>
                    </div>

                    {/* 2. CANDLE PATTERNS */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>2. Key Candle Patterns</div>
                      <svg viewBox="0 0 520 190" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        <line x1="50" y1="30" x2="50" y2="155" stroke={T.t2} strokeWidth="2" /><rect x="40" y="90" width="20" height="4" fill={T.t2} rx="1" />
                        <text x="50" y="174" textAnchor="middle" style={{ fontSize: 10, fill: T.t1, fontWeight: 700 }}>Doji</text>
                        <text x="50" y="184" textAnchor="middle" style={{ fontSize: 8, fill: T.yellow }}>Indecision — neither side won</text>
                        <line x1="150" y1="50" x2="150" y2="155" stroke={T.green} strokeWidth="2" /><rect x="138" y="50" width="24" height="28" fill={T.green} rx="2" />
                        <text x="150" y="174" textAnchor="middle" style={{ fontSize: 10, fill: T.t1, fontWeight: 700 }}>Hammer</text>
                        <text x="150" y="184" textAnchor="middle" style={{ fontSize: 8, fill: T.green }}>Buyers fought back after a dip</text>
                        <line x1="250" y1="30" x2="250" y2="155" stroke={T.red} strokeWidth="2" /><rect x="238" y="125" width="24" height="28" fill={T.red} rx="2" />
                        <text x="250" y="174" textAnchor="middle" style={{ fontSize: 10, fill: T.t1, fontWeight: 700 }}>Shooting Star</text>
                        <text x="250" y="184" textAnchor="middle" style={{ fontSize: 8, fill: T.red }}>Sellers rejected the high</text>
                        <rect x="330" y="65" width="16" height="45" fill={T.red} rx="1" /><line x1="338" y1="55" x2="338" y2="120" stroke={T.red} strokeWidth="1.5" />
                        <rect x="352" y="40" width="24" height="80" fill={T.green} rx="2" /><line x1="364" y1="28" x2="364" y2="130" stroke={T.green} strokeWidth="1.5" />
                        <text x="350" y="174" textAnchor="middle" style={{ fontSize: 10, fill: T.t1, fontWeight: 700 }}>Bullish Engulfing</text>
                        <text x="350" y="184" textAnchor="middle" style={{ fontSize: 8, fill: T.green }}>Green completely covers red</text>
                        <rect x="440" y="60" width="16" height="45" fill={T.green} rx="1" /><line x1="448" y1="50" x2="448" y2="115" stroke={T.green} strokeWidth="1.5" />
                        <rect x="462" y="35" width="24" height="85" fill={T.red} rx="2" /><line x1="474" y1="25" x2="474" y2="130" stroke={T.red} strokeWidth="1.5" />
                        <text x="460" y="174" textAnchor="middle" style={{ fontSize: 10, fill: T.t1, fontWeight: 700 }}>Bearish Engulfing</text>
                        <text x="460" y="184" textAnchor="middle" style={{ fontSize: 8, fill: T.red }}>Red completely covers green</text>
                      </svg>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>Patterns suggest possible moves but require context. A hammer after a downtrend may signal reversal — but the next candle needs to confirm. One candle alone is never enough.</p>
                    </div>

                    {/* 3. MOVING AVERAGES */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>3. Moving Averages (MA)</div>
                      <p style={{ margin: "0 0 8px" }}>A moving average smooths price data to reveal the trend. A <strong>fast MA</strong> (e.g. 20-period, gold line) reacts quickly. A <strong>slow MA</strong> (e.g. 50-period, red dashed) shows the bigger picture. When they cross, momentum may be shifting.</p>
                      <svg viewBox="0 0 520 200" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        {[40,55,45,60,50,65,70,55,75,80,85,75,90,95,88,100,95,105,110,102,115,120,110,125].map((v, i) => {
                          const x = 20 + i * 20; const y = 180 - v * 1.5; const h = 8 + Math.random() * 8;
                          const up = i > 0 && v > [40,55,45,60,50,65,70,55,75,80,85,75,90,95,88,100,95,105,110,102,115,120,110,125][i-1];
                          return <rect key={i} x={x-3} y={y} width={6} height={h} fill={up ? T.green : T.red} rx={1} opacity={0.4} />;
                        })}
                        <polyline points="30,148 50,132 70,138 90,125 110,130 130,118 150,112 170,128 190,108 210,100 230,92 250,105 270,85 290,78 310,88 330,72 350,80 370,65 390,58 410,68 430,52 450,45 470,55 490,40" fill="none" stroke={T.accent} strokeWidth="2" />
                        <polyline points="30,155 50,150 70,148 90,142 110,140 130,135 150,130 170,128 190,122 210,118 230,112 250,108 270,102 290,98 310,95 330,90 350,85 370,80 390,76 410,72 430,68 450,64 470,60 490,58" fill="none" stroke={T.red} strokeWidth="2" strokeDasharray="6 3" />
                        <circle cx="170" cy="128" r="8" fill="none" stroke={T.yellow} strokeWidth="2" />
                        <text x="178" y="145" style={{ fontSize: 9, fill: T.yellow, fontWeight: 700 }}>Crossover — momentum may be shifting</text>
                        <line x1="20" y1="15" x2="40" y2="15" stroke={T.accent} strokeWidth="2" /><text x="44" y="18" style={{ fontSize: 9, fill: T.t2 }}>Fast MA (20)</text>
                        <line x1="130" y1="15" x2="150" y2="15" stroke={T.red} strokeWidth="2" strokeDasharray="4 2" /><text x="154" y="18" style={{ fontSize: 9, fill: T.t2 }}>Slow MA (50)</text>
                      </svg>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>When price stays above the MA, trend is generally up. Crossovers can lag — by the time you see one, the move may be partly over. Best used to confirm direction, not to time entries precisely.</p>
                    </div>

                    {/* 4. SUPPORT & RESISTANCE + BREAKOUTS */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>4. Support, Resistance & Breakouts</div>
                      <svg viewBox="0 0 520 200" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        <line x1="20" y1="50" x2="500" y2="50" stroke={T.red} strokeWidth="1.5" strokeDasharray="6 3" />
                        <rect x="20" y="42" width="78" height="14" rx="3" fill={`${T.red}18`} /><text x="24" y="52" style={{ fontSize: 9, fill: T.red, fontWeight: 700 }}>RESISTANCE</text>
                        <line x1="20" y1="150" x2="500" y2="150" stroke={T.green} strokeWidth="1.5" strokeDasharray="6 3" />
                        <rect x="20" y="142" width="62" height="14" rx="3" fill={`${T.green}18`} /><text x="24" y="152" style={{ fontSize: 9, fill: T.green, fontWeight: 700 }}>SUPPORT</text>
                        <polyline points="40,100 70,60 90,55 100,58 130,140 150,145 160,142 190,60 220,55 240,58 270,140 290,145 310,142 340,60 370,55 390,65 410,50 430,42 450,38" fill="none" stroke={T.t1} strokeWidth="1.5" />
                        <text x="88" y="48" style={{ fontSize: 10, fill: T.red }}>↓ Rejected</text>
                        <text x="148" y="165" style={{ fontSize: 10, fill: T.green }}>↑ Bounced</text>
                        <text x="390" y="32" style={{ fontSize: 10, fill: T.yellow, fontWeight: 700 }}>BREAKOUT</text>
                        <rect x="385" y="35" width="70" height="12" rx="3" fill={`${T.yellow}15`} /><text x="389" y="44" style={{ fontSize: 8, fill: T.yellow }}>Above resistance</text>
                        <text x="20" y="190" style={{ fontSize: 9, fill: T.t3 }}>Price bounces between levels until one breaks. False breakouts are common — always wait for confirmation.</text>
                      </svg>
                    </div>

                    {/* 5. FAIR VALUE GAP */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>5. Fair Value Gap (FVG)</div>
                      <svg viewBox="0 0 520 220" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        <line x1="120" y1="140" x2="120" y2="190" stroke={T.green} strokeWidth="2" /><rect x="108" y="140" width="24" height="35" fill={T.green} rx="2" />
                        <text x="120" y="207" textAnchor="middle" style={{ fontSize: 9, fill: T.t4 }}>Candle 1</text>
                        <line x1="200" y1="40" x2="200" y2="130" stroke={T.green} strokeWidth="2" /><rect x="188" y="40" width="24" height="70" fill={T.green} rx="2" />
                        <text x="200" y="207" textAnchor="middle" style={{ fontSize: 9, fill: T.t4 }}>Candle 2</text>
                        <text x="200" y="28" textAnchor="middle" style={{ fontSize: 9, fill: T.green, fontWeight: 700 }}>Big aggressive move!</text>
                        <line x1="280" y1="30" x2="280" y2="80" stroke={T.green} strokeWidth="2" /><rect x="268" y="30" width="24" height="35" fill={T.green} rx="2" />
                        <text x="280" y="207" textAnchor="middle" style={{ fontSize: 9, fill: T.t4 }}>Candle 3</text>
                        <rect x="135" y="80" width="130" height="60" fill={`${T.purple}15`} stroke={T.purple} strokeWidth="1" strokeDasharray="4 2" rx="4" />
                        <text x="200" y="112" textAnchor="middle" style={{ fontSize: 11, fill: T.purple, fontWeight: 700 }}>FAIR VALUE GAP</text>
                        <text x="200" y="127" textAnchor="middle" style={{ fontSize: 8, fill: T.t3 }}>No trading happened here — gap between candle 1 high and candle 3 low</text>
                        <path d="M 330,50 Q 390,50 390,100 Q 390,120 345,115" fill="none" stroke={T.yellow} strokeWidth="1.5" strokeDasharray="4 2" markerEnd="none" />
                        <text x="398" y="90" style={{ fontSize: 9, fill: T.yellow }}>Price may return</text>
                        <text x="398" y="102" style={{ fontSize: 9, fill: T.yellow }}>to fill this gap</text>
                      </svg>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>FVGs form during aggressive moves. They represent "unfair" pricing where one side dominated. Price often revisits these zones — but in strong trends, they may never fill. Not all gaps are created equal.</p>
                    </div>

                    {/* 6. RSI */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>6. RSI (Relative Strength Index)</div>
                      <svg viewBox="0 0 520 165" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        <rect x="20" y="10" width="480" height="30" fill={`${T.red}10`} /><rect x="20" y="120" width="480" height="35" fill={`${T.green}10`} />
                        <text x="30" y="28" style={{ fontSize: 9, fill: T.red, fontWeight: 700 }}>OVERBOUGHT (above 70) — may slow/reverse</text>
                        <text x="30" y="142" style={{ fontSize: 9, fill: T.green, fontWeight: 700 }}>OVERSOLD (below 30) — selling may be exhausted</text>
                        <line x1="20" y1="40" x2="500" y2="40" stroke={T.red} strokeWidth=".5" strokeDasharray="4 2" />
                        <line x1="20" y1="120" x2="500" y2="120" stroke={T.green} strokeWidth=".5" strokeDasharray="4 2" />
                        <text x="504" y="43" style={{ fontSize: 8, fill: T.red }}>70</text><text x="504" y="123" style={{ fontSize: 8, fill: T.green }}>30</text>
                        <polyline points="30,80 60,70 90,55 120,35 150,28 180,38 210,60 240,75 270,90 300,110 330,128 360,132 390,118 420,95 450,70 480,55" fill="none" stroke={T.purple} strokeWidth="2" />
                        <circle cx="150" cy="28" r="5" fill={T.red} /><text x="160" y="22" style={{ fontSize: 8, fill: T.red }}>Overbought signal</text>
                        <circle cx="360" cy="132" r="5" fill={T.green} /><text x="310" y="155" style={{ fontSize: 8, fill: T.green }}>Oversold signal</text>
                      </svg>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>RSI shows momentum speed, NOT price direction. In strong trends it can stay overbought/oversold for weeks. Most useful in ranging/sideways markets. Always combine with other analysis.</p>
                    </div>

                    {/* 7. MACD */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 6 }}>7. MACD (Moving Average Convergence Divergence)</div>
                      <svg viewBox="0 0 520 165" style={{ width: "100%", background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, marginBottom: 6 }}>
                        <line x1="20" y1="80" x2="500" y2="80" stroke={T.t4} strokeWidth=".5" /><text x="504" y="83" style={{ fontSize: 8, fill: T.t4 }}>0</text>
                        {[5,8,12,15,10,6,2,-3,-8,-12,-15,-10,-6,-2,3,8,14,18,12,8].map((v, i) => (
                          <rect key={i} x={30 + i * 23} y={v > 0 ? 80 - v * 3 : 80} width={16} height={Math.abs(v) * 3} fill={v >= 0 ? `${T.green}50` : `${T.red}50`} rx={1} />
                        ))}
                        <polyline points="38,50 61,42 84,35 107,30 130,38 153,48 176,58 199,72 222,90 245,98 268,105 291,95 314,82 337,70 360,62 383,45 406,32 429,25 452,35 475,45" fill="none" stroke={T.accent} strokeWidth="2" />
                        <polyline points="38,55 61,50 84,45 107,40 130,42 153,48 176,55 199,65 222,80 245,90 268,98 291,95 314,88 337,78 360,68 383,55 406,42 429,35 452,38 475,42" fill="none" stroke={T.red} strokeWidth="1.5" strokeDasharray="4 2" />
                        <circle cx="176" cy="57" r="7" fill="none" stroke={T.yellow} strokeWidth="2" /><text x="184" y="50" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>Bearish crossover</text>
                        <circle cx="337" cy="74" r="7" fill="none" stroke={T.yellow} strokeWidth="2" /><text x="345" y="67" style={{ fontSize: 8, fill: T.yellow, fontWeight: 700 }}>Bullish crossover</text>
                        <line x1="30" y1="152" x2="50" y2="152" stroke={T.accent} strokeWidth="2" /><text x="54" y="155" style={{ fontSize: 8, fill: T.t2 }}>MACD line</text>
                        <line x1="130" y1="152" x2="150" y2="152" stroke={T.red} strokeWidth="1.5" strokeDasharray="4 2" /><text x="154" y="155" style={{ fontSize: 8, fill: T.t2 }}>Signal line</text>
                        <text x="240" y="155" style={{ fontSize: 8, fill: T.t3 }}>Histogram = gap between lines (momentum strength)</text>
                      </svg>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>MACD crossovers indicate momentum shifts. Growing histogram = strengthening trend. Shrinking = fading. Crossovers are lagging — they confirm what happened, not predict what's next.</p>
                    </div>

                    {/* WHY PATTERNS FAIL */}
                    <div style={{ background: `${T.purple}08`, border: `1px solid ${T.purple}18`, borderRadius: 6, padding: "12px 14px", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: T.purple, marginBottom: 6 }}>Why patterns fail — and why that's normal</div>
                      <p style={{ margin: "0 0 6px", color: T.t2 }}>Every pattern visible on your chart is also visible to algorithms, institutions, and millions of other traders. Sometimes they trade with the pattern. Sometimes they deliberately trade against it — large players may push price through support to trigger stop-losses, then reverse.</p>
                      <p style={{ margin: "0 0 6px", color: T.t2 }}>Unexpected events — a central bank surprise, a geopolitical shock, an earnings miss — can override any technical setup instantly. The market doesn't know or care about your lines.</p>
                      <p style={{ margin: 0, color: T.t3, fontSize: 10 }}>The best approach: treat every pattern as a probability, not a certainty. Use multiple confirming signals. Define your risk before acting. Accept that being wrong is part of the process — the goal is good process, not perfect prediction.</p>
                    </div>
                  </div>
                </details>
              </div>
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