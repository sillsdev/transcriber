/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { IMainStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import {
  Dialog,
  DialogTitle,
  Button,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Link,
  Tooltip,
  Box,
  BoxProps,
} from '@mui/material';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { API_CONFIG } from '../api-variable';
import about from '../assets/about.json';
import stringReplace from 'react-string-replace';
import { useSnackBar } from '../hoc/SnackBar';
import { ApmLogo } from '../control/ApmLogo';
const version = require('../../package.json').version;
const copyright = require('../../package.json').build.copyright;
const author = require('../../package.json').author.name;
const buildDate = require('../buildDate.json').date;

const StyledHeading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightRegular,
}));

const CopyrightText = styled(Typography)<TypographyProps>(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const ProductIdentBox = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const Paragraphs = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const VersionDiv = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

interface ItemsProps {
  items: string[];
  kid: string;
}
const ListItems = ({ items, kid }: ItemsProps) => {
  const part = (s: string, i: number) => s.split('|')[i];

  return (
    <List dense>
      {items.map((i, n) => (
        <ListItem key={`${kid}-${n}`}>
          <ListItemText>
            {stringReplace(part(i, 0), part(i, 1), (m: string) => (
              <Link
                key={`${kid}-${n}-link`}
                href={part(i, 2)}
                target="_blank"
                rel="noopener noreferrer"
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

const ParaItems = ({ items, kid }: ItemsProps) => {
  return (
    <Paragraphs>
      {items.map((i, n) => (
        <Typography key={`${kid}-${n}`} sx={{ p: 1 }}>
          {i}
        </Typography>
      ))}
    </Paragraphs>
  );
};

interface LicenseProps {
  title: string;
  url: string;
  text: string[];
  product: string[];
  kid: string;
}

const LicenseAccordion = ({ title, url, text, product, kid }: LicenseProps) => {
  return (
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <StyledHeading>
            {
              <Link href={url} target="_blank" rel="noopener noreferrer">
                {title}
              </Link>
            }
          </StyledHeading>
        </AccordionSummary>
        <AccordionDetails>
          <ParaItems items={text} kid={`${kid}-pa`} />
        </AccordionDetails>
      </Accordion>
      <ListItems items={product} kid={`${kid}-po`} />
    </>
  );
};

interface IStateProps {
  t: IMainStrings;
}

interface AboutDialogProps extends IStateProps {
  open: boolean;
  onClose: () => void;
}

function AboutDialog(props: AboutDialogProps) {
  const { onClose, open, t } = props;
  const { showMessage } = useSnackBar();

  const handleClose = () => onClose();
  const handleExit = () => onClose();

  const handleVersionCopy = () => {
    navigator.clipboard
      .writeText(`${API_CONFIG.productName} ${version} - ${buildDate}`)
      .catch(() => {
        showMessage(t.cantCopy);
      });
  };

  return (
    <Dialog
      id="about"
      onClose={handleClose}
      aria-labelledby="aboutDlg"
      open={open}
      scroll={'paper'}
      disableEnforceFocus
    >
      <DialogTitle id="aboutDlg">{t.about}</DialogTitle>
      <DialogContent id="about-version" sx={{ px: 4 }}>
        <Tooltip title={t.copyClipboard} onClick={handleVersionCopy}>
          <div>
            <ProductIdentBox>
              <ApmLogo sx={{ width: '64px', height: '64px' }} />
              {'\u00A0'}
              <Typography variant="h4">{API_CONFIG.productName}</Typography>
            </ProductIdentBox>
            <VersionDiv>
              {t.version.replace('{0}', version).replace('{1}', buildDate)}
            </VersionDiv>
            <CopyrightText>
              {copyright.replace('${author}', author)}
            </CopyrightText>
          </div>
        </Tooltip>
        <Typography variant="h6">{t.team}</Typography>
        <ListItems items={about.people} kid="pe" />
        <Typography variant="h6">{t.thanks}</Typography>
        <ListItems items={about.thanks} kid="th" />
        <Typography variant="h6">
          {t.reliesOn.replace('{0}', API_CONFIG.productName)}
        </Typography>
        <LicenseAccordion {...about.mit} kid="mit" />
        <LicenseAccordion {...about.bsd} kid="bsd" />
        <LicenseAccordion {...about.apache} kid="ap" />
        <LicenseAccordion {...about.mpl} kid="apl" />
        <LicenseAccordion {...about.LGPLv21} kid="gpl" />
        <LicenseAccordion {...about.icons8} kid="ic8" />
      </DialogContent>
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
