import { Grid, Typography } from '@material-ui/core';
import { TranscriberProvider } from '../../context/TranscriberContext';
import Transcriber from '../../components/Transcriber';
import Auth from '../../auth/Auth';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { ISharedStrings } from '../../model';
import { sharedSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  auth: Auth;
  width: number;
}

export function PassageDetailTranscribe({ auth, width }: IProps) {
  const { mediafileId } = usePassageDetailContext();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  return Boolean(mediafileId) ? (
    <TranscriberProvider auth={auth}>
      <Grid container direction="column">
        <Transcriber auth={auth} defaultWidth={width} />
      </Grid>
    </TranscriberProvider>
  ) : (
    <Typography variant="h2" align="center">
      {ts.noAudio}
    </Typography>
  );
}

export default PassageDetailTranscribe as any;
