import { Grid } from '@material-ui/core';
import { TranscriberProvider } from '../../context/TranscriberContext';
import Transcriber from '../../components/Transcriber';
import Auth from '../../auth/Auth';
import usePassageDetailContext from '../../context/usePassageDetailContext';

interface IProps {
  auth: Auth;
  width: number;
}

export function PassageDetailTranscribe({ auth, width }: IProps) {
  const { mediafileId } = usePassageDetailContext();
  return Boolean(mediafileId) ? (
    <TranscriberProvider auth={auth}>
      <Grid container direction="column">
        <Transcriber auth={auth} defaultWidth={width} />
      </Grid>
    </TranscriberProvider>
  ) : (
    <></>
  );
}

export default PassageDetailTranscribe as any;
