import { useState } from 'react';
import clsx from 'clsx';
import { connect } from 'react-redux';
import { IState, IUserListModeStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actionToggle: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      '& .MuiButton-label': {
        fontSize: 'x-small',
      },
    },
    bar: {
      fontSize: 'x-small',
    },
    modeSelect: {
      textDecoration: 'underline',
    },
  })
);

export enum ListMode {
  SwitchUser,
  WorkOffline,
  LogOut,
}

interface IStateProps {
  t: IUserListModeStrings;
}

interface IProps extends IStateProps {
  mode: ListMode;
  onMode: (mode: ListMode) => void;
  loggedIn: boolean;
  allowOffline: boolean;
}

export function UserListMode(props: IProps) {
  const { onMode, loggedIn, allowOffline, t } = props;
  const classes = useStyles();
  const [listMode, setListMode] = useState<ListMode>(props.mode);

  const handleMode = (mode: ListMode) => () => {
    setListMode(mode);
    onMode(mode);
  };

  return (
    <div className={classes.actionToggle}>
      {(allowOffline || loggedIn) && (
        <Button
          className={clsx({
            [classes.modeSelect]: listMode === ListMode.SwitchUser,
          })}
          onClick={handleMode(ListMode.SwitchUser)}
        >
          {t.switchUser}
        </Button>
      )}
      {allowOffline && (
        <>
          <span className={classes.bar}>|</span>
          <Button
            className={clsx({
              [classes.modeSelect]: listMode === ListMode.WorkOffline,
            })}
            onClick={handleMode(ListMode.WorkOffline)}
          >
            {t.workOffline}
          </Button>
        </>
      )}
      {loggedIn && (
        <>
          <span className={classes.bar}>|</span>
          <Button
            className={clsx({
              [classes.modeSelect]: listMode === ListMode.LogOut,
            })}
            onClick={handleMode(ListMode.LogOut)}
          >
            {t.logOut}
          </Button>
        </>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'userListMode' }),
});

export default connect(mapStateToProps)(UserListMode) as any;
