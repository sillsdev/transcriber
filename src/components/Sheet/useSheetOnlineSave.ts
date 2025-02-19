import { useGlobal } from '../../context/GlobalContext';
import { SectionPassage, SectionPassageD, ISheet, PassageD } from '../../model';
import {
  RecordTransformBuilder,
  RecordOperation,
  RecordIdentity,
  StandardRecordNormalizer,
  RecordKeyMap,
} from '@orbit/records';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  remoteId,
  remoteIdNum,
  remoteIdGuid,
  findRecord,
  usePublishDestination,
} from '../../crud';
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
import { pullRemoteToMemory } from '../../crud/syncToMemory';

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
  published: boolean;
  publishTo: string;
  titlemediafile: string;
}

interface IProps {
  setComplete: (val: number) => void;
}
export const useWfOnlineSave = (props: IProps) => {
  const { setComplete } = props;
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const [plan] = useGlobal('plan'); //will be constant here
  const { getPassageTypeRec, checkIt } = usePassageType();
  const { setPublishTo, isPublished } = usePublishDestination();

  const getRemoteId = async (table: string, localid: string) => {
    await waitForIt(
      'remoteId',
      () =>
        remoteId(table, localid, memory?.keyMap as RecordKeyMap) !== undefined,
      () => false,
      100
    );
    return remoteId(table, localid, memory?.keyMap as RecordKeyMap);
  };

  // return Promise<boolean>: true if deep changes in sheet
  return async (sheet: ISheet[], lastSaved?: string) => {
    let hasNew = false;
    const recs: SaveRec[][] = [];
    const deleteItems: number[] = [];
    var anychanged = false;
    for (let ix = 0; ix < sheet.length; ix += 1) {
      const w = sheet[ix];
      if (w.deleted) deleteItems.push(ix);
      const rowRec: SaveRec[] = [];
      if (isSectionRow(w)) {
        let rec = {
          issection: true,
          level: w.level,
          published: isPublished(w.published || []),
          publishTo: setPublishTo(w.published || []),
          titlemediafile:
            (w?.titleMediaId?.id &&
              (await getRemoteId('mediafile', w?.titleMediaId?.id))) ||
            '',
          changed: !w.deleted && isSectionUpdated(w, lastSaved),
          deleted: w.deleted,
          id: isSectionAdding(w)
            ? ''
            : await getRemoteId('section', w.sectionId?.id as string),
          reference: w.level < 3 ? w.reference : '',
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
        var psgType = getPassageTypeRec(w.passageType);
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
              ? await getRemoteId('passagetype', psgType.id as string)
              : undefined,

            sharedResourceId: w.sharedResource
              ? await getRemoteId('sharedresource', w.sharedResource.id)
              : undefined,
          };
        }
        rowRec.push(rec);
      }
      recs.push(rowRec);
    }
    if (anychanged || deleteItems.length > 0) {
      let sp: SectionPassage = {
        attributes: {
          data: JSON.stringify(recs),
          planId: remoteIdNum('plan', plan, memory?.keyMap as RecordKeyMap),
          uuid: generateUUID(),
        },
        type: 'sectionpassage',
      } as SectionPassage;
      const rn = new StandardRecordNormalizer({ schema: memory?.schema });
      sp = rn.normalizeRecord(sp) as SectionPassageD;
      setComplete(20);
      let rec = await memory.update((t: any) => t.addRecord(sp), {
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
        const filter = [
          {
            attribute: 'plan-id',
            value: remoteId('plan', plan, memory?.keyMap as RecordKeyMap),
          },
        ];
        //must wait for these...in case they they navigate away before done
        for (const table of ['section', 'passage']) {
          await pullRemoteToMemory({ table, memory, remote, filter });
        }
        await pullRemoteToMemory({ table: 'plan', memory, remote });
        const anyNew = sheet.reduce(
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
          const outrecs = JSON.parse((rec as any)?.attributes?.data);
          sheet.forEach((row, index) => {
            if (isSectionRow(row) && isSectionAdding(row))
              row.sectionId = {
                type: 'section',
                id: remoteIdGuid(
                  'section',
                  (outrecs[index][0] as SaveRec).id,
                  memory?.keyMap as RecordKeyMap
                ) as string,
              };
            if (isPassageRow(row) && isPassageAdding(row)) {
              row.passage = findRecord(
                memory,
                'passage',
                remoteIdGuid(
                  'passage',
                  (outrecs[index][isSectionRow(row) ? 1 : 0] as SaveRec).id,
                  memory?.keyMap as RecordKeyMap
                ) as string
              ) as PassageD;
            }
          });
        }
      }
    }
    if (deleteItems.length > 0) {
      const tb = new RecordTransformBuilder();
      const operations: RecordOperation[] = [];
      deleteItems.forEach((i) => {
        const ws = sheet[i];
        if (ws.sectionId)
          operations.push(tb.removeRecord(ws.sectionId).toOperation());
        if (ws.passage)
          operations.push(
            tb.removeRecord(ws.passage as RecordIdentity).toOperation()
          );
      });
      if (operations.length > 0) {
        await backup.sync((t) => operations);
        await memory.sync((t) => operations);
      }
    }
    checkIt('useWfOnlineSave');
    return hasNew || deleteItems.length > 0;
  };
};
