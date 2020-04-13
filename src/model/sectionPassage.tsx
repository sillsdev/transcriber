import { Record } from '@orbit/data';

export interface SectionPassage extends Record {
  attributes: {
    data: string;
    planId: number;
    uuid: string;
  };
}
export default SectionPassage;
