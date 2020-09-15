import React, { useEffect, useState } from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Typography,
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
    heading: {
      color: theme.palette.secondary.main,
      fontSize: theme.typography.pxToRem(18),
      fontWeight: theme.typography.fontWeightRegular,
    },
    logo: {
      width: '16px',
      height: '16px',
    },
  })
);

export function ProjectExpansion(props: IProjectDialogState) {
  const classes = useStyles();
  const { state, setState } = props;
  const { organizedBy } = state;
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
    setLocalOrgBy(localizedOrganizedBy(organizedBy, undefined));
  }, [localizedOrganizedBy, organizedBy]);

  const handleAddOption = (val: string) => {
    const newOptions = options.map((i) => i);
    if (val.indexOf('/') === -1) {
      showMessage(t.correctformat);
      return;
    }
    newOptions.push(val);
    setOptions(newOptions);
    handleOrgByChange(val);
  };

  const decoration = {
    [t.sets]: <RenderLogo />,
    [t.flat]: <RenderLogo />,
  };

  return (
    <div className={classes.root}>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="proj-exp-content"
          id="proj-exp-header"
        >
          <Typography className={classes.heading}>{t.advanced}</Typography>
          {'\u00A0 '}
          <RenderLogo />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panel}>
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
            decorations={decoration}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <SnackBar message={message} />
    </div>
  );
}
