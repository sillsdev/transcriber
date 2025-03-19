import React, { useEffect, useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual } from 'react-redux';
import {
  IMainStrings,
  IProjButtonsStrings,
  ProjectD,
  MediaFile,
  Discussion,
  GroupMembership,
} from '../model';
import { findRecord, usePlanType } from '../crud';
import {
  projDefSectionMap,
  useProjectDefaults,
} from '../crud/useProjectDefaults';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { projButtonsSelector } from '../selector';
import { LocalKey, localUserKey } from '../utils';
import { useProjectPermissions } from '../utils/useProjectPermissions';
export interface IRowData {}

const initState = {
  t: {} as IMainStrings,
  readonly: false,
  connected: false,
  projButtonStr: {} as IProjButtonsStrings,
  mediafiles: [] as MediaFile[],
  discussions: [] as Discussion[],
  groupmemberships: [] as GroupMembership[],
  scripture: false,
  flat: false,
  shared: false,
  publishingOn: true,
  hidePublishing: true,
  canPublish: false,
  sectionArr: [] as [number, string][],
  setSectionArr: (sectionArr: [number, string][]) => {},
  togglePublishing: () => {},
  setCanAddPublishing: (canAddPublishing: boolean) => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PlanContext = React.createContext({} as IContext);

interface IProps {
  children: React.ReactElement;
}

const PlanProvider = (props: IProps) => {
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const discussions = useOrbitData<Discussion[]>('discussion');
  const groupmemberships = useOrbitData<GroupMembership[]>('groupmembership');
  const projButtonStr: IProjButtonsStrings = useSelector(
    projButtonsSelector,
    shallowEqual
  );
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan'); //will be constant here
  const [project] = useGlobal('project'); //will be constant here
  const [connected] = useGlobal('connected'); //verified this is not used in a function 2/18/25
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [isDeveloper] = useGlobal('developer');
  const getPlanType = usePlanType();
  const { setProjectDefault, getProjectDefault } = useProjectDefaults();
  const { canEditSheet, canPublish } = useProjectPermissions();
  const [readonly] = useState(!canEditSheet);

  const [state, setState] = useState({
    ...initState,
    projButtonStr,
    mediafiles,
    discussions,
    groupmemberships,
  });

  const getSectionMap = () => {
    return getProjectDefault(projDefSectionMap) as
      | [number, string][]
      | undefined;
  };

  const setSectionArr = (newArr: [number, string][]) => {
    setProjectDefault(projDefSectionMap, newArr);
  };

  useEffect(() => {
    const { scripture, flat } = getPlanType(plan);
    if (flat !== state.flat || scripture !== state.scripture)
      setState((state) => ({ ...state, flat, scripture }));
    // setSectionArr([]);
    // console.log('PlanContext: plan changed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    let projRec = findRecord(memory, 'project', project) as ProjectD;
    if (projRec) {
      const shared = projRec?.attributes?.isPublic || false;
      const hideId = LocalKey.hidePublishing + project;
      const hidePublish =
        localStorage.getItem(localUserKey(hideId as LocalKey)) || 'true';
      const hidePublishing = Boolean(
        hidePublish === 'true' || (isOffline && !isDeveloper)
      );

      if (
        shared !== state.shared ||
        hidePublishing !== state[LocalKey.hidePublishing]
      ) {
        setState((state) => ({
          ...state,
          shared,
          hidePublishing,
        }));
        localStorage.setItem(
          localUserKey(hideId as LocalKey),
          hidePublishing.toString()
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const setCanAddPublishing = (publishingOn: boolean) => {
    setState((state) => ({ ...state, publishingOn }));
  };

  const togglePublishing = () => {
    const { hidePublishing } = state;
    const hideId = LocalKey.hidePublishing + project;
    localStorage.setItem(
      localUserKey(hideId as LocalKey),
      (!Boolean(hidePublishing)).toString()
    );
    setState((state) => ({ ...state, hidePublishing: !hidePublishing }));
  };

  //don't do this anymore because we also check in the busy checks
  /*
  //do this every 30 seconds to warn they can't save
  useInterval(
    () => checkOnline((result: boolean) => {}),
    isOffline ? null : 1000 * 30
  );
  */
  return (
    <PlanContext.Provider
      value={{
        state: {
          ...state,
          sectionArr: getSectionMap() ?? [],
          setSectionArr,
          connected,
          readonly,
          canPublish,
          togglePublishing,
          setCanAddPublishing,
        },
        setState,
      }}
    >
      {props.children}
    </PlanContext.Provider>
  );
};

export { PlanContext, PlanProvider };
