import { useContext, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useGlobal } from '../context/GlobalContext';
import { IProfileStrings, IState } from '../model';
import * as action from '../store';
import { TokenContext } from '../context/TokenProvider';
import { profileSelector } from '../selector';
import { getParatextDataPath } from './paratextPath';
import { addPt } from './addPt';

export const useHasParatext = () => {
  const [ptPath, setPtPath] = useState('');
  const [hasParatext, setHasParatext] = useState(false);
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const { accessToken } = useContext(TokenContext).state;
  const [errorReporter] = useGlobal('errorReporter');
  const paratext_username = useSelector(
    (state: IState) => state.paratext.username
  );
  const paratext_usernameStatus = useSelector(
    (state: IState) => state.paratext.usernameStatus
  );
  const dispatch = useDispatch();
  const getUserName = (token: string, errorReporter: any, message: string) =>
    dispatch(action.getUserName(token, errorReporter, message));
  const t: IProfileStrings = useSelector(profileSelector, shallowEqual);

  useEffect(() => {
    if (isOffline) getParatextDataPath().then((val) => setPtPath(val));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (!isOffline) {
      if (!paratext_usernameStatus) {
        getUserName(
          accessToken || '',
          errorReporter,
          addPt(t.checkingParatext)
        );
      }
      setHasParatext(paratext_username !== '');
    } else {
      setHasParatext(ptPath !== '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accessToken,
    errorReporter,
    isOffline,
    paratext_username,
    paratext_usernameStatus,
  ]);

  return { hasParatext, ptPath };
};
