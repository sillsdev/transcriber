import React, { useState } from 'react';
import { useGlobal, useEffect } from 'reactn';
import { IProjButtonsStrings } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Divider, Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import { BigDialog } from '../hoc/BigDialog';
import IntegrationTab from '../components/Integration';
import ExportTab from '../components/TranscriptionTab';
import ImportTab from '../components/ImportTab';
import { useProjectPlans, usePlan } from '../crud';
import { isElectron } from '../api-variable';
import Auth from '../auth/Auth';

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
  t: IProjButtonsStrings;
}

interface IProps extends IStateProps {
  noImExport?: boolean;
  noIntegrate?: boolean;
  onLeft?: boolean;
  auth: Auth;
}

export const ProjButtons = (props: IProps) => {
  const { noImExport, noIntegrate, onLeft, auth, t } = props;
  const classes = useStyles();
  const { getPlanName } = usePlan();
  const [plan] = useGlobal('plan');
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
  const [isOffline] = useGlobal('offline');
  const projectPlans = useProjectPlans();
  const [actionMenuItem, setActionMenuItem] = React.useState(null);
  const [openIntegration, setOpenIntegration] = React.useState(false);
  const [openExport, setOpenExport] = React.useState(false);
  const [openImport, setOpenImport] = React.useState(false);
  const [planName, setPlanName] = useState('');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPlanName(getPlanName(plan)), [plan]);
  return (
    <>
      {!onLeft && <Divider orientation="vertical" flexItem />}
      <Button
        key="importExport"
        aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
        aria-label={t.importExport}
        variant="outlined"
        color="primary"
        className={classes.button}
        disabled={noImExport}
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
        {(!isElectron || isOffline) && (
          <MenuItem onClick={handleImport}>{t.import}</MenuItem>
        )}
        <MenuItem onClick={handleExport}>{t.export}</MenuItem>
      </Menu>
      {projType.toLowerCase() === 'scripture' && (
        <Button
          key="integrations"
          aria-label={t.integrations}
          variant="outlined"
          color="primary"
          className={classes.button}
          disabled={noIntegrate}
          onClick={handleIntegrations}
        >
          {t.integrations}
        </Button>
      )}
      <BigDialog
        title={t.integrationsTitle.replace('{0}', planName)}
        isOpen={openIntegration}
        onOpen={setOpenIntegration}
      >
        <IntegrationTab {...props} />
      </BigDialog>
      <BigDialog
        title={t.exportTitle.replace('{0}', planName)}
        isOpen={openExport}
        onOpen={setOpenExport}
      >
        <ExportTab
          {...props}
          projectPlans={projectPlans(project)}
          planColumn={true}
        />
      </BigDialog>
      {openImport && (
        <ImportTab
          auth={auth}
          isOpen={openImport}
          onOpen={setOpenImport}
          planName={planName}
          project={project}
        />
      )}
      {onLeft && <Divider orientation="vertical" flexItem />}
    </>
  );
};
