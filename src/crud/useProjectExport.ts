import { useContext } from 'react';
import { useGlobal } from 'reactn';
import * as actions from '../store';
import {
  ITranscriptionTabStrings,
  ExportType,
  PlanD,
  MediaFileD,
  Plan,
  VProject,
  OfflineProject,
} from '../model';
import { getMediaInPlans, related, remoteIdNum, useOfflnProjRead } from '.';
import { TokenContext } from '../context/TokenProvider';
import IndexedDBSource from '@orbit/indexeddb';
import { RecordKeyMap } from '@orbit/records';
import { useSelector } from 'react-redux';
import { transcriptionTabSelector } from '../selector';
import { useDispatch } from 'react-redux';

interface IProps {
  message?: string;
}

export const useProjectExport = (props: IProps) => {
  const { message } = props;
  const t: ITranscriptionTabStrings = useSelector(transcriptionTabSelector);
  const dispatch = useDispatch();
  const exportProject = (
    exportType: ExportType,
    artifactType: string | null | undefined,
    memory: any,
    backup: any,
    projectId: number,
    userId: number,
    mediaCount: number,
    token: string | null,
    errorReporter: any,
    message: string,
    noDataMessage: string,
    writingMessage: string,
    doneMessage: string,
    getOfflineProject: (plan: Plan | VProject | string) => OfflineProject
  ) =>
    dispatch(
      actions.exportProject(
        exportType,
        artifactType,
        memory,
        backup,
        projectId,
        userId,
        mediaCount,
        token,
        errorReporter,
        message,
        noDataMessage,
        writingMessage,
        doneMessage,
        getOfflineProject
      )
    );
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

    const mediaFiles = memory.cache.query((q) =>
      q.findRecords('mediafile')
    ) as MediaFileD[];
    const plans = memory.cache.query((q) => q.findRecords('plan')) as PlanD[];

    var projectplans = plans.filter(
      (pl) => related(pl, 'project') === projectId
    );
    let media: MediaFileD[] = getMediaInPlans(
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
      remoteIdNum('project', projectId, memory.keyMap as RecordKeyMap),
      remoteIdNum('user', userId, memory.keyMap as RecordKeyMap),
      media.length,
      token,
      errorReporter,
      message || t.creatingDownloadFile,
      t.noData.replace('{0}', ''),
      t.writingDownloadFile,
      '',
      getOfflineProject
    );
  };
};
