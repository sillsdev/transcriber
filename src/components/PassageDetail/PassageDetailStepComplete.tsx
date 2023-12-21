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
import { rememberCurrentPassage, waitForIt } from '../../utils';
import { useLocation } from 'react-router-dom';
import JSONAPISource from '@orbit/jsonapi';
import { State } from 'reactn/default';

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
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [busy] = useGlobal('remoteBusy');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [refresh, setRefresh] = useState(0);
  const [global] = useGlobal<State>();
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
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
  }, [complete, currentstep, passage, section]);

  useEffect(() => {
    if (view) {
      if (pathname !== view) {
        waitForIt(
          'step complete navigate',
          () =>
            (!remote || remote.requestQueue.length === 0) &&
            !global.remoteBusy &&
            !global.importexportBusy,
          () => offline && !offlineOnly,
          20
        ).then(() => {
          if (busy || importexportBusy) {
            setRefresh(refresh + 1);
          } else passageNavigate(view);
        });
      } else setView('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, refresh]);

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
