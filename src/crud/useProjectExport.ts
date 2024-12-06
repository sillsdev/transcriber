import { useContext } from 'react';
import { useGlobal } from '../context/GlobalContext';
import * as actions from '../store';
import { ITranscriptionTabStrings, ExportType, PlanD } from '../model';
import {
  IPlanMedia,
  getDownloadableMediaInPlans,
  related,
  remoteIdNum,
  useOfflnProjRead,
} from '.';
import { TokenContext } from '../context/TokenProvider';
import IndexedDBSource from '@orbit/indexeddb';
import { RecordKeyMap } from '@orbit/records';
import { useSelector } from 'react-redux';
import { transcriptionTabSelector } from '../selector';
import { useDispatch } from 'react-redux';
import { useArtifactType } from './useArtifactType';

interface IProps {
  message?: string;
  isCancelled?: () => boolean;
}

export const useProjectExport = (props: IProps) => {
  const { message, isCancelled } = props;
  const t: ITranscriptionTabStrings = useSelector(transcriptionTabSelector);
  const dispatch = useDispatch();
  const exportProject = (props: actions.ExPrjProps) =>
    dispatch(actions.exportProject(props));
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const [userId] = useGlobal('user');
  const [, setBusy] = useGlobal('importexportBusy');
  const [errorReporter] = useGlobal('errorReporter');
  const { localizedArtifactTypeFromId } = useArtifactType();
  const token = useContext(TokenContext).state.accessToken;
  const getOfflineProject = useOfflnProjRead();

  return (exportType: ExportType, projectId: string) => {
    setBusy(true);

    const plans = memory.cache.query((q) => q.findRecords('plan')) as PlanD[];

    var projectplans = plans.filter(
      (pl) => related(pl, 'project') === projectId
    );
    let media: IPlanMedia[] = getDownloadableMediaInPlans(
      projectplans.map((p) => p.id),
      memory
    );
    exportProject({
      exportType,
      artifactType: undefined, //always export all artifact types
      memory,
      backup,
      projectid: remoteIdNum(
        'project',
        projectId,
        memory.keyMap as RecordKeyMap
      ),
      userid: remoteIdNum('user', userId, memory.keyMap as RecordKeyMap),
      numberOfMedia: media.length,
      token,
      errorReporter,
      pendingmsg: message || t.creatingDownloadFile,
      nodatamsg: t.noData.replace('{0}', ''),
      writingmsg: t.writingDownloadFile,
      localizedArtifact: localizedArtifactTypeFromId(exportType),
      getOfflineProject,
      isCancelled,
    });
  };
};
