import {
  createStyles,
  Grid,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import { TranscriberProvider } from '../../context/TranscriberContext';
import Transcriber from '../../components/Transcriber';
import Auth from '../../auth/Auth';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { ISharedStrings } from '../../model';
import { sharedSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import TaskTable, { TaskItemWidth } from '../TaskTable';
import clsx from 'clsx';
import { useState } from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    panel2: {
      display: 'flex',
      flexDirection: 'row',
    },
    topFilter: {
      zIndex: 2,
      position: 'absolute',
      left: 0,
      backgroundColor: 'white',
    },
    topTranscriber: {
      zIndex: 1,
      position: 'absolute',
      left: TaskItemWidth + theme.spacing(0.5),
    },
  })
);
interface IProps {
  auth: Auth;
  width: number;
  artifactTypeId: string | null;
}

export function PassageDetailTranscribe({
  auth,
  width,
  artifactTypeId,
}: IProps) {
  const { mediafileId } = usePassageDetailContext();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const classes = useStyles();
  const [topFilter, setTopFilter] = useState(false);
  const handleTopFilter = (top: boolean) => setTopFilter(top);

  return Boolean(mediafileId) ? (
    <TranscriberProvider auth={auth} artifactTypeId={artifactTypeId}>
      <Grid container direction="column">
        {artifactTypeId && (
          <div className={classes.panel2}>
            <div className={clsx({ [classes.topFilter]: topFilter })}>
              <TaskTable auth={auth} onFilter={handleTopFilter} />
            </div>
            {!topFilter && (
              <div className={classes.topTranscriber}>
                <Transcriber auth={auth} defaultWidth={width - TaskItemWidth} />
              </div>
            )}
          </div>
        )}
        {artifactTypeId == null && (
          <Transcriber auth={auth} defaultWidth={width} />
        )}
      </Grid>
    </TranscriberProvider>
  ) : (
    <Typography variant="h2" align="center">
      {ts.noAudio}
    </Typography>
  );
}

export default PassageDetailTranscribe as any;
