import { MediaFile, Passage, Section, BookName } from '../../model';
import { related } from '../../crud';
import { IRow, getSection, getReference } from '.';
import moment from 'moment';

export interface IGetMedia {
  planName: string;
  passages: Passage[];
  sections: Section[];
  playItem: string;
  allBookData: BookName[];
  locale: string;
  isPassageDate: boolean;
}

export const mediaRow = (f: MediaFile, data: IGetMedia) => {
  const { planName, passages, sections, playItem, allBookData, locale } = data;

  const showId = related(f, 'passage');
  const passage = showId ? passages.filter((p) => p.id === showId) : [];
  const sectionId = related(passage[0], 'section');
  const section = sections.filter((s) => s.id === sectionId);
  var updateddt =
    showId && data.isPassageDate
      ? passage[0]?.attributes?.dateUpdated || ''
      : f?.attributes?.dateUpdated || '';
  if (!updateddt.endsWith('Z')) updateddt += 'Z';
  const updated = moment(updateddt);
  const date = updated ? updated.format('YYYY-MM-DD') : '';
  const displayDate = updated ? updated.locale(locale).format('L') : '';
  const displayTime = updated ? updated.locale(locale).format('LT') : '';
  const today = moment().format('YYYY-MM-DD');

  return {
    planid: related(f, 'plan'),
    passId: showId,
    planName,
    id: f.id,
    playIcon: playItem,
    fileName: f.attributes.originalFile,
    sectionId: sectionId,
    sectionDesc: getSection(section),
    reference: getReference(passage, allBookData),
    duration: f.attributes.duration ? f.attributes.duration.toString() : '',
    size: f.attributes.filesize,
    version: f.attributes.versionNumber
      ? f.attributes.versionNumber.toString()
      : '',
    date: date === today ? displayTime : displayDate,
  } as IRow;
};

export const getMedia = (media: MediaFile[], data: IGetMedia) => {
  let rowData: IRow[] = [];

  let index = 0;
  media.forEach((f) => {
    rowData.push({ ...mediaRow(f, data), index });
    index += 1;
  });

  return rowData;
};
