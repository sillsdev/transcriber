import { useGlobal } from 'reactn';
import { SectionPassage, IWorkflow, Passage } from '../../model';
import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import { remoteId, remoteIdNum, remoteIdGuid, findRecord } from '../../crud';
import {
  isSectionRow,
  isPassageRow,
  isSectionAdding,
  isPassageAdding,
  isSectionUpdated,
  isPassageUpdated,
} from '.';
import { waitForIt, generateUUID } from '../../utils';
import { usePassageType } from '../../crud/usePassageType';

interface SaveRec {
  id: string;
  issection: boolean;
  level: number;
  changed: boolean;
  deleted: boolean;
  sequencenum: string;
  book?: string;
  reference?: string;
  title: string;
  passagetypeId?: string;
  sharedResourceId?: string;
}

interface IProps {
  setComplete: (val: number) => void;
}
export const useWfOnlineSave = (props: IProps) => {
  const { setComplete } = props;
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [plan] = useGlobal('plan');
  const { GetPassageTypeRec, CheckIt } = usePassageType();

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
    let hasNew = false;
    const recs: SaveRec[][] = [];
    const deleteItems: number[] = [];
    var anychanged = false;
    for (let ix = 0; ix < workflow.length; ix += 1) {
      const w = workflow[ix];
      if (w.deleted) deleteItems.push(ix);
      const rowRec: SaveRec[] = [];
      if (isSectionRow(w)) {
        let rec = {
          issection: true,
          level: w.level,
          changed: !w.deleted && isSectionUpdated(w, lastSaved),
          deleted: w.deleted,
          id: isSectionAdding(w)
            ? ''
            : await getRemoteId('section', w.sectionId?.id as string),
        } as SaveRec;
        if (rec.changed) {
          rec = {
            ...rec,
            sequencenum: w.sectionSeq.toString(),
            title: w?.title || '',
          };
          anychanged = true;
        }
        rowRec.push(rec);
      }
      if (isPassageRow(w)) {
        var psgType = GetPassageTypeRec(w.passageType);
        let rec = {
          issection: false,
          changed: !w.deleted && isPassageUpdated(w, lastSaved),
          deleted: w.deleted,
          id: isPassageAdding(w)
            ? ''
            : await getRemoteId('passage', w.passage?.id as string),
        } as SaveRec;

        if (rec.changed) {
          anychanged = true;
          rec = {
            ...rec,
            sequencenum: w.passageSeq.toString(),
            book: w.book,
            reference: w.reference,
            title: w.comment || '',
            passagetypeId: psgType
              ? await getRemoteId('passagetype', psgType.id)
              : undefined,

            sharedResourceId: w.sharedResourceId
              ? await getRemoteId('sharedresource', w.sharedResourceId.id)
              : undefined,
          };
        }
        rowRec.push(rec);
      }
      recs.push(rowRec);
    }
    if (anychanged || deleteItems.length > 0) {
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
      var rec = await memory.update((t: TransformBuilder) => t.addRecord(sp), {
        label: 'Update Plan Section and Passages',
        sources: {
          remote: {
            settings: {
              timeout: 2000000,
            },
          },
        },
      });
      //null only if sent twice by orbit
      if (rec) {
        setComplete(50);
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
        hasNew = anyNew;
        if (anyNew) {
          //set the ids in the sheet
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
              row.passage = findRecord(
                memory,
                'passage',
                remoteIdGuid(
                  'passage',
                  (outrecs[index][isSectionRow(row) ? 1 : 0] as SaveRec).id,
                  memory.keyMap
                )
              ) as Passage;
            }
          });
        }
      }
    }
    if (deleteItems.length > 0) {
      const tb = new TransformBuilder();
      const operations: Operation[] = [];
      deleteItems.forEach((i) => {
        const wf = workflow[i];
        if (wf.sectionId) operations.push(tb.removeRecord(wf.sectionId));
        if (wf.passage)
          operations.push(tb.removeRecord(wf.passage as RecordIdentity));
      });
      if (operations.length > 0) {
        await memory.sync(await backup.push(operations));
      }
    }
    CheckIt('useWfOnlineSave');
    return hasNew || deleteItems.length > 0;
  };
};
