import { useRef, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { waitForIt } from './waitForIt';

export const useRemoteSave = (): [
  () => void,
  (err: string) => void,
  (cb: undefined | (() => any), cnt: number) => Promise<any>
] => {
  const saveErr = useRef<string>();
  const [saveResult, setSaveResult] = useGlobal('saveResult');
  const [, setChanged] = useGlobal('changed');
  const [, setDoSave] = useGlobal('doSave');

  useEffect(() => {
    saveErr.current = saveResult;
  }, [saveResult]);

  const startSave = () => {
    setSaveResult(undefined);
    setDoSave(true);
  };

  const saveCompleted = (err: string) => {
    if (err === '') {
      setChanged(false);
    }
    setSaveResult(err);
    setDoSave(false);
  };
  const saveError = () => saveErr.current || '';

  const SaveIncomplete = () => saveErr.current === undefined;
  const SaveUnsuccessful = () =>
    saveErr.current !== undefined && saveErr.current !== '';

  const waitForSave = async (
    resolvedMethod: undefined | (() => any),
    waitCount: number
  ): Promise<any> => {
    return waitForIt('Save', SaveIncomplete, SaveUnsuccessful, waitCount)
      .then(() => {
        if (resolvedMethod) return resolvedMethod();
      })
      .catch((err) => {
        throw new Error(SaveUnsuccessful() ? saveError() : 'Timed Out');
      });
  };
  return [startSave, saveCompleted, waitForSave];
};
