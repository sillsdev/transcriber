import { useRef, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { waitForIt } from './waitForIt';

export const useRemoteSave = (): [
  (cb: undefined | (() => any)) => void,
  (err: string) => void,
  (cnt: number) => Promise<any>
] => {
  const saveErr = useRef<string>();
  const doAfter = useRef<() => any>();
  const [saveResult, setSaveResult] = useGlobal('saveResult');
  const [, setChanged] = useGlobal('changed');
  const [, setDoSave] = useGlobal('doSave');

  useEffect(() => {
    saveErr.current = saveResult;
    console.log('saveResult', saveResult);
  }, [saveResult]);

  const startSave = (resolvedMethod: undefined | (() => any)) => {
    doAfter.current = resolvedMethod;
    setSaveResult(undefined);
    setDoSave(true);
  };

  const saveCompleted = (err: string) => {
    setSaveResult(err);
    setDoSave(false);
    if (err === '') {
      setChanged(false);
      if (doAfter.current) return doAfter.current();
    }
  };
  const saveError = () => saveErr.current || '';

  const SaveIncomplete = () => saveErr.current === undefined;
  const SaveUnsuccessful = () =>
    saveErr.current !== undefined && saveErr.current !== '';

  const waitForSave = async (waitCount: number): Promise<any> => {
    return waitForIt('Save', SaveIncomplete, SaveUnsuccessful, waitCount).catch(
      (err) => {
        throw new Error(SaveUnsuccessful() ? saveError() : 'Timed Out');
      }
    );
  };
  return [startSave, saveCompleted, waitForSave];
};
