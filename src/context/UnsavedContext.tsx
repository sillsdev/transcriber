import React, { useEffect, useRef, useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { IState, IMainStrings } from '../model';
import localStrings from '../selector/localize';
import { waitForIt } from '../utils';
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
  toolChanged: (toolId: string, changed?: boolean, toolErr?: string) => {},
  startSave: (toolId?: string) => {},
  saveCompleted: (toolId: string, saveErr?: string) => {},
  waitForSave: async (
    resolvedMethod: (() => any) | undefined,
    waitCount: number
  ) => {},
  clearChanged: (toolId?: string) => {},
  anySaving: () => false,
  saveRequested: (toolId: string) => false,
  clearRequested: (toolId: string) => false,
  isChanged: (toolId: string) => false,
  toolsChanged: {} as IIndexableSaveInfo<SaveInfo>,
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
interface SaveInfo {
  startSave: boolean;
  clearChanged: boolean;
  saveError: string;
}
interface IIndexableSaveInfo<SaveInfo> {
  [key: string]: SaveInfo;
}
const UnsavedProvider = connect(
  mapStateToProps,
  mapDispatchToProps
)((props: IProps) => {
  const { t } = props;
  // const [memory] = useGlobal('memory');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [busy] = useGlobal('remoteBusy');
  const [alertOpen, setAlertOpen] = useGlobal('alertOpen'); //global because planSheet checks it
  const saveConfirm = React.useRef<() => any>();
  const { showMessage } = useSnackBar();
  const [state, setState] = useState({
    ...initState,
    t,
  });
  const saveErr = useRef<string>();
  const [saveResult, setSaveResult] = useGlobal('saveResult');
  const [changed, setChanged] = useGlobal('changed');
  const [toolsChanged, setToolsChanged] = useState<
    IIndexableSaveInfo<SaveInfo>
  >({});
  const [, setComplete] = useGlobal('progress');
  const toolsChangedRef = useRef<IIndexableSaveInfo<SaveInfo>>({});

  useEffect(() => {
    saveErr.current = saveResult;
  }, [saveResult]);

  const startSave = (id?: string) => {
    if (id) {
      if (!toolsChangedRef.current[id]?.startSave) {
        toolsChangedRef.current[id] = {
          startSave: true,
          clearChanged: false,
          saveError: '',
        };
        setToolsChanged({ ...toolsChangedRef.current });
      }
    } else {
      //start them all
      var setit = false;
      Object.keys(toolsChangedRef.current).forEach((id) => {
        if (!toolsChangedRef.current[id].startSave) {
          setit = true;
          toolsChangedRef.current[id] = {
            startSave: true,
            clearChanged: false,
            saveError: '',
          };
        }
      });
      if (setit) {
        setToolsChanged({ ...toolsChangedRef.current });
        saveErr.current = '';
        setSaveResult('');
      }
    }
  };

  const clearChanged = (id?: string) => {
    //this is used in discussions where we're not actually switching
    //screens (possibly changing filter) and the comment might show up
    //again in it's original state
    var setit = false;
    if (id) {
      if (
        toolsChangedRef.current[id] &&
        toolsChangedRef.current[id].clearChanged
      )
        toolsChangedRef.current = {
          ...toolsChangedRef.current,
          [id]: { startSave: false, clearChanged: true, saveError: '' },
        };
      setit = true;
    } else {
      if (Object.keys(toolsChangedRef.current).length > 0) {
        toolsChangedRef.current = {};
        setChanged(false);
        setit = true;
      }
    }
    if (setit) {
      setToolsChanged({ ...toolsChangedRef.current });
    }
  };

  const allSaveCompleted = () => {
    if (!saveErr.current && changed) {
      setChanged(false);
    } /* else //there was an error {
      Object.keys(toolsChanged).forEach((id) =>
        console.log(id, toolsChanged[id])
      );
    } */
    setComplete(0);
    if (saveResult !== saveErr.current) setSaveResult(saveErr.current);
    saveErr.current = '';
  };
  const saveError = () => saveErr.current || '';

  const SaveComplete = () => Object.keys(toolsChangedRef.current).length === 0;
  const SaveUnsuccessful = () => (saveResult || '') !== '';

  const saveCompleted = (toolId: string, saveErr?: string) => {
    toolChanged(toolId, false, saveErr);
  };
  const anySaving = () => {
    const reducer = (prev: string, id: string) => {
      return prev || (toolsChangedRef.current[id].startSave ? 'yes' : '');
    };
    var saving = Object.keys(toolsChangedRef.current).reduce(reducer, '');
    return Boolean(saving);
  };
  const completeWithErrors = () => {
    var allErrors = true;
    Object.keys(toolsChangedRef.current).forEach((id) => {
      if (!toolsChangedRef.current[id].saveError) allErrors = false;
    });
    return allErrors;
  };
  const saveRequested = (toolId: string) => {
    return toolsChanged[toolId]?.startSave;
  };
  const clearRequested = (toolId: string) => {
    return toolsChanged[toolId]?.clearChanged;
  };
  const isChanged = (toolId: string) => {
    return toolsChanged[toolId] !== undefined;
  };
  const toolChanged = (
    toolId: string,
    toolchanged: boolean = true,
    toolErr: string = ''
  ) => {
    var setit = false;
    if (toolchanged) {
      if (toolsChangedRef.current[toolId] === undefined) {
        toolsChangedRef.current[toolId] = {
          startSave: false,
          clearChanged: false,
          saveError: '',
        };
        setit = true;
      }
    } else {
      if (toolErr) {
        saveErr.current = `${toolErr};${saveErr.current}`;
        toolsChangedRef.current[toolId] = {
          startSave: false,
          clearChanged: false,
          saveError: saveErr.current,
        };
        setit = true;
      } else if (toolsChangedRef.current[toolId]) {
        delete toolsChangedRef.current[toolId];
        setit = true;
      }
    }
    if (setit) {
      setToolsChanged({ ...toolsChangedRef.current });
      var anyChanged = Object.keys(toolsChangedRef.current).length > 0;
      if (changed !== anyChanged) {
        setChanged(anyChanged);
      }
      if (
        Object.keys(toolsChangedRef.current).length === 0 ||
        completeWithErrors()
      ) {
        allSaveCompleted();
      }
    }
  };

  const waitForSave = async (
    resolvedMethod: undefined | (() => any),
    waitCount: number
  ): Promise<any> => {
    return waitForIt('Save', SaveComplete, SaveUnsuccessful, waitCount)
      .then(() => {
        if (resolvedMethod) return resolvedMethod();
      })
      .catch((err) => {
        throw new Error(SaveUnsuccessful() ? saveError() : 'Timed Out');
      });
  };

  const checkSavedFn = (method: () => any) => {
    if (busy || importexportBusy) {
      showMessage(t.loadingTable);
      return;
    }
    if (changed) {
      if (anySaving()) {
        showMessage(t.saving);
        return;
      }
      saveConfirm.current = method;
      setAlertOpen(true);
    } else {
      method();
    }
  };

  const handleSaveRefused = () => {
    const savedMethod = saveConfirm.current;
    saveConfirm.current = undefined;
    setAlertOpen(false);
    clearChanged();
    if (savedMethod) savedMethod();
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
    finishConfirmed(savedMethod, 18);
  };

  return (
    <UnsavedContext.Provider
      value={{
        state: {
          ...state,
          checkSavedFn,
          handleSaveRefused,
          handleSaveConfirmed,
          startSave,
          saveCompleted,
          waitForSave,
          clearChanged,
          anySaving,
          toolChanged,
          saveRequested,
          clearRequested,
          isChanged,
          toolsChanged,
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
