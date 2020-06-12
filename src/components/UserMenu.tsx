import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IMainStrings } from '../model';
import localStrings from '../selector/localize';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExitIcon from '@material-ui/icons/ExitToApp';
import AccountIcon from '@material-ui/icons/AccountCircle';
import ClearIcon from '@material-ui/icons/Clear';
import UserAvatar from './UserAvatar';
import { isElectron } from '../api-variable';

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

const roleStyle = {
  display: 'flex',
  flexDirection: 'column',
} as React.CSSProperties;

interface IStateProps {
  t: IMainStrings;
}

interface IProps extends IStateProps {
  action: (what: string) => void;
}

export function UserMenu(props: IProps) {
  const { action, t } = props;
  const [orgRole] = useGlobal('orgRole');
  const [projRole] = useGlobal('projRole');
  const [developer] = useGlobal('developer');

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shift, setShift] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setShift(event.shiftKey);
    setAnchorEl(event.currentTarget);
  };

  const handleAction = (what: string) => () => {
    setAnchorEl(null);
    if (action) action(what);
  };

  return (
    <div>
      <Button
        aria-controls="custom-user-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <UserAvatar />
      </Button>
      <StyledMenu
        id="custom-user-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleAction('Close')}
      >
        <StyledMenuItem>
          <ListItemText
            primary={
              <div style={roleStyle}>
                <Typography>{t.orgRole + ' ' + orgRole}</Typography>
                <Typography>
                  {t.projRole +
                    ' ' +
                    (projRole === 'admin' ? t.owner : projRole)}
                </Typography>
              </div>
            }
          />
        </StyledMenuItem>

        <StyledMenuItem onClick={handleAction('Profile')}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t.myAccount} />
        </StyledMenuItem>
        {shift && !isElectron && (
          <StyledMenuItem onClick={handleAction('Clear')}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t.clearCache} />
          </StyledMenuItem>
        )}
        {shift && (
          <StyledMenuItem onClick={handleAction('ClearLogout')}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t.clearLogout} />
          </StyledMenuItem>
        )}
        {shift && developer && (
          <StyledMenuItem onClick={handleAction('Error')}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={'Error'} />
          </StyledMenuItem>
        )}
        <StyledMenuItem onClick={handleAction('Logout')}>
          <ListItemIcon>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t.logout} />
        </StyledMenuItem>
      </StyledMenu>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(UserMenu) as any;
