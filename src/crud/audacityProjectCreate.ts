import { AudacityProject } from '../model';
import Memory from '@orbit/memory';
import { Operation, RecordIdentity, TransformBuilder } from '@orbit/data';
import { currentDateTime } from '../utils';
import { ReplaceRelatedRecord } from '../model/baseModel';

export const audacityProjectCreate = (
  passageRecId: RecordIdentity,
  ops: Operation[],
  memory: Memory,
  name: string
) => {
  const tb = new TransformBuilder();
  const proj: AudacityProject = {
    type: 'audacityproject',
    attributes: {
      audacityName: name,
      dateCreated: currentDateTime(),
      dateUpdated: currentDateTime(),
    },
  } as AudacityProject;
  memory.schema.initializeRecord(proj);
  ops.push(tb.addRecord(proj));
  ops.push(
    ...ReplaceRelatedRecord(tb, proj, 'passage', 'passage', passageRecId.id)
  );
};
