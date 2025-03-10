import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { IMainStrings } from '../model';
import { waitForIt } from '../utils/waitForIt';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from '../components/AlertDialog';
import { useSelector } from 'react-redux';
import { mainSelector } from '../selector';

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
  startClear: (tooldId?: string) => {},
  saveCompleted: (toolId: string, saveErr?: string) => {},
  clearCompleted: (toolId: string) => {},
  waitForSave: async (
    resolvedMethod: (() => any) | undefined,
    waitCount: number
  ) => {},
  anySaving: (butMyTooId?: string) => false,
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

interface SaveInfo {
  startSave: boolean;
  clearChanged: boolean;
  saveError: string;
}
interface IIndexableSaveInfo<SaveInfo> {
  [key: string]: SaveInfo;
}
const UnsavedProvider = (props: PropsWithChildren) => {
  const t: IMainStrings = useSelector(mainSelector);
  const [, setBusy] = useGlobal('remoteBusy');
  const [alertOpen, setAlertOpen] = useGlobal('alertOpen'); //global because planSheet checks it //verified this is not used in a function 2/18/25
  const saveConfirm = React.useRef<() => any>();
  const { showMessage } = useSnackBar();
  const [state, setState] = useState({
    ...initState,
    t,
  });
  const saveErr = useRef<string>();
  const [saveResult, setSaveResult] = useGlobal('saveResult'); //verified this is not used in a function 2/18/25
  const [, setChangedx] = useGlobal('changed');
  const changedRef = useRef(false);
  const [toolsChanged, setToolsChanged] = useState<
    IIndexableSaveInfo<SaveInfo>
  >({});
  const [, setComplete] = useGlobal('progress');
  const toolsChangedRef = useRef<IIndexableSaveInfo<SaveInfo>>({});
  const getGlobal = useGetGlobal();
  const setChanged = (c: boolean) => {
    setChangedx(c);
    changedRef.current = c;
  };
  useEffect(() => {
    saveErr.current = saveResult;
  }, [saveResult]);

  const startSave = (id?: string) => {
    var setit = false;
    if (id) {
      if (!toolsChangedRef.current[id]?.startSave) {
        toolsChangedRef.current[id] = {
          startSave: true,
          clearChanged: false,
          saveError: '',
        };
        setit = true;
      }
    } else {
      //start them all
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
    }
    if (setit) {
      setBusy(Object.keys(toolsChangedRef.current).length > 0);
      setToolsChanged({ ...toolsChangedRef.current });
      saveErr.current = '';
      setSaveResult('');
    }
  };
  const startClear = (id?: string) => {
    var setit = false;
    if (id) {
      if (
        toolsChangedRef.current[id] &&
        !toolsChangedRef.current[id].clearChanged
      ) {
        toolsChangedRef.current[id] = {
          startSave: false,
          clearChanged: true,
          saveError: '',
        };
        setit = true;
      }
    } else {
      //start them all
      Object.keys(toolsChangedRef.current).forEach((id) => {
        if (!toolsChangedRef.current[id].clearChanged) {
          setit = true;
          toolsChangedRef.current[id] = {
            startSave: false,
            clearChanged: true,
            saveError: '',
          };
        }
      });
    }
    if (setit) {
      setBusy(Object.keys(toolsChangedRef.current).length > 0);
      setToolsChanged({ ...toolsChangedRef.current });
      saveErr.current = '';
      setSaveResult('');
    }
  };

  const allSaveCompleted = () => {
    if (!saveErr.current && changedRef.current) {
      setChanged(false);
    } /* else //there was an error {
      Object.keys(toolsChanged).forEach((id) =>
        console.log(id, toolsChanged[id])
      );
    } */
    setComplete(0);
    setSaveResult(saveErr.current);
    saveErr.current = '';
  };

  const saveError = () => saveErr.current || '';

  const SaveComplete = () =>
    Object.keys(toolsChangedRef.current).length === 0 || completeWithErrors();
  const SaveUnsuccessful = () => (saveResult || '') !== '';

  const saveCompleted = (toolId: string, saveErr?: string) => {
    toolChanged(toolId, false, saveErr);
    if (SaveComplete()) setBusy(false);
  };
  const clearCompleted = (toolId: string) => {
    saveCompleted(toolId);
  };
  // check for any saving except myToolId (if provided)
  const anySaving = (myToolId?: string) => {
    const reducer = (prev: string, id: string) => {
      return (
        prev ||
        (id !== myToolId && toolsChangedRef.current[id].startSave ? 'yes' : '')
      );
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
    return toolsChangedRef.current[toolId]?.startSave;
  };
  const clearRequested = (toolId: string) => {
    return toolsChangedRef.current[toolId]?.clearChanged;
  };
  const isChanged = (toolId: string) => {
    return (
      toolsChangedRef.current[toolId] !== undefined &&
      !toolsChangedRef.current[toolId].clearChanged
    );
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
      if (changedRef.current !== anyChanged) {
        setChanged(anyChanged);
      }
      if (!anyChanged || completeWithErrors()) {
        allSaveCompleted();
      }
    }
  };

  const waitForSave = async (
    resolvedMethod: undefined | (() => any),
    waitCount: number
  ): Promise<any> => {
    return waitForIt('Save', SaveComplete, () => false, waitCount)
      .then(() => {
        if (SaveUnsuccessful()) throw new Error(saveError());
        if (resolvedMethod) return resolvedMethod();
      })
      .catch((err) => {
        throw new Error(SaveUnsuccessful() ? saveError() : 'Timed Out');
      });
  };

  const checkSavedFn = (method: () => any) => {
    var timeout =
      getGlobal('remoteBusy') || getGlobal('importexportBusy') || anySaving()
        ? 200
        : 0;
    setTimeout(() => {
      waitForIt(
        'checkSavedFn',
        () =>
          !getGlobal('remoteBusy') &&
          !getGlobal('importexportBusy') &&
          !anySaving(),
        () => false,
        1000
      )
        .then(() => {
          if (changedRef.current) {
            saveConfirm.current = method;
            setAlertOpen(true);
          } else {
            method();
          }
        })
        .catch((err) => {
          showMessage(t.loadingTable);
        });
    }, timeout);
  };

  const handleSaveRefused = () => {
    const savedMethod = saveConfirm.current;
    saveConfirm.current = undefined;
    setAlertOpen(false);
    startClear();
    finishConfirmed(savedMethod, 18);
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
          startClear,
          saveCompleted,
          clearCompleted,
          waitForSave,
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
};
export { UnsavedContext, UnsavedProvider };
