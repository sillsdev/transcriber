import { useGlobal } from '../context/GlobalContext';
import { useOrbitData } from '../hoc/useOrbitData';
import { IntellectualProperty } from '../model';
import related from './related';
import { useFetchUrlNow } from './useFetchUrlNow';
import { remoteId } from './remoteId';
import { RecordKeyMap } from '@orbit/records';

export const useVoiceUrl = () => {
  const ipRecs = useOrbitData<IntellectualProperty[]>('intellectualproperty');
  const [orgId] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const fetchUrl = useFetchUrlNow();

  return async (voice: string) => {
    const ipRec = ipRecs.find(
      (r) =>
        related(r, 'organization') === orgId &&
        r.attributes.rightsHolder === voice
    );
    const mediaId = related(ipRec, 'releaseMediafile');
    const remId =
      remoteId('mediafile', mediaId, memory?.keyMap as RecordKeyMap) ?? mediaId;
    return await fetchUrl({
      id: remId,
      cancelled: () => false,
      noDownload: true,
    });
  };
};
