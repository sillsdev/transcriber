import { IRow, IPRow, IAttachMap } from '.';

export interface IMatchData {
  terms?: string[];
  data: IRow[];
  pdata: IPRow[];
  attachMap: IAttachMap;
}

export const makeMatchMap = (pat: string, matchData: IMatchData) => {
  const { terms, data, pdata, attachMap } = matchData;
  if (pdata.length === 0 || data.length === 0) return;
  const rpat = new RegExp(pat);
  const newMap = { ...attachMap };
  const usedPass = new Set<number>();
  Object.keys(newMap).forEach((k) => usedPass.add(newMap[k]));
  let found = 0;
  data.forEach((dr, dn) => {
    if (dr.reference === '') {
      const m = rpat.exec(dr.fileName);
      if (m) {
        for (let i = 0; i < pdata.length; i++) {
          if (usedPass.has(i)) continue;
          const r = pdata[i];
          let fail = false;
          if (terms) {
            for (let j = 0; j < terms.length; j++) {
              const t = terms[j];
              const val = m[j + 1];
              if (t === 'SECT') {
                if (parseInt(val) !== r.secNum) fail = true;
              } else if (t === 'PASS') {
                if (parseInt(val) !== r.pasNum) fail = true;
              } else if (t === 'BOOK') {
                if (val !== r.book) fail = true;
              } else if (t === 'CHAP') {
                if (parseInt(val) !== r.chap) fail = true;
              } else if (t === 'BEG') {
                if (parseInt(val) !== r.beg) fail = true;
              } else if (t === 'END') {
                if (parseInt(val) !== r.end) fail = true;
              }
              if (fail) break;
            }
          }
          if (!fail) {
            newMap[dr.id] = i;
            usedPass.add(i);
            found += 1;
            break;
          }
        }
      }
    }
  });
  return { found, newMap };
};
