import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  ICardsStrings,
  IProjButtonsStrings,
  IToDoTableStrings,
} from '../../model';
import localStrings from '../../selector/localize';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SettingsIcon from '@material-ui/icons/Settings';
// import SyncIcon from '@material-ui/icons/Sync';
// import IntegrationIcon from '@material-ui/icons/SyncAlt';
import ParatextLogo from '../../control/ParatextLogo';
import ImportIcon from '@material-ui/icons/CloudUpload';
import ExportIcon from '@material-ui/icons/CloudDownload';
import ReportIcon from '@material-ui/icons/Assessment';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterIcon from '@material-ui/icons/FilterList';
import UncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import CheckedIcon from '@material-ui/icons/RadioButtonChecked';
import { isElectron } from '../../api-variable';
import { useOfflnProjRead } from '../../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    icon: {
      color: theme.palette.primary.light,
    },
  })
);

const StyledMenu = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
  },
})((props: MenuProps) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
  },
}))(MenuItem);

interface IStateProps {
  t: ICardsStrings;
  tpb: IProjButtonsStrings;
  td: IToDoTableStrings;
}

interface IProps extends IStateProps {
  inProject?: boolean;
  isOwner?: boolean;
  project: string;
  action?: (what: string) => void;
}

export function ProjectMenu(props: IProps) {
  const { inProject, action, t, tpb, td, isOwner, project } = props;
  const classes = useStyles();
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const offlineProjectRead = useOfflnProjRead();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

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
        aria-controls="customized-menu"
        aria-haspopup="true"
        className={classes.icon}
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
          <StyledMenuItem onClick={handle('settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t.settings} />
          </StyledMenuItem>
        )}
        {isElectron && !isOffline && (
          <StyledMenuItem onClick={handle('offlineAvail')}>
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
        {/* <StyledMenuItem onClick={handle('sync')} disabled={syncDisable}>
          <ListItemIcon>
            <SyncIcon />
          </ListItemIcon>
          <ListItemText
            primary={tpb.sync.replace('{0}', toBeSynced.toString())}
          />
        </StyledMenuItem> */}
        <StyledMenuItem onClick={handle('reports')}>
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary={tpb.reports} />
        </StyledMenuItem>
        <StyledMenuItem onClick={handle('integration')}>
          <ListItemIcon>
            <ParatextLogo />
          </ListItemIcon>
          <ListItemText primary={tpb.integrations} />
        </StyledMenuItem>
        {isOwner && (!isElectron || isOffline) && (
          <StyledMenuItem onClick={handle('import')}>
            <ListItemIcon>
              <ImportIcon />
            </ListItemIcon>
            <ListItemText primary={tpb.import} />
          </StyledMenuItem>
        )}
        <StyledMenuItem onClick={handle('export')}>
          <ListItemIcon>
            <ExportIcon />
          </ListItemIcon>
          <ListItemText primary={tpb.export} />
        </StyledMenuItem>
        {inProject ? (
          <StyledMenuItem onClick={handle('filter')}>
            <ListItemIcon>
              <FilterIcon />
            </ListItemIcon>
            <ListItemText primary={td.filter} />
          </StyledMenuItem>
        ) : (
          (!isOffline || offlineOnly) &&
          isOwner && (
            <StyledMenuItem onClick={handle('delete')}>
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'cards' }),
  tpb: localStrings(state, { layout: 'projButtons' }),
  td: localStrings(state, { layout: 'toDoTable' }),
});

export default connect(mapStateToProps)(ProjectMenu) as any;
