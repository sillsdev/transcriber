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
import { ISharedStrings, IVoiceStrings, Organization } from '../../model';
import BigDialog from '../../hoc/BigDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector, voiceSelector } from '../../selector';

interface IProps {
  voice?: string;
  team: Organization;
  state: IVoicePerm;
  saving: boolean;
  setState?: React.Dispatch<React.SetStateAction<IVoicePerm>>;
  setStatement?: (statement: string) => void;
}

export const VoiceStatement = ({
  voice,
  team,
  state,
  saving,
  setState,
  setStatement,
}: IProps) => {
  const [showPersonalize, setShowPersonalize] = React.useState<IVoicePerm>();
  const t: IVoiceStrings = useSelector(voiceSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { permStatement } = useVoicePermission({
    permissionState: state,
    team,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(permStatement);
  };

  function handlePersonalize() {
    const newState = { ...state, fullName: voice };
    setState && setState(newState);
    setShowPersonalize(newState);
  }

  useEffect(() => {
    setStatement && setStatement(permStatement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permStatement]);

  return (
    <Box>
      <Stack direction="column" spacing={1} sx={{ mx: 1 }}>
        <Typography sx={{ lineHeight: '1.2rem', pt: 1 }}>
          {permStatement}
        </Typography>
        <ActionRow>
          <IconButton onClick={handleCopy} title={ts.clipboardCopy}>
            <ContentCopyIcon color="primary" fontSize="small" />
          </IconButton>
          <GrowingSpacer />
          <AltButton onClick={handlePersonalize} disabled={saving}>
            {t.personalize}
          </AltButton>
        </ActionRow>
      </Stack>
      <BigDialog
        title={t.personalizeTitle}
        isOpen={Boolean(showPersonalize)}
        onOpen={() => setShowPersonalize(undefined)}
        onCancel={() => {
          setState && setState(showPersonalize as IVoicePerm);
          setShowPersonalize(undefined);
        }}
        onSave={() =>
          state?.valid !== false ? setShowPersonalize(undefined) : undefined
        }
      >
        <PersonalizeVoicePermission state={state} setState={setState} />
      </BigDialog>
    </Box>
  );
};
