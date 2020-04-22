import React from 'react';
import { connect } from 'react-redux';
import { IState, INotSetupStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
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
  })
);

interface IStateProps {
  t: INotSetupStrings;
}

interface IProps extends IStateProps {}

export const NotSetup = (props: IProps) => {
  const { t } = props;
  const classes = useStyles();
  return (
    <div className={classes.fullScreen}>
      <Typography align="center" variant="h3">
        {t.welcome}
      </Typography>
      <Typography align="center">
        {isElectron ? t.electronNotReady : t.notReady}
      </Typography>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'notSetup' }),
});

export default connect(mapStateToProps)(NotSetup) as any;
