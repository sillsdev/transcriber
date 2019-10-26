import React from 'react';
import { Link } from 'react-router-dom';
import { IMainStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import {
  withStyles,
  WithStyles,
  Theme,
  createStyles,
} from '@material-ui/core/styles';
import { Typography, Button } from '@material-ui/core';
import { logError } from './logErrorService';

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
  });

interface IStateProps {
  t: IMainStrings;
}

interface IProps extends IStateProps, WithStyles<typeof styles> {
  children: JSX.Element;
}

interface ErrorBoundaryProps {
  hasError: boolean;
  error: string;
}
export class ErrorBoundary extends React.Component<IProps, ErrorBoundaryProps> {
  constructor(props: IProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(error: any, info: any) {
    // You can also log the error to an error reporting service
    logError(error, info);
  }

  render() {
    const { classes, t } = this.props;

    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div id="myModal" className={classes.modal}>
          <div className={classes.modalContent}>
            <Typography>{t.crashMessage}</Typography>
            {this.state.error}
            <Link to="/logout">
              <Button variant="contained">{t.logout}</Button>
            </Link>
          </div>
        </div>
      );
    }

    // If there is no error just render the children component.
    return this.props.children;
  }
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default withStyles(styles)(connect(mapStateToProps)(ErrorBoundary));
