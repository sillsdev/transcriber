import { useGlobal } from 'reactn';
import PassageType, { PassageTypeEnum } from '../model/passageType';
import { remoteId } from './remoteId';
import { findRecord } from './tryFindRecord';

export const usePassageType = () => {
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');

  const GetPassageTypeFromRef = (ref?: string) => {
    if (!ref) return undefined;
    var arr = Object.values(PassageTypeEnum).filter((v) => ref.startsWith(v));
    if (arr.length > 0) return arr[0];
    return undefined;
  };
  const GetPassageTypeFromId = (id?: string) => {
    if (!id) return undefined;
    var rec = findRecord(memory, 'passagetype', id) as PassageType;
    if (rec) return rec.attributes.abbrev as PassageTypeEnum;
    return undefined;
  };

  const PassageTypeRecordOnly = (ref?: string) =>
    GetPassageTypeFromRef(ref) !== undefined &&
    GetPassageTypeFromRef(ref) !== PassageTypeEnum.NOTE;

  const GetPassageTypeRec = (pt: PassageTypeEnum | undefined) => {
    if (pt) {
      var recs = memory.cache.query((q) =>
        q.findRecords('passagetype')
      ) as PassageType[];
      recs = recs.filter(
        (r) =>
          r.attributes.abbrev === pt &&
          Boolean(remoteId('passagetype', r.id, memory.keyMap)) !== offlineOnly
      );
      if (recs?.length > 0) return recs[0];
    }
    return undefined;
  };

  return {
    PassageTypeRecordOnly,
    GetPassageTypeRec,
    GetPassageTypeFromRef,
    GetPassageTypeFromId,
  };
};
