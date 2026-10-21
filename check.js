// Sanity checks after adding teas: duplicates, unknown provinces, missing sources, geocoding coverage.
const fs = require("fs");
const PROV = ["江苏","福建","广东","云南","江西","浙江","安徽","贵州","河南","陕西","山东","湖南","湖北","四川","重庆","广西","海南","台湾","甘肃"];
const TYPES = ["green","white","yellow","oolong","red","dark","scented"];
const full = [].concat(...["teas.js","teas2.js","teas3.js","teas4.js","teas5.js"].map(f => require("./" + f)));
const seen = new Map(full.map(t => [t.zh, "full:" + t.id])); let problems = 0, rows = 0;
for (const f of fs.readdirSync(__dirname + "/idx").filter(f => /^[A-Z]_.*\.txt$/.test(f))) {
  const lines = fs.readFileSync(__dirname + "/idx/" + f, "utf8").split("\n");
  if (!/^#src\s+https?:\/\//.test(lines[0])) { console.log(`${f}: first line must be "#src <url> | <label>"`); problems++; }
  lines.slice(1).forEach((l, i) => { if (!l.trim()) return; rows++;
    const [zh, prov, place, type] = l.split("|");
    if (!PROV.includes(prov)) { console.log(`${f}:${i + 2} unknown province "${prov}"`); problems++; }
    if (!TYPES.includes(type)) { console.log(`${f}:${i + 2} unknown type "${type}"`); problems++; }
    if (seen.has(zh)) console.log(`${f}:${i + 2} duplicate "${zh}" (already ${seen.get(zh)}) — will be skipped`);
    else seen.set(zh, f); });
}
// histories: hist/*.txt — every row needs a #src line above it and must name a listed or full tea (or @group)
let hrows = 0;
for (const f of fs.readdirSync(__dirname + "/hist").filter(f => /\.txt$/.test(f))) {
  let src = false;
  fs.readFileSync(__dirname + "/hist/" + f, "utf8").split("\n").forEach((l, i) => { l = l.trim(); if (!l || l.startsWith("//")) return;
    if (l.startsWith("#src")) { if (!/^#src\s+https?:\/\//.test(l)) { console.log(`hist/${f}:${i + 1} #src needs a URL`); problems++; } src = true; return; }
    hrows++; const zh = l.split("|")[0].trim(), text = l.slice(l.indexOf("|") + 1).trim();
    if (!src) { console.log(`hist/${f}:${i + 1} history row before any #src line`); problems++; }
    if (!text || l.indexOf("|") < 0) { console.log(`hist/${f}:${i + 1} empty history`); problems++; }
    if (!zh.startsWith("@") && !seen.has(zh)) { console.log(`hist/${f}:${i + 1} "${zh}" is not a tea in the library`); problems++; } });
}
console.log(`${rows} listed rows and ${hrows} history rows checked, ${problems} problems.`);
process.exit(problems ? 1 : 0);
