import React from 'react';
import { IMainStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  Button,
  DialogContentText,
  DialogActions,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Link,
  Tooltip,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import logo from '../routes/LogoNoShadow-4x.png';
import { API_CONFIG } from '../api-variable';
import about from '../assets/about.json';
import stringReplace from 'react-string-replace';
import { useSnackBar } from '../hoc/SnackBar';
import { useExternalLink } from './useExternalLink';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    icon: {
      alignSelf: 'center',
      width: '64px',
      height: '64px',
    },
    row: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
    },
    version: {
      paddingTop: theme.spacing(2),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    },
    para: {
      padding: theme.spacing(1),
    },
    heading: {
      fontSize: theme.typography.pxToRem(15) as any,
      fontWeight: theme.typography.fontWeightRegular as any,
    },
  })
);

interface IStateProps {
  t: IMainStrings;
}

interface AboutDialogProps extends IStateProps {
  open: boolean;
  onClose: () => void;
}

function AboutDialog(props: AboutDialogProps) {
  const { onClose, open, t } = props;
  const classes = useStyles();
  const { showMessage } = useSnackBar();
  const { handleLaunch, ExternalLink, externalUrl } = useExternalLink();

  const handleClose = () => onClose();
  const handleExit = () => onClose();

  const handleVersionCopy = () => {
    navigator.clipboard
      .writeText(`${API_CONFIG.productName} ${version} - ${buildDate}`)
      .catch(() => {
        showMessage(t.cantCopy);
      });
  };

  interface ItemsProps {
    items: string[];
  }
  const ListItems = ({ items }: ItemsProps) => {
    const part = (s: string, i: number) => s.split('|')[i];

    return (
      <List dense>
        {items.map((i) => (
          <ListItem>
            <ListItemText>
              {stringReplace(part(i, 0), part(i, 1), (m: string) => (
                <Link
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLaunch(part(i, 2))}
                >
                  {m}
                </Link>
              ))}
            </ListItemText>
          </ListItem>
        ))}
      </List>
    );
  };

  const ParaItems = ({ items }: ItemsProps) => {
    return (
      <div className={classes.column}>
        {items.map((i) => (
          <Typography className={classes.para}>{i}</Typography>
        ))}
      </div>
    );
  };

  interface LicenseProps {
    title: string;
    url: string;
    text: string[];
    product: string[];
  }

  const LicenseAccordion = (lic: LicenseProps) => {
    return (
      <>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography className={classes.heading}>
              {
                <Link
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLaunch(lic.url)}
                >
                  {lic.title}
                </Link>
              }
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ParaItems items={lic.text} />
          </AccordionDetails>
        </Accordion>
        <ListItems items={lic.product} />
      </>
    );
  };

  return (
    <Dialog
      id="about"
      onClose={handleClose}
      aria-labelledby="aboutDlg"
      open={open}
      scroll={'paper'}
    >
      <DialogTitle id="aboutDlg">{t.about}</DialogTitle>
      <DialogContentText id="about-version" className={classes.text}>
        <Tooltip title={t.copyClipboard} onClick={handleVersionCopy}>
          <div>
            <div className={classes.row}>
              <img src={logo} className={classes.icon} alt="logo" />
              {'\u00A0'}
              <Typography variant="h4">{API_CONFIG.productName}</Typography>
            </div>
            <div className={classes.version}>
              {t.version.replace('{0}', version).replace('{1}', buildDate)}
            </div>
            <Typography className={classes.row}>
              {'Copyright \u00A9 2019-2021 SIL International'}
            </Typography>
          </div>
        </Tooltip>
        <Typography variant="h6">{t.team}</Typography>
        <ListItems items={about.people} />
        <Typography variant="h6">{t.thanks}</Typography>
        <ListItems items={about.thanks} />
        <Typography variant="h6">
          {t.reliesOn.replace('{0}', API_CONFIG.productName)}
        </Typography>
        <LicenseAccordion {...about.mit} />
        <LicenseAccordion {...about.bsd} />
        <LicenseAccordion {...about.apache} />
        <LicenseAccordion {...about.mpl} />
        <LicenseAccordion {...about.LGPLv21} />
        <LicenseAccordion {...about.icons8} />
        <ExternalLink externalUrl={externalUrl} />
      </DialogContentText>
      <DialogActions>
        <Button id="aboutExit" variant="outlined" onClick={handleExit}>
          {t.exit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(AboutDialog);
