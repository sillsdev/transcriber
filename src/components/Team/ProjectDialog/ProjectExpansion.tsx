import React, { useEffect, useState } from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  FormLabel,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { TeamContext } from '../../../context/TeamContext';
import { IProjectDialogState } from './ProjectDialog';
import { EditorSettings } from './EditorSettings';
import { Options } from '.';
import RenderLogo from '../../../control/RenderLogo';
import { useSnackBar } from '../../../hoc/SnackBar';
import { useOrganizedBy } from '../../../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    panel: {
      display: 'flex',
      flexDirection: 'column',
    },
    summary: {
      '& .MuiTypography-root': {
        color: theme.palette.secondary.main,
      },
    },
    heading: {
      fontSize: theme.typography.pxToRem(18) as any,
      fontWeight: theme.typography.fontWeightRegular as any,
    },
    logo: {
      width: '16px',
      height: '16px',
    },
    render: {
      display: 'flex',
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    label: {
      color: theme.palette.secondary.main,
    },
  })
);

export function ProjectExpansion(props: IProjectDialogState) {
  const classes = useStyles();
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

  const RenderRecommended = () => (
    <Typography variant="caption" className={classes.render}>
      <RenderLogo />
      {'\u00A0' + t.renderRecommended}
    </Typography>
  );

  const RenderCustomize = () => (
    <Typography variant="caption" className={classes.render}>
      <RenderLogo />
      {'\u00A0' + t.renderCustomize}
    </Typography>
  );

  const decoration = {
    [t.sets]: <RenderRecommended />,
    [t.flat]: <RenderRecommended />,
  };

  return (
    <div className={classes.root}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className={classes.summary}
          aria-controls="proj-exp-content"
          id="proj-exp-header"
        >
          <Typography className={classes.heading}>{t.advanced}</Typography>
          {'\u00A0 '}
          <RenderCustomize />
        </AccordionSummary>
        <AccordionDetails className={classes.panel}>
          <FormLabel className={classes.label}>{t.sharedResources}</FormLabel>
          <FormControlLabel
            className={classes.textField}
            control={
              <Checkbox
                id="checkbox-shared"
                checked={isPublic}
                onChange={handleShareable}
              />
            }
            label={t.isPublic}
          />
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
        </AccordionDetails>
      </Accordion>
      <SnackBar message={message} />
    </div>
  );
}
