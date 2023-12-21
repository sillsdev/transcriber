import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGlobal } from 'reactn';
import { IconButton } from '@mui/material';
import CompleteIcon from '@mui/icons-material/CheckBoxOutlined';
import NotCompleteIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings } from '../../model';
import { nextPasId } from '../../crud';
import { usePassageNavigate } from './usePassageNavigate';
import { passageDetailStepCompleteSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { rememberCurrentPassage } from '../../utils';
import { useLocation } from 'react-router-dom';

export const PassageDetailStepComplete = () => {
  const {
    currentstep,
    setCurrentStep,
    stepComplete,
    setStepComplete,
    psgCompleted,
    prjId,
    section,
    passage,
  } = usePassageDetailContext();
  const { pathname } = useLocation();
  const [memory] = useGlobal('memory');
  const [view, setView] = useState('');
  const t: IPassageDetailStepCompleteStrings = useSelector(
    passageDetailStepCompleteSelector,
    shallowEqual
  );

  const passageNavigate = usePassageNavigate(() => {
    setView('');
  });

  const complete = useMemo(
    () => stepComplete(currentstep),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentstep, psgCompleted]
  );

  const handleToggleComplete = useCallback(async () => {
    const curStatus = complete;
    await setStepComplete(currentstep, !complete);
    const pasId = nextPasId(section, passage.id, memory);
    if (pasId && pasId !== passage?.keys?.remoteId && !curStatus) {
      rememberCurrentPassage(memory, pasId);
      setView(`/detail/${prjId}/${pasId}`);
    } else setCurrentStep(''); // setting to empty jumps to first uncompleted step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, currentstep, passage.id, section]);

  useEffect(() => {
    if (view) {
      if (pathname !== view) passageNavigate(view);
      else setView('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div>
      {t.title}
      <IconButton
        id="complete"
        sx={{ color: 'primary.light' }}
        title={t.title}
        onClick={handleToggleComplete}
        disabled={view !== ''}
      >
        {complete ? (
          <CompleteIcon id="step-yes" />
        ) : (
          <NotCompleteIcon id="step-no" />
        )}
      </IconButton>
    </div>
  );
};
export default PassageDetailStepComplete;
