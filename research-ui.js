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
