import { useState } from 'react';
import { ISharedStrings } from '../../model';
import { Grid, Typography, Box, BoxProps, styled } from '@mui/material';
import { TranscriberProvider } from '../../context/TranscriberContext';
import Transcriber from '../../components/Transcriber';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { sharedSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import TaskTable, { TaskTableWidth } from '../TaskTable';

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
  const { mediafileId } = usePassageDetailContext();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [topFilter, setTopFilter] = useState(false);

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
                <Transcriber defaultWidth={width - TaskTableWidth} />
              </TranscriberContainer>
            )}
          </Box>
        )}
        {artifactTypeId == null && <Transcriber defaultWidth={width} />}
      </Grid>
    </TranscriberProvider>
  ) : (
    <Typography variant="h2" align="center">
      {ts.noAudio}
    </Typography>
  );
}

export default PassageDetailTranscribe;
