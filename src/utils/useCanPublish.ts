import { useContext, useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useGlobal } from 'reactn';
import { IProfileStrings, IState } from '../model';
import * as action from '../store';
import { TokenContext } from '../context/TokenProvider';
import { profileSelector } from '../selector';
import { useHasParatext } from './useHasParatext';
const version = require('../../package.json').version;

export const useCanPublish = () => {
  const [canPublish, setCanPublish] = useState(false);
  const askingRef = useRef(false);
  const [isOffline] = useGlobal('offline');
  const { accessToken } = useContext(TokenContext).state;
  const [errorReporter] = useGlobal('errorReporter');
  const { hasParatext } = useHasParatext();
  const paratext_canPublish = useSelector(
    (state: IState) => state.paratext.canPublish
  );
  const paratext_canPublishStatus = useSelector(
    (state: IState) => state.paratext.canPublishStatus
  );
  const dispatch = useDispatch();
  const getCanPublish = (token: string, errorReporter: any, message: string) =>
    dispatch(action.getCanPublish(token, errorReporter, message));
  const resetCanPublish = () => dispatch(action.resetCanPublish());
  const t: IProfileStrings = useSelector(profileSelector, shallowEqual);

  useEffect(() => {
    if (/alpha|beta/.test(version)) {
      if (canPublish !== hasParatext) setCanPublish(hasParatext);
      return;
    }
    if (!isOffline) {
      if (!askingRef.current && accessToken && !paratext_canPublishStatus) {
        askingRef.current = true; //so we only call it once
        getCanPublish(accessToken || '', errorReporter, t.checkingParatext);
      }
      if (paratext_canPublishStatus) {
        if (paratext_canPublishStatus.errStatus) {
          //showMessage(translateParatextError(paratext_canPublishStatus, ts));
          console.error(paratext_canPublishStatus.errMsg);
        } else if (paratext_canPublishStatus.complete) {
          setCanPublish(paratext_canPublish as boolean);
          resetCanPublish();
        }
      }
    } else {
      setCanPublish(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accessToken,
    isOffline,
    canPublish,
    paratext_canPublish,
    paratext_canPublishStatus,
    hasParatext
  ]);

  return { canPublish };
};
