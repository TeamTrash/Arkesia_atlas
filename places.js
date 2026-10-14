// Coordinates measured on the original PNGs. Each place has a stable audio catalog ID.
const placeGroups = {
  elgacia: [['Ereonnor',408,435],['Mount Phylantos',483,199],['Hestera Garden',805,290]],
  feiton: [['Wailing Swamp',614,172],['Red Moonshade',488,211],['Kalaja',563,280],['Shady Cliff',458,329],['Nameless Valley',593,369]],
  rohendel: [['Breezesome Brae',453,227],['Elzowin’s Shade',614,199],['Glass Lotus Lake',550,252],['Rothun',513,330],['Lake Shiverwave',629,368],['Xeneela Ruins',404,408]],
  rowen: [['Regarbank Great Plains',430,170],['The Wolflands',556,207],['Fang River',475,300]],
  sushire: [['Iceblood Plateau',516,149],['Icewing Heights',637,176],['Rigens Village',400,200],['Frozen Sea',355,270],['Bitterwind Hill',487,270],['Lake Eternity',589,300]],
  yorn: [['Yorn’s Cradle',358,97],['Great Castle',296,212],['Iron Hammer Mine',514,215],['Unfinished Garden',353,307],['Black Anvil Mine',432,338],['Hall of Promise',581,296]],
  voldis: [['Great Rainforest',691,483],['Sage’s Tower',941,430],['Kalinar',1004,451]],
  anikka: [['Port City Changhun',370,316],['Rattan Hill',477,234],['Delphi Township',533,365],['Melody Forest',694,327],['Twilight Mists',746,223],['Prisma Valley',850,202]],
  arthetine: [['Nebelhorn',477,149],['Riza Falls',566,190],['Arid Path',449,236],['Scraplands',526,239],['Origins of Stern',551,309],['Totrich',630,299],['Windbringer Hills',502,375],['Red Sand Desert',645,382]],
  cardarum: [['Cadarum',706,328]],
  north_kurzan: [['Seut Valley',568,252],['Abidos Garrison',546,340]],
  south_kurzan: [['Elnead',609,223],['Vesper, the Cursed Land',432,335]],
  north_vern: [['Vernese Forest',522,250],['Parna Forest',618,260],['Fesnar Highland',425,289],['Rania Village',539,318],['Balankar Mountains',463,378],['Vern Castle',559,383],['Port Krona',649,364]],
  south_vern: [['Velyonar Site of Triumph',385,288],['Bellion Ruins',439,354],['Candaria Territory',639,324]],
  pleccia: [['Pleccia',499,334],['Prehilia Prairie',561,305]],
  punika: [['Starsand Beach',613,190],['Nia Village',576,261],['Secret Forest',447,265],['Tikatika Colony',508,310],['Tideshelf Path',596,324]],
  tortoyk: [['Skyreach Steppe',528,267],['Forest of Giants',591,279],['Mokoko Village',534,322],['Sweetwater Forest',589,346],['Seaswept Woods',492,367]],
  south_rimeria: [['Nukman Valley',572,334],['Shae',534,385],['Yan’s Path',439,405]]
};
const placeCatalog = {};
const placeMarkers = {};
function placeId(region, name) {
  return `${region}/${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;
}
for (const [region, entries] of Object.entries(placeGroups)) {
  placeMarkers[region] = entries.map(([name, x, y]) => {
    const id = placeId(region, name);
    placeCatalog[id] = { id, name, region, tracks: { ES: [], EN: [], KR: [] } };
    return { id, x, y };
  });
}
// The same image and the same records are used from either entrance.
placeMarkers.yorn = [...placeMarkers.yorn, ...placeMarkers.voldis];
placeMarkers.voldis = placeMarkers.yorn;
// Neighboring locations visible in more than one capture point to their original record.
function neighbors(mapId, region, entries) {
  for (const [name, x, y] of entries) placeMarkers[mapId].push({ id: placeId(region, name), x, y });
}
neighbors('north_kurzan','south_kurzan', [['Elnead',481,417],['Vesper, the Cursed Land',305,527]]);
neighbors('south_kurzan','north_kurzan', [['Seut Valley',696,59],['Abidos Garrison',674,150]]);
neighbors('north_vern','south_vern', [['Velyonar Site of Triumph',64,408],['Bellion Ruins',114,475],['Candaria Territory',315,443]]);
neighbors('south_vern','north_vern', [['Vernese Forest',845,128],['Parna Forest',938,140],['Fesnar Highland',747,171],['Rania Village',860,198],['Balankar Mountains',784,260],['Vern Castle',881,263],['Port Krona',972,248]]);
neighbors('anikka','pleccia', [['Pleccia',86,186],['Prehilia Prairie',147,157]]);
neighbors('anikka','tortoyk', [['Skyreach Steppe',221,494],['Forest of Giants',285,506],['Mokoko Village',228,546],['Sweetwater Forest',282,569]]);
neighbors('arthetine','south_kurzan', [['Vesper, the Cursed Land',905,410]]);
neighbors('cardarum','south_kurzan', [['Elnead',318,60],['Vesper, the Cursed Land',138,170]]);
neighbors('cardarum','anikka', [['Twilight Mists',143,436],['Prisma Valley',247,418],['Melody Forest',91,540]]);
neighbors('north_kurzan','arthetine', [['Totrich',30,414],['Red Sand Desert',44,497]]);
neighbors('north_vern','pleccia', [['Pleccia',1002,393],['Prehilia Prairie',1065,363]]);
neighbors('pleccia','north_vern', [['Vernese Forest',21,185],['Parna Forest',112,198],['Rania Village',36,253],['Vern Castle',57,319],['Port Krona',147,303]]);
neighbors('pleccia','arthetine', [['Windbringer Hills',751,65],['Red Sand Desert',896,73]]);
neighbors('pleccia','anikka', [['Rattan Hill',892,380],['Port City Changhun',787,461],['Delphi Township',948,510]]);
neighbors('punika','yorn', [['Iron Hammer Mine',106,460],['Hall of Promise',172,544]]);
neighbors('rowen','sushire', [['Iceblood Plateau',1027,193],['Rigens Village',911,244],['Frozen Sea',865,315],['Bitterwind Hill',998,314]]);
neighbors('sushire','rowen', [['The Wolflands',48,163]]);
neighbors('south_kurzan','arthetine', [['Riza Falls',92,111],['Scraplands',52,161],['Origins of Stern',74,231],['Totrich',157,221],['Windbringer Hills',27,295],['Red Sand Desert',172,304]]);
neighbors('south_kurzan','cardarum', [['Cadarum',999,490]]);
neighbors('tortoyk','anikka', [['Port City Changhun',680,88],['Delphi Township',840,139],['Melody Forest',1002,99]]);
neighbors('yorn','punika', [['Secret Forest',858,19],['Tikatika Colony',916,63],['Tideshelf Path',1004,79]]);

// Shared with the local server; the browser keeps using the same catalog.
if (typeof module !== 'undefined') module.exports = { placeCatalog, placeMarkers };
