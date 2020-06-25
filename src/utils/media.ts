import { MediaFile, Plan, Project, Passage, Section } from '../model';
import { QueryBuilder } from '@orbit/data';
import Memory from '@orbit/memory';
import { related, cleanFileName, updateXml } from '.';
import moment from 'moment';
import eaf from './TranscriptionEaf';
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

export const getMediaPlanRec = (rec: MediaFile | null, memory: Memory) => {
  let planRec: Plan | undefined = undefined;
  if (rec) {
    const planId = related(rec, 'plan') as string;
    planRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'plan', id: planId })
    ) as Plan;
  }
  return planRec;
};

export const getMediaProjRec = (rec: MediaFile | null, memory: Memory) => {
  let projRec: Project | undefined = undefined;
  if (rec) {
    const planRec = getMediaPlanRec(rec, memory);
    const projId = related(planRec, 'project') as string;
    projRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'project', id: projId })
    ) as Project;
  }
  return projRec;
};

export const getMediaLang = (rec: MediaFile | null, memory: Memory) => {
  const projRec = getMediaProjRec(rec, memory);
  return projRec && projRec.attributes && projRec.attributes.language;
};

export const getMediaName = (rec: MediaFile | null, memory: Memory) => {
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
  const projRec = getMediaProjRec(rec, memory);
  const projName = projRec && projRec.attributes && projRec.attributes.name;
  let val = projName + '_' + planName + '_';
  if (book && book !== '') val = val + book + '_';
  val = val + secSeq + '-' + seq + '_' + ref + 'v' + ver;
  return cleanFileName(val);
};

export const getMediaEaf = (mediaRec: MediaFile, memory: Memory): string => {
  let Encoder = require('node-html-encoder').Encoder;
  let encoder = new Encoder('numerical');

  const mediaAttr = mediaRec && mediaRec.attributes;
  const transcription =
    mediaAttr && mediaAttr.transcription ? mediaAttr.transcription : '';
  const encTranscript = encoder
    .htmlEncode(transcription)
    .replace(/\([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\)/g, '');
  const durationNum = mediaAttr && mediaAttr.duration;
  const duration = durationNum ? (durationNum * 1000).toString() : '0';
  const lang = getMediaLang(mediaRec, memory);
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
  return str;
};
