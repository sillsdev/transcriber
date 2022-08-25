import { IState } from '../model';
import localStrings from './localize';

export const activitySelector = (state: IState) =>
  localStrings(state as IState, { layout: 'activityState' });

export const cardsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'cards' });

export const discussionCardSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'discussionCard' });

export const discussionMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'discussionMenu' });

export const filterMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'filterMenu' });

export const groupSettingsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'groupSettings' });

export const groupTabsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'groupTabs' });

export const mediaActionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'mediaActions' });

export const mainSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'main' });

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

export const projButtonsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'projButtons' });

export const sharedSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'shared' });

export const sortMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'sortMenu' });

export const toDoTableSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'toDoTable' });

export const toolSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'tool' });

export const transcriptiontabSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'transcriptionTab' });

export const wsAudioPlayerSegmentSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayerSegment' });

export const wsAudioPlayerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayer' });
