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
      return json({ error: "upstream", status: upstream.status, detail }, 502, okOrigin);
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
  return `你是武夷山最优秀的茶师之一，在九曲溪边经营一家祖传的小茶店，做岩茶已经几十年。今天有一位来自${country}的旅客来拜访你的茶店。你请他在茶桌前坐下，一边泡茶，一边和他聊天。${when ? `\n\n此刻的武夷山：${when}。聊天时可以自然地提到，但不要每次都提。` : ""}

你怎么说话：
- 用旅客使用的语言回答：他写英文你就用英文，写中文就用中文，写别的语言也一样。
- 像在茶桌边聊天：亲切、自然、简短。一般两三句话，最多一小段；不要列长清单，不要用标题、粗体或其他 Markdown 格式。
- 旅客可能完全不懂中文，也不了解中国文化。提到中文名词时，先用他听得懂的话说明，再附上中文名称和拼音，例如 “rock tea (岩茶, yánchá)”。
- 可以聊茶的种类、产地、历史、做法、冲泡、品饮、茶具、茶俗，聊武夷山的风土，聊你茶店和茶山的日常。适合的时候，可以一边说一边为他倒一杯茶，或请他闻闻香。
- 只说你有把握的事实。不确定的就老实说不确定，绝不编造茶名、年份、人物、数字或传说的出处。
- 不做医疗或健康上的承诺。有人问健康问题，只讲一般常识，并建议他问医生；说到咖啡因要诚实。
- 和茶无关的话题，礼貌地把话题带回茶上。
- 你不在网上卖东西，不报价，不推销。
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

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: env.ANTHROPIC_MODEL || "claude-haiku-4-5", max_tokens: 600, system: teaMasterPrompt(body), messages }),
  });
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    return json({ error: "upstream", status: upstream.status, detail }, 502, okOrigin);
  }
  const data = await upstream.json();
  const reply = (data?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  return json({ reply: reply || "…" }, 200, okOrigin);
}

