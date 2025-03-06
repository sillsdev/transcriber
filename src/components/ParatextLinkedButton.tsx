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
import { AltButton } from '../control/AltButton';
import { useSelector } from 'react-redux';
import { profileSelector } from '../selector';
import { useHasParatext } from '../utils';
import { useGlobal } from '../context/GlobalContext';
import { addPt } from '../utils/addPt';
import CheckIcon from '@mui/icons-material/Check';


interface StyledCaptionProps extends TypographyProps {
  isCaption?: boolean;
  notLinked?: boolean;
}
const StyledCaption = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'notLinked' && prop !== 'isCaption',
})<StyledCaptionProps>(({ isCaption, notLinked, theme }) => ({
  ...(isCaption && {
    display: 'table',
    width: '100%',
    textAlign: 'center',
    marginTop: '13%',
    color: 'primary.contrastText',
    opacity: '65%',
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
        <StyledCaption isCaption notLinked sx = {{ color: 'primary.contrastText',
                                                   fontSize: '13px', 
                                                   fontWeight: 'normal' }}>
          {addPt(t.notLinked)}
        </StyledCaption>
      ) : (
        <></>
      )}
      <StyledCaption isCaption={Boolean(!status?.errStatus)}>
        {status?.errStatus || 0 || (isOffline && !ptPath) ? (
          <>
            <AltButton
              id="paraButton"
              key="paratext"
              sx={{ color: 'primary.contrastText', 
                    borderColor: 'primary.contrastText', 
                    textTransform: 'capitalize',
                    transition: 'opacity 0.2s ease-in-out',
                    opacity: '100%',
                    '&:hover': {
                      opacity: '80%',
                      borderColor: 'primary.contrastText'
                    }
              }}
              onClick={handleHowTo}
            >
              {addPt(t.paratextNotLinked)}
            </AltButton>
            {/* <Button variant="outlined" onClick={handleHowTo}>{addPt(t.paratextNotLinked)}</Button> */}
          </>
        ) : (hasParatext && status?.complete) || ptPath ? (
          addPt(t.paratextLinked)
        ) : (
          status?.statusMsg || addPt(t.checkingParatext)
        )}
        {(hasParatext) && status?.complete && <CheckIcon sx={{position: 'relative', top: '+5px'}}/>}
        {/* //(hasParatext)  && status?.complete ||  ptPath && */}
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
