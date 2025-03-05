import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import * as actions from '../store';
import { IApiError, IMainStrings } from '../model';
import { useSnackBar } from '../hoc/SnackBar';
import { useCheckOnline, useProjectsLoaded } from '../utils';
import { LoadProjectData } from '.';
import { shallowEqual, useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { mainSelector } from '../selector';

export const useLoadProjectData = () => {
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  const dispatch = useDispatch();
  const doOrbitError = (ex: IApiError) => dispatch(actions.doOrbitError(ex));
  const [coordinator] = useGlobal('coordinator');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [, setBusy] = useGlobal('importexportBusy');
  const AddProjectLoaded = useProjectsLoaded();
  const { showMessage } = useSnackBar();
  const checkOnline = useCheckOnline('LoadProjectData');
  const getGlobal = useGetGlobal();
  return (projectId: string, cb?: () => void) => {
    if (getGlobal('projectsLoaded').includes(projectId) || offlineOnly) {
      if (cb) cb();
      return;
    }
    checkOnline((online) => {
      LoadProjectData(
        projectId,
        coordinator,
        online && !getGlobal('offline'),
        getGlobal('projectsLoaded'),
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
