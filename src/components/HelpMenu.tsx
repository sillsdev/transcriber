import React from 'react';
import { connect } from 'react-redux';
import { IState, IMainStrings } from '../model';
import localStrings from '../selector/localize';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import ReportIcon from '@material-ui/icons/Report';
import HelpIcon from '@material-ui/icons/Help';
import { API_CONFIG } from '../api-variable';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    help: {
      color: 'white',
    },
    version: {
      paddingTop: theme.spacing(2),
      alignSelf: 'center',
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
  action?: (what: string) => void;
}

export function HelpMenu(props: IProps) {
  const { action, t } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handle = (what: string) => () => {
    setAnchorEl(null);
    if (action) {
      action(what);
    }
  };

  return (
    <div>
      <IconButton
        aria-controls="customized-menu"
        aria-haspopup="true"
        // variant="contained"
        color="primary"
        onClick={handleClick}
      >
        <HelpIcon className={classes.help} />
      </IconButton>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <a
          href={API_CONFIG.help}
          style={{ textDecoration: 'none' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StyledMenuItem>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary={t.helpCenter} />
          </StyledMenuItem>
        </a>
        <a
          href={API_CONFIG.community}
          style={{ textDecoration: 'none' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StyledMenuItem>
            <ListItemIcon>
              <ReportIcon />
            </ListItemIcon>
            <ListItemText primary={t.reportIssue} />
          </StyledMenuItem>
        </a>
        <StyledMenuItem>
          <ListItemText
            primary={
              <div className={classes.version}>
                {t.version + ' ' + version}
                <br />
                {buildDate}
              </div>
            }
          />
        </StyledMenuItem>
      </StyledMenu>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(HelpMenu) as any;
