import React from 'react';
import { IMainStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { logError, Severity } from '../utils';
import { withBucket } from './withBucket';
import { ModalMessage } from '../components/ErrorPage';

interface IStateProps {
  t: IMainStrings;
  orbitStatus: number | undefined;
  orbitMessage: string;
  orbitDetails?: string;
}

interface IProps extends IStateProps {
  errorReporter: any;
  children: JSX.Element;
}

const initState = {
  errCount: 0,
  error: '',
  details: '',
  view: '',
};

export class ErrorBoundary extends React.Component<IProps, typeof initState> {
  constructor(props: IProps) {
    super(props);
    this.handleReset = this.handleReset.bind(this);
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

  handleReset() {
    this.setState(initState);
  }

  render() {
    const { t, orbitStatus, orbitMessage, orbitDetails, errorReporter } =
      this.props;

    if (this.state.errCount && localStorage.getItem('isLoggedIn')) {
      return (
        <ModalMessage
          message={this.state?.error || 'Error count > 0'}
          state={this.state}
          resetState={this.handleReset}
        />
      );
    }

    if (orbitStatus && orbitStatus >= 400) {
      logError(Severity.error, errorReporter, {
        message: orbitMessage,
        name: orbitStatus.toString(),
      });
      return (
        <ModalMessage
          message={
            <>
              {t.apiError + ' ' + orbitStatus.toString()}
              <br />
              {orbitMessage}
            </>
          }
          details={orbitDetails}
          state={this.state}
          resetState={this.handleReset}
        />
      );
    } else if (orbitStatus === Severity.info) {
      logError(Severity.info, errorReporter, orbitMessage);
    }
    // If there is no error just render the children component.
    return this.props.children;
  }
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitStatus: state.orbit.status,
  orbitMessage: state.orbit.message,
  orbitDetails: state.orbit.details,
});

export default connect(mapStateToProps)(withBucket(ErrorBoundary));
