import React, { useContext } from 'react';
import { useGlobal } from 'reactn';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { TokenContext } from '../context/TokenProvider';
import { LocalKey, localUserKey } from '../utils';

interface IProps extends RouteProps {
  children: JSX.Element;
}

export function PrivateRoute({ children, ...rest }: IProps) {
  const [offline] = useGlobal('offline');
  const { isAuthenticated } = useContext(TokenContext).state;

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (offline || isAuthenticated()) return children;
        if (typeof location?.pathname === 'string')
          localStorage.setItem(
            localUserKey(LocalKey.deeplink),
            location?.pathname
          );
        if (!location?.pathname?.endsWith('null'))
          localStorage.setItem(localUserKey(LocalKey.url), location?.pathname);
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
