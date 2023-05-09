import React, { useState, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import JwtDecode from 'jwt-decode';
import { shallowEqual, useSelector } from 'react-redux';
import { IToken, IEmailUnverifiedStrings } from '../model';
import { Typography, Grid, styled, Box, BoxProps } from '@mui/material';
import { API_CONFIG, isElectron } from '../api-variable';
import Axios from 'axios';
import { TokenContext } from '../context/TokenProvider';
import { doLogout, goOnline } from './Access';
import { ActionRow, PriButton } from '../control';
import { emailUnverifiedSelector } from '../selector';
import { useMounted, useMyNavigate } from '../utils';

const FullScreen = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  width: '100%',
  height: `calc(100vh - 120px)`,
}));

interface IProps {}

export const EmailUnverified = (props: IProps) => {
  const isMounted = useMounted('unverfied');
  const navigate = useMyNavigate();
  const { getAccessTokenSilently, user } = useAuth0();
  const { accessToken, setAuthSession } = useContext(TokenContext).state;
  const [view, setView] = useState('');
  const [message, setMessage] = useState('');
  const t: IEmailUnverifiedStrings = useSelector(
    emailUnverifiedSelector,
    shallowEqual
  );

  const handleResend = (e: any) => {
    var url = API_CONFIG.host + '/api/auth/resend';
    Axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => setMessage('resent'))
      .catch((err) => {
        setMessage('resend err' + err.toString());
      });
  };

  const handleLogout = (e: any) => {
    doLogout();
    setView('Logout');
  };

  const handleVerified = async (e: any) => {
    if (!isElectron) {
      handleLogout(e);
    } else {
      goOnline();
    }
  };
  React.useEffect(() => {
    if (user?.email_verified) {
      (async () => {
        const token = await getAccessTokenSilently();
        if (!isMounted()) return;
        const decodedToken = JwtDecode(token) as IToken;
        setAuthSession(user, token, decodedToken.exp);
        setView('Loading');
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (/Logout/i.test(view)) navigate('/logout');
  if (/Loading/i.test(view)) navigate('/loading');

  return (
    <FullScreen>
      <Typography align="center" variant="h6">
        {t.emailUnverified}
        <br></br>
        {t.verify}
      </Typography>
      <Typography align="center" variant="h6" sx={{ mb: 4 }}>
        {message}
      </Typography>
      <Grid
        container
        direction="column"
        justifyContent="space-around"
        alignItems="center"
        spacing={0}
      >
        <ActionRow>
          <PriButton id="emailResent" onClick={handleResend}>
            {t.resend}
          </PriButton>
          <PriButton id="emailVerified" onClick={handleVerified}>
            {t.verified}
          </PriButton>
          <PriButton id="emailLogout" onClick={handleLogout}>
            {t.logout}
          </PriButton>
        </ActionRow>
      </Grid>
    </FullScreen>
  );
};

export default EmailUnverified;
