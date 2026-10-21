// Editorial suggestions, not historical or source-backed claims about a tea.
// Use style-level advice when individual sensory evidence is unavailable.
const menus = {
  green: [
    ["Steamed fish with ginger", "Gentle seasoning leaves room for a green tea's freshness."],
    ["Mushroom and cabbage dumplings", "Savoury vegetables suit a fresh, lightly brewed tea."],
    ["Asparagus risotto", "The tea offers a refreshing contrast to the creamy rice."],
    ["Almond shortbread", "A modestly sweet biscuit avoids overwhelming a delicate cup."]
  ],
  white: [
    ["Steamed scallops", "Delicate seafood leaves room for subtle tea aromas."],
    ["Pear and ricotta toast", "Mild fruit and cheese suit a gently brewed white tea."],
    ["Silken tofu with sesame", "Soft texture and restrained seasoning keep the tea perceptible."],
    ["Vanilla sponge cake", "A lightly sweet cake is a starting point for a mild white tea."]
  ],
  yellow: [
    ["Poached chicken", "Gentle cooking suits a mellow yellow tea."],
    ["Sweetcorn fritters", "Corn's sweetness works well with a soft, rounded cup."],
    ["Roasted chestnuts", "Their restrained sweetness complements mellow tea."],
    ["Butter biscuits", "Simple pastry lets the tea remain the focus."]
  ],
  oolong: [
    ["Prawn dumplings", "A lightly brewed aromatic oolong suits delicate dim sum."],
    ["Roast chicken", "A fuller infusion can stand alongside the browned skin."],
    ["Peach tart", "Fruit pastry is a useful match for a fragrant oolong."],
    ["Mushroom toast", "Savoury mushrooms give an oolong's finish room to develop."]
  ],
  red: [
    ["Char siu pork", "The sweet glaze suits a fuller black tea."],
    ["Mushroom quiche", "A brisk cup refreshes between buttery bites."],
    ["Dark chocolate", "A small piece pairs well with a strong, unsweetened infusion."],
    ["Apple cinnamon cake", "Fruit and warm spice suit many sweet-aromatic black teas."]
  ],
  dark: [
    ["Braised mushrooms", "Savoury mushrooms are a starting point for a mellow dark tea."],
    ["Roast pork belly", "A strong cup refreshes the palate between rich bites."],
    ["Aged cheddar", "The cheese's intensity calls for a fuller tea."],
    ["Walnut bread", "Toasted nuts and bread suit a mellow, aged style."]
  ],
  scented: [
    ["Prawn har gow", "Delicate dim sum leaves room for the scented tea's perfume."],
    ["Vietnamese rice-paper rolls", "Fresh herbs and a light filling suit fragrant tea."],
    ["Lychee with plain yoghurt", "Fruit and gentle acidity complement floral aromas."],
    ["Lightly sweet coconut pudding", "Restrained sweetness avoids masking the tea's perfume."]
  ],
  wuyi: [
    ["Roast duck", "For a roasted rock-tea preparation, browned skin echoes the roast character."],
    ["Grilled shiitake", "Grilled flavours suit a fuller, roasted oolong."],
    ["Sesame biscuits", "Toasted sesame provides a complementary savoury note."],
    ["Caramel custard", "Light caramel can complement a roasted finish; keep sweetness moderate."]
  ],
  dancong: [
    ["Cantonese roast goose", "An aromatic oolong offers contrast to rich roast meat."],
    ["Ginger steamed prawns", "Ginger gives definition without a heavy sauce."],
    ["Apricot tart", "Fruit pastry can complement a floral or fruity Dancong preparation."],
    ["Almond biscuits", "A lightly sweet, nutty bite leaves room for the aroma."]
  ],
  puer: [
    ["Grilled mushrooms", "Try with a mellow aged or ripe Pu'er; earthy and savoury flavours often work together."],
    ["Roast pork", "A fuller aged or ripe preparation can hold its own beside rich meat."],
    ["Vegetable dumplings", "Try with a gently brewed young raw Pu'er so bitterness stays restrained."],
    ["Plain rice crackers", "A neutral bite is a useful choice when the mountain tea's style is unknown."]
  ]
};
function suggestPairings(t) {
  const key = t.scented ? "scented" : ["wuyi", "wuyihist"].includes(t.group) ? "wuyi" :
    t.group === "dancong" ? "dancong" : t.group === "puer" ? "puer" : t.type;
  if (!menus[key]) throw new Error("No pairing style for " + (t.zh || t.id));
  return {
    status: "editorial suggestion",
    basis: key === "puer" ? "Origin alone does not establish raw, ripe or aged style; choose the preparation noted below." :
      "Suggestions based on tea style, not an individual tasting or a documented traditional pairing. Adjust to the actual roast, age and strength.",
    style: key,
    items: menus[key].map(([food, reason]) => ({ food, reason }))
  };
}
module.exports = { suggestPairings, menus };
