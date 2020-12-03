import { OfflineProject } from '../model';
import Memory from '@orbit/memory';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { related } from '.';
import { currentDateTime } from '../utils';

export const offlineProjectFromProject = (
  memory: Memory,
  projectid: string
) => {
  const orec = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('offlineproject')
  ) as OfflineProject[];
  const oprecs = orec.filter((r) => related(r, 'project') === projectid);
  if (oprecs.length > 0) {
    return oprecs[0];
  }
  return undefined;
};
export const offlineProjectUpdateSnapshot = (
  projectid: string,
  ops: Operation[],
  memory: Memory,
  newDate: string,
  filesToo: boolean
) => {
  const tb = new TransformBuilder();
  const oprec = offlineProjectFromProject(memory, projectid);
  if (oprec) {
    const proj = {
      ...oprec,
      attributes: {
        snapshotDate: newDate,
        dateUpdated: newDate,
      },
    } as OfflineProject;
    if (filesToo) {
      proj.attributes.offlineAvailable = true;
      proj.attributes.fileDownloadDate = newDate;
    }
    ops.push(tb.updateRecord(proj));
    return true;
  } else return false;
};

export const offlineProjectUpdateFilesDownloaded = (
  projectid: string,
  ops: Operation[],
  memory: Memory,
  newDate: string
) => {
  const tb = new TransformBuilder();
  const oprec = offlineProjectFromProject(memory, projectid);
  if (oprec) {
    const proj = {
      ...oprec,
      attributes: {
        fileDownloadDate: newDate,
        dateUpdated: currentDateTime(),
      },
    } as OfflineProject;
    ops.push(tb.updateRecord(proj));
    return true;
  } else return false;
};
