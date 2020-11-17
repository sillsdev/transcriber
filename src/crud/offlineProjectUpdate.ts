import { Project, OfflineProject } from '../model';
import Memory from '@orbit/memory';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { related } from '.';
import { currentDateTime } from '../utils';

export const offlineProjectUpdate = (
  project: Project,
  ops: Operation[],
  memory: Memory
) => {
  const tb = new TransformBuilder();
  const orec = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('offlineproject')
  ) as OfflineProject[];
  const oprecs = orec.filter((r) => related(r, 'project') === project.id);
  if (oprecs.length > 0) {
    const proj = {
      ...oprecs[0],
      attributes: {
        snapshotDate:
          project.attributes.dateImported || project.attributes.dateCreated,
        dateUpdated: currentDateTime(),
      },
    } as OfflineProject;
    ops.push(tb.updateRecord(proj));
    return true;
  } else return false;
};
