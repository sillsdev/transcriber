import React, { useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { IState, IMainStrings } from '../model';
import localStrings from '../selector/localize';
import { useRemoteSave } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from '../components/AlertDialog';

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

export interface IRowData {}

const initState = {
  checkSavedFn: (method: () => void) => {
    return;
  },
  t: {} as IMainStrings,
  handleSaveConfirmed: () => {},
  handleSaveRefused: () => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const UnsavedContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps {
  children: React.ReactElement;
}

const UnsavedProvider = connect(
  mapStateToProps,
  mapDispatchToProps
)((props: IProps) => {
  const { t } = props;
  // const [memory] = useGlobal('memory');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [busy] = useGlobal('remoteBusy');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [alertOpen, setAlertOpen] = useGlobal('alertOpen'); //global because planSheet checks it
  const saveConfirm = React.useRef<() => any>();
  const { showMessage } = useSnackBar();
  const [startSave, , waitForSave] = useRemoteSave();
  const [state, setState] = useState({
    ...initState,
    t,
  });

  const checkSavedFn = (method: () => any) => {
    if (busy || importexportBusy) {
      showMessage(t.loadingTable);
      return;
    }
    if (doSave) {
      showMessage(t.saving);
      return;
    }
    if (changed) {
      saveConfirm.current = method;
      setAlertOpen(true);
    } else {
      method();
    }
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
      showMessage(err.message);
    });
  };

  const handleSaveConfirmed = () => {
    const savedMethod = saveConfirm.current;
    saveConfirm.current = undefined;
    showMessage(t.saving);
    startSave();
    setAlertOpen(false);
    finishConfirmed(savedMethod, 8);
  };

  return (
    <UnsavedContext.Provider
      value={{
        state: {
          ...state,
          checkSavedFn,
          handleSaveRefused,
          handleSaveConfirmed,
        },
        setState,
      }}
    >
      {props.children}
      {alertOpen && (
        <Confirm
          title={t.UnsavedData}
          text={t.saveFirst}
          yesResponse={handleSaveConfirmed}
          noResponse={handleSaveRefused}
        />
      )}
    </UnsavedContext.Provider>
  );
});
export { UnsavedContext, UnsavedProvider };
