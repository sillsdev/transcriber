import React, { useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { useLocation } from 'react-router-dom';
import {
  ICardsStrings,
  IProjButtonsStrings,
  IToDoTableStrings,
  VProject,
} from '../../model';
import { IconButton, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import ParatextLogo from '../../control/ParatextLogo';
import ImportIcon from '@mui/icons-material/CloudUpload';
import ExportIcon from '@mui/icons-material/CloudDownload';
import ReportIcon from '@mui/icons-material/Assessment';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterIcon from '@mui/icons-material/FilterList';
import UncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckedIcon from '@mui/icons-material/RadioButtonChecked';
import { isElectron } from '../../api-variable';
import { useOfflnProjRead, useProjectType, ArtifactTypeSlug } from '../../crud';
import { StyledMenu, StyledMenuItem } from '../../control';
import {
  cardsSelector,
  projButtonsSelector,
  toDoTableSelector,
} from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  inProject?: boolean;
  isOwner?: boolean;
  project: string | VProject;
  justFilter?: boolean;
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export function ProjectMenu(props: IProps) {
  const { inProject, action, isOwner, project, justFilter, stopPlayer } = props;
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { pathname } = useLocation();
  const { getProjType } = useProjectType();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const offlineProjectRead = useOfflnProjRead();
  const [projectType, setProjectType] = useState('');
  const t: ICardsStrings = useSelector(cardsSelector, shallowEqual);
  const tpb: IProjButtonsStrings = useSelector(
    projButtonsSelector,
    shallowEqual
  );
  const td: IToDoTableStrings = useSelector(toDoTableSelector, shallowEqual);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    if (stopPlayer) stopPlayer();
  };

  useEffect(() => {
    setProjectType(getProjType(project));
  }, [getProjType, project]);

  const handle = (what: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
    if (action) {
      action(what);
    }
  };

  const offlineProject = offlineProjectRead(project);

  return (
    <div>
      <IconButton
        id="projectMenu"
        aria-controls="customized-menu"
        aria-haspopup="true"
        sx={{ color: 'primary.light' }}
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        {!inProject && isOwner && (!isOffline || offlineOnly) && (
          <StyledMenuItem id="projMenuSettings" onClick={handle('settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t.settings} />
          </StyledMenuItem>
        )}
        {isElectron && !isOffline && !justFilter && (
          <StyledMenuItem id="projMenuOl" onClick={handle('offlineAvail')}>
            <ListItemIcon>
              {offlineProject?.attributes?.offlineAvailable ? (
                <CheckedIcon />
              ) : (
                <UncheckedIcon />
              )}
            </ListItemIcon>
            <ListItemText primary={t.offlineAvail} />
          </StyledMenuItem>
        )}
        {!justFilter && (
          <StyledMenuItem id="projMenuRep" onClick={handle('reports')}>
            <ListItemIcon>
              <ReportIcon />
            </ListItemIcon>
            <ListItemText primary={tpb.reports} />
          </StyledMenuItem>
        )}
        {!justFilter &&
          pathname &&
          projectType.toLowerCase() === 'scripture' &&
          pathname.indexOf(ArtifactTypeSlug.Retell) === -1 &&
          pathname.indexOf(ArtifactTypeSlug.QandA) === -1 && (
            <StyledMenuItem id="projMenuInt" onClick={handle('integration')}>
              <ListItemIcon>
                <ParatextLogo />
              </ListItemIcon>
              <ListItemText primary={tpb.integrations} />
            </StyledMenuItem>
          )}
        {!justFilter && isOwner && !inProject && (
          <StyledMenuItem id="projMenuImp" onClick={handle('import')}>
            <ListItemIcon>
              <ImportIcon />
            </ListItemIcon>
            <ListItemText primary={tpb.import} />
          </StyledMenuItem>
        )}
        {!justFilter && (
          <StyledMenuItem id="projMenuExp" onClick={handle('export')}>
            <ListItemIcon>
              <ExportIcon />
            </ListItemIcon>
            <ListItemText primary={tpb.export} />
          </StyledMenuItem>
        )}
        {inProject ? (
          <StyledMenuItem id="projMenuFilt" onClick={handle('filter')}>
            <ListItemIcon>
              <FilterIcon />
            </ListItemIcon>
            <ListItemText primary={td.filter} />
          </StyledMenuItem>
        ) : (
          (!isOffline || offlineOnly) &&
          isOwner && (
            <StyledMenuItem id="projMenuDel" onClick={handle('delete')}>
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText primary={t.delete} />
            </StyledMenuItem>
          )
        )}
      </StyledMenu>
    </div>
  );
}

export default ProjectMenu;
