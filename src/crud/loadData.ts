import {
  offlineProjectCreate,
  offlineProjectFromProject,
  offlineProjectUpdateSnapshot,
  remoteIdGuid,
  remoteIdNum,
} from '.';
import { getDocSerializer } from '../serializers/getSerializer';
import JSONAPISource, {
  JSONAPIDocumentSerializer,
  ResourceDocument,
} from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  RecordTransformBuilder,
  RecordOperation,
  RecordIdentity,
  InitializedRecord,
  StandardRecordNormalizer,
  RecordKeyMap,
} from '@orbit/records';
import Memory from '@orbit/memory';
import {
  OrgData,
  IApiError,
  ProjectD,
  GroupMembershipD,
  OrganizationMembershipD,
} from '../model';
import { orbitInfo } from '../utils/infoMsg';
import ProjData from '../model/projData';
import Coordinator from '@orbit/coordinator';
import { getFingerprint } from '../utils/getFingerprint';
import { currentDateTime } from '../utils/currentDateTime';
import { orbitErr } from '../utils/infoMsg';
import { ReplaceRelatedRecord } from '../model/baseModel';
import PassageType from '../model/passageType';

const saveOfflineProject = async (
  project: ProjectD,
  memory: Memory,
  backup: IndexedDBSource,
  dataDate: string | undefined,
  isImport: boolean
) => {
  var oparray: RecordOperation[] = [];
  /* don't update to undefined dataDate from here */
  if (
    !dataDate ||
    !offlineProjectUpdateSnapshot(
      project.id,
      oparray,
      memory,
      dataDate,
      0,
      isImport
    )
  ) {
    /* if I have a dataDate, the update above failed for sure
     if I don't have a dataDate, go see if a record already exists */
    if (dataDate || !offlineProjectFromProject(memory, project.id)) {
      var fp = await getFingerprint();
      offlineProjectCreate(
        project,
        oparray,
        memory,
        fp,
        dataDate || '',
        isImport ? dataDate || '' : '',
        isImport
      );
    }
  }
  await backup.sync((t) => oparray);
  await memory.sync((t) => oparray);
};

interface IStat {
  beg: number;
  apiEnd: number;
  tbl: number;
  rec: number;
  ops: number;
  opStart: number;
  opEnd: number;
  opApply: number;
  opBack: number;
  prcEnd: number;
  snapBeg: number;
  snapEnd: number;
}

const statInit = () => {
  const beg = new Date().getTime();
  return {
    beg,
    apiEnd: 0,
    tbl: 0,
    rec: 0,
    ops: 0,
    opStart: 0,
    opEnd: 0,
    opApply: 0,
    opBack: 0,
    prcEnd: 0,
    snapBeg: 0,
    snapEnd: 0,
  };
};

const statReport = (stats: IStat[]) => {
  console.log(`Project load stats:`);
  let total = { time: 0, rec: 0, op: 0 };
  stats.forEach((stat) => {
    console.log(
      ` Tbl: ${stat.tbl} Rec: ${stat.rec} Ops: ${stat.ops} Api: ${
        stat.apiEnd - stat.beg
      } ToOps: ${stat.opEnd - stat.opStart} Apply: ${
        stat.opApply - stat.opEnd
      } Backup: ${stat.opBack - stat.opApply} Total: ${
        stat.prcEnd - stat.beg
      } Snap: ${stat.snapEnd - stat.snapBeg}`
    );
    total.time += stat.prcEnd - stat.beg;
    total.rec += stat.rec;
    total.op += stat.ops;
  });
  console.log(
    `  Grand Total Time: ${total.time} Recs: ${total.rec} Ops: ${total.op}`
  );
};

export async function insertData(
  item: InitializedRecord,
  memory: Memory,
  backup: IndexedDBSource,
  tb: RecordTransformBuilder,
  oparray: RecordOperation[],
  orbitError: (ex: IApiError) => void,
  checkExisting: boolean,
  isImport: boolean,
  isProject: boolean,
  snapshotDate?: string
) {
  var rec: InitializedRecord | InitializedRecord[] | null = null;
  var project: ProjectD | undefined = undefined;
  try {
    if (item.keys && checkExisting) {
      var id = remoteIdGuid(
        item?.type,
        item.keys['remoteId'],
        memory?.keyMap as RecordKeyMap
      );
      rec = memory.cache.query((q) =>
        q.findRecord({ type: item.type, id: id as string })
      );
    }
  } catch (err: any) {
    if (err.constructor.name !== 'RecordNotFoundException') {
      orbitError(orbitInfo(err, item.keys ? item.keys['remoteId'] : ''));
    }
  } finally {
    if (rec) {
      if (Array.isArray(rec)) rec = rec[0]; //won't be...
      rec.attributes = { ...item.attributes };
      oparray.push(tb.updateRecord(rec).toOperation());
      if (rec.type === 'project') {
        if (isProject) project = rec as ProjectD;
        await saveOfflineProject(
          rec as ProjectD,
          memory,
          backup,
          isProject ? snapshotDate : undefined,
          isImport && isProject
        );
      }
      for (var rel in item.relationships) {
        if (
          item.relationships[rel].data &&
          !Array.isArray(item.relationships[rel].data) &&
          (!rec.relationships ||
            !rec.relationships[rel] ||
            !rec.relationships[rel].data ||
            (item.relationships[rel].data as RecordIdentity).id !==
              (rec.relationships[rel].data as RecordIdentity).id)
        )
          oparray.push(
            ...ReplaceRelatedRecord(
              tb,
              rec,
              rel,
              (item.relationships[rel].data as RecordIdentity)?.type,
              (item.relationships[rel].data as RecordIdentity).id
            )
          );
      }
    } else {
      const rn = new StandardRecordNormalizer({ schema: memory?.schema });
      try {
        if (typeof item.id === 'number') item = rn.normalizeRecord(item);
        oparray.push(tb.addRecord(item).toOperation());
        if (item.type === 'project') {
          if (isProject) project = item as ProjectD;
          await saveOfflineProject(
            item as ProjectD,
            memory,
            backup,
            isProject ? snapshotDate : undefined,
            isImport && isProject
          );
        }
      } catch (err: any) {
        orbitError(orbitInfo(err, 'Add record error'));
      }
    }
  }
  return project;
}

async function processData(
  tables: ResourceDocument[],
  ser: JSONAPIDocumentSerializer,
  memory: Memory,
  backup: IndexedDBSource,
  tb: RecordTransformBuilder,
  setCompleted: (valud: number) => void,
  orbitError: (ex: IApiError) => void,
  stat: IStat
) {
  const oparray: RecordOperation[] = [];
  let completed = 50;
  setCompleted(completed);

  stat.tbl = tables.length;
  stat.opStart = new Date().getTime();
  for (let ti = 0; ti < tables.length; ti += 1) {
    const t = tables[ti];
    try {
      let jsonData = ser.deserialize(t).data;
      if (!jsonData) continue;
      if (!Array.isArray(jsonData)) jsonData = [jsonData];
      jsonData = jsonData.filter((item) => item.id && item.type);
      if (jsonData.length === 0) continue;
      console.log(
        `Processing ${jsonData[0].type} ${ti + 1} of ${tables.length} with ${
          jsonData.length
        } records`
      );
      stat.rec += jsonData.length;
      for (let ji = 0; ji < jsonData.length; ji += 1) {
        const item = jsonData[ji];
        await insertData(
          item,
          memory,
          backup,
          tb,
          oparray,
          orbitError,
          false,
          false,
          true, //isProject
          undefined
        );
      }
    } catch (err: any) {
      orbitError(orbitInfo(err, 'Error converting data to transforms'));
    }
  }
  stat.opEnd = new Date().getTime();
  stat.ops += oparray.length;
  // const inc =
  //   Math.floor((50 * 1000) / Math.floor((oparray.length * 8) / 2000)) / 1000;
  // const timer = setInterval(() => {
  //   completed += inc;
  //   if (completed > 99) completed = 99;
  //   setCompleted(completed);
  //   console.log(`Loading... ${completed.toFixed(2)}%`);
  // }, 500);

  try {
    //this was slower than just waiting for them both separately
    //await Promise.all([memory.update(oparray), backup.push(oparray)]);
    // const stateChange: RecordOperation[] = [];
    const rest: RecordOperation[] = [];
    oparray.forEach((op) => {
      if (op.record.type !== 'passagestatechange') {
        rest.push(op);
        // } else {
        //   stateChange.push(op);
      }
    });
    const inc = Math.floor((50 * 1000 * 1000) / rest.length) / 1000;
    const chunk = Math.floor(rest.length / 1000);
    for (let i = 0; i <= chunk; i += 1) {
      const curOps = rest.slice(i * 1000, (i + 1) * 1000);
      const transform = {
        id: 'xyz' + Date.now().toString(),
        operations: curOps,
      };
      console.log(`Applying ${curOps.length} operations...`);
      await Promise.all([
        new Promise((r) => setTimeout(r, 100)), // allow time for UI update
        memory.sync(transform),
      ]);
      console.log(`Applied ${curOps.length} operations.`);
      completed += inc;
      if (completed > 99) completed = 99;
      setCompleted(Math.floor(completed));
    }
    // This will be done by sanity check so as not to block user
    // It will happen at next log on in a background thread
    // memory.sync({
    //   id: 'psc' + Date.now().toString(),
    //   operations: stateChange,
    // });
    stat.opApply = new Date().getTime();
  } catch (err: any) {
    orbitError(orbitInfo(err, 'Unable to load data in memory'));
    console.log(err);
  }
  // clearInterval(timer);
  // setCompleted(99);
  stat.opBack = new Date().getTime();
}
async function cleanUpMemberships(memory: Memory, backup: IndexedDBSource) {
  var t = new RecordTransformBuilder();
  var ops: RecordOperation[] = [];
  const orgmems: OrganizationMembershipD[] = memory.cache.query((q) =>
    q.findRecords('organizationmembership')
  ) as any;
  const badom = orgmems.filter(
    (om) => !om.attributes || !om.relationships?.user?.data
  );
  badom.forEach((i) => {
    ops.push(
      t.removeRecord({ type: 'organizationmembership', id: i.id }).toOperation()
    );
  });
  const grpmems: GroupMembershipD[] = memory.cache.query((q) =>
    q.findRecords('groupmembership')
  ) as any;
  const badgm = grpmems.filter(
    (om) => !om.attributes || !om.relationships?.user?.data
  );
  badgm.forEach((i) => {
    ops.push(
      t.removeRecord({ type: 'groupmembership', id: i.id }).toOperation()
    );
  });
  await backup.sync((t) => ops);
  await memory.sync((t) => ops);
}
export async function LoadData(
  coordinator: Coordinator,
  setCompleted: (valud: number) => void,
  orbitError: (ex: IApiError) => void
): Promise<boolean> {
  const memory = coordinator?.getSource('memory') as Memory;
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  var tb: RecordTransformBuilder = new RecordTransformBuilder();
  const ser = getDocSerializer(memory);
  //const { checkIt } = usePassageType();

  try {
    let start = 0;
    setCompleted(15);
    const stats: IStat[] = [];
    const tables: ResourceDocument[] = [];
    do {
      const stat = statInit();
      var transform: OrgData[] = (await remote.query(
        // eslint-disable-next-line no-loop-func
        (q) =>
          q.findRecords('orgdata').filter(
            {
              attribute: 'json',
              value: `{version: ${backup.schema.version}}`,
            },
            { attribute: 'start-index', value: start }
          ),
        {
          label: 'Get Data',
          sources: {
            remote: {
              settings: {
                timeout: 35000,
              },
            },
          },
        }
      )) as any;
      stat.apiEnd = new Date().getTime();

      if (transform.length > 0) {
        var r: OrgData = transform[0];
        const x = JSON.parse(r.attributes.json);
        tables.push(...(x.data as ResourceDocument[]));

        start = r.attributes.startnext;
        const comp = 15 + start;
        if (comp < 100) setCompleted(comp);
      } else {
        //bail - never expect to be here
        start = -1;
      }

      //checkIt();
      // var len = (
      //   memory.cache.query((q) => q.findRecords('passagetype')) as PassageType[]
      // ).filter((p) => Boolean(p?.keys?.remoteId)).length;
      // if (len > 5) console.log('orgdata passagetype ' + len.toString());
      stat.prcEnd = new Date().getTime();
      stats.push(stat);
    } while (start > -1);

    await processData(
      tables,
      ser,
      memory,
      backup,
      tb,
      setCompleted,
      orbitError,
      stats[stats.length - 1]
    );
    stats[stats.length - 1].prcEnd = new Date().getTime();
    statReport(stats);

    await cleanUpMemberships(memory, backup);
  } catch (rejected: any) {
    orbitError(orbitErr(rejected, 'load data rejected'));
  }
  setCompleted(100);
  return false;
}
export async function LoadProjectData(
  project: string,
  coordinator: Coordinator,
  setCompleted: (valud: number) => void,
  online: boolean,
  projectsLoaded: string[],
  AddProjectLoaded: (proj: string) => void,
  setBusy: (v: boolean) => void,
  orbitError: (ex: IApiError) => void
): Promise<boolean> {
  const memory = coordinator?.getSource('memory') as Memory;
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  //const { checkIt } = usePassageType();
  if (projectsLoaded.includes(project)) return true;
  if (!remote || !online) throw new Error('offline.');
  let error = false;

  const projectid = remoteIdNum(
    'project',
    project,
    memory?.keyMap as RecordKeyMap
  );
  var tb: RecordTransformBuilder = new RecordTransformBuilder();
  const ser = getDocSerializer(memory);

  try {
    let start = 0;
    setCompleted(15);
    setBusy(true);
    const oparray: RecordOperation[] = [];
    const stats: IStat[] = [];
    const tables: ResourceDocument[] = [];
    do {
      const stat = statInit();
      var transform: ProjData[] = (await remote.query(
        // eslint-disable-next-line no-loop-func
        (q) =>
          q.findRecords('projdata').filter(
            {
              attribute: 'json',
              value: `{version: ${backup.schema.version}}`,
            },
            { attribute: 'start-index', value: start },
            { attribute: 'project-id', value: projectid }
          ),
        {
          label: 'Get Project Data',
          sources: {
            remote: {
              settings: {
                timeout: 35000,
              },
            },
          },
        }
      )) as any;
      stat.apiEnd = new Date().getTime();

      if (transform.length > 0) {
        var r: ProjData = transform[0];
        const x = JSON.parse(r.attributes.json);
        tables.push(...(x.data as ResourceDocument[]));
        //checkIt();
        var len = (
          memory.cache.query((q) =>
            q.findRecords('passagetype')
          ) as PassageType[]
        ).filter((p) => Boolean(p?.keys?.remoteId)).length;
        if (len > 5) console.log('projdata passagetype ' + len.toString());

        if (start === 0) {
          stat.snapBeg = new Date().getTime();
          offlineProjectUpdateSnapshot(
            project,
            oparray,
            memory,
            r.attributes.snapshotdate || currentDateTime(),
            0,
            false
          );
          await backup.sync((t) => oparray); // ?? This shouldn't be necessary
          await memory.sync((t) => oparray);
          stat.snapEnd = new Date().getTime();
        }
        start = r.attributes.startnext;
        let comp = 15 + start * 4;
        if (comp < 100) setCompleted(comp);
      } else {
        //bail - never expect to be here
        start = -1;
      }
      stat.prcEnd = new Date().getTime();
      stats.push(stat);
    } while (start > -1);

    await processData(
      tables,
      ser,
      memory,
      backup,
      tb,
      setCompleted,
      orbitError,
      stats[stats.length - 1]
    );
    stats[stats.length - 1].prcEnd = new Date().getTime();
    statReport(stats);
  } catch (rejected: any) {
    orbitError(orbitErr(rejected, 'load project data rejected'));
    error = true;
  } finally {
    setBusy(false);
  }
  AddProjectLoaded(project);
  setCompleted(100);
  return !error;
}
