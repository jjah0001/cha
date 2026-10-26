# Tea Time — source

Builds `dist/tea-time.html`, a single self-contained page (map, profiles, timer, pairing, personality test, shelf).

## Build
```
npm install
npm run setup     # one-off: county map data from GitHub (longwosion/geojson-map-china)
npm run check     # validate the tea lists
npm run build     # writes dist/tea-time.html
```

Open `dist/tea-time.html` in your browser after building. The root `index.html`
is the source template, not the runnable page: the build injects its tea data
and reviews module. Opening the template directly causes `DATA is not defined`.

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
The four-leaf display uses a labelled unverified state, not zero or a fabricated
rank. Explicit harvest descriptions can support qualitative leaf-maturity notes.
This is a catalogue audit, not an exhaustive literature search for every tea.

After `npm run build`, run `npm run check:profiles` to validate all 2,176 cards,
stable IDs, required fields and shared-template rendering. Existing catalogue
and research checks remain available with `npm run check`.
