// Builds the light "index" tier from sourced lists in ./idx/*.txt
const fs = require("fs"), path = require("path");
const { pinyin } = require("pinyin-pro");
const D = __dirname + "/idx";
const full = [].concat(...["teas.js", "teas2.js", "teas3.js", "teas4.js", "teas5.js"].map(f => require("./" + f)));
const fullZh = new Set(full.map(t => t.zh));
// real near-duplicates of full-profile teas (index name → skip)
const ALIAS_SKIP = new Set(["大红袍","肉桂","水仙","铁罗汉","白鸡冠","水金龟","半天腰","正山小种","金骏眉","冰岛","昔归","老班章","曼松","景迈","南糯山","鸭屎香单丛","凤凰单丛","黄金桂","本山","毛蟹","梅占","铁观音","八仙","八仙过海单丛","宋种单丛","姜花香单丛","夜来香单丛","芝兰香单丛","杏仁香单丛","黄栀香单丛","岭头白叶单丛","金观音","四季春","翠玉","金萱","青心柑仔","遵义红","湄潭翠芽","石阡苔茶","都匀毛尖","恩施玉露","六堡茶","普陀佛茶","信阳红","千岛玉叶","松阳银猴","南岳云雾","安化松针","霍山黄芽","岳西翠兰","涌溪火青","敬亭绿雪","阳羡雪芽","婺源绿茶","狗牯脑","开化龙顶","金坛雀舌","古丈毛尖","沩山毛尖","北港毛尖","远安鹿苑","海马宫茶","大方海马宫茶","白沙绿茶","五指山红茶","凌云白毫","昭平红","宜兴红","汉中仙毫","紫阳毛尖","崂山绿茶","日照绿茶","南京雨花茶","雨花茶","庐山云雾茶","径山茶","顾渚紫笋","长兴紫笋茶","莫干黄芽","平阳黄汤","安吉白茶","九曲红梅","越红工夫","越红功夫","宁红茶","宁红功夫茶","坦洋工夫","政和工夫","白琳工夫","祁门红茶","英德红茶","滇红","宜红工夫茶","川红功夫","湖红功夫","永春佛手","漳平水仙茶","漳平水仙饼茶","白芽奇兰","石古坪乌龙茶","文山包种","冻顶乌龙茶","阿里山乌龙茶","白毫乌龙","东方美人","红乌龙","台茶8号","台茶12号","台茶13号","台茶18号","贵妃乌龙","松柏长青","福寿山","梨山","大禹岭","杉林溪","木栅铁观音","三峡碧螺春","碧潭飘雪","福州茉莉花茶","横县茉莉花茶","小青柑","柑普茶","景迈山","千两茶","安化千两茶","花砖","茯砖","安化黑砖","雅安藏茶","南路边茶","泾阳茯茶","赵李桥砖茶","羊楼洞砖茶","赤壁青砖茶","下关沱茶","云南沱茶","紧茶","米砖茶","祁门安茶","湘尖茶","天尖","白毫银针","白牡丹","贡眉","寿眉","月光白","福鼎白茶","政和白茶","新工艺白茶","绿雪芽","君山银针","蒙顶黄芽","蒙顶甘露","蒙顶茶","竹叶青","峨眉竹叶青","峨眉雪芽","仙人掌茶","惠明茶","金奖惠明","景宁惠明茶","太平猴魁","六安瓜片","黄山毛峰","休宁松萝","平水珠茶","珠茶","眉茶","信阳毛尖","西湖龙井","洞庭碧螺春","武夷岩茶","安溪铁观音","普洱茶","老丛水仙","老枞水仙","武夷水仙","普通水仙","佛手"]);
// Wuyi names that legitimately differ from a full tea of the same short name
const KEEP = new Set(["白牡丹|wuyi", "竹叶青|wuyi", "夜来香|wuyihist", "仙人掌|wuyihist", "金观音|wuyi"]);
const PROV = { 江苏:"Jiangsu",福建:"Fujian",广东:"Guangdong",云南:"Yunnan",江西:"Jiangxi",浙江:"Zhejiang",安徽:"Anhui",贵州:"Guizhou",河南:"Henan",陕西:"Shaanxi",山东:"Shandong",湖南:"Hunan",湖北:"Hubei",四川:"Sichuan",重庆:"Chongqing",广西:"Guangxi",海南:"Hainan",台湾:"Taiwan",甘肃:"Gansu" };
const TYPE_EN = { green:"green", white:"white", yellow:"yellow", oolong:"oolong", red:"black (red)", dark:"dark", scented:"scented" };
// Listed-tea ids are a hash of the Chinese name, so they never shift when rows are added or removed
// (shelves, shared links and public reviews are keyed by them). `o` is the old position-based id, kept for migration.
const stableId = zh => { let h = 0x811c9dc5; for (const ch of zh) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return "x" + h.toString(36); };
const sources = []; const out = []; const seenZh = new Set(); const skipped = [];
const shapeFor = (zh, type, group) => {
  if (group === "puer") return "cake";
  if (group === "dancong" || group === "wuyi" || group === "wuyihist") return "twisted";
  if (/银针|白毫|毫/.test(zh) && type !== "red") return type === "white" ? "bud" : "budleaf";
  if (/雀舌|龙井|翠芽|扁/.test(zh)) return "flat";
  if (/螺|曲毫|卷/.test(zh)) return "spiral";
  if (/松针|毛尖|剑|针|峰|云雾/.test(zh)) return "needle";
  if (/银球|四球|珠|颗粒/.test(zh)) return "ball";
  if (/砖/.test(zh)) return "brick";
  if (/沱/.test(zh)) return "tuo";
  if (/方包|边茶|金尖|康砖/.test(zh)) return "brick";
  if (/白茶|白眉|白毛/.test(zh) && type === "white") return "leafy";
  if (/茉莉/.test(zh)) return "jasmine";
  return { green: "needle", white: "leafy", yellow: "budleaf", oolong: type === "oolong" && /台湾/.test(zh) ? "ball" : "twisted", red: "wiry", dark: "loose", scented: "jasmine" }[type] || "needle";
};
const lineFor = (r, src) => {
  const place = r.place ? r.place.replace(/\s/g, "") : "";
  switch (r.group) {
    case "dancong": return `A named Phoenix Dancong strain from the Phoenix Mountain area of Chaozhou${r.note ? `, aroma type ${r.note}` : ""}.`;
    case "wuyi": return `A named Wuyi rock tea cultivar or bush: ${r.note}.`;
    case "wuyihist": return "One of the historic named bushes (名丛) recorded in Wuyi rock tea registers.";
    case "puer": return `A Pu'er tea origin in ${place}${r.note ? ` (${r.note})` : ""}.`;
    case "ttes": return r.note + ".";
    default: return `${src.kind} from ${place || PROV[r.prov] || r.prov}${r.note ? `; ${r.note}` : ""}.`;
  }
};
for (const f of fs.readdirSync(D).filter(f => /^[A-Z]_.*\.txt$/.test(f)).sort()) {
  const lines = fs.readFileSync(path.join(D, f), "utf8").split("\n").filter(Boolean);
  const head = lines.shift().replace(/^#src\s*/, "");
  const srcIdx = sources.length;
  const links = head.split(";").map(s => s.trim()).filter(Boolean).map(s => { const [u, ...l] = s.split("|"); return { url: u.trim().split(" ")[0], label: (l.join("|").trim() || u.trim().split(" ").slice(1).join(" ")).replace(/^·\s*/, "") }; });
  const kind = f.startsWith("B_") ? "A registered tea geographical-indication product" : "A regional named tea";
  sources.push({ links });
  for (const l of lines) {
    const [zh, prov, place, type, group = "", note = ""] = l.split("|").map(s => (s || "").trim());
    if (!zh || !PROV[prov]) { skipped.push(zh + " (prov)"); continue; }
    const key = zh + "|" + group;
    if ((fullZh.has(zh) || ALIAS_SKIP.has(zh)) && !KEEP.has(key)) { skipped.push(zh); continue; }
    if (seenZh.has(zh)) continue; seenZh.add(zh);
    const ttype = type === "scented" ? "green" : type;
    const py = pinyin(zh, { toneType: "symbol" }).replace(/\s+/g, " ");
    const pyPlain = pinyin(zh, { toneType: "none", type: "array" });
    const en = pyPlain.map(w => w[0].toUpperCase() + w.slice(1)).join(" ").replace(/\bLü\b/g, "Lü");
    out.push({ i: stableId(zh), o: "x" + out.length, zh, py, en, type: ttype, scented: type === "scented" || /茉莉/.test(zh) || undefined, prov: PROV[prov], place, group,
      line: lineFor({ zh, prov, place, group, note }, { kind }), s: srcIdx, shape: shapeFor(zh, ttype, group) });
  }
}
// ── histories: ./hist/*.txt — "#src url | label; …" header, then "名称|history" rows; "@group|history" rows give a group background
const H = __dirname + "/hist"; const GH = {}; const hmiss = []; let hcount = 0;
const byZh = new Map(out.map(t => [t.zh, t])); const FH = {};
if (fs.existsSync(H)) for (const f of fs.readdirSync(H).filter(f => /\.txt$/.test(f)).sort()) {
  let srcIdx = -1;
  for (const raw of fs.readFileSync(path.join(H, f), "utf8").split("\n")) {
    const l = raw.trim(); if (!l || l.startsWith("//")) continue;
    if (l.startsWith("#src")) { const links = l.replace(/^#src\s*/, "").split(";").map(s => s.trim()).filter(Boolean).map(s => { const [u, ...lb] = s.split("|"); return { url: u.trim(), label: lb.join("|").trim().replace(/^·\s*/, "") }; }); srcIdx = sources.length; sources.push({ links }); continue; }
    if (srcIdx < 0) throw new Error(f + ": history row before any #src line");
    const i = l.indexOf("|"); const zh = l.slice(0, i).trim(), text = l.slice(i + 1).trim();
    if (!text) throw new Error(f + ": empty history for " + zh);
    if (zh.startsWith("@")) { GH[zh.slice(1)] = { t: text, s: srcIdx }; continue; }
    const t = byZh.get(zh);
    if (!t) { if (fullZh.has(zh)) { const e = FH[zh] = FH[zh] || { h: "", s: [] }; e.h = (e.h ? e.h + " " : "") + text; if (!e.s.includes(srcIdx)) e.s.push(srcIdx); } else hmiss.push(f + ":" + zh); continue; }
    if (t.h) { t.h += " " + text; if (t.hs !== srcIdx) (t.hx = t.hx || []).push(srcIdx); } else { t.h = text; t.hs = srcIdx; hcount++; }
  }
}
{ const ids = new Map(); for (const t of out) { if (ids.has(t.i)) throw new Error(`id collision: ${t.zh} and ${ids.get(t.i)} both hash to ${t.i}; rename one row`); ids.set(t.i, t.zh); } }
fs.writeFileSync(__dirname + "/idx.json", JSON.stringify({ sources, teas: out, groups: GH, full: FH }));
console.log("histories", hcount, "full", Object.keys(FH).length, "of", out.length, "groups", Object.keys(GH).join(","), hmiss.length ? "UNMATCHED " + hmiss.join(" ") : "");
const c = {}; out.forEach(t => c[t.type] = (c[t.type] || 0) + 1);
const pc = {}; out.forEach(t => pc[t.prov] = (pc[t.prov] || 0) + 1);
console.log("index teas", out.length, "full", full.length, "total", out.length + full.length);
console.log(c); console.log(pc); console.log("skipped", skipped.length, skipped.slice(0, 60).join(" "));
