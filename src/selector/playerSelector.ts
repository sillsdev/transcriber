import { IState } from '../model';
import localStrings from './localize';

export const playerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'wsAudioPlayer' });
