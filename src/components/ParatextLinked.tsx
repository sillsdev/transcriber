import React from 'react';
import clsx from 'clsx';
import { Typography, Link, IconButton } from '@material-ui/core';
import { connect } from 'react-redux';
import { IState, IProfileStrings } from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Confirm from '../components/AlertDialog';
import InfoIcon from '@material-ui/icons/Info';
import ParatextIcon from '../control/ParatextLogo';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    caption: {
      display: 'table',
      width: 200,
      textAlign: 'left',
    },
    notLinked: {
      fontWeight: 'bold',
      paddingTop: theme.spacing(2),
    },
  })
);

interface IStateProps {
  t: IProfileStrings;
  status?: IAxiosStatus;
}

interface IProps extends IStateProps {
  hasParatext: Boolean;
  ptPath: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  isOffline: Boolean;
}

export const ParatextLinked = (props: IProps) => {
  const { status, t, hasParatext, ptPath, setView, isOffline } = props;
  const classes = useStyles();
  const [howToLink, setHowToLink] = React.useState(false);

  const handleHowTo = () => {
    setHowToLink(true);
  };

  const handleLogout = () => {
    setView('Logout');
  };

  const handleNoLinkSetup = () => {
    setHowToLink(false);
  };

  return (
    <>
      {status?.errStatus ? (
        <Typography className={clsx(classes.caption, classes.notLinked)}>
          {t.notLinked}
        </Typography>
      ) : (
        <></>
      )}
      <Typography
        className={clsx({
          [classes.caption]: !status?.errStatus || 0,
        })}
      >
        <ParatextIcon />
        {'\u00A0'}
        {status?.errStatus || 0 || (isOffline && !ptPath) ? (
          <>
            <Link onClick={handleHowTo}>{t.paratextNotLinked}</Link>
            <IconButton id="howToLink" color="primary" onClick={handleHowTo}>
              <InfoIcon />
            </IconButton>
          </>
        ) : (hasParatext && status?.complete) || ptPath ? (
          t.paratextLinked
        ) : (
          status?.statusMsg || t.checkingParatext
        )}
      </Typography>
      {howToLink && (
        <Confirm
          title={t.paratextLinking}
          text={isOffline ? t.installParatext : t.linkingExplained}
          yes={isOffline ? '' : t.logout}
          no={isOffline ? t.close : t.cancel}
          yesResponse={handleLogout}
          noResponse={handleNoLinkSetup}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'profile' }),
  status: state.paratext.usernameStatus,
});

export default connect(mapStateToProps)(ParatextLinked) as any;
