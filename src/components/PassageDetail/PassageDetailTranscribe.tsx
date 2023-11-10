import { useContext, useMemo, useState } from 'react';
import { ActivityStates, ISharedStrings, MediaFile } from '../../model';
import { Grid, Typography, Box, BoxProps, styled } from '@mui/material';
import { TranscriberProvider } from '../../context/TranscriberContext';
import Transcriber from '../../components/Transcriber';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { sharedSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import TaskTable, { TaskTableWidth } from '../TaskTable';
import { ToolSlug } from '../../crud';
import { waitForIt } from '../../utils';
import { useGlobal } from 'reactn';
import { PassageDetailContext } from '../../context/PassageDetailContext';

interface TableContainerProps extends BoxProps {
  topFilter?: boolean;
}
const TableContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'topFilter',
})<TableContainerProps>(({ topFilter }) => ({
  ...(topFilter && {
    zIndex: 2,
    // position: 'absolute',
    // left: 0,
    backgroundColor: 'white',
  }),
}));

const TranscriberContainer = styled(Box)<BoxProps>(({ theme }) => ({
  zIndex: 1,
  position: 'absolute',
  left: `${TaskTableWidth + 4}px`,
}));

interface IProps {
  width: number;
  artifactTypeId: string | null;
  onFilter?: (filtered: boolean) => void;
}

export function PassageDetailTranscribe({
  width,
  artifactTypeId,
  onFilter,
}: IProps) {
  const {
    mediafileId,
    currentstep,
    orgWorkflowSteps,
    setStepComplete,
    setCurrentStep,
  } = usePassageDetailContext();
  const { setState } = useContext(PassageDetailContext);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [topFilter, setTopFilter] = useState(false);
  const [globals] = useGlobal();

  const parsedSteps = useMemo(() => {
    if (!orgWorkflowSteps) return [];
    return orgWorkflowSteps
      .sort(
        (a, b) =>
          (a.attributes.sequencenum ?? 0) - (b.attributes.sequencenum ?? 0)
      )
      .map((s, ix) => ({
        id: s.id,
        sequencenum: ix,
        tool: JSON.parse(s?.attributes?.tool ?? '{}').tool,
        settings:
          (JSON.parse(s?.attributes?.tool ?? '{}').settings ?? '') === ''
            ? '{}'
            : JSON.parse(s?.attributes?.tool ?? '{}').settings,
      }));
  }, [orgWorkflowSteps]);

  const stepSettings = useMemo(() => {
    if (!currentstep || !parsedSteps) return null;
    const step = parsedSteps.find((s) => s.id === currentstep);
    return step ? step.settings : null;
  }, [currentstep, parsedSteps]);

  const vernacularSteps = useMemo(() => {
    return parsedSteps.filter(
      (s) =>
        s.tool === ToolSlug.Transcribe && !JSON.parse(s.settings).artifactTypeId
    );
  }, [parsedSteps]);

  const hasChecking = useMemo(() => {
    return (
      vernacularSteps.length > 1 &&
      vernacularSteps[1].sequencenum === vernacularSteps[0].sequencenum + 1
    );
  }, [vernacularSteps]);

  const nextStep = useMemo(() => {
    if (!currentstep || !parsedSteps) return null;
    let found = false;
    for (let s of parsedSteps) {
      if (s.id === currentstep) {
        found = true;
        continue;
      }
      if (!found) continue;
      return s.id;
    }
    return null;
  }, [currentstep, parsedSteps]);

  const prevStep = useMemo(() => {
    if (!currentstep || !parsedSteps) return null;
    let found = '';
    for (let s of parsedSteps) {
      if (s.id === currentstep) {
        break;
      } else {
        found = s.id;
      }
    }
    return found;
  }, [currentstep, parsedSteps]);

  const curRole = useMemo(() => {
    if (!currentstep) return undefined;

    if (!hasChecking) return 'transcriber';
    if (JSON.parse(stepSettings).artifactTypeId) return 'transcriber';
    if (vernacularSteps[0].id === currentstep) return 'transcriber';
    return 'editor';
  }, [currentstep, vernacularSteps, stepSettings, hasChecking]);

  const handleComplete = (complete: boolean) => {
    waitForIt(
      'change cleared afert save',
      () => !globals.changed,
      () => false,
      200
    ).then(() => {
      setStepComplete(currentstep, complete);
      if (complete) setCurrentStep(nextStep || '');
    });
  };

  const uncompletedSteps = () => {
    setStepComplete(currentstep, false);
    if (hasChecking && nextStep) setStepComplete(nextStep, false);
    if (curRole === 'editor' && prevStep) setCurrentStep(prevStep || '');
  };

  const handleReopen = () => {
    uncompletedSteps();
  };

  const handleReject = (reason: string) => {
    uncompletedSteps();
    if (reason === ActivityStates.NeedsNewRecording) {
      const recordStep = parsedSteps.find((s) => s.tool === ToolSlug.Record);
      if (recordStep) {
        setStepComplete(recordStep.id, false);
        setCurrentStep(recordStep.id);
        return;
      }
    }
    setCurrentStep(curRole === 'editor' ? prevStep || '' : '');
  };

  const handleReloadPlayer = (playerMediafile: MediaFile) => {
    setState((s) => ({ ...s, playerMediafile }));
  };

  const handleTopFilter = (top: boolean) => {
    setTopFilter(top);
    onFilter && onFilter(top);
  };

  return Boolean(mediafileId) ? (
    <TranscriberProvider artifactTypeId={artifactTypeId} curRole={curRole}>
      <Grid container direction="column">
        {artifactTypeId && (
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <TableContainer topFilter={topFilter}>
              <TaskTable onFilter={handleTopFilter} isDetail={true} />
            </TableContainer>
            {!topFilter && (
              <TranscriberContainer>
                <Transcriber
                  defaultWidth={width - TaskTableWidth}
                  stepSettings={stepSettings}
                  onReject={handleReject}
                  onReopen={handleReopen}
                  onReloadPlayer={handleReloadPlayer}
                />
              </TranscriberContainer>
            )}
          </Box>
        )}
        {artifactTypeId == null && (
          <Transcriber
            defaultWidth={width}
            hasChecking={hasChecking}
            setComplete={handleComplete}
            onReject={handleReject}
            onReopen={handleReopen}
            onReloadPlayer={handleReloadPlayer}
          />
        )}
      </Grid>
    </TranscriberProvider>
  ) : (
    <Typography variant="h2" align="center">
      {ts.noAudio}
    </Typography>
  );
}

export default PassageDetailTranscribe;
