import { IState } from '../model';
import localStrings from './localize';

export const activitySelector = (state: IState) =>
  localStrings(state as IState, { layout: 'activityState' });

export const discussionCardSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'discussionCard' });

export const groupSettingsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'groupSettings' });

export const groupTabsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'groupTabs' });

export const mediaActionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'mediaActions' });

export const passageChooserSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageChooser' });

export const passageDetailArtifactsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailArtifacts' });

export const peerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'peer' });

export const permissionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'permission' });

export const planSheetSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'planSheet' });

export const playerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayer' });

export const resourceSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailArtifacts' });

export const sharedSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'shared' });

export const toolSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'tool' });

export const transcriptiontabSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'transcriptionTab' });

export const wsAudioPlayerSegmentSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayerSegment' });

export const wsAudioPlayerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayer' });
