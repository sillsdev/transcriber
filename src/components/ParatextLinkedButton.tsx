import React from 'react';
import {
  Typography,
  TypographyProps,
  Link,
  IconButton,
  Button,
  styled,
} from '@mui/material';
import { IState, IProfileStrings } from '../model';
import Confirm from './AlertDialog';
import InfoIcon from '@mui/icons-material/Info';
import ParatextIcon from '../control/ParatextLogo';
import { useSelector } from 'react-redux';
import { profileSelector } from '../selector';
import { useHasParatext } from '../utils';
import { useGlobal } from '../context/GlobalContext';
import { addPt } from '../utils/addPt';

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
  setView: React.Dispatch<React.SetStateAction<string>>;
}

export const ParatextLinkedButton = (props: IProps) => {
  const { setView } = props;
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const { hasParatext, ptPath } = useHasParatext();
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
          {addPt(t.notLinked)}
        </StyledCaption>
      ) : (
        <></>
      )}
      <StyledCaption isCaption={Boolean(!status?.errStatus)}>
        {/* <ParatextIcon /> */}
        {'\u00A0'}
        {status?.errStatus || 0 || (isOffline && !ptPath) ? (
          <>
            <Button onClick={handleHowTo}>{addPt(t.paratextNotLinked)}</Button>
          </>
        ) : (hasParatext && status?.complete) || ptPath ? (
          addPt(t.paratextLinked)
        ) : (
          status?.statusMsg || addPt(t.checkingParatext)
        )}
      </StyledCaption>
      {howToLink && (
        <Confirm
          title={addPt(t.paratextLinking)}
          text={
            isOffline ? addPt(t.installParatext) : addPt(t.linkingExplained)
          }
          yes={isOffline ? '' : t.logout}
          no={isOffline ? t.close : t.cancel}
          yesResponse={handleLogout}
          noResponse={handleNoLinkSetup}
        />
      )}
    </>
  );
};

export default ParatextLinkedButton;
