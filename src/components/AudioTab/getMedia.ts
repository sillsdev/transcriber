import { MediaFile, Passage, Section, BookName } from '../../model';
import { related } from '../../crud';
import { IRow, getSection, getReference } from '.';

export interface IGetMedia {
  planName: string;
  passages: Passage[];
  sections: Section[];
  playItem: string;
  allBookData: BookName[];
  isPassageDate: boolean;
}

export const mediaRow = (f: MediaFile, data: IGetMedia) => {
  const { planName, passages, sections, playItem, allBookData } = data;

  const showId = related(f, 'passage');
  const passage = showId ? passages.filter((p) => p.id === showId) : [];
  const sectionId = related(passage[0], 'section');
  const section = sections.filter((s) => s.id === sectionId);
  var updateddt =
    showId && data.isPassageDate
      ? passage[0]?.attributes?.dateUpdated || ''
      : f?.attributes?.dateUpdated || '';

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
    size: Math.round((f.attributes.filesize / 1024 / 1024) * 10) / 10.0,
    version: f.attributes.versionNumber
      ? f.attributes.versionNumber.toString()
      : '',
    date: updateddt,
    readyToShare: f.attributes.readyToShare,
  } as IRow;
};

export const getMedia = (media: MediaFile[], data: IGetMedia) => {
  let rowData = new Array<IRow>();

  let index = 0;
  media.forEach((f) => {
    rowData.push({ ...mediaRow(f, data), index });
    index += 1;
  });

  return rowData;
};
