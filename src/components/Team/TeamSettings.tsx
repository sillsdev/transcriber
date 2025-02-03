import React, { useEffect, useState } from 'react';
import { DialogMode, Organization, OrganizationD } from '../../model';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  styled,
  AccordionDetailsProps,
  FormLabel,
  Stack,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  Typography,
  Badge,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Options } from '../../control';
// import { useOrgDefaults, orgDefaultFeatures } from '../../crud';
import { TeamContext } from '../../context/TeamContext';
import SettingsIcon from '@mui/icons-material/Settings';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import SelectVoice from '../../business/voice/SelectVoice';
import SelectAsrLanguage from '../../business/asr/SelectAsrLanguage';

export enum FeatureSlug {
  NoNoise = 'noNoise',
  DeltaVoice = 'deltaVoice',
  AiTranscribe = 'aiTranscribe',
}

const Details = styled(AccordionDetails)<AccordionDetailsProps>(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    '& .MuiBox-root': {
      paddingTop: theme.spacing(0),
    },
  })
);

export interface IFeatures {
  noNoise?: boolean;
  deltaVoice?: boolean;
  aiTranscribe?: boolean;
  [key: string]: any;
}

interface IValues {
  features: IFeatures;
  workflowProgression: string;
}

interface IProps {
  mode: DialogMode;
  team?: Organization;
  values: IValues;
  setValue: (what: string, value: string, init?: boolean) => void;
}

export function TeamSettings(props: IProps) {
  const { mode, team, values, setValue } = props;
  const ctx = React.useContext(TeamContext);
  // const { getDefault, setDefault } = useOrgDefaults();
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [asrLangVisible, setAsrLangVisible] = useState(false);
  const { cardStrings } = ctx.state;
  const t = cardStrings;
  const workflowOptions = [
    t.workflowProgressionPassage,
    t.workflowProgressionStep,
  ];
  const [workflowProgression, setWorkflowProgression] = useState(
    values?.workflowProgression ?? t.workflowProgressionPassage
  );

  useEffect(() => {
    setWorkflowProgression(
      values?.workflowProgression ?? t.workflowProgressionPassage
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.workflowProgression]);

  const setProgression = (val: string) => {
    setWorkflowProgression(val);
    setValue('workflowProgression', val);
  };

  const handleFeatures = (feat: string) => (_e: any, checked: boolean) => {
    setValue(feat, checked?.toString());
  };

  const handleRefresh = () => {
    setValue('refresh', '');
  };

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel0a-content"
          id="panel0a-header"
        >
          {t.settings}
        </AccordionSummary>
        <Details>
          <Stack spacing={1}>
            <Options
              label={t.workflowProgression}
              defaultValue={workflowProgression}
              options={workflowOptions}
              onChange={setProgression}
            />
            <FormControl
              component="fieldset"
              sx={{ border: '1px solid grey', mr: 1, px: 2 }}
            >
              <FormLabel sx={{ color: 'secondary.main' }}>
                {'Experimental Features'}
              </FormLabel>
              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values?.features?.[FeatureSlug.NoNoise] ?? false}
                      onChange={handleFeatures(FeatureSlug.NoNoise)}
                    />
                  }
                  label={<Badge badgeContent={'AI'}>Reduce Noise</Badge>}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        values?.features?.[FeatureSlug.DeltaVoice] ?? false
                      }
                      onChange={handleFeatures(FeatureSlug.DeltaVoice)}
                    />
                  }
                  label={<Badge badgeContent={'AI'}>Convert Voice</Badge>}
                />
                {mode !== DialogMode.add && (
                  <IconButton
                    onClick={() => setVoiceVisible(true)}
                    disabled={!values?.features?.[FeatureSlug.DeltaVoice]}
                  >
                    <SettingsIcon />
                  </IconButton>
                )}
              </Stack>
              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        values?.features?.[FeatureSlug.AiTranscribe] ?? false
                      }
                      onChange={handleFeatures(FeatureSlug.AiTranscribe)}
                    />
                  }
                  label={<Badge badgeContent={'AI'}>Recognize Speech</Badge>}
                />
                {mode !== DialogMode.add && (
                  <IconButton
                    onClick={() => setAsrLangVisible(true)}
                    disabled={!values?.features?.[FeatureSlug.AiTranscribe]}
                  >
                    <SettingsIcon />
                  </IconButton>
                )}
              </Stack>
            </FormControl>
          </Stack>
        </Details>
      </Accordion>
      <BigDialog
        title={'Convert Voice Settings'}
        isOpen={voiceVisible}
        onOpen={() => setVoiceVisible(false)}
        description={
          <Typography>
            Enter the name of the organization that will hold the rights for
            recordings of the converted voices.
          </Typography>
        }
        bp={BigDialogBp.sm}
      >
        <SelectVoice
          team={team}
          refresh={handleRefresh}
          onOpen={() => setVoiceVisible(false)}
        />
      </BigDialog>
      <BigDialog
        title="Recognize Speech Settings"
        description={
          <Typography variant="body2" sx={{ maxWidth: 500 }}>
            Choose the language to recognize. If the language is not available,
            choose a closely related language with a similar writing system.
          </Typography>
        }
        isOpen={asrLangVisible}
        onOpen={() => setAsrLangVisible(false)}
      >
        <SelectAsrLanguage
          team={team as OrganizationD}
          refresh={handleRefresh}
          onOpen={() => setAsrLangVisible(false)}
        />
      </BigDialog>
    </Box>
  );
}

export default TeamSettings;
