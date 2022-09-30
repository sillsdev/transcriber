import {
  User,
  MediaFile,
  Plan,
  Project,
  Passage,
  Section,
  IMediaShare,
  OrgWorkflowStep,
} from '../model';
import { QueryBuilder } from '@orbit/data';
import Memory from '@orbit/memory';
import {
  related,
  VernacularTag,
  findRecord,
  parseRef,
  getMediaInPlans,
  getStepComplete,
  afterStep,
} from '.';
import {
  cleanFileName,
  updateXml,
  burritoMetadata,
  FormatsType,
  removeExtension,
  mimeMap,
  dataPath,
  PathType,
} from '../utils';
import moment from 'moment';
import eaf from '../utils/transcriptionEaf';
import path from 'path';

const vernSort = (m: MediaFile) => (!related(m, 'artifactType') ? 0 : 1);

export const getAllMediaRecs = (
  passageId: string,
  memory: Memory,
  artifactTypeId?: string | null,
  version?: number | null // null for latest
) => {
  const mediaRecs = (
    memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile').filter({
        relation: 'passage',
        record: { type: 'passage', id: passageId },
      })
    ) as MediaFile[]
  )
    .sort((a, b) => vernSort(a) - vernSort(b))
    .sort((a, b) => b.attributes.versionNumber - a.attributes.versionNumber);
  if (artifactTypeId !== undefined) {
    const allOfType = mediaRecs.filter(
      (m) => related(m, 'artifactType') === artifactTypeId
    );
    if (version === undefined) return allOfType;
    if (version === null) {
      const latestId = mediaRecs[0].id;
      return allOfType.filter((m) => related(m, 'sourceMedia') === latestId);
    }
    const mediaVersionId = mediaRecs.find(
      (m) =>
        !related(m, 'artifactType') && m.attributes?.versionNumber === version
    )?.id;
    if (!mediaVersionId) return [];
    return allOfType.filter(
      (m) => related(m, 'sourceMedia') === mediaVersionId
    );
  }
  if (version === undefined) return mediaRecs;
  if (version === null) {
    const latestVernacular = mediaRecs[0];
    const latestArtifacts = mediaRecs.filter(
      (m) => related(m, 'sourceMedia') === latestVernacular.id
    );
    return [latestVernacular].concat(latestArtifacts);
  }
  const mediaVersion = mediaRecs.filter(
    (m) => !related(m, 'artifactType') && m.attributes.versionNumber === version
  );
  if (mediaVersion.length === 0) return mediaVersion;
  const versionId = mediaVersion[0].id;
  const versionArtifacts = mediaRecs.filter(
    (m) => related(m, 'sourceMedia') === versionId
  );
  return mediaVersion.concat(versionArtifacts);
};

export const getVernacularMediaRec = (passageId: string, memory: Memory) => {
  const mediaRecs = getAllMediaRecs(passageId, memory)
    .filter((m) => related(m, 'artifactType') === VernacularTag)
    .sort((a, b) => b.attributes.versionNumber - a.attributes.versionNumber);
  return mediaRecs.length > 0 ? mediaRecs[0] : null;
};

export const getMediaShared = (passageId: string, memory: Memory) => {
  const mediaRecs = getAllMediaRecs(passageId, memory);
  return mediaRecs.length > 0
    ? mediaRecs[0].attributes.readyToShare
      ? IMediaShare.Latest
      : mediaRecs.findIndex((m) => m.attributes.readyToShare) > 0
      ? IMediaShare.OldVersionOnly
      : IMediaShare.None
    : IMediaShare.None;
};

const getMediaPlanRec = (rec: MediaFile | null, memory: Memory) => {
  let planRec: Plan | undefined = undefined;
  if (rec) {
    const planId = related(rec, 'plan') as string;
    if (planId)
      planRec = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'plan', id: planId })
      ) as Plan;
  }
  return planRec;
};

export const getMediaProjRec = (
  rec: MediaFile | null,
  memory: Memory,
  reporter: any
) => {
  let projRec: Project | undefined = undefined;
  if (rec) {
    const planRec = getMediaPlanRec(rec, memory);
    if (planRec) {
      const projId = related(planRec, 'project');
      if (projId)
        projRec = memory.cache.query((q: QueryBuilder) =>
          q.findRecord({ type: 'project', id: projId })
        ) as Project;
    }
  }
  return projRec;
};

const getMediaLang = (rec: MediaFile | null, memory: Memory, reporter: any) => {
  const projRec = getMediaProjRec(rec, memory, reporter);
  return projRec && projRec.attributes && projRec.attributes.language;
};

export const getMediaName = (
  rec: MediaFile | null,
  memory: Memory,
  reporter: any
) => {
  let passageRec: Passage | undefined = undefined;
  const passageId = related(rec, 'passage');
  if (passageId)
    passageRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'passage', id: passageId })
    ) as Passage;
  const secId = related(passageRec, 'section');
  const secRec = memory.cache.query((q: QueryBuilder) =>
    q.findRecord({ type: 'section', id: secId })
  ) as Section;
  const secAttr = secRec && secRec.attributes;
  const secSeq =
    secAttr && secAttr.sequencenum && secAttr.sequencenum.toString();
  const attr = passageRec && passageRec.attributes;
  const book = attr && attr.book;
  const ref = attr && attr.reference;
  const seq = attr && attr.sequencenum && attr.sequencenum.toString();
  const ver =
    rec &&
    rec.attributes &&
    rec.attributes.versionNumber &&
    rec.attributes.versionNumber.toString();
  const planRec = getMediaPlanRec(rec, memory);
  const planName = planRec && planRec.attributes && planRec.attributes.name;
  let val = planName + '_';
  if (book && book !== '') val = val + book + '_';
  val = val + secSeq + '-' + seq + '_' + ref + 'v' + ver;
  return cleanFileName(val);
};

export const getMediaEaf = (
  mediaRec: MediaFile,
  memory: Memory,
  reporter?: any
): string => {
  let Encoder = require('node-html-encoder').Encoder;
  let encoder = new Encoder('numerical');

  const mediaAttr = mediaRec && mediaRec.attributes;
  const transcription = mediaAttr?.transcription || '';
  const encTranscript = encoder
    .htmlEncode(transcription)
    .replace(/\([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\)/g, '');
  const durationNum = mediaAttr && mediaAttr.duration;
  const duration = durationNum
    ? Math.round(durationNum * 1000).toString()
    : '0';
  const lang = getMediaLang(mediaRec, memory, reporter);
  const mime = (mediaAttr && mediaAttr.contentType) || '';
  const ext = /mpeg/.test(mime)
    ? '.mp3'
    : /m4a/.test(mime)
    ? '.m4a'
    : /ogg/.test(mime)
    ? '.ogg'
    : '.wav';
  const audioUrl = mediaAttr && mediaAttr.audioUrl;
  const audioBase = audioUrl && audioUrl.split('?')[0];
  const audioName = audioBase && audioBase.split('/').pop();
  const filename = audioName
    ? audioName
    : path.basename(
        mediaAttr.originalFile,
        path.extname(mediaAttr.originalFile)
      ) + ext;
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(eaf(), 'text/xml');
  updateXml(
    '@DATE',
    xmlDoc,
    moment().locale('en').format('YYYY-MM-DDTHH:MM:SSZ')
  );
  // updateXml("*[local-name()='ANNOTATION_VALUE']", xmlDoc, encTranscript);
  updateXml('@DEFAULT_LOCALE', xmlDoc, lang ? lang : 'en');
  updateXml('@LANGUAGE_CODE', xmlDoc, lang ? lang : 'en');
  updateXml("*[@TIME_SLOT_ID='ts2']/@TIME_VALUE", xmlDoc, duration);
  updateXml('@MEDIA_FILE', xmlDoc, filename);
  updateXml('@MEDIA_URL', xmlDoc, filename);
  updateXml('@MIME_TYPE', xmlDoc, mime ? mime : 'audio/*');
  const annotationValue = 'ANNOTATION_VALUE';
  const serializer = new XMLSerializer();
  const str = serializer
    .serializeToString(xmlDoc)
    .replace(
      '<' + annotationValue + '/>',
      '<' + annotationValue + '>' + encTranscript + '</' + annotationValue + '>'
    );
  return str;
};

const pad3 = (n: number) => ('00' + n).slice(-3);

interface IExportCommon {
  memory: Memory;
  projRec: Project;
}

interface IExportScripture {
  scripturePackage: boolean;
}

interface IExportFilter {
  artifactType: string | null | undefined;
  target: string;
  orgWorkflowSteps: OrgWorkflowStep[];
}

export interface IExportScripturePath extends IExportCommon, IExportScripture {}
export interface IExportArtifacts extends IExportCommon, IExportFilter {}

export interface IBurritoMeta
  extends IExportCommon,
    IExportScripture,
    IExportFilter {
  userId: string;
}

export const scriptureFullPath = (
  mf: MediaFile,
  { memory, scripturePackage, projRec }: IExportScripturePath
) => {
  let fullPath: string | null = null;
  let book = '';
  let ref = '';
  if (scripturePackage) {
    const mp = dataPath(mf.attributes.audioUrl, PathType.MEDIA);
    const passRec = findRecord(
      memory,
      'passage',
      related(mf, 'passage')
    ) as Passage;
    parseRef(passRec);
    ref = passRec?.attributes?.reference;
    book = passRec.attributes?.book;
    const lang = projRec?.attributes?.language;
    const chap = pad3(passRec?.startChapter || 1);
    const start = pad3(passRec?.startVerse || 1);
    const end = pad3(passRec?.endVerse || passRec?.startVerse || 1);
    const ver = mf.attributes?.versionNumber;
    const { ext } = removeExtension(mp);
    if (passRec) {
      fullPath = `release/audio/${book}/${lang}-${book}-${chap}-${start}-${end}v${ver}.${ext}`;
    }
  }
  return { fullPath, book, ref };
};

export const mediaArtifacts = ({
  memory,
  projRec,
  artifactType,
  target,
  orgWorkflowSteps,
}: IExportArtifacts) => {
  const plans = (related(projRec, 'plans') as Plan[])?.map((p) => p.id);
  const media = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('mediafile')
  ) as MediaFile[];
  let planMedia: MediaFile[] | undefined = undefined;
  if (plans && plans.length > 0) {
    planMedia = getMediaInPlans(
      plans,
      media,
      artifactType,
      artifactType !== undefined // use only latest when artifact set
    );
  }
  const key = new Map<string, string>();
  planMedia?.forEach((m) => {
    const passRec = findRecord(
      memory,
      'passage',
      related(m, 'passage')
    ) as Passage;
    if (
      !Boolean(
        orgWorkflowSteps &&
          afterStep({
            psgCompleted: getStepComplete(passRec),
            target,
            orgWorkflowSteps,
          })
      )
    )
      return;
    const secRec =
      passRec &&
      (findRecord(memory, 'section', related(passRec, 'section')) as Section);
    key.set(
      m.id,
      `${pad3(secRec?.attributes?.sequencenum)}.${pad3(
        passRec?.attributes?.sequencenum
      )}`
    );
  });
  return planMedia
    ?.filter((m) => key.get(m.id))
    .sort((i, j) => ((key.get(i.id) || '') <= (key.get(j.id) || '') ? -1 : 1));
};

export const getBurritoMeta = (props: IBurritoMeta) => {
  const { memory, userId, projRec } = props;
  const userRec = findRecord(memory, 'user', userId) as User;
  const burritoMeta = burritoMetadata({ projRec, userRec });
  const ingredients = mediaArtifacts(props);
  const scopes = burritoMeta.type.flavorType.currentScope;
  const formats = {} as FormatsType;
  ingredients?.forEach((mf) => {
    const { fullPath, book, ref } = scriptureFullPath(mf, props);
    if (book && book.length > 0) {
      if (scopes.hasOwnProperty(book)) {
        scopes[book].push(ref);
      } else {
        scopes[book] = [ref];
      }
    }
    if (fullPath) {
      const { ext } = removeExtension(fullPath);
      if (!formats.hasOwnProperty(ext)) {
        formats[ext] = {
          compression: ext,
        };
      }
      burritoMeta.ingredients[fullPath] = {
        mimeType: mimeMap[ext],
        size: mf.attributes.filesize,
        scope: {
          [book]: [ref],
        },
      };
    }
  });
  let formatn = 1;
  for (let val of Object.values(formats)) {
    burritoMeta.type.flavorType.flavor.formats[`format${formatn}`] = val;
    formatn += 1;
  }
  return JSON.stringify(burritoMeta, null, 2);
};
