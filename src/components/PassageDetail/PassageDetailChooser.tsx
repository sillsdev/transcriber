import React, { useEffect, useState, useRef } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { IPassageChooserStrings, PassageD } from '../../model';
import { Typography, Tabs, Tab, SxProps } from '@mui/material';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  related,
  passageRefText,
  remoteId,
  useSharedResRead,
} from '../../crud';
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
import { StyledBox } from '../../control/StyledBox';

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
  const { setCurrentStep } = usePassageDetailContext();
  const { getSharedResource } = useSharedResRead();
  const passageNavigate = usePassageNavigate(() => {
    setView('');
  }, setCurrentStep);

  const t = useSelector(
    passageChooserSelector,
    shallowEqual
  ) as IPassageChooserStrings;

  const handleChange = (event: React.SyntheticEvent, newValue: any) => {
    if (typeof newValue === 'number') {
      if (newValue !== value) {
        const selId = marks.current[newValue]?.id;
        const pasId =
          remoteId('passage', selId, memory?.keyMap as RecordKeyMap) || selId;
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
          let ref = '';
          if (psgType === PassageTypeEnum.PASSAGE) {
            ref = passageRefText(p, allBookData);
            if ((ref as string).length === 0)
              ref = `${section?.attributes?.sequencenum}.${
                p.attributes?.sequencenum || 1
              }`;
          } else {
            //must be a note
            var sr = getSharedResource(p);
            ref = sr?.attributes.title ?? p.attributes?.reference;
          }
          reference = (
            <RefRender
              value={ref}
              flat={false}
              pt={psgType}
              fontSize={'0.8rem'}
            />
          );
          if (marks.current.findIndex((m) => m.label === reference) > -1)
            reference = (
              <RefRender
                value={ref + '#' + p.attributes?.sequencenum.toString()}
                flat={false}
                pt={psgType}
                fontSize={'0.8rem'}
              />
            );
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
