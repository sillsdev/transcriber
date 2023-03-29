import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Box,
  styled,
  AccordionSummaryProps,
  TypographyProps,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TeamContext } from '../../../context/TeamContext';
import { IProjectDialogState } from './ProjectDialog';
import { EditorSettings } from './EditorSettings';
import { Options } from '.';
import RenderLogo from '../../../control/RenderLogo';
import { useSnackBar } from '../../../hoc/SnackBar';
import { useOrganizedBy } from '../../../crud';

const StyledAccordionSummary = styled(AccordionSummary)<AccordionSummaryProps>(
  ({ theme }) => ({
    '& .MuiTypography-root': {
      color: theme.palette.secondary.main,
    },
  })
);

const Heading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(18),
  fontWeight: theme.typography.fontWeightRegular,
}));

const RenderRecommended = () => {
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;

  return (
    <Typography variant="caption" sx={{ display: 'flex' }}>
      <RenderLogo />
      {'\u00A0' + t.renderRecommended}
    </Typography>
  );
};

const RenderCustomize = () => {
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;

  return (
    <Typography variant="caption" sx={{ display: 'flex' }}>
      <RenderLogo />
      {'\u00A0' + t.renderCustomize}
    </Typography>
  );
};

export function ProjectExpansion(props: IProjectDialogState) {
  const { state, setState } = props;
  const { organizedBy, isPublic } = state;
  const { localizedOrganizedBy, fromLocalizedOrganizedBy } = useOrganizedBy();
  const [localOrgBy, setLocalOrgBy] = useState('');
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
  const [options, setOptions] = React.useState([
    t.sections,
    t.sets,
    t.stories,
    t.scenes,
    t.pericopes,
  ]);
  const { SnackBar, message, showMessage } = useSnackBar();

  const handleShareable = (e: any, val: boolean) => {
    setState((state) => ({ ...state, isPublic: val }));
  };
  const handleLayoutChange = (val: string) => {
    setState((state) => ({ ...state, flat: val === t.flat }));
  };

  const handleOrgByChange = (val: string) => {
    setState((state) => ({
      ...state,
      organizedBy: fromLocalizedOrganizedBy(val),
    }));
  };

  useEffect(() => {
    const addOption = (val: string) => {
      const newOptions = options.map((i) => i);
      newOptions.push(val);
      setOptions(newOptions);
    };

    var optionVal = localizedOrganizedBy(organizedBy, undefined);
    if (!options.includes(optionVal)) addOption(optionVal);
    setLocalOrgBy(optionVal);
  }, [localizedOrganizedBy, options, organizedBy]);

  const handleAddOption = (val: string) => {
    if (val.indexOf('/') === -1) {
      showMessage(t.correctformat);
      return false;
    }
    handleOrgByChange(val);
    return true;
  };

  const decoration = {
    [t.sets]: <RenderRecommended />,
    [t.flat]: <RenderRecommended />,
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Accordion>
        <StyledAccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="proj-exp-content"
          id="proj-exp-header"
        >
          <Heading>{t.advanced}</Heading>
          {'\u00A0 '}
          <RenderCustomize />
        </StyledAccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
          <EditorSettings state={state} setState={setState} />

          <Options
            label={t.layout}
            defaultValue={state.flat ? t.flat : t.hierarchical}
            options={[t.hierarchical, t.flat]}
            onChange={handleLayoutChange}
            decorations={decoration}
          />
          <Options
            label={t.organizedBy}
            defaultValue={localOrgBy}
            options={options}
            onChange={handleOrgByChange}
            addOption={options.length === 5 ? handleAddOption : undefined}
            otherLabel={t.other}
            decorations={decoration}
          />
          {!state.isPersonal && (
            <>
              <FormLabel sx={{ pt: 4, color: 'secondary.main' }}>
                {t.sharedResources}
              </FormLabel>
              <FormControlLabel
                sx={{ mx: 1, mb: 1 }}
                control={
                  <Checkbox
                    id="checkbox-shared"
                    checked={isPublic}
                    onChange={handleShareable}
                  />
                }
                label={t.isPublic}
              />
            </>
          )}
        </AccordionDetails>
      </Accordion>
      <SnackBar message={message} />
    </Box>
  );
}
