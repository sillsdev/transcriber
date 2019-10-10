import { Section, Passage } from '.';

export interface MediaDescription {
  section: Section;
  passage: Passage;
  mediaRemoteId: string;
  mediaId: string;
  duration: number;
  state: string;
}
