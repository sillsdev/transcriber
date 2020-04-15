import React from 'react';
import { useGlobal } from 'reactn';
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
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import path from 'path';
import { isElectron, API_CONFIG } from '../api-variable';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const noop = { openExternal: () => {} };
const { shell } = isElectron ? require('electron') : { shell: noop };

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    help: {},
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
  t: IMainStrings;
}

interface IProps extends IStateProps {
  online: boolean;
  action?: (what: string) => void;
}

export function HelpMenu(props: IProps) {
  const { online, action, t } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shift, setShift] = React.useState(false);
  const [isApp] = useGlobal('appView');
  const [developer, setDeveloper] = useGlobal('developer');
  const helpRef = React.useRef<any>();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setShift(event.shiftKey);
    setAnchorEl(event.currentTarget);
  };

  const helpLanguage = () => {
    let language = navigator.language.split('-')[0];
    if (!['fr', 'es'].includes(language)) language = 'en';
    return language;
  };

  const handleHelp = () => {
    if (isElectron) {
      const target = !online
        ? path.join(process.cwd(), API_CONFIG.chmHelp)
        : isApp
        ? API_CONFIG.help + '/' + helpLanguage() + '/index.htm'
        : API_CONFIG.adminHelp + '/' + helpLanguage() + '/index.htm';
      console.log('launching', target);
      shell.openExternal(target);
    } else if (helpRef.current) {
      helpRef.current.click();
    }
    setAnchorEl(null);
  };

  const handleDeveloper = () => {
    setDeveloper(!developer);
    setAnchorEl(null);
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
        <StyledMenuItem onClick={handleHelp}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary={t.helpCenter} />
        </StyledMenuItem>
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
        {shift && (
          <StyledMenuItem onClick={handleDeveloper}>
            <ListItemIcon>
              {developer ? <RemoveIcon /> : <AddIcon />}
            </ListItemIcon>
            <ListItemText primary={t.developer} />
          </StyledMenuItem>
        )}
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
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a
        ref={helpRef}
        href={
          isApp
            ? API_CONFIG.help + '/' + helpLanguage()
            : API_CONFIG.adminHelp + '/' + helpLanguage()
        }
        target="_blank"
        rel="noopener noreferrer"
      ></a>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(HelpMenu) as any;
