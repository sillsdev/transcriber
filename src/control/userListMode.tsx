import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { IUserListModeStrings } from '../model';
import { userListModeSelector } from '../selector';
import { ActionToggle, SmallBar, UndButton } from './ActionToggle';

export enum ListMode {
  SwitchUser,
  WorkOffline,
  LogOut,
}

interface IProps {
  mode: ListMode;
  onMode: (mode: ListMode) => void;
  loggedIn: boolean;
  allowOffline: boolean;
}

export function UserListMode(props: IProps) {
  const { onMode, loggedIn, allowOffline } = props;
  const [listMode, setListMode] = useState<ListMode>(props.mode);
  const t: IUserListModeStrings = useSelector(
    userListModeSelector,
    shallowEqual
  );

  const handleMode = (mode: ListMode) => () => {
    setListMode(mode);
    onMode(mode);
  };

  return (
    <ActionToggle>
      {(allowOffline || loggedIn) && (
        <UndButton
          id="switchUserMode"
          active={listMode === ListMode.SwitchUser}
          onClick={handleMode(ListMode.SwitchUser)}
        >
          {t.switchUser}
        </UndButton>
      )}
      {allowOffline && (
        <>
          <SmallBar />
          <UndButton
            id="workOfflineMode"
            active={listMode === ListMode.WorkOffline}
            onClick={handleMode(ListMode.WorkOffline)}
          >
            {t.workOffline}
          </UndButton>
        </>
      )}
      {loggedIn && (
        <>
          <SmallBar />
          <UndButton
            id="logOutMode"
            active={listMode === ListMode.LogOut}
            onClick={handleMode(ListMode.LogOut)}
          >
            {t.logOut}
          </UndButton>
        </>
      )}
    </ActionToggle>
  );
}

export default UserListMode;
