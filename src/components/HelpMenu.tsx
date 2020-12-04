import React from 'react';
import { useLocation } from 'react-router-dom';
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
import DownloadIcon from '@material-ui/icons/CloudDownload';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import path from 'path';
import { isElectron, API_CONFIG } from '../api-variable';
import { launch } from '../utils';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

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
  const { pathname } = useLocation();
  const [offline] = useGlobal('offline');
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shift, setShift] = React.useState(false);
  const [developer, setDeveloper] = useGlobal('developer');
  const [topic, setTopic] = React.useState<string>();
  const [helpToggle, setHelpToggle] = React.useState(false);
  const helpRef = React.useRef<any>();

  interface IHelpLinkProps {
    topic?: string;
  }

  const HelpLink = ({ topic }: IHelpLinkProps) => {
    const topicS = topic || '';
    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        ref={helpRef}
        href={API_CONFIG.help + '/' + helpLanguage() + indexName + topicS}
        target="_blank"
        rel="noopener noreferrer"
      ></a>
    );
  };

  const indexName = '/index.htm';

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setShift(event.shiftKey);
    setAnchorEl(event.currentTarget);
  };

  const helpLanguage = () => {
    // let language = navigator.language.split('-')[0];
    // if (!['fr', 'es'].includes(language)) language = 'en';
    // return language;
    return 'en';
  };

  const execFolder = () => path.dirname((process as any).helperExecPath);

  const handleHelp = (topic?: string) => () => {
    const topicS = topic || '';
    if (isElectron) {
      const target = !online
        ? path.join(execFolder(), API_CONFIG.chmHelp)
        : API_CONFIG.help + '/' + helpLanguage() + indexName + topicS;
      launch(target, online);
    } else if (helpRef.current) {
      setTopic(topic || '');
      setHelpToggle(!helpToggle);
    }
    setAnchorEl(null);
  };

  const handleDeveloper = () => {
    localStorage.setItem('developer', !developer ? 'true' : 'false');
    setDeveloper(!developer);
    setAnchorEl(null);
  };

  const handle = (what: string) => () => {
    setAnchorEl(null);
    if (action) {
      action(what);
    }
  };

  const spreadsheetTopic = '#t=Concepts%2FSpreadsheet_convention.htm';

  React.useEffect(() => {
    if (helpRef.current && topic !== undefined) helpRef.current.click();
  }, [topic, helpToggle]);

  const isPlanScreen = React.useMemo(() => /\/plan\/[0-9]+\/0/.test(pathname), [
    pathname,
  ]);

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
        <StyledMenuItem onClick={handleHelp()}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary={t.helpCenter} />
        </StyledMenuItem>
        {isPlanScreen && (
          <StyledMenuItem onClick={handleHelp(spreadsheetTopic)}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary={t.helpSpreadsheet} />
          </StyledMenuItem>
        )}
        {isPlanScreen && !offline && (
          <a
            href={API_CONFIG.flatSample}
            style={{ textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StyledMenuItem>
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary={t.flatSample} />
            </StyledMenuItem>
          </a>
        )}
        {isPlanScreen && !offline && (
          <a
            href={API_CONFIG.hierarchicalSample}
            style={{ textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StyledMenuItem>
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary={t.hierarchicalSample} />
            </StyledMenuItem>
          </a>
        )}
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
      <HelpLink topic={topic} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(HelpMenu) as any;
