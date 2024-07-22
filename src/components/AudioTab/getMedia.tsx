import { MediaFile, Passage, Section, BookName } from '../../model';
import { mediaFileName, related } from '../../crud';
import { IRow } from '.';
import { GetReference } from './GetReference';
import { getSection } from './getSection';
import { formatTime } from '../../control/Duration';

export interface IGetMedia {
  planName: string;
  passages: Passage[];
  sections: Section[];
  playItem: string;
  allBookData: BookName[];
  sectionMap: Map<number, string>;
  isPassageDate: boolean;
}

export const mediaRow = (f: MediaFile, data: IGetMedia) => {
  const { planName, passages, sections, playItem, allBookData, sectionMap } =
    data;

  const showId = related(f, 'passage');
  const passage = showId ? passages.filter((p) => p.id === showId) : [];
  const sectionId = related(passage[0], 'section');
  const section = sections.filter((s) => s.id === sectionId);
  var updateddt =
    showId && data.isPassageDate
      ? passage[0]?.attributes?.dateUpdated || ''
      : f?.attributes?.dateCreated || '';

  return {
    planid: related(f, 'plan'),
    passId: showId,
    planName,
    id: f.id,
    playIcon: playItem,
    fileName: mediaFileName(f),
    sectionId: sectionId,
    sectionDesc: getSection(section, sectionMap),
    reference: (
      <GetReference passage={passage} bookData={allBookData} flat={false} />
    ),
    duration: formatTime(f.attributes.duration),
    size: Math.round((f.attributes.filesize / 1024 / 1024) * 10) / 10.0,
    version: f.attributes.versionNumber
      ? f.attributes.versionNumber.toString()
      : '',
    date: updateddt,
    readyToShare: f.attributes.readyToShare,
    user: related(f, 'recordedbyUser'),
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
