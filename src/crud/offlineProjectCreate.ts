import { Project, OfflineProject } from '../model';
import Memory from '@orbit/memory';
import { Operation, TransformBuilder } from '@orbit/data';
import { currentDateTime } from '../utils';

export const offlineProjectCreate = (
  project: Project,
  ops: Operation[],
  memory: Memory,
  fingerprint: string,
  defaultAvailable?: boolean,
) => {
  const tb = new TransformBuilder();
  const proj: OfflineProject = {
    type: 'offlineproject',
    attributes: {
      computerfp: fingerprint,
      snapshotDate:
        project.attributes.dateImported || project.attributes.dateCreated,
      offlineAvailable: Boolean(defaultAvailable),
      dateCreated: currentDateTime(),
      dateUpdated: currentDateTime(),
    },
  } as OfflineProject;
  memory.schema.initializeRecord(proj);
  ops.push(tb.addRecord(proj));
  ops.push(tb.replaceRelatedRecord(proj, 'project', project));
};
