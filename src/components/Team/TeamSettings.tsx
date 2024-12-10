import React, { useState } from 'react';
import { Organization } from '../../model';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Options } from '../../control';
// import { useOrgDefaults, orgDefaultFeatures } from '../../crud';
import { TeamContext } from '../../context/TeamContext';
import SettingsIcon from '@mui/icons-material/Settings';
import BigDialog from '../../hoc/BigDialog';
import SelectVoice from './SelectVoice';
import SelectAsrLanguage from './SelectAsrLanguage';

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

export interface IValues {
  noNoise?: boolean;
  deltaVoice?: boolean;
  aiTranscribe?: boolean;
  [key: string]: any;
}

interface IProps {
  team?: Organization;
  values: IValues;
  setValue: (what: string, value: string, init?: boolean) => void;
}

export function TeamSettings(props: IProps) {
  const { team, values, setValue } = props;
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
    t.workflowProgressionPassage
  );

  const setProgression = (val: string) => {
    setWorkflowProgression(val);
    setValue('workflowProgression', val);
  };

  const handleFeatures = (feat: string) => (_e: any, checked: boolean) => {
    setValue(feat, checked?.toString());
  };

  // useEffect(() => {
  //   if (team) {
  //     const curValues = team
  //       ? (getDefault(orgDefaultFeatures, team) as IValues) ?? {}
  //       : {};
  //     const change = Object.keys(curValues).some(
  //       (key) => curValues[key] !== values[key]
  //     );
  //     if (change) {
  //       setDefault(orgDefaultFeatures, values, team);
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [values, team]);

  // useEffect(() => {
  //   const initValues = team
  //     ? (getDefault(orgDefaultFeatures, team) as IValues) ?? {}
  //     : {};
  //   for (const key in initValues) {
  //     if (values[key] !== initValues[key]) {
  //       setValue(key, initValues[key]?.toString(), true);
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [team]);

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
                      checked={values?.[FeatureSlug.NoNoise] ?? false}
                      onChange={handleFeatures(FeatureSlug.NoNoise)}
                    />
                  }
                  label={'Noise Cancellation'}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values?.[FeatureSlug.DeltaVoice] ?? false}
                      onChange={handleFeatures(FeatureSlug.DeltaVoice)}
                    />
                  }
                  label={'Voice Conversion'}
                />
                <IconButton onClick={() => setVoiceVisible(true)}>
                  <SettingsIcon />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values?.[FeatureSlug.AiTranscribe] ?? false}
                      onChange={handleFeatures(FeatureSlug.AiTranscribe)}
                    />
                  }
                  label={'Speech Transcription'}
                />
                <IconButton onClick={() => setAsrLangVisible(true)}>
                  <SettingsIcon />
                </IconButton>
              </Stack>
            </FormControl>
          </Stack>
        </Details>
      </Accordion>
      <BigDialog
        title="Voice Conversion Settings"
        description={
          <Typography variant="body2" sx={{ maxWidth: 500 }}>
            For voice conversion a voice sample of preferrably a minute and a
            half will be needed. The option to save up to six voice samples to
            choose from are given. They are given arbitrary names but you can
            name the samples if desired.
          </Typography>
        }
        isOpen={voiceVisible}
        onOpen={() => setVoiceVisible(false)}
      >
        <SelectVoice team={team} onOpen={() => setVoiceVisible(false)} />
      </BigDialog>
      <BigDialog
        title="Speech Recogniztion Settings"
        description={
          <Typography variant="body2" sx={{ maxWidth: 500 }}>
            Choose the language to recognize. If the language is not available,
            choose a closely related language with a similar writing system.
          </Typography>
        }
        isOpen={asrLangVisible}
        onOpen={() => setAsrLangVisible(false)}
      >
        <SelectAsrLanguage onOpen={() => setAsrLangVisible(false)} />
      </BigDialog>
    </Box>
  );
}

export default TeamSettings;
