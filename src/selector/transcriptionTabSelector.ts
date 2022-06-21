import { IState } from '../model';
import localStrings from './localize';

export const transcriptiontabSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'transcriptionTab' });
