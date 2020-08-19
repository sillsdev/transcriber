import React, { useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { IState, IMainStrings, Plan, PlanType } from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related } from '../utils';
import { useRemoteSave } from '../utils/useRemoteSave';

interface IStateProps {
  t: IMainStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

interface IDispatchProps {}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

interface IRecordProps {}
const mapRecordsToProps = {};

export interface IRowData {}

const initState = {
  checkSavedFn: (method: () => {}) => {},
  message: <></>,
  tab: 0,
  changeTab: (tab: number) => {},
  t: {} as IMainStrings,
  handleSaveConfirmed: () => {},
  handleSaveRefused: () => {},
  handleMessageReset: () => {},
  isScripture: () => false,
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PlanContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  children: React.ReactElement;
}

const PlanProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const { t } = props;
    const [memory] = useGlobal('memory');
    const [plan] = useGlobal('plan');
    const [tab, setTab] = React.useState(0);
    const [importexportBusy] = useGlobal('importexportBusy');
    const [busy] = useGlobal('remoteBusy');
    const [changed, setChanged] = useGlobal('changed');
    const [doSave] = useGlobal('doSave');
    const [, setAlertOpen] = useGlobal('alertOpen');
    const [message, setMessage] = React.useState(<></>);
    const saveConfirm = React.useRef<() => any>();

    const [startSave, , waitForSave] = useRemoteSave();

    const [state, setState] = useState({
      ...initState,
      message,
      tab,
      t,
    });

    const isScripture = () => {
      const planRecs = (memory.cache.query((q: QueryBuilder) =>
        q.findRecords('plan')
      ) as Plan[]).filter((p) => p.id === plan);
      if (planRecs.length > 0) {
        const typeId = related(planRecs[0], 'plantype');
        const typeRecs = (memory.cache.query((q: QueryBuilder) =>
          q.findRecords('plantype')
        ) as PlanType[]).filter((pt) => pt.id === typeId);
        if (typeRecs.length > 0) {
          return (
            typeRecs[0]?.attributes?.name
              ?.toLowerCase()
              ?.indexOf('scripture') !== -1
          );
        }
      }
      return false;
    };

    const checkSavedFn = (method: () => any) => {
      if (busy || importexportBusy) {
        setMessage(<span>{t.loadingTable}</span>);
        return;
      }
      if (doSave) {
        setMessage(<span>{t.saving}</span>);
        return;
      }
      if (changed) {
        saveConfirm.current = method;
        setAlertOpen(true);
      } else {
        method();
      }
    };

    const changeTab = (tab: number) => {
      setTab(tab);
    };

    const handleSaveRefused = () => {
      if (saveConfirm.current) saveConfirm.current();
      saveConfirm.current = undefined;
      setAlertOpen(false);
      setChanged(false);
    };

    const finishConfirmed = (
      savedMethod: undefined | (() => any),
      waitCount: number
    ) => {
      waitForSave(savedMethod, waitCount).catch((err) => {
        setMessage(<span>{err.message}</span>);
      });
    };

    const handleSaveConfirmed = () => {
      const savedMethod = saveConfirm.current;
      saveConfirm.current = undefined;
      setMessage(<span>{t.saving}</span>);
      startSave();
      setAlertOpen(false);
      finishConfirmed(savedMethod, 8);
    };

    const handleMessageReset = () => {
      setMessage(<></>);
    };

    return (
      <PlanContext.Provider
        value={{
          state: {
            ...state,
            checkSavedFn,
            changeTab,
            handleSaveRefused,
            handleSaveConfirmed,
            handleMessageReset,
            isScripture,
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
