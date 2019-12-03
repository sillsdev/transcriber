import React from 'react';
import { IState, IDeleteExpansionStrings } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Typography,
  FormGroup,
  FormLabel,
  Button,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

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
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
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
}

export function DeleteExpansion(props: IProps) {
  const { t, handleDelete, title, explain } = props;
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography className={classes.heading}>{t.advanced}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panel}>
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
                <p>{explain}</p>
              </FormLabel>
            </div>
            <div className={classes.grow}>{'\u00A0'}</div>
            <div className={classes.deletePos}>
              <Button
                key="delete"
                color="secondary"
                aria-label={t.delete}
                variant="contained"
                className={classes.button}
                onClick={handleDelete}
              >
                {t.delete}
              </Button>
            </div>
          </FormGroup>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'deleteExpansion' }),
});

export default connect(mapStateToProps)(DeleteExpansion) as any;
