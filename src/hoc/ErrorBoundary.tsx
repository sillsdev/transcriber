import React, { ReactElement } from 'react';
import history from '../history';
import { IMainStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { bindActionCreators } from 'redux';
import * as actions from '../store';
import {
  withStyles,
  WithStyles,
  Theme,
  createStyles,
} from '@material-ui/core/styles';
import { Typography, Button } from '@material-ui/core';
import { logError, Severity } from '../components/logErrorService';
import { forceLogin } from '../utils';
import { withBucket } from './withBucket';

const styles = (theme: Theme) =>
  createStyles({
    modal: {
      position: 'fixed' /* Stay in place */,
      zIndex: 1 /* Sit on top */,
      paddingTop: '100px' /* Location of the box */,
      left: 0,
      top: 0,
      width: '100%' /* Full width */,
      height: '100%' /* Full height */,
      overflow: 'auto' /* Enable scroll if needed */,
      backgroundColor: 'rgba(0, 0, 0, 0.4)' /* Black w/ opacity */,
    },
    modalContent: {
      backgroundColor: '#fefefe',
      margin: 'auto',
      padding: '20px',
      border: '1px solid #888',
      width: '80%',
      height: '40%',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
    },
    modalActions: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    button: {
      margin: theme.spacing(1),
    },
  });

interface IStateProps {
  t: IMainStrings;
  orbitStatus: number | undefined;
  orbitMessage: string;
  orbitRetry: number;
}

interface IDispatchProps {
  resetOrbitError: typeof actions.resetOrbitError;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    WithStyles<typeof styles> {
  errorReporter: any;
  resetRequests: () => void;
  children: JSX.Element;
}

const initState = {
  errCount: 0,
  error: '',
};

export class ErrorBoundary extends React.Component<IProps, typeof initState> {
  constructor(props: IProps) {
    super(props);
    this.continue = this.continue.bind(this);
    this.logout = this.logout.bind(this);
    this.state = { ...initState };
  }

  componentDidCatch(error: any, info: any) {
    const { errorReporter } = this.props;

    if (!this.state.errCount) {
      logError(Severity.error, errorReporter, {
        message: error.message,
        name: 'Caught error',
        opts: {
          stack: error.stack,
          componentStack: info.componentStack,
        },
      } as any);
    }
    this.setState({
      errCount: this.state.errCount + 1,
      error: error.error.toString(),
    });
  }

  render() {
    const {
      classes,
      t,
      orbitStatus,
      orbitMessage,
      orbitRetry,
      errorReporter,
    } = this.props;

    const modalMessage = (message: ReactElement | string) => {
      return (
        <div id="myModal" className={classes.modal} key={this.state.errCount}>
          <div className={classes.modalContent}>
            <Typography>{t.crashMessage}</Typography>
            {message}
            <div className={classes.modalActions}>
              <Button
                variant="contained"
                className={classes.button}
                onClick={this.continue}
              >
                {t.continue}
              </Button>
              <Button
                variant="contained"
                className={classes.button}
                onClick={this.logout}
              >
                {t.logout}
              </Button>
            </div>
          </div>
        </div>
      );
    };

    if (this.state.errCount && localStorage.getItem('isLoggedIn')) {
      return modalMessage(this.state.error);
    }

    if (orbitStatus && orbitStatus >= 400) {
      logError(Severity.error, errorReporter, {
        message: orbitMessage,
        name: orbitStatus.toString(),
      });
      return modalMessage(
        <>
          {t.apiError + ' ' + orbitStatus.toString()}
          <br />
          {orbitMessage}
        </>
      );
    } else if (orbitStatus === Severity.info) {
      logError(Severity.info, errorReporter, orbitMessage);
    } else if (orbitStatus === Severity.retry) {
      logError(
        orbitRetry > 0 ? Severity.info : Severity.error,
        errorReporter,
        orbitMessage
      );
    }
    // If there is no error just render the children component.
    return this.props.children;
  }

  private continue() {
    this.props.resetOrbitError();
    this.props.resetRequests();
    this.setState({ ...initState });
    history.replace(localStorage.getItem('url') || '/');
  }

  private logout() {
    this.props.resetOrbitError();
    this.props.resetRequests();
    forceLogin();
    this.setState({ ...initState });
    history.replace('/logout');
  }
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitStatus: state.orbit.status,
  orbitMessage: state.orbit.message,
  orbitRetry: state.orbit.retry,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      resetOrbitError: actions.resetOrbitError,
    },
    dispatch
  ),
});

export default withStyles(styles)(
  connect(mapStateToProps, mapDispatchToProps)(withBucket(ErrorBoundary))
);
