import { IState } from '../model';
import localStrings from './localize';

export const activitySelector = (state: IState) =>
  localStrings(state as IState, { layout: 'activityState' });
