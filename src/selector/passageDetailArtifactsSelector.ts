import { IState } from '../model';
import localStrings from './localize';

export const passageDetailArtifactsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailArtifacts' });
