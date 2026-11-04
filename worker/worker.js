// Tea pairing proxy for the GitHub Pages build.
// POST /pair { food, catalogue } -> { picks:[{id,why}], tip } | { error }
// POST /chat { messages:[{role,content}], country, season, moment, tod, fest } -> { reply, movements } | { error }
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
- 推荐茶的时候，按旅客的口味和问题挑最合适的，可以是中国任何地方、任何茶类的茶，不要只推荐福建茶或岩茶。你店里也备着各地的好茶，可以泡给他喝。适合的时候，可以一边说一边为他倒一杯茶，或请他闻闻香。
- 你不只是讲解茶的人，也是一位好客、好奇的主人。旅客想闲聊就陪他闲聊：家常、旅途、吃的、天气、他的工作和生活，都可以聊。认真听他说，记住他说过的话，像老朋友一样陪着他。
- 你对远方的国家很好奇。偶尔（不是每次）自然地反问他一两个问题：他的国家那边喝不喝茶、怎么喝，吃什么，现在是什么季节，他家乡是什么样子；听完可以和武夷山的生活比一比，或者顺着他的喜好推荐一杯茶。不要连珠炮似的发问，一次最多问一个问题。
- 只说你有把握的事实。不确定的就老实说不确定，绝不编造茶名、年份、人物、数字或传说的出处。
- 不做医疗或健康上的承诺。有人问健康问题，只讲一般常识，并建议他问医生；说到咖啡因要诚实。
- 闲聊不必每句都扯到茶上，但你始终是茶店里的主人，话题自然地回到茶桌边就好。
- 遇到政治、宗教、争议性的时事这类话题，温和地笑着岔开，不表达立场。不要谈论关于旅客国家的负面刻板印象。
- 如果旅客看起来心情低落或遇到难处，先体贴地听他说、安慰他；严重的事情，温和地建议他找身边信任的人或专业人士帮忙。不要假装能代替医生、律师或心理咨询师。
- 你不在网上卖东西，不报价，不推销。
- 介绍自己时像普通中国人那样先说姓，例如“我姓林，叫我林师傅就行”；旅客问起才说全名。不要编造关于你家人的具体名字或你生平中可以查证的“真实”经历。
- 你是网站 Cha 里一位虚构的茶师，由 AI 扮演。如果旅客真诚地问你是不是真人或 AI，要如实说你是 AI。`;
}

const MOVEMENT_RULES = `\n\nYou answer as a JSON object: "reply" is what you say out loud (the persona rules above apply to it; no stage directions), and "movements" are the gestures you make while saying it. Choose movements yourself in response to the guest and what you say. Gestures: talking (explaining or chatting), pouring (brewing or refilling), offering (inviting the guest to taste), idle (listening or a quiet pause). Give 1–4 cues in time order; the first has at 0. Each "at" is a fraction of the answer's playback, from 0 up to but not including 1. Space cues apart so each gesture has time to read; to serve tea, pour and then offer.`;
const CHAT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    movements: {
      type: "array",
      items: {
        type: "object",
        properties: { gesture: { type: "string", enum: ["talking", "pouring", "offering", "idle"] }, at: { type: "number" } },
        required: ["gesture", "at"],
        additionalProperties: false,
      },
    },
  },
  required: ["reply", "movements"],
  additionalProperties: false,
};

/* Read {reply, movements}; if the model ever answers in plain text anyway, keep the words and let him just talk. */
function parseChat(text) {
  if (!text) return null;
  const tries = [text, text.replace(/^```(?:json)?\s*|\s*```$/g, ""), (text.match(/\{[\s\S]*\}/) || [""])[0]];
  for (const t of tries) {
    try { const r = JSON.parse(t); if (r && typeof r.reply === "string" && r.reply.trim()) return r; } catch {}
  }
  if (/^\s*[{\[]/.test(text)) return null;
  return { reply: text, movements: [{ gesture: "talking", at: 0 }] };
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

  /* Structured outputs make Claude return exactly {reply, movements}. Without them the model saw its earlier turns as
     plain text in the history, copied that style on the second turn, the JSON parse failed and every later message
     came back as "couldn't be reached". */
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-haiku-4-5",
      max_tokens: 1024,
      system: teaMasterPrompt(body) + MOVEMENT_RULES,
      messages,
      output_config: { format: { type: "json_schema", schema: CHAT_SCHEMA } },
    }),
  });
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    console.log("chat upstream error", upstream.status, detail);
    return json({ error: "upstream", status: upstream.status }, 502, okOrigin);
  }
  const data = await upstream.json();
  /* If Claude declines (e.g. a threat or abuse), he stays in character and steers back to tea instead of an error. */
  if (data?.stop_reason === "refusal") {
    const zh = /[\u4e00-\u9fff]/.test(messages[messages.length - 1].content);
    const reply = zh ? "哎，这话我就不接了。来，先喝口茶，消消气，我们聊点别的吧。" : "Ah, I'll leave that one alone. Here, have some tea and let's talk about something else.";
    return json({ reply, movements: [{ gesture: "pouring", at: 0 }, { gesture: "offering", at: 0.5 }] }, 200, okOrigin);
  }
  const text = (data?.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  const result = parseChat(text);
  if (!result) {
    console.log("chat invalid_response", data?.stop_reason, text.slice(0, 300));
    return json({ error: "invalid_response" }, 502, okOrigin);
  }
  const allowed = new Set(["talking", "pouring", "offering", "idle"]);
  const movements = (Array.isArray(result.movements) ? result.movements : [])
    .filter(c => c && allowed.has(c.gesture) && Number.isFinite(c.at) && c.at >= 0 && c.at < 1)
    .slice(0, 4).map(c => ({ gesture: c.gesture, at: c.at })).sort((a, b) => a.at - b.at);
  if (!movements.length) movements.push({ gesture: "talking", at: 0 });
  return json({ reply: result.reply.trim(), movements }, 200, okOrigin);
}
