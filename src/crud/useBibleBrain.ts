import JSONAPISource from '@orbit/jsonapi';
import { useGlobal } from 'reactn';
import VwBiblebrainlanguage from '../model/vwbiblebrainlanguage';
import VwBiblebrainbible from '../model/vwbiblebrainbible';

export const useBibleBrain = () => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const getLanguages = async (nt: boolean, timing: boolean) => {
    if (remote) {
      var recs = (await remote.query((q) =>
        q.findRecords('vwbiblebrainlanguage')
      )) as VwBiblebrainlanguage[];
      if (nt) {
        recs = recs.filter((rec) => rec.attributes.nt === true);
        if (timing) recs = recs.filter((rec) => rec.attributes.ntTiming === true);
      }
      else {
        recs = recs.filter((rec) => rec.attributes.ot === true);
        if (timing) recs = recs.filter((rec) => rec.attributes.otTiming === true);
      }
      if (recs.filter(r => r.attributes.languageName === undefined).length > 0) console.log("no lang name")
      return recs.sort((a, b) => (a.attributes.languageName ?? a.attributes.iso).localeCompare(b.attributes.languageName ?? b.attributes.iso));
    } else return [] as VwBiblebrainlanguage[];
  };
  const getBibles = async (iso: string, lang: string, nt: boolean, timing: boolean) => {
    if (remote) {
      var recs = (await remote.query((q) =>
        q
          .findRecords('vwbiblebrainbible')
          .filter({ attribute: 'iso', value: iso })
          .filter({ attribute: 'languageName', value: lang })
      )) as VwBiblebrainbible[];
      recs = recs.filter((rec) => nt ? rec.attributes.nt === true : rec.attributes.ot = true);
      console.log(recs.length);
      if (timing) recs = recs.filter((rec) => nt ? rec.attributes.ntTiming === true : rec.attributes.otTiming === true);
      console.log(recs.length);
      if (recs.filter(r => r.attributes.bibleName === undefined).length > 0) console.log("nobiblename")

      return recs.sort((a, b) => (a.attributes.bibleName ?? a.attributes.bibleid).localeCompare(b.attributes.bibleName));
    } else return [] as VwBiblebrainbible[];
  };
  return { getLanguages, getBibles };
};
