import {
  User,
  MediaFile,
  MediaFileD,
  Plan,
  PlanD,
  Project,
  ProjectD,
  Passage,
  Section,
  IMediaShare,
  OrgWorkflowStepD,
  PassageD,
} from '../model';
import Memory from '@orbit/memory';
import { related } from './related';
import { VernacularTag } from './useArtifactType';
import { findRecord } from './tryFindRecord';
import { parseRef } from './passage';
import { getMediaInPlans } from './getMediaInPlans';
import { getStepComplete } from './getStepComplete';
import { afterStep } from './getNextStep';
import { cleanFileName } from '../utils/cleanFileName';
import { updateXml } from '../utils/updateXml';
import { burritoMetadata } from '../utils/burritoMetadata';
import { FormatsType } from '../utils/burritoMetadata';
import { removeExtension } from '../utils/removeExtension';
import { mimeMap } from '../utils/loadBlob';
import { dataPath, PathType } from '../utils/dataPath';
import moment from 'moment';
import eaf from '../utils/transcriptionEaf';
import path from 'path-browserify';
import { passageDefaultFilename } from '../utils/passageDefaultFilename';
import { mediaContentType } from '../utils/contentType';

const vernSort = (m: MediaFile) => (!related(m, 'artifactType') ? 0 : 1);

export const getAllMediaRecs = (
  passageId: string,
  memory: Memory,
  artifactTypeId?: string | null,
  version?: number
) => {
  if ((passageId ?? '') === '') {
    return [];
  }
  const mediaRecs = (
    memory?.cache.query((q) =>
      q.findRecords('mediafile').filter({
        relation: 'passage',
        record: { type: 'passage', id: passageId },
      })
    ) as MediaFileD[]
  )
    .filter((m) => m?.attributes?.versionNumber !== undefined)
    .sort((a, b) => vernSort(a) - vernSort(b))
    .sort((a, b) => b.attributes?.versionNumber - a.attributes?.versionNumber);
  if (artifactTypeId !== undefined) {
    const allOfType = mediaRecs.filter(
      (m) => related(m, 'artifactType') === artifactTypeId
    );
    if (version === undefined) return allOfType;
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
  const mediaRecs = getAllMediaRecs(passageId, memory, null);
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
      planRec = memory?.cache.query((q) =>
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
        projRec = memory?.cache.query((q) =>
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
    passageRec = memory?.cache.query((q) =>
      q.findRecord({ type: 'passage', id: passageId })
    ) as Passage;
  const secId = related(passageRec, 'section');
  const secRec = memory?.cache.query((q) =>
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
  const mime = mediaContentType(mediaRec);
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
    moment().locale('en').format('YYYY-MM-DDTHH:mm:ssZ')
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
  projRec: ProjectD;
}

interface IExportScripture {
  scripturePackage: boolean;
}

interface IExportFilter {
  artifactType: string | null | undefined;
  target: string;
  orgWorkflowSteps: OrgWorkflowStepD[];
}

export interface IExportScripturePath extends IExportCommon, IExportScripture {}
export interface IExportArtifacts extends IExportCommon, IExportFilter {}

export interface IBurritoMeta
  extends IExportCommon,
    IExportScripture,
    IExportFilter {
  userId: string;
}

export const scriptureFullPath = async (
  mf: MediaFile,
  { memory, scripturePackage, projRec }: IExportScripturePath
) => {
  let fullPath: string | null = null;
  let book = '';
  let ref = '';
  if (scripturePackage) {
    const mp = await dataPath(mf.attributes.audioUrl, PathType.MEDIA);
    const passRec = findRecord(
      memory,
      'passage',
      related(mf, 'passage')
    ) as Passage;
    parseRef(passRec);
    ref = passRec?.attributes?.reference;
    book = passRec.attributes?.book;
    const lang = projRec?.attributes?.language;
    const chap = pad3(passRec?.attributes?.startChapter || 1);
    const start = pad3(passRec?.attributes?.startVerse || 1);
    const end = pad3(
      passRec?.attributes?.endVerse || passRec?.attributes?.startVerse || 1
    );
    const ver = mf.attributes?.versionNumber;
    const { ext } = removeExtension(mp);
    if (passRec) {
      fullPath = `release/audio/${book}/${lang}-${book}-${chap}-${start}-${end}v${ver}.${ext}`;
    }
  }
  return { fullPath, book, ref };
};
export const mediaFileName = (mf: MediaFile | undefined) =>
  mf?.attributes?.s3file || mf?.attributes?.originalFile || '';

export const nameFromTemplate = (
  mf: MediaFile,
  memory: Memory,
  offline: boolean,
  template: string = ''
) => {
  const passRec = findRecord(
    memory,
    'passage',
    related(mf, 'passage')
  ) as PassageD;
  if (!passRec) return mediaFileName(mf);
  if (template === '') {
    var tmp = passageDefaultFilename(
      passRec,
      '',
      memory,
      undefined,
      offline,
      ''
    );
    const ver = mf.attributes?.versionNumber;
    const { ext } = removeExtension(
      mf.attributes.originalFile ?? mf.attributes.audioUrl
    );
    return `${tmp}_v${ver}.${ext}`;
  } else {
    //not implemented yet
    return 'Not Implemented Yet';
  }
};
export const mediaArtifacts = ({
  memory,
  projRec,
  artifactType,
  target,
  orgWorkflowSteps,
}: IExportArtifacts) => {
  const plans = (related(projRec, 'plans') as PlanD[])?.map((p) => p.id);
  const media = memory?.cache.query((q) =>
    q.findRecords('mediafile')
  ) as MediaFileD[];
  let planMedia: MediaFileD[] | undefined = undefined;
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

export const getBurritoMeta = async (props: IBurritoMeta) => {
  const { memory, userId, projRec } = props;
  const userRec = findRecord(memory, 'user', userId) as User;
  const burritoMeta = burritoMetadata({ projRec, userRec });
  const ingredients = mediaArtifacts(props);
  const scopes = burritoMeta?.type.flavorType.currentScope;
  const formats = {} as FormatsType;
  if (ingredients) {
    for (const mf of ingredients) {
      const { fullPath, book, ref } = await scriptureFullPath(mf, props);
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
    }
  }
  let formatn = 1;
  for (let val of Object.values(formats)) {
    burritoMeta.type.flavorType.flavor.formats[`format${formatn}`] = val;
    formatn += 1;
  }
  return JSON.stringify(burritoMeta, null, 2);
};
