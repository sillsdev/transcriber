import {
  ArtifactCategoryD,
  IntellectualPropertyD,
  MediaFile,
  MediaFileD,
  OrgKeytermTargetD,
  OrganizationD,
  PassageD,
  PlanD,
  ProjectD,
  SectionD,
  SharedResourceD,
} from '../model';
import { findRecord } from './tryFindRecord';
import { mediaFileName } from './media';
import { related } from './related';
import { VernacularTag } from './useArtifactType';
import MemorySource from '@orbit/memory';

interface ILatest {
  [planName: string]: number;
}
const versionName = (mf: MediaFile) => {
  const psg = related(mf, 'passage');
  if (psg) return psg;
  return related(mf, 'plan') + mediaFileName(mf);
};
export const getMediaInPlans = (
  planids: Array<string>,
  mediaFiles: MediaFileD[],
  onlyTypeId: string | null | undefined, // null for vernacular
  onlyLatest: boolean
) => {
  const latest: ILatest = {};
  var media = mediaFiles.filter(
    (m) => planids.indexOf(related(m, 'plan')) >= 0 && m.attributes
  );
  if (onlyTypeId !== undefined) {
    media = media.filter((m) => related(m, 'artifactType') === onlyTypeId);
  }
  if (onlyLatest) {
    if (onlyTypeId === VernacularTag) {
      media.forEach((f) => {
        const name = versionName(f);
        latest[name] = latest[name]
          ? Math.max(latest[name], f.attributes.versionNumber)
          : f.attributes.versionNumber;
      });
      return media.filter(
        (f) => latest[versionName(f)] === f.attributes.versionNumber
      );
    } else {
      var myMedia = media;
      var vernacularIds = getMediaInPlans(
        planids,
        mediaFiles,
        VernacularTag,
        true
      ).map((m) => m.id);
      media = myMedia.filter(
        (m) => vernacularIds.indexOf(related(m, 'sourceMedia')) >= 0
      );
    }
  }
  return media;
};

export interface IPlanMedia {
  plan: string;
  media: MediaFileD;
}
export const getDownloadableMediaInPlans = (
  planids: Array<string>,
  memory: MemorySource
) => {
  var ret = new Set<IPlanMedia>();
  planids.forEach((plan) => {
    var x = getDownloadableMediaInPlan(plan, memory);
    x.forEach((m) => ret.add(m));
  });
  return Array.from(ret);
};
export const getDownloadableMediaInPlan = (
  planid: string,
  memory: MemorySource
) => {
  const mediaFiles = memory?.cache.query((q) =>
    q.findRecords('mediafile')
  ) as MediaFileD[];
  const sections = memory?.cache.query((q) =>
    q.findRecords('section')
  ) as SectionD[];
  const passages = memory?.cache.query((q) =>
    q.findRecords('passage')
  ) as PassageD[];
  var sharedres = memory?.cache.query((q) =>
    q.findRecords('sharedresource')
  ) as SharedResourceD[];
  var plan = findRecord(memory, 'plan', planid) as PlanD;
  var proj = findRecord(
    memory,
    'project',
    related(plan, 'project')
  ) as ProjectD;
  var org = findRecord(
    memory,
    'organization',
    related(proj, 'organization')
  ) as OrganizationD;

  const mapMedia = (media: MediaFileD[]) => {
    return media.map((m) => {
      return { plan: planid, media: m };
    });
  };
  var media = getMediaInPlans([planid], mediaFiles, undefined, false);
  var ret: IPlanMedia[] = [];
  ret = ret.concat(mapMedia(media));
  //IP media
  var ipmediaids = (
    memory?.cache.query((q) =>
      q.findRecords('intellectualproperty')
    ) as IntellectualPropertyD[]
  )
    .filter(
      (ip) =>
        related(ip, 'organization') === org.id &&
        related(ip, 'releaseMediafile')
    )
    .map((ip) => related(ip, 'releaseMediafile') as string);

  ret = ret.concat(
    mapMedia(mediaFiles.filter((m) => ipmediaids.includes(m.id)))
  );
  //Category titles
  var catmediaids = (
    memory?.cache.query((q) =>
      q.findRecords('artifactcategory')
    ) as ArtifactCategoryD[]
  )
    .filter(
      (ip) =>
        related(ip, 'organization') === org.id && related(ip, 'titleMediafile')
    )
    .map((ip) => related(ip, 'titleMediafile') as string);
  ret = ret.concat(
    mapMedia(mediaFiles.filter((m) => catmediaids.includes(m.id)))
  );
  //Keyterm media
  var okttmediaids = (
    memory?.cache.query((q) =>
      q.findRecords('orgkeytermtarget')
    ) as OrgKeytermTargetD[]
  )
    .filter(
      (ip) => related(ip, 'organization') === org.id && related(ip, 'mediafile')
    )
    .map((ip) => related(ip, 'mediafile') as string);
  ret = ret.concat(
    mapMedia(mediaFiles.filter((m) => okttmediaids.includes(m.id)))
  );

  var plansecs = sections
    .filter((s) => related(s, 'plan') === plan)
    .map((s) => s.id);
  var planpsgs = passages.filter((p) =>
    plansecs.includes(related(p, 'section') as string)
  );
  var srs = planpsgs
    .filter((p) => related(p, 'sharedResource'))
    .map((p) => related(p, 'sharedResource') as string);

  var shared = sharedres.filter((sr) => srs.includes(sr.id));
  var sourcepsgs = shared.map((sr) => related(sr, 'passage') as string);
  var sharedMedia = mediaFiles.filter((m) =>
    sourcepsgs.includes(related(m, 'passage') as string)
  );
  ret = ret.concat(mapMedia(sharedMedia));
  return ret;
};
