import React, { useMemo } from 'react';
import { useEffect, useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IMainStrings, ISharedStrings, User } from '../model';
import localStrings from '../selector/localize';
import {
  Button,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  styled,
  MenuItemProps,
} from '@mui/material';
import ExitIcon from '@mui/icons-material/ExitToApp';
import AccountIcon from '@mui/icons-material/AccountCircle';
import ReloadIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import { StyledMenu, StyledMenuItem } from '../control';
import UserAvatar from './UserAvatar';
import { isElectron } from '../api-variable';
import { useLocation } from 'react-router-dom';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { localizeRole } from '../utils';

const TermsItem = styled(StyledMenuItem)<MenuItemProps>(() => ({
  textAlign: 'center',
  lineHeight: 1,
  paddingBottom: 0,
  '& .MuiListItemText-primary': {
    fontSize: 'small',
  },
}));

const roleStyle = {
  display: 'flex',
  flexDirection: 'column',
} as React.CSSProperties;

interface IStateProps {
  t: IMainStrings;
  ts: ISharedStrings;
}
interface IRecordProps {
  users: Array<User>;
}
interface IProps extends IStateProps, IRecordProps {
  action: (what: string) => void;
}

export function UserMenu(props: IProps) {
  const { action, t, ts, users } = props;
  const [orgRole] = useGlobal('orgRole');
  const [developer] = useGlobal('developer');
  const [user] = useGlobal('user');
  const { pathname } = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shift, setShift] = React.useState(false);
  const [userRec, setUserRec] = React.useState<User | undefined>(undefined);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setShift(event.shiftKey);
    setAnchorEl(event.currentTarget);
  };

  useEffect(() => {
    const userRecs = users.filter((u) => u.id === user) as User[];
    const newRec = userRecs.length > 0 ? userRecs[0] : undefined;
    if (userRec !== newRec) {
      setUserRec(newRec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users, userRec]);

  const handleAction = (what: string) => () => {
    setAnchorEl(null);
    if (action) action(what);
  };

  const isProfile = useMemo(() => /\/profile/i.test(pathname), [pathname]);

  return (
    <div>
      <Button
        id="userMenu"
        aria-controls="custom-user-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <UserAvatar userRec={userRec} />
      </Button>
      <StyledMenu
        id="custom-user-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleAction('Close')}
      >
        {orgRole && (
          <StyledMenuItem>
            <ListItemText
              primary={
                <div style={roleStyle}>
                  <Typography>
                    {`${t.orgRole} ${localizeRole(orgRole, ts)}`}
                  </Typography>
                </div>
              }
            />
          </StyledMenuItem>
        )}
        {!isProfile && (
          <StyledMenuItem id="myAccount" onClick={handleAction('Profile')}>
            <ListItemIcon>
              <AccountIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t.myAccount} />
          </StyledMenuItem>
        )}
        {shift && (
          <StyledMenuItem id="reload" onClick={handleAction('ReloadStatic')}>
            <ListItemIcon>
              <ReloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t.reloadStatic} />
          </StyledMenuItem>
        )}
        {shift && !isElectron && (
          <StyledMenuItem id="clearCache" onClick={handleAction('Clear')}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t.clearCache} />
          </StyledMenuItem>
        )}
        {shift && (
          <StyledMenuItem id="clrLogout" onClick={handleAction('ClearLogout')}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t.clearLogout} />
          </StyledMenuItem>
        )}
        {shift && developer && (
          <StyledMenuItem id="clearError" onClick={handleAction('Error')}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={'Error'} />
          </StyledMenuItem>
        )}
        <StyledMenuItem id="logout" onClick={handleAction('Logout')}>
          <ListItemIcon>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={isElectron ? t.switchUser : t.logout} />
        </StyledMenuItem>
        <Divider />
        <TermsItem id="privacy" onClick={handleAction('Privacy')}>
          <ListItemText primary={t.privacy} />
        </TermsItem>
        <TermsItem id="terms" onClick={handleAction('Terms')}>
          <ListItemText primary={t.terms} />
        </TermsItem>
      </StyledMenu>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  ts: localStrings(state, { layout: 'shared' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(UserMenu) as any
) as any;
