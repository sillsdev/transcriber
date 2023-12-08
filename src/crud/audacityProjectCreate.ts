import { AudacityProject, AudacityProjectD } from '../model';
import Memory from '@orbit/memory';
import {
  RecordOperation,
  RecordIdentity,
  RecordTransformBuilder,
} from '@orbit/records';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

export const audacityProjectCreate = (
  passageRecId: RecordIdentity,
  ops: RecordOperation[],
  user: string,
  memory: Memory,
  name: string
) => {
  const tb = new RecordTransformBuilder();
  const proj: AudacityProject = {
    type: 'audacityproject',
    attributes: {
      audacityName: name,
    },
  } as AudacityProject;
  ops.push(...AddRecord(tb, proj, user, memory));
  ops.push(
    ...ReplaceRelatedRecord(
      tb,
      proj as AudacityProjectD,
      'passage',
      'passage',
      passageRecId.id
    )
  );
};
