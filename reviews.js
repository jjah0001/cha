/* ── public star ratings ─────────────────────────────────────────
   Stars only, no sign-up, no written reviews. Each browser gets one vote per tea; changing
   your stars replaces your vote rather than adding another.
   Back ends, picked at start-up:
     supabase  the self-hosted public site: an anonymous Supabase session per browser
               (kept in browser storage) and a database rule of one row per session per tea
     claude    the claude.ai artifact (db + user capabilities): one vote per claude.ai account
     none      a copy with neither: ratings are shown as not connected
   Spam guard: the browser remembers its votes and enforces a short cool-down; the server
   enforces one vote per session per tea and an hourly cap (supabase/schema.sql). */
const CFG = /*__CONFIG__*/{};
const REV = { mode: "loading", api: null, agg: {}, mine: {}, canRate: false, err: "" };
const MINE_KEY = "teatime.ratings.v1", COOL_MS = 4000;
const bayes = a => a && a.n ? (a.avg * a.n + 3.5 * 3) / (a.n + 3) : -1;
const starStr = v => { const f = Math.round(v * 2) / 2; let s = ""; for (let i = 1; i <= 5; i++) s += `<i class="${f >= i ? "on" : f >= i - .5 ? "half" : ""}">★</i>`; return `<span class="rstars" aria-hidden="true">${s}</span>`; };
const fmtAvg = v => v.toFixed(1);
const STAR_WORDS = ["", "Not for me", "It's OK", "Good", "Very good", "Outstanding"];
function readMine() { try { const o = JSON.parse(localStorage.getItem(MINE_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
function writeMine() { try { localStorage.setItem(MINE_KEY, JSON.stringify(REV.mine)); } catch (e) {} }
function aggFrom(rows) { const A = {}; for (const r of rows) { const a = A[r.tea] || (A[r.tea] = { sum: 0, n: 0, d: [0, 0, 0, 0, 0] }); a.sum += r.s; a.n++; a.d[r.s - 1]++; }
  for (const k in A) A[k].avg = A[k].sum / A[k].n; return A; }
function ratingBadge(id) { const a = REV.agg[id]; return a && a.n ? `<span class="rbadge" title="${fmtAvg(a.avg)} from ${a.n} rating${a.n > 1 ? "s" : ""}">★ ${fmtAvg(a.avg)} <small>(${a.n})</small></span>` : ""; }
function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("load " + src)); document.head.appendChild(s); }); }

const Backends = {
  async supabase() {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
    const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "teatime.session" } });
    const loadAgg = async () => {
      const { data, error } = await sb.from("tea_ratings").select("tea_id,n,avg_stars,s1,s2,s3,s4,s5"); if (error) throw error;
      REV.agg = {}; for (const r of data) REV.agg[r.tea_id] = { n: r.n, avg: +r.avg_stars, d: [r.s1, r.s2, r.s3, r.s4, r.s5] };
    };
    const session = async () => { // anonymous session, created on the first vote and remembered by this browser
      let { data: { session: s } } = await sb.auth.getSession();
      if (!s) { const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; s = r.data.session; }
      return s.user.id;
    };
    await loadAgg();
    { const { data: { session: s } } = await sb.auth.getSession(); // re-sync this browser's own votes with the server
      if (s) { const { data } = await sb.from("ratings").select("tea_id,stars"); if (data) { REV.mine = {}; for (const r of data) REV.mine[r.tea_id] = { s: r.stars, at: Date.now() }; writeMine(); } } }
    REV.canRate = true;
    return {
      async rate(tid, s) { const uid = await session(); const { error } = await sb.from("ratings").upsert({ tea_id: tid, user_id: uid, stars: s }, { onConflict: "tea_id,user_id" }); if (error) throw error; await loadAgg(); },
      async clear(tid) { const uid = await session(); const { error } = await sb.from("ratings").delete().eq("tea_id", tid).eq("user_id", uid); if (error) throw error; await loadAgg(); },
    };
  },

  async claude() { // one document per voter: ratings/<uid> = {items:{teaId:{s,at}}}
    if (!window.claude || !window.claude.use) return null;
    const db = await window.claude.use("db"); if (!db) return null;
    const user = await window.claude.use("user");
    const uid = user ? await user.id() : null;
    const can = user ? await user.can("data.write") : null;
    REV.canRate = !!uid && can !== false;
    let docs = {};
    let chain = Promise.resolve(); const write = fn => (chain = chain.then(fn, fn));
    await new Promise(res => { let first = true;
      db.collection("ratings").onSnapshot(snap => {
        docs = {}; for (const d of snap.docs) { const v = d.data(); if (v && v.items && typeof v.items === "object") docs[d.id] = v.items; }
        const rows = []; for (const u in docs) for (const tea in docs[u]) { const s = Math.round(+docs[u][tea].s); if (s >= 1 && s <= 5) rows.push({ tea, s }); }
        REV.agg = aggFrom(rows);
        if (uid) { REV.mine = {}; for (const tea in docs[uid] || {}) REV.mine[tea] = { s: docs[uid][tea].s, at: docs[uid][tea].at }; writeMine(); }
        if (first) { first = false; res(); } else revChanged();
      }, () => { if (first) { first = false; res(); } });
    });
    const mineDoc = () => ({ ...(docs[uid] || {}) });
    const save = items => write(() => db.doc("ratings/" + uid).set({ items })).catch(e => { if (e && e.code === "invalid_argument") REV.canRate = false; throw e; });
    return {
      async rate(tid, s) { const items = mineDoc(); items[tid] = { s, at: Date.now() }; await save(items); },
      async clear(tid) { const items = mineDoc(); delete items[tid]; await save(items); },
    };
  },
};

async function initReviews() {
  REV.mine = readMine();
  try {
    if (CFG.supabaseUrl && CFG.supabaseAnonKey) { REV.api = await Backends.supabase(); REV.mode = "supabase"; }
    else { REV.api = await Backends.claude(); REV.mode = REV.api ? "claude" : "none"; }
  } catch (e) { console.warn("ratings", e); REV.api = null; REV.mode = "none"; REV.err = "Ratings couldn't load right now."; }
  const ss = $("sortSel"); if (ss) ss.closest(".sortwrap").hidden = REV.mode === "none";
  revChanged();
}
function revChanged() { buildIndex(); if (sel) { paintRsum(byId[sel]); paintReviews(byId[sel]); } }

function paintRsum(t) { const el = $("rsum"); if (!el || !t) return; const a = REV.agg[t.id];
  if (REV.mode === "none" || REV.mode === "loading") { el.innerHTML = ""; return; }
  el.innerHTML = a && a.n ? `${starStr(a.avg)} <b>${fmtAvg(a.avg)}</b> <span>${a.n} rating${a.n > 1 ? "s" : ""}</span>` : `<span>Not rated yet</span>`; }

let lastVote = 0, busy = false;
function paintReviews(t) {
  const el = $("reviews"); if (!el || !t) return;
  const head = `<p class="lab">Rating</p>`;
  if (REV.mode === "loading") { el.innerHTML = head + `<p class="rnote">Loading ratings…</p>`; return; }
  if (REV.mode === "none") { el.innerHTML = head + `<p class="rnote">${REV.err || "Ratings aren't connected on this copy of the site."}</p>`; return; }
  const a = REV.agg[t.id] || { n: 0, avg: 0, d: [0, 0, 0, 0, 0] }, max = Math.max(1, ...a.d);
  const mine = REV.mine[t.id] ? REV.mine[t.id].s : 0;
  const shelfR = !mine && SHELF[t.id] && SHELF[t.id].r ? SHELF[t.id].r : 0;
  const shown = mine || shelfR;
  const summary = a.n ? `<div class="rbig"><b>${fmtAvg(a.avg)}</b>${starStr(a.avg)}<span>${a.n} rating${a.n > 1 ? "s" : ""}</span></div>
      <div class="rbars">${[5, 4, 3, 2, 1].map(s => `<div><span>${s}</span><i><b style="width:${a.d[s - 1] / max * 100}%"></b></i><span>${a.d[s - 1]}</span></div>`).join("")}</div>`
    : `<p class="rnote">Nobody has rated this tea yet.</p>`;
  const yours = REV.canRate ? `<div class="ryou"><span class="rnote">${mine ? "Your rating" : "Tried it? Rate it"}</span>
      <span class="stars big${shelfR ? " ghost" : ""}" role="group" aria-label="Your rating">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-s="${i}" class="${i <= shown ? "on" : ""}" aria-label="${i} star${i > 1 ? "s" : ""}${i === mine ? " (your rating)" : ""}" ${busy ? "disabled" : ""}>★</button>`).join("")}</span>
      <span class="rnote" id="rWord">${mine ? STAR_WORDS[mine] : shelfR ? `Your shelf says ${shelfR}★. Tap a star to share it.` : ""}</span>
      ${mine ? `<button class="linkbtn" id="rClear" ${busy ? "disabled" : ""}>Remove my rating</button>` : ""}</div>`
    : `<p class="rnote">You can see ratings here but your access doesn't allow voting.</p>`;
  el.innerHTML = head + `<div class="rsumbox">${summary}</div>` + yours;
  const word = $("rWord");
  el.querySelectorAll(".ryou .stars button").forEach(b => {
    b.onmouseenter = () => { if (word) word.textContent = STAR_WORDS[+b.dataset.s]; };
    b.onmouseleave = () => { if (word) word.textContent = mine ? STAR_WORDS[mine] : ""; };
    b.onclick = () => vote(t, +b.dataset.s);
  });
  $("rClear") && ($("rClear").onclick = () => vote(t, 0));
}
async function vote(t, s) {
  const prev = REV.mine[t.id] ? REV.mine[t.id].s : 0;
  if (busy || s === prev) return;
  if (Date.now() - lastVote < COOL_MS) { toast("One moment, then try again"); return; }
  lastVote = Date.now(); busy = true;
  if (s) REV.mine[t.id] = { s, at: Date.now() }; else delete REV.mine[t.id];
  if (SHELF[t.id]) { SHELF[t.id].r = s; saveShelf(); }
  writeMine(); paintReviews(t);
  try { await (s ? REV.api.rate(t.id, s) : REV.api.clear(t.id)); toast(s ? (prev ? "Rating changed" : "Thanks for rating") : "Rating removed"); }
  catch (e) { console.warn(e);
    if (prev) REV.mine[t.id] = { s: prev, at: Date.now() }; else delete REV.mine[t.id]; writeMine();
    toast(e && /Too many/.test(e.message || "") ? "That's a lot of ratings for one hour. Try again later." : "That didn't go through. Try again in a moment."); }
  busy = false; revChanged();
}
