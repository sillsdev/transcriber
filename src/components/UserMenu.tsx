import React from 'react';
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
} from '@material-ui/core';
import ExitIcon from '@material-ui/icons/ExitToApp';
import AccountIcon from '@material-ui/icons/AccountCircle';
import ClearIcon from '@material-ui/icons/Clear';
import UserAvatar from './UserAvatar';
import { AUTH_CONFIG } from '../auth/auth0-variables';
import Auth from '../auth/Auth';

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

const StyledMenuItem = withStyles(theme => ({
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
  t: IMainStrings;
}

interface IProps extends IStateProps {
  action: (what: string) => void;
  auth: Auth;
}

export function UserMenu(props: IProps) {
  const { action, t, auth } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shift, setShift] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setShift(event.shiftKey);
    setAnchorEl(event.currentTarget);
  };

  const handle = (what: string) => () => {
    setAnchorEl(null);
    action(what);
  };

  return (
    <div>
      <Button
        aria-controls="customized-menu"
        aria-haspopup="true"
        // variant="contained"
        color="primary"
        onClick={handleClick}
      >
        <UserAvatar />
      </Button>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <a
          href={AUTH_CONFIG.myAccountApp + '#access_token=' + auth.accessToken}
          style={{ textDecoration: 'none' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StyledMenuItem>
            <ListItemIcon>
              <AccountIcon />
            </ListItemIcon>
            <ListItemText primary={t.myAccount} />
          </StyledMenuItem>
        </a>
        {!shift || (
          <StyledMenuItem onClick={handle('Clear')}>
            <ListItemIcon>
              <ClearIcon />
            </ListItemIcon>
            <ListItemText primary={t.clearCache} />
          </StyledMenuItem>
        )}
        <StyledMenuItem onClick={handle('Logout')}>
          <ListItemIcon>
            <ExitIcon />
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

// const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
//   ...bindActionCreators({}, dispatch),
// });

export default connect(mapStateToProps)(UserMenu) as any;
