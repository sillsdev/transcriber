import { useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { useDispatch } from 'react-redux';
import { doDataChanges } from '../hoc/DataChanges';
import { useFetchUrlNow, useOfflnProjRead } from '../crud';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import { isElectron } from '../api-variable';

export const useDataChanges = () => {
  const { accessToken } = useContext(TokenContext).state;
  const [errorReporter] = useGlobal('errorReporter');
  const [fingerprint] = useGlobal('fingerprint');
  const [coordinator] = useGlobal('coordinator');
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const getOfflineProject = useOfflnProjRead();
  const [user] = useGlobal('user');
  const dispatch = useDispatch();
  const setLanguage = (lang: string) => dispatch(actions.setLanguage(lang));
  const [, setDataChangeCount] = useGlobal('dataChangeCount');
  const fetchUrl = useFetchUrlNow();
  return async () => {
    await doDataChanges(
      accessToken || '',
      coordinator,
      fingerprint,
      projectsLoaded,
      getOfflineProject,
      errorReporter,
      user,
      setLanguage,
      setDataChangeCount,
      isElectron ? fetchUrl : undefined
    );
  };
};
