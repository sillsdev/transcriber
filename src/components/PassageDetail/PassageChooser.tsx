import { useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useHistory } from 'react-router-dom';
import { Passage } from '../../model';
import {
  Typography,
  Slider,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { related, findRecord } from '../../crud';
import { LocalKey, localUserKey } from '../../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    slider: {
      padding: `0 ${theme.spacing(4)}px`,
      display: 'flex',
      flexDirection: 'row',
    },
    sliderHead: {
      paddingRight: theme.spacing(2),
    },
  })
);

export const PassageChooser = () => {
  const classes = useStyles();
  const { pathname } = useLocation();
  const { push } = useHistory();
  const [memory] = useGlobal('memory');
  const {
    passage,
    section,
    prjId,
    // setFirstStepIndex, setCurrentStep
  } = usePassageDetailContext();
  const [passageCount, setPassageCount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [view, setView] = useState('');

  const sliderChange = (
    event: React.ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (typeof value === 'number') {
      if (value !== sliderValue) {
        const passages = related(section, 'passages');
        if (Array.isArray(passages)) {
          passages.forEach((p) => {
            const passRec = findRecord(memory, 'passage', p.id) as Passage;
            const seq = passRec?.attributes?.sequencenum;
            const seqSliderValue = seq ? seq - 1 : -1;
            if (seqSliderValue === value) {
              const pasId = passRec?.keys?.remoteId || passRec?.id;
              setView(`/detail/${prjId}/${pasId}`);
            }
          });
        }
      }
      setSliderValue(value);
    }
  };

  const valueLabelFormat = (v: number) => {
    const secSeq = section?.attributes?.sequencenum || 1;
    return `${secSeq}.${v + 1}`;
  };

  useEffect(() => {
    const seq = passage?.attributes?.sequencenum;
    setSliderValue(seq ? seq - 1 : 0);
  }, [passage]);

  useEffect(() => {
    const passages = related(section, 'passages');
    if (Array.isArray(passages)) {
      const newCount = passages.length - 1;
      if (passageCount !== newCount) setPassageCount(newCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    setTimeout(() => {
      if (view) {
        if (view !== pathname) {
          localStorage.setItem(localUserKey(LocalKey.url), view);
          push(view);
          setView('');
          // Add these two lines to rechoose the step on navigation
          // setFirstStepIndex(-1);
          // setCurrentStep('');
        }
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pathname]);

  return passageCount > 1 ? (
    <div className={classes.slider}>
      <Typography className={classes.sliderHead}>Passage: </Typography>
      <Slider
        value={sliderValue}
        onChange={sliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={valueLabelFormat}
        max={passageCount}
      />
    </div>
  ) : (
    <></>
  );
};

export default PassageChooser;
