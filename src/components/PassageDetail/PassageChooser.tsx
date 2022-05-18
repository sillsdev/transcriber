import { useEffect, useState, useRef } from 'react';
import { useGlobal } from 'reactn';
import { Passage, IPassageChooserStrings } from '../../model';
import {
  Typography,
  Slider,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  related,
  findRecord,
  passageReference,
  getPasIdByNum,
} from '../../crud';
import { useSelector, shallowEqual } from 'react-redux';
import { passageChooserSelector } from '../../selector';
import { usePassageNavigate } from './usePassageNavigate';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    slider: {
      padding: `0 ${theme.spacing(6)}px`,
      display: 'flex',
      flexDirection: 'row',
    },
    sliderHead: {
      paddingRight: theme.spacing(2),
    },
  })
);

interface Mark {
  value: number;
  label: string;
}

export const PassageChooser = () => {
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const { passage, section, prjId, allBookData } = usePassageDetailContext();
  const [passageCount, setPassageCount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const marks = useRef<Array<Mark>>([]);
  const [view, setView] = useState('');
  const passageNavigate = usePassageNavigate(() => {
    setView('');
  });
  const t = useSelector(
    passageChooserSelector,
    shallowEqual
  ) as IPassageChooserStrings;

  const sliderChange = (
    event: React.ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (typeof value === 'number') {
      if (value !== sliderValue) {
        const pasId = getPasIdByNum(section, value, memory);
        if (pasId) setView(`/detail/${prjId}/${pasId}`);
      }
      setSliderValue(value);
    }
  };

  const valueLabelFormat = (v: number) => {
    const secSeq = section?.attributes?.sequencenum || 1;
    return `${secSeq}.${v}`;
  };

  useEffect(() => {
    const seq = passage?.attributes?.sequencenum;
    setSliderValue(seq ? seq : 1);
  }, [passage]);

  useEffect(() => {
    const passages = related(section, 'passages') as Passage[];
    if (Array.isArray(passages)) {
      const newCount = passages.length;
      if (passageCount !== newCount) setPassageCount(newCount);
      passages.forEach((p) => {
        const passRec = findRecord(memory, 'passage', p.id) as Passage;
        let reference = passageReference(passRec, allBookData);
        if (!reference)
          reference = `${section?.attributes?.sequencenum}.${
            passRec?.attributes?.sequencenum || 1
          }`;
        marks.current.push({
          value: passRec?.attributes?.sequencenum || -1,
          label: reference,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    passageNavigate(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return passageCount > 1 ? (
    <div className={classes.slider}>
      <Typography className={classes.sliderHead}>{t.passages}</Typography>
      <Slider
        value={sliderValue}
        onChange={sliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={valueLabelFormat}
        min={1}
        max={passageCount}
        marks={marks.current}
      />
    </div>
  ) : (
    <></>
  );
};

export default PassageChooser;
