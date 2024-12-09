import { Project, OfflineProject, OfflineProjectD } from '../model';
import Memory from '@orbit/memory';
import {
  RecordIdentity,
  RecordOperation,
  RecordTransformBuilder,
  StandardRecordNormalizer,
} from '@orbit/records';
import { currentDateTime } from '../utils/currentDateTime';
import { ReplaceRelatedRecord } from '../model/baseModel';

export const offlineProjectCreate = (
  project: Project,
  ops: RecordOperation[],
  memory: Memory,
  fingerprint: string,
  snapshotDate: string,
  fileDownloadDate: string,
  defaultAvailable?: boolean
) => {
  const tb = new RecordTransformBuilder();
  let proj: OfflineProject = {
    type: 'offlineproject',
    attributes: {
      computerfp: fingerprint,
      snapshotDate: snapshotDate,
      fileDownloadDate: fileDownloadDate,
      offlineAvailable: Boolean(defaultAvailable),
      dateCreated: currentDateTime(),
      dateUpdated: currentDateTime(),
    },
  } as OfflineProject;
  const rn = new StandardRecordNormalizer({ schema: memory?.schema });
  proj = rn.normalizeRecord(proj) as OfflineProjectD;
  ops.push(tb.addRecord(proj).toOperation());
  ops.push(
    ...ReplaceRelatedRecord(
      tb,
      proj as RecordIdentity,
      'project',
      'project',
      project.id
    )
  );
};
