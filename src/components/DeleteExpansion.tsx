import React from 'react';
import { IState, IDeleteExpansionStrings } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormGroup,
  FormLabel,
  Button,
} from '@material-ui/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    panel: {
      display: 'flex',
      flexDirection: 'column',
    },
    grow: {
      flexGrow: 1,
    },
    heading: {
      fontSize: theme.typography.pxToRem(15) as any,
      fontWeight: theme.typography.fontWeightRegular as any,
    },
    dangerGroup: {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
      padding: '20px',
      border: '1px solid',
      borderColor: theme.palette.secondary.main,
    },
    dangerHeader: {
      paddingBottom: '10px',
    },
    deletePos: {
      alignSelf: 'center',
    },
    button: {
      margin: theme.spacing(1),
    },
    label: {},
  })
);

interface IStateProps {
  t: IDeleteExpansionStrings;
}

interface IProps extends IStateProps {
  title: string;
  explain: string;
  handleDelete: () => void;
  inProgress: boolean;
}

export function DeleteExpansion(props: IProps) {
  const { t, handleDelete, title, explain, inProgress } = props;
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography className={classes.heading}>{t.advanced}</Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.panel}>
          <FormLabel className={classes.label}>
            <Typography variant="h5" className={classes.dangerHeader}>
              {t.dangerZone}
            </Typography>
          </FormLabel>
          <FormGroup className={classes.dangerGroup}>
            <div>
              <FormLabel className={classes.label}>
                <Typography variant="h6">{title}</Typography>
              </FormLabel>
              <FormLabel className={classes.label}>
                <div>{explain}</div>
              </FormLabel>
            </div>
            <div className={classes.grow}>{'\u00A0'}</div>
            <div className={classes.deletePos}>
              <Button
                id="deleteExpand"
                key="delete"
                color="secondary"
                aria-label={t.delete}
                variant="contained"
                className={classes.button}
                onClick={handleDelete}
                disabled={inProgress}
              >
                {t.delete}
              </Button>
            </div>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'deleteExpansion' }),
});

export default connect(mapStateToProps)(DeleteExpansion) as any;
