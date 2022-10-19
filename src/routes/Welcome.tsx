import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { IState, IWelcomeStrings, User, OfflineProject } from '../model';
import { Record } from '@orbit/data';
import * as action from '../store';
import { Typography, Grid, Box, BoxProps, SxProps } from '@mui/material';
import { useCheckOnline, localeDefault } from '../utils';
import { isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import ImportTab from '../components/ImportTab';
import { IAxiosStatus } from '../store/AxiosStatus';
import OfflineIcon from '@mui/icons-material/CloudOff';
import OnlineIcon from '@mui/icons-material/CloudQueue';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { connect, shallowEqual, useSelector } from 'react-redux';
import moment from 'moment';
import { AddRecord } from '../model/baseModel';
import { useOfflineSetup, useRecOfType } from '../crud';
import { ChoiceHead, FactorDecorate } from '../control/ChoiceHead';
import { backup } from '../schema';
import { AltButton, LightTooltip } from '../control';
import { styled } from '@mui/material';
import { welcomeSelector } from '../selector';

const RootBox = styled(Box)<BoxProps>(() => ({
  width: '95%',
  flexGrow: 1,
  '& .MuiListSubheader-root': {
    lineHeight: 'unset',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '30px',
  },
}));

const sectionHeadProps = { fontSize: '16pt', pt: 4, pb: 2 } as SxProps;
const iconProps = { mr: 1, fontSize: 'small' } as SxProps;
const actionProps = {
  p: 2,
  textAlign: 'center',
  alignSelf: 'center',
} as SxProps;

interface OnlineButtonProps {
  id: string;
  onClick: () => void;
}

const OnlineButton = ({ id, onClick }: OnlineButtonProps) => {
  const t: IWelcomeStrings = useSelector(welcomeSelector, shallowEqual);

  return (
    <AltButton id={id} onClick={onClick} sx={{ mr: 2 }}>
      <OnlineIcon sx={iconProps} />
      {t.online}
    </AltButton>
  );
};

interface OfflineButtonProps extends OnlineButtonProps {
  txt?: string;
}

const OfflineButton = ({ id, onClick, txt }: OfflineButtonProps) => {
  const t: IWelcomeStrings = useSelector(welcomeSelector, shallowEqual);

  return (
    <AltButton id={id} onClick={onClick} sx={{ mr: 2 }}>
      <OfflineIcon sx={iconProps} />
      {txt ? txt : t.offline}
    </AltButton>
  );
};

const HelpTip = () => {
  const t: IWelcomeStrings = useSelector(welcomeSelector, shallowEqual);

  return (
    <>
      {`\u00A0`}
      <LightTooltip title={t.setupFactor2Help}>
        <InfoIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
      </LightTooltip>
    </>
  );
};

interface IStateProps {
  importStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
  importComplete: typeof action.importComplete;
  resetOrbitError: typeof action.resetOrbitError;
}

interface IProps extends IStateProps, IDispatchProps {}

export function Welcome(props: IProps) {
  const { importStatus, importComplete, resetOrbitError } = props;
  const t: IWelcomeStrings = useSelector(welcomeSelector, shallowEqual);
  const offlineSetup = useOfflineSetup();
  const { fetchLocalization, setLanguage } = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_busy, setBusy] = useGlobal('importexportBusy');
  const [user, setUser] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const [whichUsers, setWhichUsers] = useState<string | null>(null);
  const [coordinator] = useGlobal('coordinator');
  const recOfType = useRecOfType();
  const memory = coordinator.getSource('memory') as MemorySource;
  const [importOpen, setImportOpen] = useState(false);
  const [hasOfflineUsers, setHasOfflineUsers] = useState(false);
  const [hasOnlineUsers, setHasOnlineUsers] = useState(false);
  const [hasOfflineProjects, setHasOfflineProjects] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);
  const [, setOfflineOnly] = useGlobal('offlineOnly');
  const checkOnline = useCheckOnline(resetOrbitError);

  const hasRecs = (recType: string, iRecs?: Record[], offline?: Boolean) => {
    const recs = iRecs || recOfType(recType);
    const offlineRecs = recs.filter((u) =>
      u.keys?.remoteId === undefined ? !offline : offline
    );
    return offlineRecs.length > 0;
  };

  const userTypes = () => {
    const users = recOfType('user') as User[];
    const offlineUsers = hasRecs('user', users);
    setHasOfflineUsers(offlineUsers);
    const onlineUsers = hasRecs('user', users, true);
    setHasOnlineUsers(onlineUsers);
    return { users, offlineUsers, onlineUsers };
  };

  const checkUsers = (autoGo: boolean, prevChoice?: string) => {
    const offlineProj = (
      recOfType('offlineproject') as OfflineProject[]
    ).filter((p) => p.attributes.offlineAvailable);
    setHasOfflineProjects(offlineProj.length > 0);
    const projects = recOfType('project') as Record[];
    setHasProjects(projects.length > 0);

    const { users, onlineUsers, offlineUsers } = userTypes();
    const lastUserId = localStorage.getItem('user-id');

    if (lastUserId !== null) {
      const selected = users.filter((u) => u.id === lastUserId);
      if (selected.length > 0) {
        setUser(lastUserId);
        if (autoGo) {
          setWhichUsers(
            selected[0]?.keys?.remoteId !== undefined ? 'online' : 'offline'
          );
          return;
        }
      }
    }
    //I don't have a user id, but I do have a list to go to...
    if (prevChoice) {
      setWhichUsers(prevChoice);
      return;
    }
    //if we're supposed to choose and we only have one choice...go
    if (
      autoGo &&
      (onlineUsers || offlineUsers) &&
      !(onlineUsers && offlineUsers)
    ) {
      setWhichUsers(onlineUsers ? 'online' : 'offline');
    }
  };

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    checkOnline((connected) => {});
    const choice = localStorage.getItem('offlineAdmin');

    if (choice !== null) {
      if (choice === 'choose') checkUsers(false);
      else checkUsers(true, choice === 'true' ? 'offline' : 'online');
    } else {
      checkUsers(true);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (importStatus?.complete) {
      importComplete();
      setBusy(false);
      const { onlineUsers } = userTypes();
      checkUsers(true, onlineUsers ? 'online-local' : 'offline');
      localStorage.setItem('offlineAdmin', 'false');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importStatus]);

  const handleOfflineChange = (target: string) => {
    setWhichUsers(target);
    localStorage.setItem(
      'offlineAdmin',
      target === 'offline' ? 'true' : 'false'
    );
  };

  const handleGoOnlineCloud = () => {
    handleOfflineChange('online-cloud');
  };

  const handleGoOnlineTeam = () => {
    handleOfflineChange('online-team');
  };

  const handleGoOnlineLocal = () => {
    handleOfflineChange('online-local');
  };

  const handleGoOffline = () => {
    handleOfflineChange('offline');
  };

  const handleQuickOnline = () => {
    if (!hasProjects) localStorage.setItem('autoaddProject', 'true');
    handleOfflineChange('online-alone');
  };

  const AddUserLocalOnly = async (userRec: User) => {
    await memory.sync(
      await backup.push((t: TransformBuilder) =>
        AddRecord(t, userRec, user, memory)
      )
    );
  };

  const addQuickUser = async () => {
    let userRec: User = {
      type: 'user',
      attributes: {
        name: t.quickName,
        givenName: t.quickGiven,
        familyName: t.quickFamily,
        email: '',
        phone: '',
        timezone: moment.tz.guess(),
        locale: localeDefault(isDeveloper),
        isLocked: false,
        uilanguagebcp47: '',
        digestPreference: false,
        newsPreference: false,
      },
    } as any;
    await AddUserLocalOnly(userRec);
    await offlineSetup();
    return userRec.id;
  };

  const handleQuickOffline = () => {
    setOfflineOnly(true);
    if (!hasOfflineProjects || !hasOfflineUsers)
      localStorage.setItem('autoaddProject', 'true');

    if (hasOfflineUsers) {
      const users = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('user')
      ) as User[];
      var quickUsers = users.filter(
        (u) =>
          u.keys?.remoteId === undefined &&
          u.attributes?.givenName === t.quickGiven &&
          u.attributes?.familyName === t.quickFamily
      );

      if (quickUsers.length !== 0) {
        setUser(quickUsers[0].id);
        handleGoOffline();
        return;
      }
    }
    addQuickUser().then((id) => {
      setUser(id);
      handleGoOffline();
    });
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  const setupFactors = [t.setupFactor, t.setupFactor2];
  const teamFactors = [t.teamFactor];
  const aloneFactors = [t.aloneFactor];
  const factorDecorate: FactorDecorate = {
    [t.setupFactor2]: HelpTip(),
  };

  if (!isElectron || whichUsers !== null) {
    return <Redirect to={'/access/' + whichUsers} />;
  }

  return (
    <RootBox>
      <AppHead {...props} />
      <Typography sx={sectionHeadProps}>Filler</Typography>

      {isElectron && (
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography id="welcome" sx={sectionHeadProps}>
            {t.title}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <ChoiceHead
                title={t.setupTeam}
                prose={t.setupTeamTip}
                keyFactorTitle={t.keyFactor}
                factors={setupFactors}
                factorDecorate={factorDecorate}
              />
            </Grid>
            <Grid item xs={4} sx={actionProps}>
              <OnlineButton id="adminonline" onClick={handleGoOnlineCloud} />
            </Grid>
            <Grid item xs={8}>
              <ChoiceHead
                title={t.team}
                prose={t.teamTip}
                keyFactorTitle={t.keyFactor}
                factors={teamFactors}
              />
            </Grid>
            <Grid item xs={4} sx={actionProps}>
              <OnlineButton id="teamonline" onClick={handleGoOnlineTeam} />
              {hasOfflineProjects && hasOnlineUsers && (
                <OfflineButton id="teamoffline" onClick={handleGoOnlineLocal} />
              )}
              <OfflineButton
                id="teamimport"
                onClick={handleImport}
                txt={t.import}
              />
            </Grid>
            <Grid item xs={8}>
              <ChoiceHead
                title={t.alone}
                prose={''}
                keyFactorTitle={t.keyFactor}
                factors={aloneFactors}
              />
            </Grid>
            <Grid item xs={4} sx={actionProps}>
              <OnlineButton id="aloneonline" onClick={handleQuickOnline} />
              <OfflineButton id="aloneoffline" onClick={handleQuickOffline} />
            </Grid>
          </Grid>
        </Box>
      )}
      {importOpen && <ImportTab isOpen={importOpen} onOpen={setImportOpen} />}
    </RootBox>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  importStatus: state.importexport.importexportStatus,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
      importComplete: action.importComplete,
      resetOrbitError: action.resetOrbitError,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Welcome) as any;
