const badChar = " (),.:/!?_'`0123456789";
const hasBadChar = s => {
  for (let i = 0; i < s.length; i += 1) {
    if (badChar.indexOf(s[i]) !== -1) return true;
  }
  return false;
};
const woBadChar = s => {
  if (!s) return "";
  let result = "";
  for (let i = 0; i < s.length; i += 1) {
    if (badChar.indexOf(s[i]) === -1) result += s[i];
  }
  return result;
};

const addToMap = (map, tag, index, rankBase, full) => {
  if (tag === undefined || tag.length === 0) return;
  if (full) {
    let rank = rankBase * 10 + 1;
    const token = tag.toLocaleLowerCase();
    if (!map.hasOwnProperty(token)) {
      map[token] = [{ index, rank }];
    }
    if (token.indexOf(" ") !== -1) {
      token.split(" ").forEach(t => {
        const key = woBadChar(t);
        if (!map.hasOwnProperty(key)) {
          map[key] = [{ index, rank }];
        }
        rank = rankBase * 10;
      });
    }
    return;
  }
  tag = woBadChar(tag);
  let rank = rankBase * 10 + 1;
  for (let i = 0; i < tag.length; i += 1) {
    const token = tag[i].toLocaleLowerCase();
    if (hasBadChar(token)) continue;
    if (!map.hasOwnProperty(token)) {
      map[token] = [{ index, rank }];
    }
    rank = rankBase * 10;
  }
  rank = rankBase * 10 + 1;
  for (let i = 0; i < tag.length - 1; i += 1) {
    const token = (tag[i] + tag[i + 1]).toLocaleLowerCase();
    if (hasBadChar(token)) continue;
    if (!map.hasOwnProperty(token)) {
      map[token] = [{ index, rank }];
    }
    rank = rankBase * 10;
  }
  rank = rankBase * 10 + 1;
  for (let i = 0; i < tag.length - 2; i += 1) {
    const token = (tag[i] + tag[i + 1] + tag[i + 2]).toLocaleLowerCase();
    if (hasBadChar(token)) continue;
    if (!map.hasOwnProperty(token)) {
      map[token] = [{ index, rank }];
    }
    rank = rankBase * 10;
  }
};

const iRankCompare = (a, b) => b.rank - a.rank;

const sortInsert = (list, value) => {
  return [...list, value].sort(iRankCompare);
};

const limitSortInsert = (list, value) => {
  return [...list, value].sort(iRankCompare).filter((v, i) => i < 7);
};

const mapMerge = (current, composite, full) => {
  var keys = Object.keys(current);
  keys.forEach(v => {
    if (composite.hasOwnProperty(v)) {
      composite[v] = full
        ? sortInsert(composite[v], current[v][0])
        : limitSortInsert(composite[v], current[v][0]);
    } else {
      composite[v] = current[v].map(v => v);
    }
  });
};

const makeMap = (langTags, full, subtag) => {
  let partial = {};
  langTags.forEach((lt, i) => {
    if (subtag || (lt.tag && lt.tag.indexOf("-") === -1)) {
      let thisTag = {};
      // Calls to addToMap should be ordered highes to lowest priority
      if (lt.tag && lt.tag.indexOf("-") !== -1) {
        addToMap(thisTag, lt.tag.split("-")[0], i, 9, full);
      }
      addToMap(thisTag, lt.tag, i, 9, full);
      addToMap(thisTag, lt.iso639_3, i, 8, full);
      addToMap(thisTag, lt.full, i, 7, full);
      addToMap(thisTag, lt.name, i, 6, full);
      addToMap(thisTag, lt.localname, i, 5, full);
      if (lt.names) lt.names.map(n => addToMap(thisTag, n, i, 4, full));
      if (lt.tags) lt.tags.map(t => addToMap(thisTag, t, i, 3, full));
      addToMap(thisTag, lt.region, i, 2, full);
      addToMap(thisTag, lt.regionname, i, 1, full);
      mapMerge(thisTag, partial, full);
    }
  });
  return partial;
};

const collectScripts = langTags => {
  let lists = {};
  langTags.forEach(lt => {
    if (lt.tag) {
      const lgTag = lt.tag.split("-")[0];
      if (lists.hasOwnProperty(lgTag)) {
        if (!lists[lgTag].includes(lt.script)) lists[lgTag].push(lt.script);
      } else {
        lists[lgTag] = [lt.script];
      }
    }
  });
  return lists;
};

const addFontToList = (list, s) => {
  if (s.trim() !== "") list.push(s);
};

const makeFontMap = data => {
  let fontMap = {};
  data.split("\n").forEach((line, i) => {
    if (i !== 0) {
      const fields = line.split("\t");
      const code = fields[0].trim();
      const regions = fields[8]
        .trim()
        .split(",")
        .map(v => v.trim());
      const fonts = [];
      addFontToList(fonts, fields[11]);
      addFontToList(fonts, fields[12]);
      addFontToList(fonts, fields[13]);
      addFontToList(fonts, fields[14]);
      addFontToList(fonts, fields[15]);
      addFontToList(fonts, fields[16]);
      addFontToList(fonts, fields[17]);
      if (fonts.length !== 0) {
        if (regions.length === 0) {
          if (fontMap.hasOwnProperty(code)) {
            console.log(
              "Warning: scripts.csv: " +
                code +
                " exists twice in table with no region."
            );
          }
          fontMap[code] = fonts;
        } else {
          regions.forEach(r => {
            const key = r.trim().length > 0 ? code + "-" + r : code;
            if (fontMap.hasOwnProperty(key)) {
              console.log(
                "Warning: scripts.csv: " +
                  code +
                  " with region " +
                  r +
                  " has multiple font definitions."
              );
            }
            fontMap[key] = fonts;
          });
        }
      }
    }
  });
  return fontMap;
};

const getNames = data => {
  let names = {};
  data.split("\n").forEach((line, i) => {
    if (i !== 0) {
      const fields = line.split("\t");
      const code = fields[0].trim();
      const name = fields[2].trim();
      if (name !== "") names[code] = name;
    }
  });
  return names;
};

var fs = require("fs");
var writeFile = require("write");
const indexDir = __dirname + "/../index";
if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir);

const makeFolder = (name, typeName, data) => {
  var folder = indexDir + "/" + name;
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  var firstChar = {};
  var keys = Object.keys(data);
  keys.forEach(k => {
    const letter = k.slice(0, 1);
    if (!firstChar.hasOwnProperty(letter)) firstChar[letter] = true;
  });
  Object.keys(firstChar).forEach(letter => {
    var letPart = {};
    keys.forEach(key => {
      if (key.slice(0, 1) === letter) {
        letPart[key] = data[key];
      }
    });
    const firstCode = letter.charCodeAt(0).toString();
    const header = `// This file is auto-generated. Modify the script that creates it.
import { ${typeName} } from '../../langPicker/types';

export const f${firstCode}: ${typeName} =  `;
    writeFile.sync(
      folder + "/" + firstCode + ".tsx",
      header + JSON.stringify(letPart, "", 2)
    );
  });
  let code =
    "// This file is auto-generated. Modify the script that creates it.\n";
  Object.keys(firstChar).forEach(letter => {
    const firstCode = letter.charCodeAt(0).toString();
    code =
      code +
      "import { f" +
      firstCode +
      " } from './" +
      name +
      "/" +
      firstCode +
      "';\n";
  });
  code =
    code +
    `\nexport const has${name} = (key: string) => {
  if (!key || key.length === 0) return false;
  switch (key.slice(0,1).charCodeAt(0)) {
`;
  Object.keys(firstChar).forEach(letter => {
    const firstCode = letter.charCodeAt(0).toString();
    code =
      code +
      "    case " +
      firstCode +
      ": return f" +
      firstCode +
      ".hasOwnProperty(key);\n";
  });
  code =
    code +
    `    default: return false;
  }
}

export const get${name} = (key: string) => {
  if (!key || key.length === 0) return [];
  switch (key.slice(0,1).charCodeAt(0)) {
`;
  Object.keys(firstChar).forEach(letter => {
    const firstCode = letter.charCodeAt(0).toString();
    code =
      code + "    case " + firstCode + ": return f" + firstCode + "[key];\n";
  });
  code =
    code +
    `    default: return [];
  }
}
`;
  writeFile.sync(indexDir + "/Lg" + name + ".tsx", code);
};

var json = fs.readFileSync(__dirname + "/../data/langtags.json", "utf8");
var jsonData = JSON.parse(json);
console.log("json data:", jsonData.length);
jsonData.push({
  full: "qaa",
  iso639_3: "qaa",
  localname: "Unknown",
  name: "Unknown",
  regionname: "anywhere",
  script: "Latn",
  sldr: false,
  tag: "qaa"
});
makeFolder("Partial", "LangTagMap", makeMap(jsonData, false, true));
makeFolder("NoSubTag", "LangTagMap", makeMap(jsonData, false, false));
makeFolder("Exact", "LangTagMap", makeMap(jsonData, true, true));
makeFolder("Scripts", "ScriptList", collectScripts(jsonData));

var csvData = fs.readFileSync(__dirname + "/../data/scripts.csv", "utf8");
const header1 = `// This file is auto-generated. Modify the script that creates it.
import { FontMap } from '../langPicker/types';

export const fontMap: FontMap =  `;
writeFile.sync(
  indexDir + "/LgFontMap.tsx",
  header1 + JSON.stringify(makeFontMap(csvData), "", 2)
);
const header2 = `// This file is auto-generated. Modify the script that creates it.
import { ScriptName } from '../langPicker/types';

export const scriptName: ScriptName =  `;
writeFile.sync(
  indexDir + "/LgScriptName.tsx",
  header2 + JSON.stringify(getNames(csvData), "", 2)
);
