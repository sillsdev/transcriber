import React, { useEffect, useState, useRef } from 'react';
import { useGlobal } from 'reactn';
import { Passage, IPassageChooserStrings } from '../../model';
import {
  Typography,
  Box,
  BoxProps,
  styled,
  Tabs,
  Tab,
  SxProps,
} from '@mui/material';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { related, findRecord, passageRefText, remoteId } from '../../crud';
import { rememberCurrentPassage } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { passageChooserSelector } from '../../selector';
import { usePassageNavigate } from './usePassageNavigate';
import { PassageTypeEnum } from '../../model/passageType';
import {
  passageTypeFromRef,
  isPassageTypeRecord,
  refRender,
} from '../../control/RefRender';

interface StyledBoxProps extends BoxProps {
  width?: number;
}
const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'width',
})<StyledBoxProps>(({ width, theme }) => ({
  padding: `${theme.spacing(2)}px ${theme.spacing(6)}px`,
  display: 'flex',
  flexDirection: 'row',
  width: `${width}px`,
}));

interface Mark {
  value: number;
  label: React.ReactNode;
  id: string;
}

interface IProps {
  width: number;
  sx?: SxProps;
}

export const PassageDetailChooser = ({ width, sx }: IProps) => {
  const [memory] = useGlobal('memory');
  const { passage, section, prjId, allBookData, chooserSize, setChooserSize } =
    usePassageDetailContext();
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
        const selId = marks.current[newValue]?.id;
        const pasId = remoteId('passage', selId, memory.keyMap) || selId;
        if (pasId) {
          rememberCurrentPassage(memory, pasId);
          setView(`/detail/${prjId}/${pasId}`);
          return;
        }
      }
    }
  };

  useEffect(() => {
    const passages = related(section, 'passages') as Passage[];
    if (Array.isArray(passages)) {
      var newCount = 0;
      marks.current = [];
      passages.forEach((p, i) => {
        const passRec = findRecord(memory, 'passage', p.id) as Passage;
        const psgType = passageTypeFromRef(passRec?.attributes?.reference);
        if (!isPassageTypeRecord(passRec?.attributes?.reference)) {
          newCount++;
          let reference: React.ReactNode = '';
          if (psgType === PassageTypeEnum.PASSAGE) {
            reference = passageRefText(passRec, allBookData);
            if ((reference as string).length === 0)
              reference = `${section?.attributes?.sequencenum}.${
                passRec?.attributes?.sequencenum || 1
              }`;
          } else {
            reference = refRender(passRec?.attributes?.reference);
          }
          if (marks.current.findIndex((m) => m.label === reference) > -1)
            reference += '#' + passRec?.attributes?.sequencenum.toString();
          marks.current.push({
            value: i,
            label: reference,
            id: passRec.id,
          });
        }
      });
      if (passageCount !== newCount) setPassageCount(newCount);
      const newSize = newCount > 1 ? 48 : 0;
      if (chooserSize !== newSize) setChooserSize(newSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    const passId = passage.id;
    const newValue = marks.current.findIndex((m) => m.id === passId);
    if (newValue > 0 && newValue !== value) setValue(newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage]);

  useEffect(() => {
    passageNavigate(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return passageCount > 1 ? (
    <StyledBox width={width} sx={{ ...sx, alignItems: 'center' }}>
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
