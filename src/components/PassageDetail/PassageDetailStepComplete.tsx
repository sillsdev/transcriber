import { useEffect, useState } from 'react';
import { useGlobal } from '../../mods/reactn';
import { IconButton } from '@mui/material';
import CompleteIcon from '@mui/icons-material/CheckBoxOutlined';
import NotCompleteIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings } from '../../model';
import { getPasIdByNum } from '../../crud';
import { usePassageNavigate } from './usePassageNavigate';
import { passageDetailStepCompleteSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { rememberCurrentPassage } from '../../utils';

export const PassageDetailStepComplete = () => {
  const {
    currentstep,
    setCurrentStep,
    stepComplete,
    setStepComplete,
    orgWorkflowSteps,
    psgCompleted,
    prjId,
    section,
    passage,
  } = usePassageDetailContext();
  const [memory] = useGlobal('memory');
  const [, setCurrentIndex] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [view, setView] = useState('');
  const t: IPassageDetailStepCompleteStrings = useSelector(
    passageDetailStepCompleteSelector,
    shallowEqual
  );

  const passageNavigate = usePassageNavigate(() => {
    setView('');
  });

  useEffect(() => {
    var curIndex = orgWorkflowSteps.findIndex((s) => s.id === currentstep);
    setCurrentIndex(curIndex);
    setComplete(stepComplete(currentstep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, orgWorkflowSteps, psgCompleted]);

  const handleToggleComplete = () => {
    const curStatus = complete;
    setStepComplete(currentstep, !complete);
    const seq = passage?.attributes?.sequencenum;
    const pasId = getPasIdByNum(section, seq + 1, memory);
    if (pasId && !curStatus) {
      rememberCurrentPassage(memory, pasId);
      setView(`/detail/${prjId}/${pasId}`);
    } else setCurrentStep(''); // setting to empty jumps to first uncompleted step
  };

  useEffect(() => {
    passageNavigate(view);
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
