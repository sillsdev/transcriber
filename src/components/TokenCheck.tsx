import React from 'react';
import history from '../history';
import { IState } from '../model';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import TokenDialog from './TokenDialog';
import moment from 'moment';
import Auth from '../auth/Auth';
import jwtDecode from 'jwt-decode';

interface IStateProps {
  expireAt: number | undefined;
}

interface IDispatchProps {
  setExpireAt: typeof actions.setExpireAt;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  children: JSX.Element;
}

function TokenCheck(props: IProps) {
  const { auth, children, expireAt, setExpireAt } = props;
  const [modalOpen, setModalOpen] = React.useState(false);
  const [secondsToExpire, setSecondsToExpire] = React.useState(0);
  const [view, setView] = React.useState('');
  const timer = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      auth.renewSession();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  React.useEffect(() => {
    if (expireAt) {
      timer.current = setInterval(() => {
        const currentUnix = moment().format('X');
        const expires = moment.unix(expireAt).format('X');
        const secondsLeft = Number(expires) - Number(currentUnix);
        if (secondsLeft < 30) {
          setSecondsToExpire(secondsLeft);
          setModalOpen(true);
        }
      }, 1000);
    }
  }, [expireAt]);

  const handleClose = (value: number) => {
    setModalOpen(false);
    if (timer.current) clearInterval(timer.current);
    if (value < 0) {
      setView('Logout');
    } else {
      auth
        .renewSession()
        .then(() => {
          const decodedToken: any = jwtDecode(auth.getAccessToken());
          setExpireAt(decodedToken.exp);
        })
        .catch((e: any) => {
          setView('Logout');
          console.log(e);
        });
    }
  };

  if (modalOpen && view === '') {
    if (secondsToExpire < 0) {
      if (timer.current) clearInterval(timer.current);
      setView('Logout');
    }
    return (
      <TokenDialog
        seconds={secondsToExpire}
        open={modalOpen}
        onClose={handleClose}
      />
    );
  } else if (view === 'Logout') {
    auth.logout();
    history.replace('/');
    setView('loggedOut');
  }

  // If there is no error just render the children component.
  return children;
}

const mapStateToProps = (state: IState): IStateProps => ({
  expireAt: state.auth.expireAt,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      setExpireAt: actions.setExpireAt,
    },
    dispatch
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TokenCheck);
