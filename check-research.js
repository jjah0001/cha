const assert = require('assert/strict');
const research = require('./research.json');
const { suggestPairings } = require('./pairing-suggestions.js');
const knownTypes = new Set(['green','white','yellow','oolong','red','dark']);
const knownProvinces = new Set(['江苏','福建','广东','云南','江西','浙江','安徽','贵州','河南','陕西','山东','湖南','湖北','四川','重庆','广西','海南','台湾','甘肃']);
const url = s => { assert.equal(typeof s, 'string'); assert.match(s, /^https:\/\//); new URL(s); };
const seen = new Set();
for (const [key,s] of Object.entries(research.sources)) { url(s.url); assert(s.title && s.checkedOn && s.language === 'zh', key); }
function field(f, name) {
  if (f == null) return;
  assert(f.text && f.sources?.length, name);
  for (const k of f.sources) assert(research.sources[k], `${name}: missing source ${k}`);
}
for (const t of research.teas) {
  assert(!seen.has(t.zh), 'Duplicate research tea: '+t.zh); seen.add(t.zh);
  assert(knownTypes.has(t.type), t.zh); assert(knownProvinces.has(t.prov), t.zh);
  assert(t.sources?.length && t.location, t.zh);
  t.sources.forEach(k => assert(research.sources[k], t.zh));
  for(const k of ['location','flavour','history','harvest','brewing']) field(t[k],t.zh+':'+k);
  assert(suggestPairings(t).items.length >= 4, t.zh);
}
Object.entries(research.brewingGroups).forEach(([key,f])=>field(f,key));
for(const t of [...knownTypes].map(type=>({type})).concat([{type:'green',scented:true},{type:'oolong',group:'wuyi'},{type:'oolong',group:'dancong'},{type:'dark',group:'puer'}])) {
  const p=suggestPairings(t);
  assert.equal(p.status,'editorial suggestion'); assert(p.basis);
  assert.equal(new Set(p.items.map(i=>i.food)).size,p.items.length);
  p.items.forEach(i=>assert(i.food && i.reason));
}
console.log(`${research.teas.length} research tea records and pairing styles validated.`);
const health = require('./health.js');
for (const [k,s] of Object.entries(health.sources)) { assert.match(s.url, /^https?:\/\//, k); new URL(s.url); assert(s.title && s.pub, k); }
for (const [k,b] of Object.entries(health.tiles)) {
  assert(b.icon && b.title && b.note && b.src?.length, k); assert(b.warn || [0,1,2,3].includes(b.ev), k);
  b.src.forEach(s => assert(health.sources[s], `${k}: missing source ${s}`));
}
for (const t of [...research.teas, ...knownTypes].map(t => typeof t === 'string' ? {type:t, zh:'', id:''} : t))
  health.pick(t).forEach(k => assert(health.tiles[k], 'unknown health tile '+k));
console.log(`${Object.keys(health.tiles).length} health tiles and ${Object.keys(health.sources).length} sources validated.`);
