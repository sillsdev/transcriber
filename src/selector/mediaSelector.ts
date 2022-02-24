import { IState } from '../model';
import localStrings from './localize';

export const mediaActionsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'mediaActions' });
