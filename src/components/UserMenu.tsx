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
import UserAvatar from './UserAvatar';

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
}

export function UserMenu(props: IProps) {
  const { action, t } = props;
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
        <StyledMenuItem onClick={handle('Logout')}>
          <ListItemIcon>
            <ExitIcon />
          </ListItemIcon>
          <ListItemText primary={t.logout} />
        </StyledMenuItem>
        {!shift || (
          <StyledMenuItem onClick={handle('Clear')}>
            <ListItemIcon>
              <ExitIcon />
            </ListItemIcon>
            <ListItemText primary={t.clearCache} />
          </StyledMenuItem>
        )}
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
