import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { ITemplateStrings, Plan, PlanType } from '../../model';
import { QueryBuilder } from '@orbit/data';
import {
  Paper,
  InputBase,
  Divider,
  IconButton,
  InputLabel,
  Dialog,
  DialogTitle,
  List,
  ListItemText,
  ListItemIcon,
  SxProps,
  ListItemButton,
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import InfoIcon from '@mui/icons-material/Info';
import { related, useOrganizedBy } from '../../crud';
import { IMatchData } from './makeRefMap';
import { templateSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IstrMap {
  [key: string]: string;
}

const iconProps = { p: 1 } as SxProps;

interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  onClick: (template: string) => void;
  organizedBy: string;
}

const InfoDialog = (props: InfoDialogProps) => {
  const { onClose, onClick, open, organizedBy } = props;
  const t: ITemplateStrings = useSelector(templateSelector, shallowEqual);

  const pattern: IstrMap = {
    BOOK: t.book,
    BOOKNAME: t.bookname,
    SECT: organizedBy,
    PASS: t.passage.replace('{0}', organizedBy),
    CHAP: t.chapter,
    BEG: t.beginning,
    END: t.end,
  };

  const handleClose = () => {
    onClose();
  };

  const handleListItemClick = (index: number) => {
    onClick(Object.keys(pattern)[index]);
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      aria-labelledby="templDlg"
      disableEnforceFocus
    >
      <DialogTitle id="templDlg">{t.templateCodes}</DialogTitle>
      <List>
        {Object.keys(pattern).map((pat, index) => (
          <ListItemButton key={pat} onClick={() => handleListItemClick(index)}>
            <ListItemIcon>{`{${pat}}`}</ListItemIcon>
            <ListItemText primary={pattern[pat]} />
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
};

export interface ITemplateProps {
  matchMap: (pat: string, options: IMatchData) => void;
  options: IMatchData;
}

export function Template(props: ITemplateProps) {
  const { matchMap, options } = props;
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [template, setTemplatex] = useState<string>();
  const [templateInfo, setTemplateInfo] = useState(false);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const t: ITemplateStrings = useSelector(templateSelector, shallowEqual);

  const setTemplate = (t: string) => {
    setTemplatex(t);
    localStorage.setItem('template', t);
  };
  const handleTemplateChange = (e: any) => {
    setTemplate(e.target.value);
  };

  const handleTemplateInfo = () => {
    setTemplateInfo(!templateInfo);
  };

  const handleClose = () => {
    setTemplateInfo(false);
  };
  const handleClick = (newpart: string) => {
    setTemplate(template + `{${newpart}}`);
  };

  const handleApply = () => {
    if (!template) return;
    const terms = template
      .match(/{([A-Za-z]{3,8})}/g)
      ?.map((v) => v.slice(1, -1));
    const rex: IstrMap = {
      BOOK: '([A-Z1-3]{3})',
      BOOKNAME: '([A-Za-z]+)',
      SECT: '([0-9]+)',
      PASS: '([0-9]+)',
      CHAP: '([0-9]{1,3})',
      BEG: '([0-9]{1,3})',
      END: '([0-9]{1,3})',
    };

    let sPat = template;
    if (terms)
      for (let t of terms) {
        sPat = sPat.replace('{' + t + '}', rex[t]);
      }
    matchMap(sPat, { ...options, terms });
  };

  React.useEffect(() => {
    if (!template) {
      const lastTemplate = localStorage.getItem('template');
      if (lastTemplate) {
        setTemplate(lastTemplate);
      } else {
        const planRecs = memory.cache.query((q: QueryBuilder) =>
          q.findRecords('plan')
        ) as Plan[];
        const myPlan = planRecs.filter((p) => p.id === plan);
        if (myPlan.length > 0) {
          const planTypeRec = memory.cache.query((q: QueryBuilder) =>
            q.findRecord({
              type: 'plantype',
              id: related(myPlan[0], 'plantype'),
            })
          ) as PlanType;
          setTemplate(
            planTypeRec?.attributes?.name.toLocaleLowerCase() !== 'other'
              ? '{BOOK}-{CHAP}-{BEG}-{END}'
              : '{CHAP}-{BEG}-{END}'
          );
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <Paper
      component="form"
      sx={{
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: 600,
      }}
    >
      <InputLabel>{`${t.fileTemplate}:`}</InputLabel>
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        value={template}
        onChange={handleTemplateChange}
      />
      <IconButton
        id="templApply"
        sx={iconProps}
        aria-label={t.apply}
        onClick={handleApply}
        title={t.apply}
      >
        <DoneIcon />
      </IconButton>
      <Divider orientation="vertical" sx={{ height: '28px', m: '4px' }} />
      <IconButton
        id="templCodes"
        color="primary"
        sx={iconProps}
        onClick={handleTemplateInfo}
        title={t.templateCodes}
      >
        <InfoIcon />
      </IconButton>
      <InfoDialog
        open={templateInfo}
        onClose={handleClose}
        onClick={handleClick}
        organizedBy={organizedBy}
      />
    </Paper>
  );
}
export default Template;
