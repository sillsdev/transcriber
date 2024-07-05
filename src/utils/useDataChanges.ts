import { useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { useDispatch } from 'react-redux';
import { doDataChanges } from '../hoc/DataChanges';
import { useOfflnProjRead } from '../crud';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import { useDownloadMedia } from './useDownloadMedia';

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
  const { tryDownload } = useDownloadMedia();
  return () => {
    doDataChanges(
      accessToken || '',
      coordinator,
      fingerprint,
      projectsLoaded,
      getOfflineProject,
      errorReporter,
      user,
      setLanguage,
      setDataChangeCount,
      tryDownload
    );
  };
};
