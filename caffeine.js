// Evidence audit, not a dose estimator. No level may be inferred from colour,
// roast, age, illustration shape, or a place/cultivar name.
const sources = [
 {url:'https://www.moa.gov.tw/faq_view.php?id=221',title:'Leaf maturity and caffeine · Ministry of Agriculture, Taiwan'},
 {url:'https://pubmed.ncbi.nlm.nih.gov/19007524/',title:'Caffeine content of brewed teas · Journal of Analytical Toxicology (2008)'}
];
function assess(t) {
 const harvest=t.evidence?.harvest?.text || t.harvest || '';
 let tendency='The available entry does not establish a leaf-grade basis for comparing caffeine.';
 if(/buds only|single buds|bud-only/i.test(harvest)) tendency='The recorded harvest uses buds. Buds and tender leaves tend to contain more caffeine than mature leaves or stems under comparable conditions; this does not establish a cup-level dose.';
 else if(/mature leaves/i.test(harvest)) tendency='The recorded harvest uses mature leaves. These tend to contain less caffeine than buds under comparable conditions; this does not make the brewed tea low-caffeine or suitable before sleep.';
 if(t.group==='wuyihist') tendency='This is a historical bush name, not a tested modern tea sample. A caffeine rank cannot be recovered from the name.';
 else if(t.group==='puer') tendency='This is an origin name. Harvest, leaf grade, raw or ripe processing and brewing are unspecified for a particular product, so no caffeine rank is assigned.';
 else if(t.group==='ttes') tendency='This is a cultivar entry. Cultivar identity alone does not determine caffeine in a brewed serving.';
 return {status:'unverified',level:null,label:'Caffeine · level unverified',time:null,
  note:`No comparable caffeine measurement is attached to this entry. ${tendency}`,
  scope:'Audit of existing catalogue fields; not a claim that no published measurements exist.',sources};
}
module.exports={assess};
