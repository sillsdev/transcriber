import React from 'react';
import { connect } from 'react-redux';
import { IState, ISetupStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import { isElectron } from '../api-variable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fullScreen: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      width: '100%',
      height: `calc(100vh - 120px)`,
    },
    list: {
      alignSelf: 'center',
    },
  })
);

interface IStateProps {
  t: ISetupStrings;
}

interface IProps extends IStateProps {}

export const Setup = (props: IProps) => {
  const { t } = props;
  const classes = useStyles();
  return (
    <div className={classes.fullScreen}>
      <Typography align="center" variant="h3">
        {isElectron ? t.electronTitle : t.gettingStarted}
      </Typography>
      <List className={classes.list}>
        <ListItem>
          <ListItemAvatar>
            <Avatar>1.</Avatar>
          </ListItemAvatar>
          <ListItemText primary={isElectron ? t.electronStep1 : t.addPlan} />
        </ListItem>
        <ListItem>
          <ListItemAvatar>
            <Avatar>2.</Avatar>
          </ListItemAvatar>
          <ListItemText primary={isElectron ? t.electronStep2 : t.upload} />
        </ListItem>
        <ListItem>
          <ListItemAvatar>
            <Avatar>3.</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={isElectron ? t.assign : t.attach}
            secondary={isElectron ? t.offlineNote : ''}
          />
        </ListItem>
        <ListItem>
          <ListItemAvatar>
            <Avatar>4.</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={isElectron ? t.electronStep4 : t.assign}
            secondary={isElectron ? '' : t.offlineNote}
          />
        </ListItem>
      </List>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'setup' }),
});

export default connect(mapStateToProps)(Setup) as any;
