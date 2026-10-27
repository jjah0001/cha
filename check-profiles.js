const assert=require('node:assert/strict');
const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('dist/cha.html','utf8');
const start=html.indexOf('const DATA = ')+13;
const end=html.indexOf(';\nconst AX=',start);
const data=JSON.parse(html.slice(start,end));
const all=[...data.teas,...data.X];
assert(all.length>=1000);
assert.equal(new Set(all.map(t=>t.id||t.i)).size,all.length);
const old=require('./idx.json');
assert.deepEqual(data.X.map(t=>t.i),old.teas.map(t=>t.i),'stable IDs');
for(const t of data.X){
 assert(t.fullProfile,t.zh);
 for(const k of ['notes','history','harvest','region','western','brewBasis','flavourBasis','historyBasis','process','storage']) assert(t[k]?.length,t.zh+':'+k);
 assert(t.hb?.length,t.zh+': health');
 assert(t.pair.length>=4);
 assert(t.temp.length===2&&t.temp[0]<=t.temp[1]);
 assert(t.g>0&&parseInt(t.time)>0&&/\d/.test(t.inf));
 Object.values(t.f).forEach(v=>assert(v>=0&&v<=5));
 assert(data.XS[t.s]);
 if(t.groupHistory)assert(data.XS[t.groupSource]);
}
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
// Render every card through the same actual browser function with inert UI hooks.
const template=fs.readFileSync('index.html','utf8');
const body=template.slice(template.indexOf('function renderSpec(){'),template.indexOf('/* ── brew timer'));
const node={};
const context={DATA:data,byId:Object.fromEntries(all.map(t=>[t.id||t.i,{...t,id:t.id||t.i,idx:!!t.i}])),sel:null,specFor:null,$:()=>node,esc:s=>String(s),art:()=>'',harvestStrip:()=>'',radar:()=>'',rhythmHTML:()=>'<div>Caffeine & rhythm</div>',healthHTML:()=>'<div>Health notes</div>',sourceBrewHTML:()=>'',tempTxt:()=>'',thermo:()=>'',srcUL:()=>'',evidenceLinks:()=>'',initBrew:()=>{},paintShelfCtl:()=>{},paintRsum:()=>{},paintReviews:()=>{}};
vm.createContext(context);vm.runInContext(body,context);
for(const t of all){context.sel=t.id||t.i;vm.runInContext('renderSpec()',context);for(const label of ['Flavour profile','Caffeine & rhythm','Health notes','Brew it','Suggested pairings','History','id="reviews"'])assert(node.innerHTML.includes(label),t.zh+': '+label);assert(!node.innerHTML.includes('undefined'),t.zh);}
console.log(`${all.length} profiles validated; ${data.X.length} expanded cards render through the shared template; stable IDs preserved.`);
for(const t of all){assert.equal(t.caffeine.status,'unverified');assert.equal(t.caffeine.level,null);assert.equal(t.caffeine.time,null);assert(t.caffeine.note&&t.caffeine.sources.length);}
const {assess}=require('./caffeine');
assert.match(assess({harvest:'March, buds only'}).note,/more caffeine/);
assert.match(assess({harvest:'mature leaves'}).note,/less caffeine/);
for(const type of ['green','white','yellow','oolong','red','dark'])assert.equal(assess({type}).level,null);
console.log('All 2176 caffeine records audited: no unsupported category ranks or sleep-time recommendations.');
