import React from 'react';
import {
  Typography,
  TypographyProps,
  Link,
  IconButton,
  styled,
} from '@mui/material';
import { IState, IProfileStrings } from '../model';
import Confirm from '../components/AlertDialog';
import InfoIcon from '@mui/icons-material/Info';
import ParatextIcon from '../control/ParatextLogo';
import { useSelector } from 'react-redux';
import { profileSelector } from '../selector';

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

interface IProps {
  hasParatext: Boolean;
  ptPath: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  isOffline: Boolean;
}

export const ParatextLinked = (props: IProps) => {
  const { hasParatext, ptPath, setView, isOffline } = props;
  const t: IProfileStrings = useSelector(profileSelector);
  const status = useSelector((state: IState) => state.paratext.usernameStatus);
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

export default ParatextLinked;
