import MediaActions from './MediaActions';

export interface IRow {
  index: number;
  planid: string;
  passId: string;
  id: string;
  planName: string;
  playIcon: string;
  fileName: string;
  sectionId: string;
  sectionDesc: string;
  reference: string;
  duration: string;
  size: number;
  version: string;
  date: string;
  readyToShare: boolean;
  actions: typeof MediaActions;
}
