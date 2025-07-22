import { ExportType, FileResponse } from './types';
import path from 'path-browserify';
import moment, { Moment } from 'moment';
import {
  Project,
  MediaFile,
  Organization,
  Plan,
  OfflineProject,
  VProject,
  OrgWorkflowStep,
  ProjectD,
  UserD,
  DiscussionD,
  OrgKeytermD,
  OrgKeytermTargetD,
  IntellectualPropertyD,
  MediaFileD,
  OrganizationD,
  GroupD,
  GroupMembershipD,
  PlanD,
  SectionD,
  PassageD,
  SectionResourceD,
  ArtifactCategoryD,
  SharedResourceD,
} from '../../model';
import Memory from '@orbit/memory';
import { getSerializer } from '../../serializers/getSerializer';
import { InitializedRecord, RecordKeyMap } from '@orbit/records';
import {
  related,
  remoteId,
  getMediaEaf,
  remoteIdGuid,
  getBurritoMeta,
  scriptureFullPath,
  IBurritoMeta,
  IExportArtifacts,
  IExportScripturePath,
  mediaArtifacts,
  fileInfo,
  updateableFiles,
  staticFiles,
  nameFromTemplate,
  VernacularTag,
  findRecord,
} from '../../crud';
import {
  dataPath,
  cleanFileName,
  currentDateTime,
  PathType,
  createFolder,
  createPathFolder,
} from '../../utils';
import IndexedDBSource from '@orbit/indexeddb';
import { BaseModel, BaseModelD } from '../../model/baseModel';
import { backupToMemory } from '../../crud/syncToMemory';
const ipc = (window as any)?.electron;

export async function electronExport(
  exportType: ExportType,
  artifactType: string | null | undefined,
  memory: Memory,
  backup: IndexedDBSource | undefined,
  projectid: number | string,
  userid: number | string,
  nodatamsg: string,
  localizedArtifact: string,
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
  importedDate?: Moment | undefined,
  target?: string,
  orgWorkflowSteps?: OrgWorkflowStep[],
  sendProgress?: (progress: number | string) => void,
  writingmsg?: string
): Promise<FileResponse | null> {
  const ser = getSerializer(memory);
  const scripturePackage = [ExportType.DBL, ExportType.BURRITO].includes(
    exportType
  );
  const BuildFileResponse = (
    fullpath: string,
    fileName: string,
    buffer: Buffer | undefined,
    changedRecs: number,
    filteredRecs: number
  ): FileResponse => {
    return {
      message: fileName,
      fileURL: 'file:///' + fullpath,
      contentType: 'application/' + exportType,
      buffer: buffer,
      changes: changedRecs,
      filtered: filteredRecs,
      id: '1',
    };
  };

  const idStr = (kind: string, id: number | string) =>
    typeof id === 'number'
      ? id.toString()
      : remoteId(kind, id, memory?.keyMap as RecordKeyMap) || id.split('-')[0];

  const fileName = (
    projRec: ProjectD,
    localizedArtifactType: string,
    suffix: string,
    ext: string
  ) =>
    `APM${idStr('user', userid)}_${idStr(
      'project',
      projRec.id
    )}_${cleanFileName(
      projRec.attributes.name + localizedArtifactType
    )}${cleanFileName(suffix)}.${ext}`;

  const itfb_fileName = (projRec: ProjectD) =>
    new Date().getDate().toString() +
    new Date().getHours().toString() +
    '_' +
    fileName(projRec, '', importedDate?.toISOString() ?? '', 'itf');

  const backupName =
    new Date().getDate().toString() +
    new Date().getHours().toString() +
    '_APM' +
    idStr('user', userid) +
    '_backup.' +
    exportType;

  const getProjRec = (projectid: number | string): ProjectD => {
    return findRecord(
      memory,
      'project',
      typeof projectid === 'number'
        ? remoteIdGuid(
            'project',
            projectid.toString(),
            memory?.keyMap as RecordKeyMap
          ) ?? projectid.toString()
        : projectid
    ) as ProjectD;
  };
  const createZip = async (
    zip: string,
    projRec: ProjectD,
    expType: ExportType
  ) => {
    const AddCheckEntry = async (): Promise<string> => {
      var dt = currentDateTime();
      await ipc?.zipAddFile(
        zip,
        'SILTranscriberOffline',
        dt,
        'Check Format and Date'
      );
      return dt;
    };

    const AddSourceEntry = async (dt: string): Promise<string> => {
      await ipc?.zipAddFile(zip, 'SILTranscriber', dt, 'Imported Date');
      return dt;
    };
    const AddVersionEntry = async (ver: string): Promise<string> => {
      await ipc?.zipAddFile(zip, 'Version', ver, 'IndexedDB Version');
      return ver;
    };
    const AddOfflineEntry = async (): Promise<void> => {
      await ipc?.zipAddFile(zip, 'Offline', '', 'Present if Offline project');
    };
    const AddJsonEntry = async (
      table: string,
      recs: InitializedRecord[],
      sort: string
    ) => {
      //put in the remoteIds for everything, then stringify
      // const ser = projRec?.keys?.remoteId ? onlineSerlzr : offlineSrlzr;
      const resources = projRec?.keys?.remoteId
        ? recs.map((r) => ser.serialize(r))
        : recs.map((r) => {
            let ri = ser.serialize(r);
            ri.id = r.id;
            ri.relationships = r.relationships;
            return ri;
          });
      let json = ![ExportType.AUDIO, ExportType.ELAN].includes(expType)
        ? '{"data":' + JSON.stringify(resources) + '}'
        : JSON.stringify(resources, null, 2);
      await ipc?.zipAddJson(
        zip,
        'data/' + sort + '_' + table + '.json',
        JSON.stringify(json),
        table
      );
    };
    const AddStreamEntry = async (local: string, name: string) => {
      if (
        (await ipc?.exists(local)) &&
        path.dirname(name) !== path.basename(name)
      ) {
        await ipc?.zipAddLocal(
          zip,
          local,
          path.dirname(name),
          path.basename(name)
        );
        return true;
      } else return false;
    };
    const AddUserAvatars = async (recs: InitializedRecord[]) => {
      const avatarpath = PathType.AVATARS + '/';
      for (const u of recs) {
        var user = u as UserD;
        if (
          user?.attributes?.avatarUrl &&
          user.attributes.avatarUrl !== null &&
          user.attributes.avatarUrl !== ''
        ) {
          var dp = await dataPath(user.attributes.avatarUrl, PathType.AVATARS, {
            localname:
              remoteId('user', user.id, memory?.keyMap as RecordKeyMap) +
              (user.attributes?.familyName || '') +
              '.png',
          });
          await AddStreamEntry(dp, avatarpath + path.basename(dp));
        }
      }
    };
    const AddOrgLogos = async (recs: InitializedRecord[]) => {
      const logopath = PathType.LOGOS + '/';
      for (const o of recs) {
        var org = o as Organization;
        if (
          org?.attributes?.logoUrl &&
          org.attributes.logoUrl !== null &&
          org.attributes.logoUrl !== ''
        ) {
          var dp = await dataPath(org.attributes.logoUrl, PathType.LOGOS, {
            localname: org.attributes.slug + '.png',
          });
          await AddStreamEntry(dp, logopath + path.basename(dp));
        }
      }
    };

    const AddMediaFiles = async (
      recs: InitializedRecord[],
      rename: boolean
    ) => {
      const mediapath = PathType.MEDIA + '/';
      var newname = '';
      for (var mx = 0; mx < recs.length; mx++) {
        var mf = recs[mx] as MediaFile;
        if (!mf.attributes) return;
        const mp = await dataPath(mf.attributes.audioUrl, PathType.MEDIA);
        const { fullPath } = await scriptureFullPath(mf, {
          memory,
          scripturePackage,
          projRec,
        } as IExportScripturePath);
        if (rename) newname = mediapath + nameFromTemplate(mf, memory, false);
        else newname = fullPath || mediapath + path.basename(mp);
        await AddStreamEntry(mp, newname);
        if (sendProgress && mx % 50 === 0)
          sendProgress(Math.round((mx * 100) / recs.length));
        if (expType === ExportType.ELAN) {
          const eafCode = getMediaEaf(mf, memory);
          const name = path.basename(newname, path.extname(newname)) + '.eaf';
          await ipc?.zipAddFile(zip, mediapath + name, eafCode, 'EAF');
        }
      }
    };

    const AddFonts = async () => {
      const dir = await dataPath(PathType.FONTS);
      await createFolder(dir);
      var items = await ipc?.readDir(dir);
      for (var i = 0; i < items.length; i++) {
        var fontfile = path.join(dir, items[i]);
        if (await ipc?.exists(fontfile))
          await ipc?.zipAddLocal(zip, fontfile, PathType.FONTS, items[i]);
      }
    };
    const GroupMemberships = (project: Project) => {
      var groupid = related(project, 'group');
      return memory.cache.query((q) =>
        q.findRecords('groupmembership').filter({
          relation: 'group',
          record: { type: 'group', id: groupid },
        })
      ) as GroupMembershipD[];
    };

    const Plans = (project: ProjectD) =>
      memory.cache.query((q) =>
        q.findRecords('plan').filter({
          relation: 'project',
          record: { type: 'project', id: project.id },
        })
      ) as PlanD[];

    const Sections = (project: ProjectD) => {
      //can't get this to work...
      //var plans = Plans(project).map((pl) => {
      //  return { type: 'plan', id: pl.id };
      //});
      //var sections = memory.cache.query((q) =>
      //  q.findRecords('section').filter({ relation: 'plan', records: plans })
      //) as Section[];
      var plans = Plans(project).map((pl) => pl.id);
      var allsections = memory.cache.query((q) =>
        q.findRecords('section')
      ) as SectionD[];
      return allsections.filter((s) => plans.includes(related(s, 'plan')));
    };

    const Passages = (project: ProjectD) => {
      var sections = Sections(project).map((s) => s.id);
      var passages = memory.cache.query((q) =>
        q.findRecords('passage')
      ) as PassageD[];
      return passages.filter((p) => sections.includes(related(p, 'section')));
    };
    const SectionResources = (project: ProjectD) => {
      var sections = Sections(project).map((s) => s.id);
      var sectionresources = (
        memory.cache.query((q) =>
          q.findRecords('sectionresource')
        ) as SectionResourceD[]
      ).filter((r) => sections.includes(related(r, 'section')));
      return sectionresources;
    };

    const HighestByPassage = (media: MediaFileD[]) => {
      var highest: MediaFileD[] = [];
      var psg = '';
      media
        .sort((a, b) =>
          related(a, 'passage') === related(b, 'passage')
            ? a.attributes.versionNumber > b.attributes.versionNumber
              ? 1
              : -1
            : related(a, 'passage') > related(b, 'passage')
            ? 1
            : -1
        )
        .forEach((m) => {
          if (related(m, 'passage') !== psg) {
            highest.push(m);
            psg = related(m, 'passage');
          }
        });
      return highest;
    };
    const SourceMedia = (project: ProjectD) => {
      var sectionresourcemedia = SectionResources(project).map(
        (r) => related(r, 'mediafile') as string
      );
      var media = memory.cache.query((q) =>
        q.findRecords('mediafile')
      ) as MediaFileD[];

      //get the mediafiles associated with section resources
      var resourcemediafiles = media.filter((m) =>
        sectionresourcemedia.includes(m.id)
      );

      //now get any shared resource mediafiles associated with those mediafiles
      var sourcemediafiles = media.filter(
        (m) =>
          m.attributes?.readyToShare &&
          resourcemediafiles
            .map((r) => related(r, 'resourcePassage'))
            .includes(related(m, 'passage'))
      );
      return HighestByPassage(sourcemediafiles);
    };
    const sharedNotePassageIds = (project: ProjectD) => {
      var psgs = Passages(project).filter(
        (p) => related(p, 'sharedResource') !== null
      );
      var sharednotesids = psgs.map(
        (p) => related(p, 'sharedResource') as string
      );
      var supportingNotes = (
        memory.cache.query((q) =>
          q.findRecords('sharedresource')
        ) as SharedResourceD[]
      )
        .filter((r) => sharednotesids.includes(r.id))
        .map((r) => related(r, 'passage') as string);
      return supportingNotes;
    };
    const sharedNotePassages = (project: ProjectD) => {
      var ids = sharedNotePassageIds(project);
      return (
        memory.cache.query((q) => q.findRecords('passage')) as PassageD[]
      ).filter((p) => ids.includes(p.id));
    };
    const sharedNoteSections = (project: ProjectD) => {
      var sectids = sharedNotePassages(project).map((p) =>
        related(p, 'section')
      );
      return (
        memory.cache.query((q) => q.findRecords('section')) as SectionD[]
      ).filter((s) => sectids.includes(s.id));
    };
    const sharedNotePlans = (project: ProjectD) => {
      var planids = sharedNoteSections(project).map((p) => related(p, 'plan'));
      return (
        memory.cache.query((q) => q.findRecords('plan')) as PlanD[]
      ).filter((s) => planids.includes(s.id));
    };
    const sharedNoteProjects = (project: ProjectD) => {
      var projids = sharedNotePlans(project).map((p) => related(p, 'project'));
      return (
        memory.cache.query((q) => q.findRecords('project')) as ProjectD[]
      ).filter((s) => projids.includes(s.id));
    };
    const AllMediafiles = (project: ProjectD) => {
      var media = memory.cache.query((q) =>
        q.findRecords('mediafile')
      ) as MediaFileD[];
      var plans = Plans(project).map((pl) => pl.id);
      var planmedia = media.filter((m) => plans.includes(related(m, 'plan')));

      //get IP media
      var ip = IntellectualProperties(project, needsRemoteIds).map((i) =>
        related(i, 'releaseMediafile')
      );
      var ipmedia = media.filter((m) => ip.includes(m.id));

      var cats = (
        memory.cache.query((q) =>
          q.findRecords('artifactcategory')
        ) as ArtifactCategoryD[]
      ).filter(
        (a) =>
          related(a, 'organization') === related(project, 'organization') ||
          related(a, 'organization') === undefined
      );
      var categorymediafiles = media.filter((m) =>
        cats.map((c) => related(c, 'titleMediafile') as string).includes(m.id)
      );
      var orgkeytermtargets = OrgKeyTermTargets(project, needsRemoteIds).map(
        (i) => related(i, 'mediafile')
      );
      var okttmedia = media.filter((m) => orgkeytermtargets.includes(m.id));

      var sourcemediafiles = SourceMedia(project);

      var supportingNotePassages = sharedNotePassageIds(project);

      var sharedmedia = HighestByPassage(
        media.filter((m) =>
          supportingNotePassages.includes(related(m, 'passage'))
        )
      );
      var unique = new Set(
        planmedia
          .concat(ipmedia)
          .concat(okttmedia)
          .concat(categorymediafiles)
          .concat(sourcemediafiles)
          .concat(sharedmedia)
      );
      return FromMedia(Array.from(unique), needsRemoteIds);
    };
    const FromPassages = (
      table: string,
      project: ProjectD | undefined,
      remoteIds: boolean
    ) => {
      //passagestatechange or media
      var recs = memory.cache.query((q) => q.findRecords(table)) as (BaseModel &
        InitializedRecord)[];
      if (project) {
        var passages = Passages(project).map((p) => p.id);
        recs = recs.filter((rec) => passages.includes(related(rec, 'passage')));
      }
      if (remoteIds) {
        recs.forEach((r) => {
          if (
            !remoteId(table, r.id, memory?.keyMap as RecordKeyMap) &&
            r.attributes
          )
            r.attributes.offlineId = r.id;
          if (
            table === 'mediafile' &&
            !remoteId(
              'mediafile',
              related(r, 'sourceMedia'),
              memory?.keyMap as RecordKeyMap
            )
          ) {
            (r as MediaFile).attributes.sourceMediaOfflineId = related(
              r,
              'sourceMedia'
            );
          }
        });
      }
      return recs;
    };
    const Discussions = (project: ProjectD | undefined, remoteIds: boolean) => {
      var ds = memory.cache.query((q) =>
        q.findRecords('discussion')
      ) as DiscussionD[];
      if (project) {
        var mediafiles = FromPassages('mediafile', project, remoteIds).map(
          (m) => m.id
        );
        ds = ds.filter((rec) => mediafiles.includes(related(rec, 'mediafile')));
      }
      if (remoteIds) {
        ds.forEach((d) => {
          if (
            !remoteId('discussion', d.id, memory?.keyMap as RecordKeyMap) &&
            d.attributes
          )
            d.attributes.offlineId = d.id;
          if (
            !remoteId(
              'mediafile',
              related(d, 'mediafile'),
              memory?.keyMap as RecordKeyMap
            )
          )
            d.attributes.offlineMediafileId = related(d, 'mediafile');
        });
      }
      return ds;
    };
    const OrgKeyTerms = (project: ProjectD | undefined, remoteIds: boolean) => {
      var kts = (
        memory.cache.query((q) => q.findRecords('orgkeyterm')) as OrgKeytermD[]
      ).filter(
        (r) =>
          Boolean(
            remoteId(
              'organization',
              related(r, 'organization'),
              memory?.keyMap as RecordKeyMap
            )
          ) === needsRemoteIds
      );
      if (project) {
        kts = kts.filter(
          (rec) =>
            related(rec, 'organization') === related(project, 'organization')
        );
      }
      if (remoteIds) {
        kts.forEach((kt) => {
          if (
            !remoteId('orgkeyterm', kt.id, memory?.keyMap as RecordKeyMap) &&
            kt.attributes
          )
            kt.attributes.offlineid = kt.id;
        });
      }
      return kts;
    };

    const OrgKeyTermTargets = (
      project: ProjectD | undefined,
      remoteIds: boolean
    ) => {
      var ktts = (
        memory.cache.query((q) =>
          q.findRecords('orgkeytermtarget')
        ) as OrgKeytermTargetD[]
      ).filter(
        (r) =>
          Boolean(
            remoteId(
              'organization',
              related(r, 'organization'),
              memory?.keyMap as RecordKeyMap
            )
          ) === needsRemoteIds
      );
      if (project) {
        ktts = ktts.filter(
          (rec) =>
            related(rec, 'organization') === related(project, 'organization')
        );
      }
      if (remoteIds) {
        ktts.forEach((ktt) => {
          if (
            !remoteId(
              'orgkeytermtarget',
              ktt.id,
              memory?.keyMap as RecordKeyMap
            ) &&
            ktt.attributes
          )
            ktt.attributes.offlineId = ktt.id;
          if (
            related(ktt, 'mediafile') &&
            !remoteId(
              'mediafile',
              related(ktt, 'mediafile'),
              memory?.keyMap as RecordKeyMap
            )
          )
            ktt.attributes.offlineMediafileId = related(ktt, 'mediafile');
        });
      }
      return ktts;
    };
    const IntellectualProperties = (
      project: Project | undefined,
      remoteIds: boolean
    ) => {
      var ips = memory.cache.query((q) =>
        q.findRecords('intellectualproperty')
      ) as IntellectualPropertyD[];
      if (project) {
        ips = ips.filter(
          (rec) =>
            related(rec, 'organization') === related(project, 'organization')
        );
      }
      if (remoteIds) {
        ips.forEach((ip) => {
          if (
            !remoteId(
              'intellectualproperty',
              ip.id,
              memory?.keyMap as RecordKeyMap
            )
          )
            ip.attributes.offlineId = ip.id;
          if (
            !remoteId(
              'mediafile',
              related(ip, 'releaseMediafile'),
              memory?.keyMap as RecordKeyMap
            )
          )
            ip.attributes.offlineMediafileId = related(ip, 'releaseMediafile');
        });
      }
      return ips;
    };

    const FromMedia = (media: MediaFileD[], remoteIds: boolean) => {
      if (remoteIds) {
        media.forEach((m) => {
          if (
            !remoteId('mediafile', m.id, memory?.keyMap as RecordKeyMap) &&
            m.attributes
          ) {
            m.attributes.offlineId = m.id;
          }
          var src = related(m, 'sourceMedia');
          if (
            src &&
            !remoteId('mediafile', src, memory?.keyMap as RecordKeyMap) &&
            m.attributes
          ) {
            m.attributes.sourceMediaOfflineId = src;
          }
          delete m.attributes.planId;
          delete m.attributes.artifactTypeId;
          delete m.attributes.passageId;
          delete m.attributes.userId;
          delete m.attributes.recordedbyUserId;
          delete m.attributes.recordedByUserId;
          delete m.attributes.sourceMediaId;
        });
      }
      return media;
    };
    const Comments = (project: ProjectD | undefined, remoteIds: boolean) => {
      var comments = memory.cache.query((q) =>
        q.findRecords('comment')
      ) as BaseModelD[];
      if (project) {
        var discussions = Discussions(project, remoteIds);
        var discussionIds = discussions.map((d) => d.id);
        comments = comments.filter((rec) =>
          discussionIds.includes(related(rec, 'discussion'))
        );
      }
      if (remoteIds) {
        comments.forEach((c) => {
          if (
            !remoteId('comment', c.id, memory?.keyMap as RecordKeyMap) &&
            c.attributes
          ) {
            c.attributes.offlineId = c.id;
            c.attributes.offlineDiscussionId = related(c, 'discussion');
          }
          if (
            !remoteId(
              'mediafile',
              related(c, 'mediafile'),
              memory?.keyMap as RecordKeyMap
            ) &&
            c.attributes
          ) {
            c.attributes.offlineMediafileId = related(c, 'mediafile');
          }
        });
      }
      return comments;
    };

    const GetTableRecs = (
      info: fileInfo,
      project: ProjectD | undefined,
      needsRemoteIds: boolean
    ): BaseModelD[] => {
      const defaultQuery = (table: string) => {
        return memory.cache.query((q) => q.findRecords(table)) as (BaseModel &
          InitializedRecord)[];
      };
      switch (info.table) {
        case 'organization':
          if (project)
            return [
              memory.cache.query((q) =>
                q.findRecord({
                  type: 'organization',
                  id: related(project, 'organization'),
                })
              ) as OrganizationD,
            ];
          return defaultQuery(info.table);

        case 'project':
          if (project) return [project];
          return defaultQuery(info.table);

        case 'group':
          if (project)
            return [
              memory.cache.query((q) =>
                q.findRecord({ type: 'group', id: related(project, 'group') })
              ) as GroupD,
            ];
          return defaultQuery(info.table);

        case 'groupmembership':
          if (project) return GroupMemberships(project);
          return defaultQuery(info.table);

        case 'user':
          if (project) {
            var projusers = GroupMemberships(project).map((gm) =>
              related(gm, 'user')
            );
            var users = memory.cache.query((q) =>
              q.findRecords(info.table)
            ) as UserD[];

            return users.filter(
              (u) => projusers.find((p) => p === u.id) !== undefined
            );
          }
          return defaultQuery(info.table);

        case 'plan':
          if (project) return Plans(project).concat(sharedNotePlans(project));
          return defaultQuery(info.table);

        case 'section':
          if (project)
            return Sections(project).concat(sharedNoteSections(project));
          return defaultQuery(info.table);

        case 'passage':
          if (project) Passages(project).concat(sharedNotePassages(project));
          return defaultQuery(info.table);

        case 'mediafile':
          if (artifactType !== undefined) {
            const media = mediaArtifacts({
              memory,
              projRec,
              artifactType,
              target,
              orgWorkflowSteps,
            } as IExportArtifacts);
            if (media) return FromMedia(media, needsRemoteIds);
          }
          if (project) return AllMediafiles(project);
          return FromMedia(
            defaultQuery(info.table) as MediaFileD[],
            needsRemoteIds
          );

        case 'passagestatechange':
          return FromPassages(info.table, project, needsRemoteIds);

        case 'discussion':
          return Discussions(project, needsRemoteIds);

        case 'comment':
          return Comments(project, needsRemoteIds);

        case 'projectintegration':
          if (project)
            return memory.cache.query((q) =>
              q.findRecords(info.table).filter({
                relation: 'project',
                record: { type: 'project', id: project.id },
              })
            ) as BaseModelD[];
          return defaultQuery(info.table);

        case 'intellectualproperty':
          return IntellectualProperties(project, needsRemoteIds);

        case 'orgkeyterm':
          return OrgKeyTerms(project, needsRemoteIds);

        case 'orgkeytermtarget':
          return OrgKeyTermTargets(project, needsRemoteIds);
        default:
          //activitystate,integration,plantype,projecttype,role
          return defaultQuery(info.table).filter(
            (r) => Boolean(r?.keys?.remoteId) === needsRemoteIds
          );
      }
    };
    const AddChanged = async (
      info: fileInfo,
      project: ProjectD | undefined,
      needsRemoteIds: boolean
    ) => {
      var recs = GetTableRecs(info, project, needsRemoteIds);
      var changed = recs;
      if (recs && Array.isArray(recs) && recs.length > 0) {
        changed = recs.filter(
          (u) => u.attributes && moment.utc(u.attributes.dateUpdated) > imported
        );
        await AddJsonEntry(
          info.table + 's',
          info.table === 'project' ? recs : changed,
          info.sort
        );

        switch (info.table) {
          case 'user':
            await AddUserAvatars(changed);
            break;
          case 'mediafile':
            var newOnly = changed.filter(
              (m) =>
                m.attributes && moment.utc(m.attributes.dateCreated) > imported
            );
            await AddMediaFiles(newOnly, false);
        }
        return changed.length;
      }
      return 0;
    };
    const AddSupportingProjects = async (project: ProjectD) => {
      var recs = sharedNoteProjects(project);
      let ret = { Added: 0, Filtered: 0 };
      if (recs.length > 0) {
        recs = recs.filter((r) => Boolean(r.keys?.remoteId));
        ret.Added = recs?.length || 0;
      }
      AddJsonEntry('supportingprojects', recs, 'Z');
      return ret;
    };
    const AddAll = async (
      info: fileInfo,
      project: ProjectD | undefined,
      needsRemoteIds: boolean,
      excludeNew: boolean = false,
      checkRename: boolean = false
    ) => {
      let recs = GetTableRecs(info, project, needsRemoteIds);
      let len = recs?.length || 0;
      let ret = { Added: len, Filtered: 0 };
      if (len > 0) {
        if (needsRemoteIds && excludeNew) {
          recs = recs.filter((r) => Boolean(r.keys?.remoteId));
          ret.Added = recs?.length || 0;
          ret.Filtered = len - ret.Added;
        }
        if (!scripturePackage) {
          AddJsonEntry(info.table + 's', recs, info.sort);
        }
        switch (info.table) {
          case 'organization':
            await AddOrgLogos(recs);
            break;
          case 'user':
            await AddUserAvatars(recs);
            break;
          case 'mediafile':
            await AddMediaFiles(
              recs,
              checkRename &&
                recs.length > 0 &&
                related(recs[0], 'artifactType') === VernacularTag
            );
        }
      }
      return ret;
    };

    const onlyOneProject = (): boolean => {
      var p = memory.cache.query((q) => q.findRecords('project'));
      if (p && Array.isArray(p)) return p.length === 1;
      return true; //should never get here
    };
    var imported = moment.utc();
    var op: OfflineProject | undefined;
    if (importedDate) {
      imported = importedDate;
    } else {
      op = getOfflineProject(projRec.id);
      imported = moment.utc(op.attributes.snapshotDate || '01/01/1900');
      importedDate = imported;
    }

    if (!scripturePackage) {
      await AddSourceEntry(imported.toISOString());
      await AddVersionEntry((backup?.schema.version || 1).toString());
    } else if (expType === ExportType.BURRITO) {
      const userId =
        remoteIdGuid(
          'user',
          userid.toString(),
          memory?.keyMap as RecordKeyMap
        ) || userid.toString();
      const burritoMetaStr = await getBurritoMeta({
        memory,
        userId,
        projRec,
        scripturePackage,
        artifactType,
        target,
        orgWorkflowSteps,
      } as IBurritoMeta);
      await ipc?.zipAddFile(zip, 'metadata.json', burritoMetaStr, 'metadata');
    }
    var needsRemoteIds = Boolean(projRec?.keys?.remoteId);
    if (!needsRemoteIds) await AddOfflineEntry();
    const limit = onlyOneProject() ? undefined : projRec;
    var numRecs = 0;
    var numFiltered = 0;
    switch (expType) {
      case ExportType.ITF:
      case ExportType.ITFBACKUP:
      case ExportType.ITFSYNC:
        const exported = await AddCheckEntry();
        for (const info of updateableFiles) {
          numRecs += await AddChanged(info, limit, needsRemoteIds);
        }
        if (expType !== ExportType.ITFBACKUP && backup) {
          if (!op) op = getOfflineProject(projRec.id);
          if (op && op.attributes) {
            op.attributes.exportedDate = exported;
            await backup.sync((t) => t.updateRecord(op as OfflineProject));
          }
        }
        break;
      case ExportType.DBL:
      case ExportType.BURRITO:
      case ExportType.AUDIO:
      case ExportType.ELAN:
        numRecs += (
          await AddAll(
            { table: 'mediafile', sort: 'H' },
            limit,
            needsRemoteIds,
            false,
            [ExportType.AUDIO, ExportType.ELAN].includes(expType)
          )
        ).Added;
        break;
      default:
        for (const info of updateableFiles) {
          var result = await AddAll(info, limit, needsRemoteIds, true);
          numRecs += result.Added;
          numFiltered += result.Filtered;
        }
        for (const info of staticFiles) {
          await AddAll(info, limit, needsRemoteIds);
        }
        await AddFonts();
        if (limit) {
          result = await AddSupportingProjects(limit);
          numRecs += result.Added;
          numFiltered += result.Filtered;
        }
    }
    return { zip, numRecs, numFiltered };
  };

  var projects: ProjectD[];
  var backupZip: string | undefined;
  if (
    exportType === ExportType.FULLBACKUP ||
    exportType === ExportType.ITFSYNC
  ) {
    //avoid intermittent errors where projecttype or plan is null
    if (backup) {
      await backupToMemory({ table: 'project', backup, memory });
      await backupToMemory({ table: 'mediafile', backup, memory });
    }

    projects = memory.cache.query((q) =>
      q.findRecords('project')
    ) as ProjectD[];

    var offlineprojects = memory.cache.query((q) =>
      q.findRecords('offlineproject')
    ) as OfflineProject[];
    var ids = offlineprojects
      .filter((o) => o?.attributes?.offlineAvailable)
      .map((o) => related(o, 'project')) as string[];
    projects = projects.filter((p) => ids.includes(p.id));
    backupZip = await ipc?.zipOpen();
    if (exportType === ExportType.FULLBACKUP) {
      exportType = ExportType.PTF;
    } else {
      projects = projects.filter(
        (p) =>
          remoteId('project', p.id, memory?.keyMap as RecordKeyMap) !==
          undefined
      );
      exportType = ExportType.ITF;
    }
  } else {
    projects = [getProjRec(projectid)];
  }
  var changedRecs = 0;
  for (var ix: number = 0; ix < projects.length; ix++) {
    let { zip, numRecs, numFiltered } = await createZip(
      await ipc?.zipOpen(),
      projects[ix],
      exportType
    );
    const filename =
      exportType === ExportType.ITFBACKUP
        ? itfb_fileName(projects[ix])
        : [ExportType.AUDIO, ExportType.BURRITO, ExportType.ELAN].includes(
            exportType
          )
        ? fileName(
            projects[ix],
            `${localizedArtifact}_${exportType}`,
            '',
            'zip'
          )
        : exportType === ExportType.ITF
        ? fileName(
            projects[ix],
            localizedArtifact,
            importedDate?.toISOString() ?? '',
            exportType
          )
        : fileName(projects[ix], localizedArtifact, '', exportType);
    changedRecs += numRecs;
    if (backupZip) {
      if (numRecs)
        await ipc?.zipAddZip(
          backupZip,
          filename,
          zip,
          projects[ix].attributes.name
        );
      if (numFiltered) {
        const itf = await createZip(
          await ipc?.zipOpen(),
          projects[ix],
          ExportType.ITF
        );
        await ipc?.zipAddZip(
          backupZip,
          fileName(
            projects[ix],
            localizedArtifact,
            importedDate?.toISOString() ?? '',
            ExportType.ITF
          ),
          itf.zip,
          projects[ix].attributes.name
        );
      }
    } else {
      if (numRecs) {
        var where = await dataPath(filename);
        await createPathFolder(where);
        if (sendProgress && writingmsg) sendProgress(writingmsg);
        await ipc?.zipWrite(zip, where);
        await ipc?.zipClose(zip);
        return BuildFileResponse(
          where,
          filename,
          undefined,
          changedRecs,
          numFiltered
        );
      } else if (nodatamsg && projects.length === 1) throw new Error(nodatamsg);
    }
  }
  var backupWhere = await dataPath(backupName);
  await createPathFolder(backupWhere);
  if (backupZip) {
    if (sendProgress && writingmsg) sendProgress(writingmsg);
    await ipc?.zipWrite(backupZip, backupWhere);
  }
  const buffer =
    exportType === ExportType.ITF
      ? await ipc?.zipToBuffer(backupZip)
      : undefined;
  await ipc?.zipClose(backupZip);
  return BuildFileResponse(backupWhere, backupName, buffer, changedRecs, 0);
}
