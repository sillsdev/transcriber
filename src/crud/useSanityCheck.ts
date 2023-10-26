import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { findRecord, related, staticFiles, updateableFiles } from '.';
import Memory from '@orbit/memory';
import moment from 'moment';
import { BaseModel } from '../model/baseModel';
import JSONAPISource from '@orbit/jsonapi/dist/types/jsonapi-source';
import { logError, Severity } from '../utils';
import { Project, Plan, VwChecksum } from '../model';
import * as actions from '../store';
import { TokenContext } from '../context/TokenProvider';
import { API_CONFIG } from '../api-variable';
import { processDataChanges } from '../hoc/DataChanges';

export const useSanityCheck = (setLanguage: typeof actions.setLanguage) => {
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
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
      let tries = 5;
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
          cb,
        });
        if (startNext === start) tries--;
        else start = startNext;
      }
    };
    const getChecksum = (
      rows: BaseModel[],
      name: string,
      beforeThis?: number
    ) => {
      var sum = 0;
      //assume sorted if beforeThis is set
      rows.forEach((mf) => {
        if (mf) {
          var num = stringToDateNum(mf.attributes.dateUpdated);
          if (beforeThis && num > beforeThis) return sum;

          sum += num % 100000000;
        }
      });
      return sum;
    };

    const compareChecksum = (remoteRows: VwChecksum[], name: string) => {
      var rows = getTableRows(name) as BaseModel[];
      var cs = getChecksum(rows, name);
      var remoteCs =
        remoteRows.filter((t) => t.attributes.name === name)[0]?.attributes
          .checksum ?? 0;
      if (cs !== remoteCs) {
        console.log(remoteProjectId, name, cs, remoteCs);
        rows = rows.sort(
          (i, j) =>
            Number(i.keys?.remoteId ?? '0') - Number(j.keys?.remoteid ?? '0')
        );
        rows
          .sort(
            (i, j) =>
              Number(i.keys?.remoteId ?? '0') - Number(j.keys?.remoteid ?? '0')
          )
          .forEach((mf) => {
            console.log(
              mf.keys?.remoteId,
              mf.attributes.dateUpdated,
              stringToDateNum(mf.attributes.dateUpdated) % 100000000
            );
          });
        promises.push(refreshTable(name, rows.length, remoteCs));
      }
      return cs === remoteCs;
    };

    const getTableRows = (table: string) => {
      var org = related(project, 'organization');

      const mediafileRows = () =>
        memory.cache.query((q) =>
          q.findRecords('mediafile').filter({
            relation: 'plan',
            record: { type: 'plan', id: plan.id },
          })
        ) as BaseModel[];
      const discussionRows = () => {
        var mediafiles = mediafileRows().map((m) => m.id);
        return (
          memory.cache.query((q) => q.findRecords('discussion')) as BaseModel[]
        ).filter(
          (d) =>
            mediafiles.find((id) => id === related(d, 'mediafile')) !==
            undefined
        );
      };
      const groupRows = () =>
        memory.cache.query((q) =>
          q.findRecords('group').filter({
            relation: 'owner',
            record: { type: 'organization', id: org },
          })
        ) as BaseModel[];

      const sectionRows = () =>
        memory.cache.query((q) =>
          q.findRecords('section').filter({
            relation: 'plan',
            record: { type: 'plan', id: plan.id },
          })
        ) as BaseModel[];
      const passageRows = () => {
        var sections = sectionRows().map((s) => s.id);
        return (
          memory.cache.query((q) => q.findRecords('passage')) as BaseModel[]
        ).filter(
          (p) =>
            sections.find((id) => id === related(p, 'section')) !== undefined
        );
      };
      const sectionResourceRows = () => {
        var sections = sectionRows().map((s) => s.id);
        return (
          memory.cache.query((q) =>
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
          memory.cache.query((q) =>
            q.findRecords('sharedresource')
          ) as BaseModel[]
        ).filter(
          (sr) => psgs.find((id) => id === related(sr, 'passage')) !== undefined
        );
      };
      const filterByOrg = (table: string) =>
        memory.cache.query((q) =>
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
        case 'integration':
        case 'passagetype':
        case 'plantype':
        case 'projecttype':
        case 'role':
        case 'workflowstep':
          return memory.cache.query((q) => q.findRecords(table)) as BaseModel[];
        case 'artifactcategory':
          var acs = memory.cache.query((q) =>
            q.findRecords('artifactcategory')
          ) as BaseModel[];
          return acs.filter(
            (ac) =>
              related(ac, 'organization') === org ||
              related(ac, 'organization') === null
          );
        case 'comment':
          var discussions = discussionRows().map((d) => d.id);
          return (
            memory.cache.query((q) => q.findRecords('comment')) as BaseModel[]
          ).filter(
            (c) =>
              discussions.find((id) => id === related(c, 'discussion')) !==
              undefined
          );
        case 'discussion':
          return discussionRows();
        case 'graphic':
          return (
            memory.cache.query((q) => q.findRecords('graphic')) as BaseModel[]
          ).filter((g) => related(g, 'project') === project.id);
        case 'groupmembership':
          var groups = groupRows().map((g) => g.id);
          return (
            memory.cache.query((q) =>
              q.findRecords('groupmembership')
            ) as BaseModel[]
          ).filter(
            (gm) =>
              groups.find((id) => id === related(gm, 'group')) !== undefined
          );
        case 'group':
          return groupRows();
        case 'intellectualproperty':
          return memory.cache.query((q) =>
            q.findRecords('intellectualproperty').filter({
              relation: 'organization',
              record: { type: 'organization', id: org },
            })
          ) as BaseModel[];
        case 'invitation':
          return filterByOrg(table);
        case 'mediafile':
          return mediafileRows();
        case 'organization':
          return [findRecord(memory, 'organization', org)];

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
            memory.cache.query((q) =>
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
          return memory.cache.query((q) =>
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
            memory.cache.query((q) =>
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
            memory.cache.query((q) =>
              q.findRecords('sharedresourcereference')
            ) as BaseModel[]
          ).filter(
            (srr) =>
              sharedresources.find(
                (id) => id === related(srr, 'sharedresource')
              ) !== undefined
          );
        case 'user':
          var uids = organizationmembershipRows().map(
            (om) => related(om, 'user') as string
          );
          return (
            memory.cache.query((q) => q.findRecords('user')) as BaseModel[]
          ).filter((u) => uids.find((id) => id === u.id) !== undefined);

        default:
          console.log('ADD THIS NEW TABLE', table);
          return [];
      }
    };

    const refreshTable = async (
      table: string,
      numrows: number,
      remoteCS: number
    ) => {
      const cb = () => {
        var rows = getTableRows(table) as BaseModel[];
        var cs = getChecksum(rows, table);
        if (cs !== remoteCS) {
          //get a years worth of changes
          refreshTable(table, 0, remoteCS);
        }
      };

      var now = moment().valueOf();
      var since = now - 1000 * 60 * 60 * 24 * 365; //365 days
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
          cb: numrows > 0 ? cb : undefined,
        });
      } catch (err: any) {
        logError(Severity.error, errorReporter, err.message);
      }
    };

    var project = findRecord(memory, 'project', projectId) as Project;
    var remoteProjectId = project?.keys?.remoteId ?? '';
    if (!isOffline && project?.keys?.remoteId) {
      var tables = staticFiles
        .concat(updateableFiles)
        .sort((i, j) => (i.sort <= j.sort ? -1 : 1))
        .map((f) => f.table);
      var plans = memory.cache.query((q) =>
        q.findRecords('plan').filter({
          relation: 'project',
          record: { type: 'project', id: projectId },
        })
      ) as Plan[];
      var plan = plans[0];

      var promises: Promise<void>[] = [];
      var checksums = (await remote.query((q) =>
        q
          .findRecords('vwchecksum')
          .filter({ attribute: 'project-id', value: project.keys?.remoteId })
      )) as VwChecksum[];
      tables.forEach((t) => compareChecksum(checksums, t));
      await Promise.all(promises);
    }
  };
};
