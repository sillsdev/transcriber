import { useState } from 'react';
import { connect } from 'react-redux';
import { IState, ITranscribeStrings } from '../../model';
import { useLocation } from 'react-router-dom';
import localStrings from '../../selector/localize';
import { Button, makeStyles, Theme, createStyles } from '@material-ui/core';
import TranscribeIcon from '../../control/TranscribeIcon';
import { LocalKey, localUserKey } from '../../utils';
import StickyRedirect from '../StickyRedirect';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    icon: {
      display: 'flex',
      paddingLeft: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: ITranscribeStrings;
}

interface IProps extends IStateProps {}

export function PassageDetailTranscribe(props: IProps) {
  const { t } = props;
  const { pathname } = useLocation();
  const classes = useStyles();
  const [view, setView] = useState('');

  const handleTranscribe = () => {
    localStorage.setItem(localUserKey(LocalKey.jumpBack), pathname);
    setView(pathname.replace('detail', 'work'));
  };

  if (view) return <StickyRedirect to={view} />;

  return (
    <Button onClick={handleTranscribe} variant="contained" color="primary">
      {t.openTranscriber}
      <TranscribeIcon className={classes.icon} color="white" />
    </Button>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcribe' }),
});

export default connect(mapStateToProps)(PassageDetailTranscribe) as any as any;
