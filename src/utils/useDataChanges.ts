import { useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { doDataChanges } from '../hoc/DataChanges';
import { useFetchUrlNow, useOfflnProjRead } from '../crud';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';

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
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const fetchUrl = useFetchUrlNow(ts.expiredToken);
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
      fetchUrl
    );
  };
};
