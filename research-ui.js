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
let cultivarPage=1;
function renderCultivars() {
  const q=norm($("cultivarSearch").value);
  const list=DATA.cultivars.filter(c=>!q||norm([c.zh,c.py,c.flavour||"",...c.recommendedRegions,c.holder].join(" ")).includes(q));
  const shown=list.slice(0,cultivarPage*24);
  $("cultivarCount").textContent=`Showing ${shown.length} of ${list.length} matching cultivars · ${DATA.cultivars.length} sourced cultivar records`;
  $("cultivarMore").hidden=shown.length>=list.length;
  const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  $("cultivarList").innerHTML=shown.map(c=>`<article class="cultivar-card">
    <h3>${esc(c.zh)}</h3><p class="hint">${esc(c.py)} · cultivar</p>
    <p class="lab">Reported flavour</p><p>${esc(c.flavour||"Not recorded in the sources checked.")}</p>
    <p class="lab">Suitable processing styles</p><p>${c.suitableTypes.length?c.suitableTypes.map(t=>esc(DATA.types[t].en)).join(", "):"Not recorded."}</p>
    <p class="hint">Descriptors can cover more than one preparation. They are not a single fixed flavour for every tea made from this plant.</p>
    <details><summary>History, growing region and brewing</summary>
      <p class="lab">Recorded history</p><p>${esc(c.history)}</p>
      <p class="lab">Applicant / rights holder in the register</p><p>${esc(c.holder)}</p>
      <p class="lab">Recommended growing regions</p><p>${esc(c.recommendedRegions.join(", ")||"Not recorded.")}</p>
      <p class="lab">Actual harvest location</p><p>Not established by the cultivar record. Check the finished tea's producer and batch.</p>
      <p class="lab">Reported harvest phenology</p><p>${c.harvestPhenology.length?esc(c.harvestPhenology.join("; "))+". These are source-specific observations, not universal harvest dates.":"Not recorded in this summary."}</p>
      <p class="lab">Cultivar-specific brewing time</p><p>Not recorded. Choose a method for the finished tea's processing style; a cultivar name alone cannot determine a brewing time.</p>
      ${c.pairingOptions.length?c.pairingOptions.map(p=>suggestedPairingsHTML(p,DATA.types[p.type].en+" preparation · suggested pairings")).join(""):"<p>Pairings require the finished tea's processing style, which this record does not establish.</p>"}
    </details>
    ${c.identityNote?`<p class="hint">${esc(c.identityNote)}</p>`:""}
    <ul class="srcs"><li>${link(c.source,"Chinese cultivar register · name and authorization")}</li>${c.detailSource?`<li>${link(c.detailSource,"Individual cultivar record · Chinese description")}</li>`:""}${c.correctionSource?`<li>${link(c.correctionSource,"Name verification / correction source")}</li>`:""}</ul>
  </article>`).join("") || "<p>No cultivars match this search.</p>";
}
