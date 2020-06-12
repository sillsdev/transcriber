import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { IState, ITemplateStrings, Plan, PlanType } from '../model';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {
  Paper,
  InputBase,
  Divider,
  IconButton,
  InputLabel,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@material-ui/core';
import DoneIcon from '@material-ui/icons/Done';
import InfoIcon from '@material-ui/icons/Info';
import { related } from '../utils';

interface IstrMap {
  [key: string]: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      width: 600,
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1,
    },
    iconButton: {
      padding: 10,
    },
    divider: {
      height: 28,
      margin: 4,
    },
  })
);

interface IStateProps {
  t: ITemplateStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'template' }),
});

interface InfoDialogProps extends IStateProps {
  open: boolean;
  onClose: () => void;
}

const InfoDialog = connect(mapStateToProps)((props: InfoDialogProps) => {
  const { onClose, open, t } = props;

  const pattern: IstrMap = {
    BOOK: t.book,
    SECT: t.section,
    PASS: t.passage,
    CHAP: t.chapter,
    BEG: t.beginning,
    END: t.end,
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{'Template codes'}</DialogTitle>
      <List>
        {Object.keys(pattern).map((pat) => (
          <ListItem button key={pat}>
            <ListItemIcon>{`{${pat}}`}</ListItemIcon>
            <ListItemText primary={pattern[pat]} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
});

export interface ITemplateProps extends IStateProps {
  matchMap: (pat: string, terms?: string[]) => void;
}

export function Template(props: ITemplateProps) {
  const { t, matchMap } = props;
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const classes = useStyles();
  const [template, setTemplate] = React.useState<string>();
  const [templateInfo, setTemplateInfo] = React.useState(false);

  const handleTemplateChange = (e: any) => {
    setTemplate(e.target.value);
    localStorage.setItem('template', e.target.value);
  };

  const handleTemplateInfo = () => {
    setTemplateInfo(!templateInfo);
  };

  const handleClose = () => {
    setTemplateInfo(false);
  };

  const handleApply = () => {
    if (!template) return;
    const terms = template
      .match(/{([A-Za-z]{3,4})}/g)
      ?.map((v) => v.slice(1, -1));
    const rex: IstrMap = {
      BOOK: '([A-Z1-3]{3})',
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
    matchMap(sPat, terms);
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
    <Paper component="form" className={classes.root}>
      <InputLabel>{`${t.fileTemplate}:`}</InputLabel>
      <InputBase
        className={classes.input}
        value={template}
        onChange={handleTemplateChange}
      />
      <IconButton
        className={classes.iconButton}
        aria-label={t.apply}
        onClick={handleApply}
        title={t.apply}
      >
        <DoneIcon />
      </IconButton>
      <Divider className={classes.divider} orientation="vertical" />
      <IconButton
        color="primary"
        className={classes.iconButton}
        onClick={handleTemplateInfo}
        title={t.templateCodes}
      >
        <InfoIcon />
      </IconButton>
      <InfoDialog open={templateInfo} onClose={handleClose} />
    </Paper>
  );
}
export default connect(mapStateToProps)(Template);
