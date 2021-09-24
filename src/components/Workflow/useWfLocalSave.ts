import { useGlobal } from 'reactn';
import { Section, Passage, ActivityStates, IWorkflow } from '../../model';
import { AddRecord, UpdateRecord } from '../../model/baseModel';
import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import {
  UpdateRelatedPassageOps,
  UpdatePassageStateOps,
  UpdateRelatedSectionOps,
} from '../../crud';
import {
  isPassageAdding,
  isPassageRow,
  isPassageUpdated,
  isSectionAdding,
  isSectionRow,
  isSectionUpdated,
} from '.';

interface IProps {
  setComplete: (val: number) => void;
}

export const useWfLocalSave = (props: IProps) => {
  const { setComplete } = props;
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');

  return async (
    workflow: IWorkflow[],
    sections: Section[],
    passages: Passage[],
    lastSaved?: string
  ) => {
    let lastSec = { id: 'never here' } as RecordIdentity;
    const numRecs = workflow.length;
    for (let rIdx = 0; rIdx < numRecs; rIdx += 1) {
      // if numRecs >= 200, status set in caller
      if ((offlineOnly || numRecs < 200) && rIdx % 20 === 0) {
        //this is slow...so find a happy medium between info and speed
        setComplete(((rIdx / numRecs) * 100) | 0);
      }
      const item = workflow[rIdx];
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
              },
            };
            const t = new TransformBuilder();
            const ops = UpdateRecord(t, secRec, user);
            UpdateRelatedSectionOps(plan, user, t, ops);
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
              },
            } as any;
            const planRecId = { type: 'plan', id: plan };
            const t = new TransformBuilder();
            await memory.update([
              ...AddRecord(t, newRec, user, memory),
              t.replaceRelatedRecord(newRec, 'plan', planRecId),
            ]);
            item.sectionId = { type: 'section', id: newRec.id };
            lastSec = newRec;
          }
        } else {
          lastSec = item.sectionId as RecordIdentity;
        }
      }
      if (isPassageRow(item) && isPassageUpdated(item, lastSaved)) {
        if (!isPassageAdding(item) && !item.deleted) {
          const itemId = item?.passageId?.id || '';
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
          UpdateRelatedPassageOps(lastSec.id, plan, user, t, ops);
          await memory.update(ops);
        } else if (item.deleted) {
          const t = new TransformBuilder();
          await memory.update(t.removeRecord(item.passageId as RecordIdentity));
        } else {
          // Adding Passage
          const passRec: Passage = {
            type: 'passage',
            attributes: {
              sequencenum: item.passageSeq,
              book: item.book,
              reference: item.reference,
              title: item.comment,
              state: ActivityStates.NoMedia,
            },
          } as any;
          const secRecId = { type: 'section', id: lastSec.id };
          const t = new TransformBuilder();
          const ops: Operation[] = [
            ...AddRecord(t, passRec, user, memory),
            t.replaceRelatedRecord(passRec, 'section', secRecId),
          ];
          item.passageId = { type: 'passage', id: passRec.id };
          UpdatePassageStateOps(
            passRec.id,
            lastSec.id,
            plan,
            ActivityStates.NoMedia,
            '',
            user,
            t,
            ops,
            memory
          );
          await memory.update(ops);
        }
      }
    }
  };
};
