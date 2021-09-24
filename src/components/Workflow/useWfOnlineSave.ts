import { useGlobal } from 'reactn';
import { SectionPassage, IWorkflow } from '../../model';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import JSONAPISource from '@orbit/jsonapi';
import { remoteId, remoteIdNum, remoteIdGuid } from '../../crud';
import {
  isSectionRow,
  isPassageRow,
  isSectionAdding,
  isPassageAdding,
  isSectionUpdated,
  isPassageUpdated,
} from '.';
import { waitForIt, generateUUID } from '../../utils';

interface SaveRec {
  id: string;
  issection: boolean;
  changed: boolean;
  deleted: boolean;
  sequencenum: string;
  book?: string;
  reference?: string;
  title: string;
}

interface IProps {
  setComplete: (val: number) => void;
}
export const useWfOnlineSave = (props: IProps) => {
  const { setComplete } = props;
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [plan] = useGlobal('plan');

  const getRemoteId = async (table: string, localid: string) => {
    await waitForIt(
      'remoteId',
      () => remoteId(table, localid, memory.keyMap) !== undefined,
      () => false,
      100
    );
    return remoteId(table, localid, memory.keyMap);
  };

  // return Promise<boolean>: true if deep changes in workflow
  return async (workflow: IWorkflow[], lastSaved?: string) => {
    const recs: SaveRec[][] = [];
    for (let ix = 0; ix < workflow.length; ix += 1) {
      const w = workflow[ix];
      const rowRec: SaveRec[] = [];
      if (isSectionRow(w)) {
        let rec = {
          issection: true,
          changed: isSectionUpdated(w, lastSaved) && !w.deleted,
          deleted: w.deleted,
          id: isSectionAdding(w)
            ? ''
            : await getRemoteId('section', w.sectionId?.id as string),
        } as SaveRec;
        if (rec.changed)
          rec = {
            ...rec,
            sequencenum: w.sectionSeq.toString(),
            title: w?.title || '',
          };
        rowRec.push(rec);
      }
      if (isPassageRow(w)) {
        let rec = {
          issection: false,
          changed: isPassageUpdated(w, lastSaved) && !w.deleted,
          deleted: w.deleted,
          id: isPassageAdding(w)
            ? ''
            : await getRemoteId('passage', w.passageId?.id as string),
        } as SaveRec;
        if (rec.changed) {
          rec = {
            ...rec,
            sequencenum: w.passageSeq.toString(),
            book: w.book,
            reference: w.reference,
            title: w.comment || '',
          };
        }
        rowRec.push(rec);
      }
      recs.push(rowRec);
    }
    const sp: SectionPassage = {
      attributes: {
        data: JSON.stringify(recs),
        planId: remoteIdNum('plan', plan, memory.keyMap),
        uuid: generateUUID(),
      },
      type: 'sectionpassage',
    } as SectionPassage;
    memory.schema.initializeRecord(sp);
    setComplete(20);
    var dumbrec = await memory.update(
      (t: TransformBuilder) => t.addRecord(sp),
      {
        label: 'Update Plan Section and Passages',
        sources: {
          remote: {
            settings: {
              timeout: 2000000,
            },
          },
        },
      }
    );
    //null only if sent twice by orbit
    if (dumbrec) {
      setComplete(50);
      //dumbrec does not contain the new data...just the new id so go get it
      var filterrec = {
        attribute: 'plan-id',
        value: remoteId('plan', plan, memory.keyMap),
      };
      //must wait for these...in case they they navigate away before done
      await memory.sync(
        await remote.pull((q) => q.findRecords('section').filter(filterrec))
      );
      await memory.sync(
        await remote.pull((q) => q.findRecords('passage').filter(filterrec))
      );
      await memory.sync(
        await remote.pull((q) => q.findRecord({ type: 'plan', id: plan }))
      );
      const anyNew = workflow.reduce(
        (prev, cur) =>
          prev ||
          (isSectionRow(cur) && isSectionAdding(cur)) ||
          (isPassageRow(cur) && isPassageAdding(cur)),
        false
      );
      if (anyNew) {
        var rec: SectionPassage = (await remote.query((q: QueryBuilder) =>
          q.findRecord({ type: 'sectionpassage', id: dumbrec.id })
        )) as any;
        if (rec !== undefined) {
          //outrecs is an array of arrays of IRecords
          const outrecs = JSON.parse(rec.attributes.data);
          workflow.forEach((row, index) => {
            if (isSectionRow(row) && isSectionAdding(row))
              row.sectionId = {
                type: 'section',
                id: remoteIdGuid(
                  'section',
                  (outrecs[index][0] as SaveRec).id,
                  memory.keyMap
                ),
              };
            if (isPassageRow(row) && isPassageAdding(row)) {
              row.passageId = {
                type: 'passage',
                id: remoteIdGuid(
                  'passage',
                  (outrecs[index][isSectionRow(row) ? 1 : 0] as SaveRec).id,
                  memory.keyMap
                ),
              };
            }
          });
          return true;
        }
      }
    }
    return false;
  };
};
