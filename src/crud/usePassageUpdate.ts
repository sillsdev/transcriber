import { useGlobal } from 'reactn';
import { PassageD } from '../model';
import { RecordTransformBuilder } from '@orbit/records';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';

export const usePassageUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (
    passage: PassageD,
    sectionId?: string,
    passageType?: string,
    sharedResourceId?: string
  ) => {
    const t = new RecordTransformBuilder();
    const ops = [...UpdateRecord(t, passage, user)];
    if (sectionId) {
      ops.push(
        ...ReplaceRelatedRecord(t, passage, 'section', 'section', sectionId)
      );
    }
    if (passageType !== undefined) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          passage,
          'passagetype',
          'passagetype',
          passageType
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
