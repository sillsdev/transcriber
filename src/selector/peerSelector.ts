import { IState } from '../model';
import localStrings from './localize';

export const peerSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'peer' });
