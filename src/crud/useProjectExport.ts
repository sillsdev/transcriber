import { useGlobal } from 'reactn';
import * as actions from '../store';
import { QueryBuilder } from '@orbit/data';
import { Plan, MediaFile, ITranscriptionTabStrings } from '../model';
import { getMediaInPlans, related, remoteIdNum } from '.';
import Auth from '../auth/Auth';

interface IProps {
  auth: Auth;
  exportProject: typeof actions.exportProject;
  t: ITranscriptionTabStrings;
}

export const useProjecExport = (props: IProps) => {
  const { auth } = props;
  const {exportProject, t} = props;
  const [memory] = useGlobal('memory');
  const [userId] = useGlobal('user');
  const [, setBusy] = useGlobal('importexportBusy');
  const [errorReporter] = useGlobal('errorReporter');

  return (exportType: string, projectId: string) => {
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
      mediaFiles
    );
    exportProject(
      exportType,
      memory,
      remoteIdNum('project', projectId, memory.keyMap),
      remoteIdNum('user', userId, memory.keyMap),
      media.length,
      auth,
      errorReporter,
      t.exportingProject
    );
  };
};
