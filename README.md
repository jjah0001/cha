# Cha 茶 — source

Cha: 茶 (chá, tea) and 查 (chá, to look up). Live at https://jjah0001.github.io/cha/

Builds `dist/cha.html`, a single self-contained page (map, profiles, timer, pairing, personality test, shelf).

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
| Summer | 三伏 | cicadas loudest at noon, a thunderstorm most afternoons (14:00–18:00) with lightning |
| Autumn | 桂花 (白露–寒露) | osmanthus flowers drifting down, the charcoal roast |
| Autumn | 霜降 | frost on the tea rows in the morning, fewer crickets |
| Winter | 围炉 | wood stove and kettle |
| Winter | 寒潮 (大寒 to 雨水) | frost on the rows in the morning, cold drizzle, cloud between the peaks |
| Winter | 瑞雪 | a rare snowfall: only every three or four years (2027, 2030, 2033, 2037…), for two or three days in the cold spell; snow on the summits and falling, the eaves frozen |

The day runs late (after midnight) · dawn · day · noon · dusk · night: roosters before first light, the 午休 hush, dogs
after dark, the roasting-house lamp left on through the night only when tea is being made. The moon shows its real phase.
The lunar festivals keep their real dates in both hemispheres, as Chinese communities there keep them; 冬至 follows the visitor's own winter;
the tea year's own days (喊山, 斗茶赛) follow the visitor's season like the solar-term moments:

- **喊山** (惊蛰 day, mornings): Wuyi's old rite at the imperial tea garden by the fourth bend — red flags, gongs and drums,
  and the crowd shouting "茶发芽！" three times to wake the tea bushes.
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
  kitchen, 粽子 boiling on the stove, a few firecrackers on the day, and dragon-boat races carried up the valley from the
  river in town: the big drum, gong, the crews' shouts and paddles, speeding up in the sprint. It falls in the plum rains,
  so it usually rains.
- **冬至** (the eve and the day): follows the sun, so it falls in the visitor's own winter — 21/22 December north of the
  equator, 21 June south of it. On the eve the family rolls 冬至圆 at the table and the lamp burns bright from dusk on
  the longest night; on the morning, 汤圆 boil on the stove.
- **腊八** (腊月初八): a pot of 腊八粥 on the stove from first light, the temple bell longer that morning.
- **中元** (七月十五): a quiet evening — the temple bell at dusk, 木鱼 and chanting, river lanterns drifting down the stream.
- **重阳** (九月初九): climbers on the summit, chrysanthemums by the door, calls from the peaks on a stronger wind.
- **中秋** (three nights): the clouds part for a bigger, glowing full moon, lanterns on the eaves, and a bamboo flute
  playing now and then from across the valley. When the time band, weather or moment changes while the page is open, the sound crossfades into the new scene.

Preview any of it with URL parameters, e.g. `?season=summer&moment=storms&time=day&weather=storm`:
`season` spring|summer|autumn|winter · `moment` jingzhe|qingming|picking|meiyu|storms|osmanthus|frost|hearth|hanchao|snow ·
`time` late|dawn|day|noon|dusk|night · `weather` clear|drizzle|rain|storm|snow · `fest` chunjie|duanwu|zhongqiu|dongzhi|laba|zhongyuan|chongyang|hanshan|chabo|doucha ·
`festday` days from the festival (春节: −1 = 除夕, 0 = 初一, 14 = 元宵).

## Where the teas live
- `teas.js` … `teas5.js` — the full profiles (tasting notes, history, brewing, coordinates). `pairs.js` holds food pairings.
- `idx/*.txt` — the listed teas, one file per source batch. Each file:
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
`geocode.js` matches each listed tea's 地点 (and name) to a county; aliases for scenic places (e.g. 易武 → 勐腊) are in its ALIAS table.

## Histories

`hist/*.txt` hold tea histories, kept apart from the tea lists so a history can be added without touching a tea's row.

```
#src https://example.com/article | Article title · Site
名称|One or more sentences of history, in English, written only from that source.
@group|A background shared by a whole group (wuyi, wuyihist, dancong, puer, ttes).
```

- Every row belongs to the nearest `#src` line above it. A tea can appear in several files; the texts are joined and every source is listed on its card.
- A name that matches a full profile adds a "From the record" paragraph to that profile and removes its "General entry" note.
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

Tea ids are stable (listed teas use a hash of the Chinese name), so adding or removing teas never moves ratings, shelves or shared links onto the wrong tea.

### Setting up the public site (about 15 minutes, free tiers)

1. **Supabase.** Create a project at supabase.com. In *SQL Editor*, paste `supabase/schema.sql` and run it: it creates the `ratings` table, the rules (each session reads and changes only its own votes), the hourly cap and the public `tea_ratings` totals.
2. **Anonymous sign-ins.** In *Authentication → Sign In / Providers*, turn on "Allow anonymous sign-ins".
3. **Keys.** From *Project Settings → API* copy the Project URL and the `anon` public key. The anon key is meant to be public; the database rules protect the data. Never put the `service_role` key anywhere in this project.
4. **GitHub.** Push this folder to a repo. In *Settings → Pages* choose "GitHub Actions". In *Settings → Secrets and variables → Actions → Variables* add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Every push to `main` now runs check, build and deploy (`.github/workflows/pages.yml`).

Anonymous users pile up in *Authentication → Users*; that's expected. Supabase's free tier allows far more than a tea site needs.

For a local build with ratings, create `config.json` (git-ignored) with `{"supabaseUrl": "...", "supabaseAnonKey": "..."}`, or set the two environment variables, then `npm run build`.

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
provenance flag; `fullProfile` controls the profile filter and shared renderer.
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

After `npm run build`, run `npm run check:profiles` to validate all 2,176 cards,
stable IDs, required fields and shared-template rendering. Existing catalogue
and research checks remain available with `npm run check`.
