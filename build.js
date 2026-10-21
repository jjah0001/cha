const fs = require("fs");
const d3 = require("d3-geo");
const raw = require("echarts/map/json/china.json");
const teas = require("./teas.js").concat(require("./teas2.js"), require("./teas3.js"), require("./teas4.js"), require("./teas5.js"));
const PAIRS = require("./pairs.js");
const GEN = new Set(["zhuyeqing","lushan","lishan","huangjingui","gongmei","yueguangbai","chuanhong","mixiang","dayeqing","baiyaqilan","zhenghe","tianjian"]);
const ids = new Set(); for (const t of teas) { if (ids.has(t.id)) throw new Error("dup " + t.id); ids.add(t.id); if (GEN.has(t.id)) t.gen = true; t.pair = PAIRS[t.id] || t.pair; if (!t.pair) throw new Error("no pairing for " + t.id); }
const types = require("./teas.js").types;

function decodeRing(str, off) {
  const out = []; let px = off[0], py = off[1];
  for (let i = 0; i < str.length; i += 2) {
    let x = str.charCodeAt(i) - 64, y = str.charCodeAt(i + 1) - 64;
    x = (x >> 1) ^ -(x & 1); y = (y >> 1) ^ -(y & 1);
    x += px; y += py; px = x; py = y;
    out.push([x / 1024, y / 1024]);
  }
  return out;
}
for (const f of raw.features) {
  const g = f.geometry, eo = g.encodeOffsets;
  if (g.type === "Polygon") g.coordinates = g.coordinates.map((r, i) => decodeRing(r, eo[i]));
  else g.coordinates = g.coordinates.map((p, i) => p.map((r, j) => decodeRing(r, eo[i][j])));
}

// Frame the tea belt: lon 97–123, lat 18–36
const W = 800, H = 640;
const proj = d3.geoMercator();
proj.fitExtent([[10, 10], [W - 10, H - 10]], { type: "MultiPoint", coordinates: [[97, 18.5], [123.2, 37]] });

const names = { 台湾: "Taiwan", 河北: "Hebei", 山西: "Shanxi", 内蒙古: "Inner Mongolia", 辽宁: "Liaoning", 吉林: "Jilin", 黑龙江: "Heilongjiang", 江苏: "Jiangsu", 浙江: "Zhejiang", 安徽: "Anhui", 福建: "Fujian", 江西: "Jiangxi", 山东: "Shandong", 河南: "Henan", 湖北: "Hubei", 湖南: "Hunan", 广东: "Guangdong", 广西: "Guangxi", 海南: "Hainan", 四川: "Sichuan", 贵州: "Guizhou", 云南: "Yunnan", 西藏: "Tibet", 陕西: "Shaanxi", 甘肃: "Gansu", 青海: "Qinghai", 宁夏: "Ningxia", 新疆: "Xinjiang", 北京: "Beijing", 天津: "Tianjin", 上海: "Shanghai", 重庆: "Chongqing", 香港: "Hong Kong", 澳门: "Macau" };

function ringPath(ring) {
  const pts = []; let last = null;
  for (const c of ring) {
    const p = proj(c); if (!p) continue;
    const q = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
    if (last && Math.hypot(q[0] - last[0], q[1] - last[1]) < 1.2) continue;
    pts.push(q); last = q;
  }
  if (pts.length < 3) return "";
  // drop tiny islands
  let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  if (Math.abs(a / 2) < 6) return "";
  return "M" + pts.map(p => p.join(",")).join("L") + "Z";
}
const teaProvs = new Set(teas.map(t => t.prov));
const provinces = raw.features.map(f => {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const d = polys.map(p => p.map(ringPath).join("")).join("");
  const c = d3.geoPath(proj).centroid(f);
  const en = names[f.properties.name] || f.properties.name;
  return { zh: f.properties.name, en, d, cx: Math.round(c[0]), cy: Math.round(c[1]), tea: teaProvs.has(en) };
}).filter(p => p.d);

// tea points + light repulsion so clustered origins stay clickable
const pts = teas.map(t => { const [x, y] = proj([t.lon, t.lat]); return { x, y, ox: x, oy: y }; });
for (let it = 0; it < 160; it++) {
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const a = pts[i], b = pts[j]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 0.01;
    if (d < 13) { const m = (13 - d) / 2; dx /= d; dy /= d; a.x -= dx * m; a.y -= dy * m; b.x += dx * m; b.y += dy * m; }
  }
}
teas.forEach((t, i) => { t.x = Math.round(pts[i].x * 10) / 10; t.y = Math.round(pts[i].y * 10) / 10; t.ox = Math.round(pts[i].ox * 10) / 10; t.oy = Math.round(pts[i].oy * 10) / 10; });

// Qinling–Huai line, roughly the northern edge of the tea belt
const qh = [[103.5, 33.9], [106, 33.8], [108.5, 33.9], [111, 33.6], [113.5, 33.1], [116, 32.9], [118.5, 33.4], [120.5, 33.6]].map(c => proj(c).map(v => Math.round(v)));
const qhPath = "M" + qh.map(p => p.join(",")).join("L");

// ── province anchors (tea-growing heart of each province) and zoom boxes
const IDX = JSON.parse(fs.readFileSync(__dirname + "/idx.json", "utf8"));
const ANCHOR = { Zhejiang:[120.1,29.3], Anhui:[117.6,31.0], Jiangsu:[119.9,31.9], Fujian:[118.3,26.2], Jiangxi:[115.8,27.7], Hunan:[111.7,27.8], Hubei:[112.0,30.9], Henan:[114.0,32.4],
  Shaanxi:[108.0,33.2], Gansu:[105.5,33.4], Sichuan:[103.6,30.2], Chongqing:[107.4,29.8], Guizhou:[106.8,26.8], Yunnan:[101.0,23.6], Guangxi:[108.8,23.9], Guangdong:[113.6,23.4],
  Hainan:[109.7,19.2], Taiwan:[120.95,23.7], Shandong:[119.3,35.8] };
const BOXOVR = { Gansu:[[103.8,32.4],[106.8,34.6]], Shandong:[[116.5,34.6],[122.6,37.6]], Taiwan:[[119.95,21.85],[122.05,25.35]], Hainan:[[108.55,18.1],[111.1,20.2]], Shaanxi:[[105.5,31.7],[110.9,34.4]] };
const provMeta = {};
for (const f of raw.features) {
  const en = names[f.properties.name]; if (!ANCHOR[en]) continue;
  let b = BOXOVR[en] ? BOXOVR[en].map(c => proj(c)) : d3.geoPath(proj).bounds(f);
  if (BOXOVR[en]) b = [[Math.min(b[0][0], b[1][0]), Math.min(b[0][1], b[1][1])], [Math.max(b[0][0], b[1][0]), Math.max(b[0][1], b[1][1])]];
  const [ax, ay] = proj(ANCHOR[en]);
  provMeta[en] = { zh: f.properties.name, ax: Math.round(ax), ay: Math.round(ay), box: b.flat().map(v => Math.round(v)) };
}
// zoomed positions: repel at the province's own zoom scale
for (const en in provMeta) {
  const [x0, y0, x1, y1] = provMeta[en].box; const k = Math.min(W / (x1 - x0 + 40), H / (y1 - y0 + 40));
  const mem = teas.filter(t => t.prov === en); const P = mem.map(t => ({ x: t.ox, y: t.oy })); const th = 16 / k;
  for (let it = 0; it < 120; it++) for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const a = P[i], c = P[j]; let dx = c.x - a.x, dy = c.y - a.y; const d = Math.hypot(dx, dy) || 0.01;
    if (d < th) { const m = (th - d) / 2; dx /= d; dy /= d; a.x -= dx * m; a.y -= dy * m; c.x += dx * m; c.y += dy * m; } }
  mem.forEach((t, i) => { t.zx = Math.round(P[i].x * 10) / 10; t.zy = Math.round(P[i].y * 10) / 10; });
}
// ── geocode listed teas to county (or prefecture), and tag full teas with their county
const GC = require("./geocode.js");
const r1 = v => Math.round(v * 10) / 10;
let lvl = { county: 0, pref: 0, prov: 0 };
for (const x of IDX.teas) {
  let c = GC.geocode(x.prov, x.place, x.zh), level = "county";
  if (!c) { c = GC.geocodePref(x.prov, x.place, x.zh); level = "pref"; }
  if (c) { const [px, py] = proj([c.lon, c.lat]); x.cty = c.name; x.cs = GC.short(c.name); x.cx = r1(px); x.cy = r1(py); x.lv = level; lvl[level]++; }
  else { const m = provMeta[x.prov]; x.cty = "~" + x.prov; x.cs = "Place not given"; x.cx = m.ax; x.cy = m.ay; x.lv = "prov"; lvl.prov++; }
}
for (const t of teas) { const r = (IDX.full || {})[t.zh]; if (r) { t.rh = r.h; t.rs = r.s; delete t.gen; } }
for (const t of teas) { const c = GC.countyAt(t.prov, t.lon, t.lat); if (c) { t.cty = c.name; t.cs = GC.short(c.name); } }
console.log("geocode", lvl);
const research = require("./research.json");
const researchByName = new Map(research.teas.map(t => [t.zh, t]));
const { suggestPairings } = require("./pairing-suggestions.js");
for (const t of [...teas, ...IDX.teas]) {
  t.evidence = researchByName.get(t.zh) || null;
  t.pairingSuggestions = suggestPairings(t);
}
const cultivars = require("./cultivars.json");
const { pinyin } = require("pinyin-pro");
for (const c of cultivars) {
  c.py = pinyin(c.zh, { toneType: "symbol" });
  c.pairingOptions = c.suitableTypes.map(type => ({ type, ...suggestPairings({ type, zh: c.zh }) }));
}
const data = { W, H, provinces, qhPath, teas: teas.map(t => ({ ...t })), types, X: IDX.teas, XS: IDX.sources, XG: IDX.groups || {}, PM: provMeta,
  researchSources: research.sources, brewingGroups: research.brewingGroups, cultivars, researchDate: research.checkedOn };
let html = fs.readFileSync(__dirname + "/index.html", "utf8");
if (!html.includes("/*__DATA__*/")) throw new Error("index.html must contain the DATA build placeholder");
html = html.replace("/*__DATA__*/", () => "const DATA = " + JSON.stringify(data).replace(/</g, "\\u003c") + ";");
// public reviews: module + optional Supabase config (env vars, or config.json beside this file)
let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8")); } catch (e) {}
if (process.env.SUPABASE_URL) cfg.supabaseUrl = process.env.SUPABASE_URL;
if (process.env.SUPABASE_ANON_KEY) cfg.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (process.env.PAIR_PROXY_URL) cfg.pairProxyUrl = process.env.PAIR_PROXY_URL;
const pub = {}; if (cfg.supabaseUrl && cfg.supabaseAnonKey) { pub.supabaseUrl = String(cfg.supabaseUrl); pub.supabaseAnonKey = String(cfg.supabaseAnonKey); }
const revJs = fs.readFileSync(__dirname + "/reviews.js", "utf8").replace("/*__CONFIG__*/{}", JSON.stringify(pub).replace(/</g, "\\u003c"));
html = html.replace("/*__REVIEWS__*/", () => revJs);
// tea pairing proxy for the public site (used only when window.claude is absent)
const pairCfg = {}; if (cfg.pairProxyUrl) pairCfg.proxyUrl = String(cfg.pairProxyUrl);
if (!html.includes("/*__PAIR_CFG__*/")) throw new Error("index.html must contain the PAIR_CFG placeholder");
html = html.replace("/*__PAIR_CFG__*/{}", () => JSON.stringify(pairCfg).replace(/</g, "\\u003c"));
console.log("pairing proxy:", pairCfg.proxyUrl || "none (local keyword fallback)");
html = html.replace("/*__RESEARCH_UI__*/", () => fs.readFileSync(__dirname + "/research-ui.js", "utf8"));
console.log("reviews backend:", pub.supabaseUrl ? "supabase " + pub.supabaseUrl : "claude.ai db (or none)");
fs.mkdirSync(__dirname + "/dist", { recursive: true });
fs.writeFileSync(__dirname + "/dist/tea-time.html", html);
console.log("bytes", html.length, "provinces", provinces.length);
