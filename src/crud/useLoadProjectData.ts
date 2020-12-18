import { useGlobal } from 'reactn';
import * as actions from '../store';
import { IMainStrings } from '../model';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';
import { Online, useProjectsLoaded } from '../utils';
import { LoadProjectData } from '.';

export const useLoadProjectData = (
  auth: Auth,
  t: IMainStrings,
  doOrbitError: typeof actions.doOrbitError
) => {
  const [coordinator] = useGlobal('coordinator');
  const [, setConnected] = useGlobal('connected');
  const [isOffline] = useGlobal('offline');
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const [, setBusy] = useGlobal('importexportBusy');
  const AddProjectLoaded = useProjectsLoaded();
  const { showMessage } = useSnackBar();

  return (projectId: string, cb?: () => void) => {
    if (projectsLoaded.includes(projectId)) {
      if (cb) cb();
      return;
    }
    Online((online) => {
      setConnected(online);
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
    }, auth);
  };
};
