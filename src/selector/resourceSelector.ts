import { IState } from '../model';
import localStrings from './localize';

export const resourceSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageDetailArtifacts' });
