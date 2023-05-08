import { useContext } from 'react';
import { useGlobal } from 'reactn';
import * as actions from '../store';
import { QueryBuilder } from '@orbit/data';
import {
  Plan,
  MediaFile,
  ITranscriptionTabStrings,
  ExportType,
} from '../model';
import { getMediaInPlans, related, remoteIdNum, useOfflnProjRead } from '.';
import { TokenContext } from '../context/TokenProvider';
import IndexedDBSource from '@orbit/indexeddb';

interface IProps {
  exportProject: typeof actions.exportProject;
  t: ITranscriptionTabStrings;
  message?: string;
}

export const useProjectExport = (props: IProps) => {
  const { message } = props;
  const { exportProject, t } = props;
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [userId] = useGlobal('user');
  const [, setBusy] = useGlobal('importexportBusy');
  const [errorReporter] = useGlobal('errorReporter');
  const token = useContext(TokenContext).state.accessToken;
  const getOfflineProject = useOfflnProjRead();

  return (exportType: ExportType, projectId: string) => {
    setBusy(true);

    const mediaFiles = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];

    var projectplans = plans.filter(
      (pl) => related(pl, 'project') === projectId
    );
    let media: MediaFile[] = getMediaInPlans(
      projectplans.map((p) => p.id),
      mediaFiles,
      undefined,
      false
    );
    exportProject(
      exportType,
      undefined, //always export all artifact types
      memory,
      backup,
      remoteIdNum('project', projectId, memory.keyMap),
      remoteIdNum('user', userId, memory.keyMap),
      media.length,
      token,
      errorReporter,
      message || t.exportingProject,
      t.noData.replace('{0}', ''),
      t.queued,
      '',
      getOfflineProject
    );
  };
};
