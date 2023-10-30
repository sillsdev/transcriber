import { useMemo, useState } from 'react';
import { ISharedStrings } from '../../model';
import { Grid, Typography, Box, BoxProps, styled } from '@mui/material';
import { TranscriberProvider } from '../../context/TranscriberContext';
import Transcriber from '../../components/Transcriber';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { sharedSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import TaskTable, { TaskTableWidth } from '../TaskTable';
import { ToolSlug } from '../../crud';

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

  const hasChecking = useMemo(() => {
    if (!orgWorkflowSteps) return false;
    let found = false;
    let count = 0;
    for (let s of orgWorkflowSteps.sort(
      (a, b) =>
        (a.attributes.sequencenum ?? 0) - (b.attributes.sequencenum ?? 0)
    )) {
      if (s.id === currentstep) found = true;
      if (!found) continue;
      const json = JSON.parse(s?.attributes?.tool ?? '{}');
      if (json.tool === ToolSlug.Transcribe) {
        const settings = JSON.parse(json?.settings || '{}');
        if (!settings?.artifactTypeId) {
          count++;
        }
      } else if (json.tool === ToolSlug.Paratext) {
        break;
      }
    }
    return count > 1;
  }, [currentstep, orgWorkflowSteps]);

  const stepSettings = useMemo(() => {
    if (!currentstep || !orgWorkflowSteps) return null;
    const step = orgWorkflowSteps.find((s) => s.id === currentstep);
    return step ? JSON.parse(step?.attributes?.tool ?? '{}')?.settings : null;
  }, [currentstep, orgWorkflowSteps]);

  const handleComplete = (complete: boolean) => {
    setTimeout(() => {
      setStepComplete(currentstep, complete);
      if (complete) setTimeout(() => setCurrentStep(''), 500);
    }, 500);
  };

  const handleTopFilter = (top: boolean) => {
    setTopFilter(top);
    onFilter && onFilter(top);
  };

  return Boolean(mediafileId) ? (
    <TranscriberProvider artifactTypeId={artifactTypeId}>
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
