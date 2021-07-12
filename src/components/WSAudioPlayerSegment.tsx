import {
  makeStyles,
  Theme,
  createStyles,
  IconButton,
  Grid,
} from '@material-ui/core';
import React from 'react';
import { LightTooltip } from '../control';
import { IWsAudioPlayerStrings } from '../model';
import { FaGripLinesVertical, FaHandScissors } from 'react-icons/fa';
import ClearIcon from '@material-ui/icons/Clear';

import NextSegmentIcon from '@material-ui/icons/ArrowRightAlt';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    main: {
      display: 'flex',
      flexDirection: 'column',
      whiteSpace: 'nowrap',
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyItems: 'flex-start',
      display: 'flex',
    },
    togglebutton: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    formControl: {
      margin: theme.spacing(1),
      maxWidth: 50,
    },
    rotate90: { rotate: '90' },
  })
);

interface IProps {
  t: IWsAudioPlayerStrings;
  ready: boolean;
  wsAutoSegment: () => void;
  wsSplitRegion: () => void;
  wsRemoveSplitRegion: () => void;
  wsNextRegion: () => void;
}
export function WSAudioPlayerSegment(props: IProps) {
  const classes = useStyles();
  const {
    t,
    ready,
    wsAutoSegment,
    wsSplitRegion,
    wsRemoveSplitRegion,
    wsNextRegion,
  } = props;

  const handleAutoSegment = () => {
    wsAutoSegment();
  };
  const handleSplit = () => {
    wsSplitRegion();
  };
  const handleRemoveSplit = () => {
    wsRemoveSplitRegion();
  };
  const handleNextSegment = () => {
    wsNextRegion();
  };
  return (
    <div className={classes.root}>
      <Grid container className={classes.toolbar}>
        <Grid item>
          <LightTooltip id="wsSegmentTip" title={'TODO:Segment'}>
            <span>
              <IconButton
                id="wsSegment"
                onClick={handleAutoSegment}
                disabled={!ready}
              >
                <FaGripLinesVertical className={classes.rotate90} />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsSplitTip" title={'todo:SplitSegment'}>
            <span>
              <IconButton id="wsSplit" onClick={handleSplit}>
                <FaHandScissors />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsJoinTip" title={'todo:Remove Break'}>
            <span>
              <IconButton id="wsJoin" onClick={handleRemoveSplit}>
                <ClearIcon />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsNextTip" title={'todo:NextSegment'}>
            <span>
              <IconButton id="wsNext" onClick={handleNextSegment}>
                <NextSegmentIcon />
              </IconButton>
            </span>
          </LightTooltip>
        </Grid>
      </Grid>
    </div>
  );
}
