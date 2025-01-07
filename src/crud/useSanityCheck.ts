import { useContext } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { findRecord, related, staticFiles, updateableFiles } from '.';
import Memory from '@orbit/memory';
import moment from 'moment';
import { BaseModel } from '../model/baseModel';
import { JSONAPISource } from '@orbit/jsonapi';
import { logError, Severity } from '../utils';
import { VwChecksum, PlanD, ProjectD } from '../model';
import * as actions from '../store';
import { TokenContext } from '../context/TokenProvider';
import { API_CONFIG } from '../api-variable';
import { processDataChanges } from '../hoc/DataChanges';

export const useSanityCheck = (setLanguage: typeof actions.setLanguage) => {
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator?.getSource('memory') as Memory;
  const remote = coordinator?.getSource('datachanges') as JSONAPISource;
  const token = useContext(TokenContext).state.accessToken;
  const [errorReporter] = useGlobal('errorReporter');
  const [isOffline] = useGlobal('offline');

  const stringToDateNum = (val: string) =>
    val ? moment(val.endsWith('Z') ? val : val + 'Z').valueOf() : 0;

  return async (projectId: string) => {
    const doForceTableChanges = async (props: {
      project: string;
      table: string;
      dtSince: string;
      errorReporter: any;
      cb?: () => void;
    }) => {
      const { project, table, dtSince, errorReporter, cb } = props;
      //project/{project}/{table}/{start}/since/{since}
      const api =
        API_CONFIG.host + `/api/datachanges/project/${project}/${table}/`;
      let start = 1;
      let tries = 2;
      let startNext = 0;
      while (startNext >= 0 && tries > 0) {
        startNext = await processDataChanges({
          token,
          api: `${api}${startNext}/since/${dtSince}`,
          params: undefined,
          started: start,
          coordinator,
          user: '',
          errorReporter,
          setLanguage,
          setDataChangeCount: (value: number) => {},
          fetchUrl: undefined,
          cb,
        });
        if (startNext === start) tries--;
        else start = startNext;
      }
    };
    const getChecksum = (
      rows: { id: string; num: number }[],
      name: string,
      beforeThis?: number
    ) => {
      var sum = 0;
      var sorted = beforeThis ? rows.sort((i, j) => i.num - j.num) : rows;
      sorted.forEach((mf) => {
        if (mf) {
          if (beforeThis && mf.num > beforeThis) return sum;

          sum += mf.num % 100000000;
        }
      });
      return sum;
    };

    const compareChecksum = async (remoteRows: VwChecksum[], name: string) => {
      var rows = removeDups(getTableRows(name) as BaseModel[]);
      var cs = getChecksum(rows, name);
      var remoteCs =
        remoteRows.filter((t) => t.attributes.name === name)[0]?.attributes
          .checksum ?? 0;
      if (cs !== remoteCs) {
        console.log(remoteProjectId, name, cs, remoteCs);
        console.log(
          rows
            .sort((i, j) => parseInt(i.id) - parseInt(j.id))
            .map((r) => r.id)
            .join(',')
        );
        await refreshTable(name, rows.length, remoteCs);
      }
    };

    const getTableRows = (table: string) => {
      var org = related(project, 'organization');

      const mediafileRows = () =>
        (
          memory?.cache.query((q) =>
            q.findRecords('mediafile').filter({
              relation: 'plan',
              record: { type: 'plan', id: plan.id },
            })
          ) as BaseModel[]
        ).filter((x) => Boolean(x?.keys?.remoteId) && Boolean(x.relationships));
      const discussionRows = () => {
        var mediafiles = mediafileRows().map((m) => m.id);
        return (
          memory?.cache.query((q) => q.findRecords('discussion')) as BaseModel[]
        ).filter(
          (d) =>
            Boolean(d.relationships) &&
            mediafiles.find((id) => id === related(d, 'mediafile')) !==
              undefined
        );
      };
      const groupRows = () =>
        (
          memory?.cache.query((q) =>
            q.findRecords('group').filter({
              relation: 'owner',
              record: { type: 'organization', id: org },
            })
          ) as BaseModel[]
        ).filter((x) => Boolean(x?.keys?.remoteId));

      const sectionRows = () =>
        (
          memory?.cache.query((q) =>
            q.findRecords('section').filter({
              relation: 'plan',
              record: { type: 'plan', id: plan.id },
            })
          ) as BaseModel[]
        ).filter((x) => Boolean(x?.keys?.remoteId));

      const passageRows = () => {
        var sections = sectionRows().map((s) => s.id);
        return (
          memory?.cache.query((q) => q.findRecords('passage')) as BaseModel[]
        ).filter(
          (p) =>
            sections.find((id) => id === related(p, 'section')) !== undefined
        );
      };

      const sectionResourceRows = () => {
        var sections = sectionRows().map((s) => s.id);
        return (
          memory?.cache.query((q) =>
            q.findRecords('sectionresource')
          ) as BaseModel[]
        ).filter(
          (sr) =>
            sections.find((id) => id === related(sr, 'section')) !== undefined
        );
      };
      const sharedResourceRows = () => {
        var psgs = passageRows().map((p) => p.id);
        return (
          memory?.cache.query((q) =>
            q.findRecords('sharedresource')
          ) as BaseModel[]
        ).filter(
          (sr) => psgs.find((id) => id === related(sr, 'passage')) !== undefined
        );
      };

      const filterByOrg = (table: string) =>
        memory?.cache.query((q) =>
          q.findRecords(table).filter({
            relation: 'organization',
            record: { type: 'organization', id: org },
          })
        ) as BaseModel[];
      const organizationmembershipRows = () =>
        filterByOrg('organizationmembership');

      switch (table) {
        case 'activitystate':
        case 'artifacttype':
        case 'bible':
        case 'integration':
        case 'passagetype':
        case 'plantype':
        case 'projecttype':
        case 'role':
        case 'workflowstep':
          return (
            memory?.cache.query((q) => q.findRecords(table)) as BaseModel[]
          ).filter(
            (x) => Boolean(x?.keys?.remoteId) && Boolean(x.relationships)
          );
        case 'artifactcategory':
          var acs = (
            memory?.cache.query((q) =>
              q.findRecords('artifactcategory')
            ) as BaseModel[]
          ).filter(
            (x) => Boolean(x?.keys?.remoteId) && Boolean(x.relationships)
          );
          return acs.filter(
            (ac) =>
              related(ac, 'organization') === org ||
              related(ac, 'organization') === null
          );
        case 'comment':
          var discussions = discussionRows().map((d) => d.id);
          return (
            memory?.cache.query((q) => q.findRecords('comment')) as BaseModel[]
          ).filter(
            (c) =>
              discussions.find((id) => id === related(c, 'discussion')) !==
              undefined
          );
        case 'discussion':
          return discussionRows();
        case 'graphic':
          return filterByOrg('graphic');
        case 'groupmembership':
          var groups = groupRows().map((g) => g.id);
          return (
            memory?.cache.query((q) =>
              q.findRecords('groupmembership')
            ) as BaseModel[]
          ).filter(
            (gm) =>
              groups.find((id) => id === related(gm, 'group')) !== undefined
          );
        case 'group':
          return groupRows();
        case 'intellectualproperty':
        case 'invitation':
          return filterByOrg(table);
        case 'mediafile':
          return mediafileRows();
        case 'organization':
          return [findRecord(memory, 'organization', org)];

        case 'organizationbible':
        case 'organizationmembership':
        case 'orgkeyterm':
        case 'orgkeytermreference':
        case 'orgkeytermtarget':
        case 'orgworkflowstep':
          return filterByOrg(table);

        case 'passage':
          return passageRows();
        case 'passagestatechange':
          var passages = passageRows().map((p) => p.id);
          return (
            memory?.cache.query((q) =>
              q.findRecords('passagestatechange')
            ) as BaseModel[]
          ).filter(
            (psc) =>
              passages.find((id) => id === related(psc, 'passage')) !==
              undefined
          );
        case 'plan':
          return [plan];
        case 'project':
          return [project];
        case 'projectintegration':
          return memory?.cache.query((q) =>
            q.findRecords('projectintegration').filter({
              relation: 'project',
              record: { type: 'project', id: project.id },
            })
          ) as BaseModel[];
        case 'section':
          return sectionRows();
        case 'sectionresource':
          return sectionResourceRows();
        case 'sectionresourceuser':
          var resources = sectionResourceRows().map((sr) => sr.id);
          return (
            memory?.cache.query((q) =>
              q.findRecords('sectionresourceuser')
            ) as BaseModel[]
          ).filter(
            (sru) =>
              resources.find((id) => id === related(sru, 'sectionresource')) !==
              undefined
          );
        case 'sharedresource':
          return sharedResourceRows();
        case 'sharedresourcereference':
          var sharedresources = sharedResourceRows().map((sr) => sr.id);
          return (
            memory?.cache.query((q) =>
              q.findRecords('sharedresourcereference')
            ) as BaseModel[]
          ).filter(
            (srr) =>
              sharedresources.find(
                (id) => id === related(srr, 'sharedResource')
              ) !== undefined
          );
        case 'user':
          var uids = organizationmembershipRows().map(
            (om) => related(om, 'user') as string
          );
          return (
            memory?.cache.query((q) => q.findRecords('user')) as BaseModel[]
          ).filter((u) => uids.find((id) => id === u.id) !== undefined);

        default:
          console.log('ADD THIS NEW TABLE', table);
          return [];
      }
    };
    const removeDups = (rows: BaseModel[]) => {
      rows = rows.filter((r) => Boolean(r?.relationships));
      var uniqueids = new Set(rows.map((mf) => mf.keys?.remoteId || '0'));
      var unique = new Array<{ id: string; num: number }>();
      uniqueids.forEach((id) =>
        unique.push({
          id,
          num:
            stringToDateNum(
              rows.find((r) => r.keys?.remoteId === id)?.attributes
                .dateUpdated ?? ''
            ) ?? 0,
        })
      );
      //if (unique.length < rows.length) console.log('DUPLICATES', rows);
      return unique;
    };
    const refreshTable = async (
      table: string,
      numrows: number,
      remoteCS: number
    ) => {
      const tryagain = async () => {
        var rows = removeDups(getTableRows(table) as BaseModel[]);
        var cs = getChecksum(rows, table);
        if (cs !== remoteCS) {
          //get the whole thing
          await refreshTable(table, 0, remoteCS);
        }
      };

      var now = moment().valueOf();
      var since = now - 1000 * 60 * 60 * 24 * 365 * 4; //365*4 days
      if (numrows > 500) {
        //try to avoid bringing down the whole table
        since = now - 1000 * 60 * 60 * 24 * 14; //14 days
      }
      var dtSince = moment(since).toISOString();
      try {
        await doForceTableChanges({
          project: remoteProjectId,
          table,
          dtSince,
          errorReporter,
        });
        if (numrows > 500) await tryagain(); //second time we call in with 0
      } catch (err: any) {
        logError(Severity.error, errorReporter, err.message);
      }
    };

    var project = findRecord(memory, 'project', projectId) as ProjectD;
    var remoteProjectId = project?.keys?.remoteId ?? '';
    if (!isOffline && project?.keys?.remoteId) {
      var tables = staticFiles
        .concat(updateableFiles)
        .sort((i, j) => (i.sort <= j.sort ? -1 : 1))
        .map((f) => f.table);
      var plans = memory?.cache.query((q) =>
        q.findRecords('plan').filter({
          relation: 'project',
          record: { type: 'project', id: projectId },
        })
      ) as PlanD[];
      var plan = plans[0];

      await remote.activated;
      var checksums = (await remote.query((q) =>
        q
          .findRecords('vwchecksum')
          .filter({ attribute: 'project-id', value: project.keys?.remoteId })
      )) as VwChecksum[];
      //we have to do these one by one because if mediafiles isn't right, discussions won't be right etc.
      for (var ix = 0; ix < tables.length; ix++) {
        await compareChecksum(checksums, tables[ix]);
      }
    }
  };
};
