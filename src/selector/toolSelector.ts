import { IState } from '../model';
import localStrings from './localize';

export const toolSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'tool' });
