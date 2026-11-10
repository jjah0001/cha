// Health boxes for every tea card. Each tile is one short idea, never a paragraph.
// Rule: every tile cites a Chinese-language source someone opened (checked 2026-10-24; reviewed 2026-11-10).
// Each note says only what its source measured: lab (in vitro) findings are labelled as lab, not as benefits in people.
// Cohorts only show a link, so their notes say "linked to", never that tea caused it.
// Topics with no usable Chinese source (jasmine aroma and mood, oral health, bone density) are left out on purpose.

const sources = {
  chinapar: { url: "https://news.sciencenet.cn/sbhtmlnews/2020/1/352921.shtm", title: "饮茶能降低心脑血管病死亡风险", pub: "科学网 · 中国科学报 2020 (China-PAR, 阜外医院)" },
  bpmeta: { url: "https://www.thepaper.cn/newsDetail_forward_22508972", title: "绿茶和红茶，到底哪种更助降血压？", pub: "澎湃 (阜外医院 meta-analysis, Br J Nutr 2014)" },
  theanine: { url: "http://health.people.com.cn/n1/2024/1017/c14739-40341076.html", title: "入秋宜喝茶 为啥说红茶、绿茶各有千秋？", pub: "人民网 健康 2024" },
  ckb: { url: "https://m.thepaper.cn/newsDetail_forward_12723965", title: "中国50万人研究结果：常喝绿茶可防糖尿病！", pub: "澎湃 · 健康时报 (中国慢性病前瞻性研究, 北京大学)" },
  ukbb: { url: "http://www.fortunechina.com/lingdaoli/c/2022-09/02/content_418454.htm", title: "最新研究发现，喝红茶可以延年益寿", pub: "财富中文网 2022 (UK Biobank, Ann Intern Med)" },
  theaflavin: { url: "https://www.spkx.net.cn/CN/10.7506/spkx1002-6630-20210603-045", title: "茶黄素生物学活性研究进展", pub: "食品科学 2022 · 刘仲华等" },
  whitetea: { url: "https://wsyj.cbpt.cnki.net/portal/journal/portal/client/paper/5ad857d49bf5d1e2d8282fb54574f4da", title: "茶的健康效益和人群干预研究", pub: "卫生研究 2011 · 韩驰 (中国疾控中心)" },
  yellowing: { url: "https://xdspkj.alljournals.cn/xdspkj/article/abstract/20211209", title: "野化白云黄茶闷黄过程中的品质成分变化及其菌种分离鉴定", pub: "现代食品科技 2021" },
  whitegrade: { url: "https://www.spkx.net.cn/CN/Y2016/V37/I20/42", title: "不同花色种类白茶的抗氧化活性及其主要品质化学成分分析", pub: "食品科学 2016" },
  whiteage: { url: "https://www.spkx.net.cn/CN/Y2025/V46/I7/217", title: "基于代谢组学的不同贮藏年份紧压寿眉白茶化学成分分析", pub: "食品科学 2025" },
  roast: { url: "https://www.spkx.net.cn/CN/abstract/abstract58119.shtml", title: "基于UPLC-Q-Exactive/MS的不同烘焙处理岩茶化学成分差异分析", pub: "食品科学 2023" },
  oolong: { url: "https://www.tea-science.com/CN/abstract/abstract579.shtml", title: "乌龙茶减肥功效的研究现状", pub: "茶叶科学 2001 · 林智等" },
  puer: { url: "https://www.spkx.net.cn/CN/Y2024/V45/I12/144", title: "普洱熟茶对糖脂代谢异常改善效果的临床研究", pub: "食品科学 2024 · 孙颖等" },
  fu1: { url: "https://www.spkx.net.cn/CN/10.7506/spkx1002-6630-20201028-284", title: "茯砖茶通过调节肠道菌群和胆汁酸代谢预防肥胖及高胆固醇血症作用机制", pub: "食品科学 2022 · 湖南农业大学" },
  fu2: { url: "https://www.tea-science.com/CN/10.13305/j.cnki.jts.2021.05.004", title: "茯砖茶对葡聚糖硫酸钠诱导UC小鼠炎症及肠道微生物的影响", pub: "茶叶科学 2021 · 湖南农业大学" },
  anji: { url: "https://www.tea-science.com/CN/10.13305/j.cnki.jts.1999.02.002", title: "安吉白茶特异性状的生理生化本质", pub: "茶叶科学 1999 · 成浩等" },
  albino: { url: "http://jtsb.ijournals.cn/html/2023/5/4642.htm", title: "白化和黄化茶树品种绿茶游离氨基酸、儿茶素类及咖啡碱差异分析", pub: "茶叶学报 2023" },
  hot: { url: "https://world.people.com.cn/n1/2016/0617/c1002-28452289.html", title: "喝热饮别超过65℃？世卫警告：可能致癌", pub: "人民网 2016 (IARC)" },
  caffeine: { url: "http://www.gz.xinhuanet.com/20260706/a427ee7278a9487d8501edd30c24930f/c.html", title: "新华读报｜每天喝多少咖啡合适？", pub: "新华网 2026 (EFSA)" },
  iron: { url: "http://health.people.com.cn/n/2015/0917/c21471-27599836.html", title: "释疑：喝茶到底会不会导致贫血？", pub: "人民网 · 生命时报 2015 (范志红, 中国农业大学)" },
  fluorosis: { url: "https://med.wanfangdata.com.cn/Paper/Detail/PeriodicalPaper_zgdfbxzz202001010", title: "2018年青海省海北州饮茶型氟中毒流行现状分析", pub: "中华地方病学杂志 2020" },
  gb19965: { url: "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=CCFBEE761CC13CBA8CCC28F9C5E40C7B", title: "国家标准 GB 19965-2005 砖茶含氟量", pub: "国家市场监督管理总局" },
  egcg: { url: "https://www.cirs-group.com/cn/food/ou-meng-wei-yuan-hui-fa-bu-xin-gui-lv-cha-ti-qu-wu-bei-na-ru-shi-pin-zhong-xian-zhi-wu-zhi-lie-biao", title: "欧盟委员会发布新规！绿茶提取物被纳入食品中限制物质列表", pub: "瑞旭集团 CIRS (EFSA 2018)" }
};

const tiles = {
  heart: { icon: "heart", title: "Heart & vessels", note: "Tea 3+ times a week: linked to ~20% fewer cases of heart disease & stroke · Chinese cohort, clearest for green tea", src: ["chinapar"] },
  heartG: { icon: "heart", title: "Heart & vessels", note: "Tea 3+ times a week: linked to ~20% fewer cases of heart disease & stroke · clearest for green tea", src: ["chinapar"] },
  bpG: { icon: "drop", title: "Blood pressure", note: "About −2.1 / −1.7 mmHg in trials · daily for 12+ weeks", src: ["bpmeta"] },
  bpR: { icon: "drop", title: "Blood pressure", note: "About −1.4 / −1.1 mmHg in trials · daily for 12+ weeks", src: ["bpmeta"] },
  catechin: { icon: "leaf", title: "Catechins (EGCG)", note: "Unoxidised leaf keeps the most EGCG · antioxidant in the lab; benefit in people not proven", src: ["theanine"] },
  focus: { icon: "mind", title: "Calm focus", note: "Theanine + caffeine together · steadier attention for a few hours", src: ["theanine"] },
  sugar: { icon: "shield", title: "Blood sugar", note: "Daily drinkers: linked to 8% lower type 2 diabetes risk · most drank green tea", src: ["ckb"] },
  life: { icon: "clock", title: "Longevity link", note: "2+ cups a day: linked to 9–13% lower risk of dying · UK, mostly black tea", src: ["ukbb"] },
  theaflavin: { icon: "leaf", title: "Theaflavins", note: "Red pigments born in oxidation · poorly absorbed, effects still unclear", src: ["theaflavin"] },
  whiteAox: { icon: "leaf", title: "Antioxidant buds", note: "Buds and young leaf, little processed · antioxidant in lab tests; not shown in people", src: ["whitegrade"] },
  needleAox: { icon: "leaf", title: "Antioxidant buds", note: "Strongest of the white teas in lab antioxidant tests · not shown in people", src: ["whitegrade"] },
  whiteAged: { icon: "clock", title: "Years in storage", note: "Ageing lowers catechins & amino acids, adds other polyphenols · health effect unknown", src: ["whiteage"] },
  white: { icon: "shield", title: "Blood sugar", note: "Lowered blood sugar in diabetic mice · one small human trial, not yet repeated", src: ["whitetea"] },
  yellow: { icon: "leaf", title: "Yellowing 闷黄", note: "Sealed yellowing lowers EGCG & other ester catechins vs green tea", src: ["yellowing"] },
  oolong: { icon: "flame", title: "Weight control", note: "Early Fujian clinical reports, uncontrolled · not confirmed by trials", src: ["oolong"] },
  roast: { icon: "flame", title: "Charcoal roast", note: "Medium-to-high roasting lowers catechins & amino acids · Wuyi Rougui study", src: ["roast"] },
  puer: { icon: "drop", title: "Blood lipids", note: "3 months ripe pu-erh: better HDL, BMI, liver fat · small, no comparison group", src: ["puer"] },
  fu: { icon: "gut", title: "Golden flower 金花", note: "Eurotium cristatum · gut microbes & cholesterol in rats", src: ["fu1", "fu2"] },
  anji: { icon: "leaf", title: "Amino-rich leaf", note: "Pale albino leaf · more free amino acids, more umami", src: ["anji", "albino"] },
  // mind the cup
  hot: { warn: true, icon: "therm", title: "Let it cool", note: "Sip below 65°C · very hot drinks linked to oesophageal cancer", src: ["hot"] },
  caffeine: { warn: true, icon: "bean", title: "Caffeine cap", note: "≤400 mg a day adults · ≤200 mg in pregnancy", src: ["caffeine"] },
  iron: { warn: true, icon: "iron", title: "Between meals", note: "Cuts plant-iron uptake · vitamin C offsets it", src: ["iron"] },
  ironR: { warn: true, icon: "iron", title: "Between meals", note: "Strongest iron blocker of the teas · vitamin C offsets it", src: ["iron"] },
  fluor: { warn: true, icon: "fluor", title: "Fluoride watch", note: "Mature-leaf brick tea · national limit GB 19965 · not all day, every day", src: ["fluorosis", "gb19965"] },
  extract: { warn: true, icon: "cup", title: "Cups, not capsules", note: "EGCG extract ≥800 mg a day → liver strain · brewed tea far below", src: ["egcg"] }
};

const BRICK_IDS = new Set(["fuzhuan", "qianliang", "zangcha", "jingyang", "qingzhuan", "heizhuan", "mizhuan", "huazhuan"]);
const FU_IDS = new Set(["fuzhuan", "jingyang"]);
const RIPE_IDS = new Set(["shupu", "laochatou", "xiaoqinggan"]);
const isBrick = t => t.type === "dark" && (BRICK_IDS.has(t.id) || /砖|茯|边茶|藏茶|金尖|千两/.test(t.zh));
const isFu = t => t.type === "dark" && (FU_IDS.has(t.id) || /茯/.test(t.zh));
const isRipe = t => t.type === "dark" && (RIPE_IDS.has(t.id) || /熟/.test(t.zh));
const isRoast = t => t.type === "oolong" && (t.f ? t.f.roast >= 3 : ["wuyi", "wuyihist"].includes(t.group));
const isNeedle = t => t.type === "white" && (["yinzhen", "zhengheyz"].includes(t.id) || /银针/.test(t.zh));
const isAgedWhite = t => t.type === "white" && (t.id === "shoumei" || /老白茶|白茶饼|饼/.test(t.zh));
const isAlbino = t => t.type === "green" && (t.id === "anji" || /安吉白|白叶|白片|白茶/.test(t.zh));

// The tile keys for one tea: benefits first, then the "mind the cup" notes.
function pick(t) {
  const k = [];
  if (t.type === "green") k.push("heartG", "bpG", "catechin", "focus", "sugar");
  // China-PAR found no clear heart link for black tea, so red teas cite the UK cohort instead
  else if (t.type === "red") k.push("bpR", "life", "focus", "sugar", "theaflavin");
  else {
    if (t.type === "white") k.push(isNeedle(t) ? "needleAox" : "whiteAox", "white");
    if (isAgedWhite(t)) k.push("whiteAged");
    if (t.type === "yellow") k.push("yellow");
    if (t.type === "oolong") k.push("oolong");
    if (isRoast(t)) k.push("roast");
    if (isRipe(t)) k.push("puer");
    if (isFu(t)) k.push("fu");
    k.push("heart", "sugar");
    if (t.type !== "dark") k.push("focus");
  }
  if (isAlbino(t)) k.push("anji");
  k.push("hot", "caffeine", t.type === "red" ? "ironR" : "iron");
  if (isBrick(t)) k.push("fluor");
  if (t.type === "green") k.push("extract");
  return k;
}

module.exports = { sources, tiles, pick };
