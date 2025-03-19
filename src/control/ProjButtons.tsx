import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import {
  IPlanSheetStrings,
  IProjButtonsStrings,
  ISharedStrings,
} from '../model';
import { Divider, Menu, MenuItem } from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import BigDialog from '../hoc/BigDialog';
import IntegrationTab from '../components/Integration';
import ExportTab from '../components/TranscriptionTab';
import ImportTab from '../components/ImportTab';
import { useProjectPlans, usePlan } from '../crud';
import { AltButton } from '.';
import { PlanContext } from '../context/PlanContext';
import { addPt } from '../utils/addPt';
import { shallowEqual, useSelector } from 'react-redux';
import {
  planSheetSelector,
  projButtonsSelector,
  sharedSelector,
} from '../selector';

interface IProps {
  noCopy?: boolean;
  noPaste?: boolean;
  noReseq?: boolean;
  noImExport?: boolean;
  noIntegrate?: boolean;
  onLeft?: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onReseq: () => void;
  canPublish: boolean;
}

export const ProjButtons = (props: IProps) => {
  const {
    noCopy,
    onCopy,
    noPaste,
    noReseq,
    noImExport,
    noIntegrate,
    onLeft,
    onPaste,
    onReseq,
    canPublish,
  } = props;
  const { getPlanName } = usePlan();
  const [plan] = useGlobal('plan'); //verified this is not used in a function 2/18/25
  const [project] = useGlobal('project'); //verified this is not used in a function 2/18/25
  const [projType] = useGlobal('projType'); //verified this is not used in a function 2/18/25
  const { sectionArr } = React.useContext(PlanContext).state;
  const projectPlans = useProjectPlans();
  const [actionMenuItem, setActionMenuItem] = React.useState(null);
  const [openIntegration, setOpenIntegration] = React.useState(false);
  const [openExport, setOpenExport] = React.useState(false);
  const [openImport, setOpenImport] = React.useState(false);
  const [planName, setPlanName] = useState('');
  const t: IProjButtonsStrings = useSelector(projButtonsSelector, shallowEqual);
  const tp: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

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

  const handleChoice = (choice: () => void) => () => {
    setActionMenuItem(null);
    choice();
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
        {t.sheet}
        <DropDownIcon sx={{ ml: 1 }} />
      </AltButton>
      <Menu
        id="import-export-menu"
        anchorEl={actionMenuItem}
        open={Boolean(actionMenuItem)}
        onClose={handleClose}
      >
        <MenuItem
          id="planSheetCopy"
          disabled={noCopy}
          onClick={handleChoice(onCopy)}
        >
          {ts.clipboardCopy}
        </MenuItem>
        <MenuItem
          id="planSheetPaste"
          disabled={noPaste}
          onClick={handleChoice(onPaste)}
        >
          {tp.tablePaste}
        </MenuItem>
        <MenuItem
          id="planSheetReseq"
          disabled={noReseq}
          onClick={handleChoice(onReseq)}
        >
          {tp.resequence}
        </MenuItem>
        <MenuItem id="projButtonImp" onClick={handleImport}>
          {t.import}
        </MenuItem>
        <MenuItem id="projButtonExp" onClick={handleExport}>
          {t.export}
        </MenuItem>
        {projType.toLowerCase() === 'scripture' && (
          <MenuItem
            id="projButtonInt"
            disabled={noIntegrate}
            onClick={handleIntegrations}
          >
            {addPt(t.integrations)}
          </MenuItem>
        )}
      </Menu>
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
          sectionArr={sectionArr}
          canPublish={canPublish}
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
