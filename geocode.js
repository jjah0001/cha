// County gazetteer from longwosion/geojson-map-china (geometryCouties) + place-text matching.
const fs = require("fs"), d3 = require("d3-geo");
const DIR = __dirname + "/data/geojson-map-china/geometryCouties";
const PCODE = { 32:"Jiangsu",33:"Zhejiang",34:"Anhui",35:"Fujian",36:"Jiangxi",37:"Shandong",41:"Henan",42:"Hubei",43:"Hunan",44:"Guangdong",45:"Guangxi",46:"Hainan",50:"Chongqing",51:"Sichuan",52:"Guizhou",53:"Yunnan",61:"Shaanxi",62:"Gansu",71:"Taiwan" };
const ETH = ["彝","哈尼","傣","拉祜","佤","布朗","白族","苗","土家","侗","瑶","壮","回族","畲","黎","藏","羌","仡佬","水族","布依","纳西","傈僳","景颇","阿昌","普米","怒族","独龙","基诺","满族","蒙古"];
const short = n => {
  let s = n.replace(/(自治县|自治州|特区|林区|县|市|区)$/, "");
  if (/族/.test(s)) { let cut = s.length; for (const e of ETH) { const i = s.indexOf(e, 2); if (i > 1 && i < cut) cut = i; } s = s.slice(0, cut); }
  return s;
};
const counties = [];
for (const f of fs.readdirSync(DIR)) {
  const pc = +f.slice(0, 2); if (!PCODE[pc]) continue;
  const j = JSON.parse(fs.readFileSync(DIR + "/" + f, "utf8").replace(/^﻿/, ""));
  for (const ft of j.features) {
    const name = ft.properties.name; if (!name) continue;
    const c = d3.geoCentroid(ft);
    counties.push({ prov: PCODE[pc], name, short: short(name), lon: c[0], lat: c[1], feat: ft });
  }
}
// scenic / town names → county short name (same province)
const ALIAS = {
  Fujian: { 武夷山:"武夷山", 桐木:"武夷山", 闽北:"建瓯", 宁德:"蕉城", 天山:"蕉城", 福宁:"霞浦" },
  Guangdong: { 凤凰山:"潮安", 潮州凤凰:"潮安", 凤凰镇:"潮安", 乌岽:"潮安", 东源:"东源", 上莞:"东源", 大岭山:"东莞" },
  Yunnan: { 易武:"勐腊", 象明:"勐腊", 倚邦:"勐腊", 革登:"勐腊", 莽枝:"勐腊", 蛮砖:"勐腊", 基诺:"景洪", 攸乐:"景洪", 大勐龙:"景洪", 勐往:"勐海", 勐宋乡:"勐海", 格朗和:"勐海", 勐混:"勐海", 布朗山:"勐海", 西定:"勐海", 巴达:"勐海",
    勐库:"双江", 冰岛:"双江", 邦东:"临翔", 邦马:"临翔", 小湾:"凤庆", 鲁史:"凤庆", 诗礼:"凤庆", 漫湾镇:"云县", 幸福镇:"云县", 千家寨:"镇沅", 哀牢山:"镇沅", 困鹿山:"宁洱", 宁洱:"宁洱", 景迈:"澜沧", 惠民:"澜沧", 芒景:"澜沧", 富东:"澜沧",
    墨江:"墨江", 景谷:"景谷", 景东:"景东", 无量山:"景东", 腾冲:"腾冲", 漭水:"昌宁", 高黎贡:"腾冲", 宜良:"宜良", 十里铺:"官渡", 梁河:"梁河", 大关:"大关", 苍山:"大理", 下关:"大理" },
  Taiwan: { 阿里山:"嘉义县", 鹿谷:"南投县", 冻顶:"南投县", 坪林:"新北", 三峡:"新北", 石门:"新北", 木栅:"台北", 龙潭:"桃园", 满州:"屏东", 港口:"屏东", 鹿野:"台东", 茶业改良场:"桃园" },
  Zhejiang: { 天目山:"临安", 雁荡山:"乐清", 华顶山:"天台", 鸠坑:"淳安", 千岛湖:"淳安", 安顶山:"富阳", 乌牛:"永嘉", 羊岩山:"临海", 岱山:"岱山", 余姚:"余姚", 宁海:"宁海", 东阳:"东阳", 武义:"武义" },
  Jiangsu: { 花果山:"连云", 洞庭:"吴中", 茅麓:"金坛", 铜官山:"宜兴" },
  Anhui: { 老竹岭:"歙县", 屯溪:"屯溪", 天柱山:"潜山", 郎溪:"郎溪", 汀溪:"泾县" },
  Sichuan: { 青城山:"都江堰", 蒙顶:"名山", 峨眉山:"峨眉山", 雨城:"雨城" },
  Hubei: { 武当山:"丹江口", 邓村:"夷陵", 宜昌:"夷陵", 十堰:"丹江口", 襄阳:"襄城" },
  Hunan: { 君山:"君山", 岳阳:"岳阳楼", 湘西:"保靖", 长沙:"长沙" },
  Guizhou: { 梵净山:"江口", 雷公山:"雷山", 黄果树:"镇宁", 保基:"盘县", 七舍:"兴义", 安顺:"西秀", 遵义:"汇川", 铜仁:"碧江" },
  Guangxi: { 南山:"横县", 大苗山:"融水", 大瑶山:"金秀", 象棋山:"昭平", 覃塘:"覃塘" },
  Hainan: { 五指山:"五指山", 白沙:"白沙" },
  Jiangxi: { 晓起:"婺源", 梅岭:"湾里", 小布:"宁都", 漫江:"修水" },
  Henan: { 金刚台:"商城" },
  Gansu: { 陇南:"武都", 阳坝:"康县" },
  Shandong: { 胶南:"黄岛" },
  Chongqing: {},
  Shaanxi: { 安康:"汉滨" },
};
const byProv = {};
for (const c of counties) (byProv[c.prov] = byProv[c.prov] || []).push(c);
function find(prov, short) { return (byProv[prov] || []).find(c => c.short === short || c.name === short); }
function geocode(prov, place, zh) {
  const text = (place || "") + " " + (zh || "");
  const list = byProv[prov] || [];
  // 1) explicit county names (longest first)
  let best = null;
  for (const c of list) {
    for (const key of [c.name, c.short]) {
      if (key.length >= 2 && text.includes(key) && (!best || key.length > best.k.length)) best = { c, k: key };
    }
  }
  // 2) aliases — prefer a more specific alias over a short county hit
  const al = ALIAS[prov] || {};
  let ab = null;
  for (const a in al) if (text.includes(a) && (!ab || a.length > ab.a.length)) ab = { a, c: find(prov, al[a]) };
  if (ab && ab.c && (!best || ab.a.length >= best.k.length)) return ab.c;
  return best ? best.c : null;
}
function countyAt(prov, lon, lat) {
  const list = byProv[prov] || [];
  return list.find(c => d3.geoContains(c.feat, [lon, lat])) || list.slice().sort((a, b) => Math.hypot(a.lon - lon, a.lat - lat) - Math.hypot(b.lon - lon, b.lat - lat))[0] || null;
}
// prefecture-level fallback from echarts province files (name + cp centre point)
const EC = __dirname + "/node_modules/echarts/map/json/province/";
const PF = { Jiangsu:"jiangsu",Zhejiang:"zhejiang",Anhui:"anhui",Fujian:"fujian",Jiangxi:"jiangxi",Shandong:"shandong",Henan:"henan",Hubei:"hubei",Hunan:"hunan",Guangdong:"guangdong",Guangxi:"guangxi",Hainan:"hainan",Chongqing:"chongqing",Sichuan:"sichuan",Guizhou:"guizhou",Yunnan:"yunnan",Shaanxi:"shanxi1",Gansu:"gansu",Taiwan:"taiwan" };
const pref = {};
for (const p in PF) { try { const j = require(EC + PF[p] + ".json"); pref[p] = j.features.filter(f => f.properties.cp).map(f => ({ name: f.properties.name, short: short(f.properties.name).replace(/(地区|盟)$/, ""), lon: f.properties.cp[0], lat: f.properties.cp[1] })); } catch (e) { pref[p] = []; } }
function geocodePref(prov, place, zh) {
  const text = (place || "") + " " + (zh || ""); let best = null;
  for (const c of pref[prov] || []) for (const k of [c.name, c.short]) if (k.length >= 2 && text.includes(k) && (!best || k.length > best.k.length)) best = { c, k };
  if (!best && prov === "Shandong" && /沂蒙/.test(text)) return (pref[prov] || []).find(c => c.short === "临沂") || null;
  return best ? best.c : null;
}
module.exports = { geocode, geocodePref, countyAt, counties, short };
