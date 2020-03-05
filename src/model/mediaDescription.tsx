import { Plan, Section, Passage } from '.';

export interface MediaDescription {
  plan: Plan;
  section: Section;
  passage: Passage;
  mediaRemoteId: string;
  mediaId: string;
  duration: number;
  state: string;
  role: string;
}
