import React from 'react';
import {
  Typography,
  TypographyProps,
  Link,
  IconButton,
  styled,
} from '@mui/material';
import { connect } from 'react-redux';
import { IState, IProfileStrings } from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import Confirm from '../components/AlertDialog';
import InfoIcon from '@mui/icons-material/Info';
import ParatextIcon from '../control/ParatextLogo';

interface StyledCaptionProps extends TypographyProps {
  isCaption?: boolean;
  notLinked?: boolean;
}
const StyledCaption = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'notLinked' && prop !== 'isCaption',
})<StyledCaptionProps>(({ isCaption, notLinked, theme }) => ({
  ...(isCaption && {
    display: 'table',
    width: 200,
    textAlign: 'left',
  }),
  ...(notLinked && {
    fontWeight: 'bold',
    paddingTop: theme.spacing(2),
  }),
}));

interface IStateProps {
  t: IProfileStrings;
  status?: IAxiosStatus;
}

interface IProps extends IStateProps {
  hasParatext: Boolean;
  ptPath: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  isOffline: Boolean;
}

export const ParatextLinked = (props: IProps) => {
  const { status, t, hasParatext, ptPath, setView, isOffline } = props;
  const [howToLink, setHowToLink] = React.useState(false);

  const handleHowTo = () => {
    setHowToLink(true);
  };

  const handleLogout = () => {
    setView('Logout');
  };

  const handleNoLinkSetup = () => {
    setHowToLink(false);
  };

  return (
    <>
      {status?.errStatus ? (
        <StyledCaption isCaption notLinked>
          {t.notLinked}
        </StyledCaption>
      ) : (
        <></>
      )}
      <StyledCaption isCaption={Boolean(!status?.errStatus)}>
        <ParatextIcon />
        {'\u00A0'}
        {status?.errStatus || 0 || (isOffline && !ptPath) ? (
          <>
            <Link onClick={handleHowTo}>{t.paratextNotLinked}</Link>
            <IconButton id="howToLink" color="primary" onClick={handleHowTo}>
              <InfoIcon />
            </IconButton>
          </>
        ) : (hasParatext && status?.complete) || ptPath ? (
          t.paratextLinked
        ) : (
          status?.statusMsg || t.checkingParatext
        )}
      </StyledCaption>
      {howToLink && (
        <Confirm
          title={t.paratextLinking}
          text={isOffline ? t.installParatext : t.linkingExplained}
          yes={isOffline ? '' : t.logout}
          no={isOffline ? t.close : t.cancel}
          yesResponse={handleLogout}
          noResponse={handleNoLinkSetup}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'profile' }),
  status: state.paratext.usernameStatus,
});

export default connect(mapStateToProps)(ParatextLinked) as any;
