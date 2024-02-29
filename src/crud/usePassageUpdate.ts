import { useGlobal } from 'reactn';
import { PassageD } from '../model';
import { RecordTransformBuilder } from '@orbit/records';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';
import { PassageTypeEnum } from '../model/passageType';
import { usePassageType } from './usePassageType';

export const usePassageUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { getPassageTypeRec } = usePassageType();

  return async (
    passage: PassageD,
    sectionId?: string,
    passageType?: PassageTypeEnum,
    sharedResourceId?: string
  ) => {
    const t = new RecordTransformBuilder();
    const ops = [...UpdateRecord(t, passage, user)];
    if (sectionId) {
      ops.push(
        ...ReplaceRelatedRecord(t, passage, 'section', 'section', sectionId)
      );
    }
    if (passageType !== undefined && passageType !== PassageTypeEnum.PASSAGE) {
      var pt = getPassageTypeRec(passageType);
      if (pt)
        ops.push(
          ...ReplaceRelatedRecord(
            t,
            passage,
            'passagetype',
            'passagetype',
            pt.id
          )
        );
    }
    if (sharedResourceId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          passage,
          'sharedResource',
          'sharedresource',
          sharedResourceId
        )
      );
    }
    await memory.update(ops);
  };
};
