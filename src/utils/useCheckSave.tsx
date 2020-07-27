import { useRef, useEffect } from 'react';
import { useGlobal } from 'reactn';

export const useCheckSave = (): [
  () => void,
  (err: string) => void,
  () => boolean,
  () => boolean,
  () => string
] => {
  const saveErr = useRef<string>();
  const [saveResult, setSaveResult] = useGlobal('saveResult');
  const [, setChanged] = useGlobal('changed');
  const [, setDoSave] = useGlobal('doSave');

  useEffect(() => {
    saveErr.current = saveResult;
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

  return [
    startSave,
    saveCompleted,
    SaveIncomplete,
    SaveUnsuccessful,
    saveError,
  ];
};
