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
import {
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from `@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  logError,
  Severity,
  forceLogin,
  localUserKey,
  LocalKey,
} from '../utils';
import { withBucket } from './withBucket';
import Memory from '@orbit/memory';

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
      '& #detail': {
        textAlign: 'left',
        fontSize: 'small',
      },
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
  orbitDetails?: string;
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
  memory: Memory;
  resetRequests: () => Promise<void>;
  children: JSX.Element;
}

const initState = {
  errCount: 0,
  error: '',
  details: '',
  expanded: false,
  view: '',
};

export class ErrorBoundary extends React.Component<IProps, typeof initState> {
  constructor(props: IProps) {
    super(props);
    this.continue = this.continue.bind(this);
    this.logout = this.logout.bind(this);
    this.change = this.change.bind(this);
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
      ...this.state,
      errCount: this.state.errCount + 1,
      error: error?.error?.toString() || error.message,
      details: error.stack,
    });
  }

  change() {
    this.setState({ ...this.state, expanded: !this.state.expanded });
  }

  render() {
    const {
      classes,
      t,
      orbitStatus,
      orbitMessage,
      orbitDetails,
      errorReporter,
    } = this.props;

    const modalMessage = (message: ReactElement | string, details?: string) => {
      return (
        <div id="myModal" className={classes.modal} key={this.state.errCount}>
          <div className={classes.modalContent}>
            <Typography>{t.crashMessage}</Typography>
            {message}
            {(details || this.state.details) && (
              <Accordion expanded={this.state.expanded} onChange={this.change}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  {t.details}
                </AccordionSummary>
                <AccordionDetails id="detail">
                  {details || this.state.details}
                </AccordionDetails>
              </Accordion>
            )}
            <div className={classes.modalActions}>
              {orbitStatus !== 401 && (
                <Button
                  id="errCont"
                  variant="contained"
                  className={classes.button}
                  onClick={this.continue}
                >
                  {t.continue}
                </Button>
              )}
              <Button
                id="errLogout"
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
    //this didn't work because resetorbiterror sent us off to loading and it never come back to where we wanted
    //if (this.state.view !== '') return <Redirect to={this.state.view} />;

    if (this.state.errCount && localStorage.getItem('isLoggedIn')) {
      return modalMessage(this.state?.error || 'Error count > 0');
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
        </>,
        orbitDetails
      );
    } else if (orbitStatus === Severity.info) {
      logError(Severity.info, errorReporter, orbitMessage);
    }
    // If there is no error just render the children component.
    return this.props.children;
  }

  private async cleanUpAndGo(goNext: string) {
    const { resetOrbitError, resetRequests } = this.props;
    resetRequests().finally(() => {
      resetOrbitError(); //this resets state and sends us back to loading
      this.setState(initState);
      history.replace(goNext);
    });
  }

  private continue() {
    var deeplink = localStorage.getItem(localUserKey(LocalKey.url));
    if (!deeplink || deeplink === 'loading') deeplink = '/';
    this.cleanUpAndGo(deeplink);
  }

  private async logout() {
    await this.cleanUpAndGo('/logout');
    forceLogin();
  }
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitStatus: state.orbit.status,
  orbitMessage: state.orbit.message,
  orbitDetails: state.orbit.details,
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
