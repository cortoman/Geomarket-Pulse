import { useState, useEffect, useCallback, useMemo } from "react";
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
    const chg = (r - 0.48) * vol * p + shock * vol * p; p += chg;
    data.push({ time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ts, price: +(p.toFixed(2)), vol: +(Math.abs(chg / p * 1e4).toFixed(2)), chg: +(chg.toFixed(2)) });
  }
  return data;
}

function genHistorical(base, days = 90) {
  let p = base * 0.95;
  return Array.from({ length: days + 1 }, (_, i) => {
    p += (Math.random() - 0.47) * 0.012 * p;
    return { date: new Date(Date.now() - (days - i) * 864e5).toLocaleDateString([], { month: "short", day: "numeric" }), price: +(p.toFixed(2)) };
  });
}

function genNews(region) {
  const t = NEWS_DB[region] || []; const now = Date.now();
  return t.map((n, i) => ({ ...n, id: `${region}-${i}`, ts: now - Math.random() * 864e5, source: ["Reuters", "Bloomberg", "FT", "AP", "BBC", "WSJ", "Al Jazeera", "SCMP", "Nikkei", "Economist"][i % 10], region })).sort((a, b) => b.ts - a.ts);
}

function riskScore(news) {
  if (!news.length) return 0;
  const neg = news.filter(n => n.sentiment < -0.3).length;
  const ai = news.reduce((s, n) => s + n.impact, 0) / news.length;
  const sa = Math.abs(news.reduce((s, n) => s + n.sentiment, 0) / news.length);
  return Math.min(10, +((neg / news.length * 4 + ai / 10 * 3 + sa * 3).toFixed(1)));
}

/* ═══ STYLES ═══ */
const S = { mono: "'JetBrains Mono',monospace", sans: "'DM Sans',system-ui,sans-serif", bg: "#080910", sf: "#0E1017", bd: "rgba(255,255,255,0.06)", t1: "rgba(255,255,255,0.9)", t2: "rgba(255,255,255,0.6)", t3: "rgba(255,255,255,0.35)", t4: "rgba(255,255,255,0.2)" };

/* ═══ TINY COMPONENTS ═══ */
const Badge = ({ children, color, small }) => <span style={{ fontSize: small ? 8 : 9, fontWeight: 700, letterSpacing: 1.2, color, background: `${color}15`, padding: small ? "1px 5px" : "2px 7px", borderRadius: 3, border: `1px solid ${color}30`, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
const SentBadge = ({ v }) => { const c = v > .2 ? "#4ADE80" : v < -.2 ? "#F87171" : "#FBBF24"; return <Badge color={c}>{v > .2 ? "pos" : v < -.2 ? "neg" : "neu"}</Badge>; };

function RiskGauge({ score, size = "normal" }) {
  const pct = score / 10; const hue = 120 - pct * 120; const c = `hsl(${hue},75%,50%)`;
  const lbl = score <= 3 ? "LOW" : score <= 6 ? "MODERATE" : score <= 8 ? "HIGH" : "CRITICAL";
  const w = size === "sm" ? 80 : 120; const h = size === "sm" ? 44 : 64;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: w, height: h, margin: "0 auto" }}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          <path d={`M ${w * .08} ${h * .92} A ${w * .42} ${w * .42} 0 0 1 ${w * .92} ${h * .92}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size === "sm" ? 4 : 7} strokeLinecap="round" />
          <path d={`M ${w * .08} ${h * .92} A ${w * .42} ${w * .42} 0 0 1 ${w * .92} ${h * .92}`} fill="none" stroke={c} strokeWidth={size === "sm" ? 4 : 7} strokeLinecap="round" strokeDasharray={`${pct * w * 1.32} ${w * 1.32}`} style={{ filter: `drop-shadow(0 0 5px ${c})`, transition: "all 0.8s" }} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center" }}><span style={{ fontSize: size === "sm" ? 16 : 22, fontWeight: 800, color: c, fontFamily: S.mono }}>{score.toFixed(1)}</span></div>
      </div>
      <div style={{ marginTop: 2, fontSize: size === "sm" ? 7 : 8, fontWeight: 700, letterSpacing: 2, color: c, padding: "1px 5px", border: `1px solid ${c}40`, display: "inline-block", borderRadius: 2 }}>{lbl}</div>
    </div>
  );
}

/* ═══ REGIONAL MAP ═══ */

function RegionalMap({ region, news, selectedCountry, onSelectCountry }) {
  const cfg = REGIONS[region];
  const { minLat, maxLat, minLng, maxLng } = cfg.mapBounds;
  const W = 500, H = 320;
  const project = (lat, lng) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * W,
    y: ((maxLat - lat) / (maxLat - minLat)) * H,
  });

  const countryNews = useMemo(() => {
    const map = {};
    cfg.countries.forEach(c => { map[c.name] = news.filter(n => n.country === c.name); });
    return map;
  }, [news, cfg.countries]);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 300, display: "block" }}>
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="50%"><stop offset="0%" stopColor={`${cfg.color}08`} /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <filter id="mapGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={W} height={H} fill="url(#mapBg)" rx="8" />
        {/* grid */}
        {Array.from({ length: 6 }, (_, i) => { const x = (i + 1) * W / 7; return <line key={`gv${i}`} x1={x} y1={0} x2={x} y2={H} stroke="rgba(255,255,255,0.03)" />; })}
        {Array.from({ length: 4 }, (_, i) => { const y = (i + 1) * H / 5; return <line key={`gh${i}`} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.03)" />; })}
        {/* connections between countries with news */}
        {cfg.countries.filter(c => (countryNews[c.name]?.length || 0) > 0).map((c, i, arr) => {
          if (i === 0) return null;
          const p1 = project(arr[i - 1].lat, arr[i - 1].lng);
          const p2 = project(c.lat, c.lng);
          return <line key={`conn${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={`${cfg.color}15`} strokeWidth="1" strokeDasharray="4 4" />;
        })}
        {/* country dots */}
        {cfg.countries.map(c => {
          const p = project(c.lat, c.lng);
          const nCount = countryNews[c.name]?.length || 0;
          const hasNeg = (countryNews[c.name] || []).some(n => n.sentiment < -0.3);
          const isActive = selectedCountry === c.name;
          const r = 4 + nCount * 2;
          const dotColor = hasNeg ? "#F87171" : nCount > 0 ? cfg.color : "rgba(255,255,255,0.15)";
          return (
            <g key={c.name} style={{ cursor: "pointer" }} onClick={() => onSelectCountry(isActive ? null : c.name)}>
              {nCount > 0 && <circle cx={p.x} cy={p.y} r={r + 6} fill={dotColor} opacity={0.08}>
                <animate attributeName="r" values={`${r + 3};${r + 12};${r + 3}`} dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values=".1;.02;.1" dur="3s" repeatCount="indefinite" />
              </circle>}
              <circle cx={p.x} cy={p.y} r={isActive ? r + 2 : r} fill={dotColor} opacity={isActive ? 1 : 0.7} stroke={isActive ? "#fff" : "none"} strokeWidth={isActive ? 1.5 : 0} filter={isActive ? "url(#mapGlow)" : undefined} style={{ transition: "all 0.2s" }} />
              <text x={p.x} y={p.y - r - 6} textAnchor="middle" style={{ fontSize: isActive ? 10 : 9, fill: isActive ? "#fff" : S.t3, fontWeight: isActive ? 700 : 500, fontFamily: S.sans }}>{c.name}</text>
              {nCount > 0 && <text x={p.x} y={p.y + 3.5} textAnchor="middle" style={{ fontSize: 8, fill: "#fff", fontWeight: 800, fontFamily: S.mono }}>{nCount}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══ MARKETS STRIP ═══ */

function MarketsStrip({ region, activeMarket, onSelect }) {
  const markets = REGIONS[region].markets;
  return (
    <div style={{ display: "flex", gap: 3, overflow: "auto", padding: "0 0 2px" }}>
      {markets.map(m => {
        const chg = ((Math.sin(m.base * 0.01) + 1) / 2 * 3 - 1).toFixed(2);
        const up = parseFloat(chg) >= 0;
        const isA = activeMarket === m.ticker;
        return (
          <div key={m.ticker} onClick={() => onSelect(m.ticker)} style={{ flex: "0 0 auto", minWidth: 120, padding: "6px 10px", background: isA ? `${REGIONS[region].color}12` : "rgba(255,255,255,0.02)", border: `1px solid ${isA ? REGIONS[region].color + "40" : S.bd}`, borderRadius: 5, cursor: "pointer", transition: "all .15s" }}>
            <div style={{ fontSize: 8, color: S.t4, fontWeight: 700, letterSpacing: 1, marginBottom: 1 }}>{m.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: isA ? S.t1 : S.t2, fontFamily: S.mono }}>{m.base.toLocaleString()}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: up ? "#4ADE80" : "#F87171", fontFamily: S.mono }}>{up ? "▲" : "▼"}{chg}%</span>
            </div>
            <div style={{ fontSize: 8, color: S.t4, marginTop: 1 }}>{m.country}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ COMMODITIES STRIP ═══ */

function CommodityStrip({ region }) {
  return (
    <div style={{ display: "flex", gap: 2, overflow: "auto" }}>
      {REGIONS[region].commodities.map(c => {
        const chg = ((Math.sin(c.base * 0.1) + 1) / 2 * 4 - 1.5).toFixed(2);
        const up = parseFloat(chg) >= 0;
        return (
          <div key={c.name} style={{ flex: 1, minWidth: 110, padding: "5px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
            <div style={{ fontSize: 8, color: S.t4, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{c.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.t1, fontFamily: S.mono }}>{c.base.toLocaleString()}</span>
              {c.unit && <span style={{ fontSize: 9, color: S.t4 }}>{c.unit}</span>}
              <span style={{ fontSize: 9, fontWeight: 600, color: up ? "#4ADE80" : "#F87171", fontFamily: S.mono, marginLeft: "auto" }}>{up ? "▲" : "▼"}{chg}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ NEWS CARD ═══ */

function NewsCard({ item, isActive, onClick }) {
  const bc = item.sentiment < -0.3 ? "#F87171" : item.sentiment > 0.3 ? "#4ADE80" : "#FBBF24";
  return (
    <div onClick={onClick} style={{ padding: "7px 12px", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.04)" : "transparent", borderLeft: `3px solid ${isActive ? bc : "transparent"}`, transition: "all .15s", borderBottom: `1px solid ${S.bd}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 8, color: S.t4, fontWeight: 700, letterSpacing: 1 }}>{item.source}</span>
          {item.category && <Badge color={S.t3} small>{item.category}</Badge>}
          {item.country && <span style={{ fontSize: 8, color: S.t4 }}>· {item.country}</span>}
        </div>
        <span style={{ fontSize: 8, color: S.t4, fontFamily: S.mono }}>{new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <p style={{ fontSize: 11, lineHeight: 1.4, color: isActive ? S.t1 : "rgba(255,255,255,0.72)", margin: "2px 0 4px", fontWeight: 500 }}>{item.headline}</p>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <SentBadge v={item.sentiment} />
        <span style={{ fontSize: 8, color: S.t4, fontFamily: S.mono }}>IMPACT {item.impact}/10</span>
      </div>
    </div>
  );
}

/* ═══ IMPACT ANALYSIS ═══ */

function ImpactPanel({ item, region }) {
  if (!item) return <div style={{ padding: 16, textAlign: "center", color: S.t4, fontSize: 11 }}>Select a headline for AI impact analysis</div>;
  const cfg = REGIONS[region];
  const lines = {
    "Middle East": ["Oil supply risk drives futures higher. Energy importers face margin compression.", "Shipping/logistics reprices risk. Defense procurement accelerates.", "Gold and USD strengthen on safe-haven flow. Regional FX weakens."],
    "East Asia": ["Semiconductor supply disruption lifts chip prices globally. Tech indices exposed.", "Manufacturing PMIs contract. Nearshoring beneficiaries gain FDI.", "JPY and Treasuries strengthen. EM currencies sell off."],
    Europe: ["Energy costs squeeze industrials. Renewables and defense diverge.", "ECB faces stagflation dilemma. Periphery bond spreads widen.", "Defense spending accelerates. Banks reassess geographic credit risk."],
    "North America": ["VIX spikes on uncertainty. Defensives outperform cyclicals.", "USD direction depends on scope — US-centric weakens, global strengthens.", "Fed may front-load cuts if growth threatened."],
    Africa: ["Commodity constraints hit EU manufacturers. Mining equities reprice.", "Sovereign spreads widen. DFIs may provide emergency credit.", "PGMs and rare earths attract speculative positioning."],
    "South America": ["Commodity revenues face FX volatility. CBs intervene on currency.", "Political risk triggers capital flight. Local equities face redemptions.", "Lithium/copper supply uncertainty ripples through EV and infra sectors."],
    "South Asia": ["IT services resilience supports index. Infra spending drives materials demand.", "CB intervention stabilizes currency. Yields rise on inflation pass-through.", "Regional trade disrupted. Supply chain diversification accelerates."],
  }[region] || ["Analyzing...", "", ""];
  return (
    <div style={{ padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#A78BFA", boxShadow: "0 0 6px #A78BFA" }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#A78BFA" }}>AI IMPACT ANALYSIS</span>
      </div>
      <div style={{ fontSize: 10.5, color: S.t2, padding: "6px 10px", background: "rgba(167,139,250,0.06)", borderRadius: 4, border: "1px solid rgba(167,139,250,0.1)", marginBottom: 8, lineHeight: 1.4 }}>
        <strong style={{ color: S.t1 }}>Event:</strong> {item.headline}
        {item.country && <span style={{ color: S.t3 }}> ({item.country})</span>}
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 8, color: "#A78BFA", fontWeight: 800, fontFamily: S.mono, minWidth: 36, marginTop: 1 }}>{["MARKET", "SECTOR", "MACRO"][i]}</span>
          <p style={{ fontSize: 10, color: S.t3, lineHeight: 1.45, margin: 0 }}>{l}</p>
        </div>
      ))}
      <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap" }}>
        {cfg.markets.slice(0, 3).map(m => <span key={m.ticker} style={{ fontSize: 8, padding: "2px 6px", background: "rgba(255,255,255,0.04)", borderRadius: 3, color: S.t3, fontFamily: S.mono }}>{m.ticker}</span>)}
        {cfg.commodities.map(c => <span key={c.name} style={{ fontSize: 8, padding: "2px 6px", background: "rgba(255,255,255,0.04)", borderRadius: 3, color: S.t3, fontFamily: S.mono }}>{c.name}</span>)}
      </div>
    </div>
  );
}

/* ═══ GLOBE ═══ */

function Globe({ regions, activeRegion, onSelect, scores }) {
  const [rot, setRot] = useState(0);
  const [hov, setHov] = useState(null);
  useEffect(() => { let f; const a = () => { setRot(r => (r + .12) % 360); f = requestAnimationFrame(a); }; if (!hov) f = requestAnimationFrame(a); return () => cancelAnimationFrame(f); }, [hov]);
  const proj = (lat, lng) => { const l = ((lng + rot) * Math.PI) / 180; const p = (lat * Math.PI) / 180; return { x: 200 + 135 * Math.cos(p) * Math.sin(l), y: 200 - 135 * Math.sin(p), vis: Math.cos(p) * Math.cos(l) > -.15, d: Math.cos(p) * Math.cos(l) }; };
  const grid = useMemo(() => { const L = []; for (let la = -60; la <= 60; la += 30) { const P = []; for (let lo = 0; lo <= 360; lo += 5) { const p = proj(la, lo - rot); if (p.vis) P.push(`${p.x},${p.y}`); else if (P.length > 1) { L.push(P.join(" ")); P.length = 0; } } if (P.length > 1) L.push(P.join(" ")); } for (let lo = -180; lo <= 180; lo += 30) { const P = []; for (let la = -80; la <= 80; la += 5) { const p = proj(la, lo); if (p.vis) P.push(`${p.x},${p.y}`); else if (P.length > 1) { L.push(P.join(" ")); P.length = 0; } } if (P.length > 1) L.push(P.join(" ")); } return L; }, [rot]);

  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "block" }}>
      <defs><radialGradient id="gg" cx="35%" cy="35%"><stop offset="0%" stopColor="rgba(255,255,255,0.04)" /><stop offset="100%" stopColor="rgba(0,0,0,0.35)" /></radialGradient><filter id="gl"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <circle cx="200" cy="200" r="148" fill="url(#gg)" stroke="rgba(255,255,255,0.06)" />
      {grid.map((p, i) => <polyline key={i} points={p} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth=".5" />)}
      {Object.entries(regions).map(([n, c]) => { const p = proj(c.lat, c.lng); if (!p.vis) return null; const risk = scores[n] || 0; const isA = activeRegion === n; const isH = hov === n; const r = 4 + risk * 1.5; return (
        <g key={n} style={{ cursor: "pointer" }} onClick={() => onSelect(n)} onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)}>
          {risk > 0 && <circle cx={p.x} cy={p.y} r={r + 8} fill={c.color} opacity={.05}><animate attributeName="r" values={`${r + 3};${r + 14};${r + 3}`} dur="3s" repeatCount="indefinite" /></circle>}
          <circle cx={p.x} cy={p.y} r={isH || isA ? r + 2 : r} fill={c.color} opacity={(.4 + p.d * .6) * (isA ? 1 : .65)} stroke={isA ? c.color : "none"} strokeWidth={isA ? 2 : 0} filter={isA ? "url(#gl)" : undefined} style={{ transition: "all .25s" }} />
          <text x={p.x} y={p.y - r - 7} textAnchor="middle" style={{ fontSize: isH || isA ? 10 : 8, fill: isA ? c.color : `rgba(255,255,255,${(.4 + p.d * .6) * .7})`, fontWeight: 700, fontFamily: S.sans }}>{n}</text>
          {(isH || isA) && <text x={p.x} y={p.y + r + 12} textAnchor="middle" style={{ fontSize: 9, fill: S.t3, fontFamily: S.mono }}>{risk.toFixed(1)}</text>}
        </g>
      ); })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */

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
  const [showNewsOnChart, setShowNewsOnChart] = useState(false);
  const [activeMarket, setActiveMarket] = useState(null);
  const [selCountry, setSelCountry] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true); setSelNews(null); setSelCountry(null);
    setTimeout(() => {
      const cfg = REGIONS[region];
      const am = activeMarket ? cfg.markets.find(m => m.ticker === activeMarket) : cfg.markets[0];
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
    if (search && view === "dashboard") { const q = search.toLowerCase(); items = items.filter(n => n.headline.toLowerCase().includes(q) || (n.country || "").toLowerCase().includes(q) || (n.category || "").toLowerCase().includes(q)); }
    return items;
  }, [news, nFilter, search, view, selCountry]);

  const cats = useMemo(() => ["all", ...new Set(news.map(n => n.category).filter(Boolean))], [news]);
  const chartData = timeRange === "24h" ? mktData : timeRange === "7d" ? histData.slice(-8) : timeRange === "30d" ? histData.slice(-31) : histData;
  const chartKey = timeRange === "24h" ? "time" : "date";

  // News events mapped to chart timestamps
  const newsOnChart = useMemo(() => {
    if (!showNewsOnChart || timeRange !== "24h" || !mktData.length) return [];
    return news.filter(n => n.impact >= 5).map(n => {
      const nTime = new Date(n.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const match = mktData.find(d => d.time === nTime);
      if (!match) return null;
      return { ...n, chartTime: nTime, chartPrice: match.price };
    }).filter(Boolean);
  }, [showNewsOnChart, timeRange, mktData, news]);

  const globalSearch = useMemo(() => {
    if (!search || view !== "globe") return [];
    const q = search.toLowerCase();
    return allNews.filter(n => n.headline.toLowerCase().includes(q) || n.region.toLowerCase().includes(q) || (n.country || "").toLowerCase().includes(q)).slice(0, 15);
  }, [search, allNews, view]);

  return (
    <div style={{ fontFamily: S.sans, background: S.bg, color: "#fff", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}.fu{animation:fadeUp .25s ease both}input::placeholder{color:rgba(255,255,255,0.2)}`}</style>

      {/* ─── HEADER ─── */}
      <header style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${S.bd}`, background: "rgba(255,255,255,0.015)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 10px ${cfg.color}80`, animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: -.5 }}>GEOMARKET</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: S.t4 }}>PULSE</span>
          <span style={{ fontSize: 9, color: S.t4, fontFamily: S.mono, marginLeft: 4 }}>{clock}</span>
        </div>
        <div style={{ position: "relative", flex: "0 1 240px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search news, countries..."
            style={{ width: "100%", padding: "5px 10px 5px 24px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.bd}`, borderRadius: 4, color: S.t1, fontSize: 11, fontFamily: S.sans, outline: "none" }} />
          <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: S.t4 }}>⌕</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["globe", "dashboard", "watchlist"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${view === v ? "rgba(255,255,255,0.12)" : "transparent"}`, color: view === v ? S.t1 : S.t3, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: S.sans }}>{v}</button>
          ))}
        </div>
      </header>

      {/* ═══ GLOBE VIEW ═══ */}
      {view === "globe" && (
        <div className="fu" style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 46px)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: S.t4, marginBottom: 4 }}>GLOBAL GEOPOLITICAL RISK</div>
            <Globe regions={REGIONS} activeRegion={region} onSelect={r => { setRegion(r); setActiveMarket(REGIONS[r].markets[0].ticker); setView("dashboard"); }} scores={scores} />
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center", marginTop: 14, maxWidth: 640 }}>
              {Object.entries(REGIONS).map(([n, c]) => { const r = scores[n] || 0; return (
                <div key={n} onClick={() => { setRegion(n); setActiveMarket(REGIONS[n].markets[0].ticker); setView("dashboard"); }} style={{ padding: "6px 10px", background: region === n ? `${c.color}10` : "rgba(255,255,255,0.02)", border: `1px solid ${region === n ? c.color + "30" : S.bd}`, borderRadius: 5, cursor: "pointer", minWidth: 110, transition: "all .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: c.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: region === n ? c.color : S.t2 }}>{n}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 8, color: S.t4, fontFamily: S.mono }}>{c.markets[0].name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, fontFamily: S.mono, color: r > 6 ? "#F87171" : r > 3 ? "#FBBF24" : "#4ADE80" }}>{r.toFixed(1)}</span>
                  </div>
                </div>
              ); })}
            </div>
          </div>
          <div style={{ borderLeft: `1px solid ${S.bd}`, display: "flex", flexDirection: "column", height: "calc(100vh - 46px)" }}>
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${S.bd}` }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: S.t4 }}>{search ? `SEARCH: "${search}"` : "GLOBAL FEED"}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {(search ? globalSearch : allNews.slice(0, 30)).map(it => (
                <div key={it.id} style={{ padding: "6px 10px", borderBottom: `1px solid ${S.bd}`, cursor: "pointer" }} onClick={() => { setRegion(it.region); setActiveMarket(REGIONS[it.region].markets[0].ticker); setView("dashboard"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <div style={{ display: "flex", gap: 4 }}><Badge color={REGIONS[it.region]?.color} small>{it.region}</Badge>{it.country && <span style={{ fontSize: 8, color: S.t4 }}>{it.country}</span>}</div>
                    <span style={{ fontSize: 8, color: S.t4, fontFamily: S.mono }}>{new Date(it.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", margin: "1px 0 3px", lineHeight: 1.3 }}>{it.headline}</p>
                  <SentBadge v={it.sentiment} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WATCHLIST ═══ */}
      {view === "watchlist" && (
        <div className="fu" style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: S.t4, marginBottom: 14 }}>YOUR WATCHLIST</div>
          {!watchlist.length ? <div style={{ textAlign: "center", padding: 30, color: S.t3, fontSize: 12 }}>Star regions from the Dashboard to add them here.</div> : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {watchlist.map(n => { const c = REGIONS[n]; if (!c) return null; const r = scores[n] || 0; const md = genMarketData(c.markets[0].base, 6); return (
                <div key={n} onClick={() => { setRegion(n); setActiveMarket(c.markets[0].ticker); setView("dashboard"); }} style={{ background: S.sf, borderRadius: 7, padding: 12, border: `1px solid ${S.bd}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div><div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} /><span style={{ fontSize: 12, fontWeight: 700 }}>{n}</span></div>
                    <div style={{ fontSize: 8, color: S.t4 }}>{c.markets.map(m => m.name).join(" · ")}</div></div>
                    <RiskGauge score={r} size="sm" />
                  </div>
                  <div style={{ height: 40 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={md} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}><Area type="monotone" dataKey="price" stroke={c.color} strokeWidth={1.5} fill={`${c.color}15`} dot={false} /></AreaChart></ResponsiveContainer></div>
                </div>
              ); })}
            </div>
          )}
        </div>
      )}

      {/* ═══ DASHBOARD ═══ */}
      {view === "dashboard" && (
        <>
          {/* Region tabs */}
          <div style={{ padding: "6px 16px", display: "flex", gap: 3, borderBottom: `1px solid ${S.bd}`, overflowX: "auto", alignItems: "center" }}>
            <button onClick={() => setView("globe")} style={{ background: "none", border: `1px solid ${S.bd}`, color: S.t3, padding: "4px 9px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 600, marginRight: 3 }}>← Globe</button>
            {Object.keys(REGIONS).map(r => (
              <button key={r} onClick={() => { setRegion(r); setActiveMarket(REGIONS[r].markets[0].ticker); setSelCountry(null); }} style={{ background: region === r ? `${REGIONS[r].color}18` : "transparent", border: `1px solid ${region === r ? REGIONS[r].color + "40" : S.bd}`, color: region === r ? REGIONS[r].color : S.t3, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: S.sans }}>{r}</button>
            ))}
            <button onClick={() => setWatchlist(w => w.includes(region) ? w.filter(x => x !== region) : [...w, region])} style={{ marginLeft: "auto", background: "none", border: "none", color: isW ? "#FBBF24" : S.t4, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>{isW ? "★" : "☆"}</button>
          </div>

          {/* Markets strip */}
          <div style={{ padding: "6px 16px" }}><MarketsStrip region={region} activeMarket={activeMarket} onSelect={t => setActiveMarket(t)} /></div>

          {/* Commodities */}
          <div style={{ padding: "4px 16px 6px" }}><CommodityStrip region={region} /></div>

          {/* Main grid */}
          <div className="fu" style={{ display: "grid", gridTemplateColumns: "1fr 320px", minHeight: "calc(100vh - 178px)" }}>
            {/* LEFT */}
            <div style={{ borderRight: `1px solid ${S.bd}`, overflowY: "auto" }}>
              {/* Price header */}
              <div style={{ padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 9, color: S.t3, fontWeight: 600, letterSpacing: 1.5, marginBottom: 1 }}>{am.ticker} · {am.name} · {am.country}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: S.mono, letterSpacing: -1 }}>{latest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: S.mono, color: isUp ? "#4ADE80" : "#F87171" }}>{isUp ? "+" : ""}{dayChg.toFixed(2)} ({isUp ? "+" : ""}{dayPct.toFixed(2)}%)</span>
                  </div>
                </div>
                <RiskGauge score={risk} />
              </div>

              {/* Time range + News on chart toggle */}
              <div style={{ padding: "0 16px 4px", display: "flex", gap: 3, alignItems: "center" }}>
                {["24h", "7d", "30d", "90d"].map(t => (
                  <button key={t} onClick={() => setTimeRange(t)} style={{ background: timeRange === t ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${timeRange === t ? "rgba(255,255,255,0.14)" : "transparent"}`, color: timeRange === t ? S.t1 : S.t4, padding: "2px 8px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: S.mono }}>{t}</button>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 9, color: showNewsOnChart ? cfg.color : S.t4, fontWeight: 600 }}>News on chart</span>
                  <button onClick={() => setShowNewsOnChart(!showNewsOnChart)} style={{
                    width: 32, height: 16, borderRadius: 8, border: "none", cursor: "pointer", position: "relative",
                    background: showNewsOnChart ? `${cfg.color}50` : "rgba(255,255,255,0.1)", transition: "all .2s",
                  }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: showNewsOnChart ? cfg.color : "rgba(255,255,255,0.3)", position: "absolute", top: 2, left: showNewsOnChart ? 18 : 2, transition: "all .2s" }} />
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 200, padding: "0 8px 0 0" }}>
                {!loading && <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 12 }}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.color} stopOpacity={.2} /><stop offset="100%" stopColor={cfg.color} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey={chartKey} tick={{ fontSize: 8, fill: S.t4 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 7)} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 8, fill: S.t4 }} tickLine={false} axisLine={false} width={50} tickFormatter={v => v.toLocaleString()} />
                    <Tooltip contentStyle={{ background: S.sf, border: `1px solid ${S.bd}`, borderRadius: 5, fontSize: 10, fontFamily: S.mono }} />
                    <Area type="monotone" dataKey="price" stroke={cfg.color} strokeWidth={1.5} fill="url(#pg)" dot={false} />
                    {/* News events on chart */}
                    {showNewsOnChart && timeRange === "24h" && newsOnChart.map((n, i) => (
                      <ReferenceLine key={i} x={n.chartTime} stroke={n.sentiment < -0.3 ? "#F8717180" : n.sentiment > 0.3 ? "#4ADE8080" : "#FBBF2480"} strokeDasharray="3 3"
                        label={{ value: `${n.impact >= 8 ? "⚡" : "•"} ${n.headline.substring(0, 28)}...`, position: i % 2 === 0 ? "top" : "insideTopRight", fontSize: 8, fill: S.t3 }} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>}
              </div>

              {/* Volume */}
              {timeRange === "24h" && <div style={{ height: 40, padding: "0 8px 0 0" }}>
                {!loading && <ResponsiveContainer width="100%" height="100%"><BarChart data={mktData} margin={{ top: 0, right: 16, bottom: 0, left: 12 }}><XAxis dataKey="time" hide /><YAxis hide /><Bar dataKey="vol" radius={[1, 1, 0, 0]}>{mktData.map((e, i) => <Cell key={i} fill={e.chg >= 0 ? "#4ADE8025" : "#F8717125"} />)}</Bar></BarChart></ResponsiveContainer>}
              </div>}

              {/* Regional Map */}
              <div style={{ borderTop: `1px solid ${S.bd}`, padding: "8px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: S.t4 }}>REGIONAL MAP</span>
                  {selCountry && <button onClick={() => setSelCountry(null)} style={{ background: "none", border: `1px solid ${S.bd}`, color: S.t3, padding: "2px 8px", borderRadius: 3, cursor: "pointer", fontSize: 9 }}>Clear filter: {selCountry}</button>}
                </div>
                <RegionalMap region={region} news={news} selectedCountry={selCountry} onSelectCountry={setSelCountry} />
              </div>

              {/* Keywords */}
              <div style={{ borderTop: `1px solid ${S.bd}`, padding: "8px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: S.t4, marginBottom: 5 }}>TRACKING KEYWORDS</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {cfg.keywords.map(k => <span key={k} style={{ fontSize: 9, padding: "2px 9px", borderRadius: 10, fontWeight: 600, background: `${cfg.color}10`, color: cfg.color, border: `1px solid ${cfg.color}20` }}>{k}</span>)}
                </div>
              </div>

              {/* Impact */}
              <div style={{ borderTop: `1px solid ${S.bd}` }}><ImpactPanel item={selNews} region={region} /></div>
            </div>

            {/* RIGHT: NEWS */}
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 178px)" }}>
              <div style={{ padding: "6px 10px", borderBottom: `1px solid ${S.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: S.t4 }}>
                    {selCountry ? `${selCountry} NEWS` : "INTELLIGENCE FEED"}
                  </span>
                  <span style={{ fontSize: 9, color: S.t4, fontFamily: S.mono }}>{filteredNews.length}/{news.length}</span>
                </div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {cats.map(c => (
                    <button key={c} onClick={() => setNFilter(c)} style={{ background: nFilter === c ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${nFilter === c ? "rgba(255,255,255,0.14)" : S.bd}`, color: nFilter === c ? S.t1 : S.t4, padding: "1px 6px", borderRadius: 3, cursor: "pointer", fontSize: 8, fontWeight: 600, textTransform: "capitalize" }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredNews.map(it => <NewsCard key={it.id} item={it} isActive={selNews?.id === it.id} onClick={() => setSelNews(it)} />)}
                {!filteredNews.length && <div style={{ padding: 16, textAlign: "center", color: S.t4, fontSize: 11 }}>No headlines match</div>}
              </div>
              <div style={{ padding: "6px 10px", borderTop: `1px solid ${S.bd}`, background: "rgba(255,255,255,0.015)" }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: S.t4, marginBottom: 3 }}>SENTIMENT</div>
                <div style={{ display: "flex", gap: 2, height: 4, borderRadius: 3, overflow: "hidden" }}>
                  {(() => { const ng = news.filter(n => n.sentiment < -.2).length; const nu = news.filter(n => n.sentiment >= -.2 && n.sentiment <= .2).length; const ps = news.filter(n => n.sentiment > .2).length; const t = news.length || 1; return <><div style={{ width: `${ng / t * 100}%`, background: "#F87171" }} /><div style={{ width: `${nu / t * 100}%`, background: "#FBBF24" }} /><div style={{ width: `${ps / t * 100}%`, background: "#4ADE80" }} /></>; })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}