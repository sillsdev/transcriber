import { IState } from '../model';
import localStrings from './localize';

export const sharedSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'shared' });
