import React, { useEffect, useState, useRef } from 'react';
import { useGlobal } from 'reactn';
import { IPassageChooserStrings, PassageD } from '../../model';
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
import { related, passageRefText, remoteId } from '../../crud';
import { rememberCurrentPassage } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { passageChooserSelector } from '../../selector';
import { usePassageNavigate } from './usePassageNavigate';
import { PassageTypeEnum } from '../../model/passageType';
import {
  passageTypeFromRef,
  isPublishingTitle,
  RefRender,
} from '../../control/RefRender';
import { RecordKeyMap } from '@orbit/records';

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
        const pasId =
          remoteId('passage', selId, memory.keyMap as RecordKeyMap) || selId;
        if (pasId) {
          rememberCurrentPassage(memory, pasId);
          setView(`/detail/${prjId}/${pasId}`);
          return;
        }
      }
    }
  };

  useEffect(() => {
    // Next line doesn't work in desktop app
    // const passages = related(section, 'passages') as Passage[];
    const passages = (
      memory.cache.query((q) => q.findRecords('passage')) as PassageD[]
    ).filter((p) => related(p, 'section') === section?.id);
    var newCount = 0;
    marks.current = [];
    passages
      .sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum)
      .forEach((p, i) => {
        const psgType = passageTypeFromRef(p.attributes?.reference, false);
        if (!isPublishingTitle(p.attributes?.reference, false)) {
          newCount++;
          let reference: React.ReactNode = '';
          if (psgType === PassageTypeEnum.PASSAGE) {
            reference = passageRefText(p, allBookData);
            if ((reference as string).length === 0)
              reference = `${section?.attributes?.sequencenum}.${
                p.attributes?.sequencenum || 1
              }`;
          } else {
            //must be a note
            reference = (
              <RefRender value={p.attributes?.reference} flat={false} />
            );
          }
          if (marks.current.findIndex((m) => m.label === reference) > -1)
            reference += '#' + p.attributes?.sequencenum.toString();
          marks.current.push({
            value: i,
            label: reference,
            id: p.id,
          });
        }
      });
    if (newCount !== passageCount) setPassageCount(newCount);
    const newSize = newCount > 1 ? 48 : 0;
    if (chooserSize !== newSize) setChooserSize(newSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, allBookData]);

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
