import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from 'reactn';
import { IMainStrings, Plan } from '../model';
import { IconButton, ListItemIcon, ListItemText, SxProps } from '@mui/material';
import ReportIcon from '@mui/icons-material/Report';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { StyledMenu, StyledMenuItem } from '../control';
import path from 'path-browserify';
import { isElectron, API_CONFIG } from '../api-variable';
import {
  launch,
  launchCmd,
  dataPath,
  PathType,
  execFolder,
  restoreScroll,
} from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import AboutDialog from './AboutDialog';
import { usePlan, remoteIdGuid } from '../crud';
import { mainSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
const ipc = (window as any)?.electron;

interface IProps {
  online: boolean;
  action?: (what: string) => void;
  sx?: SxProps;
}

export function HelpMenu(props: IProps) {
  const { online, action } = props;
  const { pathname } = useLocation();
  const [offline] = useGlobal('offline');
  const [projType] = useGlobal('projType');
  const [memory] = useGlobal('memory');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shift, setShift] = React.useState(false);
  const [developer, setDeveloper] = useGlobal('developer');
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [topic, setTopic] = React.useState<string>();
  const [helpToggle, setHelpToggle] = React.useState(false);
  const { showMessage } = useSnackBar();
  const { getPlan } = usePlan();
  const helpRef = React.useRef<any>();
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);

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

  const handleHelp = (topic?: string) => async () => {
    const chmHelp = API_CONFIG.chmHelp;
    const helpUrl = API_CONFIG.help;
    const topicS = topic || '';
    const topicWin = topic && decodeURIComponent(topic.slice(3));
    if (isElectron) {
      const folder = await execFolder();
      // see https://stackoverflow.com/questions/22300244/open-a-chm-file-to-a-specific-topic
      if ((await ipc?.isWindows()) && topicWin && !online) {
        const target = `C:\\Windows\\hh.exe ${path.join(
          folder,
          chmHelp
        )}::${topicWin}`;
        launchCmd(target);
      } else if (topic && !online) {
        launchCmd(`xchm -c 1 ${path.join(folder, chmHelp)}`);
      } else {
        const target = !online
          ? path.join(folder, chmHelp)
          : helpUrl + '/' + helpLanguage() + indexName + topicS;
        launch(target, online);
      }
    } else if (helpRef.current) {
      setTopic(topic || '');
      setHelpToggle(!helpToggle);
    }
    setAnchorEl(null);
  };

  const handleDownload = (url: string, inOffline?: boolean) => async () => {
    const loc = inOffline !== undefined ? inOffline : offline;
    const urlObj = new URL(url);
    const name = urlObj.pathname.split('/').pop() || '';
    const folder = await execFolder();
    const localPath = loc
      ? path.join(folder, 'help', name)
      : dataPath(name, PathType.ZIP);
    if (!loc) await ipc?.downloadFile(url, localPath);
    launch(localPath, false);
    setAnchorEl(null);
    if (action) action('Download');
  };

  const handleReportIssue = () => {
    if (!online) showMessage(t.reportWhenOnline);
    else launch(API_CONFIG.community, online);
  };

  const handleDeveloper = () => {
    localStorage.setItem('developer', !developer ? 'true' : 'false');
    setDeveloper(!developer);
    setAnchorEl(null);
  };

  const handleAbout = (visible: boolean) => () => {
    if (visible !== aboutOpen) setAboutOpen(visible);
    restoreScroll();
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

  const planRec = React.useMemo(
    () => {
      const match = /\/plan\/([0-9a-f-]+)\/0/.exec(pathname);
      const planId =
        match && (remoteIdGuid('plan', match[1], memory.keyMap) || match[1]);
      return planId && getPlan(planId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );

  const sampleHref = React.useMemo(
    () => {
      if (!planRec) return '#';
      if (planRec.attributes.flat) {
        if (projType.toLowerCase() === 'scripture') {
          return API_CONFIG.flatSample;
        } else {
          return API_CONFIG.genFlatSample;
        }
      } else {
        if (projType.toLowerCase() === 'scripture') {
          return API_CONFIG.hierarchicalSample;
        } else {
          return API_CONFIG.genHierarchicalSample;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planRec, projType]
  );

  const sampleDesc = React.useMemo(() => {
    if (!planRec) return '';
    if (planRec.attributes.flat) {
      if (projType.toLowerCase() === 'scripture') {
        return t.flatSample;
      } else {
        return t.genFlatSample;
      }
    } else {
      if (projType.toLowerCase() === 'scripture') {
        return t.hierarchicalSample;
      } else {
        return t.genHierarchicalSample;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planRec, projType, (planRec as Plan)?.attributes?.flat]);

  return (
    <div id="helpMenu">
      <IconButton
        aria-controls="customized-menu"
        aria-haspopup="true"
        color="primary"
        onClick={handleClick}
      >
        <HelpIcon />
      </IconButton>
      <StyledMenu
        id="helpClose"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
        sx={props?.sx}
      >
        <StyledMenuItem id="helpHelp" onClick={handleHelp()}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary={t.helpCenter} />
        </StyledMenuItem>
        {planRec && (
          <StyledMenuItem id="helpSheet" onClick={handleHelp(spreadsheetTopic)}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary={t.helpSpreadsheet} />
          </StyledMenuItem>
        )}
        {planRec && !isElectron && (
          <a
            href={sampleHref}
            style={{ textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StyledMenuItem id="helpSampleOn">
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary={sampleDesc} />
            </StyledMenuItem>
          </a>
        )}
        {planRec && isElectron && (
          <StyledMenuItem
            id="helpSampleOff"
            onClick={handleDownload(sampleHref, isElectron)}
          >
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText primary={sampleDesc} />
          </StyledMenuItem>
        )}
        {isElectron && (
          <StyledMenuItem id="helpFeedbackOff" onClick={handleReportIssue}>
            <ListItemIcon>
              <ReportIcon />
            </ListItemIcon>
            <ListItemText primary={t.reportIssue} />
          </StyledMenuItem>
        )}
        {!isElectron && (
          <a
            href={API_CONFIG.community}
            style={{ textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StyledMenuItem id="helpFeedbackOn">
              <ListItemIcon>
                <ReportIcon />
              </ListItemIcon>
              <ListItemText primary={t.reportIssue} />
            </StyledMenuItem>
          </a>
        )}
        {shift && (
          <StyledMenuItem id="helpDevMode" onClick={handleDeveloper}>
            <ListItemIcon>
              {developer ? <RemoveIcon /> : <AddIcon />}
            </ListItemIcon>
            <ListItemText primary={t.developer} />
          </StyledMenuItem>
        )}
        <StyledMenuItem id="helpAbout" onClick={handleAbout(true)}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary={t.about} />
        </StyledMenuItem>
      </StyledMenu>
      <HelpLink topic={topic} />
      <AboutDialog open={aboutOpen} onClose={handleAbout(false)} />
    </div>
  );
}

export default HelpMenu;
