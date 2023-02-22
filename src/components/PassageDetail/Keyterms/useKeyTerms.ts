import React from 'react';
import { useBookN } from '../../../utils/useBookN';
import { bcvKey } from '../../../utils/bcvKey';
import { IKeyTerm, ILocalTerm } from '../../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';
import { useGlobal } from 'reactn';

export const ktHide = 'HI';

export enum SortBy {
  Word = 'W',
  Gloss = 'G',
  Transliteration = 'T',
  All = 'A',
}

export const localeLanguages = [
  'En',
  'Es',
  'Fr',
  'Id',
  'Pt-BR',
  'Pt',
  'zh-Hans',
  'zh-Hant',
];

export const useKeyTerms = () => {
  const [terms, setTerms] = React.useState<Map<number, IKeyTerm>>();
  const [localTerm, setLocalTerm] = React.useState<Map<number, ILocalTerm>>();
  const [verseTerm, setVerseTerm] = React.useState<Map<string, number[]>>();
  const [excluded, setExcluded] = React.useState(Array<string | number>());
  const [lang] = useGlobal('lang');
  const [language, setLanguage] = React.useState(
    localeLanguages.find((v) => v.split('-')[0].toLowerCase() === lang) ?? 'En'
  );
  const exclSet = React.useRef(new Set<string | number>());
  const [sortBy, setSortBy] = React.useState<SortBy>(SortBy.Word);
  const bookN = useBookN();
  const ktCat = ['PN', 'FL', 'RE', 'FA', 'AT', 'BE', 'RI', 'MI', ktHide];
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);
  const defaultLabels = [
    t.name,
    t.flora,
    t.realia,
    t.fauna,
    t.attribute,
    t.being,
    t.ritual,
    t.misc,
    t.hide,
  ];
  const [ktLabel, setKtLabel] = React.useState(defaultLabels);

  const initExcluded = (excArr: Array<string | number>) => {
    setExcluded(excArr);
    exclSet.current.clear();
    excArr.forEach((i) => exclSet.current.add(i));
  };

  React.useEffect(() => {
    console.log(`key terms loading... `);
    import('../../../assets/terms').then((termData) =>
      setTerms(new Map(termData.default as any))
    );
    import('../../../assets/verseTerm').then((verseTermData) =>
      setVerseTerm(new Map(verseTermData.default as any))
    );
    console.log(`key terms loaded.`);
    initExcluded(['PN', 'FL', 'FA', ktHide]);
  }, []);

  React.useEffect(() => {
    import(`../../../assets/cat${language}`).then((catData) => {
      const catMap = new Map<string, string>(catData.default as any);
      setKtLabel(ktCat.map((v, d) => catMap.get(v) ?? defaultLabels[d]));
    });
    import(`../../../assets/term${language}`).then((termData) => {
      setLocalTerm(new Map(termData.default as any));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const oneTerm = (t: number) => ({
    ...(terms?.get(t) as IKeyTerm),
    ...(localTerm?.get(t) as ILocalTerm),
    I: t,
  });

  const wordComp = (i: number, j: number) => {
    if (!terms) return 0;
    const iObj = terms.get(i);
    const jObj = terms.get(j);
    const iW = iObj?.W.toLocaleLowerCase() ?? '';
    const jW = jObj?.W.toLocaleLowerCase() ?? '';
    return iW > jW ? 1 : -1;
  };

  const glossComp = (i: number, j: number) => {
    if (!localTerm || !terms) return 0;
    const iObj = localTerm.get(i) ?? terms.get(i);
    const jObj = localTerm.get(j) ?? terms?.get(j);
    const iG = iObj?.G.toLocaleLowerCase() ?? '';
    const jG = jObj?.G.toLocaleLowerCase() ?? '';
    return iG > jG ? 1 : -1;
  };

  const transliterateComp = (i: number, j: number) => {
    if (!terms) return 0;
    const iObj = terms.get(i);
    const jObj = terms.get(j);
    const iT = iObj?.T.toLocaleLowerCase() ?? '';
    const jT = jObj?.T.toLocaleLowerCase() ?? '';
    return iT > jT ? 1 : -1;
  };

  const termComp = React.useRef(wordComp);

  const handleSortCompare = (by: SortBy) => {
    if (by === SortBy.Gloss) {
      termComp.current = glossComp;
    } else if (by === SortBy.Transliteration) {
      termComp.current = transliterateComp;
    } else {
      termComp.current = wordComp;
    }
  };

  const handleSetSort = (by: SortBy) => {
    setSortBy(by);
    handleSortCompare(by);
  };

  const verseTerms = (
    book: string,
    chapter: number,
    start: number,
    end?: number,
    sort?: SortBy // force refresh on sort change
  ) => {
    if (sort) handleSortCompare(sort);
    const bookn = bookN(book);
    let termSet = new Set<number>();
    if (verseTerm) {
      for (let v = start; v <= (end ?? start); v += 1) {
        (verseTerm.get(bcvKey(bookn, chapter, v)) ?? []).forEach((n) =>
          termSet.add(n)
        );
      }
    }
    if (terms) {
      return Array.from(termSet)
        .filter((t) => {
          const to = terms.get(t);
          if (exclSet.current.has(to?.C ?? 'x')) return false;
          if (exclSet.current.has(t) && exclSet.current.has(ktHide))
            return false;
          return true;
        })
        .sort(termComp.current)
        .map(oneTerm);
    }
    return [];
  };

  const ktDisplay = (i: number) => {
    const to = terms?.get(i);
    const lt = localTerm?.get(i) ?? terms?.get(i);
    if (sortBy === SortBy.All) {
      return `${to?.W} /${to?.T}/ ${lt?.G}`;
    }
    if (sortBy === SortBy.Gloss) {
      const m = /^[^,;\uff1b\u3002\uff0c]+/u.exec(lt?.G ?? '');
      return m ? m[0] : lt?.G.trim() ?? '';
    }
    if (sortBy === SortBy.Transliteration) return to?.T ?? '';
    return to?.W ?? '';
  };

  const excludeToggle = (cat: string | number) => {
    if (exclSet.current.has(cat)) {
      exclSet.current.delete(cat);
    } else {
      exclSet.current.add(cat);
    }
    setExcluded(Array.from(exclSet.current));
  };

  const isExcluded = (item: string | number) => {
    const result = exclSet.current.has(item);
    return result;
  };

  const catLabel = (cat: string) => {
    const index = ktCat.indexOf(cat);
    return index >= 0 ? ktLabel[index] : '';
  };

  const setLocale = (code: string) => {
    if (localeLanguages.find((v) => code === v) && language !== code)
      setLanguage(code);
  };

  return {
    verseTerms,
    ktCat,
    catLabel,
    excludeToggle,
    excluded,
    initExcluded,
    isExcluded,
    sortBy,
    setSortBy: handleSetSort,
    ktDisplay,
    oneTerm,
    setLocale,
    language,
  };
};
