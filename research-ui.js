// These helpers run in the generated page's existing script scope.
function evidenceLinks(keys) {
  return `<ul class="srcs">${[...new Set(keys)].map(k=>{const s=DATA.researchSources[k];return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`}).join("")}</ul>`;
}
function evidenceField(label, f) {
  return `<p class="lab">${esc(label)}</p><p>${f?esc(f.text):"Not recorded in the sources checked."}</p>${f?evidenceLinks(f.sources):""}`;
}
function evidenceHTML(t) {
  const e=t.evidence;
  if(!e) return "";
  return `<div class="evidence"><h3>From the sources</h3><p class="hint">Chinese-language evidence checked ${esc(DATA.researchDate)}</p>${
    evidenceField("Flavour profile",e.flavour)+evidenceField("Harvest / production area",e.location)+
    evidenceField("Harvest or plucking details",e.harvest)+evidenceField("History",e.history)+
    evidenceField("Tea-specific brewing method",e.brewing)}</div>`;
}
function sourceBrewHTML(t) {
  const key=["wuyi","wuyihist"].includes(t.group)?"wuyi":t.type;
  const recipe=DATA.brewingGroups[key];
  return recipe?`<details><summary>Published guidance for this tea style</summary><p>${esc(recipe.text)}</p>${evidenceLinks(recipe.sources)}</details>`:"";
}
function suggestedPairingsHTML(p, title="Pairing suggestions") {
  return `<div><p class="lab">${esc(title)}</p><p class="hint">${esc(p.basis)}</p><ul class="pair-advice">${p.items.map(i=>`<li><b>${esc(i.food)}</b><small>${esc(i.reason)}</small></li>`).join("")}</ul></div>`;
}
/* health boxes: DATA.HB holds the tiles and sources once; each tea carries only its tile keys (t.hb) */
const HICON={
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  mind:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.5A3 3 0 0 0 8 17h1v3M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.5A3 3 0 0 1 16 17h-1v3M12 4v16"/>',
  shield:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  flame:'<path d="M12 21a6 6 0 0 0 6-6c0-4-3-5.5-3-9-2 1-5 3.5-5 7-1-.5-1.5-1.5-1.5-2.5C7 12 6 13.5 6 15a6 6 0 0 0 6 6z"/>',
  gut:'<path d="M8 4v3a3 3 0 0 0 3 3h2a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6"/><path d="M16 4v3"/>',
  flower:'<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10 6 10.5 3.5 12 3c1.5.5 2 3 0 6.8M14.2 12c3.8-2 6.3-1.5 6.8 0-.5 1.5-3 2-6.8 0M12 14.2c2 3.8 1.5 6.3 0 6.8-1.5-.5-2-3 0-6.8M9.8 12C6 14 3.5 13.5 3 12c.5-1.5 3-2 6.8 0"/>',
  leaf:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
  clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  bone:'<path d="M7 7a2 2 0 1 1 3-1l4 4a2 2 0 1 1 1 3l-4-4M7 7a2 2 0 1 0-1 3l4 4M14 17a2 2 0 1 0 3 1 2 2 0 1 0 1-3"/>',
  tooth:'<path d="M7 4c-2 0-3 2-3 4 0 3 1.5 5 2 8 .3 2 1 4 2 4s1.3-3 2-5c.4-1 1.6-1 2 0 .7 2 1 5 2 5s1.7-2 2-4c.5-3 2-5 2-8 0-2-1-4-3-4-2 0-3 1-5 1S9 4 7 4z"/>',
  bean:'<path d="M12 3c4 3 6 8 4 13-1.6 3.8-6 4.5-8 1.5C5.5 14 7 7 12 3z"/><path d="M12 3c-1 5 1 9 0 15"/>',
  therm:'<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  iron:'<circle cx="12" cy="12" r="8"/><path d="M9 8.5v7M9 8.5h3.5M9 12h2.5M14 15.5v-4M14 9.2v.1"/>',
  fluor:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 16V8h5M10 12h4"/>',
  bump:'<path d="M12 4c-3 0-5 2-5 5 0 2 1 3 1 5h8c0-2 1-3 1-5 0-3-2-5-5-5z"/><path d="M9 18h6M10 21h4"/>',
  cup:'<path d="M5 9h12v4a6 6 0 0 1-12 0z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>'
};
const hsvg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HICON[k]||HICON.leaf}</svg>`;
function hboxHTML(k,i){const b=DATA.HB.tiles[k];
  return `<li class="hbox${b.warn?" warn":""}" style="--i:${i}"><span class="hic">${hsvg(b.icon)}</span><b>${esc(b.title)}</b><small>${esc(b.note)}</small></li>`}
function healthHTML(t){
  if(!t.hb||!t.hb.length) return "";
  const T=DATA.HB.tiles, good=t.hb.filter(k=>!T[k].warn), care=t.hb.filter(k=>T[k].warn);
  const srcs=[...new Set(t.hb.flatMap(k=>T[k].src))].map(k=>DATA.HB.sources[k]);
  return `<section class="health" aria-label="Health notes"><div class="hhead"><p class="lab">Health notes<span class="han">茶与健康</span></p></div>
    <ul class="hgrid">${good.map(hboxHTML).join("")}</ul>
    ${care.length?`<p class="hsub">Mind the cup</p><ul class="hgrid">${care.map((k,i)=>hboxHTML(k,i+good.length)).join("")}</ul>`:""}
    <details><summary>Chinese-language sources (${srcs.length})</summary><ul class="srcs">${srcs.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <em>· ${esc(s.pub)}</em></li>`).join("")}</ul></details>
    <p class="hfoot">Regular drinking, whole diet · education only, not medical advice</p></section>`;
}
