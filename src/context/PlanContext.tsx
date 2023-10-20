import React, { useEffect, useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  IMainStrings,
  IProjButtonsStrings,
  Project,
  MediaFile,
  Discussion,
  GroupMembership,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { usePlanType, useRole } from '../crud';
import { useCheckOnline, useInterval } from '../utils';
import { useProjectDefaults } from '../crud/useProjectDefaults';

export const ProjectHidePublishing = 'hidePublishing';

interface IStateProps {
  projButtonStr: IProjButtonsStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  projButtonStr: localStrings(state, { layout: 'projButtons' }),
});

interface IRecordProps {
  mediafiles: MediaFile[];
  discussions: Discussion[];
  groupmemberships: GroupMembership[];
}
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  groupmemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

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
  canHidePublishing: true,
  hidePublishing: true,
  togglePublishing: () => {},
  setCanPublish: (canPublish: boolean) => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PlanContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IRecordProps {
  children: React.ReactElement;
}

const PlanProvider = withData(mapRecordsToProps)(
  connect(mapStateToProps)((props: IProps) => {
    const { projButtonStr, mediafiles, discussions, groupmemberships } = props;
    const [memory] = useGlobal('memory');
    const [plan] = useGlobal('plan');
    const [project] = useGlobal('project');
    const [connected] = useGlobal('connected');
    const [isOffline] = useGlobal('offline');
    const [offlineOnly] = useGlobal('offlineOnly');
    const getPlanType = usePlanType();
    const { userIsAdmin } = useRole();
    const { setProjectDefault } = useProjectDefaults();
    const [readonly, setReadOnly] = useState(
      (isOffline && !offlineOnly) || !userIsAdmin
    );
    const [state, setState] = useState({
      ...initState,
      projButtonStr,
      mediafiles,
      discussions,
      groupmemberships,
    });
    const checkOnline = useCheckOnline();

    useEffect(() => {
      const { scripture, flat } = getPlanType(plan);
      if (flat !== state.flat || scripture !== state.scripture)
        setState((state) => ({ ...state, flat, scripture }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan]);

    useEffect(() => {
      let projRec: Project | null = null;
      if (project && project !== '')
        projRec = memory.cache.query((q: QueryBuilder) =>
          q.findRecord({ type: 'project', id: project })
        ) as Project;
      if (projRec !== null) {
        const shared = projRec?.attributes?.isPublic || false;
        const projDefStr = projRec?.attributes?.defaultParams || '{}';
        const projDef = JSON.parse(projDefStr);
        const hidePublishing = projDef[ProjectHidePublishing] || true;
        if (
          shared !== state.shared ||
          hidePublishing !== state[ProjectHidePublishing]
        ) {
          setState((state) => ({
            ...state,
            shared,
            hidePublishing,
          }));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project]);

    const setCanPublish = (canHidePublishing: boolean) => {
      setState((state) => ({ ...state, canHidePublishing }));
    };

    const togglePublishing = () => {
      const { hidePublishing } = state;
      setProjectDefault(ProjectHidePublishing, !hidePublishing);
      setState((state) => ({ ...state, hidePublishing: !hidePublishing }));
    };

    React.useEffect(() => {
      const newValue = (isOffline && !offlineOnly) || !userIsAdmin;
      if (readonly !== newValue) setReadOnly(newValue);
    }, [userIsAdmin, isOffline, offlineOnly, readonly]);

    //do this every 30 seconds to warn they can't save
    useInterval(
      () => checkOnline((result: boolean) => {}),
      isOffline ? null : 1000 * 30
    );

    return (
      <PlanContext.Provider
        value={{
          state: {
            ...state,
            connected,
            readonly,
            togglePublishing,
            setCanPublish,
          },
          setState,
        }}
      >
        {props.children}
      </PlanContext.Provider>
    );
  })
);

export { PlanContext, PlanProvider };
