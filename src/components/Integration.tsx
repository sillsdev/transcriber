import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState } from '../model';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Typography,
  FormLabel,
  FormControl,
  FormGroup,
  FormControlLabel,
  FormHelperText,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SyncIcon from '@material-ui/icons/Sync';
import CheckIcon from '@material-ui/icons/Check';
import SnackBar from '../components/SnackBar';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    panel: {
      flexDirection: 'column',
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
    legend: {
      paddingTop: theme.spacing(4),
    },
    formControl: {
      margin: theme.spacing(3),
    },
    explain: {
      marginTop: 0,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    avatar: {
      color: 'green',
    },
  })
);

interface IStateProps {}

interface IRecordProps {}

interface IProps extends IStateProps, IRecordProps, WithDataProps {}

export function Integration(props: IProps) {
  const classes = useStyles();
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [memory] = useGlobal('memory');
  const [online, setOnline] = React.useState(true);
  const [hasPtProj, setHasPtProj] = React.useState(true);
  const [ptProj, setPtProj] = React.useState('Swahili');
  const [hasParatext, setHasParatext] = React.useState(true);
  const [ptAcct, setPtAcct] = React.useState('SJHTest');
  const [hasPermission, setHasPermission] = React.useState(true);
  const [ptPermission, setPtPermission] = React.useState('Translator');
  const [count, setCount] = React.useState(2);
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [message, setMessage] = React.useState(<></>);

  const handleMessageReset = () => () => {
    setMessage(<></>);
  };

  return (
    <div className={classes.root}>
      <ExpansionPanel defaultExpanded>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography className={classes.heading}>{'Paratext'}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panel}>
          <List dense component="div">
            <ListItem key="online">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!online || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={'Are you connected to the Internet?'}
                secondary={online ? 'Yes' : 'No'}
              />
            </ListItem>
            <ListItem key="hasProj">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!online || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={'Are you connected to a Paratext Project?'}
                secondary={hasPtProj ? 'Yes, ' + ptProj : 'No'}
              />
            </ListItem>
            <ListItem key="hasParatext">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!online || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={'Do you have a Paratext Account?'}
                secondary={hasParatext ? 'Yes, ' + ptAcct : 'No'}
              />
            </ListItem>
            <ListItem key="hasPermission">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!online || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={'Do you have permission to edit the Paratext project?'}
                secondary={hasPermission ? 'Yes, as a ' + ptPermission : 'No'}
              />
            </ListItem>
          </List>

          <FormControl component="fieldset" className={classes.formControl}>
            <FormGroup>
              <FormLabel component="p">
                {'Sections ready to sync: ' + count}
              </FormLabel>
              <FormControlLabel
                control={
                  <Button
                    key="sync"
                    aria-label={'sync'}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    disabled={
                      !online || !hasPtProj || !hasParatext || !hasPermission
                    }
                    onClick={() => setMessage(<span>{'Not implemented'}</span>)}
                  >
                    {'Sync'}
                    <SyncIcon className={classes.icon} />
                  </Button>
                }
                label=""
              />
              <FormHelperText>
                {'You must satisfy all four criteria to sync'}
              </FormHelperText>
            </FormGroup>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
        >
          <Typography className={classes.heading}>{'Render'}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Typography>{'Not Implemented'}</Typography>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel disabled>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
        >
          <Typography className={classes.heading}>{'One Story'}</Typography>
        </ExpansionPanelSummary>
      </ExpansionPanel>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({});

const mapRecordsToProps = {};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  Integration
) as any) as any;
