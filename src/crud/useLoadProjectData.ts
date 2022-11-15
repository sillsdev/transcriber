import { useGlobal } from 'reactn';
import * as actions from '../store';
import { IMainStrings } from '../model';
import { useSnackBar } from '../hoc/SnackBar';
import { useCheckOnline, useProjectsLoaded } from '../utils';
import { LoadProjectData } from '.';

export const useLoadProjectData = (
  t: IMainStrings,
  doOrbitError: typeof actions.doOrbitError
) => {
  const [coordinator] = useGlobal('coordinator');
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const [, setBusy] = useGlobal('importexportBusy');
  const AddProjectLoaded = useProjectsLoaded();
  const { showMessage } = useSnackBar();
  const checkOnline = useCheckOnline();

  return (projectId: string, cb?: () => void) => {
    if (projectsLoaded.includes(projectId) || offlineOnly) {
      if (cb) cb();
      return;
    }
    checkOnline((online) => {
      LoadProjectData(
        projectId,
        coordinator,
        online && !isOffline,
        projectsLoaded,
        AddProjectLoaded,
        setBusy,
        doOrbitError
      )
        .then(() => {
          if (cb) cb();
        })
        .catch((err: Error) => {
          if (!online) showMessage(t.NoLoadOffline);
          else showMessage(err.message);
        });
    });
  };
};
