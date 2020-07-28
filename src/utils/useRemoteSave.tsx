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
    console.log('saveResult', saveResult);
  }, [saveResult]);

  const startSave = () => {
    setDoSave(true);
    setSaveResult(undefined);
  };
  const saveCompleted = (err: string) => {
    setSaveResult(err);
    if (err === '') setChanged(false);
    setDoSave(false);
  };
  const saveError = () => saveErr.current || '';

  const SaveIncomplete = () => saveErr.current === undefined;
  const SaveUnsuccessful = () =>
    saveErr.current !== undefined && saveErr.current !== '';

  const waitForSave = async (
    savedMethod: undefined | (() => any),
    waitCount: number
  ): Promise<any> => {
    try {
      return waitForIt(
        'Save',
        SaveIncomplete,
        savedMethod,
        SaveUnsuccessful,
        waitCount
      );
    } catch (err) {
      throw new Error(SaveUnsuccessful() ? saveError() : 'Timed Out');
    }
  };
  return [startSave, saveCompleted, waitForSave];
};
