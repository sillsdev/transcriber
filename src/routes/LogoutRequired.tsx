import React from 'react';
import { connect } from 'react-redux';
import { IState, IMainStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

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
  t: IMainStrings;
}

interface IProps extends IStateProps {}

export const LogoutRequired = (props: IProps) => {
  const { t } = props;
  const classes = useStyles();
  return (
    <div className={classes.fullScreen}>
      <Typography align="center" variant="h3">
        {t.logoutRequired}
      </Typography>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(LogoutRequired) as any;
