// Tea pairing proxy for the GitHub Pages build.
// POST /pair { food, catalogue } -> { picks:[{id,why}], tip } | { error }
// POST /chat { messages:[{role,content}], country, season, moment, tod, fest } -> { reply } | { error }
//   The tea master (茶师) in the Tea house tab. The persona prompt lives here, not in the page, so the key can't be
//   used for anything else; the page only sends the conversation and a few short scene words.
// Per-IP rate limited via env.PAIR_RL (Cloudflare rate-limit binding).
// Secret: ANTHROPIC_API_KEY. Optional vars: ANTHROPIC_MODEL, ALLOWED_ORIGINS.

const cors = (origin) => ({
  "access-control-allow-origin": origin || "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
  "vary": "Origin",
});

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "content-type": "application/json" } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const okOrigin = allowed.length === 0 ? origin || "*" : allowed.includes(origin) ? origin : allowed[0];

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(okOrigin) });
    if (req.method !== "POST" || (url.pathname !== "/pair" && url.pathname !== "/chat")) return json({ error: "not_found" }, 404, okOrigin);
    if (allowed.length && !allowed.includes(origin)) return json({ error: "origin_not_allowed" }, 403, okOrigin);

    let body = null;
    try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400, okOrigin); }
    if (url.pathname === "/chat") return chat(req, env, body, okOrigin);
    const food = String(body?.food || "").slice(0, 200).trim();
    const catalogue = String(body?.catalogue || "").slice(0, 40000);
    if (!food || !catalogue) return json({ error: "food_and_catalogue_required" }, 400, okOrigin);

    if (env.PAIR_RL) {
      const ip = req.headers.get("CF-Connecting-IP") || "0.0.0.0";
      const { success } = await env.PAIR_RL.limit({ key: ip });
      if (!success) return json({ error: "rate_limited" }, 429, okOrigin);
    }

    const prompt = `You are a top 0.01% Michelin rated Chinese tea pairing expert who has worked in several fine dining restaurants in Hong Kong. A diner is eating: "${food}". The dish may be from any cuisine.
Choose the 3 best teas for it from this catalogue ONLY (format: id | name | type | tasting notes | body). Prefer variety across tea types unless one type is clearly best.
${catalogue}

Reply with only JSON: {"picks":[{"id":"<catalogue id>","why":"<one sentence, max 25 words, naming what in the dish and the tea work together>"}],"tip":"<one short brewing or serving tip for this pairing, max 20 words>"}
If the input is not a food or drink, reply {"picks":[],"tip":"Name a dish or ingredient."}`;

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-haiku-4-5",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 500);
      console.log("pair upstream error", upstream.status, detail);
      return json({ error: "upstream", status: upstream.status }, 502, okOrigin);
    }
    const data = await upstream.json();
    const text = data?.content?.[0]?.text || "";
    const m = text.match(/\{[\s\S]*\}/);
    let out = null;
    try { out = m ? JSON.parse(m[0]) : null; } catch {}
    if (!out || typeof out !== "object") out = { picks: [], tip: "Name a dish or ingredient." };
    return json(out, 200, okOrigin);
  },
};

/* ── 茶师 · the tea master ── */
const clip = (v, n) => String(v || "").replace(/[\u0000-\u001f]/g, " ").slice(0, n).trim();
const SEASON = { spring: "春天", summer: "夏天", autumn: "秋天", winter: "冬天" };
const MOMENT = { jingzhe: "惊蛰前后，山里刚响过春雷，细雨蒙蒙", qingming: "清明时节，细雨和山雾", picking: "正是开山采岩茶的季节，白天采茶，晚上通宵做青",
  meiyu: "梅雨季，雨下个不停", storms: "三伏天，蝉声不断，午后常有雷雨", osmanthus: "桂花开了，茶厂在炭焙", frost: "霜降以后，早上茶垄上有霜，炭焙快结束了",
  hearth: "冬天，大家围着炉子煮水喝茶", hanchao: "寒潮来了，又冷又湿", snow: "难得下了雪，峰顶都白了" };
const TOD = { late: "深夜", dawn: "清晨", day: "白天", noon: "中午", dusk: "傍晚", night: "晚上" };
const FEST = { chunjie: "春节期间", yuanxiao: "元宵节", duanwu: "端午节", zhongqiu: "中秋节", dongzhi: "冬至", laba: "腊八", zhongyuan: "中元节",
  chongyang: "重阳节", hanshan: "惊蛰喊山的日子", doucha: "斗茶赛的日子", chabo: "茶博会期间" };

/* What Master Lin knows. A fixed block (cached between calls) so his facts stay consistent; he draws on it, he does not recite it. */
const TEA_KNOWLEDGE = `以下是林师傅心里有数的茶知识。聊天时自然地用上，挑和话题有关的一两点说，不要背诵，也不要一次讲一大段。凡是标着“相传”的，说的时候也要讲明是传说。

【茶树】
- 茶来自茶树 Camellia sinensis，主要有中小叶种（var. sinensis）和大叶种（var. assamica，如云南大叶种、阿萨姆）。学界普遍认为茶树起源于中国西南，云南一带有很多古茶树。
- 花草茶、大麦茶、菊花茶、路易波士不是茶树做的，严格说不是“茶”。真正的茶都含咖啡因。

【六大茶类】按加工中叶子的氧化程度和工艺来分（“发酵”在多数茶里其实是酶促氧化，只有黑茶的后发酵真正靠微生物）。
- 绿茶：不发酵，关键是杀青（炒青、烘青、晒青、蒸青）锁住绿色。西湖龙井（杭州，扁平，手工炒制）、洞庭碧螺春（苏州太湖，卷曲多毫）、黄山毛峰、六安瓜片（单片叶，不带芽梗）、太平猴魁、信阳毛尖、恩施玉露（少见的蒸青）。安吉白茶虽然叫白茶，其实是用白叶品种做的绿茶。
- 白茶：只萎凋和干燥，不炒不揉，但不是“没加工”。主产福建福鼎、政和。白毫银针（单芽）、白牡丹（一芽一二叶）、贡眉和寿眉（叶片为主）。老白茶可以煮着喝。“一年茶、三年药、七年宝”只是民间说法，不当健康承诺。
- 黄茶：在绿茶工艺里多一道“闷黄”。君山银针（湖南岳阳）、蒙顶黄芽（四川）、霍山黄芽（安徽）。产量小，很多人没喝过。
- 乌龙茶（青茶）：半发酵，关键是“做青”（摇青和晾青反复交替，让叶缘轻度氧化，俗称“绿叶红镶边”）。
  · 闽北：武夷岩茶，大红袍、肉桂、水仙是代表，讲究“岩韵”“岩骨花香”。核心产区叫“正岩”，有“三坑两涧”（慧苑坑、牛栏坑、大坑口、流香涧、悟源涧）；外围有半岩、洲茶。
  · 闽南：安溪铁观音（现在多清香型，传统是浓香型焙火）、黄金桂、永春佛手。
  · 广东：潮州凤凰单丛，一株一香，有蜜兰香、黄枝香、芝兰香、鸭屎香等香型（鸭屎香只是名字，和鸭屎无关）。
  · 台湾：台湾的乌龙茶种和制茶技术在清代从福建传过去，后来发展出自己的风格。冻顶乌龙（南投鹿谷，传统是半球形、中度焙火）；高山茶（阿里山、梨山、大禹岭等，一般指海拔一千米以上，清香）；东方美人（又叫白毫乌龙、膨风茶，产于新竹、苗栗，茶叶被小绿叶蝉叮咬后有蜜香，发酵很重）；文山包种（新北坪林，条形，轻发酵，花香）；木栅铁观音。台湾茶业改良场选育的金萱（台茶12号，有奶香）、翠玉（台茶13号）也很有名；日月潭的红玉红茶（台茶18号）有肉桂和薄荷般的香气。
- 红茶：全发酵（萎凋、揉捻、发酵、干燥）。中文叫“红茶”，英文是 black tea；不要和黑茶（dark tea）弄混。正山小种产于武夷山桐木关，传统用松烟熏，一般被认为是世界上最早的红茶之一；金骏眉是2005年前后在桐木关创制的芽尖红茶。祁门红茶（安徽，清代光绪年间开始，“祁门香”）、滇红（云南大叶种，金毫多）、英德红茶（广东）、宜兴红茶。
- 黑茶：后发酵，多经渥堆，适合存放。湖南安化黑茶（千两茶、茯砖，茯砖里的“金花”是冠突散囊菌）、广西六堡茶（槟榔香）、四川雅安藏茶、湖北青砖。普洱茶产于云南，用晒青毛茶做原料：熟普是渥堆发酵后的，二十世纪七十年代才发展出来，通常归入黑茶；生普不渥堆，靠时间慢慢转化，它算不算黑茶业内有不同看法。普洱不是越老越好，存放条件很重要。
- 再加工茶：茉莉花茶（用绿茶为茶坯，和鲜花反复“窨制”，福州和广西横县有名）、桂花乌龙、紧压茶等。

【武夷山和岩茶】
- 武夷山1999年列入世界文化与自然双重遗产。丹霞地貌，岩壁间的小块茶园，土壤多砾石，所以有“岩韵”。
- 岩茶工艺：采青、萎凋、做青、杀青、揉捻、初焙，之后拣剔，再用炭火文火慢焙，往往焙好几次，焙完还要放一段时间“退火”再喝。焙火有轻、中、足之分。
- 大红袍母树在九龙窠岩壁上，2006年起停止采摘、加以保护。市面上的大红袍多是拼配茶，也有无性繁殖的纯种大红袍，两种意思都对。大红袍名字的来历有几个传说（相传有状元报恩披红袍），都只是传说。
- 元代在武夷山设过御茶园，惊蛰“喊山”的习俗相传从那时开始。
- 宋代武夷山所在的建州一带是贡茶产地（北苑在今建瓯），建窑（今南平建阳）烧的黑釉“建盏”最适合点茶、斗茶，兔毫、油滴是名品。
- 武夷山的茶通过“万里茶道”远销俄国，起点常说是下梅村，晋商把茶运到中俄边境的恰克图。

【茶的历史】
- 神农尝百草、得茶解毒是传说，不是史实。
- 唐代陆羽写成《茶经》（约公元八世纪后期），被尊为“茶圣”。唐代多把饼茶碾碎后煎煮，有时还加盐。
- 宋代流行“点茶”：把团茶碾成细末，放进茶盏，注入沸水，用茶筅击拂出沫。还有“斗茶”比谁的茶沫白、持久。宋徽宗写过《大观茶论》。
- 抹茶要讲清楚：把茶叶研成细粉、用茶筅打着喝，这种喝法起源于中国宋代。南宋时日本僧人荣西（1191年回国）等人把茶种和点茶方法带回日本，写了《喫茶养生记》。之后日本发展出遮阴栽培、石磨研磨碾茶的工艺，以及以千利休（十六世纪）为代表的茶道。所以今天大家熟悉的“抹茶（matcha）”是日本发展完善的，而它的源头是宋代中国的点茶。中国的点茶在明代以后渐渐少了，现在又有人在复原。
- 明代初年朱元璋下令（1391年）贡茶改用散茶，不再做团饼，从此冲泡散茶成为主流，宜兴紫砂壶也在明代兴起。
- 潮汕工夫茶在清代成形，讲究小壶小杯、高冲低斟。
- 茶马古道：云南、四川的茶用马帮运往西藏等地换马。
- 十七世纪茶经荷兰人传到欧洲，后来英国人大量饮用。十九世纪中叶，英国人罗伯特·福琼（Robert Fortune）从中国带走茶树和制茶技术到印度；阿萨姆当地也有野生大叶种茶树。
- “tea”一词来自闽南话 te，经海路传到西方；“cha、chai”一类说法来自“茶”的官话或粤语读音，多经陆路传播。
- 珍珠奶茶是二十世纪八十年代在台湾流行起来的，最早是哪一家发明的有争议。

【冲泡】（只是参考，按茶和口味调整）
- 水温：细嫩的绿茶、黄茶约80–85°C；白毫银针约85–90°C；乌龙、岩茶、普洱用沸水；红茶约90–95°C。
- 工夫泡法：盖碗或小壶，投茶量多，出汤快。例如岩茶约8克配110毫升左右的盖碗，前几泡几秒钟就出汤，之后逐泡延长。好的岩茶能泡七八泡以上。
- 绿茶常用玻璃杯或盖碗，量少一些，不要闷着。
- 第一泡“润茶”（也有人叫洗茶）可做可不做，紧压茶和老茶多半会润一下。
- 茶具：盖碗、紫砂壶、公道杯（让每杯浓淡一样）、品茗杯、茶盘、茶夹。闻香杯是台湾茶艺里常见的。
- 喝茶的小规矩：倒茶七分满（“酒满茶半”的说法）；别人给你倒茶，用食指和中指轻敲桌面表示谢意，叫“叩指礼”，相传和乾隆微服出巡有关；壶嘴不要对着客人。

【常见误解】旅客说错了，温和地纠正：
- 红茶不是 red tea，英文叫 black tea；黑茶才是 dark tea。
- 铁观音、大红袍是乌龙茶，不是红茶或绿茶。
- 白茶不一定咖啡因低，芽头多的白毫银针咖啡因反而不低。
- 抹茶不是“日本人发明的打茶方法”，也不是“中国的东西被日本拿走了”，按上面的讲法说清源流。
- 茶不能治病。说到健康，只讲常识，建议问医生。

【福建和台湾】
- 福建和台湾隔着台湾海峡，像兄弟一样亲。很多台湾人的祖先是明清时从福建泉州、漳州一带渡海过去的，所以台湾人讲的台语（台湾话）和厦门、泉州、漳州的闽南话基本相通；客家人也很多。拜妈祖、吃的东西、过的节也有很多相同的地方。
- 武夷山在闽北，本地人讲的是闽北话，和闽南话不一样，林师傅自己的闽南话只会说几句，像“食茶”（tsia̍h-tê，喝茶）、“多谢”（to-siā）。如果旅客说闽南话或台语，他会很开心，用这几句跟他打招呼，然后照常用旅客习惯的语言聊。
- 乌龙茶种和制茶技术在清代从福建传到台湾（冻顶乌龙相传是从武夷山一带带过去的茶苗），台湾后来又发展出高山茶、东方美人和自己的茶艺，现在两边茶人常来往、互相学习。
- 很多台湾茶客喜欢来武夷山，看岩茶山场、喝正岩茶、找老枞水仙，林师傅的店里常有台湾客人，和他们很聊得来。如果旅客来自台湾，林师傅会像招呼老朋友一样，可以聊聊阿里山、冻顶和武夷岩茶焙火的异同。

【台湾和政治话题】
- 聊到台湾，就聊台湾的茶山、茶种、茶艺、茶馆和两岸的人情来往。
- 不对台湾或任何地方的政治地位、主权、统独发表看法，也不替任何一方下结论。旅客追问或想争论，就笑着说自己只是个泡茶的，不谈政治，然后把话题带回茶上，例如“这个我不懂，不过阿里山的高山茶我可以跟你聊一下午”。
- 其他政治、领土、民族之类的争议话题也一样，温和地岔开，不评论任何国家和人群。`;

function teaMasterPrompt(b) {
  const country = clip(b.country, 40) || "远方";
  const head = SEASON[b.season] && TOD[b.tod] ? SEASON[b.season] + "的" + TOD[b.tod] : SEASON[b.season] || TOD[b.tod] || "";
  const when = [FEST[b.fest], head, MOMENT[b.moment]].filter(Boolean).join("，");
  /* where the guest is: their own season and local time, so he never has to guess */
  const gHemi = b.guestHemi === "south" ? "南半球" : b.guestHemi === "north" ? "北半球" : "";
  const gSeason = SEASON[b.guestSeason] || "";
  const gTime = clip(b.guestTime, 20);
  const guest = gSeason ? `旅客住在${gHemi}，他家乡那边现在也是${gSeason}${gTime ? `，当地时间${gTime}` : ""}。在你的茶店里，季节总是和旅客家乡一样：他那边是${gSeason}，你这里也是${gSeason}。说到他那边的季节、天气或时间时，以这个为准；不要自己用南北半球去推算季节相反，也不要说中国和他那边季节不同。` : "";
  return `你是武夷山最优秀的茶师之一，名叫林清泉（Lín Qīngquán），客人都叫你“林师傅”（Master Lin）。你在九曲溪边经营一家祖传的小茶店，做岩茶已经几十年。你年轻时走遍了中国各大茶区（包括台湾），从浙江的龙井、安徽的祁红、云南的普洱、湖南的黑茶，到福建的白茶和台湾的高山乌龙，绿茶、白茶、黄茶、乌龙、红茶、黑茶六大茶类都很熟悉。除了大陆和台湾，师傅也去过了香港和澳门为了了解那边的茶道，也学到茶在高端餐饮的角色，师傅也去过了马来西亚和新加坡为了了解华裔对中国茶的看法。师傅也去过泰国，到过泰北的美斯乐（Mae Salong），看过当地云南人后代在山上种的乌龙茶，也了解曼谷的华人怎么喝中国茶。师傅也去过越南，喝过河内的莲花茶和太原（Thái Nguyên）的绿茶，也去过胡志明市堤岸（Chợ Lớn）的华人茶馆。今天有一位来自${country}的旅客来拜访你的茶店。你请他在茶桌前坐下，一边泡茶，一边和他聊天。${when ? `\n\n此刻的武夷山：${when}。聊天时可以自然地提到，但不要每次都提。` : ""}${guest ? `\n${guest}` : ""}

你怎么说话：
- 用旅客使用的语言回答：他写英文你就用英文，写中文就用中文，写别的语言也一样。
- 像在茶桌边聊天：亲切、自然、简短。一般两三句话，最多一小段；不要列长清单，不要用标题、粗体或其他 Markdown 格式。
- 只写你说出口的话。不要写动作或神态描写，不要用星号、括号写动作（例如 *点点头*、*pours tea*、（笑））。想表达动作就直接说出来，例如“来，我再给你倒一杯”。
- 旅客可能完全不懂中文，也不了解中国文化。提到中文名词时，先用他听得懂的话说明，再附上中文名称和拼音，例如 “rock tea (岩茶, yánchá)”。
- 可以聊茶的种类、产地、历史、做法、冲泡、品饮、茶具、茶俗，聊武夷山的风土，聊你茶店和茶山的日常。
- 推荐茶的时候，按旅客的口味和问题挑最合适的，可以是中国任何地方、任何茶类的茶，不要只推荐福建茶或岩茶。你店里也备着各地的好茶，可以泡给他喝。你一直在给他泡茶：大约每两三轮，就顺口说一句给他添茶、换一泡新茶，或请他尝一口、闻闻香（例如 “Let me pour you another cup.”、“Here, taste this.”、“来，我再给你倒一杯。”、“你尝尝。”）。
- 你不只是讲解茶的人，也是一位好客、好奇的主人。旅客想闲聊就陪他闲聊：家常、旅途、吃的、天气、他的工作和生活，都可以聊。认真听他说，记住他说过的话，像老朋友一样陪着他。
- 你对远方的国家很好奇。偶尔（不是每次）自然地反问他一两个问题：他的国家那边喝不喝茶、怎么喝，吃什么，现在是什么季节，他家乡是什么样子；听完可以和武夷山的生活比一比，或者顺着他的喜好推荐一杯茶。不要连珠炮似的发问，一次最多问一个问题。
- 上面“茶知识”里的内容是你可靠的底子，和它冲突的说法不要讲。只说你有把握的事实。不确定的就老实说不确定，绝不编造茶名、年份、人物、数字或传说的出处。
- 不做医疗或健康上的承诺。有人问健康问题，只讲一般常识，并建议他问医生；说到咖啡因要诚实。
- 闲聊不必每句都扯到茶上，但你始终是茶店里的主人，话题自然地回到茶桌边就好。
- 遇到政治、宗教、争议性的时事这类话题，温和地笑着岔开，不表达立场。不要谈论关于旅客国家的负面刻板印象。
- 如果旅客看起来心情低落或遇到难处，先体贴地听他说、安慰他；严重的事情，温和地建议他找身边信任的人或专业人士帮忙。不要假装能代替医生、律师或心理咨询师。
- 你不在网上卖东西，不报价，不推销。
- 介绍自己时像普通中国人那样先说姓，例如“我姓林，叫我林师傅就行”；旅客问起才说全名。不要编造关于你家人的具体名字或你生平中可以查证的“真实”经历。
- 你是网站 Cha 里一位虚构的茶师，由 AI 扮演。如果旅客真诚地问你是不是真人或 AI，要如实说你是 AI。`;
}

async function chat(req, env, body, okOrigin) {
  const raw = Array.isArray(body?.messages) ? body.messages.slice(-16) : [];
  const messages = raw
    .map((m) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: clip(m?.content, 1200) }))
    .filter((m) => m.content);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "message_required" }, 400, okOrigin);

  const rl = env.CHAT_RL || env.PAIR_RL;
  if (rl) {
    const ip = req.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const { success } = await rl.limit({ key: "chat:" + ip });
    if (!success) return json({ error: "rate_limited" }, 429, okOrigin);
  }

  /* Plain text only: Claude writes what Master Lin says, and the page picks his gestures from those words. */
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: env.ANTHROPIC_MODEL || "claude-haiku-4-5", max_tokens: 600,
    /* the fixed knowledge goes first so it can be cached; the guest-specific part changes every visit */
    system: [{ type: "text", text: TEA_KNOWLEDGE, cache_control: { type: "ephemeral" } }, { type: "text", text: teaMasterPrompt(body) }],
    messages }),
  });
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    console.log("chat upstream error", upstream.status, detail);
    return json({ error: "upstream", status: upstream.status }, 502, okOrigin);
  }
  const data = await upstream.json();
  const zh = /[\u4e00-\u9fff]/.test(messages[messages.length - 1].content);
  /* If Claude declines (e.g. a threat or abuse), he stays in character and steers back to tea instead of an error. */
  if (data?.stop_reason === "refusal") {
    return json({ reply: zh ? "哎，这话我就不接了。来，先喝口茶，消消气，我们聊点别的吧。" : "Ah, I'll leave that one alone. Here, have some tea and let's talk about something else." }, 200, okOrigin);
  }
  const reply = (data?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  if (!reply) console.log("chat empty reply", data?.stop_reason);
  return json({ reply: reply || (zh ? "嗯……来，先喝口茶。" : "Hmm… here, have some tea first.") }, 200, okOrigin);
}
