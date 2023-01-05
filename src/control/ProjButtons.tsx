import React, { useState, useEffect } from 'react';
import { useGlobal } from '../mods/reactn';
import { IProjButtonsStrings } from '../model';
import { Divider, Menu, MenuItem } from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import BigDialog from '../hoc/BigDialog';
import IntegrationTab from '../components/Integration';
import ExportTab from '../components/TranscriptionTab';
import ImportTab from '../components/ImportTab';
import { useProjectPlans, usePlan } from '../crud';
import { AltButton } from '.';

interface IStateProps {
  t: IProjButtonsStrings;
}

interface IProps extends IStateProps {
  noImExport?: boolean;
  noIntegrate?: boolean;
  onLeft?: boolean;
}

export const ProjButtons = (props: IProps) => {
  const { noImExport, noIntegrate, onLeft, t } = props;
  const { getPlanName } = usePlan();
  const [plan] = useGlobal('plan');
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
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
      <AltButton
        id="projButton"
        key="importExport"
        aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
        aria-label={t.importExport}
        disabled={noImExport}
        onClick={handleMenu}
      >
        {t.importExport}
        <DropDownIcon sx={{ ml: 1 }} />
      </AltButton>
      <Menu
        id="import-export-menu"
        anchorEl={actionMenuItem}
        open={Boolean(actionMenuItem)}
        onClose={handleClose}
      >
        <MenuItem id="projButtonImp" onClick={handleImport}>
          {t.import}
        </MenuItem>

        <MenuItem id="projButtonExp" onClick={handleExport}>
          {t.export}
        </MenuItem>
      </Menu>
      {projType.toLowerCase() === 'scripture' && (
        <AltButton
          id="projButtonInt"
          key="integrations"
          aria-label={t.integrations}
          disabled={noIntegrate}
          onClick={handleIntegrations}
        >
          {t.integrations}
        </AltButton>
      )}
      <BigDialog
        title={t.integrationsTitle.replace('{0}', planName)}
        isOpen={openIntegration}
        onOpen={setOpenIntegration}
      >
        <IntegrationTab />
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
