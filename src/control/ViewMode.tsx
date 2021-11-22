import { useState } from 'react';
import clsx from 'clsx';
import { connect } from 'react-redux';
import { IState, IViewModeStrings } from '../model';
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

export enum ViewOption {
  AudioProject,
  Transcribe,
  Detail,
}

interface IStateProps {
  t: IViewModeStrings;
}

interface IProps extends IStateProps {
  mode: ViewOption;
  onMode: (mode: ViewOption) => void;
}

export function ViewMode(props: IProps) {
  const { mode, onMode, t } = props;
  const classes = useStyles();
  const [viewOption, setViewOption] = useState<ViewOption>(props.mode);

  const handleMode = (mode: ViewOption) => () => {
    setViewOption(mode);
    onMode(mode);
  };

  return (
    <div className={classes.actionToggle}>
      <Button
        id="audioProjectMode"
        className={clsx({
          [classes.modeSelect]: viewOption === ViewOption.AudioProject,
        })}
        onClick={handleMode(ViewOption.AudioProject)}
      >
        {t.audioProject}
      </Button>
      <span className={classes.bar}>|</span>
      {mode !== ViewOption.Detail && (
        <Button
          id="transcribeMode"
          className={clsx({
            [classes.modeSelect]: viewOption === ViewOption.Transcribe,
          })}
          onClick={handleMode(ViewOption.Transcribe)}
        >
          {t.transcribe}
        </Button>
      )}
      {mode === ViewOption.Detail && (
        <Button
          id="detailMode"
          className={clsx({
            [classes.modeSelect]: viewOption === ViewOption.Detail,
          })}
          onClick={handleMode(ViewOption.Detail)}
        >
          {'Detail'}
        </Button>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'viewMode' }),
});

export default connect(mapStateToProps)(ViewMode) as any;
