import { IState } from '../model';
import localStrings from './localize';

export const accessSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'access' });

export const activitySelector = (state: IState) =>
  localStrings(state as IState, { layout: 'activityState' });

export const artifactCategorySelector = (state: IState) =>
  localStrings(state as IState, { layout: 'selectArtifactCategory' });

export const artifactTypeSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'selectArtifactType' });

export const audacityManagerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'audacityManager' });

export const cardsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'cards' });

export const commentCardSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'commentCard' });

export const communitySelector = (state: IState) =>
  localStrings(state as IState, { layout: 'community' });

export const controlSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'control' });

export const discussionCardSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'discussionCard' });

export const discussionListSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'discussionList' });

export const discussionMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'discussionMenu' });

export const emailUnverifiedSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'emailUnverified' });

export const filterMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'filterMenu' });

export const gridSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'grid' });

export const groupSettingsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'groupSettings' });

export const groupTabsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'groupTabs' });

export const mediaActionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'mediaActions' });

export const mediaUploadSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'mediaUpload' });

export const mainSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'main' });

export const passageChooserSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageChooser' });

export const passageDetailArtifactsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailArtifacts' });

export const passageDetailStepCompleteSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailStepComplete' });

export const passageRecordSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageRecord' });

export const peerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'peer' });

export const permissionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'permission' });

export const planSheetSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'planSheet' });

export const planActionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'planActions' });

export const playerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayer' });

export const resourceSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailArtifacts' });

export const selectRecordingSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'selectRecording' });

export const projButtonsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'projButtons' });

export const scriptureTableFilterMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'scriptureTableFilter' });

export const sharedSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'shared' });

export const sortMenuSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'sortMenu' });

export const spellingSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'spelling' });

export const stepEditorSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'stepEditor' });

export const templateSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'template' });

export const teamCheckRefSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'teamCheckReference' });

export const toDoTableSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'toDoTable' });

export const toolSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'tool' });

export const transcribeAddNoteSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'transcribeAddNote' });

export const transcribeRejectSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'transcribeReject' });

export const transcriptionTabSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'transcriptionTab' });

export const treeChartSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'treeChart' });

export const viewModeSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'viewMode' });

export const userListModeSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'userListMode' });

export const welcomeSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'welcome' });

export const wsAudioPlayerSegmentSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayerSegment' });

export const wsAudioPlayerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayer' });
