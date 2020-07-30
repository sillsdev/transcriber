import React from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { IAddProjectState } from './AddProject';
import { EditorSettings } from './EditorSettings';
import { Options } from '.';
import renderLogo from '../../../assets/renderIcon.png';

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

const t = {
  advanced: 'Advanced',
  layout: 'Layout',
  organizedBy: 'Term for organizing layout',
};

export function ProjectExpansion(props: IAddProjectState) {
  const classes = useStyles();
  const { state, setState } = props;
  const { layout, organizedBy } = state;
  const [options, setOptions] = React.useState([
    'sections',
    'sets',
    'stories',
    'scenes',
    'pericopes',
  ]);

  const handleLayoutChange = (val: string) => {
    setState((state) => ({ ...state, layout: val || '' }));
  };

  const handleOrgByChange = (val: string) => {
    setState((state) => ({ ...state, organizedBy: val || '' }));
  };

  const handleAddOption = (val: string) => {
    const newOptions = options.map((i) => i);
    newOptions.push(val);
    setOptions(newOptions);
    handleOrgByChange(val);
  };

  const RenderLogo = (props: {}) => {
    return <img src={renderLogo} alt="Render Logo" className={classes.logo} />;
  };

  const decoration = {
    sets: <RenderLogo />,
    flat: <RenderLogo />,
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
            defaultValue={layout}
            options={['hierarcical', 'flat']}
            onChange={handleLayoutChange}
            decorations={decoration}
          />
          <Options
            label={t.organizedBy}
            defaultValue={organizedBy}
            options={options}
            onChange={handleOrgByChange}
            addOption={options.length === 5 ? handleAddOption : undefined}
            decorations={decoration}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </div>
  );
}
