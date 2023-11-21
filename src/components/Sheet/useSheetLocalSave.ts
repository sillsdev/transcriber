import { useGlobal } from 'reactn';
import { Section, Passage, ActivityStates, ISheet } from '../../model';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../../model/baseModel';
import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import { related, UpdateRelatedPassageOps } from '../../crud';
import {
  isPassageAdding,
  isPassageRow,
  isPassageUpdated,
  isSectionAdding,
  isSectionRow,
  isSectionUpdated,
} from '.';
import { usePassageType } from '../../crud/usePassageType';

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

  return async (
    sheet: ISheet[],
    sections: Section[],
    passages: Passage[],
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
            const secRec = {
              ...curSec,
              attributes: {
                ...curSec.attributes,
                sequencenum: item.sectionSeq,
                name: item.title || '',
                level: item.level,
                published: item.published,
              },
            };
            const t = new TransformBuilder();
            const ops: Operation[] = [...UpdateRecord(t, secRec, user)];
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
            const t = new TransformBuilder();
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
                state: ActivityStates.NoMedia,
                level: item.level,
                published: item.published, //or false?
              },
            } as any;
            const t = new TransformBuilder();
            const ops: Operation[] = [
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
          } as Passage;
          const t = new TransformBuilder();
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
          if (psgType?.id !== related(curPass, 'passagetype')) {
            ops.push(
              ...UpdateRelatedRecord(
                t,
                passRec,
                'passagetype',
                'passagetype',
                psgType?.id,
                user
              )
            );
          }
          UpdateRelatedPassageOps(lastSec.id, plan, user, t, ops);
          await memory.update(ops);
        } else if (item.deleted) {
          const t = new TransformBuilder();
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
          const t = new TransformBuilder();
          const ops: Operation[] = [
            ...AddRecord(t, passRec, user, memory),
            ...ReplaceRelatedRecord(
              t,
              passRec,
              'section',
              'section',
              lastSec.id
            ),
          ];
          if (psgType)
            ops.push(
              ...ReplaceRelatedRecord(
                t,
                passRec,
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