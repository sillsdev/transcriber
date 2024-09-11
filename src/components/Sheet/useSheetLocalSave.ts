import { useGlobal } from 'reactn';
import {
  SectionD,
  Passage,
  PassageD,
  ActivityStates,
  ISheet,
} from '../../model';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../../model/baseModel';
import {
  RecordOperation,
  RecordIdentity,
  RecordTransformBuilder,
} from '@orbit/records';
import { related } from '../../crud/related';
import { UpdateRelatedPassageOps } from '../../crud/updatePassageState';
import { isPassageRow, isSectionRow } from './isSectionPassage';
import {
  isPassageAdding,
  isPassageUpdated,
  isSectionAdding,
  isSectionUpdated,
} from './isSectionPassageUpdated';
import { usePassageType } from '../../crud/usePassageType';
import { usePublishDestination } from '../../crud/usePublishDestination';

interface IProps {
  setComplete: (val: number) => void;
}

export const useWfLocalSave = (props: IProps) => {
  const { setComplete } = props;
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { getPassageTypeRec, checkIt } = usePassageType();
  const { setPublishTo, isPublished } = usePublishDestination();
  return async (
    sheet: ISheet[],
    sections: SectionD[],
    passages: PassageD[],
    lastSaved?: string
  ) => {
    let lastSec = { id: 'never here' } as RecordIdentity;
    const numRecs = sheet.length;
    for (let rIdx = 0; rIdx < numRecs; rIdx += 1) {
      // if numRecs >= 200, status set in caller
      if ((offlineOnly || numRecs < 200) && rIdx % 20 === 0) {
        //this is slow...so find a happy medium between info and speed
        setComplete(((rIdx / numRecs) * 100) | 0);
      }
      const item = sheet[rIdx];
      if (isSectionRow(item)) {
        if (isSectionUpdated(item, lastSaved)) {
          if (!isSectionAdding(item) && !item.deleted) {
            const itemId = item?.sectionId?.id || '';
            const curSec = sections.filter((s) => s.id === itemId)[0];
            const secRec: SectionD = {
              ...curSec,
              attributes: {
                ...curSec.attributes,
                sequencenum: item.sectionSeq,
                name: item.title || '',
                level: item.level,
                published: isPublished(item.published),
                publishTo: setPublishTo(item.published),
                state: item.level < 3 ? item.reference ?? '' : '',
              },
            };
            const t = new RecordTransformBuilder();
            const ops: RecordOperation[] = [...UpdateRecord(t, secRec, user)];
            if (item?.titleMediaId?.id !== related(curSec, 'titleMediafile')) {
              ops.push(
                ...UpdateRelatedRecord(
                  t,
                  secRec,
                  'titleMediafile',
                  'mediafile',
                  item?.titleMediaId?.id,
                  user
                )
              );
            }
            await memory.update(ops);
            lastSec = secRec;
          } else if (item.deleted) {
            const t = new RecordTransformBuilder();
            await memory.update(
              t.removeRecord(item.sectionId as RecordIdentity)
            );
          } else {
            // Adding Section
            const newRec = {
              type: 'section',
              attributes: {
                sequencenum: item.sectionSeq,
                name: item.title || '',
                state: item.level < 3 ? item.reference : '',
                level: item.level,
                published: isPublished(item.published),
                publishTo: setPublishTo(item.published),
              },
            } as any;
            const t = new RecordTransformBuilder();
            const ops: RecordOperation[] = [
              ...AddRecord(t, newRec, user, memory),
              ...ReplaceRelatedRecord(t, newRec, 'plan', 'plan', plan),
            ];
            if (item?.titleMediaId?.id)
              ops.push(
                ...ReplaceRelatedRecord(
                  t,
                  newRec,
                  'titleMediafile',
                  'mediafile',
                  item?.titleMediaId?.id
                )
              );
            await memory.update(ops);
            item.sectionId = { type: 'section', id: newRec.id };
            lastSec = newRec;
          }
        } else {
          lastSec = item.sectionId as RecordIdentity;
        }
      }
      if (isPassageRow(item) && isPassageUpdated(item, lastSaved)) {
        const psgType = getPassageTypeRec(item.passageType);
        if (!isPassageAdding(item) && !item.deleted) {
          const itemId = item?.passage?.id || '';
          const curPass = passages.filter((p) => p.id === itemId)[0];
          const passRec = {
            ...curPass,
            attributes: {
              ...curPass.attributes,
              sequencenum: item.passageSeq,
              book: item.book,
              reference: item.reference,
              title: item.comment,
            },
          } as PassageD;
          const t = new RecordTransformBuilder();
          const ops = UpdateRecord(t, passRec, user);
          if (lastSec.id !== related(curPass, 'section'))
            ops.push(
              ...UpdateRelatedRecord(
                t,
                passRec,
                'section',
                'section',
                lastSec.id,
                user
              )
            );
          if (psgType?.id && psgType.id !== related(curPass, 'passagetype')) {
            ops.push(
              ...UpdateRelatedRecord(
                t,
                passRec,
                'passagetype',
                'passagetype',
                psgType.id,
                user
              )
            );
          }
          UpdateRelatedPassageOps(lastSec.id, plan, user, t, ops);
          await memory.update(ops);
        } else if (item.deleted) {
          const t = new RecordTransformBuilder();
          await memory.update(t.removeRecord(item.passage as RecordIdentity));
        } else {
          // Adding Passage
          const passRec = {
            type: 'passage',
            attributes: {
              sequencenum: item.passageSeq,
              book: item.book,
              reference: item.reference,
              title: item.comment,
              state: ActivityStates.NoMedia,
            },
          } as Passage;
          const t = new RecordTransformBuilder();
          const ops: RecordOperation[] = [
            ...AddRecord(t, passRec, user, memory),
            ...ReplaceRelatedRecord(
              t,
              passRec as PassageD,
              'section',
              'section',
              lastSec.id
            ),
          ];
          if (psgType)
            ops.push(
              ...ReplaceRelatedRecord(
                t,
                passRec as PassageD,
                'passagetype',
                'passagetype',
                psgType?.id
              )
            );
          await memory.update(ops);
        }
      }
    }
    checkIt('WFLocalSave');
  };
};
