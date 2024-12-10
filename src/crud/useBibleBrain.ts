import JSONAPISource from '@orbit/jsonapi';
import { useGlobal } from '../context/GlobalContext';
import VwBiblebrainlanguage from '../model/vwbiblebrainlanguage';
import VwBiblebrainbible from '../model/vwbiblebrainbible';

export const useBibleBrain = () => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;

  const getLanguages = async (nt: boolean, ot: boolean, timing: boolean) => {
    if (remote && (nt || ot)) {
      var recs = (await remote.query((q) =>
        q.findRecords('vwbiblebrainlanguage')
      )) as VwBiblebrainlanguage[];
      if (nt) {
        recs = recs.filter(
          (rec) =>
            rec.attributes.nt === true && rec.attributes.ntTiming === timing
        );
      } else {
        recs = recs.filter(
          (rec) =>
            rec.attributes.ot === true && rec.attributes.otTiming === timing
        );
      }
      return recs.sort((a, b) =>
        a.attributes.languageName.localeCompare(b.attributes.languageName)
      );
    } else return [] as VwBiblebrainlanguage[];
  };
  const getBibles = async (
    iso: string,
    lang: string,
    nt: boolean,
    ot: boolean,
    timing: boolean
  ) => {
    if (remote && (nt || ot)) {
      var recs = (await remote.query((q) =>
        q
          .findRecords('vwbiblebrainbible')
          .filter({ attribute: 'iso', value: iso })
          .filter({ attribute: 'languageName', value: lang })
      )) as VwBiblebrainbible[];
      if (nt)
        recs = recs.filter(
          (rec) =>
            rec.attributes.nt === true && rec.attributes.ntTiming === timing
        );
      else
        recs = recs.filter(
          (rec) =>
            rec.attributes.ot === true && rec.attributes.otTiming === timing
        );

      return recs.sort((a, b) =>
        a.attributes.bibleName.localeCompare(b.attributes.bibleName)
      );
    } else return [] as VwBiblebrainbible[];
  };
  return { getLanguages, getBibles };
};
