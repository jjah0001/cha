# Cha 茶 — source

Cha: 茶 (chá, tea) and 查 (chá, to look up). Live at https://jjah0001.github.io/cha/

Builds `dist/cha.html`, a single self-contained page (map, profiles, timer, pairing, personality test, shelf, and an About 关于我们 tab explaining the site's aims, the Wuyi background and its sounds, with "See it" links that preview each scene).

## Build
```
npm install
npm run setup     # one-off: county map data from GitHub (longwosion/geojson-map-china)
npm run check     # validate the tea lists
npm run build     # writes dist/cha.html
```

Open `dist/cha.html` in your browser after building. The root `index.html`
is the source template, not the runnable page: the build injects its tea data
and reviews module. Opening the template directly causes `DATA is not defined`.

## Background and ambience (武夷山 through the year)

The page background is a Wuyi tea mountain that follows the visitor's own season (flipped south of the equator), the
real sunrise and sunset in their time zone, and the solar terms (节气). Each season has its moments:

| Season | Moment | What you see and hear |
|---|---|---|
| Spring | 惊蛰 | drizzle, mist between the peaks, the first thunder far off |
| Spring | 清明 | drizzle and mountain mist, cuckoos |
| Spring | 开山采茶 (谷雨–立夏) | pickers on the slopes calling to each other, sieves of leaves withering, 做青 all night |
| Spring / Summer | 梅雨 | steady rain on the eaves, cloud between the peaks, frogs |
| Summer | 三伏 | cicadas loudest at noon, a thunderstorm with lightning on about half the afternoons (the same days for every visitor, starting between about 13:30 and 16:30 and lasting 1–2.5 hours); the other afternoons stay clear and hot |
| Autumn | 桂花 (白露–寒露) | osmanthus flowers drifting down, the charcoal roast |
| Autumn | 霜降 | frost on the tea rows in the morning, fewer crickets |
| Winter | 围炉 | wood stove and kettle |
| Winter | 寒潮 (大寒 to 雨水) | frost on the rows in the morning, cold drizzle, cloud between the peaks |
| Winter | 瑞雪 | a rare snowfall: only every three or four years (2027, 2030, 2033, 2037…), for two or three days in the cold spell; snow on the summits and falling, the eaves frozen |

The day runs late (after midnight) · dawn · day · noon · dusk · night: roosters before first light, the 午休 hush, dogs
after dark, the roasting-house lamp left on through the night only when tea is being made. The moon shows its real phase. After dark (night and the small hours) the whole page switches to its night colours on every device, like Oelek's kampung, so a computer in light mode and a phone in dark mode show the same night; by day it follows the device's setting.
The lunar festivals keep their real dates in both hemispheres, as Chinese communities there keep them; 冬至 follows the visitor's own winter;
the tea year's own days (喊山, 斗茶赛) follow the visitor's season like the solar-term moments:

- **喊山** (惊蛰 day, mornings): Wuyi's old rite at the imperial tea garden by the fourth bend — red flags, gongs and drums,
  and three great strokes of drum and gong to wake the tea bushes. (The crowd's shout of "茶发芽！" is left out until there
  is a real recording of it; synthesised voices sounded wrong.)
- **斗茶赛** (a few days after 小满, by day; the real contests have no fixed date): people gathered at the tea house under a
  red banner, cups and kettles, and a cheer and applause for the 茶王.
- **茶博会** (15–19 November, the usual week of the 海峡两岸茶业博览会 in 武夷山市; the exact dates move a little each year):
  visitors from town on the path to the tea house.

- **春节**: lanterns on the tea house from 除夕 to 元宵. 除夕 night has the most firecrackers and fireworks over the
  villages (each rocket whistles up and bangs, later the farther off it burst); 初一 to 初五 have firecrackers and
  drum-and-gong troupes (锣鼓) by day, with a lion dance (舞狮) in front of the tea house — walking to and fro, bobbing,
  shaking its head and rearing up while its troupe plays close by and the crowd cheers; 元宵 has the lion dance by day, and
  at night strings lanterns along the path while a glowing dragon lantern (龙灯) winds along it on poles, with its drums
  and crowd, fireworks and a bamboo flute.
- **端午** (三天, e.g. 2027年6月8–10日): mugwort and calamus (艾草菖蒲) hung by the tea-house door, more smoke from the
  kitchen, 粽子 boiling on the stove, a few firecrackers on the day, and two dragon boats (red and gold) racing down the stream
  by day, paddles flashing: the big drum, gong, the crews' shouts and paddles, speeding up in the sprint. It falls in the plum rains,
  so it usually rains.
- **冬至** (the eve and the day): follows the sun, so it falls in the visitor's own winter — 21/22 December north of the
  equator, 21 June south of it. On the eve the family rolls 冬至圆 at the table and the lamp burns bright from dusk on
  the longest night; on the morning, 汤圆 boil on the stove.
- **腊八** (腊月初八): a pot of 腊八粥 on the stove from first light, the temple bell longer that morning.
- **中元** (七月十五): a quiet evening — the temple bell at dusk, 木鱼 and chanting, river lanterns drifting down the stream.
- **重阳** (九月初九): climbers on the summit, chrysanthemums by the door, calls from the peaks on a stronger wind.
- **中秋** (three nights): a family night. At dusk the tea house is lit up for the reunion dinner (talk, laughter, bowls
  and chopsticks); at night the family sits out with tea and mooncakes while children run along the path with glowing
  lanterns, a few firecrackers go off in the villages, and on the night itself the odd firework. The clouds part for a
  bigger, glowing full moon, lanterns hang on the eaves, and a bamboo flute plays softly across the valley. When the time band, weather or moment changes while the page is open, the sound crossfades into the new scene.

Preview any of it with URL parameters, e.g. `?season=summer&moment=storms&time=day&weather=storm`:
`season` spring|summer|autumn|winter · `moment` jingzhe|qingming|picking|meiyu|storms|osmanthus|frost|hearth|hanchao|snow ·
`time` late|dawn|day|noon|dusk|night · `weather` clear|drizzle|rain|storm|snow · `fest` chunjie|duanwu|zhongqiu|dongzhi|laba|zhongyuan|chongyang|hanshan|chabo|doucha ·
`festday` days from the festival (春节: −1 = 除夕, 0 = 初一, 14 = 元宵).

## Where the teas live
- `teas.js` … `teas5.js` — the hand-written profiles (tasting notes, history, brewing, coordinates). `pairs.js` holds food pairings.
- `idx/*.txt` — the register teas, one file per source batch. Every one is expanded into a full profile at build time (see below). Each file:
  ```
  #src https://source-url | Source title · Publisher; https://second-url | …
  名称|省份|地点|type|group|note
  ```
  - 省份: 江苏 福建 广东 云南 江西 浙江 安徽 贵州 河南 陕西 山东 湖南 湖北 四川 重庆 广西 海南 台湾 甘肃
  - type: green white yellow oolong red dark scented
  - group (optional): wuyi, wuyihist, dancong, puer, ttes, or blank
  - note (optional): a short fact the source states
- Rule: a tea is only added if a source you actually read names it. Every row must sit under a `#src` line pointing to that source.

## Map placement
`geocode.js` matches each register tea's 地点 (and name) to a county; aliases for scenic places (e.g. 易武 → 勐腊) are in its ALIAS table.

## Histories

`hist/*.txt` hold tea histories, kept apart from the tea lists so a history can be added without touching a tea's row.

```
#src https://example.com/article | Article title · Site
名称|One or more sentences of history, in English, written only from that source.
@group|A background shared by a whole group (wuyi, wuyihist, dancong, puer, ttes).
```

- Every row belongs to the nearest `#src` line above it. A tea can appear in several files; the texts are joined and every source is listed on its card.
- A name that matches a hand-written profile adds a "From the record" paragraph to that profile and removes its "General entry" note.
- Teas with no row show "No individual record found" (plus their group background, if any). That is deliberate: never write a history that a source you opened doesn't support. Mark legends and single-source claims as such ("Tradition says…", "This source says…").

## Health notes

Every tea card has a "Health notes 茶与健康" panel of small boxes: one idea per box, plus a "Mind the cup" row (hot drinks, caffeine, iron, and fluoride for brick teas). The tiles, their Chinese-language sources and the rule that picks tiles per tea (by type, plus ripe pu'er, Fu brick "golden flower", brick-tea fluoride and albino "white-leaf" greens) live in `health.js`. Notes based on cohort studies say "linked to", because they show an association, not cause. Topics with no Chinese source that was actually read (jasmine aroma and mood, oral health, bone density) are left out on purpose.

## Public star ratings

Every tea card has a Rating section: the average, the number of ratings, a 5-to-1 breakdown, and five stars to tap for your own rating (tap another star to change it, or "Remove my rating"). There are no written reviews and no sign-up. Tea cards show "★ 4.3 (12)" and the list can be sorted by **Top rated** (a weighted average, so one 5-star vote doesn't beat twenty 4.5s) or **Most rated**. Rating a tea that's on your shelf also updates the shelf's stars.

**One vote per browser per tea.** The browser remembers its votes (`teatime.ratings.v1` in local storage) and holds an anonymous Supabase session (`teatime.session`), created on the first vote. The database allows one row per session per tea, so changing your stars replaces your vote instead of adding one. A 4-second cool-down in the page and a 60-changes-an-hour cap in the database stop rapid-fire voting. Clearing browser data or using a private window does give someone a fresh vote; that is the limit of any no-login scheme. If that ever becomes a problem, turn on Supabase's CAPTCHA protection for sign-ins (Authentication → Attack Protection) and the anonymous sessions will need a CAPTCHA too.

| Where | Back end | Who can vote |
|---|---|---|
| Your own site (GitHub Pages etc.) | Supabase, set up below | Anyone, once per browser |
| claude.ai artifact | the artifact's built-in database | You, and teammates on a Team plan; public-link visitors see ratings only |
| A copy opened from disk with no config | none | Nobody; the section says ratings aren't connected |

Tea ids are stable (register teas use a hash of the Chinese name), so adding or removing teas never moves ratings, shelves or shared links onto the wrong tea.

### Setting up the public site (about 15 minutes, free tiers)

1. **Supabase.** Create a project at supabase.com. In *SQL Editor*, paste `supabase/schema.sql` and run it: it creates the `ratings` table, the rules (each session reads and changes only its own votes), the hourly cap and the public `tea_ratings` totals.
2. **Anonymous sign-ins.** In *Authentication → Sign In / Providers*, turn on "Allow anonymous sign-ins".
3. **Keys.** From *Project Settings → API* copy the Project URL and the `anon` public key. The anon key is meant to be public; the database rules protect the data. Never put the `service_role` key anywhere in this project.
4. **GitHub.** Push this folder to a repo. In *Settings → Pages* choose "GitHub Actions". In *Settings → Secrets and variables → Actions → Variables* add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Every push to `main` now runs check, build and deploy (`.github/workflows/pages.yml`).

Anonymous users pile up in *Authentication → Users*; that's expected. Supabase's free tier allows far more than a tea site needs.

For a local build with ratings, create `config.json` (git-ignored) with `{"supabaseUrl": "...", "supabaseAnonKey": "..."}`, or set the two environment variables, then `npm run build`.

## Tea house (茶馆)

The Tea house tab seats the visitor at the counter of Master Lin (林清泉, 林师傅), a Wuyi tea master, in a room that follows the visitor's season and time of day (`img/teahouse-<season>[-night].webp`).
His frames are in `img/master-lin/` (900×900 WebP): `idle`, `blink`, `listen`, two mouth shapes for talking (`talk-a`,
`talk-b`), `pour-low` (pot into the fairness pitcher, held low), `serve` and `serve-b` (pitcher into the first cup, then the last), `brew` (kettle over the closed pot),
`offer` (a cup in both hands), `smell` (a cup at his nose, used when he drinks himself), `laugh` and `welcome`.
Round 3 adds `talk-c` (talking with hands resting), `reach-pot` (hand on the teapot, played just before `pour`) and
`smell-lid` (smelling the teapot lid, 闻盖香, which is how a tea master judges the aroma). Between gestures he talks
with his hands down (`talk-c`/`idle`) and raises a hand to explain (`talk-a`/`talk-b`) on every other sentence.
Each tea action starts with a reach and ends with the vessel set back down (the same frame): `reach-pot` round the
decant, `reach-pitcher` round `serve`, `reach-kettle` round the water, and `reach-cup` before `offer`. `thinking` (hand at his chin) plays while he waits for his answer, `nod` on a
"yes"/对 and `point` (an open hand towards the window) when he talks about the mountain or the weather. Every frame shares the idle frame's still pixels (tray,
lower jacket, the hand he isn't using), so the tray never "swims". Exactly one frame is drawn at a time and poses
change with a cut: a crossfade would let the frame being left show through where an arm has moved away. The artist's raw frames were composited onto idle this way before export; to add a frame, do the same.
He welcomes you with open hands, blinks every few seconds, listens while you type, sits back to think while his answer comes, alternates
mouth shapes while his words appear, and acts out what he says (see "His gestures" below).
He has two brewing vessels and picks one by the tea in his reply (`vesselFor` in index.html): a white gaiwan for
green, white, yellow, jasmine and light oolong teas, the Yixing teapot for rock tea, black tea and pu'er. The teapot is
drawn into every frame. For the gaiwan, `gaiwan.webp` (a small patch of the gaiwan on its saucer) is laid over the
teapot in frames where his hands are away from it, and `pour-gaiwan`, `brew-gaiwan`, `smell-gaiwan-lid`,
`reach-gaiwan` and every frame named `<name>-gaiwan` are frames of their own (`frameFor` resolves them).
The round of tea is tracked in `tea` (index.html) so his hands follow the real order of gongfu tea: `warm-cups`
(kettle over the cups), `show-leaf` (the dry leaf held out, 赏茶), `load-leaf` (leaf into the vessel), `fill-pot` /
`brew-gaiwan` (water in), then `brew` (water over the closed teapot, 淋壶) or `skim-gaiwan` (the lid skimming the foam,
刮沫), the decant, `serve`, `offer` and `sip`. A step whose prerequisite is missing plays that prerequisite first, or
falls back to the next step of the round (`need`, `next`, `chain`), so he never pours from an empty pot. Served cups
show tea through three small patches (`cup-0/1/2.webp`, `CUPS` says which cups each frame leaves on the tray); the
guest's cup empties when they next write, his own when he sips. A pot of leaf gives four infusions.
He opens the round during his greeting, nods (or laughs along) when he hears a message, does what the guest asks
for in their own words (`WANTS`: more tea, cheers, show me the leaf), and when the guest is quiet he carries the
round on by himself, decanting a steeped pot within seconds (`alone`, three steps at most).
With the ambience on, his tea gestures make their sounds as his hands move (`linTea` in index.html, built from the
ambience's own gongfu-tea sounds): the clay lid under his finger, the pour into the pitcher, the pitcher round the cups,
the kettle lifted and its water, the splash over the cups, dry leaf off the scoop, the gaiwan lid skimming, a cup
picked up and set down, the lid lifted and set back when he smells it.
Water is modelled as a dense patter of bubble tones over a soft, treble-free splash, with the vessel's ring climbing
as it fills (`pour` in `teaKit`): a low, thick stream into the clay teapot, a brighter one into the gaiwan, thin
streams into the cups, and water over the closed pot (淋壶) with no filling note. Each pour lasts as long as its
frame. The sound follows the drawing on stage (`linTea(shown,…)`), so the gaiwan has its own porcelain lid ticks, and
putting a vessel down (`/down` in `FX`) sounds different from picking it up. His tray is close and dry: it gets only
a trace of the valley reverb. The speaker button
switches them off with the ambience, and the background round of tea stays quiet while the tea house is open.
`img/tea-master*.webp`, `img/teahouse.webp` and `img/teahouse-night.webp` are earlier artwork and are no longer
used (see `img/ART-DIRECTION.md`).
He is an AI character served by the same Worker as the pairing search,
on a second route, `POST /chat`; the Chinese persona prompt (你是武夷山最优秀的茶师之一…) lives in `worker/worker.js`,
so the page can't use the key for anything else. The page sends the last 16 turns, the visitor's country (from their
time zone, named in Chinese) and the scene on the mountain (season, solar-term moment, time of day, festival). Without
`PAIR_PROXY_URL` the tab shows the room and his greeting but says the tea master isn't available.
His gestures come from his words, not from the AI: `/chat` returns plain text, and `GESTURES` in index.html maps
phrases (English and Chinese) to gestures: "warm the cups"/温杯 warm, "look at the dry leaf"/赏茶 show, "add the
leaves"/投茶 load, "let me brew"/"hot water"/"another infusion"/注水 brew, "decant"/"it's ready"/出汤 pour, "pour you
a cup"/"more tea"/倒/续 serve, "taste this"/"while it's hot"/尝尝/趁热 offer, "let me have a sip"/"cheers"/干杯 sip,
"aroma"/闻 the lid, "haha"/哈哈 laugh, "welcome"/"take care"/请坐/慢走 welcome, "Yes,"/"You're right."/对 at the
start of a sentence nod, "Hmm,"/"Good question."/让我想想 think, "the mountains"/"the mist"/山上/外面 point. The words
are kept to what he says while doing the thing, so "an infusion of ten seconds" or "enjoy the view" trigger nothing.
Each starts just before its words, at most three per reply, each once, with a beat of talking between. When a reply
has no tea action in it, his hands carry the round on by one step while he talks (short replies every other time).
When the guest asks what to drink, he recommends by their hour and season: `teaMasterPrompt` adds a short "按时辰和时令选茶"
block built from the guest's local time (seven slots from early morning to late night), their season and the weather
(`BY_SLOT`, `BY_SEASON`, `BY_WEATHER` in `worker/worker.js`). The guest's stated taste or food always comes first.
Failures are logged in the Worker (`npx wrangler tail`) and in the browser console.
After changing the Worker, redeploy it: `cd worker && npx wrangler deploy`. Pushing to `main` only rebuilds the page;
the Worker is not deployed by the Pages workflow.

## Pairing search on the public site

The "What are you eating?" pairing picker uses the claude.ai sampling API when the page is opened inside a claude.ai artifact. Outside claude.ai (e.g. the GitHub Pages copy) that API isn't present and the page falls back to a small keyword matcher that only handles ~20 ingredient families.

For a proper AI picker on the public site, deploy the Cloudflare Worker in `worker/` and point the build at it:

1. **Create the Worker.** From `worker/` (installs `wrangler` locally so you don't need a global):
   ```
   cd worker
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY   # paste your Anthropic key
   npx wrangler deploy
   ```
   `wrangler.toml` sets a per-IP rate limit of 10 requests/minute and locks the allowed origins to `https://jjah0001.github.io`. Edit `ALLOWED_ORIGINS` if your Pages URL differs.
2. **Wire the build.** Copy the deployed URL (ends in `.workers.dev`) and set it as a repo variable: *Settings → Secrets and variables → Actions → Variables → `PAIR_PROXY_URL`* = `https://tea-pair.<your-subdomain>.workers.dev/pair`. The next push rebuilds and the pairing picker calls the Worker, which forwards to `claude-haiku-4-5` and returns the same JSON shape the in-page code expects. If `PAIR_PROXY_URL` is unset, the build logs `pairing proxy: none (local keyword fallback)` and the keyword matcher continues to run.
3. **Local build with the proxy.** Set `PAIR_PROXY_URL=https://…/pair npm run build`, or add `"pairProxyUrl": "https://…/pair"` to `config.json`.

Costs: the Worker free tier covers a personal site many times over; Anthropic bills per request. The per-IP rate limit caps the surprise-bill risk.

## Expanded profile layout (2026-10-26)

Use Node 24 or later (the build loads the ESM d3-geo dependency).
`profile-enrichment.js` expands the 2,024 register records into the same
`renderSpec` layout as the 152 original profiles. `idx` remains a map-location
provenance flag. Every tea renders through the same full-profile layout; there is no
separate listed tier, badge or filter.
IDs are unchanged, preserving shelf and rating associations.

This is layout and editorial enrichment, not 2,024 newly researched monographs.
Existing individual histories and field-level research take precedence. Missing
individual history and harvest data remain explicit. Flavour radar, body and
brewing defaults are labelled style guidance; historic bushes, cultivars and
origins are identified separately. `caffeine.js` audits each entry without inferring caffeine rank from tea colour,
roast or age. All existing records currently lack comparable caffeine measurements.
The visible four-leaf display retains the original editorial style estimates at
the user’s request; an expandable note distinguishes these from measurements. Explicit harvest descriptions can support qualitative leaf-maturity notes.
This is a catalogue audit, not an exhaustive literature search for every tea.

After `npm run build`, run `npm run check:profiles` to validate all 2,179 cards,
stable IDs, required fields and shared-template rendering. Existing catalogue
and research checks remain available with `npm run check`.
