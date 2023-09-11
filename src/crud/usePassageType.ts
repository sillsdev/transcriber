import { useGlobal } from 'reactn';
import PassageType, { PassageTypeEnum } from '../model/passageType';
import { remoteId } from './remoteId';
import { findRecord } from './tryFindRecord';
import { useSnackBar } from '../hoc/SnackBar';

export const usePassageType = () => {
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { showMessage } = useSnackBar();

  const GetPassageTypeFromRef = (ref?: string) => {
    if (!ref) return PassageTypeEnum.PASSAGE;
    var arr = Object.values(PassageTypeEnum).filter((v) => ref.startsWith(v));
    if (arr.length > 0) return arr[0];
    return PassageTypeEnum.PASSAGE;
  };
  const GetPassageTypeFromId = (id?: string) => {
    if (!id) return PassageTypeEnum.PASSAGE;
    var rec = findRecord(memory, 'passagetype', id) as PassageType;
    if (rec) return rec.attributes.abbrev as PassageTypeEnum;
    return PassageTypeEnum.PASSAGE;
  };

  const PassageTypeRecordOnly = (ref?: string) =>
    GetPassageTypeFromRef(ref) !== PassageTypeEnum.PASSAGE &&
    GetPassageTypeFromRef(ref) !== PassageTypeEnum.NOTE;

  const GetPassageTypeRec = (pt: PassageTypeEnum) => {
    if (pt !== PassageTypeEnum.PASSAGE) {
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
  const CheckIt = (whereAmI: string) => {
    var len = (
      memory.cache.query((q) => q.findRecords('passagetype')) as PassageType[]
    ).filter((p) => Boolean(p?.keys?.remoteId)).length;
    if (len > 5) showMessage(whereAmI + 'passagetype ' + len.toString());
  };
  return {
    PassageTypeRecordOnly,
    GetPassageTypeRec,
    GetPassageTypeFromRef,
    GetPassageTypeFromId,
    CheckIt,
  };
};
