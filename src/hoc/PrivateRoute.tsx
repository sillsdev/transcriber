import React from 'react';
import { useGlobal } from 'reactn';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import Auth from '../auth/Auth';
import { LocalKey, localUserKey } from '../utils';

interface IProps extends RouteProps {
  auth: Auth;
  children: JSX.Element;
}

export function PrivateRoute({ auth, children, ...rest }: IProps) {
  const [offline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (offline || auth.isAuthenticated()) return children;
        if (typeof location?.pathname === 'string')
          localStorage.setItem(
            localUserKey(LocalKey.deeplink, memory),
            location?.pathname
          );
        return (
          <Redirect
            to={{
              pathname: '/',
              state: { from: location },
            }}
          />
        );
      }}
    />
  );
}
export default PrivateRoute;
