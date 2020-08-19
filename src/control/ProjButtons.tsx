import React from 'react';
import { useGlobal } from 'reactn';
import { IPlanSheetStrings } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Divider, Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import { BigDialog } from '../hoc/BigDialog';
import IntegrationTab from '../components/Integration';
import ExportTab from '../components/TranscriptionTab';
import ImportTab from '../components/ImportTab';
import { useProjectPlans, usePlan } from '../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(1),
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      justifyContent: 'flex-start',
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: IPlanSheetStrings;
}

interface IProps extends IStateProps {
  pasting: boolean;
  data: Array<any>;
}

export const ProjButtons = (props: IProps) => {
  const { pasting, data, t } = props;
  const classes = useStyles();
  const { getPlanName } = usePlan();
  const [plan] = useGlobal('plan');
  const [project] = useGlobal('project');
  const projectPlans = useProjectPlans();
  const [actionMenuItem, setActionMenuItem] = React.useState(null);
  const [openIntegration, setOpenIntegration] = React.useState(false);
  const [openExport, setOpenExport] = React.useState(false);
  const [openImport, setOpenImport] = React.useState(false);

  const handleMenu = (e: any) => setActionMenuItem(e.currentTarget);

  const handleClose = () => setActionMenuItem(null);

  const handleImport = () => {
    setActionMenuItem(null);
    setOpenImport(true);
  };
  const handleExport = () => {
    setActionMenuItem(null);
    setOpenExport(true);
  };

  const handleIntegrations = () => {
    setOpenIntegration(true);
  };

  return (
    <>
      <Divider orientation="vertical" flexItem />
      <Button
        key="importExport"
        aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
        aria-label={t.importExport}
        variant="outlined"
        color="primary"
        className={classes.button}
        disabled={pasting}
        onClick={handleMenu}
      >
        {t.importExport}
        <DropDownIcon className={classes.icon} />
      </Button>
      <Menu
        id="import-export-menu"
        anchorEl={actionMenuItem}
        open={Boolean(actionMenuItem)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleImport}>{t.import}</MenuItem>
        <MenuItem onClick={handleExport}>{t.export}</MenuItem>
      </Menu>
      <Button
        key="integrations"
        aria-label={t.integrations}
        variant="outlined"
        color="primary"
        className={classes.button}
        disabled={pasting || data.length < 2}
        onClick={handleIntegrations}
      >
        {t.integrations}
      </Button>
      <BigDialog
        title={t.integrationsTitle.replace('{0}', getPlanName(plan))}
        isOpen={openIntegration}
        onOpen={setOpenIntegration}
      >
        <IntegrationTab {...props} />
      </BigDialog>
      <BigDialog
        title={t.exportTitle.replace('{0}', getPlanName(plan))}
        isOpen={openExport}
        onOpen={setOpenExport}
      >
        <ExportTab
          {...props}
          projectPlans={projectPlans(project)}
          planColumn={true}
        />
      </BigDialog>
      <BigDialog
        title={t.importTitle.replace('{0}', getPlanName(plan))}
        isOpen={openImport}
        onOpen={setOpenImport}
      >
        <ImportTab {...props} />
      </BigDialog>
    </>
  );
};
