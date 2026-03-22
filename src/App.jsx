import { useState, useEffect, useCallback, useRef } from "react";
import * as Recharts from "recharts";
import _ from "lodash";

const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar, Cell, CartesianGrid } = Recharts;

// ─── SIMULATED DATA ENGINE ───────────────────────────────────────────────────
const REGIONS = {
  "Middle East": {
    index: "TADAWUL (Saudi)",
    ticker: "^TASI",
    commodities: ["Crude Oil", "Natural Gas"],
    currency: "USD/SAR",
    keywords: ["sanctions", "OPEC", "conflict", "Iran", "oil supply"],
    color: "#E8963E",
  },
  "East Asia": {
    index: "Nikkei 225",
    ticker: "^N225",
    commodities: ["Semiconductors", "Rare Earth"],
    currency: "USD/CNY",
    keywords: ["Taiwan", "trade war", "tariffs", "South China Sea"],
    color: "#D94F5C",
  },
  Europe: {
    index: "STOXX 600",
    ticker: "^STOXX",
    commodities: ["Natural Gas", "Wheat"],
    currency: "EUR/USD",
    keywords: ["NATO", "energy crisis", "election", "Brexit"],
    color: "#4A8FE7",
  },
  "North America": {
    index: "S&P 500",
    ticker: "^GSPC",
    commodities: ["Gold", "Crude Oil"],
    currency: "DXY",
    keywords: ["Fed", "debt ceiling", "election", "trade policy"],
    color: "#5BAE6A",
  },
  Africa: {
    index: "JSE Top 40",
    ticker: "^JTOPI",
    commodities: ["Gold", "Platinum"],
    currency: "USD/ZAR",
    keywords: ["coup", "mining", "election", "infrastructure"],
    color: "#9B6DD7",
  },
};

const NEWS_TEMPLATES = {
  "Middle East": [
    { headline: "OPEC+ signals deeper production cuts amid geopolitical tensions", sentiment: -0.7, impact: 8 },
    { headline: "US imposes new sanctions on Iranian oil exports", sentiment: -0.8, impact: 9 },
    { headline: "Saudi Arabia announces $100B diversification fund", sentiment: 0.6, impact: 6 },
    { headline: "Red Sea shipping disruptions escalate insurance costs", sentiment: -0.9, impact: 9 },
    { headline: "Gulf states agree to regional de-escalation framework", sentiment: 0.5, impact: 5 },
    { headline: "Iran nuclear talks stall as deadline approaches", sentiment: -0.6, impact: 7 },
    { headline: "UAE-Israel trade corridor hits record volumes", sentiment: 0.4, impact: 4 },
    { headline: "Yemen conflict triggers humanitarian aid surge", sentiment: -0.5, impact: 6 },
  ],
  "East Asia": [
    { headline: "China announces retaliatory tariffs on US tech imports", sentiment: -0.8, impact: 9 },
    { headline: "Taiwan semiconductor exports surge to record high", sentiment: 0.7, impact: 7 },
    { headline: "South China Sea military drills heighten regional tensions", sentiment: -0.9, impact: 8 },
    { headline: "Japan-Korea trade normalization talks resume", sentiment: 0.4, impact: 5 },
    { headline: "Beijing restricts rare earth exports to Western nations", sentiment: -0.7, impact: 8 },
    { headline: "ASEAN digital trade pact signed by 10 member states", sentiment: 0.5, impact: 4 },
    { headline: "North Korea missile test triggers emergency UN session", sentiment: -0.8, impact: 7 },
    { headline: "China property sector defaults ripple through bond markets", sentiment: -0.6, impact: 8 },
  ],
  Europe: [
    { headline: "ECB holds rates steady amid stagflation concerns", sentiment: -0.3, impact: 6 },
    { headline: "EU imposes new energy sanctions package on Russia", sentiment: -0.6, impact: 7 },
    { headline: "France pension reform protests disrupt economic output", sentiment: -0.5, impact: 5 },
    { headline: "Germany approves massive defense spending increase", sentiment: 0.3, impact: 6 },
    { headline: "UK-EU post-Brexit trade deal reaches new milestone", sentiment: 0.5, impact: 5 },
    { headline: "European natural gas reserves hit critical threshold", sentiment: -0.7, impact: 8 },
    { headline: "NATO expands Eastern European military presence", sentiment: -0.4, impact: 6 },
    { headline: "Italy political crisis triggers bond spread widening", sentiment: -0.6, impact: 7 },
  ],
  "North America": [
    { headline: "Federal Reserve signals pause in rate hike cycle", sentiment: 0.6, impact: 8 },
    { headline: "US-China trade negotiations collapse over tech transfer", sentiment: -0.7, impact: 9 },
    { headline: "Debt ceiling standoff enters final week before deadline", sentiment: -0.8, impact: 9 },
    { headline: "Mexico nearshoring boom drives cross-border investment", sentiment: 0.5, impact: 5 },
    { headline: "Canada announces critical minerals export strategy", sentiment: 0.3, impact: 4 },
    { headline: "US election polling shows tight race, markets uncertain", sentiment: -0.4, impact: 7 },
    { headline: "Pentagon announces Indo-Pacific force restructuring", sentiment: -0.3, impact: 5 },
    { headline: "Silicon Valley layoffs deepen as AI disruption accelerates", sentiment: -0.5, impact: 6 },
  ],
  Africa: [
    { headline: "Niger coup disrupts uranium supply chain to Europe", sentiment: -0.7, impact: 7 },
    { headline: "South Africa mining strikes halt platinum production", sentiment: -0.6, impact: 6 },
    { headline: "Kenya digital infrastructure deal attracts $2B investment", sentiment: 0.5, impact: 4 },
    { headline: "Ethiopia-Eritrea border tensions flare up again", sentiment: -0.5, impact: 5 },
    { headline: "Nigeria oil theft reaches record levels, output falls", sentiment: -0.6, impact: 7 },
    { headline: "African Continental Free Trade Area hits milestone", sentiment: 0.4, impact: 5 },
    { headline: "DRC cobalt mining regulations tighten supply outlook", sentiment: -0.4, impact: 6 },
    { headline: "Morocco-Spain renewable energy corridor announced", sentiment: 0.6, impact: 4 },
  ],
};

function generateMarketData(region, hours = 24) {
  const data = [];
  let base = { "Middle East": 11800, "East Asia": 38500, Europe: 480, "North America": 5200, Africa: 72000 }[region];
  const volatility = { "Middle East": 0.008, "East Asia": 0.006, Europe: 0.005, "North America": 0.007, Africa: 0.009 }[region];
  const now = Date.now();
  for (let i = hours * 4; i >= 0; i--) {
    const ts = now - i * 15 * 60 * 1000;
    const shock = Math.random() < 0.05 ? (Math.random() - 0.5) * 4 : 0;
    const change = (Math.random() - 0.48) * volatility * base + shock * volatility * base;
    base += change;
    const vol = Math.abs(change / base) * 10000;
    data.push({
      time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: ts,
      price: Math.round(base * 100) / 100,
      volume: Math.round(vol * 100) / 100,
      change: Math.round(change * 100) / 100,
    });
  }
  return data;
}

function generateNewsTimeline(region) {
  const templates = NEWS_TEMPLATES[region];
  const now = Date.now();
  return templates.map((t, i) => ({
    ...t,
    id: i,
    timestamp: now - Math.random() * 24 * 60 * 60 * 1000,
    source: ["Reuters", "Bloomberg", "Al Jazeera", "FT", "AP News", "BBC", "SCMP", "Nikkei"][Math.floor(Math.random() * 8)],
    region,
  })).sort((a, b) => b.timestamp - a.timestamp);
}

function calcRiskScore(news) {
  const negCount = news.filter((n) => n.sentiment < -0.3).length;
  const avgImpact = news.reduce((s, n) => s + n.impact, 0) / news.length;
  const sentAvg = Math.abs(news.reduce((s, n) => s + n.sentiment, 0) / news.length);
  return Math.min(10, Math.round((negCount / news.length * 4 + avgImpact / 10 * 3 + sentAvg * 3) * 10) / 10);
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function RiskGauge({ score }) {
  const pct = score / 10;
  const hue = 120 - pct * 120;
  const color = `hsl(${hue}, 75%, 50%)`;
  const label = score <= 3 ? "LOW" : score <= 6 ? "MODERATE" : score <= 8 ? "HIGH" : "CRITICAL";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 140, height: 80, margin: "0 auto" }}>
        <svg viewBox="0 0 140 80" width="140" height="80">
          <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${pct * 188} 188`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "all 0.8s ease" }} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <div style={{
        marginTop: 6, fontSize: 10, fontWeight: 700, letterSpacing: 2,
        color, padding: "2px 10px", border: `1px solid ${color}40`,
        display: "inline-block", borderRadius: 3,
      }}>{label}</div>
    </div>
  );
}

function SentimentBadge({ value }) {
  const color = value > 0.2 ? "#4ADE80" : value < -0.2 ? "#F87171" : "#FBBF24";
  const label = value > 0.2 ? "POSITIVE" : value < -0.2 ? "NEGATIVE" : "NEUTRAL";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color,
      background: `${color}18`, padding: "2px 6px", borderRadius: 3,
      border: `1px solid ${color}30`,
    }}>{label}</span>
  );
}

function NewsCard({ item, isActive, onClick }) {
  const borderColor = item.sentiment < -0.3 ? "#F87171" : item.sentiment > 0.3 ? "#4ADE80" : "#FBBF24";
  return (
    <div onClick={onClick} style={{
      padding: "10px 12px", cursor: "pointer",
      background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
      borderLeft: `3px solid ${isActive ? borderColor : "transparent"}`,
      transition: "all 0.2s",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", flexShrink: 0 }}>
          {item.source}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.45, color: "rgba(255,255,255,0.8)", margin: "4px 0 6px", fontWeight: 500 }}>
        {item.headline}
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <SentimentBadge value={item.sentiment} />
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
          IMPACT: {item.impact}/10
        </span>
      </div>
    </div>
  );
}

function ImpactAnalysis({ newsItem, region }) {
  if (!newsItem) return (
    <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
      Select a news item to see AI impact analysis
    </div>
  );
  const config = REGIONS[region];
  const analyses = {
    "Middle East": [
      `Oil futures are likely to see upward pressure due to perceived supply risk. ${config.index} may face selling pressure as foreign investors hedge regional exposure.`,
      `Energy-dependent sectors in Europe and Asia will see margin compression. Defense contractors may benefit from increased procurement cycles.`,
      `Currency pairs involving petrodollar economies will show increased volatility. Gold typically strengthens as a safe-haven rotation.`,
    ],
    "East Asia": [
      `Semiconductor supply chains face disruption risk, pushing chip prices higher. Tech-heavy indices like NASDAQ and ${config.index} are most exposed.`,
      `Trade war escalation typically triggers a flight to safety — US Treasuries and Japanese Yen strengthen while emerging market currencies weaken.`,
      `Manufacturing PMIs will likely contract in affected economies. Nearshoring beneficiaries like Vietnam and Mexico may see FDI inflows.`,
    ],
    Europe: [
      `European energy security concerns drive natural gas futures higher. The ${config.index} faces headwinds from energy-intensive industrial sectors.`,
      `ECB policy response depends on whether the event is inflationary or deflationary. Bond spreads between core and periphery nations may widen.`,
      `Defense and energy transition stocks tend to outperform during European security events. Banking sector faces credit risk reassessment.`,
    ],
    "North America": [
      `The ${config.index} typically sees elevated VIX during political uncertainty. Large-cap defensive sectors (utilities, healthcare) outperform cyclicals.`,
      `Dollar strength depends on whether the event is US-centric (weakening) or global (safe-haven strengthening). Gold and crypto see increased flows.`,
      `Federal Reserve reaction function may shift — geopolitical shocks that threaten growth could accelerate rate cut timelines.`,
    ],
    Africa: [
      `Commodity supply disruptions from Africa disproportionately affect European manufacturers. ${config.index} faces local currency pressure.`,
      `Mining sector equities globally adjust to supply constraint narratives. Platinum group metals and rare earths see speculative positioning.`,
      `Sovereign credit spreads for affected nations widen, increasing borrowing costs. Development finance institutions may announce emergency facilities.`,
    ],
  };
  const analysis = analyses[region];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA", boxShadow: "0 0 8px #A78BFA" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#A78BFA", textTransform: "uppercase" }}>
          AI Impact Analysis
        </span>
      </div>
      <div style={{
        fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 12,
        padding: "10px 12px", background: "rgba(167,139,250,0.06)", borderRadius: 6,
        border: "1px solid rgba(167,139,250,0.12)",
      }}>
        <strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Event:</strong> {newsItem.headline}
      </div>
      {analysis.map((para, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: "#A78BFA", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, marginTop: 2 }}>
            {["MARKET", "SECTOR", "MACRO"][i]}
          </span>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, margin: 0 }}>{para}</p>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,0.3)" }}>AFFECTED INSTRUMENTS</span>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {[config.ticker, ...config.commodities, config.currency].map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: "3px 8px", background: "rgba(255,255,255,0.06)",
              borderRadius: 3, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchitectureView() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#A78BFA", marginBottom: 16, textTransform: "uppercase" }}>
        System Architecture
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { layer: "DATA INGESTION", items: ["NewsAPI / RSS", "yfinance / Alpha Vantage", "WebSocket feeds"], color: "#4A8FE7" },
          { layer: "PROCESSING", items: ["Sentiment NLP", "Correlation Engine", "Risk Scorer"], color: "#E8963E" },
          { layer: "PRESENTATION", items: ["Recharts / Plotly", "Real-time Dashboard", "Alert System"], color: "#5BAE6A" },
        ].map((col) => (
          <div key={col.layer} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, border: `1px solid ${col.color}25` }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: col.color, marginBottom: 10 }}>{col.layer}</div>
            {col.items.map((item) => (
              <div key={item} style={{
                fontSize: 11, color: "rgba(255,255,255,0.6)", padding: "6px 10px", marginBottom: 4,
                background: "rgba(255,255,255,0.03)", borderRadius: 4, borderLeft: `2px solid ${col.color}40`,
              }}>{item}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#D94F5C", marginBottom: 10, textTransform: "uppercase" }}>
        API Endpoints (Production)
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
        {[
          { method: "GET", path: "/api/v1/news/{region}", desc: "Filtered geopolitical headlines" },
          { method: "GET", path: "/api/v1/market/{ticker}", desc: "Real-time price + volume" },
          { method: "POST", path: "/api/v1/analyze/correlation", desc: "News-to-market correlation" },
          { method: "GET", path: "/api/v1/risk-score/{region}", desc: "Geopolitical risk rating" },
          { method: "POST", path: "/api/v1/predict/impact", desc: "LLM impact prediction" },
        ].map((ep) => (
          <div key={ep.path} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4, background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3, letterSpacing: 1,
              color: ep.method === "GET" ? "#4ADE80" : "#FBBF24",
              background: ep.method === "GET" ? "#4ADE8015" : "#FBBF2415",
            }}>{ep.method}</span>
            <span style={{ color: "rgba(255,255,255,0.7)", flex: 1 }}>{ep.path}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{ep.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommodityStrip({ region }) {
  const config = REGIONS[region];
  const items = [
    { name: config.commodities[0], value: config.commodities[0] === "Crude Oil" ? "78.42" : config.commodities[0] === "Gold" ? "2,341.50" : config.commodities[0] === "Natural Gas" ? "3.21" : config.commodities[0] === "Semiconductors" ? "486.2" : "1,023.4", chg: (Math.random() * 4 - 1.5).toFixed(2) },
    { name: config.commodities[1] || "Silver", value: config.commodities[1] === "Natural Gas" ? "3.18" : config.commodities[1] === "Wheat" ? "612.50" : config.commodities[1] === "Rare Earth" ? "72.8" : config.commodities[1] === "Platinum" ? "987.6" : "27.34", chg: (Math.random() * 3 - 1.2).toFixed(2) },
    { name: config.currency, value: config.currency === "EUR/USD" ? "1.0842" : config.currency === "USD/CNY" ? "7.2431" : config.currency === "USD/SAR" ? "3.7503" : config.currency === "DXY" ? "104.32" : "18.62", chg: (Math.random() * 2 - 0.8).toFixed(2) },
    { name: "VIX", value: (15 + Math.random() * 12).toFixed(2), chg: (Math.random() * 6 - 2).toFixed(2) },
  ];
  return (
    <div style={{ display: "flex", gap: 2, overflow: "hidden" }}>
      {items.map((item) => {
        const up = parseFloat(item.chg) >= 0;
        return (
          <div key={item.name} style={{ flex: 1, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" }}>{item.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: up ? "#4ADE80" : "#F87171", fontFamily: "'JetBrains Mono', monospace" }}>
                {up ? "▲" : "▼"} {item.chg}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function GeoMarketPulse() {
  const [region, setRegion] = useState("Middle East");
  const [marketData, setMarketData] = useState([]);
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [pulseTime, setPulseTime] = useState(new Date().toLocaleTimeString());

  const loadRegion = useCallback((r) => {
    setLoading(true);
    setSelectedNews(null);
    setTimeout(() => {
      const md = generateMarketData(r);
      const nw = generateNewsTimeline(r);
      setMarketData(md);
      setNews(nw);
      setRiskScore(calcRiskScore(nw));
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => { loadRegion(region); }, [region, loadRegion]);
  useEffect(() => {
    const iv = setInterval(() => setPulseTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(iv);
  }, []);

  const config = REGIONS[region];
  const latestPrice = marketData.length > 0 ? marketData[marketData.length - 1].price : 0;
  const openPrice = marketData.length > 0 ? marketData[0].price : 0;
  const dayChange = latestPrice - openPrice;
  const dayChangePct = openPrice > 0 ? (dayChange / openPrice) * 100 : 0;
  const isUp = dayChange >= 0;

  const highImpactTimes = news.filter((n) => n.impact >= 7).map((n) => {
    const nd = new Date(n.timestamp);
    return nd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#0A0B0F",
      color: "#fff",
      minHeight: "100vh",
      width: "100%",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* HEADER */}
      <header style={{
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: config.color, boxShadow: `0 0 12px ${config.color}80`, animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>GEOMARKET</span>
            <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>PULSE</span>
          </div>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>{pulseTime}</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["dashboard", "architecture"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "rgba(255,255,255,0.08)" : "transparent",
              border: "1px solid " + (view === v ? "rgba(255,255,255,0.12)" : "transparent"),
              color: view === v ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
              padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontSize: 10,
              fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
            }}>{v}</button>
          ))}
        </div>
      </header>

      {/* REGION SELECTOR */}
      <div style={{ padding: "10px 20px", display: "flex", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {Object.keys(REGIONS).map((r) => (
          <button key={r} onClick={() => setRegion(r)} style={{
            background: region === r ? `${REGIONS[r].color}18` : "transparent",
            border: `1px solid ${region === r ? REGIONS[r].color + "40" : "rgba(255,255,255,0.06)"}`,
            color: region === r ? REGIONS[r].color : "rgba(255,255,255,0.4)",
            padding: "6px 14px", borderRadius: 5, cursor: "pointer",
            fontSize: 11, fontWeight: 600, transition: "all 0.2s",
          }}>{r}</button>
        ))}
      </div>

      {view === "architecture" ? <ArchitectureView /> : (
        <>
          {/* COMMODITY STRIP */}
          <div style={{ padding: "10px 20px" }}>
            <CommodityStrip region={region} />
          </div>

          {/* MAIN GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 0, minHeight: "calc(100vh - 180px)" }} className="fade-up">

            {/* LEFT: CHART + ANALYSIS */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              {/* Index header */}
              <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: 1.5, marginBottom: 2 }}>
                    {config.ticker} · {config.index}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>
                      {latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                      color: isUp ? "#4ADE80" : "#F87171",
                    }}>
                      {isUp ? "+" : ""}{dayChange.toFixed(2)} ({isUp ? "+" : ""}{dayChangePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <RiskGauge score={riskScore} />
              </div>

              {/* Chart */}
              <div style={{ padding: "0 10px 0 0", height: 260 }}>
                {!loading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketData} margin={{ top: 5, right: 20, bottom: 5, left: 15 }}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} interval={Math.floor(marketData.length / 8)} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} width={55} tickFormatter={(v) => v.toLocaleString()} />
                      <Tooltip
                        contentStyle={{ background: "#14151A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                        labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
                      />
                      <Area type="monotone" dataKey="price" stroke={config.color} strokeWidth={1.5} fill="url(#priceGrad)" dot={false} />
                      {highImpactTimes.map((t, i) => (
                        <ReferenceLine key={i} x={t} stroke="#F8717140" strokeDasharray="3 3" />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Volume bars */}
              <div style={{ padding: "0 10px 0 0", height: 60 }}>
                {!loading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketData} margin={{ top: 0, right: 20, bottom: 0, left: 15 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
                        {marketData.map((entry, i) => (
                          <Cell key={i} fill={entry.change >= 0 ? "#4ADE8030" : "#F8717130"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Correlation keywords */}
              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>
                  TRACKING KEYWORDS
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {config.keywords.map((kw) => (
                    <span key={kw} style={{
                      fontSize: 10, padding: "3px 10px", borderRadius: 12, fontWeight: 600,
                      background: `${config.color}12`, color: config.color, border: `1px solid ${config.color}25`,
                    }}>{kw}</span>
                  ))}
                </div>
              </div>

              {/* Impact Analysis */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <ImpactAnalysis newsItem={selectedNews} region={region} />
              </div>
            </div>

            {/* RIGHT: NEWS FEED */}
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                  Live Intelligence Feed
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {news.length} items
                </span>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {news.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    isActive={selectedNews?.id === item.id}
                    onClick={() => setSelectedNews(item)}
                  />
                ))}
              </div>
              {/* Sentiment distribution */}
              <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>SENTIMENT DISTRIBUTION</div>
                <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 3, overflow: "hidden" }}>
                  {(() => {
                    const neg = news.filter((n) => n.sentiment < -0.2).length;
                    const neu = news.filter((n) => n.sentiment >= -0.2 && n.sentiment <= 0.2).length;
                    const pos = news.filter((n) => n.sentiment > 0.2).length;
                    const total = news.length;
                    return (
                      <>
                        <div style={{ width: `${(neg / total) * 100}%`, background: "#F87171", borderRadius: "3px 0 0 3px" }} />
                        <div style={{ width: `${(neu / total) * 100}%`, background: "#FBBF24" }} />
                        <div style={{ width: `${(pos / total) * 100}%`, background: "#4ADE80", borderRadius: "0 3px 3px 0" }} />
                      </>
                    );
                  })()}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: "#F87171" }}>Negative {news.filter((n) => n.sentiment < -0.2).length}</span>
                  <span style={{ fontSize: 9, color: "#FBBF24" }}>Neutral {news.filter((n) => n.sentiment >= -0.2 && n.sentiment <= 0.2).length}</span>
                  <span style={{ fontSize: 9, color: "#4ADE80" }}>Positive {news.filter((n) => n.sentiment > 0.2).length}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
