import { useContext, useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useGlobal } from '../context/GlobalContext';
import { IProfileStrings, IState, User, UserD } from '../model';
import * as action from '../store';
import { TokenContext } from '../context/TokenProvider';
import { profileSelector } from '../selector';
import { useOrbitData } from '../hoc/useOrbitData';
import { UpdateRecord } from '../model/baseModel';

export const useCanPublish = () => {
  const [canPublish, setCanPublish] = useState<boolean | undefined>();
  const askingRef = useRef(false);
  const [isOffline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  const { accessToken } = useContext(TokenContext).state;
  const [errorReporter] = useGlobal('errorReporter');
  const [user] = useGlobal('user');
  const users = useOrbitData<User[]>('user');
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
    if (user && users) {
      const u = users.find((u) => u.id === user);
      setCanPublish(u?.attributes?.canPublish ?? false);
    }
  }, [user, users]);

  useEffect(() => {
    if (!isOffline) {
      if (
        canPublish === false && //if it's still undefined...wait for it to be set from user
        !askingRef.current &&
        accessToken &&
        !paratext_canPublishStatus
      ) {
        askingRef.current = true; //so we only call it once
        getCanPublish(accessToken || '', errorReporter, t.checkingParatext);
      }
      if (paratext_canPublishStatus) {
        if (paratext_canPublishStatus.errStatus) {
          //showMessage(translateParatextError(paratext_canPublishStatus, ts));
          console.error(paratext_canPublishStatus.errMsg);
        } else if (paratext_canPublishStatus.complete) {
          setCanPublish(paratext_canPublish as boolean);
          const u = users.find((u) => u.id === user);
          if (u !== undefined) {
            u.attributes.canPublish = paratext_canPublish as boolean;
            memory.update((t) => UpdateRecord(t, u as UserD, user));
          }
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
  ]);
  return { canPublish };
};
