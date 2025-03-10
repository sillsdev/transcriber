import React, { useRef, useState } from 'react';
import { ITemplateStrings } from '../../model';
import {
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  List,
  ListItemText,
  ListItemIcon,
  SxProps,
  ListItemButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import InfoIcon from '@mui/icons-material/Info';
import { useOrganizedBy } from '../../crud';
import { IMatchData } from './makeRefMap';
import { templateSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { addPt } from '../../utils/addPt';
import { Render } from '../../assets/brands';

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
    BOOK: addPt(t.book),
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
  const [template, setTemplatex] = useState<string>();
  const [templateInfo, setTemplateInfo] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
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
    if (templateRef.current) {
      const el = templateRef.current?.firstChild as HTMLLabelElement;
      const attrs = el.attributes as any;
      if (attrs['data-shrink'].nodeValue === 'false') {
        el.style.translate = '12px 7px';
        el.style.transform = 'scale(75%)';
      }
    }
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
        setTemplate('{SECT}');
        // const planRecs = memory?.cache.query((q) =>
        //   q.findRecords('plan')
        // ) as Plan[];
        // const myPlan = planRecs.filter((p) => p.id === plan);
        // if (myPlan.length > 0) {
        //   const planTypeRec = memory?.cache.query((q) =>
        //     q.findRecord({
        //       type: 'plantype',
        //       id: related(myPlan[0], 'plantype'),
        //     })
        //   ) as PlanType;
        //   setTemplate(
        //     planTypeRec?.attributes?.name.toLocaleLowerCase() !== 'other'
        //       ? '{BOOK}-{CHAP}-{BEG}-{END}'
        //       : '{CHAP}-{BEG}-{END}'
        //   );
        // }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <>
      <TextField
        ref={templateRef}
        label={t.autoMatchTemplate}
        variant="filled"
        sx={{ mx: 2, width: '600px' }}
        value={template ?? ''}
        onChange={handleTemplateChange}
        helperText={
          template === '{SECT}'
            ? t.renderExportTemplate.replace('{0}', Render)
            : undefined
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {
                <>
                  <IconButton
                    id="templApply"
                    sx={iconProps}
                    aria-label={t.apply}
                    onClick={handleApply}
                    title={t.apply}
                  >
                    <DoneIcon />
                  </IconButton>
                  <Divider
                    orientation="vertical"
                    sx={{ height: '28px', m: '4px' }}
                  />
                  <IconButton
                    id="templCodes"
                    color="primary"
                    sx={iconProps}
                    onClick={handleTemplateInfo}
                    title={t.templateCodes}
                  >
                    <InfoIcon />
                  </IconButton>
                </>
              }
            </InputAdornment>
          ),
        }}
      />
      <InfoDialog
        open={templateInfo}
        onClose={handleClose}
        onClick={handleClick}
        organizedBy={organizedBy}
      />
    </>
  );
}
export default Template;
