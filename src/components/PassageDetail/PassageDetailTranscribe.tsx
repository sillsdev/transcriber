import { useMemo, useState } from 'react';
import { ActivityStates, ISharedStrings } from '../../model';
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
      .map((s) => ({
        id: s.id,
        tool: JSON.parse(s?.attributes?.tool ?? '{}').tool,
        settings: JSON.parse(s?.attributes?.tool ?? '{}').settings,
      }));
  }, [orgWorkflowSteps]);

  const hasChecking = useMemo(() => {
    if (!currentstep || !parsedSteps) return false;
    let found = false;
    let count = 0;
    for (let s of parsedSteps) {
      if (s.id === currentstep) found = true;
      if (!found) continue;
      if (s.tool === ToolSlug.Transcribe) {
        if (!s.settings?.artifactTypeId) {
          count++;
        }
      } else if (s.tool === ToolSlug.Paratext) {
        break;
      }
    }
    return count > 1;
  }, [currentstep, parsedSteps]);

  const stepSettings = useMemo(() => {
    if (!currentstep || !parsedSteps) return null;
    const step = parsedSteps.find((s) => s.id === currentstep);
    return step ? step.settings : null;
  }, [currentstep, parsedSteps]);

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
    if (!currentstep || !parsedSteps) return undefined;
    let found = false;
    let count = 0;
    let previousTypeId: string | null | undefined = undefined;
    for (let s of parsedSteps) {
      if (s.id === currentstep) found = true;
      if (!found) {
        previousTypeId =
          s.tool !== ToolSlug.Transcribe
            ? undefined
            : s.settings?.artifactTypeId ?? null;
        continue;
      }
      if (s.tool === ToolSlug.Transcribe) {
        if (!s.settings?.artifactTypeId) {
          count++;
        }
      } else {
        break;
      }
    }
    if (count === 1 && previousTypeId === null) return 'editor';
    if (count > 0) return 'transcriber';
    return undefined;
  }, [currentstep, parsedSteps]);

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
    if (curRole === 'editor' && prevStep) setStepComplete(prevStep, false);
  };

  const handleReopen = () => {
    uncompletedSteps();
    setCurrentStep(curRole === 'editor' ? prevStep || '' : '');
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
