import React, { useEffect, useState } from 'react';
import {
  DialogMode,
  ISharedStrings,
  Organization,
  OrganizationD,
} from '../../model';
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
import SelectSponsor from '../../business/voice/SelectSponsor';
import SelectAsrLanguage from '../../business/asr/SelectAsrLanguage';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import { useGlobal } from '../../context/GlobalContext';
import {
  orgDefaultPermissions,
  orgDefaultWorkflowProgression,
} from '../../crud';

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
  permissions: boolean;
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
  const [permissions, setPermissions] = useState(true);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [asrLangVisible, setAsrLangVisible] = useState(false);
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const { cardStrings } = ctx.state;
  const t = cardStrings;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
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

  useEffect(() => {
    setPermissions(values?.permissions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.permissions]);

  const setProgression = (val: string) => {
    setWorkflowProgression(val);
    setValue(orgDefaultWorkflowProgression, val);
  };

  const handleFeatures = (feat: string) => (_e: any, checked: boolean) => {
    setValue(feat, checked?.toString());
  };

  const handleRefresh = () => {
    setValue('refresh', '');
  };
  const handlePermissionSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(orgDefaultPermissions, e.target.checked.toString());
    setPermissions(e.target.checked);
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={permissions}
                  onChange={handlePermissionSwitch}
                />
              }
              labelPlacement="end"
              label={t.projectPermissions}
            />
            <Options
              label={t.workflowProgression}
              defaultValue={workflowProgression}
              options={workflowOptions}
              onChange={setProgression}
            />
            {!offline && (
              <FormControl
                component="fieldset"
                sx={{ border: '1px solid grey', mr: 1, px: 2 }}
              >
                <FormLabel sx={{ color: 'secondary.main' }}>
                  {t.experimentalFeatures}
                </FormLabel>
                <Stack direction="row" spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          values?.features?.[FeatureSlug.NoNoise] ?? false
                        }
                        onChange={handleFeatures(FeatureSlug.NoNoise)}
                      />
                    }
                    label={<Badge badgeContent={ts.ai}>{t.reduceNoise}</Badge>}
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
                    label={<Badge badgeContent={ts.ai}>{t.convertVoice}</Badge>}
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
                    label={
                      <Badge badgeContent={ts.ai}>{t.recognizeSpeech}</Badge>
                    }
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
            )}
          </Stack>
        </Details>
      </Accordion>

      <BigDialog
        title={t.convertVoiceSettings}
        isOpen={voiceVisible}
        onOpen={() => setVoiceVisible(false)}
        description={<Typography>{t.convertPrompt}</Typography>}
        bp={BigDialogBp.sm}
      >
        <SelectSponsor
          team={team}
          refresh={handleRefresh}
          onOpen={() => setVoiceVisible(false)}
        />
      </BigDialog>
      <BigDialog
        title={t.recognizeSpeechSettings}
        description={
          <Typography variant="body2" sx={{ maxWidth: 500 }}>
            {t.recognizePrompt}
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
