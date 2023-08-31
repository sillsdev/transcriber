import { useGlobal } from 'reactn';
import PassageType from '../model/passageType';
import { remoteId } from './remoteId';

export const usePassageType = () => {
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');

  enum PassageTypeEnum {
    BOOK = 'BOOK',
    CHAPTERNUMBER = 'CHNUM',
    TITLE = 'TITLE',
    ALTBOOK = 'ALTBK',
    NOTE = 'NOTE',
  }
  const IsNoteType = (ref?: string) =>
    GetPassageType(ref) === PassageTypeEnum.NOTE;

  const GetPassageType = (ref?: string) => {
    if (!ref) return undefined;
    var arr = Object.values(PassageTypeEnum).filter((v) => ref.startsWith(v));
    if (arr.length > 0) return arr[0];
    return undefined;
  };

  const PassageTypeRecordOnly = (ref?: string) =>
    GetPassageType(ref) !== undefined && !IsNoteType(ref);

  const GetPassageTypeRec = (ref?: string) => {
    var pt = GetPassageType(ref);
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
    GetPassageType,
    PassageTypeEnum,
  };
};
