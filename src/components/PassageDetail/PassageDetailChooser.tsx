import { useEffect, useState, useRef } from 'react';
import { useGlobal } from 'reactn';
import { Passage, IPassageChooserStrings } from '../../model';
import { Typography, Box, BoxProps, styled, Tabs, Tab } from '@mui/material';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  related,
  findRecord,
  passageReference,
  getPasIdByNum,
} from '../../crud';
import { localUserKey, LocalKey } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { passageChooserSelector } from '../../selector';
import { usePassageNavigate } from './usePassageNavigate';

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  padding: `0 ${theme.spacing(6)}px`,
  display: 'flex',
  flexDirection: 'row',
}));

interface Mark {
  value: number;
  label: string;
}

export const PassageDetailChooser = () => {
  const [memory] = useGlobal('memory');
  const { passage, section, prjId, allBookData } = usePassageDetailContext();
  const [passageCount, setPassageCount] = useState(0);
  const [value, setValue] = useState(0);
  const marks = useRef<Array<Mark>>([]);
  const [view, setView] = useState('');
  const passageNavigate = usePassageNavigate(() => {
    setView('');
  });
  const t = useSelector(
    passageChooserSelector,
    shallowEqual
  ) as IPassageChooserStrings;

  const handleChange = (event: React.SyntheticEvent, newValue: any) => {
    if (typeof newValue === 'number') {
      if (newValue !== value) {
        const pasId = getPasIdByNum(section, newValue, memory);
        if (pasId) {
          localStorage.setItem(localUserKey(LocalKey.passage), pasId);
          setView(`/detail/${prjId}/${pasId}`);
        }
      }
      setValue(newValue);
    }
  };

  useEffect(() => {
    const seq = passage?.attributes?.sequencenum;
    setValue(seq ? seq - 1 : 0);
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
    <StyledBox>
      <Typography sx={{ pr: 2 }}>{t.passages}</Typography>
      <Tabs
        value={value || 0}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        aria-label="scrollable passage tabs"
      >
        {marks.current
          .sort((i, j) => i.value - j.value)
          .map((m) => (
            <Tab key={m.value} label={m.label} />
          ))}
      </Tabs>
    </StyledBox>
  ) : (
    <></>
  );
};

export default PassageDetailChooser;
