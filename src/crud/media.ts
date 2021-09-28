import { MediaFile, Plan, Project, Passage, Section } from '../model';
import { QueryBuilder } from '@orbit/data';
import Memory from '@orbit/memory';
import { related } from '.';
import { cleanFileName, updateXml, logError, Severity } from '../utils';
import moment from 'moment';
import eaf from '../utils/transcriptionEaf';
import path from 'path';

export const getMediaRec = (passageId: string, memory: Memory) => {
  const mediaRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('mediafile').filter({
      relation: 'passage',
      record: { type: 'passage', id: passageId },
    })
  ) as MediaFile[];
  return mediaRecs.length > 0
    ? mediaRecs.sort(
        (a, b) => b.attributes.versionNumber - a.attributes.versionNumber
      )[0]
    : null;
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
      const projId = related(planRec, 'project') as string;
      logError(Severity.info, reporter, `getMediaProjRec ${projId}`); //TC138
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
  const projRec = getMediaProjRec(rec, memory, reporter);
  const projName = projRec && projRec.attributes && projRec.attributes.name;
  let val = projName + '_' + planName + '_';
  if (book && book !== '') val = val + book + '_';
  val = val + secSeq + '-' + seq + '_' + ref + 'v' + ver;
  return cleanFileName(val);
};

export const getMediaEaf = (
  mediaRec: MediaFile,
  memory: Memory,
  reporter?: any
): string => {
  logError(Severity.info, reporter, `getMediaEaf`);
  let Encoder = require('node-html-encoder').Encoder;
  let encoder = new Encoder('numerical');

  const mediaAttr = mediaRec && mediaRec.attributes;
  const transcription =
    mediaAttr && mediaAttr.transcription ? mediaAttr.transcription : '';
  logError(Severity.info, reporter, `transcription=${transcription}`);
  const encTranscript = encoder
    .htmlEncode(transcription)
    .replace(/\([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\)/g, '');
  logError(
    Severity.info,
    reporter,
    `encTranscript=${JSON.stringify(encTranscript)}`
  );
  const durationNum = mediaAttr && mediaAttr.duration;
  logError(Severity.info, reporter, `durationNum=${durationNum}`);
  const duration = durationNum
    ? Math.round(durationNum * 1000).toString()
    : '0';
  logError(Severity.info, reporter, `duration=${duration}`);
  const lang = getMediaLang(mediaRec, memory, reporter);
  logError(Severity.info, reporter, `lang=${lang}`);
  const mime = (mediaAttr && mediaAttr.contentType) || '';
  logError(Severity.info, reporter, `mime=${mime}`);
  const ext = /mpeg/.test(mime)
    ? '.mp3'
    : /m4a/.test(mime)
    ? '.m4a'
    : /ogg/.test(mime)
    ? '.ogg'
    : '.wav';
  logError(Severity.info, reporter, `ext=${ext}`);
  const audioUrl = mediaAttr && mediaAttr.audioUrl;
  logError(Severity.info, reporter, `audioUrl=${audioUrl}`);
  const audioBase = audioUrl && audioUrl.split('?')[0];
  logError(Severity.info, reporter, `audioBase=${audioBase}`);
  const audioName = audioBase && audioBase.split('/').pop();
  logError(Severity.info, reporter, `audioName=${audioName}`);
  const filename = audioName
    ? audioName
    : path.basename(
        mediaAttr.originalFile,
        path.extname(mediaAttr.originalFile)
      ) + ext;
  logError(Severity.info, reporter, `filename=${filename}`);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(eaf(), 'text/xml');
  updateXml('@DATE', xmlDoc, moment().format('YYYY-MM-DDTHH:MM:SSZ'));
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
  logError(Severity.info, reporter, `str=${str}`);
  return str;
};
