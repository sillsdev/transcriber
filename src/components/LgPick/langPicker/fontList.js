/* fontList.js - put fonts and css in repo */
/* myFontsDir is a folder (as explained in the readme) that is
   outside the repo. It contains all the Google Noto fonts and
   this fileList, processes that folder and copies the fonts we
   need into a folder in our repo. */
// Fonts downloaded from: https://www.google.com/get/noto/ and
// from http://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=using_web_fonts
const myFontsDir = process.argv.length > 2 ? process.argv[2] : '';
if (myFontsDir === '') {
  console.log('Usage: node fontLis.js <fontFolter>');
  console.log(
    '<fontFolter> is the path (use forward /) to the folder outside the repo with fonts'
  );
  process.exit(-1);
}
// fontMap was copied from ../index/LgFontMap.tsx
const fontMap = {
  Adlm: ['Ebrima', 'NotoSansAdlam'],
  Aghb: ['NotoSansCaucasianAlbanian'],
  Ahom: ['NotoSerifAhom'],
  'Arab-CM': ['Harmattan'],
  'Arab-GN': ['Harmattan'],
  'Arab-SN': ['Harmattan'],
  'Arab-NG': ['Harmattan'],
  'Arab-NE': ['Harmattan'],
  'Arab-PK': ['Awami Nastaliq'],
  Arab: ['Scheherazade', 'NotoSansArabic'],
  Aran: ['Awami Nastaliq', 'NotoNastaliqUrdu'],
  Armi: ['NotoSansImperialAramaic'],
  Armn: ['NotoSansArmenian', 'NotoSerifArmenian'],
  Avst: ['NotoSansAvestan'],
  Bali: ['NotoSansBalinese'],
  Bamu: ['NotoSansBamum'],
  Bass: ['NotoSansBassaVah'],
  Batk: ['NotoSansBatak'],
  Beng: ['NotoSansBengali', 'NotoSerifBengali'],
  Bhks: ['NotoSansBhaiksuki'],
  Brah: ['NotoSansBrahmi'],
  Bugi: ['NotoSansBuginese'],
  Buhd: ['NotoSansBuhid'],
  Cakm: ['NotoSansChakma'],
  Cans: ['NotoSansCanadianAboriginal'],
  Cari: ['NotoSansCarian'],
  Cham: ['NotoSansCham'],
  Cher: ['NotoSansCherokee'],
  Copt: ['NotoSansCoptic', 'Sophia Nubian'],
  Cprt: ['NotoSansCypriot'],
  Cyrl: ['Charis SIL', 'NotoSans', 'NotoSerif'],
  Deva: ['Annapurna SIL', 'NotoSansDevanagari', 'NotoSerifDevanagari'],
  Dsrt: ['NotoSansDeseret'],
  Dupl: ['NotoSansDuployan'],
  Egyp: ['NotoSansEgyptianHieroglyphs'],
  Elba: ['NotoSansElbasan'],
  Ethi: ['Abyssinica SIL', 'NotoSansEthiopic', 'NotoSerifEthiopic'],
  Geor: ['NotoSansGeorgian', 'NotoSerifGeorgian'],
  Glag: ['NotoSansGlagolitic'],
  Gong: ['Narnoor'],
  Goth: ['NotoSansGothic'],
  Gran: ['NotoSansGrantha'],
  Grek: ['Gentium Plus, Galatia', 'NotoSans', 'NotoSerif'],
  Gujr: ['NotoSansGujarati', 'NotoSerifGujarati'],
  Guru: ['NotoSansGurmukhi', 'NotoSerifGurmukhi'],
  Hanb: ['Noto Sans CJK SC', 'Noto Serif CJK SC'],
  Hang: ['Noto Sans CJK KR', 'Noto Serif CJK KR'],
  Hani: ['Noto Sans CJK JP', 'Noto Serif CJK JP'],
  Hano: ['NotoSansHanunoo'],
  Hans: ['Noto Sans CJK SC', 'Noto Serif CJK SC'],
  Hant: ['Noto Sans CJK TC', 'Noto Serif CJK TC'],
  Hatr: ['NotoSansHatran'],
  Hebr: ['Ezra SIL', 'NotoSansHebrew', 'NotoSerifHebrew'],
  Hira: ['Noto Sans CJK JP', 'Noto Serif CJK JP'],
  Hluw: ['NotoSansAnatolianHieroglyphs'],
  Hmng: ['NotoSansPahawhHmong'],
  Hrkt: ['Noto Sans CJK JP', 'Noto Serif CJK JP'],
  Hung: ['NotoSansOldHungarian'],
  Ital: ['NotoSansOldItalic'],
  Jamo: ['Noto Sans CJK KR', 'Noto Serif CJK KR'],
  Java: ['NotoSansJavanese'],
  Jpan: ['Noto Sans CJK JP', 'Noto Serif CJK JP'],
  Kali: ['Kyebogyi', 'Kayahli', 'NotoSansKayah Li'],
  Kana: ['Noto Sans CJK JP', 'Noto Serif CJK JP'],
  Khar: ['NotoSansKharoshthi'],
  Khmr: ['Khmer Mondulkiri', 'NotoSansKhmer', 'NotoSerifKhmer'],
  Khoj: ['NotoSansKhojki'],
  Knda: ['KNDA Badami', 'NotoSansKannada', 'NotoSerifKannada'],
  Kore: ['Noto Sans CJK KR', 'Noto Serif CJK KR'],
  Kthi: ['NotoSansKaithi'],
  Lana: ['NotoSansTaiTham'],
  Laoo: ['DokChampa', 'Saysettha MX', 'NotoSansLao', 'NotoSerifLao'],
  Latn: ['Charis SIL', 'NotoSansLatin'],
  Leke: ['NotoSansLeke'],
  Lepc: ['Mingzat', 'NotoSansLepcha'],
  Limb: ['Namdhinggo SIL', 'NotoSansLimbu'],
  Lina: ['NotoSansLinearA'],
  Linb: ['NotoSansLinearB'],
  Lisu: ['LisuTzimu', 'NotoSansLisu'],
  Lyci: ['NotoSansLycian'],
  Lydi: ['NotoSansLydian'],
  Mahj: ['NotoSansMahajani'],
  Mand: ['NotoSansMandaic'],
  Mani: ['NotoSansManichaean'],
  Marc: ['NotoSansMarchen'],
  Mend: ['NotoSansMendeKikakui'],
  Merc: ['NotoSansMeroitic Cursive'],
  Mero: ['NotoSansMeroitic'],
  Mlym: ['NotoSansMalayalam', 'NotoSerifMalayalam'],
  Modi: ['NotoSansModi'],
  Mong: ['NotoSansMongolian'],
  Mroo: ['NotoSansMro'],
  Mtei: ['NotoSansMeeteiMayek'],
  Mult: ['NotoSansMultani'],
  Mymr: ['Padauk', 'NotoSansMyanmar', 'NotoSerifMyanmar'],
  Nand: ['NotoSansNandinagari'],
  Narb: ['NotoSansOldNorthArabian'],
  Nbat: ['NotoSansNabataean'],
  Newa: ['NotoSansNewa'],
  Nkoo: ['Ebrima', 'NotoSansNKo'],
  Ogam: ['NotoSansOgham'],
  Olck: ['NotoSansOl Chiki'],
  Orkh: ['NotoSansOldTurkic'],
  Orya: ['NotoSansOriya'],
  Osge: ['NotoSansOsage'],
  Osma: ['Ebrima', 'NotoSansOsmanya'],
  Palm: ['NotoSansPalmyrene'],
  Pauc: ['NotoSansPauCinHau'],
  Perm: ['NotoSansOld Permic'],
  Phag: ['NotoSansPhagsPa'],
  Phli: ['NotoSansInscriptionalPahlavi'],
  Phlp: ['NotoSansPsalterPahlavi'],
  Phnx: ['NotoSansPhoenician'],
  Plrd: ['Shimenkan', 'NotoSansMiao', 'ShiShan'],
  Prti: ['NotoSansInscriptionalParthian'],
  Rjng: ['NotoSansRejang'],
  Runr: ['NotoSansRunic'],
  Samr: ['NotoSansSamaritan'],
  Sarb: ['NotoSansOldSouthArabian'],
  Saur: ['NotoSansSaurashtra'],
  Shui: ['NotoSansShuishu'],
  Sidd: ['NotoSansSiddham'],
  Sind: ['NotoSansKhudawadi'],
  Sinh: ['NotoSansSinhala', 'NotoSerifSinhala'],
  Sora: ['NotoSansSora Sompeng'],
  Sylo: ['Surma', 'NotoSansSylotiNagri'],
  Syrc: ['NotoSansSyriac'],
  Syrj: ['NotoSansSyriac'],
  Tagb: ['NotoSansTagbanwa'],
  Takr: ['NotoSansTakri'],
  Tale: ['NotoSansTaiLe'],
  Talu: ['Nokyung', 'NotoSansNewTaiLue', 'Dai Banna SIL'],
  Taml: ['TAML ThiruValluvar', 'NotoSansTamil', 'NotoSerifTamil'],
  Tang: ['NotoSansTangut'],
  Tavt: ['Tai Heritage Pro', 'NotoSansTaiViet'],
  Telu: ['NotoSansTelugu', 'NotoSerifTelugu'],
  'Tfng-MA': ['Ebrima', 'NotoSansTifinagh'],
  Tglg: ['NotoSansTagalog'],
  Thaa: ['NotoSansThaana'],
  Thai: ['NotoSansThai', 'NotoSerifThai'],
  Tibt: ['NotoSansTibetan', 'NotoSerifTibetan'],
  Tirh: ['NotoSansTirhuta'],
  Ugar: ['NotoSansUgaritic'],
  Vaii: ['Ebrima', 'NotoSansVai'],
  Wara: ['NotoSansWarangCiti'],
  Xpeo: ['NotoSansOldPersian'],
  Xsux: ['NotoSansCuneiform'],
  Yiii: ['Nuosu SIL', 'NotoSansYi'],
};

let fontList = [];
Object.keys(fontMap).forEach(script =>
  fontMap[script].forEach(name => {
    if (!fontList.includes(name)) {
      fontList.push(name);
    }
  })
);
const fontDir = __dirname + '/../../../../public/fonts';
var fs = require('fs');
try {
  fs.statSync(fontDir);
} catch (err) {
  fs.mkdirSync(fontDir);
}

let entries = [];
let dir = fs.opendirSync(myFontsDir);
const license = 'LICENSE_OFL.txt';
fs.copyFileSync(myFontsDir + '/' + license, fontDir + '/' + license);
while (true) {
  try {
    const dirent = dir.readSync();
    if (/\.ttf|\.woff/i.test(dirent.name))
      if (/-R/i.test(dirent.name)) entries.push(dirent.name);
  } catch {
    break;
  }
}
// console.log(JSON.stringify(entries, null, 2));
const fontWrite = (fontName, entry) => {
  fs.writeFileSync(
    fontDir + '/' + fontName + '.css',
    `/* ${fontName}.css */
@font-face {
font-family: ${fontName};
src: url('/fonts/${entry}')
}
`
  );
  fs.copyFileSync(myFontsDir + '/' + entry, fontDir + '/' + entry);
};
fontList.sort().forEach(name => {
  let fontName = name.split(',')[0].replace(/ /g, '');
  // console.log(fontName);
  let found = false;
  entries.forEach(entry => {
    if (!found) {
      if (
        entry
          .toLocaleLowerCase()
          .startsWith(fontName.toLocaleLowerCase() + '-r')
      ) {
        fontWrite(fontName, entry);
        found = true;
      } else if (
        entry.toLocaleLowerCase().startsWith(fontName.toLocaleLowerCase())
      ) {
        fontWrite(fontName, entry);
        found = true;
      }
    }
  });
  if (!found) console.log('Missing', fontName);
});
