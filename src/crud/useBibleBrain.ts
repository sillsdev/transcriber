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
      if (nt) recs = recs.filter((rec) => rec.attributes.nt === true);
      else recs = recs.filter((rec) => rec.attributes.ot === true);
      if (timing) recs = recs.filter((rec) => rec.attributes.timing === true);
      return recs;
    } else return [] as VwBiblebrainlanguage[];
  };
  const getBibles = async (iso: string, nt: boolean, timing: boolean) => {
    if (remote) {
      var recs = (await remote.query((q) =>
        q
          .findRecords('vwbiblebrainbible')
          .filter({ attribute: 'iso', value: iso })
      )) as VwBiblebrainbible[];
      if (nt) recs = recs.filter((rec) => rec.attributes.nt === true);
      else recs = recs.filter((rec) => rec.attributes.ot === true);
      if (timing) recs = recs.filter((rec) => rec.attributes.timing === true);
      return recs;
    } else return [] as VwBiblebrainbible[];
  };
  return { getLanguages, getBibles };
};
