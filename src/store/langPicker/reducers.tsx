import * as type from './types';

export const langTagsCleanState = {
  loaded: false,
  langTags: Array<type.LangTag>(),
  partial: {},
  noSubtag: {},
  exact: {},
  fontMap: {},
  scriptNames: {},
} as type.ILangTagData;

const badChar = " (),.:/!?_'`0123456789";
export const hasBadChar = (s: string) => {
  for (let i = 0; i < s.length; i += 1) {
    if (badChar.indexOf(s[i]) !== -1) return true;
  }
  return false;
};
export const woBadChar = (s: string | undefined) => {
  if (!s) return '';
  let result = '';
  for (let i = 0; i < s.length; i += 1) {
    if (badChar.indexOf(s[i]) === -1) result += s[i];
  }
  return result;
};

const addToMap = (
  map: type.LangTagMap,
  tag: string | undefined,
  index: number,
  rankBase: number,
  full: boolean
) => {
  if (tag === undefined || tag.length === 0) return;
  if (full) {
    let rank = rankBase * 10 + 1;
    const token = tag.toLocaleLowerCase();
    if (!map.hasOwnProperty(token)) {
      map[token] = [{ index, rank }];
    }
    if (token.indexOf(' ') !== -1) {
      token.split(' ').forEach(t => {
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

const iRankCompare = (a: type.IRanked, b: type.IRanked) => b.rank - a.rank;

const sortInsert = (list: Array<type.IRanked>, value: type.IRanked) => {
  return [...list, value].sort(iRankCompare);
};

const limitSortInsert = (list: Array<type.IRanked>, value: type.IRanked) => {
  return [...list, value].sort(iRankCompare).filter((v, i) => i < 7);
};

const mapMerge = (
  current: type.LangTagMap,
  composite: type.LangTagMap,
  full: boolean
) => {
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

const makeMap = (langTags: type.LangTag[], full: boolean, subtag: boolean) => {
  let partial: type.LangTagMap = {};
  langTags.forEach((lt: type.LangTag, i: number) => {
    if (subtag || lt.tag.indexOf('-') === -1) {
      let thisTag: type.LangTagMap = {};
      // Calls to addToMap should be ordered highes to lowest priority
      if (lt.tag.indexOf('-') !== -1) {
        addToMap(thisTag, lt.tag.split('-')[0], i, 9, full);
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
  // console.log(process.env.REACT_APP_MODE);
  // if (process.env.REACT_APP_MODE === "electron") {
  //   save(partial);
  // }
  // console.log(partial);
  return partial;
};

const collectScripts = (langTags: type.LangTag[]): type.ScriptList => {
  let lists: type.ScriptList = {};
  langTags.forEach((lt: type.LangTag) => {
    const lgTag = lt.tag.split('-')[0];
    if (lists.hasOwnProperty(lgTag)) {
      if (!lists[lgTag].includes(lt.script)) lists[lgTag].push(lt.script);
    } else {
      lists[lgTag] = [lt.script];
    }
  });
  return lists;
};

const addFontToList = (list: string[], s: string) => {
  if (s.trim() !== '') list.push(s);
};

const makeFontMap = (data: string) => {
  let fontMap: type.FontMap = {};
  data.split('\n').forEach((line: string, i: number) => {
    if (i !== 0) {
      const fields = line.split('\t');
      const code = fields[0].trim();
      const regions = fields[8]
        .trim()
        .split(',')
        .map(v => v.trim());
      const fonts = Array<string>();
      addFontToList(fonts, fields[11]);
      addFontToList(fonts, fields[12]);
      addFontToList(fonts, fields[13]);
      addFontToList(fonts, fields[14]);
      addFontToList(fonts, fields[15]);
      addFontToList(fonts, fields[16]);
      addFontToList(fonts, fields[17]);
      // console.log(code + " -- " + regions.length + " -- " + fonts.length);
      if (fonts.length !== 0) {
        if (regions.length === 0) {
          if (fontMap.hasOwnProperty(code)) {
            console.log(
              'Warning: scripts.csv: ' +
                code +
                ' exists twice in table with no region.'
            );
          }
          fontMap[code] = fonts;
        } else {
          regions.forEach(r => {
            const key = r.trim().length > 0 ? code + '-' + r : code;
            if (fontMap.hasOwnProperty(key)) {
              console.log(
                'Warning: scripts.csv: ' +
                  code +
                  ' with region ' +
                  r +
                  ' has multiple font definitions.'
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

const getNames = (data: string) => {
  let names: type.ScriptName = {};
  data.split('\n').forEach((line: string, i: number) => {
    if (i !== 0) {
      const fields = line.split('\t');
      const code = fields[0].trim();
      const name = fields[2].trim();
      if (name !== '') names[code] = name;
    }
  });
  return names;
};

export default function langTagsReducer(
  state = langTagsCleanState,
  action: type.LangTagMsgs
): type.ILangTagData {
  switch (action.type) {
    case type.FETCH_LANGTAGS:
      if (Array.isArray(action.payload.data)) {
        action.payload.data.push({
          full: 'qaa',
          iso639_3: 'qaa',
          localname: 'Unknown',
          name: 'Unknown',
          regionname: 'anywhere',
          script: 'Latn',
          sldr: false,
          tag: 'qaa',
        });
      }
      return {
        ...state,
        loaded: true,
        partial: makeMap(action.payload.data, false, true),
        noSubtag: makeMap(action.payload.data, false, false),
        exact: makeMap(action.payload.data, true, true),
        scripts: collectScripts(action.payload.data),
        langTags: action.payload.data,
      };
    case type.FETCH_SCRIPTFONTS:
      return {
        ...state,
        fontMap: makeFontMap(action.payload.data),
        scriptNames: getNames(action.payload.data),
      };
    default:
      return state;
  }
}
