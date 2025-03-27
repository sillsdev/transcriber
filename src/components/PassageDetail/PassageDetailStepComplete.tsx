import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { IconButton } from '@mui/material';
import CompleteIcon from '@mui/icons-material/CheckBoxOutlined';
import NotCompleteIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ChecklistIcon from '@mui/icons-material/Checklist';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings, OrganizationD } from '../../model';
import { usePassageNavigate } from './usePassageNavigate';
import { passageDetailStepCompleteSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useStepPermissions } from '../../utils/useStepPermission';
import { useOrbitData } from '../../hoc/useOrbitData';

export const PassageDetailStepComplete = () => {
  const {
    currentstep,
    setCurrentStep,
    stepComplete,
    setStepComplete,
    setStepCompleteTo,
    gotoNextStep,
    psgCompleted,
    section,
    passage,
  } = usePassageDetailContext();
  const { canDoSectionStep } = useStepPermissions();
  const organizations = useOrbitData<OrganizationD[]>('organization');
  const { pathname } = useLocation();
  const [busy] = useGlobal('remoteBusy'); //verified this is not used in a function 2/18/25
  const [importexportBusy] = useGlobal('importexportBusy'); //verified this is not used in a function 2/18/25
  const [view, setView] = useState('');
  const t: IPassageDetailStepCompleteStrings = useSelector(
    passageDetailStepCompleteSelector,
    shallowEqual
  );
  const passageNavigate = usePassageNavigate(() => {
    setView('');
  }, setCurrentStep);

  const hasPermission = useMemo(
    () => canDoSectionStep(currentstep, section),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentstep, section, organizations]
  );

  const complete = useMemo(
    () => stepComplete(currentstep),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentstep, psgCompleted]
  );

  const handleToggleComplete = useCallback(async () => {
    const curStatus = complete;
    await setStepComplete(currentstep, !complete);
    //if we're now complete, go to the next step or passage
    if (!curStatus) gotoNextStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, currentstep, passage, section]);

  const handleSetCompleteTo = async () => {
    setStepCompleteTo(currentstep);
  };
  useEffect(() => {
    if (!busy && !importexportBusy && view) {
      if (pathname !== view) {
        passageNavigate(view);
      } else setView('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, busy, importexportBusy]);

  useEffect(() => {
    if (view) setView('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div>
      {t.title}
      <IconButton
        id="complete"
        sx={{ color: 'primary.light' }}
        title={t.title}
        onClick={handleToggleComplete}
        disabled={!hasPermission || view !== ''}
      >
        {complete ? (
          <CompleteIcon id="step-yes" />
        ) : (
          <NotCompleteIcon id="step-no" />
        )}
      </IconButton>
      <IconButton
        id="setnetxt"
        sx={{ color: 'primary.light' }}
        title={t.setNext}
        onClick={handleSetCompleteTo}
        disabled={!hasPermission || view !== ''}
      >
        <ChecklistIcon id="step-next" />
      </IconButton>
    </div>
  );
};
export default PassageDetailStepComplete;
