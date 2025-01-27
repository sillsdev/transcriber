import React, { useEffect } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ActionRow } from '../../control/ActionRow';
import { GrowingSpacer } from '../../control/GrowingSpacer';
import { AltButton } from '../../control/AltButton';
import PersonalizeVoicePermission, {
  IVoicePerm,
} from './PersonalizeVoicePermission';
import { useVoicePermission } from './useVoicePermission';
import { Organization } from '../../model';
import BigDialog from '../../hoc/BigDialog';

interface IProps {
  voice?: string;
  team: Organization;
  state: IVoicePerm;
  setState?: React.Dispatch<React.SetStateAction<IVoicePerm>>;
  setStatement?: (statement: string) => void;
}

export const VoiceStatement = ({
  voice,
  team,
  state,
  setState,
  setStatement,
}: IProps) => {
  const [showPersonalize, setShowPersonalize] = React.useState<IVoicePerm>();
  const { permStatement } = useVoicePermission({
    permissionState: { ...state, fullName: voice },
    team,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(permStatement);
  };

  function handlePersonalize() {
    setShowPersonalize(state);
  }

  useEffect(() => {
    setStatement && setStatement(permStatement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permStatement]);

  return (
    <Box>
      <Stack direction="column" spacing={1} sx={{ mx: 1 }}>
        <Typography variant="body2" sx={{ py: 2 }} component={'div'}>
          Record this permission statement if you agree:
          <Typography sx={{ lineHeight: '1.2rem', pt: 1 }}>
            {permStatement}
          </Typography>
        </Typography>
        <ActionRow>
          <IconButton onClick={handleCopy} title={'Copy to clipboard'}>
            <ContentCopyIcon color="primary" fontSize="small" />
          </IconButton>
          <GrowingSpacer />
          <AltButton onClick={handlePersonalize}>{'Personalize'}</AltButton>
        </ActionRow>
      </Stack>
      <BigDialog
        title={'Personalize Voice Permission'}
        isOpen={Boolean(showPersonalize)}
        onOpen={() => setShowPersonalize(undefined)}
        onCancel={() => {
          setState && setState(showPersonalize as IVoicePerm);
          setShowPersonalize(undefined);
        }}
        onSave={() => setShowPersonalize(undefined)}
      >
        <PersonalizeVoicePermission
          state={{ ...state, fullName: voice }}
          setState={setState}
        />
      </BigDialog>
    </Box>
  );
};
